import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';

export interface FetchedFile {
  path: string;
  content: string;
  // Sha is captured for V3.5 incremental scans (skip blobs that haven't changed).
  sha: string;
}

export interface RepoFetchResult {
  ref: string;
  commitSha: string;
  files: FetchedFile[];
  truncated: boolean;
  /** Files seen in tree but skipped due to size / dir filter. */
  skipped: number;
}

const SCANNABLE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
]);

const SKIP_DIR_PREFIXES = [
  'node_modules/',
  'dist/',
  'build/',
  '.next/',
  'coverage/',
  '.turbo/',
  'out/',
  'storybook-static/',
  '.cache/',
  '.vercel/',
  'public/',
  '__snapshots__/',
];

const SKIP_DIR_SEGMENTS = ['/node_modules/', '/dist/', '/build/', '/.next/'];

const MAX_FILE_BYTES = 1_024 * 1024; // 1 MB per file
const MAX_FILES = 500; // bound the total scan budget per repo

@Injectable()
export class RepoContentService {
  private readonly logger = new Logger(RepoContentService.name);

  /**
   * Fetch a repo's TypeScript/JavaScript source as a flat list of
   * `FetchedFile` objects. Walks the recursive tree once, then fetches
   * blobs for every matching path.
   *
   * The scan is intentionally conservative: skip the usual generated
   * directories, cap file size at 1MB, and stop after 500 files. Real
   * production codebases that exceed this will surface in V3.5 with a
   * smarter scoping strategy.
   */
  async fetchRepoTypescript(
    octokit: Octokit,
    owner: string,
    repo: string,
    branch: string,
  ): Promise<RepoFetchResult> {
    // Resolve the branch to a commit SHA so the tree fetch is stable
    // across the rest of the function (no race against a concurrent
    // push).
    const branchInfo = await octokit.rest.repos.getBranch({
      owner,
      repo,
      branch,
    });
    const commitSha = branchInfo.data.commit.sha;

    const tree = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: commitSha,
      recursive: 'true',
    });

    const truncated = Boolean(tree.data.truncated);
    if (truncated) {
      this.logger.warn(
        `Tree for ${owner}/${repo}@${branch} is truncated — V3.1 scan will miss files`,
      );
    }

    const candidates = tree.data.tree
      .filter((node) => node.type === 'blob' && this.shouldScan(node.path ?? ''))
      .filter((node) => (node.size ?? 0) <= MAX_FILE_BYTES);

    const skipped = tree.data.tree.length - candidates.length;
    const limited = candidates.slice(0, MAX_FILES);

    const files: FetchedFile[] = [];
    for (const node of limited) {
      if (!node.sha || !node.path) continue;
      try {
        const blob = await octokit.rest.git.getBlob({
          owner,
          repo,
          file_sha: node.sha,
        });
        const content =
          blob.data.encoding === 'base64'
            ? Buffer.from(blob.data.content, 'base64').toString('utf8')
            : blob.data.content;
        files.push({ path: node.path, content, sha: node.sha });
      } catch (err) {
        this.logger.warn(
          `Skipping ${owner}/${repo}:${node.path} — ${(err as Error).message}`,
        );
      }
    }

    return {
      ref: branch,
      commitSha,
      files,
      truncated,
      skipped: skipped + Math.max(0, candidates.length - limited.length),
    };
  }

  private shouldScan(path: string): boolean {
    if (!path) return false;
    for (const prefix of SKIP_DIR_PREFIXES) {
      if (path.startsWith(prefix)) return false;
    }
    for (const segment of SKIP_DIR_SEGMENTS) {
      if (path.includes(segment)) return false;
    }
    if (path.endsWith('.d.ts')) return false; // type-only declaration files
    if (path.endsWith('.min.js')) return false;

    const dotIdx = path.lastIndexOf('.');
    if (dotIdx === -1) return false;
    const ext = path.slice(dotIdx);
    return SCANNABLE_EXTENSIONS.has(ext);
  }
}

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GithubService } from '../github/github.service';
import { RepoContentService } from './repo-content.service';
import { TsScannerService, CatalogMapping, ScanResult } from './ts-scanner.service';

export interface ScanSummary {
  repoId: string;
  fullName: string;
  commitSha: string;
  filesScanned: number;
  filesSkipped: number;
  truncated: boolean;
  usagesFound: number;
  catalogEntriesMatched: string[];
  durationMs: number;
}

@Injectable()
export class ScannerService {
  private readonly logger = new Logger(ScannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly github: GithubService,
    private readonly content: RepoContentService,
    private readonly tsScanner: TsScannerService,
  ) {}

  /**
   * Scan a connected repo for catalog usage and replace its RepoUsage
   * rows. Caller authorizes — pass a teamId so we can check the repo
   * actually belongs to the team's installation.
   */
  async scanRepoForTeam(teamId: string, githubRepoRowId: string): Promise<ScanSummary> {
    const start = Date.now();
    const repo = await this.prisma.githubRepo.findUnique({
      where: { id: githubRepoRowId },
      include: { installation: true },
    });
    if (!repo) throw new NotFoundException('Repo not found');
    if (repo.installation.teamId !== teamId) {
      throw new NotFoundException('Repo not found'); // don't leak existence
    }
    if (repo.removedAt) {
      throw new BadRequestException('Repo was removed from the installation');
    }
    if (repo.installation.suspendedAt) {
      throw new BadRequestException('Installation is suspended');
    }

    const [owner, name] = repo.fullName.split('/');
    if (!owner || !name) {
      throw new BadRequestException(`Invalid repo full name: ${repo.fullName}`);
    }

    const mappings = await this.loadCatalogMappings();
    if (mappings.length === 0) {
      // Nothing to match against — short-circuit so we don't burn API
      // calls on a repo we can't classify.
      await this.persistResult(repo.id, repo.fullName, '', [], 0, 0, false);
      return {
        repoId: repo.id,
        fullName: repo.fullName,
        commitSha: '',
        filesScanned: 0,
        filesSkipped: 0,
        truncated: false,
        usagesFound: 0,
        catalogEntriesMatched: [],
        durationMs: Date.now() - start,
      };
    }

    let summary: ScanSummary;
    try {
      const octokit = await this.github.octokitForInstallation(
        repo.installation.installationId,
      );
      const fetched = await this.content.fetchRepoTypescript(
        octokit,
        owner,
        name,
        repo.defaultBranch,
      );
      const results = this.tsScanner.scan(
        fetched.files.map((f) => ({ path: f.path, content: f.content })),
        mappings,
      );
      const filtered = results.filter((r) => r.catalogSlug !== '__openapi__');

      await this.persistResult(
        repo.id,
        repo.fullName,
        fetched.commitSha,
        filtered,
        fetched.files.length,
        fetched.skipped,
        fetched.truncated,
      );

      summary = {
        repoId: repo.id,
        fullName: repo.fullName,
        commitSha: fetched.commitSha,
        filesScanned: fetched.files.length,
        filesSkipped: fetched.skipped,
        truncated: fetched.truncated,
        usagesFound: filtered.length,
        catalogEntriesMatched: Array.from(
          new Set(filtered.map((r) => r.catalogSlug)),
        ).sort(),
        durationMs: Date.now() - start,
      };
      this.logger.log(
        `scan ${repo.fullName}: ${summary.filesScanned} files / ${summary.usagesFound} usages / ${summary.catalogEntriesMatched.length} entries in ${summary.durationMs}ms`,
      );
    } catch (err) {
      const message = (err as Error).message ?? String(err);
      await this.prisma.githubRepo.update({
        where: { id: repo.id },
        data: { lastScanError: message, lastScannedAt: new Date() },
      });
      this.logger.error(`scan ${repo.fullName} failed: ${message}`);
      throw err;
    }

    return summary;
  }

  // ── Read API for the dashboard ─────────────────────────────

  async listUsageForRepo(teamId: string, githubRepoRowId: string) {
    const repo = await this.prisma.githubRepo.findUnique({
      where: { id: githubRepoRowId },
      include: { installation: true },
    });
    if (!repo || repo.installation.teamId !== teamId) {
      throw new NotFoundException('Repo not found');
    }

    const usages = await this.prisma.repoUsage.findMany({
      where: { githubRepoId: repo.id },
      orderBy: [{ catalogSlug: 'asc' }, { kind: 'asc' }, { filePath: 'asc' }],
    });

    // Group by catalogSlug for the UI; keep up to 20 sample sites per slug
    const grouped = new Map<
      string,
      {
        catalogSlug: string;
        count: number;
        samples: { kind: string; surface: string; filePath: string; line: number }[];
      }
    >();
    for (const u of usages) {
      const entry = grouped.get(u.catalogSlug) ?? {
        catalogSlug: u.catalogSlug,
        count: 0,
        samples: [],
      };
      entry.count += 1;
      if (entry.samples.length < 20) {
        entry.samples.push({
          kind: u.kind,
          surface: u.surface,
          filePath: u.filePath,
          line: u.line,
        });
      }
      grouped.set(u.catalogSlug, entry);
    }

    return {
      repo: {
        id: repo.id,
        fullName: repo.fullName,
        defaultBranch: repo.defaultBranch,
        lastScannedAt: repo.lastScannedAt,
        lastScanError: repo.lastScanError,
      },
      usagesByEntry: Array.from(grouped.values()).sort((a, b) => b.count - a.count),
    };
  }

  // ── Internals ──────────────────────────────────────────────

  private async loadCatalogMappings(): Promise<CatalogMapping[]> {
    const entries = await this.prisma.catalogEntry.findMany({
      where: {
        OR: [
          { npmPackages: { isEmpty: false } },
          { urlHostnames: { isEmpty: false } },
        ],
      },
      select: { slug: true, npmPackages: true, urlHostnames: true },
    });
    return entries.map((e) => ({
      slug: e.slug,
      npmPackages: e.npmPackages,
      urlHostnames: e.urlHostnames,
    }));
  }

  /**
   * Replace-style persistence: drop all prior rows for this repo, write
   * the new ones, update `GithubRepo.lastScannedAt`. Wrapped in a
   * transaction so the dashboard never sees a half-empty state.
   */
  private async persistResult(
    githubRepoRowId: string,
    fullName: string,
    commitSha: string,
    results: ScanResult[],
    filesScanned: number,
    filesSkipped: number,
    truncated: boolean,
  ) {
    // Dedupe — the scanner may emit the same (slug, kind, surface, file, line)
    // tuple if a node matches multiple passes. Cheap to do here.
    const seen = new Set<string>();
    const dedup = results.filter((r) => {
      const key = `${r.catalogSlug}|${r.kind}|${r.surface}|${r.filePath}|${r.line}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.repoUsage.deleteMany({ where: { githubRepoId: githubRepoRowId } });
      if (dedup.length > 0) {
        await tx.repoUsage.createMany({
          data: dedup.map((r) => ({
            githubRepoId: githubRepoRowId,
            catalogSlug: r.catalogSlug,
            kind: r.kind,
            surface: r.surface,
            filePath: r.filePath,
            line: r.line,
          })),
        });
      }
      await tx.githubRepo.update({
        where: { id: githubRepoRowId },
        data: {
          lastScannedAt: new Date(),
          lastScannedSha: commitSha || null,
          lastScanError: null,
        },
      });
    });
    this.logger.debug(
      `persisted ${dedup.length} usages for ${fullName} (${filesScanned} files, ${filesSkipped} skipped, truncated=${truncated})`,
    );
  }
}

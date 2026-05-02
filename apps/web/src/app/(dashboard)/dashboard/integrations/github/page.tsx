'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Github,
  Loader2,
  ExternalLink,
  GitBranch,
  Lock,
  ScanLine,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

interface GithubRepo {
  id: string;
  repoId: number;
  fullName: string;
  defaultBranch: string;
  private: boolean;
  removedAt: string | null;
  lastScannedAt: string | null;
  lastScanError: string | null;
}

interface GithubInstallation {
  id: string;
  installationId: number;
  accountType: 'User' | 'Organization';
  accountLogin: string;
  suspendedAt: string | null;
  repos: GithubRepo[];
}

interface ScanSummary {
  repoId: string;
  fullName: string;
  filesScanned: number;
  usagesFound: number;
  catalogEntriesMatched: string[];
  durationMs: number;
}

interface UsageGroup {
  catalogSlug: string;
  count: number;
  samples: { kind: string; surface: string; filePath: string; line: number }[];
}

interface UsageResponse {
  repo: {
    id: string;
    fullName: string;
    defaultBranch: string;
    lastScannedAt: string | null;
    lastScanError: string | null;
  };
  usagesByEntry: UsageGroup[];
}

const APP_SLUG = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? '';
const INSTALL_URL = APP_SLUG
  ? `https://github.com/apps/${APP_SLUG}/installations/new`
  : null;

function GithubIntegrationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [installations, setInstallations] = useState<GithubInstallation[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<GithubInstallation[]>('/github/installations');
      setInstallations(data);
    } catch (err) {
      toast.error(`Failed to load GitHub installations: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const installationId = searchParams.get('installation_id');
    const setupAction = searchParams.get('setup_action');
    if (!installationId || claiming) return;

    setClaiming(true);
    apiFetch<{ ok: boolean; repoCount: number }>('/github/installations/claim', {
      method: 'POST',
      body: JSON.stringify({
        installationId: Number(installationId),
        setupAction: setupAction ?? 'install',
      }),
    })
      .then((res) => {
        toast.success(`Connected ${res.repoCount} repo${res.repoCount === 1 ? '' : 's'}`);
        router.replace('/dashboard/integrations/github');
        return load();
      })
      .catch((err: Error) => {
        toast.error(`Failed to connect installation: ${err.message}`);
      })
      .finally(() => setClaiming(false));
  }, [searchParams, claiming, router, load]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">GitHub Integration</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Connect repos so APIDelta can match changelog entries against the API
          surfaces your code actually uses. Required for Urgent alerts and
          auto-opened issues.
        </p>
      </div>

      {!INSTALL_URL && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <strong>App not configured.</strong> Set{' '}
          <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_GITHUB_APP_SLUG</code>{' '}
          and the server-side <code className="rounded bg-black/30 px-1">GITHUB_APP_*</code>{' '}
          vars before installing.
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      ) : installations.length === 0 ? (
        <EmptyState installUrl={INSTALL_URL} />
      ) : (
        <div className="space-y-4">
          {installations.map((inst) => (
            <InstallationCard
              key={inst.id}
              installation={inst}
              onRescanned={load}
            />
          ))}
          {INSTALL_URL && (
            <a
              href={INSTALL_URL}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              <Github className="size-4" />
              Add another installation
              <ExternalLink className="size-3.5 text-zinc-500" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ installUrl }: { installUrl: string | null }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-8 text-center">
      <Github className="mx-auto size-10 text-zinc-500" />
      <h2 className="mt-4 text-lg font-medium">No GitHub installations yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
        Install the APIDelta GitHub App on the user or org that owns the repos
        you want to monitor. You pick which repos at install-time.
      </p>
      {installUrl ? (
        <a
          href={installUrl}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-100"
        >
          <Github className="size-4" />
          Install on GitHub
          <ExternalLink className="size-3.5" />
        </a>
      ) : null}
    </div>
  );
}

function InstallationCard({
  installation,
  onRescanned,
}: {
  installation: GithubInstallation;
  onRescanned: () => Promise<void>;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Github className="size-4 text-zinc-400" />
            <span className="font-medium">{installation.accountLogin}</span>
            <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
              {installation.accountType}
            </span>
            {installation.suspendedAt && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                Suspended
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Installation ID {installation.installationId}
          </p>
        </div>
        <a
          href={`https://github.com/settings/installations/${installation.installationId}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-zinc-400 hover:text-zinc-200"
        >
          Manage on GitHub <ExternalLink className="ml-0.5 inline size-3" />
        </a>
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          {installation.repos.length} repo{installation.repos.length === 1 ? '' : 's'} authorized
        </p>
        <ul className="mt-2 divide-y divide-zinc-900">
          {installation.repos.map((repo) => (
            <RepoRow key={repo.id} repo={repo} onRescanned={onRescanned} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function RepoRow({
  repo,
  onRescanned,
}: {
  repo: GithubRepo;
  onRescanned: () => Promise<void>;
}) {
  const [scanning, setScanning] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  const loadUsage = useCallback(async () => {
    setUsageLoading(true);
    try {
      const data = await apiFetch<UsageResponse>(`/github/repos/${repo.id}/usage`);
      setUsage(data);
    } catch (err) {
      toast.error(`Failed to load usage: ${(err as Error).message}`);
    } finally {
      setUsageLoading(false);
    }
  }, [repo.id]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const summary = await apiFetch<ScanSummary>(`/github/repos/${repo.id}/scan`, {
        method: 'POST',
      });
      toast.success(
        `${repo.fullName}: ${summary.usagesFound} usage${summary.usagesFound === 1 ? '' : 's'} across ${summary.catalogEntriesMatched.length} APIs (${summary.filesScanned} files, ${(summary.durationMs / 1000).toFixed(1)}s)`,
      );
      await onRescanned();
      if (expanded) await loadUsage();
    } catch (err) {
      toast.error(`Scan failed: ${(err as Error).message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleToggle = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !usage) await loadUsage();
  };

  return (
    <li className="py-2">
      <div className="flex items-center justify-between text-sm">
        <button
          onClick={handleToggle}
          className="flex items-center gap-2 text-left hover:text-white"
        >
          <GitBranch className="size-3.5 text-zinc-500" />
          <span className="text-zinc-200">{repo.fullName}</span>
          {repo.private && <Lock className="size-3 text-zinc-500" />}
          <span className="text-xs text-zinc-500">@ {repo.defaultBranch}</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            {repo.lastScannedAt
              ? `Scanned ${new Date(repo.lastScannedAt).toLocaleDateString()}`
              : 'Never scanned'}
          </span>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            {scanning ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <ScanLine className="size-3" />
            )}
            {scanning ? 'Scanning…' : 'Scan now'}
          </button>
        </div>
      </div>

      {repo.lastScanError && (
        <div className="mt-2 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>Last scan failed: {repo.lastScanError}</span>
        </div>
      )}

      {expanded && (
        <div className="mt-3 rounded-md border border-zinc-900 bg-black/30 p-3 text-xs">
          {usageLoading ? (
            <div className="flex items-center gap-2 text-zinc-400">
              <Loader2 className="size-3 animate-spin" />
              Loading usage…
            </div>
          ) : !usage || usage.usagesByEntry.length === 0 ? (
            <p className="text-zinc-500">
              No catalog usage detected yet. Run a scan to populate.
            </p>
          ) : (
            <ul className="space-y-3">
              {usage.usagesByEntry.map((g) => (
                <li key={g.catalogSlug}>
                  <div className="flex items-center justify-between text-zinc-200">
                    <span className="font-mono">{g.catalogSlug}</span>
                    <span className="text-zinc-500">
                      {g.count} usage{g.count === 1 ? '' : 's'}
                    </span>
                  </div>
                  <ul className="mt-1 space-y-0.5 pl-3 font-mono text-zinc-500">
                    {g.samples.slice(0, 5).map((s, i) => (
                      <li key={i}>
                        <span className="text-zinc-400">[{s.kind}]</span>{' '}
                        <span className="text-zinc-200">{s.surface}</span>{' '}
                        <span>
                          → {s.filePath}:{s.line}
                        </span>
                      </li>
                    ))}
                    {g.samples.length > 5 && (
                      <li className="text-zinc-600">
                        …{g.samples.length - 5} more sample{g.samples.length - 5 === 1 ? '' : 's'}
                      </li>
                    )}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

export default function GithubIntegrationsPage() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-sm text-zinc-400">Loading…</div>}>
      <GithubIntegrationsContent />
    </Suspense>
  );
}

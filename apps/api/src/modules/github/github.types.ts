// Subset of GitHub webhook payload shapes we read in V3.0. We only
// model the fields we actually use — the full schema is enormous and
// we'd rather lean on Octokit types when we need more depth later.

export interface GithubWebhookAccount {
  id: number;
  login: string;
  type: 'User' | 'Organization';
}

export interface GithubWebhookRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch?: string;
}

export interface GithubInstallationWebhook {
  action:
    | 'created'
    | 'deleted'
    | 'suspend'
    | 'unsuspend'
    | 'new_permissions_accepted';
  installation: {
    id: number;
    account: GithubWebhookAccount;
    repository_selection: 'all' | 'selected';
    suspended_at?: string | null;
  };
  repositories?: GithubWebhookRepo[];
  sender: GithubWebhookAccount;
}

export interface GithubInstallationRepositoriesWebhook {
  action: 'added' | 'removed';
  installation: {
    id: number;
    account: GithubWebhookAccount;
  };
  repositories_added?: GithubWebhookRepo[];
  repositories_removed?: GithubWebhookRepo[];
  sender: GithubWebhookAccount;
}

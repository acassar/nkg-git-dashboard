// Sous-ensemble des réponses de l'API GitLab v4 que le dashboard consomme.
// Réf: https://docs.gitlab.com/ee/api/branches.html
//      https://docs.gitlab.com/ee/api/merge_requests.html

export interface GitLabCommit {
  id: string
  short_id: string
  title: string
  author_name: string
  authored_date: string
  committed_date: string
  web_url: string
}

export interface GitLabBranch {
  name: string
  merged: boolean
  protected: boolean
  default: boolean
  web_url: string
  commit: GitLabCommit
}

export interface GitLabProject {
  id: number
  name: string
  path_with_namespace: string
  web_url: string
  default_branch: string | null
}

export type MergeRequestState = 'opened' | 'closed' | 'locked' | 'merged'

// Statut détaillé du merge (GitLab 15+). Non exhaustif — on garde le string.
export type DetailedMergeStatus =
  | 'mergeable'
  | 'not_open'
  | 'draft_status'
  | 'broken_status'
  | 'blocked_status'
  | 'ci_still_running'
  | 'ci_must_pass'
  | 'conflict'
  | 'discussions_not_resolved'
  | 'need_rebase'
  | (string & {})

export interface GitLabMergeRequest {
  id: number
  iid: number
  project_id: number
  title: string
  state: MergeRequestState
  draft: boolean
  work_in_progress: boolean
  has_conflicts: boolean
  merge_status: string
  detailed_merge_status?: DetailedMergeStatus
  source_branch: string
  target_branch: string
  web_url: string
  created_at: string
  updated_at: string
  author: {
    name: string
    username: string
    avatar_url: string | null
  }
  references?: { short: string }
}

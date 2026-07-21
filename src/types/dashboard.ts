import type { GitLabBranch, GitLabMergeRequest, GitLabProject } from './gitlab'

// Catégorie de santé d'une branche, dérivée de l'activité récente.
export type BranchHealth = 'active' | 'dormant' | 'stale' | 'merging'

export interface AnalyzedBranch {
  project: GitLabProject
  branch: GitLabBranch
  health: BranchHealth
  /** Jours écoulés depuis le dernier commit. */
  daysSinceCommit: number
  lastCommitDate: Date
  lastAuthor: string
  isDefault: boolean
  isProtected: boolean
  /** MR ouverte dont cette branche est la source, si elle existe. */
  mergeRequest: AnalyzedMergeRequest | null
}

export interface AnalyzedMergeRequest {
  mr: GitLabMergeRequest
  project: GitLabProject
  /** Jours depuis la dernière mise à jour de la MR. */
  daysSinceUpdate: number
  /** Vrai si la MR n'a pas bougé depuis longtemps → risque de blocage. */
  isInactive: boolean
  /** Libellé lisible du statut de merge (conflits, CI, draft, prête...). */
  statusLabel: string
  statusHealth: 'good' | 'warning' | 'serious' | 'critical'
}

export interface DashboardKpis {
  totalBranches: number
  active: number
  dormant: number
  stale: number
  merging: number
  openMergeRequests: number
  inactiveMergeRequests: number
  conflictingMergeRequests: number
}

export interface AnalysisThresholds {
  /** En dessous : branche "active". */
  activeDays: number
  /** Au dessus : branche "morte". */
  staleDays: number
  /** MR sans update depuis X jours → inactive. */
  mrInactiveDays: number
}

export interface DashboardData {
  branches: AnalyzedBranch[]
  mergeRequests: AnalyzedMergeRequest[]
  projects: GitLabProject[]
  kpis: DashboardKpis
  fetchedAt: Date
}

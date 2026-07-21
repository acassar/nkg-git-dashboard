import type {
  GitLabBranch,
  GitLabMergeRequest,
  GitLabProject,
  DetailedMergeStatus,
} from '@/types/gitlab'
import type {
  AnalyzedBranch,
  AnalyzedMergeRequest,
  AnalysisThresholds,
  BranchHealth,
  DashboardData,
  DashboardKpis,
} from '@/types/dashboard'
import { daysSince } from './date'

export const DEFAULT_THRESHOLDS: AnalysisThresholds = {
  activeDays: 14,
  staleDays: 60,
  mrInactiveDays: 14,
}

/** Traduit le detailed_merge_status GitLab en libellé + niveau de santé. */
function describeMergeStatus(mr: GitLabMergeRequest): {
  label: string
  health: AnalyzedMergeRequest['statusHealth']
} {
  if (mr.draft || mr.work_in_progress) {
    return { label: 'Brouillon', health: 'warning' }
  }
  if (mr.has_conflicts) {
    return { label: 'Conflits', health: 'critical' }
  }

  const status = (mr.detailed_merge_status ?? mr.merge_status) as DetailedMergeStatus
  const map: Record<string, { label: string; health: AnalyzedMergeRequest['statusHealth'] }> = {
    mergeable: { label: 'Prête à merger', health: 'good' },
    can_be_merged: { label: 'Prête à merger', health: 'good' },
    conflict: { label: 'Conflits', health: 'critical' },
    cannot_be_merged: { label: 'Conflits', health: 'critical' },
    broken_status: { label: 'Merge cassé', health: 'critical' },
    ci_still_running: { label: 'CI en cours', health: 'warning' },
    ci_must_pass: { label: 'CI à valider', health: 'serious' },
    discussions_not_resolved: { label: 'Discussions ouvertes', health: 'serious' },
    need_rebase: { label: 'Rebase nécessaire', health: 'serious' },
    blocked_status: { label: 'Bloquée', health: 'serious' },
    draft_status: { label: 'Brouillon', health: 'warning' },
  }
  return map[status] ?? { label: 'En cours', health: 'warning' }
}

export function analyzeMergeRequest(
  mr: GitLabMergeRequest,
  project: GitLabProject,
  thresholds: AnalysisThresholds,
  now: Date,
): AnalyzedMergeRequest {
  const daysSinceUpdate = daysSince(mr.updated_at, now)
  const { label, health } = describeMergeStatus(mr)
  return {
    mr,
    project,
    daysSinceUpdate,
    isInactive: daysSinceUpdate >= thresholds.mrInactiveDays,
    statusLabel: label,
    statusHealth: health,
  }
}

function classifyBranch(
  daysSinceCommit: number,
  hasOpenMr: boolean,
  thresholds: AnalysisThresholds,
): BranchHealth {
  if (hasOpenMr) return 'merging'
  if (daysSinceCommit <= thresholds.activeDays) return 'active'
  if (daysSinceCommit >= thresholds.staleDays) return 'stale'
  return 'dormant'
}

export function analyzeBranch(
  branch: GitLabBranch,
  project: GitLabProject,
  mergeRequest: AnalyzedMergeRequest | null,
  thresholds: AnalysisThresholds,
  now: Date,
): AnalyzedBranch {
  const lastCommitDate = new Date(branch.commit.committed_date)
  const daysSinceCommit = daysSince(lastCommitDate, now)
  const health = classifyBranch(daysSinceCommit, mergeRequest !== null, thresholds)

  return {
    project,
    branch,
    health,
    daysSinceCommit,
    lastCommitDate,
    lastAuthor: branch.commit.author_name,
    isDefault: branch.default,
    isProtected: branch.protected,
    mergeRequest,
  }
}

interface RawProjectData {
  project: GitLabProject
  branches: GitLabBranch[]
  mergeRequests: GitLabMergeRequest[]
}

/**
 * Agrège les données brutes de plusieurs projets en un jeu de données
 * analysé + les KPI du dashboard.
 */
export function buildDashboardData(
  raw: RawProjectData[],
  thresholds: AnalysisThresholds = DEFAULT_THRESHOLDS,
  now: Date = new Date(),
): DashboardData {
  const branches: AnalyzedBranch[] = []
  const mergeRequests: AnalyzedMergeRequest[] = []
  const projects: GitLabProject[] = []

  for (const { project, branches: rawBranches, mergeRequests: rawMrs } of raw) {
    projects.push(project)

    // Index des MR ouvertes par branche source pour rattacher aux branches.
    const analyzedMrs = rawMrs
      .filter((mr) => mr.state === 'opened')
      .map((mr) => analyzeMergeRequest(mr, project, thresholds, now))
    mergeRequests.push(...analyzedMrs)

    const mrBySourceBranch = new Map<string, AnalyzedMergeRequest>()
    for (const amr of analyzedMrs) {
      // Si plusieurs MR partagent une source, on garde la plus récente.
      const existing = mrBySourceBranch.get(amr.mr.source_branch)
      if (!existing || amr.daysSinceUpdate < existing.daysSinceUpdate) {
        mrBySourceBranch.set(amr.mr.source_branch, amr)
      }
    }

    for (const branch of rawBranches) {
      const mr = mrBySourceBranch.get(branch.name) ?? null
      branches.push(analyzeBranch(branch, project, mr, thresholds, now))
    }
  }

  const kpis = computeKpis(branches, mergeRequests)
  return { branches, mergeRequests, projects, kpis, fetchedAt: now }
}

function computeKpis(
  branches: AnalyzedBranch[],
  mergeRequests: AnalyzedMergeRequest[],
): DashboardKpis {
  return {
    totalBranches: branches.length,
    active: branches.filter((b) => b.health === 'active').length,
    dormant: branches.filter((b) => b.health === 'dormant').length,
    stale: branches.filter((b) => b.health === 'stale').length,
    merging: branches.filter((b) => b.health === 'merging').length,
    openMergeRequests: mergeRequests.length,
    inactiveMergeRequests: mergeRequests.filter((m) => m.isInactive).length,
    conflictingMergeRequests: mergeRequests.filter((m) => m.mr.has_conflicts).length,
  }
}

// Métadonnées d'affichage par catégorie de santé (labels FR, ordre, sens).
export const HEALTH_META: Record<
  BranchHealth,
  { label: string; description: string; tone: 'good' | 'warning' | 'critical' | 'info' }
> = {
  active: {
    label: 'Actives',
    description: 'Commit récent',
    tone: 'good',
  },
  merging: {
    label: 'En merge',
    description: 'MR ouverte',
    tone: 'info',
  },
  dormant: {
    label: 'En sommeil',
    description: 'Activité ralentie',
    tone: 'warning',
  },
  stale: {
    label: 'Mortes',
    description: 'Aucune activité',
    tone: 'critical',
  },
}

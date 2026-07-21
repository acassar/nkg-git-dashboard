import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { GitLabApiError, GitLabClient } from '@/services/gitlabApi'
import { buildDashboardData } from '@/utils/branchAnalysis'
import type { GitLabBranch, GitLabMergeRequest, GitLabProject } from '@/types/gitlab'
import type { DashboardData } from '@/types/dashboard'
import { useConfigStore } from './config'

export const useDashboardStore = defineStore('dashboard', () => {
  const config = useConfigStore()

  const data = ref<DashboardData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loadingLabel = ref('')

  const hasData = computed(() => data.value !== null)

  async function resolveProjects(client: GitLabClient): Promise<GitLabProject[]> {
    const byId = new Map<number, GitLabProject>()

    for (const groupRef of config.groups) {
      loadingLabel.value = `Résolution du groupe ${groupRef}…`
      const projects = await client.getGroupProjects(groupRef)
      for (const p of projects) byId.set(p.id, p)
    }

    for (const projectRef of config.projects) {
      loadingLabel.value = `Résolution du projet ${projectRef}…`
      const project = await client.getProject(projectRef)
      byId.set(project.id, project)
    }

    return [...byId.values()]
  }

  async function refresh() {
    if (!config.isConfigured) {
      error.value = 'Configuration incomplète : URL, token et au moins une cible requis.'
      return
    }

    loading.value = true
    error.value = null
    loadingLabel.value = 'Connexion à GitLab…'

    try {
      const client = new GitLabClient({ url: config.url, token: config.token })
      const projects = await resolveProjects(client)

      if (projects.length === 0) {
        error.value = 'Aucun projet trouvé pour les cibles configurées.'
        return
      }

      // On récupère branches + MR de chaque projet en parallèle (par lots).
      const raw: {
        project: GitLabProject
        branches: GitLabBranch[]
        mergeRequests: GitLabMergeRequest[]
      }[] = []

      let done = 0
      const tasks = projects.map(async (project) => {
        const [branches, mergeRequests] = await Promise.all([
          client.getBranches(project.id),
          client.getOpenMergeRequests(project.id),
        ])
        raw.push({ project, branches, mergeRequests })
        done++
        loadingLabel.value = `Analyse des projets… (${done}/${projects.length})`
      })
      await Promise.all(tasks)

      data.value = buildDashboardData(raw, config.thresholds)
    } catch (err) {
      error.value =
        err instanceof GitLabApiError
          ? err.message
          : 'Erreur inattendue pendant le chargement des données.'
    } finally {
      loading.value = false
      loadingLabel.value = ''
    }
  }

  return {
    data,
    loading,
    loadingLabel,
    error,
    hasData,
    refresh,
  }
})

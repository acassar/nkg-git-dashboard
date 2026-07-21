import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { AnalysisThresholds } from '@/types/dashboard'
import { DEFAULT_THRESHOLDS } from '@/utils/branchAnalysis'

const STORAGE_KEY = 'nkg-dashboard-config'

interface PersistedConfig {
  url: string
  token: string
  groups: string[]
  projects: string[]
  thresholds: AnalysisThresholds
}

function splitEnvList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function loadInitial(): PersistedConfig {
  const fromEnv: PersistedConfig = {
    url: import.meta.env.VITE_GITLAB_URL ?? '',
    token: import.meta.env.VITE_GITLAB_TOKEN ?? '',
    groups: splitEnvList(import.meta.env.VITE_GITLAB_GROUPS),
    projects: splitEnvList(import.meta.env.VITE_GITLAB_PROJECTS),
    thresholds: { ...DEFAULT_THRESHOLDS },
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<PersistedConfig>
      return {
        url: parsed.url || fromEnv.url,
        token: parsed.token || fromEnv.token,
        groups: parsed.groups?.length ? parsed.groups : fromEnv.groups,
        projects: parsed.projects?.length ? parsed.projects : fromEnv.projects,
        thresholds: { ...DEFAULT_THRESHOLDS, ...parsed.thresholds },
      }
    }
  } catch {
    // localStorage corrompu ou indisponible → on repart de l'env.
  }
  return fromEnv
}

export const useConfigStore = defineStore('config', () => {
  const initial = loadInitial()

  const url = ref(initial.url)
  const token = ref(initial.token)
  const groups = ref<string[]>(initial.groups)
  const projects = ref<string[]>(initial.projects)
  const thresholds = ref<AnalysisThresholds>(initial.thresholds)

  const isConfigured = computed(
    () => url.value.trim() !== '' && token.value.trim() !== '' && hasTargets.value,
  )
  const hasTargets = computed(() => groups.value.length > 0 || projects.value.length > 0)

  function persist() {
    const payload: PersistedConfig = {
      url: url.value,
      token: token.value,
      groups: groups.value,
      projects: projects.value,
      thresholds: thresholds.value,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Ignore : mode navigation privée / quota.
    }
  }

  // Persiste automatiquement à chaque changement.
  watch([url, token, groups, projects, thresholds], persist, { deep: true })

  function reset() {
    localStorage.removeItem(STORAGE_KEY)
    url.value = ''
    token.value = ''
    groups.value = []
    projects.value = []
    thresholds.value = { ...DEFAULT_THRESHOLDS }
  }

  return {
    url,
    token,
    groups,
    projects,
    thresholds,
    isConfigured,
    hasTargets,
    reset,
  }
})

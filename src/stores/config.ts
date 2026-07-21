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

// Valeurs lues dans le fichier `.env` (variables VITE_GITLAB_*).
const ENV = {
  url: (import.meta.env.VITE_GITLAB_URL ?? '').trim(),
  token: (import.meta.env.VITE_GITLAB_TOKEN ?? '').trim(),
  groups: splitEnvList(import.meta.env.VITE_GITLAB_GROUPS),
  projects: splitEnvList(import.meta.env.VITE_GITLAB_PROJECTS),
}

// Quels champs sont fournis (et donc verrouillés) par le `.env` ?
const ENV_LOCK = {
  url: ENV.url !== '',
  token: ENV.token !== '',
  groups: ENV.groups.length > 0,
  projects: ENV.projects.length > 0,
}

/**
 * Priorité : `.env` d'abord (config manuelle), puis `localStorage` (saisie via
 * l'UI) pour les champs non définis dans l'env. Ainsi éditer le fichier `.env`
 * est toujours pris en compte au rechargement.
 */
function loadInitial(): PersistedConfig {
  let stored: Partial<PersistedConfig> = {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) stored = JSON.parse(raw) as Partial<PersistedConfig>
  } catch {
    // localStorage corrompu ou indisponible → on ignore.
  }

  return {
    url: ENV_LOCK.url ? ENV.url : (stored.url ?? ''),
    token: ENV_LOCK.token ? ENV.token : (stored.token ?? ''),
    groups: ENV_LOCK.groups ? ENV.groups : (stored.groups ?? []),
    projects: ENV_LOCK.projects ? ENV.projects : (stored.projects ?? []),
    // Les seuils ne sont pas dans l'env : localStorage sinon valeurs par défaut.
    thresholds: { ...DEFAULT_THRESHOLDS, ...stored.thresholds },
  }
}

export const useConfigStore = defineStore('config', () => {
  const initial = loadInitial()

  const url = ref(initial.url)
  const token = ref(initial.token)
  const groups = ref<string[]>(initial.groups)
  const projects = ref<string[]>(initial.projects)
  const thresholds = ref<AnalysisThresholds>(initial.thresholds)

  // Exposé à l'UI pour signaler/verrouiller les champs pilotés par `.env`.
  const envLock = ENV_LOCK
  const configuredViaEnv = computed(
    () => ENV_LOCK.url && ENV_LOCK.token && (ENV_LOCK.groups || ENV_LOCK.projects),
  )

  const hasTargets = computed(() => groups.value.length > 0 || projects.value.length > 0)
  const isConfigured = computed(
    () => url.value.trim() !== '' && token.value.trim() !== '' && hasTargets.value,
  )

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
    // On retombe sur l'env s'il est présent, sinon vide.
    url.value = ENV.url
    token.value = ENV.token
    groups.value = [...ENV.groups]
    projects.value = [...ENV.projects]
    thresholds.value = { ...DEFAULT_THRESHOLDS }
  }

  return {
    url,
    token,
    groups,
    projects,
    thresholds,
    envLock,
    configuredViaEnv,
    isConfigured,
    hasTargets,
    reset,
  }
})

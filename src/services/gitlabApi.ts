import axios, { AxiosError, type AxiosInstance } from 'axios'
import type { GitLabBranch, GitLabMergeRequest, GitLabProject } from '@/types/gitlab'

export interface GitLabConfig {
  url: string
  token: string
}

export class GitLabApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'GitLabApiError'
  }
}

// En dev, on passe par le proxy Vite (`/gitlab-api`) pour éviter le CORS.
// En prod, on tape directement l'URL configurée (nécessite un reverse-proxy
// ou une conf CORS côté GitLab — voir README).
function resolveBaseUrl(config: GitLabConfig): string {
  if (import.meta.env.DEV && import.meta.env.VITE_GITLAB_URL) {
    return '/gitlab-api/api/v4'
  }
  return `${config.url.replace(/\/+$/, '')}/api/v4`
}

export class GitLabClient {
  private http: AxiosInstance

  constructor(config: GitLabConfig) {
    this.http = axios.create({
      baseURL: resolveBaseUrl(config),
      headers: { 'PRIVATE-TOKEN': config.token },
      timeout: 20000,
    })
  }

  /** Récupère toutes les pages d'un endpoint paginé (header x-next-page). */
  private async paginate<T>(path: string, params: Record<string, unknown> = {}): Promise<T[]> {
    const results: T[] = []
    let page = 1
    // Garde-fou : 50 pages * 100 = 5000 éléments max par ressource.
    for (let i = 0; i < 50; i++) {
      const { data, headers } = await this.request<T[]>(path, {
        ...params,
        per_page: 100,
        page,
      })
      results.push(...data)
      const next = headers['x-next-page']
      if (!next) break
      page = Number(next)
    }
    return results
  }

  private async request<T>(path: string, params: Record<string, unknown> = {}) {
    try {
      return await this.http.get<T>(path, { params })
    } catch (err) {
      throw this.toApiError(err)
    }
  }

  private toApiError(err: unknown): GitLabApiError {
    if (err instanceof AxiosError) {
      const status = err.response?.status
      if (status === 401) {
        return new GitLabApiError('Token invalide ou expiré (401).', status)
      }
      if (status === 403) {
        return new GitLabApiError('Accès refusé — le token manque du scope read_api (403).', status)
      }
      if (status === 404) {
        return new GitLabApiError('Ressource introuvable (404). Vérifie le chemin/ID.', status)
      }
      if (err.code === 'ERR_NETWORK') {
        return new GitLabApiError(
          'Impossible de joindre GitLab (réseau/CORS). Voir le README pour la configuration.',
        )
      }
      return new GitLabApiError(err.message, status)
    }
    return new GitLabApiError('Erreur inconnue lors de l’appel à GitLab.')
  }

  /** Vérifie l'authentification en récupérant l'utilisateur courant. */
  async testConnection(): Promise<{ name: string; username: string }> {
    const { data } = await this.request<{ name: string; username: string }>('/user')
    return data
  }

  /** Résout un groupe (chemin ou ID) en liste de projets, sous-groupes inclus. */
  async getGroupProjects(groupRef: string): Promise<GitLabProject[]> {
    const id = encodeURIComponent(groupRef)
    return this.paginate<GitLabProject>(`/groups/${id}/projects`, {
      include_subgroups: true,
      with_shared: false,
      archived: false,
      order_by: 'last_activity_at',
    })
  }

  /** Récupère un projet unique (chemin ou ID). */
  async getProject(projectRef: string): Promise<GitLabProject> {
    const id = encodeURIComponent(projectRef)
    const { data } = await this.request<GitLabProject>(`/projects/${id}`)
    return data
  }

  async getBranches(projectId: number): Promise<GitLabBranch[]> {
    return this.paginate<GitLabBranch>(`/projects/${projectId}/repository/branches`)
  }

  async getOpenMergeRequests(projectId: number): Promise<GitLabMergeRequest[]> {
    return this.paginate<GitLabMergeRequest>(`/projects/${projectId}/merge_requests`, {
      state: 'opened',
      order_by: 'updated_at',
    })
  }
}

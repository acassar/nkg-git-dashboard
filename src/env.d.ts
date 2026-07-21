/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITLAB_URL?: string
  readonly VITE_GITLAB_TOKEN?: string
  readonly VITE_GITLAB_GROUPS?: string
  readonly VITE_GITLAB_PROJECTS?: string
  readonly VITE_GITLAB_INSECURE_TLS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

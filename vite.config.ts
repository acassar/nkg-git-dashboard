import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // Proxy de développement : évite les problèmes de CORS en dev.
      // Le front appelle `/gitlab-api/...` et Vite relaie vers le GitLab
      // configuré dans VITE_GITLAB_URL. Voir README pour la prod.
      proxy: env.VITE_GITLAB_URL
        ? {
            '/gitlab-api': {
              target: env.VITE_GITLAB_URL,
              changeOrigin: true,
              secure: env.VITE_GITLAB_INSECURE_TLS !== 'true',
              rewrite: (path) => path.replace(/^\/gitlab-api/, ''),
            },
          }
        : undefined,
    },
  }
})

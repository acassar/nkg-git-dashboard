<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useConfigStore } from '@/stores/config'
import { useDashboardStore } from '@/stores/dashboard'
import SettingsPanel from '@/components/SettingsPanel.vue'
import DashboardView from '@/components/DashboardView.vue'

const config = useConfigStore()
const dashboard = useDashboardStore()

const showSettings = ref(false)
const theme = ref<'light' | 'dark' | 'auto'>(
  (localStorage.getItem('nkg-theme') as 'light' | 'dark' | 'auto') ?? 'auto',
)

function applyTheme() {
  const root = document.documentElement
  if (theme.value === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme.value)
  localStorage.setItem('nkg-theme', theme.value)
}

function cycleTheme() {
  theme.value = theme.value === 'auto' ? 'light' : theme.value === 'light' ? 'dark' : 'auto'
  applyTheme()
}

function onConfigSaved() {
  dashboard.refresh()
}

onMounted(() => {
  applyTheme()
  if (config.isConfigured) dashboard.refresh()
  else showSettings.value = true
})
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <span class="brand__logo" aria-hidden="true">🚦</span>
        <div>
          <h1>NKG Git Dashboard</h1>
          <p>Santé des branches & merge requests de l'équipe</p>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn--ghost" :title="`Thème : ${theme}`" @click="cycleTheme">
          <span v-if="theme === 'auto'">🌗</span>
          <span v-else-if="theme === 'light'">☀️</span>
          <span v-else>🌙</span>
        </button>
        <button
          class="btn btn--ghost"
          :disabled="dashboard.loading || !config.isConfigured"
          @click="dashboard.refresh()"
        >
          <span :class="{ spin: dashboard.loading }" aria-hidden="true">⟳</span>
          Rafraîchir
        </button>
        <button class="btn btn--primary" @click="showSettings = true">Réglages</button>
      </div>
    </header>

    <main class="content">
      <!-- Bandeau d'erreur -->
      <div v-if="dashboard.error" class="banner banner--error">
        <span>⚠ {{ dashboard.error }}</span>
        <button class="btn btn--ghost" @click="showSettings = true">Vérifier les réglages</button>
      </div>

      <!-- Chargement -->
      <div v-if="dashboard.loading" class="state">
        <div class="spinner" aria-hidden="true"></div>
        <p>{{ dashboard.loadingLabel || 'Chargement…' }}</p>
      </div>

      <!-- Non configuré -->
      <div v-else-if="!config.isConfigured && !dashboard.hasData" class="state">
        <div class="state__emoji">🔌</div>
        <h2>Connecte ton GitLab pour commencer</h2>
        <p>Renseigne l'URL de ton instance, un access token et les groupes à suivre.</p>
        <button class="btn btn--primary" @click="showSettings = true">Configurer</button>
      </div>

      <!-- Dashboard -->
      <DashboardView v-else-if="dashboard.hasData" />
    </main>

    <SettingsPanel
      v-if="showSettings"
      @close="showSettings = false"
      @saved="onConfigSaved"
    />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 24px;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand__logo {
  font-size: 1.8rem;
  line-height: 1;
}
.brand h1 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
}
.brand p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--ink-muted);
}
.actions {
  display: flex;
  gap: 10px;
}
.content {
  flex: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--ink);
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn--primary {
  background: var(--info);
  color: #fff;
}
.btn--primary:hover {
  filter: brightness(1.06);
}
.btn--ghost {
  background: var(--surface);
  border-color: var(--border-strong);
}
.btn--ghost:hover:not(:disabled) {
  background: var(--surface-2);
}
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.banner--error {
  background: var(--critical-soft);
  color: var(--critical-ink);
  border: 1px solid var(--critical);
}
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
  padding: 80px 20px;
  color: var(--ink-2);
}
.state h2 {
  margin: 0;
}
.state p {
  margin: 0;
  color: var(--ink-muted);
  max-width: 420px;
}
.state__emoji {
  font-size: 3rem;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-strong);
  border-top-color: var(--info);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spin {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 640px) {
  .brand p {
    display: none;
  }
  .content {
    padding: 16px;
  }
}
</style>

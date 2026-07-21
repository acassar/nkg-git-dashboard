<script setup lang="ts">
import { computed, ref } from 'vue'
import { useConfigStore } from '@/stores/config'
import { GitLabClient, GitLabApiError } from '@/services/gitlabApi'

const emit = defineEmits<{ close: []; saved: [] }>()
const config = useConfigStore()

const anyEnvLock = computed(() => Object.values(config.envLock).some(Boolean))

// Copies locales éditées puis appliquées au store à l'enregistrement.
const url = ref(config.url)
const token = ref(config.token)
const groupsText = ref(config.groups.join('\n'))
const projectsText = ref(config.projects.join('\n'))
const activeDays = ref(config.thresholds.activeDays)
const staleDays = ref(config.thresholds.staleDays)
const mrInactiveDays = ref(config.thresholds.mrInactiveDays)

const testState = ref<'idle' | 'testing' | 'ok' | 'error'>('idle')
const testMessage = ref('')

function parseList(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

async function testConnection() {
  testState.value = 'testing'
  testMessage.value = ''
  try {
    const client = new GitLabClient({ url: url.value, token: token.value })
    const user = await client.testConnection()
    testState.value = 'ok'
    testMessage.value = `Connecté en tant que ${user.name} (@${user.username})`
  } catch (err) {
    testState.value = 'error'
    testMessage.value = err instanceof GitLabApiError ? err.message : 'Échec de la connexion.'
  }
}

function save() {
  config.url = url.value.trim()
  config.token = token.value.trim()
  config.groups = parseList(groupsText.value)
  config.projects = parseList(projectsText.value)
  config.thresholds = {
    activeDays: Number(activeDays.value),
    staleDays: Number(staleDays.value),
    mrInactiveDays: Number(mrInactiveDays.value),
  }
  emit('saved')
  emit('close')
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <header class="modal__head">
        <h2 id="settings-title">Réglages GitLab</h2>
        <button class="icon-btn" aria-label="Fermer" @click="emit('close')">✕</button>
      </header>

      <div class="modal__body">
        <p v-if="anyEnvLock" class="env-note">
          🔒 Certaines valeurs proviennent du fichier <code>.env</code> et sont
          prioritaires (verrouillées ici). Modifie-les dans le fichier, puis recharge.
        </p>

        <label class="field">
          <span class="field__label">
            URL de l'instance GitLab
            <span v-if="config.envLock.url" class="lock">.env</span>
          </span>
          <input
            v-model="url"
            type="url"
            placeholder="https://gitlab.mon-entreprise.com"
            :disabled="config.envLock.url"
          />
        </label>

        <label class="field">
          <span class="field__label">
            Access Token
            <span v-if="config.envLock.token" class="lock">.env</span>
            <span v-else class="hint">scope <code>read_api</code></span>
          </span>
          <input
            v-model="token"
            type="password"
            placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
            :disabled="config.envLock.token"
          />
        </label>

        <div class="row">
          <label class="field">
            <span class="field__label">
              Groupes à monitorer
              <span v-if="config.envLock.groups" class="lock">.env</span>
            </span>
            <textarea
              v-model="groupsText"
              rows="3"
              placeholder="mon-groupe&#10;mon-groupe/sous-groupe"
              :disabled="config.envLock.groups"
            ></textarea>
            <span class="hint">Un par ligne — chemin ou ID. Sous-groupes inclus.</span>
          </label>
          <label class="field">
            <span class="field__label">
              Projets additionnels
              <span v-if="config.envLock.projects" class="lock">.env</span>
            </span>
            <textarea
              v-model="projectsText"
              rows="3"
              placeholder="mon-groupe/mon-projet"
              :disabled="config.envLock.projects"
            ></textarea>
            <span class="hint">Un par ligne — chemin ou ID.</span>
          </label>
        </div>

        <fieldset class="thresholds">
          <legend>Seuils d'analyse</legend>
          <label class="field field--inline">
            <span class="field__label">Active si commit ≤ (jours)</span>
            <input v-model.number="activeDays" type="number" min="1" />
          </label>
          <label class="field field--inline">
            <span class="field__label">Morte si commit ≥ (jours)</span>
            <input v-model.number="staleDays" type="number" min="1" />
          </label>
          <label class="field field--inline">
            <span class="field__label">MR inactive si ≥ (jours)</span>
            <input v-model.number="mrInactiveDays" type="number" min="1" />
          </label>
        </fieldset>

        <div class="test">
          <button class="btn btn--ghost" :disabled="testState === 'testing'" @click="testConnection">
            {{ testState === 'testing' ? 'Test en cours…' : 'Tester la connexion' }}
          </button>
          <span
            v-if="testMessage"
            class="test__msg"
            :class="testState === 'ok' ? 'ok' : 'err'"
          >
            {{ testMessage }}
          </span>
        </div>
      </div>

      <footer class="modal__foot">
        <button class="btn btn--ghost" @click="emit('close')">Annuler</button>
        <button class="btn btn--primary" @click="save">Enregistrer & charger</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(11, 11, 11, 0.45);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px;
  z-index: 50;
  overflow-y: auto;
}
.modal {
  width: 100%;
  max-width: 620px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
}
.modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}
.modal__head h2 {
  margin: 0;
  font-size: 1.2rem;
}
.icon-btn {
  border: none;
  background: transparent;
  color: var(--ink-muted);
  font-size: 1rem;
  padding: 6px 8px;
  border-radius: 8px;
}
.icon-btn:hover {
  background: var(--surface-2);
  color: var(--ink);
}
.modal__body {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.field__label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink-2);
}
.hint {
  font-weight: 400;
  color: var(--ink-muted);
  font-size: 0.76rem;
}
.lock {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: 6px;
  background: var(--info-soft);
  color: var(--info-ink);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: none;
}
.lock::before {
  content: '🔒 ';
}
.env-note {
  margin: 0;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: var(--info-soft);
  color: var(--info-ink);
  font-size: 0.82rem;
  line-height: 1.45;
}
.field input:disabled,
.field textarea:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.field input,
.field textarea {
  padding: 9px 12px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--ink);
  font: inherit;
  font-size: 0.9rem;
  resize: vertical;
}
.field input:focus,
.field textarea:focus {
  outline: 2px solid var(--info);
  outline-offset: 1px;
}
.row {
  display: flex;
  gap: 14px;
}
.thresholds {
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
.thresholds legend {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink-2);
  padding: 0 6px;
}
.field--inline {
  min-width: 140px;
}
.field--inline input {
  width: 100%;
}
.test {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.test__msg {
  font-size: 0.84rem;
  font-weight: 500;
}
.test__msg.ok {
  color: var(--good-ink);
}
.test__msg.err {
  color: var(--critical-ink);
}
.modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 22px;
  border-top: 1px solid var(--border);
}
.btn {
  padding: 9px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-weight: 600;
  font-size: 0.9rem;
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
  color: var(--ink);
}
.btn--ghost:hover {
  background: var(--surface-2);
}
.row {
  flex-wrap: wrap;
}
@media (max-width: 520px) {
  .row {
    flex-direction: column;
  }
}
</style>

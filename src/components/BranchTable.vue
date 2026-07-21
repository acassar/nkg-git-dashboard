<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AnalyzedBranch, BranchHealth } from '@/types/dashboard'
import { HEALTH_META } from '@/utils/branchAnalysis'
import { timeAgo } from '@/utils/date'
import HealthBadge from './HealthBadge.vue'

const props = defineProps<{ branches: AnalyzedBranch[] }>()

type Filter = BranchHealth | 'all'
const filter = ref<Filter>('all')
const search = ref('')

const orderedHealth: BranchHealth[] = ['stale', 'dormant', 'merging', 'active']

const filters = computed(() => {
  const counts: Record<Filter, number> = {
    all: props.branches.length,
    active: 0,
    dormant: 0,
    stale: 0,
    merging: 0,
  }
  for (const b of props.branches) counts[b.health]++
  return [
    { key: 'all' as Filter, label: 'Toutes', tone: 'neutral', count: counts.all },
    ...orderedHealth.map((h) => ({
      key: h as Filter,
      label: HEALTH_META[h].label,
      tone: HEALTH_META[h].tone,
      count: counts[h],
    })),
  ]
})

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  return props.branches
    .filter((b) => filter.value === 'all' || b.health === filter.value)
    .filter(
      (b) =>
        !q ||
        b.branch.name.toLowerCase().includes(q) ||
        b.project.path_with_namespace.toLowerCase().includes(q),
    )
    .sort((a, b) => b.daysSinceCommit - a.daysSinceCommit)
})
</script>

<template>
  <section class="panel">
    <header class="panel__head">
      <h2>Branches</h2>
      <input v-model="search" class="search" type="search" placeholder="Filtrer…" />
    </header>

    <div class="chips">
      <button
        v-for="f in filters"
        :key="f.key"
        class="chip"
        :class="[`tone-${f.tone}`, { active: filter === f.key }]"
        @click="filter = f.key"
      >
        {{ f.label }}
        <span class="chip__count">{{ f.count }}</span>
      </button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Branche</th>
            <th>Projet</th>
            <th>État</th>
            <th>Dernier commit</th>
            <th>Auteur</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in visible" :key="`${b.project.id}-${b.branch.name}`">
            <td>
              <a :href="b.branch.web_url" target="_blank" rel="noopener" class="branch-name">
                {{ b.branch.name }}
              </a>
              <span v-if="b.isDefault" class="tag">default</span>
              <span v-if="b.isProtected" class="tag">protégée</span>
            </td>
            <td class="muted">{{ b.project.path_with_namespace }}</td>
            <td><HealthBadge :health="b.health" /></td>
            <td :class="{ danger: b.daysSinceCommit >= 60 }">{{ timeAgo(b.lastCommitDate) }}</td>
            <td class="muted">{{ b.lastAuthor }}</td>
          </tr>
          <tr v-if="visible.length === 0">
            <td colspan="5" class="empty">Aucune branche ne correspond au filtre.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 12px;
}
.panel__head h2 {
  margin: 0;
  font-size: 1.1rem;
}
.search {
  padding: 7px 12px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--ink);
  font-size: 0.9rem;
  min-width: 160px;
}
.search:focus {
  outline: 2px solid var(--info);
  outline-offset: 1px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 20px 16px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 10px 5px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--ink-2);
  font-size: 0.84rem;
  font-weight: 600;
  transition: all 0.12s ease;
}
.chip:hover {
  border-color: var(--tone, var(--ink-muted));
}
.chip.active {
  background: var(--tone-soft, var(--surface-2));
  color: var(--tone-ink, var(--ink));
  border-color: var(--tone, var(--border-strong));
}
.chip.tone-neutral {
  --tone: var(--ink-muted);
  --tone-soft: var(--surface-2);
  --tone-ink: var(--ink);
}
.chip__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--tone, var(--ink-muted));
  color: #fff;
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}
.table-wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
thead th {
  text-align: left;
  padding: 10px 20px;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-muted);
  border-bottom: 1px solid var(--border-strong);
  white-space: nowrap;
}
tbody td {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
tbody tr:hover {
  background: var(--surface-2);
}
.branch-name {
  font-weight: 600;
  color: var(--ink);
  font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  font-size: 0.86rem;
}
.branch-name:hover {
  color: var(--info-ink);
}
.muted {
  color: var(--ink-muted);
}
.danger {
  color: var(--critical);
  font-weight: 600;
}
.tag {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 5px;
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  font-size: 0.68rem;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.empty {
  text-align: center;
  color: var(--ink-muted);
  padding: 32px 20px;
}
</style>

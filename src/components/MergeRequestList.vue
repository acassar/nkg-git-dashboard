<script setup lang="ts">
import { computed } from 'vue'
import type { AnalyzedMergeRequest } from '@/types/dashboard'
import { timeAgo } from '@/utils/date'

const props = defineProps<{ mergeRequests: AnalyzedMergeRequest[] }>()

// MR à risque d'abord : inactives, puis en conflit, puis par ancienneté.
const sorted = computed(() =>
  [...props.mergeRequests].sort((a, b) => {
    const score = (m: AnalyzedMergeRequest) =>
      (m.isInactive ? 100 : 0) + (m.mr.has_conflicts ? 50 : 0) + m.daysSinceUpdate
    return score(b) - score(a)
  }),
)
</script>

<template>
  <section class="panel">
    <header class="panel__head">
      <h2>Merge Requests ouvertes</h2>
      <span class="count">{{ mergeRequests.length }}</span>
    </header>

    <ul v-if="sorted.length" class="mr-list">
      <li v-for="m in sorted" :key="m.mr.id" class="mr">
        <div class="mr__main">
          <a :href="m.mr.web_url" target="_blank" rel="noopener" class="mr__title">
            {{ m.mr.title }}
          </a>
          <div class="mr__meta">
            <span class="branch">{{ m.mr.source_branch }}</span>
            <span class="arrow">→</span>
            <span class="branch">{{ m.mr.target_branch }}</span>
            <span class="sep">·</span>
            <span>{{ m.project.path_with_namespace }}</span>
          </div>
        </div>
        <div class="mr__side">
          <span class="status" :class="`tone-${m.statusHealth}`">
            <span class="status__dot" aria-hidden="true"></span>
            {{ m.statusLabel }}
          </span>
          <span class="mr__updated" :class="{ warn: m.isInactive }">
            <span v-if="m.isInactive" title="Inactive" aria-hidden="true">⚠ </span>
            maj {{ timeAgo(m.mr.updated_at) }}
          </span>
        </div>
      </li>
    </ul>

    <p v-else class="empty">Aucune merge request ouverte 🎉</p>
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
  gap: 10px;
  padding: 18px 20px 12px;
}
.panel__head h2 {
  margin: 0;
  font-size: 1.1rem;
}
.count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 7px;
  border-radius: 11px;
  background: var(--info-soft);
  color: var(--info-ink);
  font-size: 0.8rem;
  font-weight: 700;
}
.mr-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.mr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
}
.mr:hover {
  background: var(--surface-2);
}
.mr__main {
  min-width: 0;
}
.mr__title {
  font-weight: 600;
  color: var(--ink);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mr__title:hover {
  color: var(--info-ink);
}
.mr__meta {
  margin-top: 3px;
  font-size: 0.8rem;
  color: var(--ink-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.branch {
  font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  font-size: 0.76rem;
  color: var(--ink-2);
}
.arrow {
  color: var(--ink-muted);
}
.sep {
  opacity: 0.5;
}
.mr__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  flex: none;
}
.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 8px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--tone-ink);
  background: var(--tone-soft);
  white-space: nowrap;
}
.status__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--tone);
}
.mr__updated {
  font-size: 0.76rem;
  color: var(--ink-muted);
  white-space: nowrap;
}
.mr__updated.warn {
  color: var(--serious);
  font-weight: 600;
}
.empty {
  padding: 28px 20px;
  text-align: center;
  color: var(--ink-muted);
}
</style>

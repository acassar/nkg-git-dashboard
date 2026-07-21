<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { formatDate } from '@/utils/date'
import StatTile from './StatTile.vue'
import BranchTable from './BranchTable.vue'
import MergeRequestList from './MergeRequestList.vue'

const dashboard = useDashboardStore()
const kpis = computed(() => dashboard.data?.kpis ?? null)
</script>

<template>
  <div v-if="kpis && dashboard.data" class="dashboard">
    <div class="kpis">
      <StatTile
        label="Branches totales"
        :value="kpis.totalBranches"
        :hint="`${dashboard.data.projects.length} projet(s)`"
        tone="info"
      >
        <template #icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" />
            <circle cx="18" cy="8" r="2.5" />
            <path d="M6 8.5v7M8.5 6H14a2 2 0 0 1 2 2v.5M18 10.5c0 4-4 3-6 5.5" />
          </svg>
        </template>
      </StatTile>

      <StatTile label="Actives" :value="kpis.active" hint="Commit récent" tone="good" emphasis>
        <template #icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </template>
      </StatTile>

      <StatTile label="En merge" :value="kpis.merging" hint="MR ouverte" tone="info" emphasis>
        <template #icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="6" cy="18" r="2.5" /><circle cx="6" cy="6" r="2.5" />
            <circle cx="18" cy="12" r="2.5" />
            <path d="M6 8.5v7M8.5 6.5C13 7 12 12 15.5 12" />
          </svg>
        </template>
      </StatTile>

      <StatTile
        label="En sommeil"
        :value="kpis.dormant"
        hint="Activité ralentie"
        tone="warning"
        emphasis
      >
        <template #icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
          </svg>
        </template>
      </StatTile>

      <StatTile
        label="Mortes"
        :value="kpis.stale"
        hint="Aucune activité"
        tone="critical"
        emphasis
      >
        <template #icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /><path d="M10 11v5M14 11v5" />
          </svg>
        </template>
      </StatTile>

      <StatTile
        label="MR à risque"
        :value="kpis.inactiveMergeRequests"
        :hint="`${kpis.conflictingMergeRequests} en conflit`"
        :tone="kpis.inactiveMergeRequests > 0 ? 'serious' : 'good'"
        emphasis
      >
        <template #icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
        </template>
      </StatTile>
    </div>

    <p class="fetched">Données récupérées le {{ formatDate(dashboard.data.fetchedAt) }}</p>

    <div class="grid">
      <BranchTable :branches="dashboard.data.branches" />
      <MergeRequestList :merge-requests="dashboard.data.mergeRequests" />
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}
.fetched {
  margin: 0;
  font-size: 0.8rem;
  color: var(--ink-muted);
}
.grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 18px;
  align-items: start;
}
@media (max-width: 960px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>

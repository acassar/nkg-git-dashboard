<script setup lang="ts">
import { computed } from 'vue'
import type { BranchHealth } from '@/types/dashboard'
import { HEALTH_META } from '@/utils/branchAnalysis'

const props = defineProps<{ health: BranchHealth }>()

const meta = computed(() => HEALTH_META[props.health])
</script>

<template>
  <span class="badge" :class="`tone-${meta.tone}`">
    <span class="badge__dot" aria-hidden="true"></span>
    {{ meta.label }}
  </span>
</template>

<style scoped>
.badge {
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
.badge__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--tone);
}
</style>

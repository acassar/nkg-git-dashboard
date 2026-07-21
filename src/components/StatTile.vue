<script setup lang="ts">
defineProps<{
  label: string
  value: number | string
  hint?: string
  tone?: 'good' | 'warning' | 'critical' | 'serious' | 'info' | 'neutral'
  emphasis?: boolean
}>()
</script>

<template>
  <div class="tile" :class="[tone ? `tone-${tone}` : '', { emphasis }]">
    <div class="tile__accent" aria-hidden="true"></div>
    <div class="tile__body">
      <div class="tile__label">
        <span class="tile__icon" aria-hidden="true"><slot name="icon" /></span>
        <span>{{ label }}</span>
      </div>
      <div class="tile__value">{{ value }}</div>
      <div v-if="hint" class="tile__hint">{{ hint }}</div>
    </div>
  </div>
</template>

<style scoped>
.tile {
  position: relative;
  display: flex;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.tile:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.tile__accent {
  width: 6px;
  flex: none;
  background: var(--tone, var(--ink-muted));
}
.tile__body {
  padding: 18px 20px;
  flex: 1;
  min-width: 0;
}
.tile__label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink-2);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.tile__icon {
  display: inline-flex;
  width: 18px;
  height: 18px;
  color: var(--tone, var(--ink-muted));
}
.tile__icon :deep(svg) {
  width: 100%;
  height: 100%;
}
.tile__value {
  margin-top: 8px;
  font-size: 2.4rem;
  font-weight: 700;
  line-height: 1.05;
  color: var(--ink);
}
.tile.emphasis .tile__value {
  color: var(--tone-ink, var(--ink));
}
.tile__hint {
  margin-top: 4px;
  font-size: 0.82rem;
  color: var(--ink-muted);
}
</style>

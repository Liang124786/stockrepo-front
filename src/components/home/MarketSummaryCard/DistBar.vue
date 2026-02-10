<template>
  <div class="flex items-center gap-3">
    <div class="w-20 text-xs text-cat-calico-brown">{{ label }}</div>

    <div class="flex-1 h-3 rounded bg-cat-calico-cream overflow-hidden">
      <div class="h-3" :class="barClass" :style="{ width: pct + '%' }"></div>
    </div>

    <div class="w-16 text-right text-xs text-cat-tuxedo-dark">{{ count }} ({{ pct }}%)</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  count: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  tone: { type: String, default: 'flat' },
})

const pct = computed(() => {
  if (!props.total) return 0
  return Math.round((props.count / props.total) * 100)
})

const barClass = computed(() => {
  const map = {
    up: 'bg-market-up',
    upLight: 'bg-market-up/70',
    flat: 'bg-market-flat',
    downLight: 'bg-market-down/70',
    down: 'bg-market-down',
  }
  return map[props.tone] || map.flat
})
</script>

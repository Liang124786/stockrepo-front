<template>
  <div class="rounded-lg bg-cat-calico-cream p-3">
    <div class="text-xs text-cat-calico-brown/80">{{ title }}</div>
    <div class="mt-1 font-semibold text-cat-calico-brown">{{ value }}</div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  value: { type: String, default: '' },
})
</script>

<template>
  <div class="rounded-lg bg-[#FFEFD8] p-3">
    <div class="text-xs text-[#8A6D5A]">{{ title }}</div>
    <div class="mt-1 font-semibold text-[#4A2E1F]">{{ value }}</div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  value: { type: String, default: '' },
})
</script>

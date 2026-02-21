<template>
  <el-card class="summary-card">
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-0 gap-1">
        <div class="font-semibold text-white">市場摘要（{{ usedCount }} 檔）</div>
        <div class="text-xs text-white">收盤日：{{ asOfDate || '—' }}</div>
      </div>
    </template>

    <!-- KPI -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-sm text-cat-calico-brown"
    >
      <KpiCard title="上漲 / 下跌 / 持平" :value="`${up} / ${down} / ${flat}`" />
      <KpiCard title="平均變動" :value="avgText" />
      <KpiCard title="中位數變動" :value="medianText" />
      <KpiCard title="上漲比例" :value="winRateText" />
    </div>

    <!-- 分布條 -->
    <div class="mt-5">
      <div class="text-xs text-cat-calico-brown mb-2">漲跌幅分布</div>

      <div class="space-y-2 sm:space-y-2">
        <DistBar label="> +5%" :count="bins.gainOver5Pct" :total="usableCount" tone="up" />
        <DistBar label="0 ~ +5%" :count="bins.gain0To5Pct" :total="usableCount" tone="upLight" />
        <DistBar label="= 0%" :count="bins.unchanged" :total="usableCount" tone="flat" />
        <DistBar label="-5% ~ 0" :count="bins.loss0To5Pct" :total="usableCount" tone="downLight" />
        <DistBar label="< -5%" :count="bins.lossOver5Pct" :total="usableCount" tone="down" />
      </div>
    </div>

    <!-- 補充指標 -->
    <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-sm">
      <KpiCard title="集中度（Top5 面積占比）" :value="top5ShareText" />
      <KpiCard title="波動程度（Std）" :value="stdText" />
      <KpiCard title="缺資料檔數" :value="missingText" />
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import KpiCard from './MarketSummaryCard/KpiCard.vue'
import DistBar from './MarketSummaryCard/DistBar.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  limit: { type: Number, default: 30 },
})

const used = computed(() => (props.items || []).slice(0, props.limit))

const norm = computed(() =>
  used.value.map((item) => {
    const area = Number(Array.isArray(item.value) ? item.value[0] : item.value)
    const pct = typeof item.changePct === 'number' ? item.changePct / 100 : null
    return {
      symbol: item.symbol ?? null,
      CloseDate: item.CloseDate ?? null,
      area: Number.isFinite(area) ? area : 0,
      chgPct: pct,
      hasPct: typeof pct === 'number',
    }
  }),
)

const usedCount = computed(() => norm.value.length)
const asOfDate = computed(() => norm.value.find((item) => item.CloseDate)?.CloseDate ?? null)

const usable = computed(() => norm.value.filter((item) => item.hasPct))
const usableCount = computed(() => usable.value.length)

const up = computed(() => usable.value.filter((item) => item.chgPct > 0).length)
const down = computed(() => usable.value.filter((item) => item.chgPct < 0).length)
const flat = computed(() => usable.value.length - up.value - down.value)

const avg = computed(() => {
  if (!usable.value.length) return null
  return usable.value.reduce((sum, item) => sum + item.chgPct, 0) / usable.value.length
})

const median = computed(() => {
  const sorted = usable.value.map((item) => item.chgPct).sort((a, b) => a - b)
  if (!sorted.length) return null
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
})

const avgText = computed(() => (avg.value == null ? '—' : `${(avg.value * 100).toFixed(2)}%`))
const medianText = computed(() =>
  median.value == null ? '—' : `${(median.value * 100).toFixed(2)}%`,
)
const winRateText = computed(() => {
  const total = usable.value.length
  if (!total) return '—'
  return `${((up.value / total) * 100).toFixed(0)}%`
})

const bins = computed(() => {
  const bucket = {
    gainOver5Pct: 0,
    gain0To5Pct: 0,
    unchanged: 0,
    loss0To5Pct: 0,
    lossOver5Pct: 0,
  }
  for (const item of usable.value) {
    const change = item.chgPct
    if (change > 0.05) bucket.gainOver5Pct++
    else if (change > 0) bucket.gain0To5Pct++
    else if (change === 0) bucket.unchanged++
    else if (change >= -0.05) bucket.loss0To5Pct++
    else bucket.lossOver5Pct++
  }
  return bucket
})

const top5Share = computed(() => {
  const list = [...norm.value].sort((a, b) => b.area - a.area)
  const total = list.reduce((sum, item) => sum + item.area, 0)
  if (!total) return null
  const top5 = list.slice(0, 5).reduce((sum, item) => sum + item.area, 0)
  return top5 / total
})
const top5ShareText = computed(() =>
  top5Share.value == null ? '—' : `${(top5Share.value * 100).toFixed(1)}%`,
)

const std = computed(() => {
  const changes = usable.value.map((item) => item.chgPct)
  if (changes.length < 2) return null
  const mean = changes.reduce((sum, value) => sum + value, 0) / changes.length
  const variance =
    changes.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (changes.length - 1)
  return Math.sqrt(variance)
})
const stdText = computed(() => (std.value == null ? '—' : `${(std.value * 100).toFixed(2)}%`))

const missing = computed(() => norm.value.filter((item) => !item.hasPct).length)
const missingText = computed(() => `${missing.value} 檔`)
</script>

<style scoped>
/* el-card的關係，沒辦法直接用tailwind */
.summary-card {
  background: #e7a14a;
  border: none;
}
</style>

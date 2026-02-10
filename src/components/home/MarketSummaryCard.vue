<template>
  <el-card class="summary-card">
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
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
        <DistBar label="> +2%" :count="bins.p2" :total="usableCount" tone="up" />
        <DistBar label="0 ~ +2%" :count="bins.p0_2" :total="usableCount" tone="upLight" />
        <DistBar label="= 0%" :count="bins.flat" :total="usableCount" tone="flat" />
        <DistBar label="-2% ~ 0" :count="bins.m0_2" :total="usableCount" tone="downLight" />
        <DistBar label="< -2%" :count="bins.m2" :total="usableCount" tone="down" />
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
  used.value.map((x) => {
    const area = Number(Array.isArray(x.value) ? x.value[0] : x.value)
    const pct = typeof x.changePct === 'number' ? x.changePct / 100 : null
    return {
      symbol: x.symbol ?? null,
      CloseDate: x.CloseDate ?? null,
      area: Number.isFinite(area) ? area : 0,
      chgPct: pct,
      hasPct: typeof pct === 'number',
    }
  }),
)

const usedCount = computed(() => norm.value.length)
const asOfDate = computed(() => norm.value.find((x) => x.CloseDate)?.CloseDate ?? null)

const usable = computed(() => norm.value.filter((x) => x.hasPct))
const usableCount = computed(() => usable.value.length)

const up = computed(() => usable.value.filter((x) => x.chgPct > 0).length)
const down = computed(() => usable.value.filter((x) => x.chgPct < 0).length)
const flat = computed(() => usable.value.length - up.value - down.value)

const avg = computed(() => {
  if (!usable.value.length) return null
  return usable.value.reduce((s, x) => s + x.chgPct, 0) / usable.value.length
})

const median = computed(() => {
  const arr = usable.value.map((x) => x.chgPct).sort((a, b) => a - b)
  if (!arr.length) return null
  const mid = Math.floor(arr.length / 2)
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2
})

const avgText = computed(() => (avg.value == null ? '—' : `${(avg.value * 100).toFixed(2)}%`))
const medianText = computed(() =>
  median.value == null ? '—' : `${(median.value * 100).toFixed(2)}%`,
)
const winRateText = computed(() => {
  const n = usable.value.length
  if (!n) return '—'
  return `${((up.value / n) * 100).toFixed(0)}%`
})

const bins = computed(() => {
  const b = { p2: 0, p0_2: 0, flat: 0, m0_2: 0, m2: 0 }
  for (const x of usable.value) {
    const p = x.chgPct
    if (p > 0.02) b.p2++
    else if (p > 0) b.p0_2++
    else if (p === 0) b.flat++
    else if (p >= -0.02) b.m0_2++
    else b.m2++
  }
  return b
})

const top5Share = computed(() => {
  const list = [...norm.value].sort((a, b) => b.area - a.area)
  const total = list.reduce((s, x) => s + x.area, 0)
  if (!total) return null
  const top5 = list.slice(0, 5).reduce((s, x) => s + x.area, 0)
  return top5 / total
})
const top5ShareText = computed(() =>
  top5Share.value == null ? '—' : `${(top5Share.value * 100).toFixed(1)}%`,
)

const std = computed(() => {
  const arr = usable.value.map((x) => x.chgPct)
  if (arr.length < 2) return null
  const m = arr.reduce((s, v) => s + v, 0) / arr.length
  const v = arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1)
  return Math.sqrt(v)
})
const stdText = computed(() => (std.value == null ? '—' : `${(std.value * 100).toFixed(2)}%`))

const missing = computed(() => norm.value.filter((x) => !x.hasPct).length)
const missingText = computed(() => `${missing.value} 檔`)
</script>

<style scoped>
.summary-card {
  background: #e7a14a;
  border: none;
}
</style>

<template>
  <!-- loading 狀態 -->
  <div
    v-if="home.status !== 'ready'"
    class="h-75 flex items-center justify-center text-sm opacity-60"
  >
    Loading…
  </div>

  <!-- ready 才給 chart 容器 -->
  <template v-else>
    <!-- 表格資料 -->
    <el-card class="tm-card" :body-style="{ padding: '16px' }">
      <template #header>
        <div class="text-center py-5">
          <div class="font-semibold text-amber-50 text-5xl font-sans">Top Movers</div>
        </div>
      </template>

      <el-row :gutter="12" justify="center">
        <el-col
          v-for="(group, idx) in visibleGroups"
          :key="idx"
          :xs="24"
          :sm="visibleGroups.length <= 1 ? 24 : 12"
          :md="visibleGroups.length <= 1 ? 24 : visibleGroups.length === 2 ? 12 : 6"
          class="w-full mx-auto"
          :style="visibleGroups.length === 1 ? { maxWidth: '820px' } : undefined"
        >
          <el-table
            :data="group"
            size="small"
            class="w-full"
            style="width: 100%; background: transparent"
            header-row-class-name="tm-header"
            row-class-name="tm-row"
          >
            <el-table-column label="代號" width="50">
              <template #default="{ row }">
                <span
                  class="cursor-pointer! text-cat-calico-brown! font-bold! hover:text-cat-calico-cream! hover:underline-offset-4!"
                  @click="emit('select', row.symbol)"
                >
                  {{ row.symbol }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="漲跌" width="80">
              <template #default="{ row }">
                <span :class="row.chgPct >= 0 ? 'text-red-600' : 'text-green-600'">
                  {{ formatPct(row.chgPct) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="當日收盤價" width="90">
              <template #default="{ row }">
                {{ row.lastPrice ?? row.close ?? '--' }}
              </template>
            </el-table-column>

            <el-table-column label="前日收盤價" width="100">
              <template #default="{ row }">
                {{ row.PrevClose ?? '--' }}
              </template>
            </el-table-column>

            <el-table-column label="收盤日" width="105">
              <template #default="{ row }">
                {{ row.CloseDate ?? '--' }}
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
    </el-card>

    <!-- 直條圖 -->
    <div ref="el" class="h-75 w-full mt-6" />
  </template>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount, computed } from 'vue'
import * as echarts from 'echarts'
import { useHomeStore } from '@/stores/home.store.js'

const emit = defineEmits(['select'])
const home = useHomeStore()

const el = ref(null)
let chart = null

let ro = null

const handleResize = () => {
  if (chart) chart.resize()
}

onMounted(() => {
  // 監聽容器尺寸變化（比只聽 window resize 更可靠）
  if (el.value) {
    ro = new ResizeObserver(() => {
      if (chart) chart.resize()
    })
    ro.observe(el.value)
  }

  window.addEventListener('resize', handleResize)
})

// ===== 1) 將 home.treemap 映射成 TopMovers row 結構 =====
const mappedRows = computed(() => {
  const list = Array.isArray(home.treemap) ? home.treemap : []

  return list
    .map((x) => ({
      symbol: x.symbol ?? null,
      // treemap 的 changePct 通常是百分比（例如 1.23 表示 1.23%）
      // 這裡統一成「小數」供 UI 用（0.0123）
      chgPct: typeof x.changePct === 'number' ? x.changePct / 100 : null,
      close: Number(Array.isArray(x.value) ? x.value[0] : x.value),
      PrevClose: x.PrevClose ?? null,
      CloseDate: x.CloseDate ?? null,
      // 你 template 會顯示 lastPrice ?? close
      lastPrice: x.lastPrice ?? null,
    }))
    .filter((r) => r.symbol && typeof r.chgPct === 'number')
})

// ===== 2) 漲/跌 Top10 =====
const gainersTop10 = computed(() => {
  return [...mappedRows.value]
    .filter((r) => r.chgPct > 0)
    .sort((a, b) => b.chgPct - a.chgPct)
    .slice(0, 10)
})

const losersTop10 = computed(() => {
  return [...mappedRows.value]
    .filter((r) => r.chgPct < 0)
    .sort((a, b) => a.chgPct - b.chgPct) // 更負的在前
    .slice(0, 10)
})

// ===== 3) 你要的一行四欄：漲(5/5) + 跌(5/5) =====
const groups = computed(() => {
  const g = gainersTop10.value
  const l = losersTop10.value
  return [g.slice(0, 5), g.slice(5, 10), l.slice(0, 5), l.slice(5, 10)]
})

// Only render groups that actually have rows; also used to decide responsive column widths
const visibleGroups = computed(() => {
  return (groups.value || []).filter((g) => Array.isArray(g) && g.length > 0)
})

// 圖表用的 rows：建議跟表格一致（20 筆：漲10 + 跌10）
const chartRows = computed(() => [...gainersTop10.value, ...losersTop10.value])

// 只處理「顯示順序」，不改數值
const chartRowsForAxis = computed(() => {
  const rows = chartRows.value || []

  const positives = rows.filter((r) => r.chgPct >= 0)
  const negatives = rows.filter((r) => r.chgPct < 0)

  // 漲：維持原本排序（你前面已經是由大到小）
  const pos = positives

  // 跌：反轉顯示順序（關鍵）
  const neg = [...negatives].reverse()

  return [...pos, ...neg]
})

const makeOption = (rows) => {
  const Y_TICKS = [10, 5, 0, -5, -10]
  return {
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: rows.map((r) => r.symbol),
      axisLabel: { rotate: 45 },
    },

    yAxis: {
      type: 'value',
      min: -10,
      max: 10,
      axisLabel: {
        formatter: (v) => {
          return Y_TICKS.includes(v) ? `${v}%` : ''
        },
      },
      axisTick: {
        interval: (index, value) => Y_TICKS.includes(value),
      },

      splitLine: {
        show: true,
        interval: (index, value) => Y_TICKS.includes(value),
      },
    },
    tooltip: {
      trigger: 'axis',
      formatter: (items) => {
        const r = rows[items[0].dataIndex]
        const pctText = typeof r.chgPct === 'number' ? (r.chgPct * 100).toFixed(2) + '%' : '--'
        return `
          <div>
            <strong>${r.symbol}</strong><br/>
            漲跌幅：${pctText}<br/>
            收盤價：${r.lastPrice ?? r.close ?? '--'}
          </div>
        `
      },
    },
    series: [
      {
        type: 'bar',
        // ECharts y 軸顯示百分比：這裡直接用「百分比數值」更直覺
        data: rows.map((r) => (typeof r.chgPct === 'number' ? r.chgPct * 100 : 0)),
        itemStyle: {
          color: (p) => (p.value >= 0 ? '#dc2626' : '#16a34a'),
        },
      },
    ],
  }
}

const renderChart = async () => {
  const rows = chartRows.value
  if (!rows || rows.length === 0) return

  await nextTick()

  if (!chart) {
    chart = echarts.init(el.value)
  }

  chart.setOption(makeOption(chartRowsForAxis.value), true)
  chart.resize()
}

// ✅ watch 正確只有 3 個參數
watch(
  () => home.status,
  (s) => {
    if (s !== 'ready') return
    renderChart()
  },
  { immediate: true },
)

// 可選：treemap 更新就重畫（避免資料晚到）
watch(
  () => home.treemap,
  () => {
    if (home.status !== 'ready') return
    renderChart()
  },
  { deep: true },
)

// 你 template 用到的 formatPct 若原本在別處，這裡補一個最小版
const formatPct = (v) => {
  if (typeof v !== 'number') return '--'
  return `${(v * 100).toFixed(2)}%`
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (ro) {
    ro.disconnect()
    ro = null
  }

  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<style scoped>
/* 表格整體背景透明 */
:deep(.el-table),
:deep(.el-table__inner-wrapper),
:deep(.el-scrollbar__wrap),
:deep(.el-table__body-wrapper) {
  background: transparent !important;
}

/* 表頭背景 */
:deep(.tm-header th.el-table__cell) {
  background: #efe7d8 !important;
  color: #5c4033 !important;
  font-weight: 600;
}

/* 每列背景*/
:deep(.tm-row td.el-table__cell) {
  background: rgba(255, 239, 216, 0.55) !important;
  color: #5c4033 !important;
}

/* hover 顏色（可選） */
:deep(.el-table__body tr:hover > td.el-table__cell) {
  background: #5c4033 !important;
  color: #e5e7eb !important;
}

/* 卡片本體：去白邊 + 背景一致 */
.tm-card {
  width: 100%;
  max-width: none;
  background: #e7a14a;
  border: none;
}

/* Force full viewport width on small screens, regardless of parent container constraints */
@media (max-width: 639px) {
  .tm-card {
    width: 100vw !important;
    max-width: 100vw !important;
    margin-left: calc(50% - 50vw) !important;
    margin-right: calc(50% - 50vw) !important;
  }
}

/* card header 預設是白底 + 底線，必須用 deep 改 */
:deep(.tm-card .el-card__header) {
  background: #e7a14a !important;
  border-bottom: none !important;
}

/* 表頭字體大小 */
:deep(.tm-header th.el-table__cell) {
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}
/* 表列字體大小 */
:deep(.tm-row td.el-table__cell) {
  font-size: 12px;
  text-align: center;
}

/* 小一點的上下間距 */
:deep(.tm-row td.el-table__cell) {
  padding: 10px 0 !important;
}

/* 表頭同步（可選） */
:deep(.tm-header th.el-table__cell) {
  padding: 16px 0 !important;
}

/* 行高微調 */
:deep(.tm-row td.el-table__cell .cell) {
  line-height: 1.8;
}
</style>

<template>
  <div class="relative min-h-[calc(100vh-64px)]">
    <!-- 全頁背景（four_cats.png） -->
    <img
      :src="fourCats"
      alt="four cats background"
      class="pointer-events-none fixed inset-x-0 h-full w-full -z-20 object-center"
    />

    <main class="relative mx-auto max-w-7xl px-4 pt-16">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-semibold text-cat-calico-cream">自選股</h1>
        <div class="w-full max-w-sm">
          <el-input v-model="q" clearable placeholder="搜尋（代號/名稱）">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <!-- 左：清單 -->
        <section class="md:col-span-2 rounded-2xl bg-cat-calico-cream/30 p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="text-sm opacity-70">我的清單</div>
            <div class="text-sm opacity-70">共 {{ filtered.length }} 檔</div>
          </div>

          <el-table
            :data="filtered"
            row-key="key"
            @row-click="onPick"
            class="w-full cat-table"
            v-loading="loading"
          >
            <el-table-column prop="symbol" label="代號" width="120" />
            <el-table-column prop="name" label="名稱" min-width="160" />
            <el-table-column prop="sector" label="產業" min-width="140" />
            <el-table-column prop="market" label="市場" width="80" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button link type="danger" @click.stop="onRemove(row)"> 移除 </el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>

        <!-- 右：概覽 -->
        <aside class="rounded-2xl bg-cat-calico-cream/30 p-4">
          <div class="text-sm opacity-70 mb-2">Stock Overview</div>

          <div v-if="picked" class="space-y-2">
            <div class="text-xl font-semibold">{{ picked.symbol }}</div>
            <div class="opacity-80">{{ picked.name }}</div>
            <div class="text-sm opacity-70">市場：{{ picked.market }}</div>
            <el-button class="mt-2 cat-view-btn" @click="goPicked">查看個股</el-button>
            <div class="mt-4 rounded-xl bg-black/5 p-3">
              <div class="mb-2 text-sm opacity-70">近 5 日走勢</div>
              <div v-if="miniMsg" class="text-sm opacity-70">{{ miniMsg }}</div>
              <div v-else ref="miniChartEl" class="h-32 w-full"></div>
            </div>
          </div>

          <div v-else class="text-sm opacity-70">點左邊任一檔股票，這裡顯示概覽</div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useWatchlistStore } from '@/stores/watchlist'
import * as echarts from 'echarts'
import fourCats from '@/assets/four_cats.png'

const router = useRouter()
const watchlistStore = useWatchlistStore()
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const loading = ref(false)
const q = ref('')
const picked = ref(null)
const miniMsg = ref('')
const miniChartEl = ref(null)
let miniChart = null
const MINI_DAYS = 5
const rows = ref([]) // { key, market, symbol }

const token = () => localStorage.getItem('token') || ''

const fetchWatchlist = async () => {
  const t = token()
  if (!t) {
    rows.value = []
    picked.value = null
    watchlistStore.setCount(0)
    return
  }

  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/user/watchlist`, {
      headers: { Authorization: `Bearer ${t}` },
    })

    if (res.status === 401) {
      rows.value = []
      picked.value = null
      watchlistStore.setCount(0)
      ElMessage.warning('請先登入')
      router.push('/login')
      return
    }

    const data = await res.json().catch(() => ({}))
    const list = Array.isArray(data?.result) ? data.result : []

    rows.value = list.map((it) => ({
      key: `${it.market}:${it.symbol}`,
      market: String(it.market || ''),
      symbol: String(it.symbol || '').toUpperCase(),
      name: String(it.name || '--'),
      sector: String(it.sector || '--'),
    }))

    // 同步 navbar badge（先以清單數量為準）
    watchlistStore.setCount(rows.value.length)

    // 預設選第一筆（如果目前沒選或選到不存在）
    if (rows.value.length === 0) {
      picked.value = null
    } else if (!picked.value || !rows.value.some((r) => r.key === picked.value.key)) {
      picked.value = rows.value[0]
    }
    await nextTick()
    renderMiniChart()
  } catch (e) {
    console.log(e)
    ElMessage.error('讀取自選股失敗')
  } finally {
    loading.value = false
  }
}
const fetchMiniSeries = async () => {
  miniMsg.value = ''

  if (!picked.value) return []

  const market = encodeURIComponent(picked.value.market)
  const symbol = encodeURIComponent(picked.value.symbol)

  const urls = [`${API_BASE}/close-Prices/${market}/${symbol}?limit=${MINI_DAYS}&sort=-date`]

  let lastErr = null

  for (const url of urls) {
    try {
      const res = await fetch(url)

      // 404: endpoint不存在 or 該 symbol 沒資料（依後端設計）
      if (res.status === 404) {
        lastErr = new Error('no data')
        continue
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        lastErr = new Error(data?.message || `HTTP ${res.status}`)
        continue
      }

      const items = Array.isArray(data?.result?.items) ? data.result.items : []
      const series = items
        .slice()
        .reverse()
        .map((it) => ({
          date: String(it.date || '').slice(0, 10),
          close: Number(it.close ?? it.ClosePrice ?? 0),
        }))
        .filter((x) => Number.isFinite(x.close) && x.close > 0)

      return series
    } catch (e) {
      lastErr = e
    }
  }

  // all failed or no data
  miniMsg.value = '近 5 日收盤資料不足'
  console.log('[miniChart] no series', { symbol: picked.value?.symbol, err: lastErr?.message })
  return []
}

const renderMiniChart = async () => {
  if (!miniChartEl.value || !picked.value) return

  const series = await fetchMiniSeries()
  if (series.length === 0) {
    if (miniChart) miniChart.clear()
    return
  }

  if (!miniChart) {
    miniChart = echarts.init(miniChartEl.value)
  }

  miniChart.setOption(
    {
      grid: { left: 46, right: 10, top: 10, bottom: 28 },

      xAxis: {
        type: 'category',
        data: series.map((d) => d.date),
        axisLine: { show: true },
        axisTick: { show: true },
        axisLabel: {
          show: true,
          formatter: (v) => String(v).slice(5), // 2025-01-15 -> 01-15
        },
      },

      yAxis: {
        type: 'value',
        scale: true,
        axisLine: { show: true },
        axisLabel: { show: true },
        splitLine: { show: true },
      },

      tooltip: { trigger: 'axis' },

      series: [
        {
          name: 'Close',
          type: 'line',
          data: series.map((d) => d.close),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2 },
        },
      ],
    },
    { notMerge: true },
  )
}

const filtered = computed(() => {
  const s = String(q.value || '').trim()
  if (!s) return rows.value
  return rows.value.filter(
    (r) => r.symbol.includes(s.toUpperCase()) || r.market.toUpperCase().includes(s.toUpperCase()),
  )
})

const onPick = async (row) => {
  picked.value = row
  miniMsg.value = ''
  await nextTick()
  renderMiniChart()
}

const onRemove = async (row) => {
  const t = token()
  if (!t) {
    ElMessage.warning('請先登入')
    router.push('/login')
    return
  }

  try {
    loading.value = true
    const res = await fetch(
      `${API_BASE}/user/watchlist/${encodeURIComponent(row.market)}/${encodeURIComponent(
        row.symbol,
      )}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${t}` },
      },
    )

    if (res.status === 401) {
      ElMessage.warning('登入已過期，請重新登入')
      router.push('/login')
      return
    }

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.message || '移除失敗')

    // 本地移除 + 同步 count
    rows.value = rows.value.filter((x) => x.key !== row.key)
    watchlistStore.setCount(rows.value.length)

    // picked 修正
    if (picked.value?.key === row.key) {
      picked.value = rows.value[0] || null
    }

    ElMessage.success('已移除自選')
  } catch (e) {
    ElMessage.error(e?.message || '移除失敗')
  } finally {
    loading.value = false
  }
}

const goPicked = () => {
  if (!picked.value) return
  router.push(
    `/stocks/${encodeURIComponent(picked.value.market)}/${encodeURIComponent(picked.value.symbol)}`,
  )
}

onMounted(fetchWatchlist)

onBeforeUnmount(() => {
  if (miniChart) {
    miniChart.dispose()
    miniChart = null
  }
})
</script>
<style scoped>
/* Element Plus el-table 色系調整（只影響本頁） */
:deep(.cat-table) {
  /* 表格本體 */
  --el-table-bg-color: rgba(239, 231, 216, 0.3); /* cat-calico-cream / 30 */
  --el-table-tr-bg-color: rgba(239, 231, 216, 0.3);

  /* 表頭 */
  --el-table-header-bg-color: rgba(239, 231, 216, 0.3);
  --el-table-header-text-color: rgb(15, 23, 42);

  /* 文字與分隔線 */
  --el-table-text-color: rgb(15, 23, 42);
  --el-table-border-color: rgba(15, 23, 42, 0.12);

  /* Hover */
  --el-table-row-hover-bg-color: #5c4033;
}

/* 表頭 cell */
:deep(.cat-table .el-table__header-wrapper th.el-table__cell) {
  background-color: var(--el-table-header-bg-color);
}

/* 內容列 cell */
:deep(.cat-table .el-table__body-wrapper td.el-table__cell) {
  background-color: transparent;
  cursor: pointer;
}

/* 修正：Element Plus hover 文字顏色（需命中 hover-row 與 current-row） */
:deep(.cat-table .el-table__body tr.hover-row td.el-table__cell),
:deep(.cat-table .el-table__body tr.el-table__row:hover td.el-table__cell),
:deep(.cat-table .el-table__body tr.current-row td.el-table__cell) {
  color: #efe7d8; /* cat-calico-cream */
}

:deep(.cat-table .el-table__body tr.hover-row > td.el-table__cell) {
  background-color: rgb(17, 17, 17); /* cat-calico-black */
}

/* 右側「查看個股」按鈕 hover 樣式 */
:deep(.cat-view-btn) {
  border-radius: 20px;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

:deep(.cat-view-btn:hover) {
  background-color: #5c4033; /* cat-calico-cream */
  color: #efe7d8; /* cat-calico-brown */
  border: #5c4033;
  border-radius: 20px;
}
</style>

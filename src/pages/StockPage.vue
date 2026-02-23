<template>
  <div class="p-6 space-y-4 bg-cat-orange-light">
    <!-- Header -->
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold">
        {{ stock?.name || symbol }}
        <span class="text-sm opacity-70">({{ market }}/{{ symbol }})</span>
      </h1>
      <div class="text-sm opacity-70" v-if="stock?.sector">產業：{{ stock.sector }}</div>
    </div>

    <div v-if="loading" class="text-sm opacity-70">Loading...</div>
    <div v-else-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</div>

    <template v-else>
      <!-- Top Section -->
      <div class="grid gap-4 md:grid-cols-3">
        <!-- Left: Chart -->
        <section class="md:col-span-2 rounded-2xl shadow-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="text-sm opacity-70">近 10 日收盤走勢</div>
            <div class="text-sm opacity-70">{{ symbolTitle }}</div>
          </div>

          <!-- 你用 echarts 就放一個容器 -->
          <div ref="todayChartEl" class="h-80 w-full"></div>
        </section>

        <!-- Right: Info + Watchlist -->
        <aside class="rounded-2xl shadow-lg p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-xl font-semibold">{{ symbolTitle }}</div>
              <div class="text-sm opacity-70">日期：{{ info.date || '--' }}</div>
            </div>

            <el-button type="primary" :loading="watchlistLoading" @click="toggleWatchlist">
              {{ isInWatchlist ? '移除自選' : '加入自選' }}
            </el-button>
          </div>

          <el-divider />

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-xl bg-cat-tuxedo-dark/5 p-3">
              <div class="opacity-70">最新收盤</div>
              <div class="text-lg font-semibold">{{ info.close ?? '--' }}</div>
            </div>

            <div class="rounded-xl bg-cat-tuxedo-dark/5 p-3">
              <div class="opacity-70">成交額</div>
              <div class="text-lg font-semibold">{{ info.turnover ?? '--' }}</div>
            </div>

            <div class="rounded-xl bg-cat-tuxedo-dark/5 p-3">
              <div class="opacity-70">開盤 / 收盤</div>
              <div class="font-medium">{{ info.open ?? '--' }} / {{ info.close ?? '--' }}</div>
            </div>

            <div class="rounded-xl bg-cat-tuxedo-dark/5 p-3">
              <div class="opacity-70">最高 / 最低</div>
              <div class="font-medium">{{ info.high ?? '--' }} / {{ info.low ?? '--' }}</div>
            </div>
          </div>

          <div v-if="errorMsg" class="mt-3 text-sm text-red-600">
            {{ errorMsg }}
          </div>
        </aside>
      </div>

      <!-- 折線圖 -->
      <section class="rounded-lg border">
        <div class="px-4 py-3 border-b flex items-center justify-between">
          <div class="text-sm font-medium">收盤價折線</div>
          <div class="text-xs opacity-70">
            {{ zoomEnabled ? '縮放模式（點擊退出）' : '點擊進入縮放' }}
          </div>
        </div>
        <div class="p-3">
          <div ref="historyChartEl" class="w-full h-90" @click="toggleLineZoom"></div>
        </div>
      </section>

      <!-- K 線圖 -->
      <section class="rounded-lg border">
        <div class="px-4 py-3 border-b flex items-center justify-between">
          <div class="text-sm font-medium">K 線（OHLC）</div>
          <div class="text-xs opacity-70">可拖曳縮放</div>
        </div>
        <div class="p-3">
          <div ref="kchartEl" class="w-full h-105" @click="toggleKZoom"></div>
        </div>
      </section>

      <!-- Table -->
      <section class="rounded-lg border">
        <div class="px-4 py-3 border-b flex items-center justify-between">
          <div class="text-sm font-medium">近 {{ enrichedRows.length }} 筆（日線）</div>
          <div class="text-xs opacity-70">排序：新 → 舊</div>
        </div>

        <div class="overflow-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left">
                <th class="px-4 py-2 whitespace-nowrap">日期</th>
                <th class="px-4 py-2 whitespace-nowrap">開</th>
                <th class="px-4 py-2 whitespace-nowrap">高</th>
                <th class="px-4 py-2 whitespace-nowrap">低</th>
                <th class="px-4 py-2 whitespace-nowrap">收</th>
                <th class="px-4 py-2 whitespace-nowrap">量</th>
                <th class="px-4 py-2 whitespace-nowrap">漲跌</th>
                <th class="px-4 py-2 whitespace-nowrap">漲跌%</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(r, idx) in pagedRows" :key="r._id || `${r.date}-${idx}`">
                <td class="px-4 py-2 whitespace-nowrap">{{ formatDate(r.date) }}</td>
                <td class="px-4 py-2 whitespace-nowrap">{{ formatNumber(r.open) }}</td>
                <td class="px-4 py-2 whitespace-nowrap">{{ formatNumber(r.high) }}</td>
                <td class="px-4 py-2 whitespace-nowrap">{{ formatNumber(r.low) }}</td>
                <td class="px-4 py-2 whitespace-nowrap">{{ formatNumber(r.close) }}</td>
                <td class="px-4 py-2 whitespace-nowrap">{{ formatNumber(r.volume) }}</td>

                <td class="px-4 py-2 whitespace-nowrap">
                  <span v-if="calcChange(r) === null">--</span>
                  <span v-else :class="calcChange(r) >= 0 ? 'text-red-600' : 'text-green-600'">
                    {{ Number(calcChange(r)).toFixed(2) }}
                  </span>
                </td>

                <td class="px-4 py-2 whitespace-nowrap">
                  <span v-if="calcChangePct(r) === null">--</span>
                  <span v-else :class="calcChangePct(r) >= 0 ? 'text-red-600' : 'text-green-600'">
                    {{ Number(calcChangePct(r)).toFixed(2) }}%
                  </span>
                </td>
              </tr>

              <tr v-if="enrichedRows.length === 0">
                <td class="px-4 py-6 text-sm opacity-70" colspan="8">沒有資料</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between px-4 py-3 border-t">
          <div class="text-xs opacity-70">第 {{ currentPage }} / {{ totalPages }} 頁</div>

          <div class="flex gap-2">
            <button
              class="px-3 py-1 text-sm border rounded disabled:opacity-40"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              上一頁
            </button>

            <button
              class="px-3 py-1 text-sm border rounded disabled:opacity-40"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              下一頁
            </button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { getStock, getLatestClose, listClosePrices } from '@/api/stock.api.js'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { useWatchlistStore } from '@/stores/watchlist'

const route = useRoute()
const market = computed(() => String(route.params.market || ''))
const symbol = computed(() => String(route.params.symbol || ''))

const symbolTitle = computed(() => `${market.value}/${symbol.value}`)

const API_BASE = import.meta.env.VITE_API_BASE_URL 
const watchlistStore = useWatchlistStore()
const watchlistLoading = ref(false)
const isInWatchlist = ref(false)

const normalizeMarketClient = (value) => {
  const m = String(value || '')
    .trim()
    .toUpperCase()
  if (m === 'TWSE' || m === 'TSE' || m === 'TPEX') return 'TW'
  return m
}

// 右側資訊卡：優先用 latest，其次用 closePrices 最新一筆
const info = computed(() => {
  const l = latest.value || {}
  const fallback =
    Array.isArray(closePrices.value) && closePrices.value.length > 0 ? closePrices.value[0] : {}
  const src = Object.keys(l).length ? l : fallback

  return {
    date: src?.date ? String(src.date).slice(0, 10) : '',
    close: src?.close ?? src?.ClosePrice ?? null,
    turnover: src?.turnover ?? src?.amount ?? src?.volume ?? null,
    open: src?.open ?? null,
    high: src?.high ?? null,
    low: src?.low ?? null,
  }
})

const getToken = () => localStorage.getItem('token') || ''

const addWatchlist = async () => {
  const token = getToken()
  const res = await fetch(`${API_BASE}/user/watchlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ market: market.value, symbol: symbol.value }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || '加入自選失敗')
  return Array.isArray(data?.result) ? data.result.length : null
}

const removeWatchlist = async () => {
  const token = getToken()
  const res = await fetch(
    `${API_BASE}/user/watchlist/${encodeURIComponent(market.value)}/${encodeURIComponent(
      symbol.value,
    )}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  )
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || '移除自選失敗')
  return Array.isArray(data?.result) ? data.result.length : null
}

const toggleWatchlist = async () => {
  errorMsg.value = ''
  if (!getToken()) {
    errorMsg.value = '請先登入才可使用自選股'
    return
  }

  try {
    watchlistLoading.value = true

    if (isInWatchlist.value) {
      const nextCount = await removeWatchlist()
      isInWatchlist.value = false
      watchlistStore.setCount(
        Number.isInteger(nextCount) ? nextCount : Math.max(0, watchlistStore.count - 1),
      )
      ElMessage({
        message: '已移除自選',
        type: 'success',
        customClass: 'toast-bottom !bg-cat-light !border-0 !text-slate-900',
      })
    } else {
      const nextCount = await addWatchlist()
      isInWatchlist.value = true
      watchlistStore.setCount(
        Number.isInteger(nextCount) ? nextCount : watchlistStore.count + 1,
      )
      ElMessage({
        message: '已加入自選',
        type: 'success',
        customClass: 'toast-bottom !bg-cat-light !border-0 !text-slate-900',
      })
    }
  } catch (e) {
    errorMsg.value = e?.message || '操作失敗'
  } finally {
    watchlistLoading.value = false
  }
}

const fetchIsInWatchlist = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    isInWatchlist.value = false
    return
  }

  try {
    const res = await fetch(`${API_BASE}/user/watchlist`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    // 未登入或過期，直接視為未加入
    if (res.status === 401) {
      isInWatchlist.value = false
      return
    }

    const data = await res.json()
    const list = Array.isArray(data?.result) ? data.result : []
    const currentMarket = normalizeMarketClient(market.value)
    const currentSymbol = String(symbol.value || '')
      .trim()
      .toUpperCase()

    isInWatchlist.value = list.some(
      (it) =>
        normalizeMarketClient(it.market) === currentMarket &&
        String(it.symbol || '')
          .trim()
          .toUpperCase() === currentSymbol,
    )
  } catch {
    // 任何錯誤都不要影響頁面
    isInWatchlist.value = false
  }
}

const loading = ref(false)
const errorMsg = ref('')

const stock = ref(null)
const latest = ref(null)
const closePrices = ref([])
const alive = ref(true)
// Top 區塊要顯示的近 N 日（可自行調整）
// 條件：必須要有足夠的 closePrices 資料被拉回來（由 query.limit 決定）
const TOP_DAYS = 10
// === Top (Today) line chart ===
const todayChartEl = ref(null)
let todayChart = null
let todayRO = null

// === History line chart ===
const historyChartEl = ref(null)
let historyChart = null
let historyRO = null

const zoomEnabled = ref(false)

const kchartEl = ref(null)
let kchart = null
let kro = null
const kZoomEnabled = ref(false)

const pageSize = 10
const currentPage = ref(1)

const query = ref({
  page: 1,
  limit: 120,
  sort: '-date',
})

const formatNumber = (v) => {
  if (v === null || v === undefined || v === '') return '--'
  const n = Number(v)
  if (Number.isNaN(n)) return '--'
  return n.toLocaleString()
}

const formatDate = (s) => {
  if (!s) return '--'
  return String(s).slice(0, 10)
}

const calcChange = (row) => {
  // 以 closePrices 序列來算「與前一日」漲跌
  // 注意：你目前排序是 -date（新到舊），所以前一筆是 index+1
  // change = close - prevClose
  return row?.__change ?? null
}

const calcChangePct = (row) => {
  return row?.__changePct ?? null
}

const enrichedRows = computed(() => {
  const rows = Array.isArray(closePrices.value) ? closePrices.value : []
  return rows.map((r, i) => {
    const close = Number(r?.close)
    const prevClose = Number(rows[i + 1]?.close) // 新到舊：下一筆是前一日
    const has = Number.isFinite(close) && Number.isFinite(prevClose) && prevClose !== 0
    const chg = has ? close - prevClose : null
    const chgPct = has ? (chg / prevClose) * 100 : null
    return { ...r, __change: chg, __changePct: chgPct }
  })
})

const fetchAll = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    const m = market.value
    const s = symbol.value
    if (!m || !s) throw new Error('缺少 market/symbol')

    const stockRes = await getStock(m, s)
    stock.value = stockRes?.result ?? stockRes

    const latestRes = await getLatestClose(m, s)
    latest.value = latestRes?.result ?? latestRes

    const listRes = await listClosePrices(m, s, query.value)
    const items = listRes?.result?.items ?? listRes?.result ?? []
    closePrices.value = Array.isArray(items) ? items : []
  } catch (err) {
    errorMsg.value = err?.message || '讀取資料失敗'
  } finally {
    loading.value = false
  }
}

const lineSeries = computed(() => {
  // ECharts 折線常用：[timestamp, value] 或 [dateString, value]
  // 你目前 enrichedRows 是「新→舊」，折線圖通常「舊→新」比較直覺，所以反轉
  const rows = [...enrichedRows.value].reverse()
  return rows
    .filter((r) => r?.date && r?.close !== null && r?.close !== undefined)
    .map((r) => [String(r.date).slice(0, 10), Number(r.close)])
})

const renderHistoryLine = () => {
  if (!historyChart || !historyChartEl.value) return

  historyChart.setOption(
    {
      tooltip: { trigger: 'axis' },
      grid: { left: 48, right: 24, top: 24, bottom: 48 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: lineSeries.value.map((d) => d[0]),
        axisLabel: { hideOverlap: true },
      },
      yAxis: { type: 'value', scale: true },
      dataZoom: zoomEnabled.value
        ? [
            {
              type: 'inside',
              start: 60,
              end: 100,
              zoomOnMouseWheel: true,
              moveOnMouseMove: true,
              moveOnMouseWheel: true,
            },
          ]
        : [],
      series: [
        {
          name: 'Close',
          type: 'line',
          showSymbol: false,
          data: lineSeries.value.map((d) => d[1]),
        },
      ],
    },
    { notMerge: true },
  )
}

const renderTodayLine = () => {
  if (!todayChart || !todayChartEl.value) return
  const arr = Array.isArray(lineSeries.value) ? lineSeries.value : []
  if (arr.length === 0) return

  // lineSeries 是「舊→新」，所以 slice(-TOP_DAYS) 就是最新 N 日
  const slice = arr.slice(-TOP_DAYS)
  const x = slice.map((d) => d[0])
  const y = slice.map((d) => d[1])

  todayChart.setOption(
    {
      tooltip: { trigger: 'axis' },
      grid: { left: 48, right: 24, top: 24, bottom: 48 },
      xAxis: { type: 'category', boundaryGap: false, data: x, axisLabel: { hideOverlap: true } },
      yAxis: { type: 'value', scale: true },
      series: [{ name: 'Close', type: 'line', data: y, showSymbol: true }],
    },
    { notMerge: true },
  )
}

const initTodayChart = async () => {
  if (!alive.value) return
  await nextTick()
  if (!todayChartEl.value) return
  if (!todayChart) todayChart = echarts.init(todayChartEl.value)
  if (!todayRO) {
    todayRO = new ResizeObserver(() => todayChart && todayChart.resize())
    todayRO.observe(todayChartEl.value)
  }
  renderTodayLine()
}

const initHistoryChart = async () => {
  if (!alive.value) return
  await nextTick()
  if (!historyChartEl.value) return
  if (!historyChart) historyChart = echarts.init(historyChartEl.value)
  if (!historyRO) {
    historyRO = new ResizeObserver(() => historyChart && historyChart.resize())
    historyRO.observe(historyChartEl.value)
  }
  renderHistoryLine()
}

const toggleLineZoom = () => {
  zoomEnabled.value = !zoomEnabled.value
  renderHistoryLine()
}

const kSeries = computed(() => {
  // K 線慣例：[open, close, low, high]
  const rows = [...enrichedRows.value].reverse() // 舊→新
  const data = rows
    .filter(
      (r) =>
        r?.date && [r.open, r.close, r.low, r.high].every((v) => v !== null && v !== undefined),
    )
    .map((r) => ({
      date: String(r.date).slice(0, 10),
      o: Number(r.open),
      c: Number(r.close),
      l: Number(r.low),
      h: Number(r.high),
    }))

  return {
    x: data.map((d) => d.date),
    y: data.map((d) => [d.o, d.c, d.l, d.h]),
  }
})

const renderK = () => {
  if (!kchart || !kchartEl.value) return

  kchart.setOption(
    {
      tooltip: { trigger: 'axis' },
      grid: { left: 48, right: 24, top: 24, bottom: 48 },
      xAxis: {
        type: 'category',
        data: kSeries.value.x,
        axisLabel: { hideOverlap: true },
      },
      yAxis: { type: 'value', scale: true },
      dataZoom: kZoomEnabled.value
        ? [
            {
              type: 'inside',
              start: 60,
              end: 100,
              zoomOnMouseWheel: true,
              moveOnMouseMove: true,
              moveOnMouseWheel: true,
            },
          ]
        : [],

      series: [
        {
          name: 'K',
          type: 'candlestick',
          data: kSeries.value.y,
        },
      ],
    },
    { notMerge: true },
  )
}

const initKChart = async () => {
  if (!alive.value) return
  await nextTick()
  if (!kchartEl.value) return

  if (!kchart) kchart = echarts.init(kchartEl.value)

  if (!kro) {
    kro = new ResizeObserver(() => kchart && kchart.resize())
    kro.observe(kchartEl.value)
  }

  renderK()
}

const toggleKZoom = () => {
  kZoomEnabled.value = !kZoomEnabled.value
  renderK()
}

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(enrichedRows.value.length / pageSize))
})

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return enrichedRows.value.slice(start, start + pageSize)
})

onMounted(async () => {
  await fetchAll()
  await fetchIsInWatchlist()
})

onMounted(() => {
  initKChart()
})

onBeforeUnmount(() => {
  alive.value = false
  if (todayRO && todayChartEl.value) todayRO.unobserve(todayChartEl.value)
  todayRO = null
  if (todayChart) todayChart.dispose()
  todayChart = null

  if (historyRO && historyChartEl.value) historyRO.unobserve(historyChartEl.value)
  historyRO = null
  if (historyChart) historyChart.dispose()
  historyChart = null

  if (kro && kchartEl.value) kro.unobserve(kchartEl.value)
  kro = null
  if (kchart) kchart.dispose()
  kchart = null
})

watch([market, symbol], async () => {
  currentPage.value = 1
  await fetchAll()
  fetchIsInWatchlist()
})

// 當資料更新就重畫
watch(lineSeries, (v) => {
  if (!alive.value) return
  if (!v || v.length === 0) return
  initTodayChart()
  initHistoryChart()
})

watch(kSeries, () => {
  if (!alive.value) return
  initKChart()
})
</script>

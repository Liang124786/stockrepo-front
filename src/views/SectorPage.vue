<template>
  <section class="relative">
    <div class="absolute inset-0">
      <!-- 4 貓背景 -->
      <img
        :src="fourCats"
        alt="four cats background"
        class="absolute inset-0  object-center"
      />
    </div>
    <div class="relative min-h-[calc(100vh-64px)] pt-20 pb-6 max-w-10/12 mx-auto">
      <div class="flex items-baseline justify-between">
        <h1 class="text-2xl font-semibold">產業：{{ sector }}</h1>
        <div class="text-sm opacity-70">共 {{ rows?.length || 0 }} 檔</div>
      </div>

      <div class="mt-4 rounded-xl bg-cat-tuxedo-light/30 p-4">
        <div v-if="loading">載入中…</div>
        <div v-else-if="rows.length === 0" class="opacity-70">此產業目前沒有資料</div>

        <div v-else class="divide-y">
          <el-table
            :data="tableRows"
            class="mt-4 cat-sector-table text-cat-calico-brown! cursor-pointer"
            height="600"
            @row-click="onRowClick"
          >
            <el-table-column prop="symbol" label="代號" width="150" sortable />
            <el-table-column prop="name" label="名稱" min-width="180" sortable />

            <el-table-column prop="latestClose" label="收盤價" width="120" sortable>
              <template #default="{ row }">
                <span class="tabular-nums">{{ fmt(row.latestClose, 2) }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="changePct" label="漲跌（元）" width="160" sortable>
              <template #default="{ row }">
                <div class="leading-tight">
                  <div :class="pctClass(row.changePct)" class="tabular-nums">
                    {{
                      Number.isFinite(Number(row.changePct)) ? `${fmt(row.changePct, 2)}%` : '--'
                    }}
                  </div>
                  <div class="text-xs text-market-flat tabular-nums">
                    {{
                      Number.isFinite(Number(row.prevClose)) &&
                      Number.isFinite(Number(row.latestClose))
                        ? fmt(row.latestClose - row.prevClose, 2)
                        : ''
                    }}
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="latestDate" label="日期" width="120" sortable>
              <template #default="{ row }">
                <span class="text-market-flat">{{ row.latestDate || '--' }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="sector" label="產業" min-width="140" sortable>
              <template #default="{ row }">
                <span class="text-market-flat">{{ row.sector || '其他' }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useStockStore } from '@/stores/stock'
import { useRoute, useRouter } from 'vue-router'
import fourCats from '@/assets/four_cats.png'

const stockStore = useStockStore()
const route = useRoute()
const router = useRouter()
const loading = computed(() => stockStore.status === 'loading')
const sector = computed(() => {
  const v = String(route.params.sector || 'all')
  return v === 'all' ? '全部' : v
})

const sectorKey = computed(() => {
  const v = String(route.params.sector || '')
  return v === 'all' ? '' : v
})

const rows = computed(() => {
  const all = stockStore.rows || []
  const filteredBySector =
    sectorKey.value === '' ? all : all.filter((s) => (s?.sector || '其他') === sectorKey.value)
  return filteredBySector
})

const baseRows = computed(() => {
  const all = stockStore.rows || []
  if (!sectorKey.value) return all
  return all.filter((s) => (s?.sector || '其他') === sectorKey.value)
})

// 表格資料：把最新 close/date merge 進來
const tableRows = computed(() => {
  const map = stockStore.latestMap || {}
  return baseRows.value.map((s) => {
    const latest = map[s.symbol]
    return {
      ...s,
      latestClose: latest?.close ?? null,
      latestDate: latest?.date ?? '',
      changePct: latest?.changePct ?? null,
      prevClose: latest?.prevClose ?? null,
    }
  })
})

const fmt = (n, digits = 2) => (Number.isFinite(Number(n)) ? Number(n).toFixed(digits) : '--')

// 顏色 class（你可以用 tailwind）
const pctClass = (pct) => {
  if (!Number.isFinite(Number(pct))) return 'text-market-flat'
  return pct > 0 ? 'text-market-up' : pct < 0 ? 'text-market-down' : 'text-market-flat'
}

const onRowClick = (row) => {
  router.push(`/stocks/TW/${String(row.symbol).toUpperCase()}`)
}

onMounted(async () => {
  if (!stockStore.rows?.length) await stockStore.fetchStocks()

  // 只抓本頁需要的 symbols（避免全抓）
  const symbols = baseRows.value.map((s) => s.symbol)
  await stockStore.fetchLatestMapForSymbols(symbols)
})
</script>
<style scoped>
/* 移除 Element Plus 預設白底 */
:deep(.cat-sector-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-border-color: transparent;
}

/* 預設 cell 樣式（你原本想要的） */
:deep(.cat-sector-table .el-table__body td.el-table__cell) {
  background-color: rgba(229, 231, 235, 0.2); /* bg-cat-tuxedo-light/20 */
  color: #5c4033; /* cat-calico-brown */
}

/* Hover（維持 Element 行為） */
:deep(.cat-sector-table .el-table__body tr.hover-row td.el-table__cell),
:deep(.cat-sector-table .el-table__body tr.el-table__row:hover td.el-table__cell) {
  background-color: #2e2e2e; /* cat-calico-black */
  color: #efe7d8; /* cat-calico-cream */
}

/* 表頭文字顏色 */
:deep(.cat-sector-table .el-table__header-wrapper th.el-table__cell) {
  color: #5c4033; /* cat-calico-brown */
}
</style>

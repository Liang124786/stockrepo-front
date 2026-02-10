<template>
  <section class="relative overflow-hidden">
    <!-- 背景：四隻貓 -->
    <div class="absolute inset-0">
      <img :src="bgUrl" alt="four cats background" class="h-full w-full object-center" />
    </div>

    <!-- 內容區（80vh） -->
    <div class="relative mx-auto flex min-h-[80vh] max-w-7xl items-center justify-center px-4">
      <div class="w-full max-w-2xl text-center">
        <h1 class="text-3xl font-semibold text-white sm:text-4xl">用貓的冷靜，做市場的決策</h1>
        <p class="mt-3 text-white/80">輸入代號或公司名稱（2330 / 2454）</p>

        <!-- 搜尋欄 -->
        <div class="mt-5">
          <el-input
            v-model="s.q"
            clearable
            size="large"
            placeholder="輸入代號或公司名稱（2330 / 台積電）"
            class="hero-search"
            @keydown.enter.prevent="onEnter"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <div class="mt-3 text-sm text-white/70">範例：2330、2454、2308、2207</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import bgUrl from '@/assets/four_cats.png'
import { useStockSearchStore } from '@/stores/stockSearch.store.js'

const router = useRouter()
const s = useStockSearchStore()

const toTWMarket = (m) => {
  const x = String(m || '').toUpperCase()
  if (x === 'TW' || x === 'TWSE' || x === 'TSE') return 'TW'
  return x
}

const go = (it) => {
  router.push(`/stocks/${toTWMarket(it.market)}/${String(it.symbol).toUpperCase()}`)
  s.clear()
}

const onEnter = async () => {
  const keyword = String(s.q || '').trim()
  if (!keyword) return

  const { items } = await s.search({ limit: 10 })

  // 1️⃣ 純數字 → 先精準比對
  if (/^\d{4,6}$/.test(keyword)) {
    const exact = items.find((it) => String(it.symbol) === keyword)
    if (exact) {
      go(exact)
      return
    }

    // 2️⃣ 搜尋清單沒有，但使用者輸入的是合法代號 → 直接嘗試跳
    router.push(`/stocks/TW/${keyword}`)
    s.clear()
    return
  }

  // 3️⃣ 非純數字，維持原本行為
  if (items.length === 1) {
    go(items[0])
  }
}
</script>

<!-- 注意：這段不要 scoped，或用 :deep，因為要改 el-input 內部 -->
<style>
/* Hero 搜尋框：圓角、透明感、好讀 */
.hero-search .el-input__wrapper {
  border-radius: 9999px;
  background: rgba(250, 250, 248, 0.92); /* base */
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

/* focus：淡橘色 */
.hero-search .el-input__wrapper.is-focus {
  border-color: #f3c892; /* cat.orange.light */
  box-shadow:
    0 0 0 3px rgba(243, 200, 146, 0.35),
    0 8px 30px rgba(0, 0, 0, 0.18);
}
</style>

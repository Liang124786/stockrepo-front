<template>
  <div class="bg-cat-orange">
    <!-- Search -->
    <HeroSearch v-model:market="market" v-model:keyword="keyword" @search="goStock" />

    <!-- TopMovers -->
    <TopMovers @select="goStockBySymbol" />

    <!-- Treemap -->

    <TreemapChart :items="home.treemap" />

    <!-- 市場摘要卡 -->
    <MarketSummaryCard :items="home.treemap" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import HeroSearch from '@/components/home/HeroSearch.vue'
import TopMovers from '@/components/home/TopMovers.vue'
import TreemapChart from '@/components/home/TreemapChart.vue'
import MarketSummaryCard from '@/components/home/MarketSummaryCard.vue'

import { useHomeStore } from '@/stores/home.store.js'

const router = useRouter()
const home = useHomeStore()

const market = ref('TW')
const keyword = ref('')

// 只負責導頁
const goStock = () => {
  const s = String(keyword.value || '')
    .trim()
    .toUpperCase()
  if (!s) return
  router.push(`/stocks/${market.value}/${s}`)
}

const goStockBySymbol = (symbol) => {
  const s = String(symbol || '')
    .trim()
    .toUpperCase()
  if (!s) return
  router.push(`/stocks/${market.value}/${s}`)
}

// 首頁只做一次資料載入
onMounted(() => {
  home.load()
})
</script>

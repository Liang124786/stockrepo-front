import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listStocks } from '@/api/stock.api.js'

export const useStockSearchStore = defineStore('stockSearch', () => {
  const keyword = ref('')
  const loading = ref(false)
  const errorMsg = ref('')
  const results = ref([])

  const normalize = (s) => String(s || '').trim()

  const clear = () => {
    results.value = []
    errorMsg.value = ''
  }

  const search = async ({ limit = 10 } = {}) => {
    const normalizedKeyword = normalize(keyword.value)
    if (!normalizedKeyword) return { items: [] }

    loading.value = true
    errorMsg.value = ''
    try {
      const res = await listStocks({ keyword: normalizedKeyword, page: 1, limit })
      const items = res?.result?.items ?? []
      results.value = Array.isArray(items) ? items : []
      return { items: results.value }
    } catch (e) {
      errorMsg.value = e?.message || '搜尋失敗'
      results.value = []
      return { items: [], error: errorMsg.value }
    } finally {
      loading.value = false
    }
  }

  return { keyword, loading, errorMsg, results, search, clear }
})

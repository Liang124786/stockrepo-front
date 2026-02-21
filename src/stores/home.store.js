import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getTreemapData } from '@/api/treemap.api'

export const useHomeStore = defineStore('home', () => {
  const status = ref('idle')
  const errorMsg = ref('')

  // 首頁的「唯一核心資料」
  const treemap = ref([])

  const load = async () => {
    if (status.value === 'loading' || status.value === 'ready') return

    status.value = 'loading'
    errorMsg.value = ''

    try {
      const p = getTreemapData('TW')
      const res = await p
      const list = Array.isArray(res) ? res : Array.isArray(res?.result) ? res.result : []

      treemap.value = list
      status.value = 'ready'
    } catch (e) {
      status.value = 'error'
      errorMsg.value = e?.message || '首頁資料載入失敗'
    }
  }

  const reset = () => {
    status.value = 'idle'
    errorMsg.value = ''
    treemap.value = []
  }

  return {
    status,
    errorMsg,
    treemap,
    load,
    reset,
  }
})

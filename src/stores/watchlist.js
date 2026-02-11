import { defineStore } from 'pinia'
import { api } from '@/api/axios'

export const useWatchlistStore = defineStore('watchlist', {
  state: () => ({
    count: 0,
  }),

  actions: {
    setCount(n) {
      this.count = Number(n) || 0
    },

    async fetchCount() {
      const token = localStorage.getItem('token')
      if (!token) {
        this.count = 0
        return
      }

      const { data } = await api.get('/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      this.count = data?.result?.watchlist ?? 0
    },
  },
})

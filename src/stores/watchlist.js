import { defineStore } from 'pinia'

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

      const res = await fetch('http://localhost:3000/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()
      this.count = data?.result?.watchlist ?? 0
    },
  },
})

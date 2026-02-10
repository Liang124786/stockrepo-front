import { defineStore } from 'pinia'
import { listStocks } from '@/api/stock.api.js'
import { listClosePrices } from '@/api/stock.api'
import { getLatestClose } from '@/api/stock.api'

export const useStockStore = defineStore('stock', {
  state: () => ({
    rows: [],
    latestRows: [], // 只放「有最新資料」的股票
    sector: null,
    status: 'idle',
    q: '',
    error: null,
    market: 'TW',
    latestMap: {},
  }),

  getters: {
    sectorStats(state) {
      // 判斷是否為 ETF 的簡單函式
      const isETF = (s) => {
        const sym = String(s?.symbol ?? '')
        return sym.startsWith('00') // 0050/006xx/008xx...
      }

      // 統計目前 rows 裡各 sector 的成分股數
      const map = new Map()
      for (const s of state.rows) {
        if (!s) continue
        if (isETF(s)) continue // 排除 ETF
        const sec = s.sector || '其他'
        map.set(sec, (map.get(sec) || 0) + 1)
      }
      return Array.from(map.entries()).map(([sector, count]) => ({ sector, count }))
    },

    filteredRows(state) {
      const isETF = (s) => String(s?.symbol ?? '').startsWith('00')

      const base = state.rows.filter((s) => s && !isETF(s)) // ✅ 全域排除 ETF

      const sec = state.sector
      if (!sec) return base

      if (sec === '__OTHER__') {
        return base.filter((s) => !top.includes(s.sector || '其他'))
      }

      return base.filter((s) => (s.sector || '其他') === sec)
    },
    treemapItems() {
      const rows = this.filteredRows
      const map = new Map()

      for (const s of rows) {
        if (!s) continue
        const sec = s.sector || '其他'
        if (!map.has(sec)) map.set(sec, [])

        map.get(sec).push({
          name: `${s.symbol ?? ''} ${s.name ?? ''}`.trim() || '--',
          value: Number(s.closePrice ?? 0),
          changePct: typeof s.changePct === 'number' ? s.changePct : 0,
        })
      }

      const items = []
      for (const [sec, children] of map.entries()) {
        const areaSum = children.reduce((acc, c) => acc + (Number(c.value) || 0), 0)
        items.push({ name: sec, value: areaSum, changePct: 0, children })
      }

      return items
    },
  },

  actions: {
    setSector(sector) {
      this.sector = sector || null
    },
    async search(params = {}) {
      const keyword = String(this.q || '').trim()
      const res = await listStocks({
        market: this.market || 'TW',
        keyword,
        page: 1,
        limit: 20,
        ...params,
      })
      return res?.result || { items: [], pagination: { total: 0, page: 1, limit: 20, pages: 1 } }
    },
    async fetchStocks(params = {}) {
      this.status = 'loading'
      this.error = null
      try {
        const all = []
        let page = 1
        let pages = 1

        do {
          const res = await listStocks({
            market: this.market,
            limit: 1000,
            page,
            isActive: true,
            ...params,
          })
          const items = res?.result?.items || []
          const pg = res?.result?.pagination
          pages = pg?.pages || 1
          all.push(...items)
          page += 1
        } while (page <= pages)

        this.rows = all
        this.status = 'success'
      } catch (err) {
        this.status = 'error'
        this.error = err?.message || 'fetchStocks failed'
      }
    },
    async fetchLatestForSector(symbols = []) {
      const result = []

      for (const s of symbols) {
        try {
          const res = await getLatestClose('TW', s.symbol)
          if (res?.result?.closePrice != null) {
            result.push({
              ...s,
              closePrice: Number(res.result.closePrice),
              changePct: Number(res.result.changePct || 0),
            })
          }
        } catch (e) {
          console.log(e)
          // 沒資料就略過
        }
      }

      this.latestRows = result
    },
    async fetchLatestMapForSymbols(symbols = []) {
      const map = {}

      for (const sym of symbols) {
        try {
          // 抓最近 2 筆收盤：latest + prev
          const res = await listClosePrices('TW', sym, { limit: 2, sort: '-date' })
          const items = res?.result?.items || []

          const latest = items[0]
          const prev = items[1]

          const close = Number(latest?.close)
          const prevClose = Number(prev?.close)

          if (!Number.isFinite(close)) continue

          const changePct =
            Number.isFinite(prevClose) && prevClose !== 0
              ? ((close - prevClose) / prevClose) * 100
              : null

          map[sym] = {
            close,
            date: String(latest?.date || '').slice(0, 10),
            prevClose: Number.isFinite(prevClose) ? prevClose : null,
            changePct,
          }
        } catch (e) {
          console.log(e)
          // 沒資料就略過
        }
      }

      this.latestMap = map
    },
    clear() {
      this.q = ''
      this.error = null
      this.status = 'idle'
    },
  },
})

import { api } from './axios'

/**
 * Stocks API
 * 專責：所有跟「股票清單/個股」相關的 HTTP 呼叫
 * 元件不要直接寫 api.get('/xxx')，統一從這裡走
 */

export const listStocks = (params = {}) => {
  // 對應你後端：GET /stocks?keyword=&market=&page=&limit=...
  return api.get('/stocks', { params }).then((r) => r.data)
}

export const getStock = (market, symbol) => {
  // 對應你後端：GET /stocks/:market/:symbol
  return api.get(`/stocks/${market}/${symbol}`).then((r) => r.data)
}

export const getLatestClose = (market, symbol) => {
  // 對應你後端：GET /close-prices/:market/:symbol/latest
  return api.get(`/close-prices/${market}/${symbol}/latest`).then((r) => r.data)
}

export const listClosePrices = (market, symbol, params = {}) => {
  // 對應你後端：GET /close-prices/:market/:symbol?startDate=&endDate=&page=&limit=&sort=
  return api.get(`/close-prices/${market}/${symbol}`, { params }).then((r) => r.data)
}

export function listSectors(params = {}) {
  // 後端：GET /stocks/sectors?market=TW
  return api.get('/stocks/sectors', { params }).then((r) => r.data)
}

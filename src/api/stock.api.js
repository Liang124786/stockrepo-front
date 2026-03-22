import { api } from './axios'

/**
 * Stocks API
 * 專責：所有跟「股票清單/個股」相關的 HTTP 呼叫
 */

export const listStocks = async (params = {}) => {
  // 對應你後端：GET /stocks?keyword=&market=&page=&limit=...
  const { data } = await api.get('/stocks', { params })
  return data
}

export const getStock = async (market, symbol) => {
  // 對應你後端：GET /stocks/:market/:symbol
  const { data } = await api.get(`/stocks/${market}/${symbol}`)
  return data
}

export const getLatestClose = async (market, symbol) => {
  // 對應你後端：GET /close-prices/:market/:symbol/latest
  const { data } = await api.get(`/close-prices/${market}/${symbol}/latest`)
  return data
}

export const listClosePrices = async (market, symbol, params = {}) => {
  // 對應你後端：GET /close-prices/:market/:symbol?startDate=&endDate=&page=&limit=&sort=
  const { data } = await api.get(`/close-prices/${market}/${symbol}`, { params })
  return data
}

export async function listSectors(params = {}) {
  // 後端：GET /stocks/sectors?market=TW
  const { data } = await api.get('/stocks/sectors', { params })
  return data
}

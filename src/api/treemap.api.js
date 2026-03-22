import { api } from './axios'

// 後端固定用 0050，不需要 symbols
export const getTreemapData = async (market) => {
  const { data } = await api.post(`/treemap/${market}`)
  return data.result
}

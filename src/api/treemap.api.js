import { api } from './axios'

// 後端固定用 0050，不需要 symbols
export const getTreemapData = (market) => {
  return api.post(`/treemap/${market}`).then((response) => response.data.result)
}

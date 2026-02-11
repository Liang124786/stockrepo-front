import axios from 'axios'

// 你可以在 .env 設定：VITE_API_BASE_URL=http://localhost:3000/
const baseURL = import.meta.env.VITE_API_BASE_URL 

export const api = axios.create({
  baseURL,
  timeout: 15000,
})

// --- Token 讀取策略：先用 localStorage（之後你也可以改成 Pinia 管） ---
const getToken = () => {
  return localStorage.getItem('token') || ''
}

// --- Request interceptor：自動掛 Authorization ---
api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// --- Response interceptor：把錯誤統一成前端好用的格式 ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status ?? 0
    const message =
      error?.response?.data?.message || error?.response?.data?.error || error?.message || '發生錯誤'

    // 你之後可以在這裡做「遇到 401 自動登出/導回登入」
    // 但先不要自動 router.push，避免循環導頁，等 auth 流程成形再接。

    return Promise.reject({ status, message, raw: error })
  },
)

// 小工具：讓其他檔案可以直接用同一套錯誤格式
export const isApiError = (err) => {
  return err && typeof err === 'object' && 'status' in err && 'message' in err
}

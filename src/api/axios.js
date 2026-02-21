import axios from 'axios'

const rawBaseURL = import.meta.env.VITE_API_BASE_URL

const baseURL = (() => {
  const value = String(rawBaseURL || '').trim().replace(/\/+$/, '')

  // Production：避免 build/部署時把 localhost 打進 bundle
  if (import.meta.env.PROD) {
    if (!value || /localhost|127\.0\.0\.1/.test(value)) {
      return 'https://stockrepo-back.onrender.com'
    }
    return value
  }

  // 沒填就回 localhost
  return value || 'http://localhost:3000'
})()

export const api = axios.create({
  baseURL,
  timeout: 15000,
})

// Token 讀取策略：用 localStorage
const getToken = () => {
  return localStorage.getItem('token') || ''
}

// Request interceptor：自動掛 Authorization
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

// Response interceptor：把錯誤統一成前端好用的格式
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

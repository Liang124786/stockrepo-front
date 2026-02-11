const BASE_URL = import.meta.env.VITE_API_BASE_URL
const USERS_PATH = '/user'

export const registerUser = async (payload) => {
  const res = await fetch(`${BASE_URL}${USERS_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data?.message || '註冊失敗')
  }

  return data
}

export const loginUser = async (payload) => {
  const res = await fetch(`${BASE_URL}${USERS_PATH}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || '登入失敗')
  return data
}

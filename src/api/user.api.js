import api from './axios'
const USERS_PATH = '/user'

export const registerUser = async (payload) => {
  const res = await api.post(USERS_PATH, payload)
  return res.data
}

export const loginUser = async (payload) => {
  const res = await api.post(`${USERS_PATH}/login`, payload)
  return res.data
}

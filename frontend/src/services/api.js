import axios from 'axios'

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  .replace(/\/api$/, '')

const api = axios.create({
  baseURL: API_BASE_URL + '/api'
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  try {
    const cart = JSON.parse(localStorage.getItem('smart_restaurant_cart') || 'null')
    if (cart?.qrToken) config.headers['X-Table-Token'] = cart.qrToken
  } catch { /* Ignore invalid saved carts. */ }
  return config
})

export default api

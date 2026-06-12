import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(sessionStorage.getItem('user') || 'null'),
    token: sessionStorage.getItem('token') || null
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    role: (state) => state.user?.role || null
  },
  actions: {
    async login(email, password) {
      const res = await api.post('/auth/login', { email, password })
      this.token = res.data.token
      this.user = res.data.user
      sessionStorage.setItem('token', this.token)
      sessionStorage.setItem('user', JSON.stringify(this.user))
      return res.data
    },
    async register(name, email, password) {
      const res = await api.post('/auth/register', { name, email, password })
      this.token = res.data.token
      this.user = res.data.user
      sessionStorage.setItem('token', this.token)
      sessionStorage.setItem('user', JSON.stringify(this.user))
      return res.data
    },
    logout() {
      this.token = null
      this.user = null
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
    }
  }
})

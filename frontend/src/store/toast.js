import { defineStore } from 'pinia'

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: []
  }),
  actions: {
    addToast(message, type = 'info', duration = 3500) {
      const id = Date.now() + Math.random()
      this.toasts.push({ id, message, type })
      setTimeout(() => this.removeToast(id), duration)
    },
    removeToast(id) {
      this.toasts = this.toasts.filter(t => t.id !== id)
    },
    success(message) { this.addToast(message, 'success') },
    error(message)   { this.addToast(message, 'error', 5000) },
    warning(message) { this.addToast(message, 'warning') },
    info(message)    { this.addToast(message, 'info') }
  }
})

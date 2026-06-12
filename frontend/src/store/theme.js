import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    dark: localStorage.getItem('theme') !== 'light'
  }),
  actions: {
    toggle() {
      this.dark = !this.dark
      localStorage.setItem('theme', this.dark ? 'dark' : 'light')
      this.applyTheme()
    },
    applyTheme() {
      document.documentElement.setAttribute('data-theme', this.dark ? 'dark' : 'light')
    },
    init() {
      const saved = localStorage.getItem('theme')
      this.dark = saved !== 'light'
      this.applyTheme()
    }
  }
})

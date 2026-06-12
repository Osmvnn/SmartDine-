<template>
  <button class="theme-toggle" @click="themeStore.toggle()" :title="themeStore.dark ? 'Switch to Light' : 'Switch to Dark'">
    <i :class="themeStore.dark ? 'bi bi-sun' : 'bi bi-moon-stars'"></i>
  </button>
</template>

<script setup>
import { useThemeStore } from '../store/theme'
const themeStore = useThemeStore()
</script>

<style scoped>
.theme-toggle {
  background: var(--dark-card, #1e293b);
  border: 1px solid var(--dark-border, #334155);
  color: var(--text-secondary, #94a3b8);
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.theme-toggle:hover {
  background: var(--primary, #6c5ce7);
  color: white;
}
</style>

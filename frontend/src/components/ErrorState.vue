<template>
  <div class="error-state">
    <div class="error-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
    <h5 class="error-title">{{ title || 'Something went wrong' }}</h5>
    <p class="error-message">{{ message || 'An unexpected error occurred. Please try again.' }}</p>
    <button v-if="onRetry" class="btn-primary-custom" @click="onRetry">
      <svg viewBox="0 0 20 20" fill="currentColor" style="width:16px;height:16px;margin-right:6px;">
        <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
      </svg>
      Try Again
    </button>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  message: String,
  onRetry: Function
})
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  gap: 12px;
}
.error-icon {
  width: 64px;
  height: 64px;
  color: var(--danger, #ef4444);
  opacity: 0.7;
  animation: error-pulse 2s ease-in-out infinite;
}
.error-icon svg { width: 100%; height: 100%; }
.error-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary, #f1f5f9);
  margin: 0;
}
.error-message {
  font-size: 0.9rem;
  color: var(--text-secondary, #94a3b8);
  margin: 0;
  max-width: 320px;
}
@keyframes error-pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
</style>

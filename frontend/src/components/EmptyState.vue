<template>
  <div class="empty-state">
    <div class="empty-icon">
      <slot name="icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
        </svg>
      </slot>
    </div>
    <h5 class="empty-title">{{ title || 'Nothing here yet' }}</h5>
    <p v-if="message" class="empty-message">{{ message }}</p>
    <slot name="action" />
  </div>
</template>

<script setup>
defineProps({
  title: String,
  message: String
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 24px;
  text-align: center;
  gap: 12px;
}
.empty-icon {
  width: 72px;
  height: 72px;
  color: var(--text-muted, #64748b);
  animation: empty-float 3s ease-in-out infinite;
}
.empty-icon svg { width: 100%; height: 100%; }
.empty-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-secondary, #94a3b8);
  margin: 0;
}
.empty-message {
  font-size: 0.875rem;
  color: var(--text-muted, #64748b);
  margin: 0;
  max-width: 280px;
}
@keyframes empty-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>

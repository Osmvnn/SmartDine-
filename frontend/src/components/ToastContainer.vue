<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      <TransitionGroup name="toast" tag="div" class="toast-list">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="toast-item"
          :class="`toast-${toast.type}`"
          role="alert"
          @click="toastStore.removeToast(toast.id)"
        >
          <span class="toast-icon">
            <svg v-if="toast.type === 'success'" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <svg v-else-if="toast.type === 'error'" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <svg v-else-if="toast.type === 'warning'" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <svg v-else viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
          </span>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" @click.stop="toastStore.removeToast(toast.id)" aria-label="Dismiss">&times;</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '../store/toast'
const toastStore = useToastStore()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
  max-width: 360px;
  width: calc(100vw - 40px);
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  pointer-events: all;
  cursor: pointer;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left-width: 3px;
  position: relative;
  background: rgba(24, 18, 14, 0.96);
  color: #fff7ed;
}

.toast-success {
  border-left-color: var(--success, #10b981);
}
.toast-success .toast-icon { color: var(--success, #10b981); }
.toast-error {
  border-left-color: var(--danger, #ef4444);
}
.toast-error .toast-icon { color: var(--danger, #ef4444); }
.toast-warning {
  border-left-color: var(--warning, #f59e0b);
}
.toast-warning .toast-icon { color: var(--warning, #f59e0b); }
.toast-info {
  border-left-color: var(--info, #3b82f6);
}
.toast-info .toast-icon { color: var(--info, #3b82f6); }

.toast-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
}
.toast-icon svg {
  width: 20px;
  height: 20px;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
  color: #fff7ed;
}

.toast-close {
  background: none;
  border: none;
  color: #fff7ed;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.15s;
}
.toast-close:hover { opacity: 1; }


.toast-enter-active {
  animation: toast-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  animation: toast-slide-out 0.25s ease forwards;
}
.toast-move {
  transition: transform 0.3s ease;
}

@keyframes toast-slide-in {
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
@keyframes toast-slide-out {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
    max-height: 80px;
  }
  to {
    opacity: 0;
    transform: translateX(80px) scale(0.9);
    max-height: 0;
  }
}
</style>

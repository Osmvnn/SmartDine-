<template>
  <div class="notif-wrapper" ref="wrapper">
    <button :class="['notif-btn', ringing ? 'ringing' : '']" @click="open = !open">
      <i class="bi bi-bell"></i>
      <span v-if="unreadCount" class="notif-badge">{{ unreadCount }}</span>
    </button>

    <Transition name="dropdown">
      <div v-if="open" class="notif-dropdown">
        <div class="notif-header">
          <span>Notifications</span>
          <button v-if="socketStore.notifications.length" class="clear-btn" @click="socketStore.clearNotifications(); open = false">Clear all</button>
        </div>
        <div class="notif-list">
          <div v-if="!socketStore.notifications.length" class="notif-empty">No notifications</div>
          <div
            v-for="n in socketStore.notifications"
            :key="n.id"
            :class="['notif-item', { unread: !n.read }]"
            @click="socketStore.markRead(n.id)"
          >
            <div class="notif-title">{{ n.title }}</div>
            <div class="notif-msg">{{ n.message }}</div>
            <div class="notif-time">{{ timeAgo(n.time) }}</div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSocketStore } from '../store/socket'

const socketStore = useSocketStore()
const open = ref(false)
const wrapper = ref(null)
const ringing = ref(false)

const unreadCount = computed(() => socketStore.notifications.filter(n => !n.read).length)

watch(unreadCount, (newVal, oldVal) => {
  if (newVal > oldVal) {
    ringing.value = true
    setTimeout(() => { ringing.value = false }, 700)
  }
})

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(date).toLocaleDateString()
}

function handleClickOutside(e) {
  if (wrapper.value && !wrapper.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.notif-wrapper {
  position: relative;
}
.notif-btn {
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
  position: relative;
  transition: all 0.2s;
}
.notif-btn:hover {
  background: var(--primary, #6c5ce7);
  color: white;
}
.notif-btn.ringing .bi-bell {
  animation: bell-ring 0.6s ease-in-out;
}
.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.notif-dropdown {
  position: absolute;
  top: 44px;
  right: 0;
  width: 320px;
  max-height: 400px;
  background: var(--dark-surface, #0f172a);
  border: 1px solid var(--dark-border, #334155);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  overflow: hidden;
}
.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--dark-border, #334155);
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary, #f1f5f9);
}
.clear-btn {
  background: none;
  border: none;
  color: var(--primary, #6c5ce7);
  font-size: 12px;
  cursor: pointer;
}
.notif-list {
  max-height: 340px;
  overflow-y: auto;
}
.notif-empty {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary, #94a3b8);
  font-size: 13px;
}
.notif-item {
  padding: 10px 16px;
  border-bottom: 1px solid var(--dark-border, #1e293b);
  cursor: pointer;
  transition: background 0.15s;
}
.notif-item:hover {
  background: var(--dark-card, #1e293b);
}
.notif-item.unread {
  border-left: 3px solid var(--primary, #6c5ce7);
}
.notif-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #f1f5f9);
}
.notif-msg {
  font-size: 12px;
  color: var(--text-secondary, #94a3b8);
  margin-top: 2px;
}
.notif-time {
  font-size: 10px;
  color: var(--text-muted, #64748b);
  margin-top: 4px;
}
</style>

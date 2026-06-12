<template>
  <div class="kitchen-page">

    <div class="kitchen-header">
      <h4><i class="bi bi-fire"></i> Kitchen Dashboard</h4>
      <div class="header-info">
        <span class="live-badge" :class="{ offline: !socketStore.connected }">
          <span class="live-dot anim-pulse"></span>
          {{ socketStore.connected ? 'Live' : 'Offline' }}
        </span>
        <button
          :class="['btn-shift', isClockedIn ? 'clocked-in' : '']"
          @click="toggleShift"
          :disabled="shiftLoading"
        >
          <i :class="isClockedIn ? 'bi bi-stop-circle' : 'bi bi-play-circle'"></i>
          {{ isClockedIn ? 'Clock Out' : 'Clock In' }}
        </button>
        <span class="order-count">{{ orders.length }} Active Orders</span>
        <button class="btn-refresh" @click="fetchOrders">Refresh</button>
      </div>
    </div>

    <div class="filter-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab', activeTab === tab.value ? 'active' : '']"
        @click="activeTab = tab.value"
      >
        {{ tab.label }} ({{ getCount(tab.value) }})
      </button>
    </div>

    <div class="container-fluid mt-4 px-4">

      <div v-if="loading" class="text-center mt-5">Loading orders...</div>

      <div v-else-if="filteredOrders.length === 0" class="text-center mt-5 text-muted-custom">
        No {{ activeTab }} orders
      </div>

      <TransitionGroup name="order-card" tag="div" class="row">
        <div
          v-for="order in filteredOrders"
          :key="order.id"
          class="col-lg-4 col-md-6 mb-4"
        >
          <div :class="['order-card', 'border-' + order.status]">
            <div class="card-top">
              <h5>Order #{{ order.id }}</h5>
              <span :class="'status-badge status-' + order.status">{{ order.status }}</span>
            </div>

            <div class="table-info">
              Table #{{ order.table_number }}
              <span class="time">{{ timeAgo(order.created_at) }}</span>
            </div>

            <div class="items-list">
              <div v-for="item in order.items" :key="item.id" class="item-line">
                <div class="item-name-col">
                  <span>{{ item.quantity }}× {{ item.name }}</span>
                  <div v-if="item.modifiers?.length" class="item-modifiers">
                    <i class="bi bi-pencil-square"></i> {{ item.modifiers.map(m => m.name).join(', ') }}
                  </div>
                  <div v-if="item.notes" class="item-modifiers item-note-text">
                    <i class="bi bi-sticky"></i> {{ item.notes }}
                  </div>
                </div>
                <span class="item-actions">
                  <span :class="['item-status-badge', 'item-status-' + item.status]">{{ item.status }}</span>
                  <button
                    v-if="item.status === 'pending'"
                    class="btn-item-action btn-item-preparing"
                    @click="updateItemStatus(order.id, item.id, 'preparing')"
                  >
                    Start
                  </button>
                  <button
                    v-else-if="item.status === 'preparing'"
                    class="btn-item-action btn-item-ready"
                    @click="updateItemStatus(order.id, item.id, 'ready')"
                  >
                    Ready
                  </button>
                  <i v-else class="bi bi-check-circle-fill item-done-icon"></i>
                </span>
              </div>
            </div>

            <div v-if="order.notes" class="notes">
              <i class="bi bi-sticky"></i> {{ order.notes }}
            </div>

            <div class="card-actions">
              <button
                v-if="order.status === 'confirmed'"
                class="btn-action btn-preparing"
                @click="updateStatus(order.id, 'preparing')"
              >
                Start Preparing
              </button>
              <button
                v-if="order.status === 'preparing'"
                class="btn-action btn-ready"
                @click="updateStatus(order.id, 'ready')"
              >
                Mark Ready
              </button>
              <span v-if="order.status === 'ready'" class="ready-text">
                <i class="bi bi-check-circle"></i> Ready for pickup
              </span>
            </div>
          </div>
        </div>
      </TransitionGroup>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../../services/api'
import { useSocketStore } from '../../store/socket'

const socketStore = useSocketStore()
const orders = ref([])
const loading = ref(true)
const activeTab = ref('all')

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'confirmed', label: 'New' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' }
]

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return orders.value
  return orders.value.filter(o => o.status === activeTab.value)
})

const getCount = (status) => {
  if (status === 'all') return orders.value.length
  return orders.value.filter(o => o.status === status).length
}

const fetchOrders = async () => {
  try {
    const res = await api.get('/kitchen/orders')
    orders.value = res.data.data
  } catch (err) {
    console.error('Failed to fetch kitchen orders')
  } finally {
    loading.value = false
  }
}

const updateStatus = async (id, status) => {
  try {
    await api.put(`/kitchen/orders/${id}/status`, { status })
    fetchOrders()
  } catch (err) {
    console.error(err.response?.data?.message || 'Failed to update status')
  }
}

const updateItemStatus = async (orderId, itemId, status) => {
  try {
    await api.put(`/kitchen/orders/${orderId}/items/${itemId}/status`, { status })
    fetchOrders()
  } catch (err) {
    console.error(err.response?.data?.message || 'Failed to update item status')
  }
}

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  return `${Math.floor(diff / 60)}h ${diff % 60}m ago`
}

const isClockedIn = ref(false)
const shiftLoading = ref(false)

const checkShiftStatus = async () => {
  try {
    const res = await api.get('/shifts/my')
    isClockedIn.value = res.data.data.isClockedIn
  } catch {}
  return isClockedIn.value
}

const toggleShift = async () => {
  shiftLoading.value = true
  try {
    const currentlyClockedIn = await checkShiftStatus()
    if (currentlyClockedIn) {
      await api.post('/shifts/clock-out', {})
      isClockedIn.value = false
    } else {
      const res = await api.post('/shifts/clock-in')
      isClockedIn.value = true
      if (res.data.data?.alreadyClockedIn) console.log('Already clocked in — continuing shift')
    }
  } catch (err) {
    console.error(err.response?.data?.message || 'Shift action failed')
  } finally {
    await checkShiftStatus()
    shiftLoading.value = false
  }
}

const setupSocketListeners = () => {
  if (socketStore.socket) {
    socketStore.socket.off('new-order')
    socketStore.socket.off('order-paid')
    socketStore.socket.off('order-status-changed')
    socketStore.socket.off('order-item-status-changed')
    socketStore.socket.on('new-order', fetchOrders)
    socketStore.socket.on('order-paid', fetchOrders)
    socketStore.socket.on('order-status-changed', fetchOrders)
    socketStore.socket.on('order-item-status-changed', fetchOrders)
  }
}

const cleanupSocketListeners = () => {
  if (socketStore.socket) {
    socketStore.socket.off('new-order', fetchOrders)
    socketStore.socket.off('order-paid', fetchOrders)
    socketStore.socket.off('order-status-changed', fetchOrders)
    socketStore.socket.off('order-item-status-changed', fetchOrders)
  }
}

onMounted(async () => {
  await fetchOrders()
  await checkShiftStatus()
  socketStore.connect()
  setTimeout(setupSocketListeners, 500)
})

onUnmounted(() => {
  cleanupSocketListeners()
})
</script>

<style scoped>
.kitchen-page {
  background: var(--dark);
  min-height: 100vh;
  color: var(--text-primary);
}

.kitchen-header {
  padding: 20px 30px;
  background: var(--dark-card);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.order-count {
  color: var(--secondary);
  font-weight: 600;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 20px;
  background: var(--secondary-light);
  color: var(--secondary);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.live-badge.offline {
  background: rgba(239, 68, 68, 0.12);
  color: var(--danger);
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--secondary);
}

.live-badge.offline .live-dot {
  background: var(--danger);
  animation: none;
}

.btn-refresh {
  background: var(--dark-hover);
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  color: var(--text-primary);
}

.filter-tabs {
  display: flex;
  gap: 8px;
  padding: 15px 30px;
  background: var(--dark-surface);
  border-bottom: 1px solid var(--dark-border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 480px) {
  .filter-tabs {
    padding: 12px 16px;
    gap: 6px;
  }
  .tab {
    padding: 8px 14px;
    font-size: 13px;
    white-space: nowrap;
  }
}

.tab {
  padding: 8px 18px;
  border-radius: 10px;
  border: none;
  background: var(--dark-hover);
  color: var(--text-secondary);
  cursor: pointer;
  transition: 0.3s;
}

.tab.active {
  background: var(--primary);
  color: #fff;
}

.order-card {
  background: var(--dark-card);
  border-radius: 15px;
  padding: 20px;
  border-left: 4px solid var(--dark-border);
}

.border-confirmed { border-left-color: #f59e0b; }
.border-preparing { border-left-color: #3b82f6; }
.border-ready { border-left-color: #10b981; }

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.card-top h5 { margin: 0; }

.table-info {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
}

.time { color: var(--text-muted); }

.items-list {
  background: var(--dark-surface);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}

.item-line {
  padding: 4px 0;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.item-name-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-modifiers {
  font-size: 11px;
  color: var(--text-secondary);
}

.item-note-text {
  color: #f59e0b;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.item-status-badge {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 8px;
  border-radius: 10px;
}

.item-status-pending { background: rgba(148,163,184,0.15); color: #94a3b8; }
.item-status-preparing { background: rgba(249,115,22,0.15); color: #f97316; }
.item-status-ready { background: rgba(16,185,129,0.15); color: #10b981; }
.item-status-served { background: rgba(71,85,105,0.15); color: #94a3b8; }

.btn-item-action {
  border: none;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: 0.2s;
}

.btn-item-preparing { background: #3b82f6; }
.btn-item-ready { background: #10b981; }

.item-done-icon {
  color: #10b981;
  font-size: 16px;
}

.notes {
  font-size: 13px;
  color: #f59e0b;
  margin-bottom: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  transition: 0.3s;
}

.btn-preparing { background: #3b82f6; }
.btn-ready { background: #10b981; }

.ready-text {
  color: #10b981;
  font-weight: 600;
}

.status-confirmed { background: rgba(59,130,246,0.15); color: #3b82f6; }
.status-preparing { background: rgba(249,115,22,0.15); color: #f97316; }
.status-ready { background: rgba(168,85,247,0.15); color: #a855f7; }

.text-muted-custom { color: var(--text-secondary); }

.btn-shift {
  background: #10b981;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-shift.clocked-in {
  background: #ef4444;
}

.btn-shift:disabled {
  opacity: 0.5;
}

@media (max-width: 768px) {
  .kitchen-header {
    padding: 14px 16px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .header-info {
    flex-wrap: wrap;
    gap: 8px;
  }

  .filter-tabs {
    padding: 10px 12px;
    gap: 6px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .container-fluid {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
}

@media (max-width: 480px) {
  .kitchen-header h4 { font-size: 1rem; }
  .order-card { padding: 14px; }
  .btn-action { padding: 10px; font-size: 13px; }
}
</style>

<template>
  <div class="waiter-dash">

    <div class="dash-header">
      <h4><i class="bi bi-bell"></i> Waiter Dashboard</h4>
      <div class="header-info">
        <span class="live-badge" :class="{ offline: !socketStore.connected }">
          <span class="live-dot anim-pulse"></span>
          {{ socketStore.connected ? 'Live' : 'Offline' }}
        </span>
        <router-link to="/waiter/new-order" class="btn-new-order">
          <i class="bi bi-plus-circle"></i> New Order
        </router-link>
        <button
          :class="['btn-shift', isClockedIn ? 'clocked-in' : '']"
          @click="toggleShift"
          :disabled="shiftLoading"
        >
          <i :class="isClockedIn ? 'bi bi-stop-circle' : 'bi bi-play-circle'"></i>
          {{ isClockedIn ? 'Clock Out' : 'Clock In' }}
        </button>
        <span class="ready-count" v-if="readyCount">{{ readyCount }} Ready to Serve</span>
        <span class="pending-count" v-if="pendingCount">{{ pendingCount }} Requests</span>
        <span class="payment-count" v-if="paymentCount">{{ paymentCount }} Payments Pending</span>
        <button class="btn-refresh" @click="fetchAll">Refresh</button>
      </div>
    </div>

    <div class="view-tabs">
      <button :class="['tab', view === 'orders' ? 'active' : '']" @click="view = 'orders'">
        <i class="bi bi-receipt"></i> Orders ({{ orders.length }})
      </button>
      <button :class="['tab', view === 'requests' ? 'active' : '']" @click="view = 'requests'">
        <i class="bi bi-bell"></i> Requests ({{ requests.length }})
      </button>
      <button :class="['tab', view === 'payments' ? 'active' : '']" @click="view = 'payments'">
        <i class="bi bi-cash-stack"></i> Payments ({{ paymentCount }})
      </button>
      <button :class="['tab', view === 'tables' ? 'active' : '']" @click="view = 'tables'">
        <i class="bi bi-columns-gap"></i> Tables ({{ waiterTables.length }})
      </button>
    </div>

    <div class="container-fluid mt-4 px-4">

      <template v-if="view === 'orders'">

        <div v-if="loadingOrders" class="text-center mt-5">Loading orders...</div>

        <div v-else-if="orders.length === 0" class="empty-state">
          <div class="empty-icon"><i class="bi bi-receipt"></i></div>
          <p>No orders ready for delivery</p>
        </div>

        <TransitionGroup name="order-card" tag="div" class="row" v-else>
          <div v-for="order in orders" :key="order.id" class="col-lg-4 col-md-6 mb-4">
            <div :class="['order-card', 'border-' + order.status]">

              <div class="card-top">
                <h5>Order #{{ order.id }}</h5>
                <span :class="'status-badge status-' + order.status">{{ order.status }}</span>
              </div>

              <div class="table-info">
                <span class="table-badge">Table #{{ order.table_number }}</span>
                <span class="time">{{ timeAgo(order.created_at) }}</span>
              </div>

              <div class="items-list">
                <div v-for="item in order.items" :key="item.id" class="item-line">
                  <span>{{ item.quantity }}x {{ item.name }}</span>
                </div>
              </div>

              <div class="card-actions">
                <button
                  v-if="order.status === 'ready'"
                  class="btn-action btn-deliver"
                  @click="updateOrderStatus(order.id, 'served')"
                >
                  <i class="bi bi-check-circle"></i> Mark Delivered
                </button>
                <button
                  v-if="order.status === 'served'"
                  class="btn-action btn-complete"
                  @click="updateOrderStatus(order.id, 'completed')"
                >
                  <i class="bi bi-check-lg"></i> Complete
                </button>
              </div>

            </div>
          </div>
        </TransitionGroup>
      </template>

      <template v-else-if="view === 'requests'">

        <div v-if="loadingRequests" class="text-center mt-5">Loading requests...</div>

        <div v-else-if="requests.length === 0" class="empty-state">
          <div class="empty-icon"><i class="bi bi-bell"></i></div>
          <p>No pending requests</p>
        </div>

        <TransitionGroup name="order-card" tag="div" class="row" v-else>
          <div v-for="req in requests" :key="req.id" class="col-lg-4 col-md-6 mb-4">
            <div :class="['request-card', req.status === 'handled' ? 'handled' : '']">

              <div class="card-top">
                <span class="table-num">Table #{{ req.table_number }}</span>
                <span :class="'status-badge status-' + req.status">{{ req.status }}</span>
              </div>

              <div class="request-type">
                <span class="type-icon"><i :class="'bi bi-' + getIcon(req.type)"></i></span>
                <span class="type-label">{{ getLabel(req.type) }}</span>
              </div>
              <p v-if="req.type === 'bill'" class="request-hint">Bring the receipt from the cashier for payment</p>

              <div class="request-time">{{ formatTime(req.created_at) }}</div>

              <button
                v-if="req.status === 'pending'"
                class="btn-handle"
                @click="markHandled(req.id)"
              >
                Mark as Handled
              </button>
              <div v-else class="handled-text"><i class="bi bi-check-circle"></i> Handled</div>

            </div>
          </div>
        </TransitionGroup>
      </template>

      <template v-else-if="view === 'tables'">
        <div v-if="loadingTables" class="text-center mt-5">Loading tables...</div>
        <div v-else-if="waiterTables.length === 0" class="empty-state">
          <div class="empty-icon"><i class="bi bi-columns-gap"></i></div>
          <p>No tables assigned</p>
        </div>
        <div v-else class="row">
          <div v-for="table in waiterTables" :key="table.id" class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div :class="['table-card', 'table-' + table.status]">
              <div class="table-main">Table #{{ table.table_number }}</div>
              <div class="table-meta">{{ table.capacity }} seats</div>
              <span :class="'status-badge status-' + table.status">{{ table.status }}</span>
              <button
                class="btn-make-available"
                :disabled="table.status === 'available' || releasingTableId === table.id"
                @click="makeTableAvailable(table)"
              >
                {{ releasingTableId === table.id ? 'Updating...' : 'Make Available' }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <div v-show="view === 'payments'">
        <PendingPaymentsPanel ref="paymentsPanel" @update:count="paymentCount = $event" />
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../../services/api'
import { useSocketStore } from '../../store/socket'
import { useToastStore } from '../../store/toast'
import { useAuthStore } from '../../store/auth'
import PendingPaymentsPanel from '../../components/PendingPaymentsPanel.vue'

const socketStore = useSocketStore()
const toast = useToastStore()
const auth = useAuthStore()
const view = ref('orders')
const orders = ref([])
const requests = ref([])
const waiterTables = ref([])
const paymentCount = ref(0)
const paymentsPanel = ref(null)
const loadingOrders = ref(true)
const loadingRequests = ref(true)
const loadingTables = ref(true)
const releasingTableId = ref(null)

const readyCount = computed(() => orders.value.filter(o => o.status === 'ready').length)
const pendingCount = computed(() => requests.value.filter(r => r.status === 'pending').length)

const fetchOrders = async () => {
  try {
    const res = await api.get('/waiter-requests/orders')
    orders.value = res.data.data
  } catch (err) {
    console.error('Failed to fetch waiter orders')
  } finally {
    loadingOrders.value = false
  }
}

const fetchRequests = async () => {
  try {
    const res = await api.get('/waiter-requests')
    requests.value = res.data.data
  } catch (err) {
    console.error('Failed to fetch requests')
  } finally {
    loadingRequests.value = false
  }
}

const fetchTables = async () => {
  loadingTables.value = true
  try {
    const res = await api.get('/tables')
    const userId = auth.user?.id
    waiterTables.value = (res.data.data || []).filter(t => t.waiter_id === userId)
  } catch (err) {
    console.error('Failed to fetch tables')
  } finally {
    loadingTables.value = false
  }
}

const fetchAll = () => {
  fetchOrders()
  fetchRequests()
  fetchTables()
}

const makeTableAvailable = async (table) => {
  releasingTableId.value = table.id
  try {
    try {
      await api.post('/tables/sessions/close', { table_id: table.id })
    } catch (err) {
      if (err.response?.status !== 404) throw err
      await api.put(`/tables/${table.id}/status`, { status: 'available' })
    }
    toast.success(`Table #${table.table_number} is available`)
    fetchTables()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Could not make table available')
  } finally {
    releasingTableId.value = null
  }
}

const updateOrderStatus = async (id, status) => {
  try {
    await api.put(`/waiter-requests/orders/${id}/status`, { status })
    fetchOrders()
  } catch (err) {
    console.error(err.response?.data?.message || 'Failed to update')
  }
}

const markHandled = async (id) => {
  try {
    await api.put(`/waiter-requests/${id}/handled`)
    fetchRequests()
  } catch (err) {
    console.error('Failed to update request')
  }
}

const getIcon = (type) => {
  const icons = { help: 'person-raised-hand', water: 'droplet', salt: 'cup-hot', cleaning: 'stars', complaint: 'chat-left-text', bill: 'receipt' }
  return icons[type] || 'question-circle'
}

const getLabel = (type) => {
  if (type === 'bill') return 'Bill requested'
  return type
}

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  return `${Math.floor(diff / 60)}h ${diff % 60}m ago`
}

const formatTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric'
  })
}

const isClockedIn = ref(false)
const shiftLoading = ref(false)

const checkShiftStatus = async () => {
  try {
    const res = await api.get('/shifts/my')
    isClockedIn.value = res.data.data.isClockedIn
    return isClockedIn.value
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
      toast.success('Clocked out successfully')
    } else {
      const res = await api.post('/shifts/clock-in')
      isClockedIn.value = true
      toast.success('Clocked in successfully')
      if (res.data.data?.alreadyClockedIn) toast.info('Resuming existing shift')
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Shift action failed'
    toast.error(message)
    console.error(message)
  } finally {
    await checkShiftStatus()
    shiftLoading.value = false
  }
}

const setupSocketListeners = () => {
  const socket = socketStore.socket
  if (socket) {
    socket.off('new-order', fetchAll)
    socket.off('order-ready', fetchAll)
    socket.off('order-status-changed', fetchAll)
    socket.off('new-waiter-request', fetchAll)
    socket.off('pending-payment', onPendingPayment)
    socket.off('table-available', onTableAvailable)
    socket.on('new-order', fetchAll)
    socket.on('order-ready', fetchAll)
    socket.on('order-status-changed', fetchAll)
    socket.on('new-waiter-request', fetchAll)
    socket.on('pending-payment', onPendingPayment)
    socket.on('table-available', onTableAvailable)
  }
}

const cleanupSocketListeners = () => {
  const socket = socketStore.socket
  if (socket) {
    socket.off('new-order', fetchAll)
    socket.off('order-ready', fetchAll)
    socket.off('order-status-changed', fetchAll)
    socket.off('new-waiter-request', fetchAll)
    socket.off('pending-payment', onPendingPayment)
    socket.off('table-available', onTableAvailable)
  }
}

const onTableAvailable = (data) => {
  if (data.reason === 'released') {
    toast.info(`Table #${data.table_number} is now available`)
  } else {
    toast.info(`Table #${data.table_number} is now available and needs cleaning`)
  }
  fetchAll()
}

const onPendingPayment = (data) => {
  toast.info(`Payment needed for order #${data.order_id}. Please collect after the guest finishes.`)
  fetchAll()
}

onMounted(async () => {
  await fetchAll()
  await checkShiftStatus()
  socketStore.connect()
  setTimeout(setupSocketListeners, 500)
})

onUnmounted(() => {
  cleanupSocketListeners()
})
</script>

<style scoped>
.waiter-dash {
  background: var(--dark);
  min-height: 100vh;
  color: var(--text-primary);
}

.dash-header {
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

.btn-new-order {
  background: #10b981;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  color: white;
  text-decoration: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: 0.2s;
}

.btn-new-order:hover {
  background: #059669;
}

.ready-count {
  color: var(--secondary);
  font-weight: 600;
}

.pending-count {
  color: #f59e0b;
  font-weight: 600;
}

.payment-count {
  color: #10b981;
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

.view-tabs {
  display: flex;
  gap: 8px;
  padding: 15px 30px;
  border-bottom: 1px solid var(--dark-border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 480px) {
  .view-tabs {
    padding: 12px 16px;
  }
  .dash-header {
    flex-wrap: wrap;
    gap: 10px;
    padding: 14px 16px;
  }
  .header-info {
    flex-wrap: wrap;
    gap: 8px;
  }
}

.tab {
  padding: 10px 22px;
  border-radius: 10px;
  border: none;
  background: var(--dark-hover);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.tab.active {
  background: var(--primary);
  color: #fff;
}


.empty-state {
  text-align: center;
  margin-top: 80px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 10px;
  color: var(--text-muted);
}


.order-card {
  background: var(--dark-card);
  border-radius: 15px;
  padding: 20px;
  border-left: 4px solid var(--secondary);
}

.order-card.border-served {
  border-left-color: #10b981;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-top h5 {
  margin: 0;
  font-size: 16px;
}

.table-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.table-badge {
  background: var(--dark-hover);
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.time {
  color: var(--text-muted);
  font-size: 12px;
}

.items-list {
  margin-bottom: 14px;
}

.item-line {
  color: var(--text-secondary);
  font-size: 13px;
  padding: 3px 0;
}

.card-actions {
  margin-top: 8px;
}

.btn-action {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: 0.3s;
}

.btn-deliver {
  background: #00cec9;
}

.btn-deliver:hover {
  background: #00b5b0;
}

.btn-complete {
  background: #10b981;
}

.btn-complete:hover {
  background: #059669;
}


.request-card {
  background: var(--dark-card);
  border-radius: 15px;
  padding: 20px;
  border-left: 4px solid #f59e0b;
}

.request-card.handled {
  border-left-color: #10b981;
  opacity: 0.7;
}

.table-num {
  font-weight: 700;
  font-size: 16px;
}

.request-type {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.type-icon {
  font-size: 24px;
  color: var(--primary);
}

.type-label {
  font-size: 18px;
  font-weight: 600;
  text-transform: capitalize;
}

.request-hint {
  color: var(--text-muted);
  font-size: 12px;
  margin: -4px 0 10px;
}

.request-time {
  color: var(--text-muted);
  font-size: 13px;
  margin-bottom: 15px;
}

.btn-handle {
  width: 100%;
  padding: 10px;
  background: #00cec9;
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
}

.handled-text {
  text-align: center;
  color: #10b981;
  font-weight: 600;
}

.table-card {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 14px;
  padding: 18px;
  text-align: center;
}

.table-main {
  font-size: 20px;
  font-weight: 800;
  color: var(--primary);
}

.table-meta {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 4px 0 10px;
}

.btn-make-available {
  width: 100%;
  margin-top: 14px;
  padding: 10px;
  border: none;
  border-radius: 10px;
  color: white;
  background: var(--secondary);
  font-weight: 700;
}

.btn-make-available:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.status-ready { background: rgba(168,85,247,0.15); color: #a855f7; }
.status-served { background: rgba(16,185,129,0.15); color: #10b981; }
.status-pending { background: rgba(245,158,11,0.15); color: #f59e0b; }
.status-handled { background: rgba(16,185,129,0.15); color: #10b981; }
.status-available { background: rgba(16,185,129,0.15); color: #10b981; }
.status-occupied { background: rgba(239,68,68,0.15); color: #ef4444; }
.status-reserved { background: rgba(245,158,11,0.15); color: #f59e0b; }

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
  .dash-header {
    padding: 14px 16px;
    gap: 10px;
  }

  .header-info {
    flex-wrap: wrap;
    gap: 8px;
  }

  .view-tabs {
    padding: 10px 12px;
    gap: 6px;
  }

  .container-fluid {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
}

@media (max-width: 480px) {
  .dash-header h4 {
    font-size: 1rem;
  }

  .order-card, .request-card {
    padding: 14px;
  }

  .btn-action {
    padding: 10px;
    font-size: 13px;
  }
}
</style>

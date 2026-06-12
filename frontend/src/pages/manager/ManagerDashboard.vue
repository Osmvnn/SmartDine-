<template>
  <div class="manager-dash">

    <div class="dash-header">
      <h4><i class="bi bi-graph-up"></i> Manager Dashboard</h4>
      <div class="header-actions">
        <button v-if="pushSupported && !pushEnabled" class="btn-push-toggle" @click="enablePush" :disabled="pushLoading">
          <i class="bi bi-bell"></i> {{ pushLoading ? 'Enabling...' : 'Enable Push Alerts' }}
        </button>
        <span v-else-if="pushEnabled" class="btn-push-toggle enabled">
          <i class="bi bi-bell-fill"></i> Push Alerts On
        </span>
        <span class="live-badge" :class="{ offline: !socketStore.connected }">
          <span class="live-dot anim-pulse"></span>
          {{ socketStore.connected ? 'Live' : 'Offline' }}
        </span>
      </div>
    </div>

    <div class="container-fluid mt-4 px-4">

      <div class="row mb-4">
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card gradient-1">
            <div class="stat-info">
              <p>Today's Revenue</p>
              <h3>{{ formatAmount(stats.todayRevenue || 0) }}</h3>
            </div>
            <span class="stat-icon"><i class="bi bi-currency-dollar"></i></span>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card gradient-2">
            <div class="stat-info">
              <p>Today's Orders</p>
              <h3>{{ stats.todayOrders || 0 }}</h3>
            </div>
            <span class="stat-icon"><i class="bi bi-box-seam"></i></span>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card gradient-3">
            <div class="stat-info">
              <p>Active Tables</p>
              <h3>{{ stats.activeTables || 0 }} / {{ stats.totalTables || 0 }}</h3>
            </div>
            <span class="stat-icon"><i class="bi bi-columns-gap"></i></span>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card gradient-4">
            <div class="stat-info">
              <p>Avg Order Value</p>
              <h3>{{ formatAmount(stats.avgOrderValue || 0) }}</h3>
            </div>
            <span class="stat-icon"><i class="bi bi-graph-up-arrow"></i></span>
          </div>
        </div>
      </div>

      <div v-if="stats.lowStockItems?.length" class="alert-banner mb-4">
        <div class="alert-header">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>Low Stock Alert</span>
        </div>
        <div class="alert-items">
          <span
            v-for="item in stats.lowStockItems"
            :key="item.id"
            :class="['stock-pill', Number(item.stock_quantity) === 0 ? 'out' : 'low']"
          >
            {{ item.name }}: {{ Number(item.stock_quantity) === 0 ? 'Out of stock' : `${item.stock_quantity} left` }}
          </span>
        </div>
      </div>

      <h6 class="section-label">Analytics</h6>
      <div class="row mb-3">
        <div class="col-lg-4 col-md-6 mb-3">
          <div class="link-card" @click="$router.push('/manager/sales')">
            <h5><i class="bi bi-graph-up"></i> Sales Analytics</h5>
            <p>View revenue trends and top items</p>
          </div>
        </div>
        <div class="col-lg-4 col-md-6 mb-3">
          <div class="link-card" @click="$router.push('/manager/tables')">
            <h5><i class="bi bi-columns-gap"></i> Table Statistics</h5>
            <p>Table occupancy and performance</p>
          </div>
        </div>
        <div class="col-lg-4 col-md-6 mb-3">
          <div class="link-card info-card">
            <h5><i class="bi bi-clipboard-data"></i> Summary</h5>
            <p>{{ stats.pendingOrders || 0 }} pending · {{ stats.completedToday || 0 }} completed today</p>
          </div>
        </div>
      </div>

      <h6 class="section-label">Operations</h6>
      <div class="row">
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="link-card" @click="$router.push('/manager/reservations')">
            <h5><i class="bi bi-calendar-check"></i> Reservations</h5>
            <p>Manage table bookings and requests</p>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="link-card" @click="$router.push('/manager/shifts')">
            <h5><i class="bi bi-person-clock"></i> Staff Shifts</h5>
            <p>View and manage staff clock-in records</p>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="link-card" @click="$router.push('/manager/inventory')">
            <h5><i class="bi bi-box-seam"></i> Inventory</h5>
            <p>Update stock levels and availability</p>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="link-card" @click="$router.push('/manager/promos')">
            <h5><i class="bi bi-tag"></i> Promo Codes</h5>
            <p>Create and manage discount codes</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '../../services/api'
import { useSocketStore } from '../../store/socket'
import { useToastStore } from '../../store/toast'
import { isPushSupported, getPushSubscription, subscribeToPush } from '../../utils/push'
import { formatMoney, getCurrency } from '../../utils/currency'

const socketStore = useSocketStore()
const toast = useToastStore()
const stats = ref({})

const currency = ref(getCurrency())
const formatAmount = (amount) => formatMoney(amount, currency.value)
const onCurrencyChanged = (event) => { currency.value = event.detail || getCurrency() }

const pushSupported = ref(false)
const pushEnabled = ref(false)
const pushLoading = ref(false)

const enablePush = async () => {
  pushLoading.value = true
  try {
    await subscribeToPush()
    pushEnabled.value = true
    toast.success('Push alerts enabled for new reservations')
  } catch (err) {
    toast.error(err.message || 'Failed to enable push alerts')
  } finally {
    pushLoading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await api.get('/manager/dashboard')
    stats.value = res.data.data
  } catch (err) {
    console.error('Failed to load dashboard')
  }
}

const events = ['new-order', 'order-status-changed', 'order-paid', 'payment-confirmed', 'table-available', 'low-stock-alert']

const setupSocketListeners = () => {
  const socket = socketStore.socket
  if (socket) {
    events.forEach(evt => {
      socket.off(evt, fetchStats)
      socket.on(evt, fetchStats)
    })
  }
}

const cleanupSocketListeners = () => {
  const socket = socketStore.socket
  if (socket) {
    events.forEach(evt => socket.off(evt, fetchStats))
  }
}

onMounted(() => {
  fetchStats()
  socketStore.connect()
  setTimeout(setupSocketListeners, 500)

  pushSupported.value = isPushSupported()
  if (pushSupported.value) {
    getPushSubscription().then(sub => { pushEnabled.value = !!sub }).catch(() => {})
  }

  window.addEventListener('currency-changed', onCurrencyChanged)
})

onUnmounted(() => {
  cleanupSocketListeners()
  window.removeEventListener('currency-changed', onCurrencyChanged)
})
</script>

<style scoped>
.manager-dash { background: var(--dark); min-height: 100vh; color: var(--text-primary); }
.dash-header {
  padding: 20px 30px;
  background: var(--dark-card);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-push-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid var(--primary);
  background: transparent;
  color: var(--primary);
  cursor: pointer;
  transition: 0.2s;
}

.btn-push-toggle:hover:not(:disabled) {
  background: var(--primary);
  color: #fff;
}

.btn-push-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-push-toggle.enabled {
  background: rgba(16, 185, 129, 0.12);
  border-color: #10b981;
  color: #10b981;
  cursor: default;
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

.stat-card {
  border-radius: 15px;
  padding: 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
}

.gradient-1 { background: linear-gradient(135deg, #6c5ce7, #a29bfe); }
.gradient-2 { background: linear-gradient(135deg, #00cec9, #55efc4); }
.gradient-3 { background: linear-gradient(135deg, #fdcb6e, #e17055); }
.gradient-4 { background: linear-gradient(135deg, #0984e3, #74b9ff); }

.stat-info p { margin: 0; font-size: 13px; opacity: 0.9; }
.stat-info h3 { margin: 5px 0 0; font-size: 24px; font-weight: 700; }
.stat-icon { font-size: 28px; opacity: 0.9; }

.link-card {
  background: var(--dark-card);
  border-radius: 15px;
  padding: 25px;
  cursor: pointer;
  transition: 0.3s;
}

.link-card:hover { transform: translateY(-3px); background: var(--dark-hover); }
.link-card h5 { margin-bottom: 8px; }
.link-card p { color: var(--text-secondary); font-size: 14px; margin: 0; }

.info-card { cursor: default; }
.info-card:hover { transform: none; background: var(--dark-card); }

.section-label {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 14px;
  margin-top: 4px;
}

.alert-banner {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 16px 20px;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--danger);
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 10px;
}

.alert-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stock-pill {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.stock-pill.low {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.stock-pill.out {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
}
</style>

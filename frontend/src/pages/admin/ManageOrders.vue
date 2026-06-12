<template>
  <div class="manage-page">
    <div class="page-header">
      <h4><i class="bi bi-receipt"></i> Manage Orders</h4>
      <div class="header-actions">
        <select v-model="statusFilter" class="filter-select" @change="onFilterChange">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="served">Served</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button class="btn-refresh" @click="fetchOrders(pagination.page)">Refresh</button>
      </div>
    </div>

    <div class="container-fluid mt-4 px-4">

      <h6 class="section-label">Daily History</h6>
      <div class="section-card mb-4 history-card">
        <div class="history-top">
          <p class="history-hint">Select a day to view its orders, or pick a custom date</p>
          <input v-model="customDate" type="date" class="filter-input" @change="onCustomDate" />
        </div>
        <div class="day-list">
          <div
            v-for="d in history"
            :key="d.date"
            :class="['day-chip', selectedDate === d.date ? 'active' : '']"
            @click="selectDate(d.date)"
          >
            <span class="day-label">{{ formatDayShort(d.date) }}</span>
            <span class="day-orders">{{ d.order_count }} orders</span>
            <span class="day-revenue">{{ formatAmount(d.revenue) }}</span>
          </div>
          <template v-if="historyLoading">
            <div v-for="n in 5" :key="'ph'+n" class="day-chip placeholder"></div>
          </template>
        </div>
      </div>

      <div class="table-card">
        <div class="perf-header">
          <h5 class="mb-0">Orders</h5>
          <span class="date-badge">{{ formatDayFull(selectedDate) }}</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Table</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td>#{{ order.id }}</td>
              <td>Table {{ order.table_number }}</td>
              <td>
                <span v-for="(item, i) in order.items" :key="item.id">
                  {{ item.quantity }}× {{ item.name }}{{ i < order.items.length - 1 ? ', ' : '' }}
                </span>
              </td>
              <td>{{ formatAmount(order.total) }}</td>
              <td>
                <span :class="'status-badge status-' + order.status">{{ order.status }}</span>
              </td>
              <td>{{ formatDate(order.created_at) }}</td>
              <td>
                <select
                  class="status-select"
                  :value="order.status"
                  @change="updateStatus(order.id, $event.target.value)"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="served">Served</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!loading && orders.length === 0" class="text-center mt-4 text-muted-custom">
          No orders found for this day
        </div>

        <div v-if="pagination.pages > 1" class="pagination-bar">
          <button class="page-btn" :disabled="pagination.page <= 1" @click="fetchOrders(pagination.page - 1)">← Prev</button>
          <span class="page-info">Page {{ pagination.page }} of {{ pagination.pages }} ({{ pagination.total }} orders)</span>
          <button class="page-btn" :disabled="pagination.page >= pagination.pages" @click="fetchOrders(pagination.page + 1)">Next →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useToastStore } from '../../store/toast'
const toast = useToastStore()
import api from '../../services/api'
import { formatMoney, getCurrency } from '../../utils/currency'

const orders = ref([])
const currency = ref(getCurrency())
const formatAmount = (amount) => formatMoney(amount, currency.value)
const onCurrencyChanged = (event) => { currency.value = event.detail || getCurrency() }
const history = ref([])
const statusFilter = ref('')
const loading = ref(true)
const historyLoading = ref(true)
const pagination = ref({ page: 1, limit: 20, total: 0, pages: 1 })

const todayStr = () => new Date().toISOString().split('T')[0]
const yesterdayStr = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

const selectedDate = ref(todayStr())
const customDate = ref(todayStr())

const formatDayShort = (dateStr) => {
  if (dateStr === todayStr()) return 'Today'
  if (dateStr === yesterdayStr()) return 'Yesterday'
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const formatDayFull = (dateStr) => {
  if (dateStr === todayStr()) return 'Today'
  if (dateStr === yesterdayStr()) return 'Yesterday'
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

const fetchOrders = async (page = 1) => {
  loading.value = true
  try {
    const params = { date: selectedDate.value, page, limit: pagination.value.limit }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await api.get('/admin/orders', { params })
    orders.value = res.data.data
    pagination.value = res.data.pagination
  } catch (err) {
    console.error('Failed to fetch orders')
  } finally {
    loading.value = false
  }
}

const fetchHistory = async () => {
  historyLoading.value = true
  try {
    const res = await api.get('/admin/orders/history', { params: { days: 14 } })
    const rows = res.data.data || []
    if (!rows.some(r => r.date === todayStr())) {
      rows.unshift({ date: todayStr(), order_count: 0, revenue: 0 })
    }
    history.value = rows
  } catch (err) {
    console.error('Failed to fetch order history')
  } finally {
    historyLoading.value = false
  }
}

const selectDate = (date) => {
  if (selectedDate.value === date) return
  selectedDate.value = date
  customDate.value = date
  fetchOrders(1)
}

const onCustomDate = () => {
  if (!customDate.value || customDate.value === selectedDate.value) return
  selectedDate.value = customDate.value
  fetchOrders(1)
}

const onFilterChange = () => fetchOrders(1)

const updateStatus = async (id, status) => {
  try {
    await api.put(`/orders/${id}/status`, { status })
    fetchOrders(pagination.value.page)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to update')
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

onMounted(() => {
  fetchOrders(1)
  fetchHistory()
  window.addEventListener('currency-changed', onCurrencyChanged)
})

onUnmounted(() => {
  window.removeEventListener('currency-changed', onCurrencyChanged)
})
</script>

<style scoped>
.manage-page { background: var(--dark); min-height: 100vh; color: var(--text-primary); }
.page-header { padding: 20px 30px; background: var(--dark-card); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }

.header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.filter-select { background: var(--dark-surface); border: 1px solid var(--dark-border); color: var(--text-primary); padding: 8px 12px; border-radius: 8px; }
.btn-refresh { background: var(--dark-hover); border: none; padding: 8px 16px; border-radius: 8px; color: var(--text-primary); }

.section-label {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 14px;
  margin-top: 4px;
}

.section-card { background: var(--dark-card); border-radius: 15px; padding: 25px; overflow-x: auto; -webkit-overflow-scrolling: touch; }

.history-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; }
.history-hint { color: var(--text-secondary); font-size: 13px; margin: 0; }

.day-list { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
.day-chip {
  flex: 0 0 auto;
  min-width: 110px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  cursor: pointer;
  transition: 0.2s;
}
.day-chip:hover { border-color: var(--primary); }
.day-chip.active { border-color: var(--primary); background: var(--primary-light); }
.day-chip.placeholder { opacity: 0.3; pointer-events: none; }
.day-label { font-weight: 700; font-size: 13px; color: var(--text-primary); }
.day-orders { font-size: 12px; color: var(--text-secondary); }
.day-revenue { font-size: 13px; font-weight: 600; color: var(--amount-color); }

.perf-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 10px; flex-wrap: wrap; }
.date-badge {
  background: var(--primary-light);
  color: var(--primary);
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid var(--dark-border);
  border-radius: 8px;
  background: var(--dark-surface);
  color: var(--text-primary);
  font-size: 13px;
}

.table-card { background: var(--dark-card); border: 1px solid var(--dark-border); border-radius: 15px; padding: 20px; overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { text-align: left; padding: 12px; color: var(--text-secondary); font-size: 13px; border-bottom: 1px solid var(--dark-border); }
.data-table td { padding: 12px; border-bottom: 1px solid var(--dark-border); font-size: 14px; }

.status-select { background: var(--dark-hover); border: none; color: var(--text-primary); padding: 5px 8px; border-radius: 6px; font-size: 13px; }

.status-pending { background: rgba(245,158,11,0.15); color: #f59e0b; }
.status-confirmed { background: rgba(59,130,246,0.15); color: #3b82f6; }
.status-preparing { background: rgba(249,115,22,0.15); color: #f97316; }
.status-ready { background: rgba(168,85,247,0.15); color: #a855f7; }
.status-served { background: rgba(16,185,129,0.15); color: #10b981; }
.status-completed { background: rgba(71,85,105,0.15); color: #94a3b8; }
.status-cancelled { background: rgba(239,68,68,0.15); color: #ef4444; }

.pagination-bar { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 18px; }
.page-btn { background: var(--dark-hover); border: 1px solid var(--dark-border); color: var(--text-primary); padding: 7px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn:not(:disabled):hover { border-color: var(--primary); }
.page-info { color: var(--text-secondary); font-size: 13px; }

.text-muted-custom { color: var(--text-secondary); }
</style>

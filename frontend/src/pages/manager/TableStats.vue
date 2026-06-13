<template>
  <div class="table-stats-page">

    <div class="page-header">
      <h4><i class="bi bi-columns-gap"></i> Table Statistics</h4>
      <button class="btn-back" @click="$router.push('/manager')">← Back</button>
    </div>

    <div class="container-fluid mt-4 px-4">

      <h6 class="section-label">Live Status</h6>
      <div class="row mb-4">
        <div class="col-lg-4 col-md-6 mb-3">
          <div class="occ-card">
            <h6>Occupancy Rate</h6>
            <div class="occ-circle">
              <span class="occ-pct">{{ data.occupancyRate || 0 }}%</span>
            </div>
            <p>{{ data.occupied || 0 }} out of {{ data.total || 0 }} tables</p>
          </div>
        </div>
        <div class="col-lg-4 col-md-6 mb-3">
          <div class="stat-mini">
            <span class="mini-icon" style="color: #10b981;"><i class="bi bi-circle-fill"></i></span>
            <div>
              <p>Available</p>
              <h4>{{ availableCount }}</h4>
            </div>
          </div>
        </div>
        <div class="col-lg-4 col-md-6 mb-3">
          <div class="stat-mini">
            <span class="mini-icon" style="color: #ef4444;"><i class="bi bi-circle-fill"></i></span>
            <div>
              <p>Occupied</p>
              <h4>{{ data.occupied || 0 }}</h4>
            </div>
          </div>
        </div>
      </div>

      <h6 class="section-label">Daily Performance History</h6>
      <div class="section-card mb-4 history-card">
        <p class="history-hint">Select a day to view its table-by-table performance</p>
        <div class="day-list">
          <div
            v-for="d in history"
            :key="d.date"
            :class="['day-chip', selectedDate === d.date ? 'active' : '']"
            @click="selectDate(d.date)"
          >
            <span class="day-label">{{ formatDayShort(d.date) }}</span>
            <span class="day-orders">{{ d.total_orders }} orders</span>
            <span class="day-revenue">{{ formatAmount(d.total_revenue) }}</span>
          </div>
          <template v-if="historyLoading">
            <div v-for="n in 5" :key="'ph'+n" class="day-chip placeholder"></div>
          </template>
        </div>
      </div>

      <div class="section-card">
        <div class="perf-header">
          <h5 class="mb-0">Table Performance</h5>
          <span class="date-badge">{{ formatDayFull(selectedDate) }}</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Table #</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Orders</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="table in data.tables" :key="table.id">
              <td><strong>{{ table.table_number }}</strong></td>
              <td>{{ table.capacity }} seats</td>
              <td><span :class="'status-badge badge-' + table.status">{{ table.status }}</span></td>
              <td>{{ table.total_orders }}</td>
              <td class="revenue">{{ formatAmount(table.total_revenue) }}</td>
            </tr>
            <tr v-if="!loading && (!data.tables || data.tables.length === 0)">
              <td colspan="5" class="text-center text-muted-custom">No data for this day</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../../services/api'
import { formatMoney, getCurrency } from '../../utils/currency'
import { todayStr, yesterdayStr } from '../../utils/date'

const data = ref({})
const history = ref([])
const loading = ref(true)
const historyLoading = ref(true)

const currency = ref(getCurrency())
const formatAmount = (amount) => formatMoney(amount, currency.value)
const onCurrencyChanged = (event) => { currency.value = event.detail || getCurrency() }

const selectedDate = ref(todayStr())

const availableCount = computed(() => {
  return (data.value.total || 0) - (data.value.occupied || 0)
})

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

const fetchTableStats = async (date) => {
  loading.value = true
  try {
    const res = await api.get('/manager/tables', { params: { date } })
    data.value = res.data.data
  } catch (err) {
    console.error('Failed to load table stats')
  } finally {
    loading.value = false
  }
}

const fetchHistory = async () => {
  historyLoading.value = true
  try {
    const res = await api.get('/manager/tables/history', { params: { days: 14 } })
    const rows = res.data.data || []
    if (!rows.some(r => r.date === todayStr())) {
      rows.unshift({ date: todayStr(), total_orders: 0, total_revenue: 0 })
    }
    history.value = rows
  } catch (err) {
    console.error('Failed to load table history')
  } finally {
    historyLoading.value = false
  }
}

const selectDate = (date) => {
  if (selectedDate.value === date) return
  selectedDate.value = date
  fetchTableStats(date)
}

onMounted(() => {
  fetchTableStats(selectedDate.value)
  fetchHistory()
  window.addEventListener('currency-changed', onCurrencyChanged)
})

onUnmounted(() => {
  window.removeEventListener('currency-changed', onCurrencyChanged)
})
</script>

<style scoped>
.table-stats-page { background: var(--dark); min-height: 100vh; color: var(--text-primary); }
.page-header { padding: 20px 30px; background: var(--dark-card); display: flex; justify-content: space-between; align-items: center; }
.btn-back { background: transparent; border: 1px solid var(--primary); padding: 6px 16px; border-radius: 8px; color: var(--text-primary); }

.section-label {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 14px;
  margin-top: 4px;
}

.occ-card { background: var(--dark-card); border-radius: 15px; padding: 25px; text-align: center; }
.occ-card h6 { color: var(--text-secondary); margin-bottom: 15px; }
.occ-circle { width: 100px; height: 100px; border-radius: 50%; border: 4px solid var(--primary); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px; }
.occ-pct { font-size: 24px; font-weight: 700; color: var(--primary); }
.occ-card p { color: var(--text-secondary); font-size: 14px; margin: 0; }

.stat-mini { background: var(--dark-card); border-radius: 15px; padding: 25px; display: flex; align-items: center; gap: 15px; }
.mini-icon { font-size: 22px; }
.stat-mini p { margin: 0; color: var(--text-secondary); font-size: 14px; }
.stat-mini h4 { margin: 0; font-size: 28px; font-weight: 700; }

.section-card { background: var(--dark-card); border-radius: 15px; padding: 25px; overflow-x: auto; -webkit-overflow-scrolling: touch; }

.history-hint { color: var(--text-secondary); font-size: 13px; margin: 0 0 14px; }
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

.data-table { width: 100%; border-collapse: collapse; }
.data-table th { text-align: left; padding: 10px; color: var(--text-secondary); font-size: 13px; border-bottom: 1px solid var(--dark-border); }
.data-table td { padding: 10px; border-bottom: 1px solid var(--dark-border); }

.status-badge { padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; }
.badge-available { background: #10b98122; color: #10b981; }
.badge-occupied { background: #ef444422; color: #ef4444; }
.badge-reserved { background: #f59e0b22; color: #f59e0b; }

.revenue { color: var(--amount-color); font-weight: 600; }
.text-muted-custom { color: var(--text-muted); }
</style>

<template>
  <div class="sales-page">

    <div class="page-header">
      <h4><i class="bi bi-graph-up"></i> Sales Analytics</h4>
      <button class="btn-back" @click="$router.push('/manager')">← Back</button>
    </div>

    <div class="date-filter-bar px-4 pt-3 pb-2">
      <div class="date-filter-inner">
        <div class="date-group">
          <label>From</label>
          <input type="date" v-model="startDate" class="date-input" />
        </div>
        <div class="date-group">
          <label>To</label>
          <input type="date" v-model="endDate" class="date-input" />
        </div>
        <button class="btn-apply" @click="fetchSales" :disabled="loading">Apply</button>
        <button class="btn-reset" @click="resetRange">Reset</button>
      </div>
    </div>

    <div class="container-fluid mt-4 px-4">

      <div v-if="loading" class="text-center mt-5">Loading analytics...</div>

      <div v-else>

        <div class="section-card mb-4">
          <h5 class="mb-3"><i class="bi bi-calendar3"></i> Daily Revenue <span class="range-label" v-if="startDate && endDate">({{ startDate }} → {{ endDate }})</span><span class="range-label" v-else>(Last 7 Days)</span></h5>
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Orders</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="day in sales.dailyRevenue" :key="day.date">
                <td>{{ formatDate(day.date) }}</td>
                <td>{{ day.orders }}</td>
                <td class="revenue">{{ formatAmount(day.revenue) }}</td>
              </tr>
              <tr v-if="sales.dailyRevenue?.length === 0">
                <td colspan="3" class="text-center text-muted-custom">No data yet</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section-card mb-4">
          <h5 class="mb-3"><i class="bi bi-clock-history"></i> Peak Hours <span class="range-label" v-if="startDate && endDate">({{ startDate }} → {{ endDate }})</span><span class="range-label" v-else>(Last 7 Days)</span></h5>

          <p class="peak-subtitle">By Hour of Day</p>
          <div class="hour-bars">
            <div
              v-for="h in sales.peakHours"
              :key="'h' + h.hour"
              class="hour-bar-col"
              :title="`${formatHourLabel(h.hour)}: ${h.orders} orders · ${formatAmount(h.revenue)}`"
            >
              <div class="hour-bar" :class="{ peak: isPeak(h, sales.peakHours) }" :style="{ height: getPeakBarHeight(h, sales.peakHours) }"></div>
              <span class="hour-label" v-if="h.hour % 3 === 0">{{ formatHourLabel(h.hour) }}</span>
            </div>
          </div>

          <p class="peak-subtitle mt-4">By Day of Week</p>
          <div class="hour-bars dow-bars">
            <div
              v-for="d in sales.dayOfWeek"
              :key="d.day"
              class="hour-bar-col"
              :title="`${d.day}: ${d.orders} orders · ${formatAmount(d.revenue)}`"
            >
              <div class="hour-bar" :class="{ peak: isPeak(d, sales.dayOfWeek) }" :style="{ height: getPeakBarHeight(d, sales.dayOfWeek) }"></div>
              <span class="hour-label">{{ d.day }}</span>
            </div>
          </div>

          <p v-if="!sales.peakHours?.some(h => h.orders > 0)" class="text-muted-custom mt-3 mb-0">No order data yet</p>
        </div>

        <div class="row">

          <div class="col-lg-6 mb-4">
            <div class="section-card">
              <h5 class="mb-3"><i class="bi bi-trophy"></i> Top Selling Items</h5>
              <div v-for="(item, i) in sales.topItems" :key="item.name" class="top-item">
                <span class="rank">#{{ i + 1 }}</span>
                <div class="item-info">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-stat">{{ item.total_sold }} sold · {{ formatAmount(item.total_revenue) }}</span>
                </div>
                <div class="bar-container">
                  <div class="bar" :style="{ width: getBarWidth(item, sales.topItems) }"></div>
                </div>
              </div>
              <p v-if="sales.topItems?.length === 0" class="text-muted-custom">No sales data yet</p>
            </div>
          </div>

          <div class="col-lg-6 mb-4">
            <div class="section-card">
              <h5 class="mb-3"><i class="bi bi-folder"></i> Revenue by Category</h5>
              <div v-for="cat in sales.categoryRevenue" :key="cat.category" class="cat-row">
                <div class="cat-info">
                  <h6>{{ cat.category }}</h6>
                  <p>{{ cat.items_sold }} items sold</p>
                </div>
                <span class="cat-revenue">{{ formatAmount(cat.revenue) }}</span>
              </div>
              <p v-if="sales.categoryRevenue?.length === 0" class="text-muted-custom">No data yet</p>
            </div>
          </div>

        </div>

        <div class="section-card mb-4">
          <h5 class="mb-3"><i class="bi bi-cash-coin"></i> Staff Tips <span class="range-label" v-if="startDate && endDate">({{ startDate }} → {{ endDate }})</span><span class="range-label" v-else>(Last 7 Days)</span></h5>
          <table class="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Role</th>
                <th>Payments</th>
                <th>Total Tips</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in tips.tips" :key="row.staff_id ?? row.staff_name">
                <td>{{ row.staff_name }}</td>
                <td class="role-cell">{{ row.staff_role }}</td>
                <td>{{ row.tip_count }}</td>
                <td class="revenue">{{ formatAmount(row.total_tips) }}</td>
              </tr>
              <tr v-if="tips.tips?.length === 0">
                <td colspan="4" class="text-center text-muted-custom">No tips recorded</td>
              </tr>
            </tbody>
            <tfoot v-if="tips.tips?.length">
              <tr>
                <td colspan="3" class="total-label">Total Tips</td>
                <td class="revenue">{{ formatAmount(tips.totalTips || 0) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="section-card mb-4">
          <h5 class="mb-3"><i class="bi bi-person-badge"></i> Staff Performance <span class="range-label" v-if="startDate && endDate">({{ startDate }} → {{ endDate }})</span><span class="range-label" v-else>(Last 7 Days)</span></h5>
          <table class="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Role</th>
                <th>Orders Handled</th>
                <th>Revenue Generated</th>
                <th>Payments Confirmed</th>
                <th>Refunds Processed</th>
                <th>Tips Earned</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in staffPerformance" :key="row.staff_id">
                <td>{{ row.staff_name }}</td>
                <td class="role-cell">{{ row.staff_role }}</td>
                <td>{{ row.orders_handled }}</td>
                <td class="revenue">{{ formatAmount(row.revenue_generated) }}</td>
                <td>{{ row.payments_confirmed }}</td>
                <td>{{ row.refunds_issued }}</td>
                <td class="revenue">{{ formatAmount(row.total_tips) }}</td>
              </tr>
              <tr v-if="staffPerformance.length === 0">
                <td colspan="7" class="text-center text-muted-custom">No staff data yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '../../services/api'
import { formatMoney, getCurrency } from '../../utils/currency'

const sales = ref({})
const tips = ref({})
const staffPerformance = ref([])
const loading = ref(true)
const startDate = ref('')
const endDate = ref('')

const currency = ref(getCurrency())
const formatAmount = (amount) => formatMoney(amount, currency.value)
const onCurrencyChanged = (event) => { currency.value = event.detail || getCurrency() }

const fetchSales = async () => {
  loading.value = true
  try {
    const params = {}
    if (startDate.value && endDate.value) {
      params.start_date = startDate.value
      params.end_date = endDate.value
    }
    const [salesRes, tipsRes, staffRes] = await Promise.all([
      api.get('/manager/sales', { params }),
      api.get('/manager/tips', { params }),
      api.get('/manager/staff-performance', { params })
    ])
    sales.value = salesRes.data.data
    tips.value = tipsRes.data.data
    staffPerformance.value = staffRes.data.data
  } catch (err) {
    console.error('Failed to load sales')
  } finally {
    loading.value = false
  }
}

const resetRange = () => {
  startDate.value = ''
  endDate.value = ''
  fetchSales()
}

onMounted(() => {
  fetchSales()
  window.addEventListener('currency-changed', onCurrencyChanged)
})

onUnmounted(() => {
  window.removeEventListener('currency-changed', onCurrencyChanged)
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const getBarWidth = (item, allItems) => {
  const max = Math.max(...allItems.map(i => i.total_sold || 0))
  return max > 0 ? ((item.total_sold / max) * 100) + '%' : '0%'
}

const formatHourLabel = (hour) => {
  if (hour === 0) return '12a'
  if (hour === 12) return '12p'
  return hour > 12 ? `${hour - 12}p` : `${hour}a`
}

const getPeakBarHeight = (item, allItems) => {
  const max = Math.max(...(allItems || []).map(i => i.orders || 0), 1)
  return ((item.orders / max) * 100) + '%'
}

const isPeak = (item, allItems) => {
  if (!allItems?.length || !item.orders) return false
  const max = Math.max(...allItems.map(i => i.orders || 0))
  return max > 0 && item.orders === max
}
</script>

<style scoped>
.sales-page { background: var(--dark); min-height: 100vh; color: var(--text-primary); }
.page-header { padding: 20px 30px; background: var(--dark-card); display: flex; justify-content: space-between; align-items: center; }
.btn-back { background: transparent; border: 1px solid var(--primary); padding: 6px 16px; border-radius: 8px; color: var(--text-primary); }

.date-filter-bar { background: var(--dark-card); border-bottom: 1px solid var(--dark-border); }
.date-filter-inner { display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.date-group { display: flex; flex-direction: column; gap: 4px; }
.date-group label { font-size: 12px; color: var(--text-secondary); }
.date-input { background: var(--dark-surface); border: 1px solid var(--dark-border); color: var(--text-primary); border-radius: 8px; padding: 7px 12px; font-size: 14px; outline: none; }
.date-input:focus { border-color: var(--primary); }
.btn-apply { background: var(--primary); border: none; color: #fff; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; }
.btn-apply:hover { opacity: 0.9; }
.btn-apply:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-reset { background: transparent; border: 1px solid var(--dark-border); color: var(--text-secondary); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; }
.btn-reset:hover { border-color: var(--text-secondary); color: var(--text-primary); }
.range-label { font-size: 13px; color: var(--secondary); font-weight: 400; }

.section-card { background: var(--dark-card); border-radius: 15px; padding: 25px; overflow-x: auto; -webkit-overflow-scrolling: touch; }

.data-table { width: 100%; border-collapse: collapse; }
.data-table th { text-align: left; padding: 10px; color: var(--text-secondary); font-size: 13px; border-bottom: 1px solid var(--dark-border); }
.data-table td { padding: 10px; border-bottom: 1px solid var(--dark-border); }
.revenue { color: var(--amount-color); font-weight: 600; }

.top-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; }
.rank { color: var(--primary); font-weight: 700; font-size: 16px; width: 30px; }
.item-info { flex: 1; }
.item-name { display: block; font-size: 14px; }
.item-stat { font-size: 12px; color: var(--text-secondary); }
.bar-container { width: 80px; height: 8px; background: var(--dark-border); border-radius: 4px; }
.bar { height: 100%; background: var(--primary); border-radius: 4px; transition: width 0.5s; }

.cat-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--dark-border); }
.cat-row:last-child { border: none; }
.cat-info h6 { margin: 0; font-size: 15px; }
.cat-info p { margin: 2px 0 0; font-size: 13px; color: var(--text-secondary); }
.cat-revenue { color: var(--amount-color); font-weight: 700; font-size: 16px; }

.peak-subtitle { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px; }
.hour-bars { display: flex; align-items: flex-end; gap: 3px; height: 100px; }
.hour-bar-col { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
.hour-bar { width: 100%; max-width: 18px; background: var(--primary); opacity: 0.4; border-radius: 3px 3px 0 0; min-height: 2px; transition: height 0.4s; }
.hour-bar.peak { opacity: 1; }
.hour-label { font-size: 9px; color: var(--text-muted); margin-top: 6px; white-space: nowrap; }
.dow-bars { height: 90px; }
.dow-bars .hour-bar { max-width: 40px; }
.dow-bars .hour-label { font-size: 11px; }

.role-cell { text-transform: capitalize; color: var(--text-secondary); }
.data-table tfoot td { border-bottom: none; border-top: 2px solid var(--dark-border); font-weight: 700; padding-top: 12px; }
.total-label { text-align: right; color: var(--text-secondary); }

.text-muted-custom { color: var(--text-muted); }
</style>

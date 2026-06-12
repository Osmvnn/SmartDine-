<template>
  <div class="admin-dash">

    <div class="dash-header">
      <h4>Admin Dashboard</h4>
    </div>

    <div class="container-fluid mt-4 px-4">

      <div class="row mb-4">
        <div class="col-lg-2 col-md-4 col-sm-6 mb-3" v-for="card in statCards" :key="card.label">
          <div class="stat-card">
            <div class="stat-icon"><i :class="'bi bi-' + card.icon"></i></div>
            <div>
              <p class="stat-label">{{ card.label }}</p>
              <h3 class="stat-value" :class="{ 'anim-count': card.animated }">{{ card.display }}</h3>
            </div>
          </div>
        </div>
      </div>

      <h5 class="mb-3">Management</h5>
      <div class="row">
        <div class="col-lg-4 col-md-6 mb-3" v-for="link in quickLinks" :key="link.path">
          <div class="quick-card" @click="$router.push(link.path)">
            <span class="quick-icon"><i :class="'bi bi-' + link.icon"></i></span>
            <div>
              <h6>{{ link.title }}</h6>
              <p>{{ link.desc }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '../../services/api'
import { formatMoney, getCurrency, getRate } from '../../utils/currency'

const stats = ref({})
const statCards = ref([])
const currency = ref(getCurrency())

const animateCounter = (index, targetNum, prefix = '', suffix = '', decimals = 0) => {
  const duration = 700
  const start = Date.now()
  const tick = () => {
    const elapsed = Date.now() - start
    const progress = Math.min(elapsed / duration, 1)
    const ease = 1 - Math.pow(1 - progress, 3)
    const current = targetNum * ease
    statCards.value[index].display = prefix + (decimals > 0 ? current.toFixed(decimals) : Math.round(current)) + suffix
    if (progress < 1) requestAnimationFrame(tick)
    else {
      statCards.value[index].display = prefix + (decimals > 0 ? targetNum.toFixed(decimals) : targetNum) + suffix
      statCards.value[index].animated = true
    }
  }
  requestAnimationFrame(tick)
}

const quickLinks = [
  { path: '/admin/users', icon: 'people', title: 'Manage Users', desc: 'Add, edit, or remove staff accounts' },
  { path: '/admin/categories', icon: 'folder', title: 'Menu Categories', desc: 'Organize your menu sections' },
  { path: '/admin/items', icon: 'cup-straw', title: 'Menu Items', desc: 'Add and manage food items' },
  { path: '/admin/tables', icon: 'columns-gap', title: 'Restaurant Tables', desc: 'Configure table settings' },
  { path: '/admin/orders', icon: 'receipt', title: 'All Orders', desc: 'View and manage all orders' }
]

onMounted(async () => {
  try {
    const res = await api.get('/admin/stats')
    stats.value = res.data.data
    statCards.value = [
      { icon: 'receipt',          label: 'Total Orders',    display: '0', animated: false },
      { icon: 'currency-dollar',  label: 'Total Revenue',   display: formatMoney(0, currency.value), animated: false },
      { icon: 'cup-straw',        label: 'Menu Items',      display: '0', animated: false },
      { icon: 'hourglass-split',  label: 'Pending Orders',  display: '0', animated: false },
      { icon: 'people',           label: 'Total Users',     display: '0', animated: false },
      { icon: 'columns-gap',      label: 'Tables',          display: '0', animated: false },
    ]
    setTimeout(() => {
      animateCounter(0, Number(stats.value.totalOrders))
      animateCounter(1, Number(stats.value.totalRevenue) * getRate(currency.value), '', ` ${currency.value}`, 2)
      animateCounter(2, Number(stats.value.totalItems))
      animateCounter(3, Number(stats.value.pendingOrders))
      animateCounter(4, Number(stats.value.totalUsers))
      animateCounter(5, Number(stats.value.totalTables))
    }, 100)
  } catch (err) {
    console.error('Failed to load stats', err)
  }
})

const onCurrencyChanged = (event) => {
  currency.value = event.detail || getCurrency()
  if (stats.value.totalRevenue !== undefined) {
    statCards.value[1].display = formatMoney(stats.value.totalRevenue, currency.value)
  }
}

onMounted(() => window.addEventListener('currency-changed', onCurrencyChanged))
onUnmounted(() => window.removeEventListener('currency-changed', onCurrencyChanged))
</script>

<style scoped>
.admin-dash {
  background: var(--dark);
  min-height: 100vh;
  color: var(--text-primary);
}

.dash-header {
  padding: 18px 24px;
  background: var(--dark-card);
  border-bottom: 1px solid var(--dark-border);
}

.dash-header h4 {
  margin: 0;
  font-size: clamp(1rem, 3vw, 1.25rem);
  font-weight: 700;
}

.stat-card {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 14px;
  padding: 18px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: 0.2s;
}

.stat-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 20px;
  width: 48px;
  height: 48px;
  background: var(--primary-light);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  flex-shrink: 0;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 12px;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  margin: 2px 0 0;
  font-size: clamp(18px, 3vw, 22px);
  font-weight: 700;
}

.quick-card {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: 0.2s;
}

.quick-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary);
  background: var(--primary-light);
}

.quick-icon {
  font-size: 22px;
  width: 44px;
  height: 44px;
  background: var(--primary-light);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  flex-shrink: 0;
}

.quick-card h6 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.quick-card p {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .dash-header { padding: 14px 16px; }
}
</style>

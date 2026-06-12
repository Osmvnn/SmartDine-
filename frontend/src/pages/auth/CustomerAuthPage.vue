<template>
  <div class="auth-page customer-theme">

    <div class="auth-container">

      <div v-if="tableInfo" class="table-status-card" :class="statusClass">
        <div class="ts-left">
          <span class="ts-icon"><i :class="statusIcon"></i></span>
          <div>
            <p class="ts-title">{{ statusLabel }}</p>
            <p class="ts-sub" v-if="tableInfo.guest_count > 0">
              {{ tableInfo.guest_count }} {{ tableInfo.guest_count === 1 ? 'person' : 'people' }} currently ordering
              <span v-if="isFull"> · Table is full ({{ tableInfo.capacity }}/{{ tableInfo.capacity }} seats)</span>
              <span v-else-if="tableInfo.capacity"> · {{ tableInfo.capacity - tableInfo.guest_count }} seat{{ tableInfo.capacity - tableInfo.guest_count === 1 ? '' : 's' }} free</span>
            </p>
            <p class="ts-sub" v-else-if="tableInfo.status === 'reserved'">This table has a reservation</p>
            <p class="ts-sub" v-else>Table #{{ tableNum }} is ready for you</p>
          </div>
        </div>
        <span class="ts-num">T{{ tableNum }}</span>
      </div>

      <div v-if="tableInfo && tableInfo.guest_count > 0" class="bill-choice-card">
        <p class="bill-choice-label">How would you like to order?</p>
        <div class="bill-options">
          <div
            :class="['bill-option', billType === 'separate' ? 'selected' : '']"
            @click="billType = 'separate'"
          >
            <i class="bi bi-person-fill bill-opt-icon"></i>
            <span class="bill-opt-title">My Own Bill</span>
            <span class="bill-opt-desc">Pay for your items separately</span>
          </div>
          <div
            :class="['bill-option', billType === 'shared' ? 'selected' : '']"
            @click="billType = 'shared'"
          >
            <i class="bi bi-people-fill bill-opt-icon"></i>
            <span class="bill-opt-title">Join Together</span>
            <span class="bill-opt-desc">Share the bill with the table</span>
          </div>
        </div>
      </div>

      <div class="auth-card">

        <div class="auth-logo"><img :src="logoIcon" alt="Smart Dine" /></div>
        <h3>Smart Dine</h3>
        <p class="table-info" v-if="tableNum">Table #{{ tableNum }}</p>
        <p class="table-info reservation-mode" v-else><i class="bi bi-calendar-check me-1"></i>Reservation Mode</p>
        <p class="subtitle">{{ isLogin ? 'Welcome back!' : 'Create your account to start ordering' }}</p>

        <div class="tab-toggle">
          <div :class="['tab', isLogin ? 'active' : '']" @click="isLogin = true">Login</div>
          <div :class="['tab', !isLogin ? 'active' : '']" @click="isLogin = false">Sign Up</div>
        </div>

        <div v-if="!isLogin" class="form-group">
          <label>Full Name</label>
          <input v-model="name" type="text" class="form-input" placeholder="Enter your name" />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" class="form-input" placeholder="Enter your email" />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" class="form-input" placeholder="Enter your password" />
        </div>

        <button class="btn-auth" @click="handleSubmit" :disabled="loading">
          {{ loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account') }}
        </button>

        <button v-if="auth.isLoggedIn" class="btn-current-user" @click="continueWithCurrentUser" :disabled="loading">
          Continue as {{ auth.user?.name }}
        </button>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <p class="switch-text">
          {{ isLogin ? "Don't have an account?" : 'Already have an account?' }}
          <span class="switch-link" @click="isLogin = !isLogin">
            {{ isLogin ? 'Sign Up' : 'Login' }}
          </span>
        </p>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import { useCartStore } from '../../store/cart'
import logoIcon from '../../assets/logo-icon.svg'
import api from '../../services/api'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const cart = useCartStore()

const isLogin = ref(true)
const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)
const tableInfo = ref(null)
const billType = ref('separate')

const qrToken = computed(() => route.params.qrToken || route.query.table || null)
const tableNum = computed(() => {
  if (!qrToken.value) return null
  const match = qrToken.value.match(/table_(\d+)/)
  return match ? match[1] : qrToken.value
})

const isFull = computed(() =>
  tableInfo.value && tableInfo.value.capacity > 0 &&
  tableInfo.value.guest_count >= tableInfo.value.capacity
)

const statusClass = computed(() => {
  if (!tableInfo.value) return ''
  if (isFull.value) return 'status-full'
  if (tableInfo.value.status === 'occupied') return 'status-occupied'
  if (tableInfo.value.status === 'reserved') return 'status-reserved'
  return 'status-available'
})

const statusIcon = computed(() => {
  if (isFull.value) return 'bi bi-x-circle-fill'
  if (tableInfo.value?.status === 'occupied') return 'bi bi-people-fill'
  if (tableInfo.value?.status === 'reserved') return 'bi bi-calendar-check-fill'
  return 'bi bi-check-circle-fill'
})

const statusLabel = computed(() => {
  if (isFull.value) return 'Table is Full'
  if (tableInfo.value?.status === 'occupied') return 'Table in Use'
  if (tableInfo.value?.status === 'reserved') return 'Table Reserved'
  return 'Table Available'
})

onMounted(async () => {
  if (!qrToken.value) return
  try {
    const res = await api.get(`/tables/qr/${qrToken.value}`)
    tableInfo.value = res.data.data
  } catch {  }
})

const handleSubmit = async () => {
  loading.value = true
  error.value = null

  try {
    if (isLogin.value) {
      await auth.login(email.value, password.value)
    } else {
      if (!name.value.trim()) {
        error.value = 'Please enter your name'
        loading.value = false
        return
      }
      await auth.register(name.value, email.value, password.value)
    }

    if (qrToken.value) {
      cart.setTable(tableInfo.value?.id || null, qrToken.value, tableNum.value)
      cart.setBillType(tableInfo.value?.guest_count > 0 ? billType.value : 'separate')
      router.push(`/customer/menu/${qrToken.value}`)
    } else {
      router.push('/customer/reservation')
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}

const continueWithCurrentUser = () => {
  if (qrToken.value) {
    cart.setTable(tableInfo.value?.id || null, qrToken.value, tableNum.value)
    cart.setBillType(tableInfo.value?.guest_count > 0 ? billType.value : 'separate')
    router.push(`/customer/menu/${qrToken.value}`)
  } else {
    router.push('/customer/reservation')
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: var(--dark);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.auth-page::before {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  background: var(--primary);
  border-radius: 50%;
  filter: blur(150px);
  opacity: 0.1;
  top: -200px;
  right: -100px;
}

.auth-container {
  width: 100%;
  max-width: 420px;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.auth-card {
  background: var(--dark-card);
  border-radius: 24px;
  padding: 40px 30px;
  text-align: center;
  color: var(--text-primary);
  border: 1px solid var(--dark-border);
}

.auth-logo {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  overflow: hidden;
}

.auth-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.auth-card h3 {
  font-weight: 700;
  margin-bottom: 4px;
}

.table-info {
  color: var(--primary);
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 2px;
}

.table-info.reservation-mode {
  color: var(--secondary);
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 25px;
}


.tab-toggle {
  display: flex;
  background: var(--dark-surface);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 25px;
}

.tab {
  flex: 1;
  padding: 10px;
  text-align: center;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-secondary);
  transition: 0.2s;
}

.tab.active {
  background: var(--primary);
  color: white;
}


.form-group {
  text-align: left;
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid var(--dark-border);
  border-radius: 12px;
  background: var(--dark-surface);
  color: var(--text-primary);
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
}

.form-input::placeholder {
  color: var(--text-muted);
}

.btn-auth {
  width: 100%;
  padding: 14px;
  background: var(--primary);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: 0.3s;
}

.btn-auth:hover {
  background: var(--primary-hover);
}

.btn-auth:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-current-user {
  width: 100%;
  padding: 12px;
  margin-top: 10px;
  border-radius: 14px;
  border: 1px solid rgba(245, 158, 11, 0.45);
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.btn-current-user:hover {
  background: rgba(245, 158, 11, 0.22);
  color: white;
}

.error-msg {
  color: var(--danger);
  margin-top: 12px;
  font-size: 14px;
}

.switch-text {
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 20px;
}

.switch-link {
  color: var(--primary);
  cursor: pointer;
  font-weight: 600;
}

.switch-link:hover {
  text-decoration: underline;
}


.table-status-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 16px;
  padding: 16px 18px;
  margin-bottom: 12px;
  border: 1px solid transparent;
}

.status-available { background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.3); }
.status-occupied  { background: rgba(245, 158, 11, 0.12); border-color: rgba(245, 158, 11, 0.3); }
.status-reserved  { background: rgba(99, 102, 241, 0.12); border-color: rgba(99, 102, 241, 0.3); }
.status-full      { background: rgba(239, 68, 68, 0.12);  border-color: rgba(239, 68, 68, 0.3); }

.ts-left { display: flex; align-items: center; gap: 14px; }
.ts-icon { font-size: 22px; }
.status-available .ts-icon { color: #10b981; }
.status-occupied  .ts-icon { color: #f59e0b; }
.status-reserved  .ts-icon { color: #6366f1; }
.status-full      .ts-icon { color: #ef4444; }

.ts-title {
  font-weight: 700;
  font-size: 14px;
  color: var(--text-primary);
  margin: 0 0 2px;
}
.ts-sub {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}
.ts-num {
  font-weight: 800;
  font-size: 18px;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}


.bill-choice-card {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 12px;
}

.bill-choice-label {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 0 0 12px;
}

.bill-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.bill-option {
  border: 2px solid var(--dark-border);
  border-radius: 14px;
  padding: 14px 10px;
  text-align: center;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: var(--dark-surface);
}

.bill-option:hover { border-color: var(--primary); }
.bill-option.selected { border-color: var(--primary); background: var(--primary-light); }

.bill-opt-icon { font-size: 22px; color: var(--primary); }
.bill-opt-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.bill-opt-desc { font-size: 11px; color: var(--text-muted); }
</style>

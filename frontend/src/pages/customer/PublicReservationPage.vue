<template>
  <div class="pub-reserve-page customer-theme">
    <div class="pub-bg"></div>

    <div class="pub-container">

      <div class="pub-brand">
        <div class="brand-icon"><img :src="logoIcon" alt="Smart Dine" /></div>
        <h2>Smart Dine</h2>
        <p class="brand-sub">Reserve a Table</p>
      </div>

      <div v-if="!authed" class="auth-card">
        <h4>Sign in to continue</h4>
        <p class="auth-hint">Login or create an account to book a table</p>

        <div class="tab-toggle">
          <div :class="['tab', isLogin ? 'active' : '']" @click="isLogin = true">Login</div>
          <div :class="['tab', !isLogin ? 'active' : '']" @click="isLogin = false">Sign Up</div>
        </div>

        <div v-if="!isLogin" class="form-group">
          <label>Full Name</label>
          <input v-model="aName" type="text" class="form-input" placeholder="Your name" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="aEmail" type="email" class="form-input" placeholder="Your email" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="aPassword" type="password" class="form-input" placeholder="Your password" />
        </div>
        <button class="btn-primary" @click="handleAuth" :disabled="authLoading">
          {{ authLoading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account') }}
        </button>
        <p v-if="authError" class="error-msg">{{ authError }}</p>
        <p class="switch-text">
          {{ isLogin ? "Don't have an account?" : 'Already have an account?' }}
          <span class="switch-link" @click="isLogin = !isLogin">
            {{ isLogin ? 'Sign Up' : 'Login' }}
          </span>
        </p>
      </div>

      <div v-else-if="submitted" class="success-card">
        <div class="success-icon"><i class="bi bi-calendar-check-fill"></i></div>
        <h3>Reservation Confirmed!</h3>
        <p class="success-detail">{{ form.reservation_date }} at {{ form.reservation_time }}</p>
        <p class="success-guests">{{ form.guests }} guest{{ form.guests > 1 ? 's' : '' }}</p>
        <div class="success-actions">
          <button class="btn-primary" @click="resetAll">Make Another</button>
          <router-link to="/" class="btn-outline-link">Back to Home</router-link>
        </div>
      </div>

      <div v-else class="reserve-card">
        <div class="reserve-header">
          <div class="user-pill">
            <i class="bi bi-person-circle"></i>
            <span>{{ auth.user?.name || auth.user?.email }}</span>
          </div>
          <button class="btn-text-link" @click="logout">Logout</button>
        </div>

        <h4>Book a Table</h4>

        <div class="form-row">
          <div class="form-group">
            <label>Date *</label>
            <input v-model="form.reservation_date" type="date" class="form-input" :min="minDate" required />
          </div>
          <div class="form-group">
            <label>Time *</label>
            <input v-model="form.reservation_time" type="time" class="form-input" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Guests</label>
            <select v-model="form.guests" class="form-input">
              <option v-for="n in 12" :key="n" :value="n">{{ n }} {{ n === 1 ? 'Guest' : 'Guests' }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Preferred Table</label>
            <select v-model="form.table_id" class="form-input">
              <option :value="null">Any Available</option>
              <option v-for="t in availableTables" :key="t.id" :value="t.id">
                Table {{ t.table_number }} ({{ t.capacity }} seats)
              </option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Phone</label>
          <input v-model="form.customer_phone" type="tel" class="form-input" placeholder="Optional contact number" />
        </div>

        <div class="form-group">
          <label>Special Requests</label>
          <textarea v-model="form.notes" class="form-input" rows="3" placeholder="Allergies, seating preferences, celebrations..."></textarea>
        </div>

        <button class="btn-primary btn-book" @click="submitReservation" :disabled="submitting || !form.reservation_date || !form.reservation_time">
          <i class="bi bi-calendar-plus me-2"></i>
          {{ submitting ? 'Booking...' : 'Confirm Reservation' }}
        </button>
        <p v-if="reserveError" class="error-msg">{{ reserveError }}</p>
      </div>

      <p class="footer-hint">
        <router-link to="/" class="footer-link">← Back to Home</router-link>
        <span class="footer-sep">|</span>
        <router-link to="/login" class="footer-link">Staff Login</router-link>
      </p>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '../../store/auth'
import api from '../../services/api'
import logoIcon from '../../assets/logo-icon.svg'

const auth = useAuthStore()

const authed = computed(() => !!auth.token)

const isLogin = ref(true)
const aName = ref('')
const aEmail = ref('')
const aPassword = ref('')
const authLoading = ref(false)
const authError = ref(null)

const submitted = ref(false)
const submitting = ref(false)
const reserveError = ref('')
const availableTables = ref([])

const form = ref({
  reservation_date: '',
  reservation_time: '',
  guests: 2,
  table_id: null,
  customer_phone: '',
  notes: ''
})

const minDate = computed(() => new Date().toISOString().split('T')[0])

onMounted(() => {
  if (auth.token && !auth.user) auth.fetchUser?.()
})

watch(() => [form.value.reservation_date, form.value.reservation_time, form.value.guests], () => {
  loadTables()
})

async function loadTables() {
  if (!form.value.reservation_date || !form.value.reservation_time) return
  try {
    const res = await api.get('/reservations/available', {
      params: { date: form.value.reservation_date, time: form.value.reservation_time, guests: form.value.guests }
    })
    availableTables.value = res.data.data || []
  } catch { }
}

async function handleAuth() {
  authLoading.value = true
  authError.value = null
  try {
    if (isLogin.value) {
      await auth.login(aEmail.value, aPassword.value)
    } else {
      if (!aName.value.trim()) { authError.value = 'Please enter your name'; return }
      await auth.register(aName.value, aEmail.value, aPassword.value)
    }
  } catch (err) {
    authError.value = err.response?.data?.message || 'Something went wrong'
  } finally {
    authLoading.value = false
  }
}

async function submitReservation() {
  submitting.value = true
  reserveError.value = ''
  try {
    await api.post('/reservations', {
      customer_name: auth.user?.name || aName.value,
      customer_email: auth.user?.email || aEmail.value,
      customer_phone: form.value.customer_phone || null,
      reservation_date: form.value.reservation_date,
      reservation_time: form.value.reservation_time,
      guests: form.value.guests,
      table_id: form.value.table_id,
      notes: form.value.notes || null
    })
    submitted.value = true
  } catch (err) {
    reserveError.value = err.response?.data?.message || 'Failed to create reservation'
  } finally {
    submitting.value = false
  }
}

function logout() {
  auth.logout()
}

function resetAll() {
  submitted.value = false
  form.value = { reservation_date: '', reservation_time: '', guests: 2, table_id: null, customer_phone: '', notes: '' }
}
</script>

<style scoped>
.pub-reserve-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--dark);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px 16px;
}

.pub-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 10% 20%, var(--primary-light) 0%, transparent 55%),
    radial-gradient(ellipse at 90% 80%, rgba(45, 143, 123, 0.07) 0%, transparent 55%);
  pointer-events: none;
}

.pub-container {
  width: 100%;
  max-width: 480px;
  position: relative;
  z-index: 1;
}

.pub-brand {
  text-align: center;
  margin-bottom: 24px;
}

.brand-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  overflow: hidden;
}

.brand-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pub-brand h2 {
  font-size: 1.8rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 4px;
}

.brand-sub {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

.auth-card, .reserve-card, .success-card {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 20px;
  padding: 28px 24px;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.auth-card h4, .reserve-card h4 {
  font-weight: 700;
  margin-bottom: 4px;
  font-size: 1.1rem;
}

.auth-hint {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 20px;
}

.tab-toggle {
  display: flex;
  background: var(--dark-surface);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 20px;
}

.tab {
  flex: 1;
  padding: 9px;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 14px;
  transition: 0.2s;
}

.tab.active {
  background: var(--primary);
  color: white;
}

.form-group {
  margin-bottom: 14px;
  flex: 1;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  width: 100%;
  padding: 11px 14px;
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  background: var(--dark-surface);
  color: var(--text-primary);
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
}

.form-input::placeholder {
  color: var(--text-muted);
}

.form-input option {
  background: var(--dark-card);
  color: var(--text-primary);
}

textarea.form-input {
  resize: vertical;
  min-height: 70px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.btn-primary {
  width: 100%;
  padding: 13px;
  background: var(--primary);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  margin-top: 6px;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-book {
  margin-top: 20px;
  padding: 15px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-msg {
  color: var(--danger);
  font-size: 13px;
  margin-top: 10px;
  text-align: center;
}

.switch-text {
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 16px;
  text-align: center;
}

.switch-link {
  color: var(--primary);
  cursor: pointer;
  font-weight: 600;
}

.reserve-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--dark-border);
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.user-pill i {
  color: var(--primary);
  font-size: 18px;
}

.btn-text-link {
  background: none;
  border: none;
  color: var(--danger);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.btn-text-link:hover {
  text-decoration: underline;
}

.success-card {
  text-align: center;
  padding: 40px 24px;
}

.success-icon {
  font-size: 3.5rem;
  color: var(--success);
  margin-bottom: 12px;
}

.success-card h3 {
  font-weight: 700;
  margin-bottom: 8px;
}

.success-detail {
  font-size: 15px;
  color: var(--primary);
  font-weight: 600;
  margin: 0 0 4px;
}

.success-guests {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 24px;
}

.success-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-outline-link {
  display: block;
  padding: 11px;
  border: 1px solid var(--dark-border);
  border-radius: 12px;
  color: var(--text-secondary);
  text-align: center;
  text-decoration: none;
  font-size: 14px;
  transition: 0.2s;
}

.btn-outline-link:hover {
  border-color: var(--primary);
  color: var(--text-primary);
}

.footer-hint {
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 8px;
}

.footer-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: var(--primary);
}

.footer-sep {
  margin: 0 10px;
}

@media (max-width: 480px) {
  .auth-card, .reserve-card, .success-card {
    padding: 22px 18px;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>

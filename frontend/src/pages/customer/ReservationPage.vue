<template>
  <div class="page-container">
    <div class="page-header">
      <h2><i class="bi bi-calendar-check"></i> Make a Reservation</h2>
    </div>

    <div v-if="auth.isLoggedIn && myReservations.length" class="section-card my-reservations">
      <h3 class="mb-3"><i class="bi bi-calendar-week"></i> My Reservations</h3>
      <div v-for="r in myReservations" :key="r.id" class="reservation-row">
        <div class="reservation-info">
          <div class="reservation-date">{{ r.reservation_date }} at {{ formatResTime(r.reservation_time) }}</div>
          <div class="reservation-meta">
            {{ r.guests }} {{ r.guests === 1 ? 'guest' : 'guests' }}
            <span v-if="r.table_number"> · Table {{ r.table_number }}</span>
          </div>
        </div>
        <span :class="'status-badge status-' + r.status">{{ r.status }}</span>
      </div>
    </div>

    <div v-if="submitted" class="section-card success-msg">
      <i class="bi bi-check-circle"></i>
      <h3>Reservation Confirmed!</h3>
      <p>We look forwarding to seeing you on {{ form.reservation_date }} at {{ form.reservation_time }}</p>
      <button class="btn-primary-custom" @click="submitted = false; resetForm()">Make Another</button>
    </div>

    <form v-else class="section-card" @submit.prevent="submitReservation">
      <div class="form-group">
        <label>Your Name *</label>
        <input v-model="form.customer_name" type="text" required placeholder="Enter your name" />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Phone</label>
          <input v-model="form.customer_phone" type="tel" placeholder="Phone number" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.customer_email" type="email" placeholder="Email address" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Date *</label>
          <input v-model="form.reservation_date" type="date" required :min="minDate" />
        </div>
        <div class="form-group">
          <label>Time *</label>
          <input v-model="form.reservation_time" type="time" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Guests</label>
          <select v-model="form.guests">
            <option v-for="n in 10" :key="n" :value="n">{{ n }} {{ n === 1 ? 'Guest' : 'Guests' }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Preferred Table</label>
          <select v-model="form.table_id">
            <option :value="null">Any Available</option>
            <option v-for="t in availableTables" :key="t.id" :value="t.id">
              Table {{ t.table_number }} ({{ t.capacity }} seats)
            </option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Special Requests</label>
        <textarea v-model="form.notes" rows="3" placeholder="Any special requests..."></textarea>
      </div>

      <button type="submit" class="btn-primary-custom" :disabled="submitting">
        <span v-if="submitting">Booking...</span>
        <span v-else><i class="bi bi-calendar-plus"></i> Book Table</span>
      </button>

      <div v-if="error" class="error-msg">{{ error }}</div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../../store/auth'
import { useSocketStore } from '../../store/socket'
import api from '../../services/api'
import { todayStr } from '../../utils/date'

const auth = useAuthStore()
const socketStore = useSocketStore()
const myReservations = ref([])

const form = ref({
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  reservation_date: '',
  reservation_time: '',
  guests: 2,
  table_id: null,
  notes: ''
})

const availableTables = ref([])
const submitted = ref(false)
const submitting = ref(false)
const error = ref('')

const minDate = computed(() => todayStr())

async function loadAvailableTables() {
  if (!form.value.reservation_date || !form.value.reservation_time) return
  try {
    const res = await api.get('/reservations/available', {
      params: {
        date: form.value.reservation_date,
        time: form.value.reservation_time,
        guests: form.value.guests
      }
    })
    availableTables.value = res.data.data || []
  } catch (e) {
    console.error(e)
  }
}

watch(() => [form.value.reservation_date, form.value.reservation_time, form.value.guests], () => {
  loadAvailableTables()
})

async function fetchMyReservations() {
  if (!auth.isLoggedIn) return
  try {
    const res = await api.get('/reservations/my')
    myReservations.value = res.data.data || []
  } catch (e) {
    console.error(e)
  }
}

function formatResTime(time) {
  const [h, m] = String(time).split(':')
  const hour = Number(h)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${m} ${period}`
}

const onReservationStatusChanged = () => {
  fetchMyReservations()
}

onMounted(() => {
  if (auth.user) {
    form.value.customer_name = auth.user.name || ''
    form.value.customer_email = auth.user.email || ''
  }
  fetchMyReservations()
  socketStore.connect()
  socketStore.socket?.on('reservation-status-changed', onReservationStatusChanged)
})

onUnmounted(() => {
  socketStore.socket?.off('reservation-status-changed', onReservationStatusChanged)
})

async function submitReservation() {
  submitting.value = true
  error.value = ''
  try {
    await api.post('/reservations', form.value)
    submitted.value = true
    fetchMyReservations()
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to create reservation'
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.value = {
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    reservation_date: '',
    reservation_time: '',
    guests: 2,
    table_id: null,
    notes: ''
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: var(--dark);
  color: var(--text-primary);
  padding: 0;
  padding-bottom: 100px;
}

.page-header {
  padding: 18px 20px 14px;
  background: var(--dark-card);
  border-bottom: 1px solid var(--dark-border);
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: clamp(1rem, 4vw, 1.3rem);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-card {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 16px;
  padding: 20px;
  margin: 0 16px;
  max-width: 620px;
}

form {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 16px;
  padding: 20px;
  margin: 0 16px;
  max-width: 620px;
  animation: form-fade-in 0.4s ease both;
}

@keyframes form-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.form-group {
  margin-bottom: 16px;
  flex: 1;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  background: var(--dark-surface);
  color: var(--text-primary);
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: var(--text-muted);
}

.form-group select option {
  background: var(--dark-card);
  color: var(--text-primary);
}

.form-row {
  display: flex;
  gap: 16px;
}

.btn-primary-custom {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 12px;
  background: var(--primary);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
  transition: 0.2s;
}

.btn-primary-custom:hover { background: var(--primary-hover); }
.btn-primary-custom:disabled { opacity: 0.6; cursor: not-allowed; }

.error-msg {
  margin-top: 12px;
  color: var(--danger);
  font-size: 13px;
  text-align: center;
}

.my-reservations {
  margin-bottom: 20px;
}

.my-reservations h3 {
  margin: 0 0 12px;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.reservation-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--dark-border);
}

.reservation-row:last-child {
  border-bottom: none;
}

.reservation-date {
  font-weight: 600;
}

.reservation-meta {
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 2px;
}

.status-badge {
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  padding: 4px 12px;
  border-radius: 10px;
}

.status-pending { background: rgba(245,158,11,0.15); color: #f59e0b; }
.status-confirmed { background: rgba(59,130,246,0.15); color: #3b82f6; }
.status-completed { background: rgba(71,85,105,0.15); color: #94a3b8; }
.status-cancelled { background: rgba(239,68,68,0.15); color: #ef4444; }
.status-no_show { background: rgba(239,68,68,0.15); color: #ef4444; }

.success-msg {
  text-align: center;
  padding: 40px 20px;
  animation: success-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes success-pop {
  from { opacity: 0; transform: scale(0.85) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.success-msg i {
  font-size: 3rem;
  color: var(--success);
  display: block;
  margin-bottom: 16px;
  animation: success-pop 0.6s 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.success-msg h3 {
  color: var(--text-primary);
  margin-bottom: 8px;
}

.success-msg p {
  color: var(--text-secondary);
  margin-bottom: 20px;
}

@media (max-width: 480px) {
  .form-row { flex-direction: column; gap: 0; }
  .section-card, form { margin: 0 12px; }
}
</style>

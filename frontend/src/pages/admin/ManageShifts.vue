<template>
  <div class="page-container">
    <div class="page-header">
      <h2><i class="bi bi-clock-history"></i> Staff Shifts</h2>
    </div>

    <h6 class="section-label">Daily History</h6>
    <div class="section-card mb-4 history-card">
      <div class="history-top">
        <p class="history-hint">Select a day to view shift details, or pick a custom date</p>
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
          <span class="day-orders">{{ d.staff_count }} staff</span>
          <span class="day-revenue">{{ formatHours(d.total_minutes) }}</span>
        </div>
        <template v-if="historyLoading">
          <div v-for="n in 5" :key="'ph'+n" class="day-chip placeholder"></div>
        </template>
      </div>
    </div>

    <div class="section-card">
      <div class="perf-header">
        <h5 class="mb-0">Shift Details</h5>
        <span class="date-badge">{{ formatDayFull(selectedDate) }}</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Staff</th>
            <th>Role</th>
            <th>Clock In</th>
            <th>Clock Out</th>
            <th>Duration</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in shifts" :key="s.id">
            <td>{{ s.user_name }}</td>
            <td><span class="role-badge">{{ s.role }}</span></td>
            <td>{{ formatTime(s.clock_in) }}</td>
            <td>{{ s.clock_out ? formatTime(s.clock_out) : '— Active —' }}</td>
            <td>{{ s.clock_out ? calcDuration(s.clock_in, s.clock_out) : calcDuration(s.clock_in, new Date()) }}</td>
            <td>{{ s.note || '-' }}</td>
          </tr>
          <tr v-if="!loading && !shifts.length">
            <td colspan="6" class="text-center">No shifts found for this day</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import { todayStr, yesterdayStr } from '../../utils/date'

const shifts = ref([])
const history = ref([])
const loading = ref(true)
const historyLoading = ref(true)

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

const formatHours = (minutes) => {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h}h ${m}m`
}

onMounted(() => {
  loadShifts()
  loadHistory()
})

async function loadShifts() {
  loading.value = true
  try {
    const res = await api.get('/shifts', { params: { date: selectedDate.value } })
    shifts.value = res.data.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadHistory() {
  historyLoading.value = true
  try {
    const res = await api.get('/shifts/history', { params: { days: 14 } })
    const rows = res.data.data || []
    if (!rows.some(r => r.date === todayStr())) {
      rows.unshift({ date: todayStr(), shift_count: 0, staff_count: 0, total_minutes: 0 })
    }
    history.value = rows
  } catch (e) {
    console.error(e)
  } finally {
    historyLoading.value = false
  }
}

function selectDate(date) {
  if (selectedDate.value === date) return
  selectedDate.value = date
  customDate.value = date
  loadShifts()
}

function onCustomDate() {
  if (!customDate.value || customDate.value === selectedDate.value) return
  selectedDate.value = customDate.value
  loadShifts()
}

function formatTime(d) {
  return new Date(d).toLocaleString()
}

function calcDuration(from, to) {
  const diff = Math.floor((new Date(to) - new Date(from)) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  return `${h}h ${m}m`
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
}

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
  border: 1px solid var(--dark-border, #334155);
  border-radius: 8px;
  background: var(--dark-surface);
  color: var(--text-primary);
  font-size: 13px;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-table th, .data-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--dark-border, #334155);
}
.data-table th {
  color: var(--text-muted, #64748b);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
}
.data-table td { color: var(--text-secondary); }
.role-badge {
  background: var(--primary-light);
  color: var(--primary);
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}
.text-center { text-align: center; color: var(--text-muted); padding: 20px; }
</style>

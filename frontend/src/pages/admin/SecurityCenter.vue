<template>
  <div class="manage-page">
    <div class="page-header">
      <h4><i class="bi bi-shield-lock"></i> Security Center</h4>
      <div class="header-actions">
        <button class="btn-refresh" @click="refreshAll">Refresh</button>
      </div>
    </div>

    <div class="container-fluid mt-4 px-4">

      <h6 class="section-label">Today</h6>
      <div class="summary-grid mb-4">
        <div class="summary-card">
          <div class="summary-icon icon-total"><i class="bi bi-activity"></i></div>
          <div>
            <div class="summary-value">{{ summary.today.total }}</div>
            <div class="summary-label">Events Today</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon icon-danger"><i class="bi bi-key"></i></div>
          <div>
            <div class="summary-value">{{ summary.today.failed_logins }}</div>
            <div class="summary-label">Failed Logins</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon icon-warning"><i class="bi bi-speedometer2"></i></div>
          <div>
            <div class="summary-value">{{ summary.today.rate_limited }}</div>
            <div class="summary-label">Rate Limited</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon icon-info"><i class="bi bi-incognito"></i></div>
          <div>
            <div class="summary-value">{{ summary.today.unauthorized }}</div>
            <div class="summary-label">Unauthorized Access</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon icon-total"><i class="bi bi-globe"></i></div>
          <div>
            <div class="summary-value">{{ summary.today.unique_ips }}</div>
            <div class="summary-label">Unique IPs</div>
          </div>
        </div>
      </div>

      <h6 class="section-label">Daily History</h6>
      <div class="section-card mb-4 history-card">
        <div class="history-top">
          <p class="history-hint">Select a day to view its security events, or pick a custom date</p>
          <input v-model="customDate" type="date" class="filter-input" @change="onCustomDate" />
        </div>
        <div class="day-list">
          <div
            v-for="d in history"
            :key="d.date"
            :class="['day-chip', selectedDate === d.date ? 'active' : '', d.failed_logins + d.rate_limited + d.unauthorized > 0 ? 'has-issues' : '']"
            @click="selectDate(d.date)"
          >
            <span class="day-label">{{ formatDayShort(d.date) }}</span>
            <span class="day-orders">{{ d.total }} events</span>
            <span v-if="d.failed_logins + d.rate_limited + d.unauthorized > 0" class="day-alert">
              {{ d.failed_logins + d.rate_limited + d.unauthorized }} flagged
            </span>
            <span v-else class="day-ok">clean</span>
          </div>
          <template v-if="historyLoading">
            <div v-for="n in 5" :key="'ph'+n" class="day-chip placeholder"></div>
          </template>
        </div>
      </div>

      <h6 class="section-label">Top IPs (Last 7 Days)</h6>
      <div class="section-card mb-4 table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Total Events</th>
              <th>Failed Logins</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in summary.topIps" :key="row.ip_address">
              <td><code>{{ row.ip_address }}</code></td>
              <td>{{ row.event_count }}</td>
              <td>
                <span v-if="row.failed_logins > 0" class="status-badge status-danger">{{ row.failed_logins }}</span>
                <span v-else>0</span>
              </td>
              <td>{{ formatDate(row.last_seen) }}</td>
              <td class="action-cell">
                <button class="btn-link" @click="filterByIp(row.ip_address)">View events</button>
                <button v-if="!isBlocked(row.ip_address)" class="btn-block" @click="blockIpFromRow(row.ip_address)">
                  <i class="bi bi-shield-x"></i> Block
                </button>
                <button v-else class="btn-unblock" @click="unblockIp(row.ip_address)">
                  <i class="bi bi-shield-check"></i> Unblock
                </button>
              </td>
            </tr>
            <tr v-if="!summary.topIps.length">
              <td colspan="5" class="text-center text-muted-custom">No suspicious activity in the last 7 days</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h6 class="section-label">Blocked IPs / Devices</h6>
      <div class="section-card mb-4 table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Reason</th>
              <th>Blocked By</th>
              <th>Blocked At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in blockedIps" :key="b.id">
              <td><code>{{ b.ip_address }}</code></td>
              <td>{{ b.reason || '-' }}</td>
              <td>{{ b.blocked_by_name || '-' }}</td>
              <td>{{ formatDate(b.created_at) }}</td>
              <td>
                <button class="btn-unblock" @click="unblockIp(b.ip_address)">
                  <i class="bi bi-shield-check"></i> Unblock
                </button>
              </td>
            </tr>
            <tr v-if="!blockedIps.length">
              <td colspan="5" class="text-center text-muted-custom">No IPs currently blocked</td>
            </tr>
          </tbody>
        </table>
        <div class="block-ip-form">
          <input v-model="newBlockIp" type="text" placeholder="IP address (e.g. 203.0.113.5)" class="filter-input" />
          <input v-model="newBlockReason" type="text" placeholder="Reason (optional)" class="filter-input" />
          <button class="btn-block" @click="blockIpManual">
            <i class="bi bi-shield-x"></i> Block IP
          </button>
        </div>
      </div>

      <h6 class="section-label">Event Log</h6>
      <div class="section-card filters-card mb-3">
        <div class="form-group">
          <label>Event Type</label>
          <select v-model="eventTypeFilter" @change="onFilterChange">
            <option value="">All</option>
            <option v-for="t in eventTypes" :key="t" :value="t">{{ formatEventType(t) }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>IP Address</label>
          <input v-model="ipFilter" type="text" placeholder="e.g. 127.0.0.1" @change="onFilterChange" />
        </div>
        <button class="btn-clear" @click="clearFilters" v-if="eventTypeFilter || ipFilter">
          <i class="bi bi-x-circle"></i> Clear Filters
        </button>
      </div>

      <div class="table-card">
        <div class="perf-header">
          <h5 class="mb-0">Events</h5>
          <span class="date-badge">{{ formatDayFull(selectedDate) }}</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>IP Address</th>
              <th>Email / User</th>
              <th>Path</th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ev in events" :key="ev.id">
              <td class="nowrap">{{ formatDate(ev.created_at) }}</td>
              <td>
                <span :class="'badge-event ' + eventBadgeClass(ev.event_type)">{{ formatEventType(ev.event_type) }}</span>
              </td>
              <td><code>{{ ev.ip_address }}</code></td>
              <td>{{ ev.email || (ev.user_id ? `User #${ev.user_id}` : '-') }}</td>
              <td class="nowrap">{{ ev.method }} {{ ev.path }}</td>
              <td class="details-cell">
                <code v-if="ev.details">{{ summarizeDetails(ev.details) }}</code>
                <span v-else class="text-muted-custom">-</span>
              </td>
              <td class="nowrap">
                <button v-if="!isBlocked(ev.ip_address)" class="btn-block" @click="blockIpFromRow(ev.ip_address)">
                  <i class="bi bi-shield-x"></i> Block
                </button>
                <button v-else class="btn-unblock" @click="unblockIp(ev.ip_address)">
                  <i class="bi bi-shield-check"></i> Unblock
                </button>
              </td>
            </tr>
            <tr v-if="!loading && events.length === 0">
              <td colspan="7" class="text-center text-muted-custom">No security events found for this day</td>
            </tr>
          </tbody>
        </table>

        <div v-if="pagination.pages > 1" class="pagination-bar">
          <button class="page-btn" :disabled="pagination.page <= 1" @click="fetchEvents(pagination.page - 1)">← Prev</button>
          <span class="page-info">Page {{ pagination.page }} of {{ pagination.pages }} ({{ pagination.total }} events)</span>
          <button class="page-btn" :disabled="pagination.page >= pagination.pages" @click="fetchEvents(pagination.page + 1)">Next →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import { useToastStore } from '../../store/toast'
import { todayStr, yesterdayStr } from '../../utils/date'

const toast = useToastStore()

const events = ref([])
const history = ref([])
const eventTypes = ref([])
const eventTypeFilter = ref('')
const ipFilter = ref('')
const loading = ref(true)
const historyLoading = ref(true)
const pagination = ref({ page: 1, limit: 20, total: 0, pages: 1 })

const blockedIps = ref([])
const newBlockIp = ref('')
const newBlockReason = ref('')

const summary = ref({
  today: { total: 0, failed_logins: 0, rate_limited: 0, unauthorized: 0, unique_ips: 0 },
  topIps: []
})

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

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const formatEventType = (type) => {
  if (!type) return '-'
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const eventBadgeClass = (type) => {
  if (type === 'failed_login') return 'badge-danger'
  if (type === 'rate_limited') return 'badge-warning'
  if (['unauthorized', 'forbidden', 'invalid_token'].includes(type)) return 'badge-info'
  return 'badge-neutral'
}

const summarizeDetails = (details) => {
  try {
    const obj = JSON.parse(details)
    return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(', ')
  } catch {
    return details
  }
}

const fetchSummary = async () => {
  try {
    const res = await api.get('/admin/security/summary')
    summary.value = res.data.data
  } catch (err) {
    console.error('Failed to fetch security summary')
  }
}

const fetchHistory = async () => {
  historyLoading.value = true
  try {
    const res = await api.get('/admin/security/history', { params: { days: 14 } })
    const rows = res.data.data || []
    if (!rows.some(r => r.date === todayStr())) {
      rows.unshift({ date: todayStr(), total: 0, failed_logins: 0, rate_limited: 0, unauthorized: 0 })
    }
    history.value = rows
  } catch (err) {
    console.error('Failed to fetch security history')
  } finally {
    historyLoading.value = false
  }
}

const fetchEvents = async (page = 1) => {
  loading.value = true
  try {
    const params = { date: selectedDate.value, page, limit: pagination.value.limit }
    if (eventTypeFilter.value) params.event_type = eventTypeFilter.value
    if (ipFilter.value) params.ip = ipFilter.value
    const res = await api.get('/admin/security/events', { params })
    events.value = res.data.data
    pagination.value = res.data.pagination
    if (res.data.eventTypes) eventTypes.value = res.data.eventTypes
  } catch (err) {
    console.error('Failed to fetch security events')
  } finally {
    loading.value = false
  }
}

const selectDate = (date) => {
  if (selectedDate.value === date) return
  selectedDate.value = date
  customDate.value = date
  fetchEvents(1)
}

const onCustomDate = () => {
  if (!customDate.value || customDate.value === selectedDate.value) return
  selectedDate.value = customDate.value
  fetchEvents(1)
}

const onFilterChange = () => fetchEvents(1)

const clearFilters = () => {
  eventTypeFilter.value = ''
  ipFilter.value = ''
  fetchEvents(1)
}

const filterByIp = (ip) => {
  ipFilter.value = ip
  fetchEvents(1)
}

const fetchBlockedIps = async () => {
  try {
    const res = await api.get('/admin/security/blocked-ips')
    blockedIps.value = res.data.data || []
  } catch (err) {
    console.error('Failed to fetch blocked IPs')
  }
}

const isBlocked = (ip) => blockedIps.value.some(b => b.ip_address === ip)

const doBlockIp = async (ip, reason) => {
  try {
    await api.post('/admin/security/block-ip', { ip_address: ip, reason: reason || null })
    toast.success(`IP ${ip} has been blocked`)
    fetchBlockedIps()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to block IP')
  }
}

const blockIpFromRow = (ip) => {
  if (!ip) return
  const reason = prompt(`Reason for blocking ${ip} (optional):`, '')
  if (reason === null) return
  doBlockIp(ip, reason.trim())
}

const blockIpManual = () => {
  if (!newBlockIp.value.trim()) return toast.error('Enter an IP address')
  doBlockIp(newBlockIp.value.trim(), newBlockReason.value.trim()).then(() => {
    newBlockIp.value = ''
    newBlockReason.value = ''
  })
}

const unblockIp = async (ip) => {
  if (!confirm(`Unblock IP ${ip}?`)) return
  try {
    await api.delete(`/admin/security/blocked-ips/${encodeURIComponent(ip)}`)
    toast.success(`IP ${ip} has been unblocked`)
    fetchBlockedIps()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to unblock IP')
  }
}

const refreshAll = () => {
  fetchSummary()
  fetchHistory()
  fetchEvents(pagination.value.page)
  fetchBlockedIps()
}

onMounted(() => {
  fetchSummary()
  fetchHistory()
  fetchEvents(1)
  fetchBlockedIps()
})
</script>

<style scoped>
.manage-page { background: var(--dark); min-height: 100vh; color: var(--text-primary); }
.page-header { padding: 20px 30px; background: var(--dark-card); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }

.header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
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

.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
.summary-card {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.summary-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.icon-total { background: rgba(108,92,231,0.15); color: #6c5ce7; }
.icon-danger { background: rgba(239,68,68,0.15); color: #ef4444; }
.icon-warning { background: rgba(245,158,11,0.15); color: #f59e0b; }
.icon-info { background: rgba(59,130,246,0.15); color: #3b82f6; }
.summary-value { font-size: 22px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
.summary-label { font-size: 12px; color: var(--text-secondary); }

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
.day-chip.has-issues:not(.active) { border-color: rgba(239,68,68,0.4); }
.day-chip.placeholder { opacity: 0.3; pointer-events: none; }
.day-label { font-weight: 700; font-size: 13px; color: var(--text-primary); }
.day-orders { font-size: 12px; color: var(--text-secondary); }
.day-alert { font-size: 12px; font-weight: 600; color: #ef4444; }
.day-ok { font-size: 12px; font-weight: 600; color: #10b981; }

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

.filters-card { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
.form-group { margin-bottom: 0; }
.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 5px;
}
.form-group select, .form-group input {
  padding: 8px 12px;
  border: 1px solid var(--dark-border);
  border-radius: 8px;
  background: var(--dark-surface);
  color: var(--text-primary);
  font-size: 13px;
  min-width: 160px;
}
.btn-clear {
  padding: 8px 14px;
  border: 1px solid var(--dark-border);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
}
.btn-clear:hover { color: #ef4444; border-color: #ef4444; }

.table-card { background: var(--dark-card); border: 1px solid var(--dark-border); border-radius: 15px; padding: 20px; overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { text-align: left; padding: 12px; color: var(--text-secondary); font-size: 13px; border-bottom: 1px solid var(--dark-border); }
.data-table td { padding: 12px; border-bottom: 1px solid var(--dark-border); font-size: 14px; }
.data-table code { background: var(--dark-surface); padding: 2px 8px; border-radius: 4px; font-size: 12px; color: var(--text-secondary); }

.status-badge { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
.status-danger { background: rgba(239,68,68,0.15); color: #ef4444; }

.badge-event { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
.badge-danger { background: rgba(239,68,68,0.15); color: #ef4444; }
.badge-warning { background: rgba(245,158,11,0.15); color: #f59e0b; }
.badge-info { background: rgba(59,130,246,0.15); color: #3b82f6; }
.badge-neutral { background: rgba(71,85,105,0.15); color: #94a3b8; }

.details-cell code { white-space: normal; word-break: break-all; }
.nowrap { white-space: nowrap; }

.btn-link { background: none; border: none; color: var(--primary); cursor: pointer; font-size: 13px; padding: 0; text-decoration: underline; }

.action-cell { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.btn-block {
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.3);
  color: #ef4444;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-block:hover { background: rgba(239,68,68,0.2); }

.btn-unblock {
  background: rgba(16,185,129,0.12);
  border: 1px solid rgba(16,185,129,0.3);
  color: #10b981;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-unblock:hover { background: rgba(16,185,129,0.2); }

.block-ip-form {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--dark-border);
}
.block-ip-form .filter-input { flex: 1; min-width: 180px; }

.pagination-bar { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 18px; }
.page-btn { background: var(--dark-hover); border: 1px solid var(--dark-border); color: var(--text-primary); padding: 7px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn:not(:disabled):hover { border-color: var(--primary); }
.page-info { color: var(--text-secondary); font-size: 13px; }

.text-muted-custom { color: var(--text-secondary); }
.text-center { text-align: center; }
</style>

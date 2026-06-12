<template>
  <div class="page-container">
    <div class="page-header">
      <h2><i class="bi bi-calendar-event"></i> Reservations</h2>
      <div class="header-filters">
        <input v-model="filterDate" type="date" class="filter-input" @change="loadReservations" />
        <select v-model="filterStatus" class="filter-input" @change="loadReservations">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
      </div>
    </div>

    <div class="section-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Date</th>
            <th>Time</th>
            <th>Guests</th>
            <th>Table</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in reservations" :key="r.id">
            <td>#{{ r.id }}</td>
            <td>{{ r.customer_name }}</td>
            <td>{{ r.customer_phone || '-' }}</td>
            <td>{{ r.reservation_date ? new Date(r.reservation_date).toLocaleDateString() : '-' }}</td>
            <td>{{ r.reservation_time || '-' }}</td>
            <td>{{ r.guests }}</td>
            <td>{{ r.table_number ? 'Table ' + r.table_number : 'Any' }}</td>
            <td>
              <span :class="'status-badge status-' + r.status">{{ r.status }}</span>
            </td>
            <td>
              <div class="action-btns">
                <button v-if="r.status === 'pending'" class="btn-sm btn-confirm" @click="updateStatus(r.id, 'confirmed')">
                  <i class="bi bi-check-lg"></i>
                </button>
                <button v-if="['pending','confirmed'].includes(r.status)" class="btn-sm btn-cancel-action" @click="updateStatus(r.id, 'cancelled')">
                  <i class="bi bi-x-lg"></i>
                </button>
                <button v-if="r.status === 'confirmed'" class="btn-sm btn-complete" @click="updateStatus(r.id, 'completed')">
                  <i class="bi bi-check-circle"></i>
                </button>
                <button v-if="r.status === 'confirmed'" class="btn-sm btn-noshow" @click="updateStatus(r.id, 'no_show')">
                  <i class="bi bi-person-x"></i>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!reservations.length">
            <td colspan="9" class="text-center">No reservations found</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToastStore } from '../../store/toast'
const toast = useToastStore()
import api from '../../services/api'

const reservations = ref([])
const filterDate = ref('')
const filterStatus = ref('')

onMounted(() => loadReservations())

async function loadReservations() {
  try {
    const params = {}
    if (filterDate.value) params.date = filterDate.value
    if (filterStatus.value) params.status = filterStatus.value
    const res = await api.get('/reservations', { params })
    reservations.value = res.data.data || []
  } catch (e) {
    console.error(e)
  }
}

async function updateStatus(id, status) {
  try {
    await api.put(`/reservations/${id}/status`, { status })
    loadReservations()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Error updating reservation')
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.header-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.filter-input {
  padding: 8px 12px;
  border: 1px solid var(--dark-border, #334155);
  border-radius: 8px;
  background: var(--dark-card, #1e293b);
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
.status-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}
.status-pending { background: #fef3c7; color: #92400e; }
.status-confirmed { background: #dbeafe; color: #1e40af; }
.status-completed { background: #dcfce7; color: #166534; }
.status-cancelled { background: #fee2e2; color: #991b1b; }
.status-no_show { background: #fae8ff; color: #86198f; }
.action-btns { display: flex; gap: 4px; }
.btn-sm {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--dark-border);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.btn-confirm { color: #22c55e; }
.btn-confirm:hover { background: rgba(34,197,94,0.15); }
.btn-cancel-action { color: #ef4444; }
.btn-cancel-action:hover { background: rgba(239,68,68,0.15); }
.btn-complete { color: #3b82f6; }
.btn-complete:hover { background: rgba(59,130,246,0.15); }
.btn-noshow { color: #a855f7; }
.btn-noshow:hover { background: rgba(168,85,247,0.15); }
.text-center { text-align: center; color: var(--text-muted); padding: 20px; }
</style>

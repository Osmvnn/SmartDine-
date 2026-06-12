<template>
  <div class="page-container">
    <div class="page-header">
      <h2><i class="bi bi-journal-text"></i> Audit Log</h2>
    </div>

    <div class="section-card filters-card">
      <div class="form-group">
        <label>Entity Type</label>
        <select v-model="entityType" @change="loadLog(1)">
          <option value="">All</option>
          <option v-for="t in entityTypes" :key="t" :value="t">{{ formatEntity(t) }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>Action</label>
        <select v-model="action" @change="loadLog(1)">
          <option value="">All</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="refund">Refund</option>
        </select>
      </div>
      <button class="btn-clear" @click="clearFilters" v-if="entityType || action">
        <i class="bi bi-x-circle"></i> Clear Filters
      </button>
    </div>

    <div class="section-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Entity ID</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in logs" :key="entry.id">
            <td class="nowrap">{{ formatDate(entry.created_at) }}</td>
            <td>{{ entry.user_name || 'Unknown' }}</td>
            <td>
              <span :class="'badge-action badge-' + entry.action">{{ entry.action }}</span>
            </td>
            <td>{{ formatEntity(entry.entity_type) }}</td>
            <td>{{ entry.entity_id ?? '-' }}</td>
            <td class="details-cell">
              <code v-if="entry.details">{{ summarizeDetails(entry.details) }}</code>
              <span v-else class="text-muted">-</span>
            </td>
          </tr>
          <tr v-if="!logs.length">
            <td colspan="6" class="text-center">No audit log entries</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" v-if="pagination.pages > 1">
        <button class="btn-page" :disabled="pagination.page <= 1" @click="loadLog(pagination.page - 1)">
          <i class="bi bi-chevron-left"></i> Prev
        </button>
        <span class="page-info">Page {{ pagination.page }} of {{ pagination.pages }} ({{ pagination.total }} entries)</span>
        <button class="btn-page" :disabled="pagination.page >= pagination.pages" @click="loadLog(pagination.page + 1)">
          Next <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const logs = ref([])
const entityTypes = ref([])
const entityType = ref('')
const action = ref('')
const pagination = ref({ page: 1, limit: 20, total: 0, pages: 0 })

onMounted(() => loadLog(1))

async function loadLog(page = 1) {
  try {
    const params = { page, limit: pagination.value.limit || 20 }
    if (entityType.value) params.entity_type = entityType.value
    if (action.value) params.action = action.value
    const res = await api.get('/admin/audit-log', { params })
    logs.value = res.data.data || []
    pagination.value = res.data.pagination
    if (res.data.entityTypes) entityTypes.value = res.data.entityTypes
  } catch (e) {
    console.error(e)
  }
}

function clearFilters() {
  entityType.value = ''
  action.value = ''
  loadLog(1)
}

function formatEntity(type) {
  if (!type) return '-'
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatDate(d) {
  return new Date(d).toLocaleString()
}

function summarizeDetails(details) {
  try {
    const obj = JSON.parse(details)
    const entries = Object.entries(obj)
      .filter(([k]) => !['image', 'image_url'].includes(k))
      .slice(0, 4)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
    return entries.join(', ')
  } catch {
    return details
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
.filters-card {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.form-group {
  margin-bottom: 0;
}
.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 5px;
}
.form-group select {
  padding: 8px 12px;
  border: 1px solid var(--dark-border, #334155);
  border-radius: 8px;
  background: var(--dark-card, #1e293b);
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
.btn-clear:hover { color: var(--danger, #ef4444); border-color: var(--danger, #ef4444); }
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
.data-table td {
  color: var(--text-secondary, #94a3b8);
}
.nowrap { white-space: nowrap; }
.details-cell code {
  background: var(--dark-card, #1e293b);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  white-space: normal;
  word-break: break-all;
}
.text-muted { color: var(--text-muted, #64748b); }
.text-center { text-align: center; color: var(--text-muted); padding: 20px; }
.badge-action {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}
.badge-create { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
.badge-update { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.badge-delete { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.badge-refund { background: rgba(249, 115, 22, 0.15); color: #f97316; }
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--dark-border, #334155);
}
.btn-page {
  padding: 6px 14px;
  border: 1px solid var(--dark-border);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-page:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-page:not(:disabled):hover { color: var(--primary); border-color: var(--primary); }
.page-info { font-size: 13px; color: var(--text-secondary); }
</style>

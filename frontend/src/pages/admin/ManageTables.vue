<template>
  <div class="manage-page">
    <div class="page-header">
      <h4><i class="bi bi-columns-gap"></i> Manage Tables</h4>
      <button class="btn-add" @click="openModal()">+ Add Table</button>
    </div>

    <div class="container-fluid mt-4 px-4">
      <div class="row">
        <div v-for="table in tables" :key="table.id" class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div :class="['table-card', 'status-' + table.status]">
            <div class="table-number">{{ table.table_number }}</div>
            <p class="table-cap">Capacity: {{ table.capacity }}</p>
            <span :class="'status-badge badge-' + table.status">{{ table.status }}</span>
            <p class="waiter-info" v-if="table.waiter_name"><i class="bi bi-person"></i> {{ table.waiter_name }}</p>
            <p class="waiter-info unassigned" v-else>No waiter assigned</p>

            <div class="qr-box" @click="openQRModal(table)">
              <QrcodeVue :value="getQRUrl(table)" :size="80" level="M" render-as="svg" />
            </div>
            <p class="qr-hint">Tap to view/print QR</p>

            <div class="card-actions">
              <button class="btn-edit" @click="openModal(table)">Edit</button>
              <button class="btn-assign" @click="openAssignModal(table)">Assign</button>
              <button class="btn-delete" @click="deleteTable(table.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <h5>{{ editing ? 'Edit Table' : 'Add Table' }}</h5>
        <div class="form-group">
          <label>Table Number</label>
          <input v-model="form.table_number" type="number" class="form-input" />
        </div>
        <div class="form-group">
          <label>Capacity</label>
          <input v-model="form.capacity" type="number" class="form-input" />
        </div>
        <div v-if="editing" class="form-group">
          <label>Status</label>
          <select v-model="form.status" class="form-input">
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
          </select>
        </div>
        <p v-if="modalError" class="text-danger">{{ modalError }}</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">Cancel</button>
          <button class="btn-save" @click="saveTable">{{ editing ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>

    <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
      <div class="modal-card">
        <h5>Assign Waiter to Table #{{ assignTable?.table_number }}</h5>
        <div class="form-group">
          <label>Select Waiter</label>
          <select v-model="selectedWaiterId" class="form-input">
            <option :value="null">-- No Waiter --</option>
            <option v-for="w in waiters" :key="w.id" :value="w.id" :disabled="w.table_count >= 5 && w.id !== assignTable?.waiter_id">
              {{ w.name }} ({{ w.table_count }}/5 tables)
            </option>
          </select>
        </div>
        <p v-if="assignError" class="text-danger">{{ assignError }}</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showAssignModal = false">Cancel</button>
          <button class="btn-save" @click="assignWaiter">Assign</button>
        </div>
      </div>
    </div>

    <div v-if="showQRModal" class="modal-overlay" @click.self="showQRModal = false">
      <div class="modal-card qr-modal">
        <h5>Table #{{ qrTable?.table_number }} — QR Code</h5>
        <p class="qr-url-label">Customers scan this to start ordering</p>
        <div class="qr-large" ref="qrPrintArea">
          <div class="qr-print-header">
            <h2>Smart Dine</h2>
            <h3>Table {{ qrTable?.table_number }}</h3>
          </div>
          <QrcodeVue :value="getQRUrl(qrTable)" :size="220" level="H" render-as="svg" />
          <p class="qr-print-footer">Scan to order</p>
        </div>
        <p class="qr-url-text">{{ getQRUrl(qrTable) }}</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showQRModal = false">Close</button>
          <button class="btn-save" @click="printQR"><i class="bi bi-printer"></i> Print QR</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToastStore } from '../../store/toast'
const toast = useToastStore()
import api from '../../services/api'
import QrcodeVue from 'qrcode.vue'

const tables = ref([])
const showModal = ref(false)
const editing = ref(false)
const editId = ref(null)
const modalError = ref(null)
const form = ref({ table_number: '', capacity: 4, status: 'available' })

const showAssignModal = ref(false)
const assignTable = ref(null)
const selectedWaiterId = ref(null)
const waiters = ref([])
const assignError = ref(null)

const showQRModal = ref(false)
const qrTable = ref(null)
const qrPrintArea = ref(null)

const getQRUrl = (table) => {
  if (!table) return ''
  return `${window.location.origin}/table/${table.qr_token}`
}

const openQRModal = (table) => {
  qrTable.value = table
  showQRModal.value = true
}

const printQR = () => {
  const content = qrPrintArea.value
  if (!content) return
  const win = window.open('', '_blank')
  win.document.write(`
    <html><head><title>Table ${qrTable.value.table_number} QR</title>
    <style>
      body { display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: Arial, sans-serif; }
      .wrap { text-align: center; }
      h2 { margin: 0 0 5px; font-size: 28px; }
      h3 { margin: 0 0 20px; font-size: 22px; color: #6c5ce7; }
      p { margin-top: 15px; font-size: 16px; color: #666; }
    </style></head>
    <body><div class="wrap">${content.innerHTML}</div></body></html>
  `)
  win.document.close()
  win.print()
}

const fetchTables = async () => {
  const res = await api.get('/admin/tables')
  tables.value = res.data.data
}

const fetchWaiters = async () => {
  const res = await api.get('/admin/waiters')
  waiters.value = res.data.data
}

const openAssignModal = (table) => {
  assignTable.value = table
  selectedWaiterId.value = table.waiter_id || null
  assignError.value = null
  fetchWaiters()
  showAssignModal.value = true
}

const assignWaiter = async () => {
  try {
    await api.put(`/admin/tables/${assignTable.value.id}/assign`, {
      waiter_id: selectedWaiterId.value
    })
    showAssignModal.value = false
    fetchTables()
  } catch (err) {
    assignError.value = err.response?.data?.message || 'Failed to assign'
  }
}

const openModal = (table = null) => {
  modalError.value = null
  if (table) {
    editing.value = true
    editId.value = table.id
    form.value = { table_number: table.table_number, capacity: table.capacity, status: table.status }
  } else {
    editing.value = false
    editId.value = null
    form.value = { table_number: '', capacity: 4, status: 'available' }
  }
  showModal.value = true
}

const saveTable = async () => {
  try {
    if (editing.value) {
      await api.put(`/admin/tables/${editId.value}`, form.value)
    } else {
      await api.post('/admin/tables', form.value)
    }
    showModal.value = false
    fetchTables()
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Failed to save'
  }
}

const deleteTable = async (id) => {
  if (!confirm('Delete this table?')) return
  try {
    await api.delete(`/admin/tables/${id}`)
    fetchTables()
  } catch (err) {
    toast.error('Failed to delete table')
  }
}

onMounted(fetchTables)
</script>

<style scoped>
.manage-page { background: var(--dark); min-height: 100vh; color: var(--text-primary); }
.page-header { padding: 20px 30px; background: var(--dark-card); display: flex; justify-content: space-between; align-items: center; }
.btn-add { background: var(--primary); border: none; padding: 8px 18px; border-radius: 10px; color: #fff; font-weight: 600; }

.table-card { background: var(--dark-card); border-radius: 15px; padding: 20px; text-align: center; transition: 0.3s; }
.table-card:hover { transform: translateY(-3px); }
.table-number { font-size: 36px; font-weight: 800; color: var(--primary); }
.table-cap { color: var(--text-secondary); font-size: 14px; margin: 5px 0; }
.qr-token { color: var(--text-muted); font-size: 12px; margin-top: 8px; }

.status-badge { padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; }
.badge-available { background: #10b98122; color: #10b981; }
.badge-occupied { background: #ef444422; color: #ef4444; }
.badge-reserved { background: #f59e0b22; color: #f59e0b; }

.card-actions { display: flex; gap: 8px; justify-content: center; margin-top: 12px; }
.btn-edit { background: #3b82f6; border: none; padding: 6px 14px; border-radius: 8px; color: white; font-size: 13px; }
.btn-assign { background: #f59e0b; border: none; padding: 6px 14px; border-radius: 8px; color: white; font-size: 13px; }
.btn-delete { background: #ef4444; border: none; padding: 6px 14px; border-radius: 8px; color: white; font-size: 13px; }

.waiter-info { color: var(--secondary); font-size: 13px; margin-top: 6px; font-weight: 600; }
.waiter-info.unassigned { color: var(--text-muted); font-weight: 400; }

.qr-box { display: inline-flex; background: #fff; padding: 8px; border-radius: 10px; cursor: pointer; margin-top: 8px; transition: 0.2s; }
.qr-box:hover { transform: scale(1.05); }
.qr-hint { color: var(--text-muted); font-size: 11px; margin-top: 4px; }

.qr-modal { max-width: 480px; }
.qr-url-label { color: var(--text-secondary); font-size: 13px; margin-bottom: 20px; }
.qr-large { text-align: center; background: #fff; padding: 30px; border-radius: 16px; margin-bottom: 15px; }
.qr-large svg { display: inline-block; }
.qr-print-header { margin-bottom: 15px; }
.qr-print-header h2 { color: #1e293b; margin: 0; font-size: 22px; }
.qr-print-header h3 { color: var(--primary); margin: 5px 0 0; font-size: 18px; }
.qr-print-footer { color: #64748b; font-size: 14px; margin: 12px 0 0; }
.qr-url-text { color: var(--text-secondary); font-size: 12px; word-break: break-all; text-align: center; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: var(--dark-card); border-radius: 20px; padding: 30px; width: 100%; max-width: 420px; }
.modal-card h5 { margin-bottom: 20px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; color: var(--text-secondary); font-size: 14px; margin-bottom: 5px; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid var(--dark-border); border-radius: 8px; background: var(--dark-surface); color: var(--text-primary); }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.btn-cancel { flex: 1; padding: 10px; background: var(--dark-hover); border: none; border-radius: 10px; color: var(--text-primary); }
.btn-save { flex: 1; padding: 10px; background: var(--primary); border: none; border-radius: 10px; color: #fff; font-weight: 600; }
.text-danger { color: #ef4444; }
</style>

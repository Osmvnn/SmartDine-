<template>
  <div class="page-container">
    <div class="page-header d-flex justify-content-between align-items-center flex-wrap gap-2">
      <div>
        <h2><i class="bi bi-box-seam"></i> Inventory</h2>
        <p class="text-muted mb-0" style="font-size:13px">Restaurant supplies &amp; materials</p>
      </div>
      <button class="btn-primary" @click="openAddModal">
        <i class="bi bi-plus-lg me-1"></i> Add Item
      </button>
    </div>

    <div class="summary-row" v-if="summary.total > 0">
      <span class="sum-badge total"><i class="bi bi-layers"></i> {{ summary.total }} Items</span>
      <span class="sum-badge warning" v-if="summary.lowStock > 0"><i class="bi bi-exclamation-triangle"></i> {{ summary.lowStock }} Low Stock</span>
      <span class="sum-badge danger" v-if="summary.outOfStock > 0"><i class="bi bi-x-circle"></i> {{ summary.outOfStock }} Out of Stock</span>
    </div>

    <div class="filter-bar">
      <input v-model="search" type="text" placeholder="Search items or supplier..." class="filter-input" />
      <select v-model="filterCategory" class="filter-select">
        <option value="">All Categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <button class="btn-ghost" @click="search=''; filterCategory=''">Clear</button>
    </div>

    <div v-if="loading" class="section-card">
      <div v-for="n in 6" :key="n" class="skeleton-row"></div>
    </div>

    <div v-else-if="error" class="section-card text-center py-4">
      <i class="bi bi-exclamation-circle text-danger" style="font-size:2rem"></i>
      <p class="mt-2">{{ error }}</p>
      <button class="btn-primary" @click="loadItems">Retry</button>
    </div>

    <div v-else class="section-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Unit</th>
            <th>Quantity</th>
            <th>Min. Stock</th>
            <th>Cost/Unit</th>
            <th>Supplier</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <TransitionGroup name="fade-row" tag="tbody">
            <tr v-for="item in filteredItems" :key="item.id">
              <td class="item-name">{{ item.name }}</td>
              <td><span class="cat-badge">{{ item.category }}</span></td>
              <td>{{ item.unit }}</td>
              <td>
                <span :class="['qty-val', item.status]">{{ item.quantity }}</span>
              </td>
              <td>{{ item.min_quantity }}</td>
              <td>{{ item.cost_per_unit > 0 ? formatAmount(item.cost_per_unit) : '—' }}</td>
              <td>{{ item.supplier || '—' }}</td>
              <td>
                <span v-if="item.status === 'out_of_stock'" class="badge-danger">Out of Stock</span>
                <span v-else-if="item.status === 'low_stock'" class="badge-warning">Low Stock</span>
                <span v-else class="badge-success">In Stock</span>
              </td>
              <td>
                <div class="action-btns">
                  <button class="btn-icon info" title="Restock" @click="openRestock(item)"><i class="bi bi-arrow-up-circle"></i></button>
                  <button class="btn-icon edit" title="Edit" @click="openEdit(item)"><i class="bi bi-pencil"></i></button>
                  <button class="btn-icon del" title="Delete" @click="deleteItem(item)"><i class="bi bi-trash"></i></button>
                </div>
              </td>
            </tr>
          </TransitionGroup>
          <tr v-if="!filteredItems.length">
            <td colspan="9" class="text-center py-3" style="color:#64748b">No inventory items found</td>
          </tr>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal=false">
      <div class="modal-box">
        <div class="modal-header">
          <h5>{{ editItem ? 'Edit Item' : 'Add Inventory Item' }}</h5>
          <button class="modal-close" @click="showModal=false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>Name *</label>
              <input v-model="form.name" type="text" class="form-input" placeholder="e.g. Coffee Beans" />
            </div>
            <div class="form-group">
              <label>Category</label>
              <input v-model="form.category" type="text" class="form-input" list="cat-list" placeholder="e.g. Food, Cleaning" />
              <datalist id="cat-list">
                <option v-for="cat in categories" :key="cat" :value="cat" />
              </datalist>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Unit</label>
              <input v-model="form.unit" type="text" class="form-input" list="unit-list" placeholder="kg, pcs, liters..." />
              <datalist id="unit-list">
                <option value="kg" /><option value="liters" /><option value="pcs" />
                <option value="boxes" /><option value="packs" /><option value="bottles" /><option value="rolls" />
              </datalist>
            </div>
            <div class="form-group">
              <label>Current Quantity</label>
              <input v-model.number="form.quantity" type="number" min="0" step="0.01" class="form-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Min. Stock Alert</label>
              <input v-model.number="form.min_quantity" type="number" min="0" step="0.01" class="form-input" />
            </div>
            <div class="form-group">
              <label>Cost per Unit ($)</label>
              <input v-model.number="form.cost_per_unit" type="number" min="0" step="0.01" class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label>Supplier</label>
            <input v-model="form.supplier" type="text" class="form-input" placeholder="Supplier name (optional)" />
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="form.notes" class="form-input" rows="2" placeholder="Optional notes"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" @click="showModal=false">Cancel</button>
          <button class="btn-primary" :disabled="saving" @click="saveItem">
            <span v-if="saving"><i class="bi bi-hourglass-split me-1"></i> Saving...</span>
            <span v-else>{{ editItem ? 'Update' : 'Add Item' }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showRestock" class="modal-overlay" @click.self="showRestock=false">
      <div class="modal-box modal-sm">
        <div class="modal-header">
          <h5><i class="bi bi-arrow-up-circle me-2"></i>Restock: {{ restockTarget?.name }}</h5>
          <button class="modal-close" @click="showRestock=false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <p class="text-muted" style="font-size:13px">
            Current stock: <strong>{{ restockTarget?.quantity }} {{ restockTarget?.unit }}</strong>
          </p>
          <div class="form-group">
            <label>Add Amount ({{ restockTarget?.unit }})</label>
            <input v-model.number="restockAmount" type="number" min="0.01" step="0.01" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" @click="showRestock=false">Cancel</button>
          <button class="btn-primary" :disabled="saving" @click="submitRestock">
            <span v-if="saving">Updating...</span>
            <span v-else>Restock</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../../services/api'
import { useToastStore } from '../../store/toast'
import { formatMoney, getCurrency } from '../../utils/currency'
const toast = useToastStore()

const items = ref([])
const currency = ref(getCurrency())
const formatAmount = (amount) => formatMoney(amount, currency.value)
const onCurrencyChanged = (event) => { currency.value = event.detail || getCurrency() }
const categories = ref([])
const summary = ref({ total: 0, outOfStock: 0, lowStock: 0 })
const loading = ref(true)
const error = ref(null)
const search = ref('')
const filterCategory = ref('')

const showModal = ref(false)
const editItem = ref(null)
const saving = ref(false)
const form = ref({})

const showRestock = ref(false)
const restockTarget = ref(null)
const restockAmount = ref(1)

const filteredItems = computed(() => {
  let list = items.value
  if (filterCategory.value) list = list.filter(i => i.category === filterCategory.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.supplier || '').toLowerCase().includes(q)
    )
  }
  return list
})

onMounted(async () => {
  await loadItems()
  loadCategories()
  window.addEventListener('currency-changed', onCurrencyChanged)
})

onUnmounted(() => {
  window.removeEventListener('currency-changed', onCurrencyChanged)
})

async function loadItems() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/inventory')
    items.value = res.data.data || []
    summary.value = res.data.summary || {}
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load inventory'
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const res = await api.get('/inventory/categories')
    categories.value = res.data.data || []
  } catch {}
}

function openAddModal() {
  editItem.value = null
  form.value = { name: '', category: 'General', unit: 'pcs', quantity: 0, min_quantity: 5, cost_per_unit: 0, supplier: '', notes: '' }
  showModal.value = true
}

function openEdit(item) {
  editItem.value = item
  form.value = { ...item }
  showModal.value = true
}

async function saveItem() {
  if (!form.value.name?.trim()) return toast.error('Item name is required')
  saving.value = true
  try {
    if (editItem.value) {
      await api.put(`/inventory/${editItem.value.id}`, form.value)
      toast.success('Item updated')
    } else {
      await api.post('/inventory', form.value)
      toast.success('Item added')
    }
    showModal.value = false
    await loadItems()
    loadCategories()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Save failed')
  } finally {
    saving.value = false
  }
}

async function deleteItem(item) {
  if (!confirm(`Delete "${item.name}"?`)) return
  try {
    await api.delete(`/inventory/${item.id}`)
    toast.success('Item deleted')
    await loadItems()
    loadCategories()
  } catch (e) {
    toast.error('Delete failed')
  }
}

function openRestock(item) {
  restockTarget.value = item
  restockAmount.value = 1
  showRestock.value = true
}

async function submitRestock() {
  if (!restockAmount.value || restockAmount.value <= 0) return toast.error('Enter a positive amount')
  saving.value = true
  try {
    const res = await api.post(`/inventory/${restockTarget.value.id}/restock`, { amount: restockAmount.value })
    toast.success(res.data.message || 'Restocked')
    showRestock.value = false
    await loadItems()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Restock failed')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: var(--dark);
  color: var(--text-primary);
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 18px 24px;
  background: var(--dark-card);
  border-bottom: 1px solid var(--dark-border);
}

.page-header h2 {
  margin: 0;
  font-size: clamp(1rem, 3vw, 1.3rem);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 24px;
}

.sum-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.sum-badge.total   { background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.25); }
.sum-badge.warning { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.25); }
.sum-badge.danger  { background: rgba(239,68,68,0.15);  color: #f87171; border: 1px solid rgba(239,68,68,0.25); }

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 24px;
  align-items: center;
}

.filter-input {
  flex: 1;
  min-width: 160px;
  padding: 9px 14px;
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  background: var(--dark-surface);
  color: var(--text-primary);
  font-size: 14px;
}

.filter-input:focus {
  outline: none;
  border-color: var(--primary);
}

.filter-select {
  padding: 9px 14px;
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  background: var(--dark-surface);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  min-width: 140px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
}

.btn-ghost {
  padding: 9px 16px;
  background: transparent;
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: 0.15s;
  white-space: nowrap;
}

.btn-ghost:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: var(--primary);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  white-space: nowrap;
}

.btn-primary:hover { background: var(--primary-hover); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.section-card {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 16px;
  margin: 0 20px 20px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.skeleton-row {
  height: 44px;
  background: linear-gradient(90deg, var(--dark-border), var(--dark-hover), var(--dark-border));
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
  margin: 8px 16px;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 700px;
}

.data-table th {
  padding: 12px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--dark-border);
  white-space: nowrap;
  position: sticky;
  top: 0;
  background: var(--dark-card);
  z-index: 1;
}

.data-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--dark-border);
  vertical-align: middle;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: var(--dark-hover);
}

.item-name {
  font-weight: 600;
  color: var(--text-primary);
}

.cat-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.qty-val {
  font-weight: 700;
  font-size: 15px;
}

.qty-val.ok         { color: #10b981; }
.qty-val.low_stock  { color: #f59e0b; }
.qty-val.out_of_stock { color: #ef4444; }

.badge-danger {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.badge-warning {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.badge-success {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.action-btns {
  display: flex;
  gap: 6px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: 0.15s;
}

.btn-icon.info { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.btn-icon.edit { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.btn-icon.del  { background: rgba(239, 68, 68, 0.15);  color: #f87171; }

.btn-icon:hover {
  filter: brightness(1.25);
  transform: scale(1.1);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-box {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 20px;
  width: 100%;
  max-width: 540px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  color: var(--text-primary);
}

.modal-box.modal-sm {
  max-width: 360px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid var(--dark-border);
}

.modal-header h5 {
  margin: 0;
  font-weight: 700;
  font-size: 15px;
  display: flex;
  align-items: center;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 18px;
  padding: 4px 6px;
  border-radius: 6px;
  transition: 0.15s;
}

.modal-close:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.modal-body {
  padding: 20px 22px;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 22px;
  border-top: 1px solid var(--dark-border);
}

.form-row {
  display: flex;
  gap: 14px;
}

.form-group {
  flex: 1;
  margin-bottom: 14px;
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

.form-input {
  width: 100%;
  padding: 10px 14px;
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

textarea.form-input {
  resize: vertical;
  min-height: 60px;
}

.text-muted { color: var(--text-secondary); }

@media (max-width: 640px) {
  .page-header { padding: 14px 16px; }
  .summary-row { padding: 10px 16px; }
  .filter-bar { padding: 10px 16px; }
  .section-card { margin: 0 12px 16px; }
  .form-row { flex-direction: column; gap: 0; }
  .modal-footer { flex-direction: column-reverse; }
  .modal-footer .btn-ghost,
  .modal-footer .btn-primary { width: 100%; justify-content: center; }
}
</style>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2><i class="bi bi-ticket-perforated"></i> Promo Codes</h2>
      <button class="btn-add" @click="openModal()">
        <i class="bi bi-plus-lg"></i> Add Promo
      </button>
    </div>

    <div class="section-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Type</th>
            <th>Value</th>
            <th>Min Order</th>
            <th>Uses</th>
            <th>Expires</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in promos" :key="p.id">
            <td><code>{{ p.code }}</code></td>
            <td>{{ p.discount_type }}</td>
            <td>{{ p.discount_type === 'percent' ? p.discount_value + '%' : formatAmount(p.discount_value) }}</td>
            <td>{{ formatAmount(p.min_order) }}</td>
            <td>{{ p.used_count }}{{ p.max_uses > 0 ? '/' + p.max_uses : '' }}</td>
            <td>{{ p.expires_at ? new Date(p.expires_at).toLocaleDateString() : 'Never' }}</td>
            <td>
              <span :class="p.is_active ? 'badge-active' : 'badge-inactive'">
                {{ p.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn-edit" @click="openModal(p)"><i class="bi bi-pencil"></i></button>
                <button class="btn-delete" @click="deletePromo(p.id)"><i class="bi bi-trash"></i></button>
              </div>
            </td>
          </tr>
          <tr v-if="!promos.length">
            <td colspan="8" class="text-center">No promo codes</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <h3>{{ editing ? 'Edit Promo' : 'Add Promo Code' }}</h3>
        <form @submit.prevent="savePromo">
          <div class="form-group">
            <label>Code</label>
            <input v-model="form.code" required placeholder="e.g. SUMMER20" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <input v-model="form.description" placeholder="Optional description" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Discount Type</label>
              <select v-model="form.discount_type" required>
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div class="form-group">
              <label>Value</label>
              <input v-model="form.discount_value" type="number" step="0.01" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Min Order ($)</label>
              <input v-model="form.min_order" type="number" step="0.01" />
            </div>
            <div class="form-group">
              <label>Max Uses (0 = unlimited)</label>
              <input v-model="form.max_uses" type="number" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Expires</label>
              <input v-model="form.expires_at" type="date" />
            </div>
            <div class="form-group" v-if="editing">
              <label>Status</label>
              <select v-model="form.is_active">
                <option :value="1">Active</option>
                <option :value="0">Inactive</option>
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn-save">{{ editing ? 'Update' : 'Create' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useToastStore } from '../../store/toast'
const toast = useToastStore()
import api from '../../services/api'
import { formatMoney, getCurrency } from '../../utils/currency'

const promos = ref([])
const showModal = ref(false)
const editing = ref(null)
const form = ref({})

const currency = ref(getCurrency())
const formatAmount = (amount) => formatMoney(amount, currency.value)
const onCurrencyChanged = (event) => { currency.value = event.detail || getCurrency() }

onMounted(() => {
  loadPromos()
  window.addEventListener('currency-changed', onCurrencyChanged)
})

onUnmounted(() => {
  window.removeEventListener('currency-changed', onCurrencyChanged)
})

async function loadPromos() {
  try {
    const res = await api.get('/promos')
    promos.value = res.data.data || []
  } catch (e) {
    console.error(e)
  }
}

function openModal(p = null) {
  if (p) {
    editing.value = p.id
    form.value = {
      code: p.code,
      description: p.description || '',
      discount_type: p.discount_type,
      discount_value: p.discount_value,
      min_order: p.min_order,
      max_uses: p.max_uses,
      expires_at: p.expires_at ? p.expires_at.split('T')[0] : '',
      is_active: p.is_active
    }
  } else {
    editing.value = null
    form.value = {
      code: '',
      description: '',
      discount_type: 'percent',
      discount_value: 10,
      min_order: 0,
      max_uses: 0,
      expires_at: '',
      is_active: 1
    }
  }
  showModal.value = true
}

async function savePromo() {
  try {
    if (editing.value) {
      await api.put(`/promos/${editing.value}`, form.value)
    } else {
      await api.post('/promos', form.value)
    }
    showModal.value = false
    loadPromos()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Error saving promo')
  }
}

async function deletePromo(id) {
  if (!confirm('Delete this promo code?')) return
  try {
    await api.delete(`/promos/${id}`)
    loadPromos()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Error deleting promo')
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
.btn-add {
  background: var(--primary);
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
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
.data-table td {
  color: var(--text-secondary, #94a3b8);
}
code {
  background: var(--dark-card, #1e293b);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  color: var(--primary);
}
.badge-active {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
.badge-inactive {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
.action-btns {
  display: flex;
  gap: 6px;
}
.btn-edit, .btn-delete {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid var(--dark-border, #334155);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--text-secondary);
}
.btn-edit:hover { color: var(--primary); border-color: var(--primary); }
.btn-delete:hover { color: var(--danger, #ef4444); border-color: var(--danger, #ef4444); }
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.modal-card {
  background: var(--dark-surface, #0f172a);
  border: 1px solid var(--dark-border, #334155);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  margin: 0 16px;
}
.modal-card h3 {
  color: var(--text-primary);
  margin-bottom: 20px;
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
  margin-bottom: 5px;
}
.form-group input, .form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--dark-border, #334155);
  border-radius: 8px;
  background: var(--dark-card, #1e293b);
  color: var(--text-primary);
  font-size: 13px;
}
.form-row {
  display: flex;
  gap: 12px;
}
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}
.btn-cancel {
  padding: 8px 18px;
  border: 1px solid var(--dark-border);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
}
.btn-save {
  padding: 8px 18px;
  border: none;
  background: var(--primary);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.text-center { text-align: center; color: var(--text-muted); padding: 20px; }
</style>

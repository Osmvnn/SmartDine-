<template>
  <div class="page-container">
    <div class="page-header">
      <h2><i class="bi bi-gem"></i> Loyalty Rewards</h2>
      <button class="btn-add" @click="openModal()">
        <i class="bi bi-plus-lg"></i> Add Reward
      </button>
    </div>

    <div class="section-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Points Cost</th>
            <th>Free Item</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rewards" :key="r.id">
            <td>{{ r.name }}</td>
            <td>{{ r.description || '-' }}</td>
            <td>{{ r.points_cost }} pts</td>
            <td>{{ r.item_name || '-' }}</td>
            <td>
              <span :class="r.is_active ? 'badge-active' : 'badge-inactive'">
                {{ r.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn-edit" @click="openModal(r)"><i class="bi bi-pencil"></i></button>
                <button class="btn-delete" @click="deleteReward(r.id)"><i class="bi bi-trash"></i></button>
              </div>
            </td>
          </tr>
          <tr v-if="!rewards.length">
            <td colspan="6" class="text-center">No loyalty rewards</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <h3>{{ editing ? 'Edit Reward' : 'Add Loyalty Reward' }}</h3>
        <form @submit.prevent="saveReward">
          <div class="form-group">
            <label>Name</label>
            <input v-model="form.name" required placeholder="e.g. Free Coffee" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <input v-model="form.description" placeholder="Optional description" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Points Cost</label>
              <input v-model="form.points_cost" type="number" min="1" required />
            </div>
            <div class="form-group">
              <label>Free Menu Item</label>
              <select v-model="form.menu_item_id">
                <option :value="null">-- None --</option>
                <option v-for="item in menuItems" :key="item.id" :value="item.id">
                  {{ item.name }} ({{ formatAmount(item.price) }})
                </option>
              </select>
            </div>
          </div>
          <div class="form-group" v-if="editing">
            <label>Status</label>
            <select v-model="form.is_active">
              <option :value="1">Active</option>
              <option :value="0">Inactive</option>
            </select>
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

const rewards = ref([])
const menuItems = ref([])
const showModal = ref(false)
const editing = ref(null)
const form = ref({})

const currency = ref(getCurrency())
const formatAmount = (amount) => formatMoney(amount, currency.value)
const onCurrencyChanged = (event) => { currency.value = event.detail || getCurrency() }

onMounted(() => {
  loadRewards()
  loadMenuItems()
  window.addEventListener('currency-changed', onCurrencyChanged)
})

onUnmounted(() => {
  window.removeEventListener('currency-changed', onCurrencyChanged)
})

async function loadRewards() {
  try {
    const res = await api.get('/admin/loyalty-rewards')
    rewards.value = res.data.data || []
  } catch (e) {
    console.error(e)
  }
}

async function loadMenuItems() {
  try {
    const res = await api.get('/admin/items')
    menuItems.value = res.data.data || []
  } catch (e) {
    console.error(e)
  }
}

function openModal(r = null) {
  if (r) {
    editing.value = r.id
    form.value = {
      name: r.name,
      description: r.description || '',
      points_cost: r.points_cost,
      menu_item_id: r.menu_item_id,
      is_active: r.is_active
    }
  } else {
    editing.value = null
    form.value = {
      name: '',
      description: '',
      points_cost: 100,
      menu_item_id: null,
      is_active: 1
    }
  }
  showModal.value = true
}

async function saveReward() {
  try {
    if (editing.value) {
      await api.put(`/admin/loyalty-rewards/${editing.value}`, form.value)
    } else {
      await api.post('/admin/loyalty-rewards', form.value)
    }
    showModal.value = false
    loadRewards()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Error saving reward')
  }
}

async function deleteReward(id) {
  if (!confirm('Delete this loyalty reward?')) return
  try {
    await api.delete(`/admin/loyalty-rewards/${id}`)
    loadRewards()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Error deleting reward')
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

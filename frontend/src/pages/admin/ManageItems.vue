<template>
  <div class="manage-page">
    <div class="page-header">
      <h4><i class="bi bi-cup-straw"></i> Manage Menu Items</h4>
      <button class="btn-add" @click="openModal()">+ Add Item</button>
    </div>

    <div class="container-fluid mt-4 px-4">
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Available</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.category_name }}</td>
              <td>{{ formatAmount(item.price) }}</td>
              <td>
                <span :class="item.is_available ? 'text-success' : 'text-danger'">
                  {{ item.is_available ? 'Yes' : 'No' }}
                </span>
              </td>
              <td>
                <button class="btn-edit" @click="openModal(item)">Edit</button>
                <button class="btn-modifiers" @click="openModifierModal(item)">Modifiers</button>
                <button class="btn-delete" @click="deleteItem(item.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <h5>{{ editing ? 'Edit Item' : 'Add Item' }}</h5>

        <div class="form-group">
          <label>Name</label>
          <input v-model="form.name" class="form-input" />
        </div>
        <div class="form-group">
          <label>Category</label>
          <select v-model="form.category_id" class="form-input">
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea v-model="form.description" class="form-input" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label>Price ($)</label>
          <input v-model="form.price" type="number" step="0.01" class="form-input" />
        </div>
        <div class="form-group">
          <label>Stock Quantity (-1 = unlimited)</label>
          <input v-model="form.stock_quantity" type="number" min="-1" class="form-input" />
        </div>
        <div class="form-group">
          <label>Image</label>
          <input type="file" accept="image/*" @change="onFileChange" class="form-input" />
          <img v-if="form.image_url" :src="getImageUrl(form.image_url)" class="img-preview" />
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="form.is_available" /> Available
          </label>
        </div>
        <div class="form-group">
          <label>Dietary Tags</label>
          <div class="dietary-tags-grid">
            <label v-for="tag in dietaryTagOptions" :key="tag.value" class="dietary-tag-checkbox">
              <input type="checkbox" :value="tag.value" v-model="form.dietary_tags" />
              {{ tag.label }}
            </label>
          </div>
        </div>

        <p v-if="modalError" class="text-danger">{{ modalError }}</p>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">Cancel</button>
          <button class="btn-save" @click="saveItem">{{ editing ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>

    <div v-if="showModifierModal" class="modal-overlay" @click.self="showModifierModal = false">
      <div class="modal-card">
        <h5>Modifiers - {{ modifierItem?.name }}</h5>

        <div v-if="modifiers.length" class="modifier-rows">
          <div v-for="mod in modifiers" :key="mod.id" class="modifier-row">
            <input v-model="mod.name" class="form-input modifier-name-input" />
            <input v-model="mod.price_delta" type="number" step="0.01" class="form-input modifier-price-input" />
            <button class="btn-edit" @click="saveModifierRow(mod)">Save</button>
            <button class="btn-delete" @click="deleteModifierRow(mod.id)">Delete</button>
          </div>
        </div>
        <p v-else class="text-secondary">No modifiers yet.</p>

        <hr class="modifier-divider" />

        <div class="modifier-row">
          <input v-model="newModifier.name" placeholder="Name (e.g. Extra Cheese)" class="form-input modifier-name-input" />
          <input v-model="newModifier.price_delta" type="number" step="0.01" placeholder="Price +/-" class="form-input modifier-price-input" />
          <button class="btn-save" @click="addModifier">Add</button>
        </div>

        <p v-if="modifierError" class="text-danger">{{ modifierError }}</p>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showModifierModal = false">Close</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '../../services/api'
import { useToastStore } from '../../store/toast'
import { formatMoney, getCurrency } from '../../utils/currency'
const toast = useToastStore()

const items = ref([])
const currency = ref(getCurrency())
const formatAmount = (amount) => formatMoney(amount, currency.value)
const onCurrencyChanged = (event) => { currency.value = event.detail || getCurrency() }
const categories = ref([])
const showModal = ref(false)
const editing = ref(false)
const editId = ref(null)
const modalError = ref(null)

const form = ref({ name: '', category_id: '', description: '', price: '', is_available: true, stock_quantity: -1, image_url: '', dietary_tags: [] })
const selectedFile = ref(null)

const dietaryTagOptions = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'dairy-free', label: 'Dairy-Free' },
  { value: 'nut-free', label: 'Nut-Free' },
  { value: 'spicy', label: 'Spicy' }
]

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('blob:')) return url
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
  return base + url
}

const onFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    selectedFile.value = file
    form.value.image_url = URL.createObjectURL(file)
  }
}

const fetchItems = async () => {
  const res = await api.get('/admin/items')
  items.value = res.data.data
}

const fetchCategories = async () => {
  const res = await api.get('/admin/categories')
  categories.value = res.data.data
}

const openModal = (item = null) => {
  modalError.value = null
  selectedFile.value = null
  if (item) {
    editing.value = true
    editId.value = item.id
    form.value = {
      name: item.name,
      category_id: item.category_id,
      description: item.description || '',
      price: item.price,
      is_available: !!item.is_available,
      stock_quantity: item.stock_quantity !== undefined ? item.stock_quantity : -1,
      image_url: item.image_url || '',
      dietary_tags: item.dietary_tags ? item.dietary_tags.split(',').filter(Boolean) : []
    }
  } else {
    editing.value = false
    editId.value = null
    form.value = { name: '', category_id: categories.value[0]?.id || '', description: '', price: '', is_available: true, stock_quantity: -1, image_url: '', dietary_tags: [] }
  }
  showModal.value = true
}

const saveItem = async () => {
  try {
    const fd = new FormData()
    fd.append('name', form.value.name)
    fd.append('category_id', form.value.category_id)
    fd.append('description', form.value.description || '')
    fd.append('price', form.value.price)
    fd.append('is_available', form.value.is_available ? 1 : 0)
    fd.append('stock_quantity', form.value.stock_quantity)
    fd.append('dietary_tags', form.value.dietary_tags.join(','))
    if (selectedFile.value) {
      fd.append('image', selectedFile.value)
    }

    if (editing.value) {
      await api.put(`/admin/items/${editId.value}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } else {
      await api.post('/admin/items', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
    showModal.value = false
    fetchItems()
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Failed to save'
  }
}

const deleteItem = async (id) => {
  if (!confirm('Delete this item?')) return
  try {
    await api.delete(`/admin/items/${id}`)
    fetchItems()
  } catch (err) {
    toast.error('Failed to delete item')
  }
}

const showModifierModal = ref(false)
const modifierItem = ref(null)
const modifiers = ref([])
const newModifier = ref({ name: '', price_delta: '' })
const modifierError = ref(null)

const openModifierModal = async (item) => {
  modifierItem.value = item
  modifierError.value = null
  newModifier.value = { name: '', price_delta: '' }
  showModifierModal.value = true
  await fetchModifiers()
}

const fetchModifiers = async () => {
  const res = await api.get(`/admin/items/${modifierItem.value.id}/modifiers`)
  modifiers.value = res.data.data
}

const addModifier = async () => {
  modifierError.value = null
  if (!newModifier.value.name || newModifier.value.price_delta === '') {
    modifierError.value = 'Name and price are required'
    return
  }
  try {
    await api.post(`/admin/items/${modifierItem.value.id}/modifiers`, {
      name: newModifier.value.name,
      price_delta: newModifier.value.price_delta
    })
    newModifier.value = { name: '', price_delta: '' }
    fetchModifiers()
  } catch (err) {
    modifierError.value = err.response?.data?.message || 'Failed to add modifier'
  }
}

const saveModifierRow = async (mod) => {
  modifierError.value = null
  try {
    await api.put(`/admin/modifiers/${mod.id}`, { name: mod.name, price_delta: mod.price_delta })
    fetchModifiers()
  } catch (err) {
    modifierError.value = err.response?.data?.message || 'Failed to update modifier'
  }
}

const deleteModifierRow = async (id) => {
  if (!confirm('Delete this modifier?')) return
  try {
    await api.delete(`/admin/modifiers/${id}`)
    fetchModifiers()
  } catch (err) {
    modifierError.value = err.response?.data?.message || 'Failed to delete modifier'
  }
}

onMounted(() => {
  fetchItems()
  fetchCategories()
  window.addEventListener('currency-changed', onCurrencyChanged)
})

onUnmounted(() => {
  window.removeEventListener('currency-changed', onCurrencyChanged)
})
</script>

<style scoped>
.manage-page { background: var(--dark); min-height: 100vh; color: var(--text-primary); }
.page-header { padding: 20px 30px; background: var(--dark-card); display: flex; justify-content: space-between; align-items: center; }
.btn-add { background: var(--primary); border: none; padding: 8px 18px; border-radius: 10px; color: #fff; font-weight: 600; }
.table-card { background: var(--dark-card); border: 1px solid var(--dark-border); border-radius: 15px; padding: 20px; overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { text-align: left; padding: 12px; color: var(--text-secondary); font-size: 13px; border-bottom: 1px solid var(--dark-border); }
.data-table td { padding: 12px; border-bottom: 1px solid var(--dark-border); font-size: 14px; }
.btn-edit { background: #3b82f6; border: none; padding: 5px 12px; border-radius: 6px; color: white; margin-right: 5px; font-size: 13px; }
.btn-delete { background: #ef4444; border: none; padding: 5px 12px; border-radius: 6px; color: white; font-size: 13px; }
.text-success { color: #10b981; }
.text-danger { color: #ef4444; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: var(--dark-card); border-radius: 20px; padding: 30px; width: 100%; max-width: 450px; color: var(--text-primary); }
.modal-card h5 { margin-bottom: 20px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; color: var(--text-secondary); font-size: 14px; margin-bottom: 5px; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid var(--dark-border); border-radius: 8px; background: var(--dark-surface); color: var(--text-primary); resize: none; }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.btn-cancel { flex: 1; padding: 10px; background: var(--dark-hover); border: none; border-radius: 10px; color: var(--text-primary); }
.btn-save { flex: 1; padding: 10px; background: var(--primary); border: none; border-radius: 10px; color: #fff; font-weight: 600; }
.img-preview { width: 100%; max-width: 200px; max-height: 120px; object-fit: cover; border-radius: 8px; margin-top: 8px; }
.btn-modifiers { background: #8b5cf6; border: none; padding: 5px 12px; border-radius: 6px; color: white; margin-right: 5px; font-size: 13px; }
.modifier-rows { display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto; }
.modifier-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
.modifier-name-input { flex: 2; }
.modifier-price-input { flex: 1; }
.modifier-divider { border-color: var(--dark-border); margin: 15px 0; }
.text-secondary { color: var(--text-secondary); }
.dietary-tags-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 12px; }
.dietary-tag-checkbox { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-secondary); cursor: pointer; margin-bottom: 0; font-weight: 400; }
.dietary-tag-checkbox input { width: auto; }
</style>

<template>
  <div class="manage-page">
    <div class="page-header">
      <h4><i class="bi bi-folder"></i> Manage Categories</h4>
      <button class="btn-add" @click="openModal()">+ Add Category</button>
    </div>

    <div class="container-fluid mt-4 px-4">
      <div class="row">
        <div v-for="cat in categories" :key="cat.id" class="col-lg-4 col-md-6 mb-4">
          <div class="cat-card">
            <h5>{{ cat.name }}</h5>
            <p>{{ cat.description || 'No description' }}</p>
            <div class="card-actions">
              <button class="btn-edit" @click="openModal(cat)">Edit</button>
              <button class="btn-delete" @click="deleteCategory(cat.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <h5>{{ editing ? 'Edit Category' : 'Add Category' }}</h5>
        <div class="form-group">
          <label>Name</label>
          <input v-model="form.name" class="form-input" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea v-model="form.description" class="form-input" rows="3"></textarea>
        </div>
        <p v-if="modalError" class="text-danger">{{ modalError }}</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">Cancel</button>
          <button class="btn-save" @click="saveCategory">{{ editing ? 'Update' : 'Create' }}</button>
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

const categories = ref([])
const showModal = ref(false)
const editing = ref(false)
const editId = ref(null)
const modalError = ref(null)
const form = ref({ name: '', description: '' })

const fetchCategories = async () => {
  const res = await api.get('/admin/categories')
  categories.value = res.data.data
}

const openModal = (cat = null) => {
  modalError.value = null
  if (cat) {
    editing.value = true
    editId.value = cat.id
    form.value = { name: cat.name, description: cat.description || '' }
  } else {
    editing.value = false
    editId.value = null
    form.value = { name: '', description: '' }
  }
  showModal.value = true
}

const saveCategory = async () => {
  try {
    if (editing.value) {
      await api.put(`/admin/categories/${editId.value}`, form.value)
    } else {
      await api.post('/admin/categories', form.value)
    }
    showModal.value = false
    fetchCategories()
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Failed to save'
  }
}

const deleteCategory = async (id) => {
  if (!confirm('Delete this category? All items in it will be removed.')) return
  try {
    await api.delete(`/admin/categories/${id}`)
    fetchCategories()
  } catch (err) {
    toast.error('Failed to delete category')
  }
}

onMounted(fetchCategories)
</script>

<style scoped>
.manage-page { background: var(--dark); min-height: 100vh; color: var(--text-primary); }
.page-header { padding: 20px 30px; background: var(--dark-card); display: flex; justify-content: space-between; align-items: center; }
.btn-add { background: var(--primary); border: none; padding: 8px 18px; border-radius: 10px; color: #fff; font-weight: 600; }

.cat-card { background: var(--dark-card); border: 1px solid var(--dark-border); border-radius: 15px; padding: 20px; }
.cat-card h5 { margin-bottom: 5px; color: var(--text-primary); }
.cat-card p { color: var(--text-secondary); font-size: 14px; margin-bottom: 15px; }

.card-actions { display: flex; gap: 8px; }
.btn-edit { background: #3b82f6; border: none; padding: 6px 14px; border-radius: 8px; color: white; font-size: 13px; }
.btn-delete { background: #ef4444; border: none; padding: 6px 14px; border-radius: 8px; color: white; font-size: 13px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: var(--dark-card); border-radius: 20px; padding: 30px; width: 100%; max-width: 450px; color: var(--text-primary); }
.modal-card h5 { margin-bottom: 20px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; color: var(--text-secondary); font-size: 14px; margin-bottom: 5px; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid var(--dark-border); border-radius: 8px; background: var(--dark-surface); color: var(--text-primary); resize: none; }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.btn-cancel { flex: 1; padding: 10px; background: var(--dark-hover); border: none; border-radius: 10px; color: var(--text-primary); }
.btn-save { flex: 1; padding: 10px; background: var(--primary); border: none; border-radius: 10px; color: #fff; font-weight: 600; }
.text-danger { color: #ef4444; }
</style>

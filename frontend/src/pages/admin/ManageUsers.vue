<template>
  <div class="manage-page">
    <div class="page-header">
      <h4><i class="bi bi-people"></i> Manage Users</h4>
      <button class="btn-add" @click="openModal()">+ Add User</button>
    </div>

    <div class="container-fluid mt-4 px-4">
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td><span :class="'role-badge role-' + user.role">{{ user.role }}</span></td>
              <td>
                <span :class="user.is_active ? 'text-success' : 'text-danger'">
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button class="btn-edit" @click="openModal(user)">Edit</button>
                <button class="btn-delete" @click="deleteUser(user.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <h5>{{ editing ? 'Edit User' : 'Add User' }}</h5>

        <div class="form-group">
          <label>Name</label>
          <input v-model="form.name" class="form-input" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" class="form-input" />
        </div>
        <div v-if="!editing" class="form-group">
          <label>Password</label>
          <input v-model="form.password" type="password" class="form-input" />
        </div>
        <div class="form-group">
          <label>Role</label>
          <select v-model="form.role" class="form-input">
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="kitchen">Kitchen</option>
            <option value="waiter">Waiter</option>
            <option value="cashier">Cashier</option>
            <option value="customer">Customer</option>
          </select>
        </div>
        <div v-if="editing" class="form-group">
          <label>
            <input type="checkbox" v-model="form.is_active" /> Active
          </label>
        </div>

        <p v-if="modalError" class="text-danger">{{ modalError }}</p>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">Cancel</button>
          <button class="btn-save" @click="saveUser">{{ editing ? 'Update' : 'Create' }}</button>
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

const users = ref([])
const showModal = ref(false)
const editing = ref(false)
const editId = ref(null)
const modalError = ref(null)

const form = ref({ name: '', email: '', password: '', role: 'customer', is_active: true })

const fetchUsers = async () => {
  const res = await api.get('/admin/users')
  users.value = res.data.data
}

const openModal = (user = null) => {
  modalError.value = null
  if (user) {
    editing.value = true
    editId.value = user.id
    form.value = { name: user.name, email: user.email, role: user.role, is_active: !!user.is_active }
  } else {
    editing.value = false
    editId.value = null
    form.value = { name: '', email: '', password: '', role: 'customer', is_active: true }
  }
  showModal.value = true
}

const saveUser = async () => {
  try {
    if (editing.value) {
      await api.put(`/admin/users/${editId.value}`, form.value)
    } else {
      await api.post('/admin/users', form.value)
    }
    showModal.value = false
    fetchUsers()
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Failed to save'
  }
}

const deleteUser = async (id) => {
  if (!confirm('Delete this user?')) return
  try {
    await api.delete(`/admin/users/${id}`)
    fetchUsers()
  } catch (err) {
    toast.error('Failed to delete user')
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.manage-page { background: var(--dark); min-height: 100vh; color: var(--text-primary); }
.page-header { padding: 20px 30px; background: var(--dark-card); display: flex; justify-content: space-between; align-items: center; }
.btn-add { background: var(--primary); border: none; padding: 8px 18px; border-radius: 10px; color: #fff; font-weight: 600; }

.table-card { background: var(--dark-card); border-radius: 15px; padding: 20px; overflow-x: auto; }

.data-table { width: 100%; border-collapse: collapse; }
.data-table th { text-align: left; padding: 12px; color: var(--text-secondary); font-size: 13px; border-bottom: 1px solid var(--dark-border); }
.data-table td { padding: 12px; border-bottom: 1px solid var(--dark-border); font-size: 14px; }

.btn-edit { background: #3b82f6; border: none; padding: 5px 12px; border-radius: 6px; color: white; margin-right: 5px; font-size: 13px; }
.btn-delete { background: #ef4444; border: none; padding: 5px 12px; border-radius: 6px; color: white; font-size: 13px; }

.role-badge { padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.role-admin { background: #6c5ce722; color: #6c5ce7; }
.role-manager { background: #3b82f622; color: #3b82f6; }
.role-kitchen { background: #f59e0b22; color: #f59e0b; }
.role-waiter { background: #00cec922; color: #00cec9; }
.role-cashier { background: #10b98122; color: #10b981; }
.role-customer { background: #94a3b822; color: #94a3b8; }

.text-success { color: #10b981; }
.text-danger { color: #ef4444; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: var(--dark-card); border-radius: 20px; padding: 30px; width: 100%; max-width: 450px; }
.modal-card h5 { margin-bottom: 20px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; color: var(--text-secondary); font-size: 14px; margin-bottom: 5px; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid var(--dark-border); border-radius: 8px; background: var(--dark-surface); color: var(--text-primary); }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.btn-cancel { flex: 1; padding: 10px; background: var(--dark-hover); border: none; border-radius: 10px; color: var(--text-primary); }
.btn-save { flex: 1; padding: 10px; background: var(--primary); border: none; border-radius: 10px; color: #fff; font-weight: 600; }
</style>

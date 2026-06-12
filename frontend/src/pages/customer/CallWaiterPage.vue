<template>
  <div class="waiter-page">

    <div class="waiter-header">
      <h4><span class="anim-bell-ring d-inline-block">🛎️</span> Call Waiter</h4>
      <span v-if="tableNumber" class="table-info">Table #{{ tableNumber }}</span>
    </div>

    <div class="container mt-4">

      <div v-if="success" class="text-center success-box">
        <div class="success-icon"><i class="bi bi-check-lg"></i></div>
        <h4>Request Sent!</h4>
        <p class="text-muted-custom">A waiter will be with you shortly</p>
        <button class="btn-another" @click="success = false">Send Another Request</button>
      </div>

      <div v-else class="row justify-content-center">
        <div class="col-lg-6">
          <div class="request-card">

            <h5 class="mb-4">What do you need?</h5>

            <div class="request-types">
              <div
                v-for="t in requestTypes"
                :key="t.value"
                :class="['type-option', type === t.value ? 'active' : '']"
                @click="type = t.value"
              >
                <span class="type-emoji" :class="{ 'anim-float': type === t.value }">{{ t.emoji }}</span>
                <span>{{ t.label }}</span>
              </div>
            </div>

            <textarea
              v-model="notes"
              class="form-input mt-4"
              placeholder="Additional notes (optional)"
              rows="3"
            ></textarea>

            <button
              class="btn-send mt-3"
              @click="sendRequest"
              :disabled="!type || sending"
            >
              {{ sending ? 'Sending...' : 'Send Request' }}
            </button>

            <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCartStore } from '../../store/cart'
import api from '../../services/api'

const cart = useCartStore()
const tableNumber = ref(cart.tableNumber || 1)

const type = ref('')
const notes = ref('')
const sending = ref(false)
const success = ref(false)
const error = ref(null)

const requestTypes = [
  { value: 'help', label: 'Need Help', icon: 'person-raised-hand', emoji: '🙋' },
  { value: 'water', label: 'Water', icon: 'droplet', emoji: '💧' },
  { value: 'salt', label: 'Salt/Pepper', icon: 'cup-hot', emoji: '🧂' },
  { value: 'cleaning', label: 'Cleaning', icon: 'stars', emoji: '🧹' },
  { value: 'complaint', label: 'Complaint', icon: 'chat-left-text', emoji: '📣' }
]

const sendRequest = async () => {
  sending.value = true
  error.value = null

  try {
    await api.post('/waiter-requests', {
      table_id: cart.tableId || 1,
      type: type.value,
      notes: notes.value || undefined
    })
    success.value = true
    type.value = ''
    notes.value = ''
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to send request'
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.waiter-page {
  background: var(--dark);
  min-height: 100vh;
  color: var(--text-primary);
}

.waiter-header {
  padding: 20px 30px;
  background: var(--dark-card);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-info {
  color: var(--secondary);
  font-weight: 600;
}

.request-card {
  background: var(--dark-card);
  border-radius: 20px;
  padding: 30px;
}

.request-types {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 480px) {
  .request-types {
    grid-template-columns: repeat(2, 1fr);
  }
}

.type-option {
  background: var(--dark-surface);
  border-radius: 12px;
  padding: 20px 10px;
  text-align: center;
  cursor: pointer;
  transition: 0.3s;
  color: var(--text-primary);
}

.type-option.active {
  background: var(--primary);
  transform: scale(1.05);
  color: white;
}

.type-emoji {
  display: block;
  font-size: 32px;
  margin-bottom: 8px;
  line-height: 1;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  background: var(--dark-surface);
  color: var(--text-primary);
  resize: none;
}

.btn-send {
  width: 100%;
  padding: 14px;
  background: var(--secondary);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.btn-send:disabled {
  opacity: 0.5;
}

.success-box {
  margin-top: 60px;
  animation: success-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes success-pop {
  from { opacity: 0; transform: scale(0.85) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.success-icon {
  width: 72px;
  height: 72px;
  background: var(--secondary);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  animation: success-pop 0.6s 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.success-icon i {
  font-size: 36px;
  color: white;
}

.text-muted-custom {
  color: var(--text-secondary);
}

.btn-another {
  margin-top: 20px;
  padding: 12px 25px;
  background: var(--primary);
  border: none;
  border-radius: 10px;
  color: white;
}
</style>

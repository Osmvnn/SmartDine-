<template>
  <div class="waiter-order-page">
    <div class="page-header">
      <router-link to="/waiter" class="back-btn">Back</router-link>
      <h4><i class="bi bi-plus-circle"></i> Take Guest Order</h4>
      <div style="width: 60px"></div>
    </div>

    <div class="order-form">
      <div v-if="createdOrderId" class="created-order-card">
        <div>
          <strong>Order #{{ createdOrderId }} created</strong>
          <span>Track this guest order from the waiter screen.</span>
        </div>
        <button class="btn-track-order" @click="trackCreatedOrder">
          <i class="bi bi-geo-alt"></i> Track Order
        </button>
      </div>
      
      <div class="form-section">
        <h5>Select Table</h5>
        <div class="table-grid">
          <div
            v-for="table in availableTables"
            :key="table.id"
            :class="['table-option', selectedTableId === table.id ? 'active' : '']"
            @click="selectedTableId = table.id"
          >
            <div class="table-num">{{ table.table_number }}</div>
            <div class="table-cap">{{ table.capacity }} seats</div>
          </div>
        </div>
      </div>

      
      <div v-if="selectedTableId" class="form-section">
        <h5>Add Items</h5>
        <div class="categories-tabs">
          <button
            v-for="cat in categories"
            :key="cat.id"
            :class="['cat-tab', selectedCategoryId === cat.id ? 'active' : '']"
            @click="selectedCategoryId = cat.id"
          >
            {{ cat.name }}
          </button>
        </div>

        <div class="items-grid">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="item-card"
            @click="addItemToOrder(item)"
          >
            <div class="item-name">{{ item.name }}</div>
            <div class="item-price">{{ formatAmount(item.price) }}</div>
          </div>
        </div>
      </div>

      
      <div v-if="orderItems.length > 0" class="form-section">
        <h5>Order Summary</h5>
        <div class="order-items-list">
          <div v-for="item in orderItems" :key="item.id" class="order-item-row">
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <div class="qty-controls">
                <button @click="decreaseQty(item.id)">-</button>
                <span>{{ item.qty }}</span>
                <button @click="increaseQty(item.id)">+</button>
              </div>
            </div>
            <span class="item-total">{{ formatAmount(item.price * item.qty) }}</span>
          </div>
        </div>

        <div class="order-total">
          <span>Total</span>
          <span class="amount">{{ formatAmount(orderTotal) }}</span>
        </div>

        <div class="notes-input-wrapper">
          <textarea
            v-model="orderNotes"
            placeholder="Special requests for the kitchen (optional)"
            class="notes-input"
          ></textarea>
        </div>
      </div>


      <div v-if="orderItems.length > 0" class="form-section">
        <h5>Payment Options</h5>

        <div class="option-block">
          <label class="option-label">Payment Method</label>
          <div class="method-grid">
            <div :class="['method-card', paymentMethod === 'cash' ? 'active' : '']" @click="setPaymentMethod('cash')">
              <i class="bi bi-cash-stack method-icon"></i>
              <span>Cash</span>
            </div>
            <div :class="['method-card', paymentMethod === 'card' ? 'active' : '']" @click="setPaymentMethod('card')">
              <i class="bi bi-credit-card method-icon"></i>
              <span>Card</span>
            </div>
            <div :class="['method-card', paymentMethod === 'mobile' ? 'active' : '']" @click="setPaymentMethod('mobile')">
              <i class="bi bi-phone method-icon"></i>
              <span>Mobile</span>
            </div>
          </div>
        </div>

        <div class="option-block">
          <label class="option-label">When to Pay?</label>
          <p v-if="demoPayments">Demo mode: no money is charged.</p>
          <div class="payment-timing-grid">
            <div v-if="onlinePayments" :class="['timing-card', paymentTiming === 'pre' ? 'active' : '']" @click="paymentTiming = 'pre'">
              <i class="bi bi-lightning-charge-fill timing-icon"></i>
              <span>Demo Payment</span>
              <small>Simulation only; no money is charged</small>
            </div>
            <div :class="['timing-card', paymentTiming === 'post' ? 'active' : '']" @click="paymentTiming = 'post'">
              <i class="bi bi-clock-history timing-icon"></i>
              <span>Pay After Eating</span>
              <small>Collect once the meal is served</small>
            </div>
          </div>
        </div>

        <div class="option-block">
          <label class="option-label">Split the Bill</label>
          <p class="split-desc">Multiple guests at this table without phones? Split the bill into equal shares and name each guest.</p>
          <div class="split-toggle">
            <div :class="['split-opt', splitType === 'none' ? 'active' : '']" @click="setSplitType('none')">
              <i class="bi bi-receipt"></i>
              <span>One Bill</span>
              <small>Single payment for the table</small>
            </div>
            <div :class="['split-opt', splitType === 'equal' ? 'active' : '']" @click="setSplitType('equal')">
              <i class="bi bi-people-fill"></i>
              <span>Split Between Guests</span>
              <small>Divide equally</small>
            </div>
          </div>

          <div v-if="splitType === 'equal'" class="split-people-picker">
            <label>How many guests are sharing this bill?</label>
            <div class="people-counter">
              <button class="count-btn" @click="decreaseSplitCount" :disabled="splitCount <= 2">-</button>
              <span class="count-val">{{ splitCount }}</span>
              <button class="count-btn" @click="increaseSplitCount" :disabled="splitCount >= maxSplit">+</button>
            </div>

            <div class="split-people-list">
              <div v-for="(share, i) in splitShares" :key="i" class="split-person-row">
                <input
                  v-model="splitNames[i]"
                  class="split-name-input"
                  :placeholder="`Guest ${i + 1}`"
                  maxlength="20"
                />
                <select v-model="splitMethods[i]" class="split-method-select">
                  <option value="cash">Cash after eating</option>
                  <option value="card">Card</option>
                  <option value="mobile">Mobile</option>
                </select>
                <span class="split-person-amount">{{ formatAmount(share.amount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          class="btn-submit"
          @click="submitOrder"
          :disabled="submitting || orderItems.length === 0"
        >
          {{ submitting ? 'Creating Order...' : 'Create Guest Order' }}
        </button>

        <p v-if="error" class="error-msg">{{ error }}</p>
      </div>

      <div v-else-if="selectedTableId" class="empty-state">
        <p>Select items from the menu to create an order</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePaymentCapabilities } from '../../composables/usePaymentCapabilities'
const { onlinePayments, demoPayments } = usePaymentCapabilities()
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api'
import { useToastStore } from '../../store/toast'
import { useAuthStore } from '../../store/auth'
import { formatMoney, getCurrency } from '../../utils/currency'

const router = useRouter()
const toast = useToastStore()
const auth = useAuthStore()

const availableTables = ref([])
const categories = ref([])
const items = ref([])
const selectedTableId = ref(null)
const selectedCategoryId = ref(null)
const orderItems = ref([])
const orderNotes = ref('')
const submitting = ref(false)
const error = ref(null)

const paymentMethod = ref('cash')
const paymentTiming = ref('post')
const splitType = ref('none')
const splitCount = ref(2)
const splitNames = ref([])
const splitMethods = ref(['cash', 'cash'])
const maxSplit = 10
const createdOrderId = ref(null)
const currency = ref(getCurrency())

const onCurrencyChanged = (event) => {
  currency.value = event.detail || getCurrency()
}

const formatAmount = (amount) => formatMoney(amount, currency.value)

const filteredItems = computed(() => {
  if (!selectedCategoryId.value) return items.value
  return items.value.filter(i => i.category_id === selectedCategoryId.value)
})

const orderTotal = computed(() => {
  return orderItems.value.reduce((sum, item) => sum + (item.price * item.qty), 0)
})

const isSplitting = computed(() => splitType.value === 'equal' && splitCount.value > 1)
const splitShares = computed(() => {
  const count = Math.max(2, splitCount.value)
  const total = orderTotal.value

  const baseShare = Math.floor((total / count) * 100) / 100
  const remainder = Math.round((total - baseShare * count) * 100) / 100

  return Array.from({ length: count }, (_, i) => {
    const isLast = i === count - 1
    const amount = isLast ? baseShare + remainder : baseShare
    return {
      name: splitNames.value[i]?.trim() || `Guest ${i + 1}`,
      amount: Math.round(amount * 100) / 100,
      method: splitMethods.value[i] || paymentMethod.value
    }
  })
})

const setSplitType = (type) => {
  splitType.value = type
  if (type === 'none') splitCount.value = 2
}

const increaseSplitCount = () => {
  if (splitCount.value < maxSplit) {
    splitCount.value++
    splitMethods.value[splitCount.value - 1] = paymentMethod.value
  }
}

const decreaseSplitCount = () => {
  if (splitCount.value > 2) splitCount.value--
}

const fetchTables = async () => {
  try {
    const res = await api.get('/tables')
    const userId = auth.user?.id
    availableTables.value = res.data.data.filter(t => t.status !== 'reserved' && t.waiter_id === userId)
  } catch (err) {
    toast.error('Failed to load tables')
  }
}

const setPaymentMethod = (value) => {
  paymentMethod.value = value
  splitMethods.value = splitMethods.value.map(() => value)
}

const trackCreatedOrder = () => {
  if (createdOrderId.value) router.push(`/waiter/order/${createdOrderId.value}`)
}

const fetchCategories = async () => {
  try {
    const res = await api.get('/menu/categories')
    categories.value = res.data.data
    if (categories.value.length > 0) {
      selectedCategoryId.value = categories.value[0].id
    }
  } catch (err) {
    toast.error('Failed to load categories')
  }
}

const fetchItems = async () => {
  try {
    const res = await api.get('/menu/items')
    items.value = res.data.data.filter(i => i.is_available)
  } catch (err) {
    toast.error('Failed to load menu items')
  }
}

const addItemToOrder = (item) => {
  const existing = orderItems.value.find(oi => oi.id === item.id)
  if (existing) {
    existing.qty += 1
  } else {
    orderItems.value.push({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      qty: 1
    })
  }
}

const increaseQty = (itemId) => {
  const item = orderItems.value.find(i => i.id === itemId)
  if (item) item.qty += 1
}

const decreaseQty = (itemId) => {
  const item = orderItems.value.find(i => i.id === itemId)
  if (item) {
    item.qty = Math.max(1, item.qty - 1)
  }
}

const submitOrder = async () => {
  if (!selectedTableId.value || orderItems.value.length === 0) return
  
  submitting.value = true
  error.value = null

  try {
    const res = await api.post('/orders', {
      table_id: selectedTableId.value,
      items: orderItems.value.map(item => ({
        menu_item_id: item.id,
        quantity: item.qty,
        unit_price: item.price
      })),
      notes: orderNotes.value || null,
      payment_type: 'physical'
    })

    const orderId = res.data.data.order_id

    if (isSplitting.value) {
      const splits = splitShares.value.map(share => ({
        amount: share.amount,
        method: share.method,
        payer_name: share.name,
        payment_timing: paymentTiming.value === 'post' || share.method === 'cash' ? 'post' : 'pre'
      }))
      await api.post('/payments/split', { order_id: orderId, splits })
    } else {
      await api.post('/payments', {
        order_id: orderId,
        method: paymentMethod.value,
        payment_timing: paymentTiming.value,

        payer_name: 'Table guest'
      })
    }

    const timingMsg = paymentTiming.value === 'pre' ? 'Payment recorded.' : 'Payment will be collected after dining.'
    toast.success(`Order #${orderId} created. ${timingMsg}`)
    createdOrderId.value = orderId
    orderItems.value = []
    orderNotes.value = ''
    selectedTableId.value = null
    selectedCategoryId.value = categories.value.length > 0 ? categories.value[0].id : null
    paymentMethod.value = 'cash'
    paymentTiming.value = 'post'
    splitType.value = 'none'
    splitCount.value = 2
    splitNames.value = []
    splitMethods.value = ['cash', 'cash']
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to submit order'
    toast.error(error.value)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  window.addEventListener('currency-changed', onCurrencyChanged)
  fetchTables()
  fetchCategories()
  fetchItems()
})

onUnmounted(() => {
  window.removeEventListener('currency-changed', onCurrencyChanged)
})
</script>

<style scoped>
.waiter-order-page {
  background: var(--dark);
  min-height: 100vh;
  color: var(--text-primary);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  background: var(--dark-card);
  border-bottom: 1px solid var(--dark-border);
}

.page-header h4 {
  margin: 0;
}

.back-btn {
  background: transparent;
  border: 1px solid var(--dark-border);
  padding: 6px 14px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  transition: 0.2s;
}

.back-btn:hover {
  border-color: var(--primary);
  color: var(--text-primary);
}

.order-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 16px 100px;
}

.form-section {
  background: var(--dark-card);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.form-section h5 {
  margin: 0 0 16px 0;
  font-size: 15px;
  color: var(--text-secondary);
  font-weight: 600;
}


.table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.table-option {
  background: var(--dark-hover);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: 0.2s;
  border: 2px solid transparent;
}

.table-option:hover {
  background: var(--dark-border);
}

.table-option.active {
  background: var(--primary);
  border-color: var(--primary-hover);
}

.table-num {
  font-size: 24px;
  font-weight: 700;
  color: var(--secondary);
  margin-bottom: 4px;
}

.table-cap {
  font-size: 12px;
  color: var(--text-secondary);
}


.categories-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 16px;
  padding-bottom: 8px;
}

.cat-tab {
  padding: 8px 16px;
  background: var(--dark-hover);
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: 0.2s;
}

.cat-tab:hover {
  background: var(--dark-border);
}

.cat-tab.active {
  background: var(--primary);
  color: #fff;
}


.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.item-card {
  background: var(--dark-hover);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: 0.2s;
}

.item-card:hover {
  background: var(--dark-border);
  transform: translateY(-2px);
}

.item-name {
  font-size: 12px;
  margin-bottom: 6px;
  color: var(--text-primary);
  font-weight: 500;
}

.item-price {
  font-size: 16px;
  font-weight: 700;
  color: #10b981;
}


.order-items-list {
  background: var(--dark-hover);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}

.order-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--dark-border);
}

.order-item-row:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.item-name {
  font-size: 14px;
  color: var(--text-primary);
}

.qty-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--dark-card);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
}

.qty-controls button {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  font-weight: 700;
}

.item-total {
  font-weight: 600;
  color: #10b981;
}


.order-total {
  display: flex;
  justify-content: space-between;
  background: var(--dark-border);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-weight: 600;
}

.amount {
  color: var(--amount-color);
  font-size: 18px;
}


.notes-input-wrapper {
  margin-bottom: 16px;
}

.notes-input {
  width: 100%;
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  color: var(--text-primary);
  padding: 10px;
  font-size: 13px;
  resize: vertical;
  min-height: 60px;
}

.notes-input:focus {
  outline: none;
  border-color: var(--primary);
}


.btn-submit {
  width: 100%;
  padding: 14px;
  background: var(--primary);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}


.option-block {
  margin-bottom: 20px;
}

.option-block:last-of-type {
  margin-bottom: 0;
}

.option-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.method-grid {
  display: flex;
  gap: 10px;
}

.method-card {
  flex: 1;
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  border-radius: 12px;
  padding: 14px 8px;
  text-align: center;
  cursor: pointer;
  transition: 0.2s;
  color: var(--text-primary);
}

.method-card:hover {
  background: var(--dark-hover);
}

.method-card.active {
  background: var(--primary);
  border-color: var(--primary);
}

.method-icon {
  display: block;
  font-size: 22px;
  margin-bottom: 4px;
  color: inherit;
}

.method-card span {
  font-size: 13px;
  font-weight: 700;
}

.payment-timing-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.timing-card {
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  border-radius: 12px;
  padding: 14px 8px;
  text-align: center;
  cursor: pointer;
  transition: 0.2s;
  color: var(--text-primary);
}

.timing-card:hover {
  background: var(--dark-hover);
}

.timing-card.active {
  background: var(--secondary);
  border-color: var(--secondary);
}

.timing-icon {
  display: block;
  font-size: 20px;
  margin-bottom: 4px;
  color: inherit;
}

.timing-card span {
  display: block;
  font-size: 13px;
  font-weight: 700;
}

.timing-card small {
  font-size: 11px;
  opacity: 0.8;
}

.split-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0 0 12px;
}

.split-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.split-opt {
  border: 1px solid var(--dark-border);
  border-radius: 12px;
  padding: 14px 10px;
  text-align: center;
  cursor: pointer;
  transition: 0.2s;
  background: var(--dark-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--text-primary);
}

.split-opt i {
  font-size: 22px;
  color: var(--primary);
  margin-bottom: 2px;
}

.split-opt span {
  font-size: 13px;
  font-weight: 700;
}

.split-opt small {
  font-size: 11px;
  color: var(--text-muted);
}

.split-opt:hover {
  border-color: var(--primary);
}

.split-opt.active {
  border-color: var(--primary);
  background: var(--primary-light);
}

.split-people-picker {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--dark-border);
}

.split-people-picker label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.people-counter {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.count-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--dark-border);
  background: var(--dark-surface);
  color: var(--text-primary);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transition: 0.2s;
}

.count-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.count-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.count-val {
  font-size: 28px;
  font-weight: 700;
  min-width: 40px;
  text-align: center;
}

.split-people-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.split-person-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  padding: 8px 12px;
}

.split-name-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  padding: 2px 0;
}

.split-name-input:focus {
  outline: none;
}

.split-name-input::placeholder {
  color: var(--text-muted);
}

.split-method-select {
  min-width: 130px;
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
  padding: 7px 8px;
}

.split-person-amount {
  font-weight: 700;
  font-size: 14px;
  color: var(--amount-color);
  white-space: nowrap;
}


.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

.error-msg {
  color: #ef4444;
  font-size: 13px;
  margin-top: 10px;
  text-align: center;
}

.created-order-card {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.created-order-card strong {
  display: block;
  color: #10b981;
  margin-bottom: 3px;
}

.created-order-card span {
  color: var(--text-secondary);
  font-size: 13px;
}

.btn-track-order {
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 9px 14px;
  font-weight: 700;
  white-space: nowrap;
}
</style>

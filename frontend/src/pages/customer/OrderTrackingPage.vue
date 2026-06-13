<template>
  <div class="tracking-page">

    <div class="tracking-header">
      <h4>Order Tracking</h4>
      <div class="header-right">
        <span class="live-badge" :class="{ offline: !socketStore.connected }">
          <span class="live-dot anim-pulse"></span>
          {{ socketStore.connected ? 'Live' : 'Offline' }}
        </span>
        <span class="order-id">#{{ orderId }}</span>
      </div>
    </div>

    <div class="container mt-4">

      <div v-if="loading" class="text-center mt-5">
        <div class="tracking-skeleton">
          <div class="skel-header"></div>
          <div class="skel-step" v-for="n in 6" :key="n"></div>
        </div>
      </div>

      <div v-else-if="error" class="text-center text-danger mt-5">
        <p>{{ error }}</p>
        <button class="btn-back" @click="$router.push('/')">Go Home</button>
      </div>

      <div v-else class="row">

        <div class="col-lg-6 mb-4">
          <div class="timeline-card" :class="{ 'flash-update': justUpdated }">
            <h5 class="mb-4">Order Status</h5>

            <div v-if="estimatedReadyText" class="prep-time-banner">
              <i class="bi bi-clock"></i> Estimated ready: {{ estimatedReadyText }}
            </div>

            <div v-if="pushSupported && canEnableNotifications" class="push-banner">
              <button v-if="!pushEnabled" class="btn-enable-push" @click="enableNotifications" :disabled="enablingPush">
                <i class="bi bi-bell"></i> {{ enablingPush ? 'Enabling...' : 'Notify me when ready' }}
              </button>
              <span v-else class="push-enabled-label"><i class="bi bi-bell-fill"></i> We'll notify you when it's ready</span>
            </div>

            <div class="timeline">
              <div
                v-for="(step, index) in statusSteps"
                :key="step.key"
                :class="['timeline-step', getStepClass(step.key, index)]"
              >
                <div class="step-dot" :class="{ 'anim-pulse': getStepClass(step.key, index) === 'active' }">
                  <i v-if="isCompleted(step.key, index)" class="bi bi-check"></i>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <div class="step-info">
                  <h6>{{ step.label }}</h6>
                  <p v-if="getStepTime(step.key)">{{ formatTime(getStepTime(step.key)) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="detail-card mb-4">
            <h5 class="mb-3">Order Details</h5>
            <div class="info-row">
              <span>Table</span>
              <span>#{{ order.table_number }}</span>
            </div>
            <div class="info-row">
              <span>Status</span>
              <span :class="'status-badge status-' + order.status">{{ order.status }}</span>
            </div>
            <div class="info-row">
              <span>Total</span>
              <span class="total">{{ formatAmount(order.total) }}</span>
            </div>
          </div>

          <div class="detail-card">
            <h5 class="mb-3">Items</h5>
            <div v-for="item in items" :key="item.id" class="item-row">
              <span class="item-name-col">
                <span><span class="item-emoji">{{ getFoodEmoji(item) }}</span> {{ item.name }} × {{ item.quantity }}</span>
                <small v-if="item.modifiers?.length" class="item-modifiers">
                  {{ item.modifiers.map(m => m.name).join(', ') }}
                </small>
              </span>
              <span class="item-row-right">
                <span v-if="showItemStatus(item)" :class="['item-status-badge', 'item-status-' + item.status]">{{ item.status }}</span>
                <span>{{ formatAmount((Number(item.price) + Number(item.modifier_total || 0)) * item.quantity) }}</span>
              </span>
            </div>
          </div>

          <div v-if="payment" class="detail-card mt-4" :class="{ 'flash-update': paymentJustUpdated }">
            <h5 class="mb-3">Payment</h5>
            <div class="info-row">
              <span>Method</span>
              <span>{{ payment.method }}</span>
            </div>
            <div class="info-row">
              <span>Status</span>
              <span :class="payment.status === 'paid' ? 'text-success' : 'text-warning'">
                {{ payment.status }}
              </span>
            </div>
            <div v-if="payment.transaction_id" class="info-row">
              <span>Transaction</span>
              <span class="text-muted-custom small">{{ payment.transaction_id }}</span>
            </div>
          </div>

          <div v-if="canRequestBill || billRequested" class="detail-card mt-4 bill-request-card">
            <h5 class="mb-3"><i class="bi bi-receipt"></i> Bill</h5>
            <div v-if="!billRequested">
              <p class="bill-text">All done? Let your waiter know you're ready to pay.</p>
              <button class="btn-request-bill" @click="requestBill" :disabled="requestingBill">
                {{ requestingBill ? 'Notifying waiter...' : 'Done Eating - Request Bill' }}
              </button>
            </div>
            <div v-else class="bill-requested-msg">
              <i class="bi bi-check-circle"></i> Your waiter has been notified and will bring the receipt for payment to your table shortly.
            </div>
          </div>

          <div v-if="canCancel" class="mt-4">
            <button class="btn-cancel-order" @click="cancelOrder" :disabled="cancelling">
              {{ cancelling ? 'Cancelling...' : '✕ Cancel Order' }}
            </button>
          </div>

          <div v-if="canRate && !existingRating" class="detail-card mt-4">
            <h5 class="mb-3">Rate Your Experience</h5>
            <div class="star-row">
              <span
                v-for="s in 5" :key="s"
                class="star"
                :class="{ active: s <= ratingValue }"
                @click="ratingValue = s"
              >★</span>
            </div>
            <textarea
              v-model="ratingComment"
              class="rating-input mt-3"
              placeholder="Leave a comment (optional)"
              rows="2"
            ></textarea>
            <button class="btn-rate mt-3" @click="submitRating" :disabled="!ratingValue || submittingRating">
              {{ submittingRating ? 'Submitting...' : 'Submit Rating' }}
            </button>
          </div>

          <div v-if="existingRating" class="detail-card mt-4">
            <h5 class="mb-3">Your Rating</h5>
            <div class="star-row">
              <span v-for="s in 5" :key="s" class="star" :class="{ active: s <= existingRating.rating }">★</span>
            </div>
            <p v-if="existingRating.comment" class="rating-comment mt-2">{{ existingRating.comment }}</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'
import { useSocketStore } from '../../store/socket'
import { useToastStore } from '../../store/toast'
import { getFoodEmoji } from '../../utils/foodEmoji'
import { isPushSupported, getPushSubscription, subscribeToPush } from '../../utils/push'
import { formatMoney, getCurrency } from '../../utils/currency'

const route = useRoute()
const orderId = ref(route.params.id)
const socketStore = useSocketStore()
const toast = useToastStore()

const order = ref({})
const items = ref([])
const payment = ref(null)
const history = ref([])
const loading = ref(true)
const error = ref(null)

const justUpdated = ref(false)
const paymentJustUpdated = ref(false)

const cancelling = ref(false)
const canCancel = computed(() => ['pending', 'confirmed'].includes(order.value.status))

const billRequested = ref(false)
const requestingBill = ref(false)
const canRequestBill = computed(() => {
  return order.value.status === 'served' &&
    payment.value?.payment_timing === 'post' &&
    payment.value?.status === 'pending'
})

const requestBill = async () => {
  requestingBill.value = true
  try {
    await api.post('/waiter-requests', { table_id: order.value.table_id, type: 'bill' })
    billRequested.value = true
    sessionStorage.setItem(`bill-requested-${orderId.value}`, '1')
    toast.success('Your waiter will bring the receipt for payment shortly.')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to notify the waiter')
  } finally {
    requestingBill.value = false
  }
}

const pushSupported = ref(false)
const pushEnabled = ref(false)
const enablingPush = ref(false)
const canEnableNotifications = computed(() => ['pending', 'confirmed', 'preparing'].includes(order.value.status))

const enableNotifications = async () => {
  enablingPush.value = true
  try {
    await subscribeToPush(order.value.session_id || order.value.table_id)
    pushEnabled.value = true
    toast.success("Notifications enabled! We'll alert you when your order is ready.")
  } catch (err) {
    toast.error(err.message || 'Failed to enable notifications')
  } finally {
    enablingPush.value = false
  }
}

const ratingValue = ref(0)
const ratingComment = ref('')
const submittingRating = ref(false)
const existingRating = ref(null)
const currency = ref(getCurrency())
const canRate = computed(() => ['served', 'completed'].includes(order.value.status))

const onCurrencyChanged = (event) => {
  currency.value = event.detail || getCurrency()
}

const formatAmount = (amount) => formatMoney(amount, currency.value)

const statusSteps = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Payment Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready for Pickup' },
  { key: 'served', label: 'Served' },
  { key: 'completed', label: 'Completed' }
]

const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed']

const currentStatusIndex = () => {
  return statusOrder.indexOf(order.value.status)
}

const isCompleted = (key, index) => {
  return index <= currentStatusIndex()
}

const getStepClass = (key, index) => {
  if (order.value.status === 'cancelled') return index === 0 ? 'cancelled' : ''
  if (index < currentStatusIndex()) return 'completed'
  if (index === currentStatusIndex()) return 'active'
  return ''
}

const getStepTime = (key) => {
  const entry = history.value.find(h => h.status === key)
  return entry ? entry.changed_at : null
}

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const now = ref(Date.now())
let nowTimer = null

const estimatedReadyText = computed(() => {
  if (!order.value.estimated_ready_at) return null
  if (!['confirmed', 'preparing'].includes(order.value.status)) return null

  const target = new Date(order.value.estimated_ready_at).getTime()
  const diffMin = Math.round((target - now.value) / 60000)
  const timeStr = formatTime(order.value.estimated_ready_at)

  if (diffMin <= 0) return `any moment now (by ${timeStr})`
  return `~${diffMin} min (by ${timeStr})`
})

const fetchOrder = async () => {
  try {
    const res = await api.get(`/orders/${orderId.value}`)
    order.value = res.data.data.order
    items.value = res.data.data.items
    payment.value = res.data.data.payment
    history.value = res.data.data.history

    if (['served', 'completed'].includes(order.value.status) && !existingRating.value) {
      try {
        const ratingRes = await api.get(`/orders/${orderId.value}/rating`)
        existingRating.value = ratingRes.data.data
      } catch {}
    }
  } catch (err) {
    error.value = 'Failed to load order'
  } finally {
    loading.value = false
  }
}

const cancelOrder = async () => {
  if (!confirm('Are you sure you want to cancel this order?')) return
  cancelling.value = true
  try {
    await api.put(`/orders/${orderId.value}/cancel`)
    toast.success('Order cancelled successfully')
    fetchOrder()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to cancel order')
  } finally {
    cancelling.value = false
  }
}

const submitRating = async () => {
  submittingRating.value = true
  try {
    await api.post(`/orders/${orderId.value}/rate`, {
      rating: ratingValue.value,
      comment: ratingComment.value || null
    })
    existingRating.value = { rating: ratingValue.value, comment: ratingComment.value }
    toast.success('Thank you for your rating!')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to submit rating')
  } finally {
    submittingRating.value = false
  }
}

const showItemStatus = (item) => {
  return ['confirmed', 'preparing', 'ready', 'served', 'completed'].includes(order.value.status)
}

const handleItemStatusChange = (payload) => {
  if (Number(payload.order_id) !== Number(orderId.value)) return
  const item = items.value.find(i => i.id === payload.item_id)
  if (item) item.status = payload.status
}

const handleStatusChange = (payload) => {
  if (Number(payload.order_id) === Number(orderId.value)) {
    order.value.status = payload.status
    const already = history.value.find(h => h.status === payload.status)
    if (!already) {
      history.value.push({ status: payload.status, changed_at: new Date().toISOString() })
    }
    const labels = { confirmed: 'Payment confirmed!', preparing: 'Kitchen is preparing your order', ready: 'Your order is ready!', served: 'Enjoy your meal!', completed: 'Order completed', cancelled: 'Order was cancelled' }
    if (labels[payload.status]) toast.info(labels[payload.status])

    justUpdated.value = true
    setTimeout(() => { justUpdated.value = false }, 1800)
  }
}

const handlePaymentUpdate = (payload) => {
  if (Number(payload.order_id) !== Number(orderId.value)) return

  fetchOrder()
  toast.success('Payment confirmed!')

  paymentJustUpdated.value = true
  setTimeout(() => { paymentJustUpdated.value = false }, 1800)
}

onMounted(() => {
  window.addEventListener('currency-changed', onCurrencyChanged)
  billRequested.value = sessionStorage.getItem(`bill-requested-${orderId.value}`) === '1'
  fetchOrder()
  socketStore.connect()
  socketStore.socket?.on('order-status-changed', handleStatusChange)
  socketStore.socket?.on('payment-confirmed', handlePaymentUpdate)
  socketStore.socket?.on('order-paid', handlePaymentUpdate)
  socketStore.socket?.on('order-item-status-changed', handleItemStatusChange)
  nowTimer = setInterval(() => { now.value = Date.now() }, 30000)

  pushSupported.value = isPushSupported()
  if (pushSupported.value) {
    getPushSubscription().then(sub => { pushEnabled.value = !!sub }).catch(() => {})
  }
})

onUnmounted(() => {
  window.removeEventListener('currency-changed', onCurrencyChanged)
  socketStore.socket?.off('order-status-changed', handleStatusChange)
  socketStore.socket?.off('payment-confirmed', handlePaymentUpdate)
  socketStore.socket?.off('order-paid', handlePaymentUpdate)
  socketStore.socket?.off('order-item-status-changed', handleItemStatusChange)
  clearInterval(nowTimer)
})
</script>

<style scoped>
.tracking-page {
  background: var(--dark);
  min-height: 100vh;
  color: var(--text-primary);
}

.tracking-header {
  padding: 20px 30px;
  background: var(--dark-card);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--dark-border);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.order-id {
  color: var(--primary);
  font-weight: 600;
  font-size: 18px;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 20px;
  background: var(--secondary-light);
  color: var(--secondary);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.live-badge.offline {
  background: rgba(239, 68, 68, 0.12);
  color: var(--danger);
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--secondary);
}

.live-badge.offline .live-dot {
  background: var(--danger);
  animation: none;
}

.timeline-card, .detail-card {
  background: var(--dark-card);
  border-radius: 15px;
  padding: 25px;
  border: 1px solid transparent;
}

.timeline-card.flash-update,
.detail-card.flash-update {
  animation: status-ready-flash 0.6s ease-in-out 2;
}


.prep-time-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 20px;
}

.push-banner {
  margin-bottom: 20px;
}

.btn-enable-push {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  background: var(--primary-light);
  border: 1px dashed var(--primary);
  border-radius: 10px;
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.btn-enable-push:hover:not(:disabled) {
  background: var(--primary);
  color: #fff;
}

.btn-enable-push:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.push-enabled-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  background: rgba(16, 185, 129, 0.12);
  border-radius: 10px;
  color: #10b981;
  font-size: 13px;
  font-weight: 600;
}

.timeline {
  position: relative;
}

.timeline-step {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding-bottom: 25px;
  position: relative;
}

.timeline-step:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 17px;
  top: 38px;
  width: 2px;
  height: calc(100% - 38px);
  background: var(--dark-border);
}

.timeline-step.completed:not(:last-child)::before {
  background: var(--secondary);
}

.step-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--dark-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  z-index: 1;
  transition: background 0.4s ease, box-shadow 0.4s ease;
}

.timeline-step.completed .step-dot {
  background: var(--secondary);
}

.timeline-step.active .step-dot {
  background: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}

.timeline-step.cancelled .step-dot {
  background: var(--danger);
}

.step-info h6 {
  margin: 0;
  font-size: 15px;
}

.step-info p {
  margin: 2px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}


.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--dark-border);
}

.info-row:last-child {
  border-bottom: none;
}

.total {
  color: var(--amount-color);
  font-weight: 700;
  font-size: 18px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  color: var(--text-secondary);
}

.item-name-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-modifiers {
  color: var(--text-muted);
  font-size: 11px;
  padding-left: 24px;
}

.item-row-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-status-badge {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 8px;
  border-radius: 10px;
}

.item-status-pending { background: rgba(148,163,184,0.15); color: #94a3b8; }
.item-status-preparing { background: rgba(249,115,22,0.15); color: #f97316; }
.item-status-ready { background: rgba(16,185,129,0.15); color: #10b981; }
.item-status-served { background: rgba(71,85,105,0.15); color: #94a3b8; }

.item-emoji {
  display: inline-block;
  margin-right: 4px;
}

.status-badge {
  font-size: 13px;
}

.status-pending { background: rgba(245,158,11,0.15); color: #f59e0b; }
.status-confirmed { background: rgba(59,130,246,0.15); color: #3b82f6; }
.status-preparing { background: rgba(249,115,22,0.15); color: #f97316; }
.status-ready { background: rgba(168,85,247,0.15); color: #a855f7; }
.status-served { background: rgba(16,185,129,0.15); color: #10b981; }
.status-completed { background: rgba(71,85,105,0.15); color: #94a3b8; }
.status-cancelled { background: rgba(239,68,68,0.15); color: #ef4444; }

.text-muted-custom { color: var(--text-secondary); }
.text-success { color: var(--success); }
.text-warning { color: var(--warning); }

.btn-back {
  margin-top: 15px;
  padding: 10px 25px;
  background: var(--primary);
  border: none;
  border-radius: 10px;
  color: white;
}

.bill-request-card {
  border-color: var(--secondary);
}

.bill-text {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 14px;
}

.btn-request-bill {
  width: 100%;
  padding: 14px;
  background: var(--secondary);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: 0.3s;
}

.btn-request-bill:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.bill-requested-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #10b981;
  font-weight: 600;
  font-size: 14px;
}

.btn-cancel-order {
  width: 100%;
  padding: 14px;
  background: #ef4444;
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: 0.3s;
}

.btn-cancel-order:hover { background: #dc2626; }
.btn-cancel-order:disabled { opacity: 0.5; cursor: not-allowed; }

.star-row {
  display: flex;
  gap: 8px;
}

.star {
  font-size: 32px;
  color: var(--dark-border);
  cursor: pointer;
  transition: 0.2s;
}

.star.active {
  color: var(--warning);
}

.rating-input {
  width: 100%;
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  color: var(--text-primary);
  padding: 10px;
  resize: none;
  font-size: 14px;
}

.btn-rate {
  width: 100%;
  padding: 12px;
  background: var(--warning);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.btn-rate:disabled { opacity: 0.5; }

.rating-comment {
  color: var(--text-secondary);
  font-size: 14px;
}

@media (max-width: 480px) {
  .tracking-header {
    padding: 16px 18px;
  }

  .tracking-header h4 {
    font-size: 17px;
  }

  .order-id {
    font-size: 15px;
  }

  .timeline-card, .detail-card {
    padding: 18px;
  }
}
</style>

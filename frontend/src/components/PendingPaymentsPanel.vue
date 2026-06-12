<template>
  <div class="pending-payments-panel">

    <div v-if="showReceipt && selectedPayment" class="receipt-modal" @click.self="showReceipt = false">
      <div class="receipt-content">
        <div class="receipt-header">
          <div class="receipt-brand">
            <div class="brand-icon"><img :src="logoIcon" alt="Smart Dine" /></div>
            <div>
              <h4>SmartDine</h4>
              <span class="receipt-subtitle">Order Receipt</span>
            </div>
          </div>
          <button class="close-btn" @click="showReceipt = false">x</button>
        </div>

        <div class="receipt-details">
          <div class="receipt-meta">
            <div class="meta-item">
              <span class="meta-label">Table</span>
              <span class="meta-value">#{{ selectedPayment.table_number }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Order</span>
              <span class="meta-value">#{{ selectedPayment.order_id }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Date</span>
              <span class="meta-value">{{ formatDateTime(selectedPayment.order_created_at) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Status</span>
              <span :class="['meta-value', 'status-pill', 'status-' + selectedPayment.order_status]">{{ selectedPayment.order_status }}</span>
            </div>
          </div>

          <div class="receipt-row" v-if="selectedPayment.payer_name">
            <span class="label"><i class="bi bi-person-fill"></i> Payer</span>
            <span class="value">{{ selectedPayment.payer_name }}</span>
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-items" v-if="selectedPayment.items?.length">
            <div class="receipt-items-title">Order Items</div>
            <div v-for="item in selectedPayment.items" :key="item.name" class="receipt-item">
              <div class="ri-main">
                <span class="ri-name">{{ item.name }}</span>
                <span class="ri-meta">{{ item.quantity }} x {{ formatAmount(item.price) }}</span>
              </div>
              <span class="ri-total">{{ formatAmount(Number(item.price) * Number(item.quantity)) }}</span>
            </div>
          </div>

          <div class="receipt-summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>{{ formatAmount(itemsSubtotal) }}</span>
            </div>
            <div class="summary-row discount" v-if="orderDiscount > 0">
              <span>Discount</span>
              <span>-{{ formatAmount(orderDiscount) }}</span>
            </div>
            <div class="summary-row order-total">
              <span>Order Total</span>
              <span>{{ formatAmount(orderTotal) }}</span>
            </div>
          </div>

          <div v-if="isSplitPayment" class="split-note">
            <i class="bi bi-people-fill"></i>
            Split payment ({{ splitTypeLabel(selectedPayment.split_type) }}) - this is {{ selectedPayment.payer_name || 'a guest' }}'s share
          </div>

          <div class="receipt-row amount">
            <span class="label">Amount Due</span>
            <span class="amount-val">{{ formatAmount(selectedPayment.amount) }}</span>
          </div>

          <div class="receipt-row">
            <span class="label"><i class="bi bi-credit-card"></i> Payment Method</span>
            <span class="value">{{ paymentMethodLabel(selectedPayment.method) }}</span>
          </div>
          <div class="receipt-row" v-if="selectedPayment.transaction_id">
            <span class="label">Transaction ID</span>
            <span class="value mono">{{ selectedPayment.transaction_id }}</span>
          </div>

          <div v-if="selectedPayment.paidSplits?.length" class="receipt-divider"></div>
          <div v-if="selectedPayment.paidSplits?.length" class="paid-splits">
            <p class="paid-splits-title"><i class="bi bi-check-circle-fill"></i> Already Paid Online</p>
            <div v-for="(s, idx) in selectedPayment.paidSplits" :key="idx" class="paid-split-row">
              <span>{{ s.payer_name || 'Guest' }}</span>
              <span>{{ formatAmount(s.amount) }} - {{ paymentMethodLabel(s.method) }}</span>
            </div>
          </div>

          <div v-if="selectedPayment.waiter_confirmed_by" class="waiter-confirmed-badge">
            <i class="bi bi-person-check-fill"></i>
            Collected by {{ selectedPayment.waiter_confirmed_name || 'waiter' }} - {{ formatTime(selectedPayment.waiter_confirmed_at) }}
          </div>

          <div class="receipt-divider"></div>
          <p class="receipt-note">
            {{ role === 'waiter'
              ? "Give this receipt to the guest. Confirm collection once you've taken the payment - the cashier will verify it."
              : "Give this receipt to the guest. Mark it paid once you've collected or verified the cash or card payment." }}
          </p>
        </div>

        <div class="receipt-actions">
          <button class="btn-print" @click="printReceipt">
            <i class="bi bi-printer"></i> Print
          </button>
          <button
            class="btn-confirm-receipt"
            @click="confirmPaymentFromReceipt"
            :disabled="!canConfirmPayment(selectedPayment) || confirmingPaymentId === selectedPayment.id"
          >
            <i class="bi bi-check-circle"></i> {{ confirmButtonLabel(selectedPayment) }}
          </button>
        </div>
        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
      </div>
    </div>

    <div v-if="loading" class="text-center mt-5">Loading payments...</div>
    <p v-if="errorMessage && !showReceipt" class="error-msg page-error">{{ errorMessage }}</p>

    <div v-else-if="payments.length === 0" class="empty-state">
      <div class="empty-icon"><i class="bi bi-check-circle"></i></div>
      <p>All payments confirmed! Great work.</p>
    </div>

    <div v-else class="payments-grid">
      <div v-for="payment in payments" :key="payment.id" class="payment-card">

        <div class="card-header">
          <div class="header-left">
            <h5>Table #{{ payment.table_number }}</h5>
            <div class="header-meta">
              <span class="order-tag">Order #{{ payment.order_id }}</span>
              <span class="payment-method">
                <i :class="'bi bi-' + (payment.method === 'cash' ? 'cash-stack' : 'wallet2')"></i>
                {{ paymentMethodLabel(payment.method) }}
              </span>
            </div>
          </div>
          <div class="header-right">
            <span :class="['status-pill', 'status-' + payment.order_status]">{{ payment.order_status }}</span>
            <div class="payment-status">{{ formatTime(payment.created_at) }}</div>
          </div>
        </div>

        <div class="card-body">
          <div v-if="payment.payer_name" class="payer-row">
            <i class="bi bi-person-fill"></i> {{ payment.payer_name }}
          </div>

          <div class="amount-box">
            <span class="label">Amount to Collect</span>
            <span class="amount">{{ formatAmount(payment.amount) }}</span>
          </div>

          <div v-if="payment.item_count" class="item-count">
            <i class="bi bi-bag"></i> {{ payment.item_count }} items ordered
          </div>
          <div :class="['serve-state', canConfirmPayment(payment) ? 'ready' : 'waiting']">
            {{ canConfirmPayment(payment) ? 'Ready to confirm payment' : 'Waiting for order confirmation' }}
          </div>

          <div v-if="payment.waiter_confirmed_by" class="waiter-confirmed-badge">
            <i class="bi bi-person-check-fill"></i>
            Collected by {{ payment.waiter_confirmed_name || 'waiter' }} - {{ formatTime(payment.waiter_confirmed_at) }}
          </div>

          <div v-if="payment.paidSplits?.length" class="paid-splits">
            <p class="paid-splits-title"><i class="bi bi-check-circle-fill"></i> Already Paid Online</p>
            <div v-for="(s, idx) in payment.paidSplits" :key="idx" class="paid-split-row">
              <span>{{ s.payer_name || 'Guest' }}</span>
              <span>{{ formatAmount(s.amount) }} - {{ paymentMethodLabel(s.method) }}</span>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button
            class="btn-receipt"
            @click="showPaymentReceipt(payment)"
            :disabled="confirmingPaymentId === payment.id"
          >
            <i class="bi bi-receipt"></i>
            View Receipt
          </button>
          <button
            class="btn-confirm"
            @click="confirmPayment(payment.id)"
            :disabled="confirmingPaymentId === payment.id || !canConfirmPayment(payment)"
          >
            <i class="bi bi-check-circle"></i>
            {{ confirmButtonLabel(payment) }}
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../services/api'
import logoIcon from '../assets/logo-icon.svg'
import { useSocketStore } from '../store/socket'
import { useAuthStore } from '../store/auth'
import { formatMoney, getCurrency } from '../utils/currency'

const emit = defineEmits(['update:count'])

const socketStore = useSocketStore()
const authStore = useAuthStore()
const role = computed(() => authStore.role)

const payments = ref([])
const loading = ref(false)
const confirmingPaymentId = ref(null)
const showReceipt = ref(false)
const selectedPayment = ref(null)
const errorMessage = ref('')
const currency = ref(getCurrency())

const onCurrencyChanged = (event) => {
  currency.value = event.detail || getCurrency()
}

const formatAmount = (amount) => formatMoney(amount, currency.value)

const canConfirmPayment = (payment) => {
  return payment && payment.order_status !== 'cancelled'
}

const fetchPayments = async () => {
  loading.value = true
  try {
    const res = await api.get('/payments/pending')
    payments.value = res.data.data || []
    emit('update:count', payments.value.length)
  } catch (error) {
    console.error('Failed to load payments:', error)
  } finally {
    loading.value = false
  }
}

const showPaymentReceipt = (payment) => {
  selectedPayment.value = payment
  showReceipt.value = true
}

const confirmPaymentFromReceipt = async () => {
  if (selectedPayment.value) {
    await confirmPayment(selectedPayment.value.id)
    showReceipt.value = false
  }
}

const printReceipt = () => {
  window.print()
}

const confirmPayment = async (paymentId) => {
  confirmingPaymentId.value = paymentId
  errorMessage.value = ''
  try {
    await api.post(`/payments/confirm/${paymentId}`)
    payments.value = payments.value.filter(p => p.id !== paymentId)
    emit('update:count', payments.value.length)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Failed to confirm payment'
    console.error('Failed to confirm payment:', error)
  } finally {
    confirmingPaymentId.value = null
  }
}

const confirmButtonLabel = (payment) => {
  if (confirmingPaymentId.value === payment.id) {
    return role.value === 'waiter' ? 'Confirming...' : 'Verifying...'
  }
  if (role.value === 'waiter') return 'Confirm Collection'
  return payment.waiter_confirmed_by ? 'Verify & Complete' : 'Confirm'
}

const paymentMethodLabel = (method) => {
  if (method === 'cash') return 'Cash'
  if (method === 'mobile') return 'Mobile Wallet'
  return 'Card'
}

const splitTypeLabel = (splitType) => {
  if (splitType === 'equal') return 'split equally'
  if (splitType === 'custom') return 'custom split'
  return splitType
}

const itemsSubtotal = computed(() => {
  const items = selectedPayment.value?.items || []
  return items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)
})

const orderDiscount = computed(() => Number(selectedPayment.value?.discount_amount || 0))

const orderTotal = computed(() => {
  const total = selectedPayment.value?.order_total
  return total !== undefined && total !== null ? Number(total) : itemsSubtotal.value
})

const isSplitPayment = computed(() => {
  const splitType = selectedPayment.value?.split_type
  return !!splitType && splitType !== 'full'
})

const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return date.toLocaleDateString()
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const setupSocketListeners = () => {
  const socket = socketStore.socket
  if (socket) {
    socket.off('cash-payment-pending', fetchPayments)
    socket.off('pending-payment', fetchPayments)
    socket.off('payment-confirmed', fetchPayments)
    socket.on('cash-payment-pending', fetchPayments)
    socket.on('pending-payment', fetchPayments)
    socket.on('payment-confirmed', fetchPayments)
  }
}

const cleanupSocketListeners = () => {
  const socket = socketStore.socket
  if (socket) {
    socket.off('cash-payment-pending', fetchPayments)
    socket.off('pending-payment', fetchPayments)
    socket.off('payment-confirmed', fetchPayments)
  }
}

let refreshInterval

onMounted(() => {
  window.addEventListener('currency-changed', onCurrencyChanged)
  fetchPayments()
  socketStore.connect()
  setTimeout(setupSocketListeners, 500)
  refreshInterval = setInterval(fetchPayments, 30000)
})

onUnmounted(() => {
  window.removeEventListener('currency-changed', onCurrencyChanged)
  cleanupSocketListeners()
  if (refreshInterval) clearInterval(refreshInterval)
})

defineExpose({ fetchPayments })
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  color: #10b981;
  margin-bottom: 12px;
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 16px;
}


.payments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.payment-card {
  background: var(--dark-card);
  border-radius: 12px;
  border: 1px solid var(--dark-border);
  overflow: hidden;
  transition: 0.2s;
}

.payment-card:hover {
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.card-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--dark-border);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left h5 {
  margin: 0 0 6px 0;
  font-size: 18px;
  color: var(--secondary);
}

.header-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.order-tag {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.payment-method {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--dark-hover);
  padding: 4px 8px;
  border-radius: 4px;
}

.payment-status {
  font-size: 12px;
  color: var(--text-muted);
}

.card-body {
  padding: 16px;
}

.payer-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 10px;
}

.amount-box {
  background: var(--dark-hover);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.amount-box .label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.amount-box .amount {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #10b981;
}

.item-count {
  font-size: 13px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-confirm {
  width: 100%;
  padding: 12px;
  background: #10b981;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: 0.2s;
}

.btn-confirm:hover:not(:disabled) {
  background: #059669;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}


.receipt-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.receipt-content {
  background: var(--dark-card);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid var(--primary);
}

.receipt-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.brand-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.receipt-header h4 {
  margin: 0;
  font-size: 20px;
  color: var(--text-primary);
}

.receipt-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  color: var(--primary);
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}

.close-btn:hover {
  color: var(--primary-hover);
  transform: scale(1.1);
}

.receipt-details {
  padding: 20px;
}

.receipt-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 14px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  font-weight: 600;
}

.meta-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.status-pill {
  display: inline-block;
  text-transform: capitalize;
  width: fit-content;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

.status-pending { background: rgba(245,158,11,0.15); color: #f59e0b; }
.status-confirmed { background: rgba(59,130,246,0.15); color: #3b82f6; }
.status-preparing { background: rgba(249,115,22,0.15); color: #f97316; }
.status-ready { background: rgba(168,85,247,0.15); color: #a855f7; }
.status-served { background: rgba(16,185,129,0.15); color: #10b981; }
.status-completed { background: rgba(71,85,105,0.15); color: #94a3b8; }
.status-cancelled { background: rgba(239,68,68,0.15); color: #ef4444; }

.receipt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--dark-border);
}

.receipt-row .label {
  color: var(--text-muted);
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.receipt-row .value {
  color: var(--text-primary);
  font-weight: 600;
}

.receipt-row .value.mono {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.receipt-items {
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  padding: 10px 12px;
}

.receipt-items-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  padding-bottom: 6px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--dark-border);
}

.receipt-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  color: var(--text-primary);
  font-size: 13px;
  border-bottom: 1px solid var(--dark-border);
}

.receipt-item:last-child {
  border-bottom: none;
}

.ri-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ri-name {
  font-weight: 600;
}

.ri-meta {
  font-size: 11px;
  color: var(--text-muted);
}

.ri-total {
  font-weight: 700;
  white-space: nowrap;
}

.receipt-summary {
  margin-top: 12px;
  padding-top: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.summary-row.discount {
  color: #34d399;
}

.summary-row.order-total {
  font-weight: 700;
  font-size: 14px;
  color: var(--text-primary);
  border-top: 1px solid var(--dark-border);
  margin-top: 4px;
  padding-top: 8px;
}

.split-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(99, 102, 241, 0.1);
  color: #a5b4fc;
}

.receipt-row.amount {
  padding: 16px 0;
  background: var(--dark-surface);
  padding: 16px;
  border-radius: 10px;
  border-bottom: none;
  margin: 16px 0;
}

.amount-val {
  font-size: 32px;
  color: var(--amount-color);
  font-weight: 700;
}

.receipt-divider {
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  margin: 12px 0;
}

.receipt-note {
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  margin: 16px 0 0 0;
  padding-top: 16px;
  border-top: 1px solid var(--dark-border);
}

.receipt-actions {
  padding: 16px 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.btn-print,
.btn-confirm-receipt {
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  transition: 0.2s;
}

.btn-print {
  background: var(--dark-hover);
  color: var(--text-secondary);
}

.btn-print:hover {
  background: var(--dark-border);
  color: var(--text-primary);
}

.btn-confirm-receipt {
  background: var(--primary);
  color: #fff;
}

.btn-confirm-receipt:hover {
  background: var(--primary-hover);
}

.btn-confirm-receipt:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-receipt {
  padding: 10px 12px;
  background: var(--dark-hover);
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: 0.2s;
  margin-right: 8px;
}

.btn-receipt:hover:not(:disabled) {
  background: var(--dark-border);
}

.serve-state {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
}

.serve-state.ready {
  background: rgba(16, 185, 129, 0.14);
  color: #34d399;
}

.serve-state.waiting {
  background: rgba(245, 158, 11, 0.14);
  color: #fbbf24;
}

.error-msg {
  color: var(--danger);
  font-size: 13px;
  text-align: center;
  margin: 10px 20px 0;
}

.page-error {
  margin-bottom: 12px;
}

.card-actions {
  padding: 12px 16px;
  border-top: 1px solid var(--dark-border);
  display: flex;
  gap: 8px;
}


.waiter-confirmed-badge {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(99, 102, 241, 0.14);
  color: #a5b4fc;
}

.paid-splits {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--dark-border);
}

.paid-splits-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #34d399;
  margin: 0 0 6px;
}

.paid-split-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 2px 0;
}
</style>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  .receipt-modal, .receipt-modal * {
    visibility: visible;
  }
  .receipt-modal {
    position: absolute;
    inset: 0;
    background: #fff;
    display: block;
    padding: 20px;
  }
  .receipt-content {
    box-shadow: none;
    max-width: 100%;
    max-height: none;
    width: 100%;
    margin: 0 auto;
    background: #fff;
    color: #111;
  }
  .receipt-content .receipt-header,
  .receipt-content .receipt-row,
  .receipt-content .receipt-item,
  .receipt-content .receipt-items-title,
  .receipt-content .receipt-meta,
  .receipt-content .receipt-summary,
  .receipt-content .summary-row,
  .receipt-content .receipt-note,
  .receipt-content .receipt-row.amount,
  .receipt-content .receipt-items {
    border-color: #ddd !important;
    background: #fff !important;
    color: #111 !important;
  }
  .receipt-content .meta-label,
  .receipt-content .ri-meta,
  .receipt-content .receipt-row .label,
  .receipt-content .receipt-note,
  .receipt-content .summary-row {
    color: #555 !important;
  }
  .receipt-content .amount-val {
    color: #111 !important;
  }
  .receipt-actions, .close-btn, .waiter-confirmed-badge {
    display: none !important;
  }
}
</style>

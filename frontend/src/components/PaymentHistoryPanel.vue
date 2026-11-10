<template>
  <div class="payment-history-panel">

    <div v-if="showRefundModal && selectedPayment" class="modal-overlay" @click.self="closeRefundModal">
      <div class="modal-card">
        <h5><i class="bi bi-arrow-counterclockwise"></i> Record Refund</h5>
        <p>Return the collected funds separately before recording this refund. This action does not transfer money.</p>
        <p class="refund-summary">
          Order #{{ selectedPayment.order_id }} - Table #{{ selectedPayment.table_number }} -
          <strong>{{ formatAmount(selectedPayment.amount) }}</strong>
        </p>

        <div class="form-group">
          <label>Reason</label>
          <select v-model="refundForm.reason" class="form-input">
            <option value="" disabled>Select a reason...</option>
            <option v-for="r in refundReasons" :key="r" :value="r">{{ reasonLabel(r) }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Notes (optional)</label>
          <textarea v-model="refundForm.notes" class="form-input" rows="2" placeholder="Additional details..."></textarea>
        </div>

        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <div class="modal-actions">
          <button class="btn-cancel" @click="closeRefundModal">Cancel</button>
          <button class="btn-refund-confirm" :disabled="!refundForm.reason || refunding" @click="submitRefund">
            {{ refunding ? 'Processing...' : 'Record Returned Funds' }}
          </button>
        </div>
      </div>
    </div>

    <div class="filter-row">
      <select v-model="statusFilter" @change="loadPayments(1)" class="form-input filter-select">
        <option value="">All Statuses</option>
        <option value="paid">Paid</option>
        <option value="refunded">Refunded</option>
      </select>
      <input
        v-model="tableFilter"
        @keyup.enter="loadPayments(1)"
        @blur="loadPayments(1)"
        type="number"
        min="1"
        class="form-input filter-select"
        placeholder="Table #"
      />
      <button v-if="tableFilter" class="btn-page" @click="tableFilter = ''; loadPayments(1)">
        <i class="bi bi-x-circle"></i> Clear
      </button>
    </div>

    <div v-if="loading" class="text-center mt-5">Loading payment history...</div>

    <div v-else-if="!payments.length" class="empty-state">
      <div class="empty-icon"><i class="bi bi-receipt"></i></div>
      <p>No payments found.</p>
    </div>

    <div v-else class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Order</th>
            <th>Table</th>
            <th>Payer</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Refund Info</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in payments" :key="p.id">
            <td class="nowrap">{{ formatDateTime(p.created_at) }}</td>
            <td>#{{ p.order_id }}</td>
            <td>#{{ p.table_number }}</td>
            <td>{{ p.payer_name || 'Guest' }}</td>
            <td>{{ formatAmount(p.amount) }}</td>
            <td>{{ paymentMethodLabel(p.method) }}</td>
            <td>
              <span :class="['status-pill', p.status === 'refunded' ? 'status-refunded' : 'status-paid']">
                {{ p.status === 'refunded' ? 'Refunded' : 'Paid' }}
              </span>
            </td>
            <td class="refund-info">
              <span v-if="p.status === 'refunded'">
                {{ reasonLabel(p.refund_reason) }}
                <span class="refund-meta">by {{ p.refunded_by_name || 'unknown' }} - {{ formatDateTime(p.refunded_at) }}</span>
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <button @click="saveReceipt(p.order_id)" class="btn-receipt"><i class="bi bi-receipt"></i> Receipt</button>
              <button v-if="p.status === 'paid'" class="btn-refund" @click="openRefundModal(p)">
                <i class="bi bi-arrow-counterclockwise"></i> Refund
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" v-if="pagination.pages > 1">
        <button class="btn-page" :disabled="pagination.page <= 1" @click="loadPayments(pagination.page - 1)">
          <i class="bi bi-chevron-left"></i> Prev
        </button>
        <span class="page-info">Page {{ pagination.page }} of {{ pagination.pages }} ({{ pagination.total }} entries)</span>
        <button class="btn-page" :disabled="pagination.page >= pagination.pages" @click="loadPayments(pagination.page + 1)">
          Next <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { downloadReceipt } from '../services/receipts'
import { ref, onMounted, onUnmounted } from 'vue'
import api from '../services/api'

import { useToastStore } from '../store/toast'
import { formatMoney, getCurrency } from '../utils/currency'

const toast = useToastStore()
const saveReceipt = async (id) => {
  try { await downloadReceipt(id) }
  catch { toast.error('Unable to download receipt') }
}


const payments = ref([])
const loading = ref(false)
const statusFilter = ref('')
const tableFilter = ref('')
const pagination = ref({ page: 1, limit: 20, total: 0, pages: 0 })
const refundReasons = ref([])

const showRefundModal = ref(false)
const selectedPayment = ref(null)
const refundForm = ref({ reason: '', notes: '' })
const refunding = ref(false)
const errorMessage = ref('')
const currency = ref(getCurrency())

const onCurrencyChanged = (event) => {
  currency.value = event.detail || getCurrency()
}

const formatAmount = (amount) => formatMoney(amount, currency.value)

const REASON_LABELS = {
  customer_complaint: 'Customer Complaint',
  order_cancelled: 'Order Cancelled',
  duplicate_charge: 'Duplicate Charge',
  food_quality_issue: 'Food Quality Issue',
  incorrect_order: 'Incorrect Order',
  other: 'Other'
}

function reasonLabel(reason) {
  if (!reason) return '-'
  const code = reason.split(':')[0].trim()
  const rest = reason.includes(':') ? reason.slice(reason.indexOf(':') + 1).trim() : ''
  const label = REASON_LABELS[code] || code
  return rest ? `${label} - ${rest}` : label
}

function paymentMethodLabel(method) {
  if (method === 'cash') return 'Cash'
  if (method === 'mobile') return 'Mobile Wallet'
  return 'Card'
}

function formatDateTime(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString()
}

async function loadPayments(page = 1) {
  loading.value = true
  try {
    const params = { page, limit: pagination.value.limit || 20 }
    if (statusFilter.value) params.status = statusFilter.value
    if (tableFilter.value) params.table_number = tableFilter.value
    const res = await api.get('/payments/recent', { params })
    payments.value = res.data.data || []
    pagination.value = res.data.pagination
    if (res.data.refundReasons) refundReasons.value = res.data.refundReasons
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function openRefundModal(payment) {
  selectedPayment.value = payment
  refundForm.value = { reason: '', notes: '' }
  errorMessage.value = ''
  showRefundModal.value = true
}

function closeRefundModal() {
  showRefundModal.value = false
  selectedPayment.value = null
}

async function submitRefund() {
  if (!selectedPayment.value || !refundForm.value.reason) return
  refunding.value = true
  errorMessage.value = ''
  try {
    await api.post(`/payments/refund/${selectedPayment.value.id}`, {
      reason: refundForm.value.reason,
      notes: refundForm.value.notes
    })
    toast.success('Payment refunded')
    closeRefundModal()
    loadPayments(pagination.value.page)
  } catch (e) {
    errorMessage.value = e.response?.data?.message || 'Failed to process refund'
  } finally {
    refunding.value = false
  }
}

onMounted(() => {
  window.addEventListener('currency-changed', onCurrencyChanged)
  loadPayments(1)
})

onUnmounted(() => {
  window.removeEventListener('currency-changed', onCurrencyChanged)
})

defineExpose({ loadPayments })
</script>

<style scoped>
.filter-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.filter-select {
  max-width: 180px;
}
.form-input {
  padding: 8px 12px;
  border: 1px solid var(--dark-border, #334155);
  border-radius: 8px;
  background: var(--dark-card, #1e293b);
  color: var(--text-primary);
  font-size: 13px;
  width: 100%;
}
.table-card {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 15px;
  padding: 20px;
  overflow-x: auto;
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
.nowrap { white-space: nowrap; }
.text-muted { color: var(--text-muted, #64748b); }
.status-pill {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}
.status-paid { background: rgba(16,185,129,0.15); color: #10b981; }
.status-refunded { background: rgba(239,68,68,0.15); color: #ef4444; }
.refund-info { font-size: 12px; }
.refund-meta { display: block; color: var(--text-muted); font-size: 11px; margin-top: 2px; }
.btn-refund {
  padding: 6px 12px;
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.4);
  border-radius: 6px;
  color: #ef4444;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.btn-refund:hover { background: rgba(239,68,68,0.2); }

.btn-receipt {
  padding: 6px 12px;
  background: var(--dark-hover);
  border: 1px solid var(--dark-border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  text-decoration: none;
  margin-right: 6px;
}

.btn-receipt:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}
.empty-icon {
  font-size: 48px;
  color: var(--text-muted);
  margin-bottom: 12px;
}
.empty-state p {
  color: var(--text-secondary);
  font-size: 16px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--dark-border, #334155);
}
.btn-page {
  padding: 6px 14px;
  border: 1px solid var(--dark-border);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-page:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-page:not(:disabled):hover { color: var(--primary); border-color: var(--primary); }
.page-info { font-size: 13px; color: var(--text-secondary); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: var(--dark-card); border-radius: 20px; padding: 30px; width: 100%; max-width: 450px; color: var(--text-primary); margin: 0 16px; }
.modal-card h5 { margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.refund-summary { color: var(--text-secondary); font-size: 13px; margin-bottom: 18px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; color: var(--text-secondary); font-size: 14px; margin-bottom: 5px; }
.form-group textarea.form-input { resize: none; }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.btn-cancel { flex: 1; padding: 10px; background: var(--dark-hover); border: none; border-radius: 10px; color: var(--text-primary); cursor: pointer; }
.btn-refund-confirm { flex: 1; padding: 10px; background: #ef4444; border: none; border-radius: 10px; color: #fff; font-weight: 600; cursor: pointer; }
.btn-refund-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
.error-msg { color: var(--danger, #ef4444); font-size: 13px; margin-top: 8px; }
</style>

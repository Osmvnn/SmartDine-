<template>
  <div class="cashier-dash">

    <div class="dash-header">
      <h4><i class="bi bi-cash-stack"></i> Cashier Dashboard</h4>
      <div class="header-info">
        <span class="live-badge" :class="{ offline: !socketStore.connected }">
          <span class="live-dot anim-pulse"></span>
          {{ socketStore.connected ? 'Live' : 'Offline' }}
        </span>
        <button
          :class="['btn-shift', isClockedIn ? 'clocked-in' : '']"
          @click="toggleShift"
          :disabled="shiftLoading"
        >
          <i :class="isClockedIn ? 'bi bi-stop-circle' : 'bi bi-play-circle'"></i>
          {{ isClockedIn ? 'Clock Out' : 'Clock In' }}
        </button>
        <span class="pending-count" v-if="pendingCount">{{ pendingCount }} Payments Pending</span>
        <button class="btn-refresh" @click="refreshPayments">Refresh</button>
      </div>
    </div>

    <div class="container-fluid mt-4 px-4">
      <div class="tab-bar">
        <button :class="['tab-btn', { active: activeTab === 'pending' }]" @click="activeTab = 'pending'">
          <i class="bi bi-hourglass-split"></i> Pending Payments
        </button>
        <button :class="['tab-btn', { active: activeTab === 'history' }]" @click="activeTab = 'history'">
          <i class="bi bi-clock-history"></i> Payment History &amp; Refunds
        </button>
      </div>

      <PendingPaymentsPanel v-show="activeTab === 'pending'" ref="paymentsPanel" @update:count="pendingCount = $event" />
      <PaymentHistoryPanel v-if="activeTab === 'history'" />
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import { useSocketStore } from '../../store/socket'
import PendingPaymentsPanel from '../../components/PendingPaymentsPanel.vue'
import PaymentHistoryPanel from '../../components/PaymentHistoryPanel.vue'

const socketStore = useSocketStore()
const isClockedIn = ref(false)
const shiftLoading = ref(false)
const pendingCount = ref(0)
const paymentsPanel = ref(null)
const activeTab = ref('pending')

const refreshPayments = () => {
  paymentsPanel.value?.fetchPayments()
}

const checkShiftStatus = async () => {
  try {
    const res = await api.get('/shifts/my')
    isClockedIn.value = res.data.data.isClockedIn
    return isClockedIn.value
  } catch (error) {
    console.error('Failed to check shift status:', error)
  }
  return isClockedIn.value
}

const toggleShift = async () => {
  shiftLoading.value = true
  try {
    const currentlyClockedIn = await checkShiftStatus()
    if (currentlyClockedIn) {
      await api.post('/shifts/clock-out', {})
      isClockedIn.value = false
    } else {
      await api.post('/shifts/clock-in')
      isClockedIn.value = true
    }
  } catch (error) {
    console.error('Failed to toggle shift:', error)
  } finally {
    await checkShiftStatus()
    shiftLoading.value = false
  }
}

onMounted(() => {
  checkShiftStatus()
})
</script>

<style scoped>
.cashier-dash {
  background: var(--dark);
  min-height: 100vh;
  color: var(--text-primary);
}


.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  background: var(--dark-card);
  border-bottom: 1px solid var(--dark-border);
}

.dash-header h4 {
  margin: 0;
  font-size: 18px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-shift {
  padding: 8px 14px;
  background: var(--primary);
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: 0.2s;
}

.btn-shift:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-shift.clocked-in {
  background: #ef4444;
}

.btn-shift:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pending-count {
  background: #ef4444;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
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

.btn-refresh {
  padding: 8px 14px;
  background: var(--dark-hover);
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 13px;
  transition: 0.2s;
}

.btn-refresh:hover {
  background: var(--dark-border);
}

.tab-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--dark-border);
}

.tab-btn {
  padding: 10px 18px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: 0.2s;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

</style>

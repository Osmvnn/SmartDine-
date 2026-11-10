<template>
  <div class="page-container">

    <div v-if="doneSuccess" class="done-success">
      <div class="done-card">
        <div class="done-icon"><i class="bi bi-check-circle-fill"></i></div>
        <h3>Thank You!</h3>
        <p>We hope you enjoyed your meal.</p>
        <p class="done-sub">Staff has been notified to clean your table.</p>
        <div class="done-countdown">Redirecting in {{ countdown }}s...</div>
      </div>
    </div>

    <template v-else>
      <div v-if="cartStore.qrToken" class="table-context-card">
        <div class="tc-left">
          <div class="tc-table-num">T{{ cartStore.tableNumber }}</div>
          <div>
            <p class="tc-title">Table #{{ cartStore.tableNumber }}</p>
            <span :class="['bill-badge', cartStore.billType === 'shared' ? 'bill-shared' : 'bill-separate']">
              <i :class="cartStore.billType === 'shared' ? 'bi bi-people-fill' : 'bi bi-person-fill'"></i>
              {{ cartStore.billType === 'shared' ? 'Shared Bill' : 'Personal Bill' }}
            </span>
          </div>
        </div>
        <button class="btn-done-eating" @click="confirmDone = true">
          <i class="bi bi-door-open me-1"></i> Done Eating
        </button>
      </div>

      <div v-if="confirmDone" class="confirm-overlay" @click.self="confirmDone = false">
        <div class="confirm-box">
          <div class="confirm-icon"><i class="bi bi-door-open"></i></div>
          <h5>Done eating?</h5>
          <p>This will free the table and notify staff to clean it. Your session will end.</p>
          <div class="confirm-btns">
            <button class="btn-cancel-conf" @click="confirmDone = false">Stay</button>
            <button class="btn-confirm-done" :disabled="doneLoading" @click="markDoneEating">
              {{ doneLoading ? 'Processing...' : "Yes, I'm Done" }}
            </button>
          </div>
        </div>
      </div>

      <div class="page-header">
        <h2><i class="bi bi-clock-history"></i> My Orders</h2>
        <p class="header-sub" v-if="authStore.user?.name">{{ authStore.user.name }}'s order history</p>
      </div>

      <div v-if="authStore.isLoggedIn && loyaltyRewards.length" class="section-card rewards-card">
        <h5><i class="bi bi-gem me-2"></i>Loyalty Rewards</h5>
        <p class="rewards-balance">
          You have <strong>{{ availableLoyaltyBalance }}</strong> points
          <span v-if="pendingRewardCost" class="pending-reward-note">{{ pendingRewardCost }} pts reserved in cart</span>
        </p>
        <div class="rewards-scroll">
          <div v-for="reward in loyaltyRewards" :key="reward.id" class="reward-card">
            <div class="reward-name">{{ reward.name }}</div>
            <div class="reward-item-name" v-if="reward.item_name">{{ reward.item_name }}</div>
            <div class="reward-cost">{{ reward.points_cost }} pts</div>
            <button
              :class="['btn-redeem', selectedRewardId === reward.id ? 'selected' : '']"
              :disabled="availableLoyaltyBalance < reward.points_cost && selectedRewardId !== reward.id"
              @click="redeemReward(reward)"
            >
              {{ selectedRewardId === reward.id ? 'In Cart' : 'Redeem' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <div v-else-if="!orders.length" class="empty-state">
        <i class="bi bi-receipt-cutoff"></i>
        <p>No orders yet</p>
        <router-link :to="`/customer/menu/${cartStore.qrToken || 'table_1'}`" class="btn-primary-custom">
          Browse Menu
        </router-link>
      </div>

      <TransitionGroup v-else name="order-card" tag="div" class="orders-list">
        <div v-for="order in orders" :key="order.id" class="section-card order-card" :class="{ 'flash-update': flashedOrderIds.includes(order.id) }">
          <div class="order-header">
            <div>
              <strong>Order #{{ order.id }}</strong>
              <span :class="'status-badge status-' + order.status">{{ order.status }}</span>
            </div>
            <span class="order-date">{{ formatDate(order.created_at) }}</span>
          </div>

          <div class="order-items">
            <div v-for="item in order.items" :key="item.id" class="order-item-row">
              <span><span class="item-emoji">{{ getFoodEmoji(item) }}</span> {{ item.name }} x{{ item.quantity }}</span>
              <span>{{ formatAmount(item.price * item.quantity) }}</span>
            </div>
          </div>

          <div class="order-footer">
            <strong>Total: {{ formatAmount(order.total) }}</strong>
            <div class="order-actions">
              <button class="btn-sm" @click="reorder(order)">
                <i class="bi bi-arrow-repeat"></i> Reorder
              </button>
              <button @click="saveReceipt(order.id)" class="btn-sm btn-outline"><i class="bi bi-receipt"></i> Receipt</button>
              <router-link :to="`/customer/order/${order.id}`" class="btn-sm btn-outline">
                <i class="bi bi-eye"></i> Track
              </router-link>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </template>

  </div>
</template>

<script setup>
import { downloadReceipt } from '../../services/receipts'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../../store/cart'
import { useAuthStore } from '../../store/auth'
import api from '../../services/api'
import { useToastStore } from '../../store/toast'
import { useSocketStore } from '../../store/socket'
import { getFoodEmoji } from '../../utils/foodEmoji'
import { formatMoney, getCurrency } from '../../utils/currency'

const router = useRouter()
const toast = useToastStore()
const saveReceipt = async (id) => {
  try { await downloadReceipt(id) }
  catch { toast.error('Unable to download receipt') }
}
const cartStore = useCartStore()
const authStore = useAuthStore()
const socketStore = useSocketStore()

const orders = ref([])
const loading = ref(true)

const flashedOrderIds = ref([])
const currency = ref(getCurrency())

const confirmDone = ref(false)
const doneLoading = ref(false)
const doneSuccess = ref(false)
const countdown = ref(4)

const loyaltyBalance = ref(0)
const loyaltyRewards = ref([])

const selectedRewardItem = computed(() => cartStore.items.find(item => item.is_reward))
const selectedRewardId = computed(() => selectedRewardItem.value?.reward_id || null)
const pendingRewardCost = computed(() => Number(selectedRewardItem.value?.points_cost || 0))
const availableLoyaltyBalance = computed(() => Math.max(0, Number(loyaltyBalance.value || 0) - pendingRewardCost.value))

const onCurrencyChanged = (event) => {
  currency.value = event.detail || getCurrency()
}

const formatAmount = (amount) => formatMoney(amount, currency.value)

async function fetchLoyaltyRewards() {
  if (!authStore.isLoggedIn) return
  try {
    const res = await api.get('/loyalty/rewards', { params: { user_id: authStore.user.id } })
    loyaltyBalance.value = res.data.data.balance || 0
    loyaltyRewards.value = res.data.data.rewards || []
  } catch (e) {
    console.error(e)
  }
}

function redeemReward(reward) {
  if (selectedRewardId.value === reward.id) {
    router.push('/customer/cart')
    return
  }
  if (availableLoyaltyBalance.value < reward.points_cost) {
    toast.error('Not enough points for this reward')
    return
  }
  cartStore.addRewardItem(reward)
  toast.success(`${reward.name} added to cart for free!`)
  window.dispatchEvent(new CustomEvent('loyalty-updated'))
  router.push('/customer/cart')
}

onMounted(async () => {
  window.addEventListener('currency-changed', onCurrencyChanged)
  window.addEventListener('loyalty-updated', fetchLoyaltyRewards)
  window.addEventListener('focus', fetchLoyaltyRewards)
  try {
    if (authStore.isLoggedIn) {
      const res = await api.get('/orders/my')
      orders.value = res.data.data || []
    } else if (cartStore.tableId) {
      const res = await api.get(`/orders/table/${cartStore.tableId}`)
      orders.value = res.data.data || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }

  fetchLoyaltyRewards()

  socketStore.connect()
  socketStore.socket?.on('order-status-changed', handleStatusChange)
})

onUnmounted(() => {
  window.removeEventListener('currency-changed', onCurrencyChanged)
  window.removeEventListener('loyalty-updated', fetchLoyaltyRewards)
  window.removeEventListener('focus', fetchLoyaltyRewards)
  socketStore.socket?.off('order-status-changed', handleStatusChange)
})

function handleStatusChange(payload) {
  const order = orders.value.find(o => Number(o.id) === Number(payload.order_id))
  if (!order) return
  order.status = payload.status

  flashedOrderIds.value.push(order.id)
  setTimeout(() => {
    flashedOrderIds.value = flashedOrderIds.value.filter(id => id !== order.id)
  }, 1800)
}

function formatDate(d) {
  return new Date(d).toLocaleString()
}

function reorder(order) {
  let addedCount = 0
  for (const item of order.items) {
    if (Number(item.price) === 0) continue
    cartStore.addItem({ id: item.menu_item_id, name: item.name, price: Number(item.price) })
    addedCount++
  }
  if (addedCount > 0) {
    toast.success('Items added to cart!')
  } else {
    toast.error('Nothing to reorder from this order')
  }
}

async function markDoneEating() {
  if (!cartStore.qrToken) return
  doneLoading.value = true
  try {
    await api.post(`/tables/qr/${cartStore.qrToken}/done`)
    confirmDone.value = false
    doneSuccess.value = true
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        cartStore.clearCart()
        authStore.logout()
        router.push('/')
      }
    }, 1000)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Could not close session')
  } finally {
    doneLoading.value = false
  }
}
</script>

<style scoped>

.table-context-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 20px;
}

.tc-left { display: flex; align-items: center; gap: 14px; }

.tc-table-num {
  width: 48px;
  height: 48px;
  background: var(--primary-light);
  border: 2px solid var(--primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 15px;
  color: var(--primary);
}

.tc-title {
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 5px;
  font-size: 15px;
}

.bill-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}
.bill-shared   { background: var(--primary-light); color: var(--primary); }
.bill-separate { background: var(--success-light); color: var(--success); }

.btn-done-eating {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 13px;
  font-weight: 700;
  padding: 10px 18px;
  cursor: pointer;
  transition: 0.2s;
  white-space: nowrap;
}
.btn-done-eating:hover { opacity: 0.88; transform: translateY(-1px); }


.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}
.confirm-box {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 20px;
  padding: 32px 28px;
  text-align: center;
  max-width: 340px;
  width: 100%;
  color: var(--text-primary);
}
.confirm-icon {
  font-size: 2.5rem;
  color: var(--warning);
  margin-bottom: 14px;
}
.confirm-box h5 { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
.confirm-box p  { color: var(--text-secondary); font-size: 14px; margin-bottom: 24px; }
.confirm-btns { display: flex; gap: 12px; }
.btn-cancel-conf {
  flex: 1; padding: 12px; border: 1px solid var(--dark-border); border-radius: 12px;
  background: transparent; color: var(--text-secondary); cursor: pointer; font-weight: 600; transition: 0.2s;
}
.btn-cancel-conf:hover { border-color: var(--primary); color: var(--text-primary); }
.btn-confirm-done {
  flex: 1; padding: 12px; border: none; border-radius: 12px;
  background: #ef4444; color: white; cursor: pointer; font-weight: 700; transition: 0.2s;
}
.btn-confirm-done:hover { background: #dc2626; }
.btn-confirm-done:disabled { opacity: 0.6; cursor: not-allowed; }


.done-success {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.done-card {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 24px;
  padding: 48px 36px;
  text-align: center;
  max-width: 360px;
  width: 100%;
  color: var(--text-primary);
}
.done-icon { font-size: 3.5rem; color: var(--success); margin-bottom: 16px; }
.done-card h3 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
.done-card p  { color: var(--text-secondary); font-size: 14px; margin-bottom: 4px; }
.done-sub     { color: var(--text-muted); font-size: 13px; margin-bottom: 20px; }
.done-countdown { color: var(--primary); font-size: 13px; font-weight: 600; }


.page-header { margin-bottom: 20px; }
.header-sub { color: var(--text-muted); font-size: 13px; margin-top: 2px; margin-bottom: 0; }


.order-card {
  margin-bottom: 16px;
  border: 1px solid var(--dark-border);
  transition: border-color 0.3s, transform 0.2s;
}

.order-card.flash-update {
  animation: status-ready-flash 0.6s ease-in-out 2;
}
.order-header {
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 8px; margin-bottom: 12px;
}
.order-header strong { color: var(--text-primary); margin-right: 8px; }
.order-date { font-size: 12px; color: var(--text-muted, #64748b); }

.status-badge { text-transform: uppercase; }
.status-pending    { background: rgba(245,158,11,0.15); color: #f59e0b; }
.status-confirmed  { background: rgba(59,130,246,0.15); color: #3b82f6; }
.status-preparing  { background: rgba(249,115,22,0.15); color: #f97316; }
.status-ready      { background: rgba(168,85,247,0.15); color: #a855f7; }
.status-served     { background: rgba(16,185,129,0.15); color: #10b981; }
.status-completed  { background: rgba(71,85,105,0.15);  color: #94a3b8; }
.status-cancelled  { background: rgba(239,68,68,0.15);  color: #ef4444; }

.order-items { border-top: 1px solid var(--dark-border, #334155); padding-top: 8px; margin-bottom: 8px; }
.order-item-row {
  display: flex; justify-content: space-between;
  font-size: 13px; color: var(--text-secondary); padding: 3px 0;
}

.item-emoji {
  display: inline-block;
  margin-right: 2px;
}
.order-footer {
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 8px;
  border-top: 1px solid var(--dark-border, #334155); padding-top: 10px;
}
.order-footer strong { color: var(--text-primary); }
.order-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.btn-sm {
  padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
  cursor: pointer; background: var(--primary); color: white; border: none;
  display: flex; align-items: center; gap: 4px;
  text-decoration: none; transition: 0.2s;
}
.btn-sm:hover { opacity: 0.85; }
.btn-sm.btn-outline {
  background: transparent; border: 1px solid var(--dark-border, #334155); color: var(--text-secondary);
}
.btn-sm.btn-outline:hover { border-color: var(--primary); color: var(--primary); }

.empty-state { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
.empty-state i { font-size: 3rem; margin-bottom: 16px; display: block; }
.btn-primary-custom {
  display: inline-block; margin-top: 16px; background: var(--primary);
  color: white; padding: 10px 24px; border-radius: 10px;
  text-decoration: none; font-weight: 600;
}

.page-container {
  min-height: 100vh;
  background: var(--dark);
  color: var(--text-primary);
  padding: 16px;
  padding-bottom: 100px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: clamp(1.1rem, 4vw, 1.4rem);
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-card {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 16px;
  padding: 16px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card-enter-active { transition: all 0.35s ease; }
.order-card-enter-from { opacity: 0; transform: translateY(12px); }
.order-card-move { transition: transform 0.35s ease; }

@media (max-width: 480px) {
  .table-context-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .btn-done-eating {
    width: 100%;
    text-align: center;
    justify-content: center;
  }

  .order-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

.rewards-card h5 {
  margin-bottom: 4px;
}

.rewards-balance {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 12px;
}

.pending-reward-note {
  display: block;
  color: var(--amount-color);
  font-size: 12px;
  margin-top: 4px;
}

.rewards-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.reward-card {
  flex: 0 0 150px;
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reward-name {
  font-weight: 600;
  font-size: 14px;
}

.reward-item-name {
  color: var(--text-secondary);
  font-size: 12px;
}

.reward-cost {
  color: var(--primary);
  font-weight: 700;
  font-size: 13px;
  margin-top: 4px;
}

.btn-redeem {
  margin-top: 8px;
  background: var(--primary);
  border: none;
  border-radius: 8px;
  padding: 6px;
  color: #fff;
  font-weight: 600;
  font-size: 13px;
}

.btn-redeem:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-redeem.selected {
  background: #10b981;
  color: #fff;
}
</style>

<template>
  <div class="checkout-page">

    <div v-if="paid" class="success-view">
      <div class="success-card">
        <div class="success-icon"><i class="bi bi-check-lg"></i></div>
        <h3>Order Placed!</h3>
        <p class="tx-id">Transaction: {{ transactionId }}</p>

        <template v-if="splitSummary.length > 1">
          <p class="amount">{{ formatAmount(yourShareAmount) }}</p>
          <p class="amount-label">Your share of the {{ formatAmount(paidAmount) }} total</p>
          <div class="split-summary">
            <p class="split-summary-title"><i class="bi bi-people-fill me-1"></i>Split {{ splitSummary.length }} ways</p>
            <div v-for="(s, i) in splitSummary" :key="i" :class="['split-summary-row', i === 0 ? 'you' : '']">
              <span>{{ s.payer || `Guest ${i + 1}` }}</span>
              <span>{{ formatAmount(s.amount) }}</span>
            </div>
          </div>
        </template>
        <p v-else class="amount">{{ formatAmount(paidAmount) }}</p>

        <p class="success-msg">
          <template v-if="paymentTiming === 'post' && splitSummary.length > 1">Your order was sent to the kitchen. A waiter or cashier will collect each person's share after you eat.</template>
          <template v-else-if="paymentTiming === 'post'">Your order was sent to the kitchen. A waiter will collect payment after you eat.</template>
          <template v-else-if="splitSummary.length > 1 && splitHasPending">Your share was recorded and the remaining guest payments will be collected after eating.</template>
          <template v-else-if="splitSummary.length > 1">Each share was recorded and your order is being prepared.</template>
          <template v-else>Your payment was approved and your order is being prepared.</template>
        </p>
        <p v-if="loyaltyPointsRedeemed > 0" class="loyalty-applied-note">
          <i class="bi bi-gem me-1"></i>{{ loyaltyPointsRedeemed }} loyalty points redeemed for {{ formatAmount(loyaltyPointsRedeemed / POINTS_PER_DOLLAR) }} off
        </p>

        <button class="btn-track" @click="router.push(`/customer/order/${orderId}`)">
          Track Your Order
        </button>
      </div>
    </div>

    <template v-else>
      <div class="checkout-header">
        <button class="back-btn" @click="router.back()">Back</button>
        <h4>Checkout</h4>
        <div style="width:60px"></div>
      </div>

      <div v-if="cart.billType === 'shared'" class="bill-type-banner shared">
        <i class="bi bi-people-fill me-2"></i>
        You're sharing Table {{ cart.tableNumber ? '#' + cart.tableNumber : '' }} - use Split the Bill below to divide this total with friends
      </div>
      <div v-else class="bill-type-banner separate">
        <i class="bi bi-person-fill me-2"></i>
        This is your personal bill - only the items you ordered are included
      </div>

      <div class="checkout-body">

        <div class="section-card">
          <h5>Order Summary</h5>
          <div v-for="item in cart.items" :key="item.key" class="order-item">
            <div class="item-info">
              <span class="item-emoji">{{ getFoodEmoji(item) }}</span>
              <span class="item-name">
                {{ item.name }}
                <small v-if="item.is_reward" class="item-modifiers-inline reward-inline"><i class="bi bi-gift"></i> Loyalty Reward</small>
                <small v-else-if="item.modifiers?.length" class="item-modifiers-inline">{{ item.modifiers.map(m => m.name).join(', ') }}</small>
              </span>
              <span class="item-qty">x{{ item.qty }}</span>
            </div>
            <span v-if="item.is_reward" class="item-price reward-free">FREE</span>
            <span v-else class="item-price">{{ formatAmount(cart.unitPrice(item) * item.qty) }}</span>
          </div>
          <template v-for="item in cart.items" :key="'note-'+item.key">
            <div v-if="item.notes" class="item-note">
              <small><i class="bi bi-chat-left-text"></i> {{ item.name }}: {{ item.notes }}</small>
            </div>
          </template>

          <div v-if="cart.promoCode" class="promo-row">
            <span><i class="bi bi-ticket-perforated"></i> Promo: {{ cart.promoCode }}</span>
            <span class="promo-discount">-{{ formatAmount(cart.promoDiscount) }}</span>
          </div>

          <div v-if="appliedPoints > 0" class="promo-row">
            <span><i class="bi bi-gem"></i> Loyalty: {{ appliedPoints }} pts</span>
            <span class="promo-discount">-{{ formatAmount(loyaltyDiscount) }}</span>
          </div>

          <div class="total-row">
            <span>Total</span>
            <span class="total-amount">{{ formatAmount(finalTotal) }}</span>
          </div>
        </div>

        <div v-if="auth.isLoggedIn && loyaltyBalance > 0" class="section-card loyalty-card">
          <h5><i class="bi bi-gem me-2"></i>Loyalty Points</h5>
          <p class="loyalty-balance">
            You have <strong>{{ loyaltyBalance }}</strong> points
            <span class="loyalty-balance-value">(worth {{ formatAmount(loyaltyBalance / POINTS_PER_DOLLAR) }})</span>
          </p>
          <p v-if="reservedRewardPoints > 0" class="loyalty-reserved-note">
            {{ reservedRewardPoints }} pts are reserved for your free reward item, leaving {{ maxRedeemablePoints }} pts available for a discount.
          </p>
          <div class="loyalty-redeem">
            <button class="loyalty-step-btn" @click="adjustPoints(-10)" :disabled="appliedPoints <= 0">−</button>
            <div class="loyalty-redeem-value">
              <span class="loyalty-points-val">{{ appliedPoints }} pts</span>
              <span class="loyalty-discount-val">-{{ formatAmount(loyaltyDiscount) }}</span>
            </div>
            <button class="loyalty-step-btn" @click="adjustPoints(10)" :disabled="appliedPoints >= maxRedeemablePoints">+</button>
            <button class="loyalty-max-btn" @click="setPointsToRedeem(maxRedeemablePoints)" :disabled="appliedPoints >= maxRedeemablePoints">Max</button>
          </div>
        </div>

        <div class="section-card">
          <h5>Order Notes</h5>
          <textarea v-model="notes" class="notes-input" placeholder="Special requests (optional)"></textarea>
        </div>

        <div class="section-card">
          <h5>Payment Method</h5>
          <div class="method-grid">
            <div :class="['method-card', method === 'card' ? 'active' : '']" @click="selectMethod('card')">
              <i class="bi bi-credit-card method-icon"></i>
              <span>Card</span>
            </div>
            <div :class="['method-card', method === 'cash' ? 'active' : '']" @click="selectMethod('cash')">
              <i class="bi bi-cash-stack method-icon"></i>
              <span>Cash</span>
            </div>
            <div :class="['method-card', method === 'mobile' ? 'active' : '']" @click="selectMethod('mobile')">
              <i class="bi bi-phone method-icon"></i>
              <span>Mobile</span>
            </div>
          </div>
        </div>

        <div class="section-card">
          <h5>When to Pay?</h5>
          <p class="payment-timing-desc">
            <template v-if="paymentTiming === 'pre'">Pay now and your order is sent straight to the kitchen.</template>
            <template v-else>We'll send your order to the kitchen now - settle the bill with your waiter or cashier after you eat.</template>
          </p>
          <div class="payment-timing-grid">
            <div :class="['timing-card', paymentTiming === 'pre' ? 'active' : '', method === 'cash' ? 'disabled' : '']" @click="setPaymentTiming('pre')">
              <i class="bi bi-credit-card timing-icon"></i>
              <span>Pay Now</span>
              <small>Prepay online</small>
            </div>
            <div :class="['timing-card', paymentTiming === 'post' ? 'active' : '']" @click="setPaymentTiming('post')">
              <i class="bi bi-wallet2 timing-icon"></i>
              <span>Pay Later</span>
              <small>Settle after eating</small>
            </div>
          </div>
        </div>

        
        <div v-if="paymentTiming === 'pre'" class="section-card">
          <h5>Add a Tip?</h5>
          <p class="tip-desc">Show your appreciation to our staff</p>
          <div class="tip-options">
            <button 
              v-for="tipPercent in tipOptions" 
              :key="tipPercent"
              :class="['tip-btn', tipAmount === (preTipTotal * tipPercent / 100) ? 'active' : '']"
              @click="tipAmount = preTipTotal * tipPercent / 100"
            >
              {{ tipPercent }}% <span class="tip-value">{{ formatAmount(preTipTotal * tipPercent / 100) }}</span>
            </button>
            <button 
              :class="['tip-btn', showCustomTip ? 'active' : '']"
              @click="showCustomTip = !showCustomTip"
            >
              Custom
            </button>
          </div>
          <div v-if="showCustomTip" class="custom-tip-input">
            <input 
              v-model.number="customTipAmount" 
              type="number" 
              placeholder="Enter tip amount" 
              min="0"
              @input="tipAmount = customTipAmount"
            />
          </div>
        </div>

        <div class="section-card split-card">
          <h5><i class="bi bi-people me-2"></i>Split the Bill</h5>
          <p class="split-desc">Eating with friends at the table? Divide this order's total into equal shares - everyone pays their part{{ paymentTiming === 'post' ? ' after eating' : '' }}.</p>

          <div class="split-toggle">
            <div :class="['split-opt', splitType === 'none' ? 'active' : '']" @click="setSplitType('none')">
              <i class="bi bi-person-fill"></i>
              <span>Pay Full</span>
              <small>I've got the whole bill</small>
            </div>
            <div :class="['split-opt', splitType === 'equal' ? 'active' : '']" @click="setSplitType('equal')">
              <i class="bi bi-people-fill"></i>
              <span>Split with Friends</span>
              <small>Divide equally</small>
            </div>
          </div>

          <div v-if="splitType === 'equal'" class="split-people-picker">
            <label>How many people are sharing this bill (including you)?</label>
            <div class="people-counter">
              <button class="count-btn" @click="decreaseSplitCount" :disabled="splitCount <= 2">-</button>
              <span class="count-val">{{ splitCount }}</span>
              <button class="count-btn" @click="increaseSplitCount" :disabled="splitCount >= maxSplit">+</button>
            </div>

            <div class="split-people-list">
              <div v-for="(share, i) in splitShares" :key="i" class="split-person-row">
                <template v-if="i === 0">
                  <span class="split-name-you"><i class="bi bi-person-check-fill me-1"></i>You</span>
                </template>
                <input
                  v-else
                  v-model="splitNames[i]"
                  class="split-name-input"
                  :placeholder="`Guest ${i + 1} name`"
                  maxlength="20"
                />
                <select v-model="splitMethods[i]" class="split-method-select">
                  <option value="card">Card</option>
                  <option value="cash">Cash after eating</option>
                  <option value="mobile">Mobile</option>
                </select>
                <span class="split-person-amount">{{ formatAmount(share.amount) }}</span>
              </div>
            </div>

            <div class="split-result">
              <div class="split-result-row">
                <span>Bill Total</span>
                <span>{{ formatAmount(finalTotal) }}</span>
              </div>
              <div class="split-result-row split-per">
                <span>Your share</span>
                <span class="per-amount">{{ formatAmount(yourShare) }}</span>
              </div>
            </div>
          </div>
        </div>

        <button class="btn-pay" @click="placeOrder" :disabled="submitting || cart.isEmpty">
          {{ payButtonText }}
        </button>

        <p v-if="error" class="error-msg">{{ error }}</p>

      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api'
import { useCartStore } from '../../store/cart'
import { useAuthStore } from '../../store/auth'
import { getFoodEmoji } from '../../utils/foodEmoji'
import { formatMoney, getCurrency } from '../../utils/currency'

const POINTS_PER_DOLLAR = 10

const router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()

const notes = ref('')
const method = ref('card')
const submitting = ref(false)
const error = ref(null)
const splitType = ref('none')
const splitCount = ref(2)
const splitNames = ref([])
const splitMethods = ref(['card', 'cash'])
const maxSplit = 10
const paymentTiming = ref('pre')
const tipAmount = ref(0)
const tipOptions = [15, 18, 20]
const customTipAmount = ref(0)
const showCustomTip = ref(false)

const paid = ref(false)
const orderId = ref(null)
const paidAmount = ref('0.00')
const yourShareAmount = ref('0.00')
const transactionId = ref('')
const splitSummary = ref([])

const loyaltyBalance = ref(0)
const pointsToRedeem = ref(0)
const loyaltyPointsRedeemed = ref(0)
const currency = ref(getCurrency())

const onCurrencyChanged = (event) => {
  currency.value = event.detail || getCurrency()
}

const formatAmount = (amount) => formatMoney(amount, currency.value)

const fetchLoyaltyBalance = async () => {
  if (!auth.isLoggedIn) return
  try {
    const res = await api.get('/loyalty/balance', { params: { user_id: auth.user.id } })
    loyaltyBalance.value = res.data.data.balance || 0
  } catch (err) {
    loyaltyBalance.value = 0
  }
}

onMounted(() => {
  fetchLoyaltyBalance()
  window.addEventListener('currency-changed', onCurrencyChanged)
})

onUnmounted(() => {
  window.removeEventListener('currency-changed', onCurrencyChanged)
})

const subtotalAfterPromo = computed(() => {
  const subtotal = cart.total - (cart.promoDiscount || 0)
  return subtotal > 0 ? subtotal : 0
})

const reservedRewardPoints = computed(() => {
  const reward = cart.items.find(i => i.is_reward)
  return Number(reward?.points_cost || 0)
})

const maxRedeemablePoints = computed(() => {
  const availableBalance = Math.max(0, loyaltyBalance.value - reservedRewardPoints.value)
  return Math.max(0, Math.min(availableBalance, Math.floor(subtotalAfterPromo.value * POINTS_PER_DOLLAR)))
})

const appliedPoints = computed(() => Math.min(pointsToRedeem.value, maxRedeemablePoints.value))

const loyaltyDiscount = computed(() => appliedPoints.value / POINTS_PER_DOLLAR)

const setPointsToRedeem = (points) => {
  pointsToRedeem.value = Math.max(0, Math.min(points, maxRedeemablePoints.value))
}

const adjustPoints = (delta) => {
  setPointsToRedeem(pointsToRedeem.value + delta)
}

const preTipTotal = computed(() => {
  const subtotal = subtotalAfterPromo.value - loyaltyDiscount.value
  return subtotal > 0 ? subtotal : 0
})

const finalTotal = computed(() => {
  const tipToAdd = paymentTiming.value === 'pre' ? Number(tipAmount.value || 0) : 0
  return preTipTotal.value + tipToAdd
})

const isSplitting = computed(() => splitType.value === 'equal' && splitCount.value > 1)
const splitShares = computed(() => {
  const count = Math.max(2, splitCount.value)
  const baseTotal = preTipTotal.value
  const tip = paymentTiming.value === 'pre' ? Number(tipAmount.value || 0) : 0

  const baseShare = Math.floor((baseTotal / count) * 100) / 100
  const baseRemainder = Math.round((baseTotal - baseShare * count) * 100) / 100
  const tipShare = Math.floor((tip / count) * 100) / 100
  const tipRemainder = Math.round((tip - tipShare * count) * 100) / 100

  return Array.from({ length: count }, (_, i) => {
    const isLast = i === count - 1
    const base = isLast ? baseShare + baseRemainder : baseShare
    const tipPart = isLast ? tipShare + tipRemainder : tipShare
    return {
      name: i === 0 ? (auth.user?.name || 'You') : (splitNames.value[i]?.trim() || `Guest ${i + 1}`),
      amount: Math.round((base + tipPart) * 100) / 100,
      tip: Math.round(tipPart * 100) / 100,
      method: splitMethods.value[i] || (i === 0 ? method.value : 'cash')
    }
  })
})

const yourShare = computed(() => splitShares.value[0]?.amount || 0)
const splitHasPending = computed(() => splitSummary.value.some(s => s.status === 'pending'))

const payButtonText = computed(() => {
  if (submitting.value) return 'Processing...'
  if (paymentTiming.value === 'post') {
    return isSplitting.value ? 'Send Order - Each Pays Their Share Later' : 'Send Order - Pay After Eating'
  }
  return isSplitting.value
    ? `Pay Your Share - ${formatAmount(yourShare.value)} Now`
    : `Pay ${formatAmount(finalTotal.value)} Now`
})

const setSplitType = (type) => {
  splitType.value = type
  if (type === 'none') splitCount.value = 2
}

const increaseSplitCount = () => {
  if (splitCount.value < maxSplit) {
    splitCount.value++
    splitMethods.value[splitCount.value - 1] = 'cash'
  }
}

const decreaseSplitCount = () => {
  if (splitCount.value > 2) splitCount.value--
}

const selectMethod = (value) => {
  method.value = value
  splitMethods.value[0] = value
  if (value === 'cash') {
    paymentTiming.value = 'post'
    tipAmount.value = 0
  }
}

const setPaymentTiming = (value) => {
  if (value === 'pre' && method.value === 'cash') return
  paymentTiming.value = value
  if (value === 'post') {
    tipAmount.value = 0
  }
}

const placeOrder = async () => {
  if (cart.isEmpty) return
  submitting.value = true
  error.value = null

  try {
    if (!cart.tableId) {
      error.value = 'Table not found. Please scan the QR code again.'
      submitting.value = false
      return
    }
    const hasPhysicalSplit = isSplitting.value && splitShares.value.some(share => paymentTiming.value === 'post' || share.method === 'cash')
    const paymentTypeEnum = paymentTiming.value === 'post' || hasPhysicalSplit ? 'physical' : 'online'
    
    const rewardItem = cart.items.find(i => i.is_reward)

    const orderRes = await api.post('/orders', {
      table_id: cart.tableId,
      items: cart.items.filter(i => !i.is_reward).map(i => ({
        menu_item_id: i.id,
        quantity: i.qty,
        unit_price: i.price,
        notes: i.notes || null,
        modifiers: (i.modifiers || []).map(m => m.id)
      })),
      notes: notes.value || null,
      promo_code: cart.promoCode || undefined,
      payment_type: paymentTypeEnum,
      loyalty_points_redeemed: appliedPoints.value > 0 ? appliedPoints.value : undefined,
      redeemed_reward_id: rewardItem ? rewardItem.reward_id : undefined
    })

    orderId.value = orderRes.data.data.order_id
    loyaltyPointsRedeemed.value = Number(orderRes.data.data.loyalty_points_used || 0) + Number(orderRes.data.data.redeemed_reward?.points_cost || 0)
    const backendTotal = Number(orderRes.data.data.total || 0)
    const isFreeOrder = backendTotal <= 0
    paidAmount.value = isFreeOrder ? '0.00' : finalTotal.value.toFixed(2)
    yourShareAmount.value = isFreeOrder ? '0.00' : (isSplitting.value ? yourShare.value : finalTotal.value).toFixed(2)
    cart.setLastOrderId(orderId.value)

    if (isFreeOrder) {
      await api.post('/payments', {
        order_id: orderId.value,
        method: 'card',
        payment_timing: 'pre',
        status: 'paid',
        payer_name: auth.user?.name || 'Loyalty points'
      })
      transactionId.value = 'LOYALTY'
      splitSummary.value = []
    } else if (isSplitting.value) {
      const splits = splitShares.value.map(share => ({
        amount: share.amount,
        method: share.method,
        payer_name: share.name,
        payment_timing: paymentTiming.value === 'post' || share.method === 'cash' ? 'post' : 'pre',
        tip: share.tip
      }))
      const payRes = await api.post('/payments/split', {
        order_id: orderId.value,
        splits
      })
      transactionId.value = payRes.data.data.transactions[0]?.transaction_id || 'SPLIT'
      splitSummary.value = payRes.data.data.transactions
    } else {
      const payRes = await api.post('/payments', {
        order_id: orderId.value,
        method: method.value,
        payment_timing: paymentTiming.value,
        status: paymentTiming.value === 'post' ? 'pending' : 'paid',
        tip: paymentTiming.value === 'pre' ? tipAmount.value : 0,
        payer_name: auth.user?.name || 'Guest'
      })
      transactionId.value = payRes.data.data.transaction_id
      splitSummary.value = []
    }

    if (paymentTiming.value === 'post') {
      try {
        await api.post('/payments/notify-cash', {
          order_id: orderId.value,
          table_id: cart.tableId,
          method: method.value
        })
      } catch (e) {}
    }

    cart.setPromo('', 0)
    cart.clearCart()
    await fetchLoyaltyBalance()
    window.dispatchEvent(new CustomEvent('loyalty-updated'))
    paid.value = true
  } catch (err) {
    error.value = err.response?.data?.message || 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.checkout-page {
  background:
    linear-gradient(180deg, var(--primary-light), transparent 280px),
    var(--dark);
  min-height: 100vh;
  color: var(--text-primary);
}


.checkout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  background: var(--dark-card);
  border-bottom: 1px solid var(--dark-border);
  backdrop-filter: blur(10px);
}

.checkout-header h4 {
  margin: 0;
}

.back-btn {
  background: var(--dark-hover);
  border: 1px solid var(--dark-border);
  padding: 6px 14px;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
}

.back-btn:hover {
  border-color: var(--primary);
  color: var(--text-primary);
}


.bill-type-banner {
  max-width: 500px;
  margin: 0 auto;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
}
.bill-type-banner.shared   { color: var(--primary); background: var(--primary-light); }
.bill-type-banner.separate { color: var(--success); background: var(--success-light); }


.checkout-body {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px 16px 100px;
}


.section-card {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
  animation: checkout-card-in 0.4s ease both;
}

.checkout-body .section-card:nth-child(1) { animation-delay: 0.02s; }
.checkout-body .section-card:nth-child(2) { animation-delay: 0.06s; }
.checkout-body .section-card:nth-child(3) { animation-delay: 0.1s; }
.checkout-body .section-card:nth-child(4) { animation-delay: 0.14s; }
.checkout-body .section-card:nth-child(5) { animation-delay: 0.18s; }
.checkout-body .section-card:nth-child(6) { animation-delay: 0.22s; }

@keyframes checkout-card-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.section-card h5 {
  font-size: 15px;
  margin-bottom: 14px;
  color: var(--text-secondary);
  font-weight: 600;
}


.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--dark-border);
}

.order-item:last-of-type {
  border-bottom: none;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-emoji {
  font-size: 18px;
  line-height: 1;
}

.item-name {
  font-size: 14px;
  display: flex;
  flex-direction: column;
}

.item-modifiers-inline {
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 400;
}

.item-qty {
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
}

.item-price {
  font-weight: 600;
  font-size: 14px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--dark-border);
  font-size: 18px;
  font-weight: 700;
}

.total-amount {
  color: var(--amount-color);
}


.notes-input {
  width: 100%;
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  color: var(--text-primary);
  padding: 12px;
  font-size: 14px;
  resize: vertical;
  min-height: 60px;
}

.notes-input:focus {
  outline: none;
  border-color: var(--primary);
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
  font-size: 13px;
  font-weight: 500;
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


.payment-timing-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 12px;
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
  font-size: 13px;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.timing-card:hover {
  background: var(--dark-hover);
}

.timing-card.active {
  background: var(--secondary);
  border-color: var(--secondary);
}

.timing-card.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.timing-icon {
  display: block;
  font-size: 20px;
  margin-bottom: 4px;
  color: inherit;
}

.timing-card span {
  font-size: 13px;
  font-weight: 700;
}

.timing-card small {
  font-size: 11px;
  opacity: 0.8;
}


.tip-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.tip-options {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.tip-btn {
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  padding: 10px 8px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.tip-btn:hover {
  background: var(--dark-hover);
  border-color: var(--primary);
}

.tip-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.tip-value {
  font-size: 11px;
  color: #10b981;
}

.tip-btn.active .tip-value {
  color: #fef5e7;
}

.custom-tip-input {
  margin-top: 8px;
}

.custom-tip-input input {
  width: 100%;
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  color: var(--text-primary);
  padding: 10px;
  font-size: 14px;
}

.custom-tip-input input:focus {
  outline: none;
  border-color: var(--primary);
}


.btn-pay {
  width: 100%;
  padding: 16px;
  background: var(--primary);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.3s;
  margin-top: 8px;
}

.btn-pay:hover {
  background: var(--primary-hover);
}

.btn-pay:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-msg {
  text-align: center;
  color: var(--danger);
  margin-top: 12px;
  font-size: 14px;
}


.success-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.success-card {
  text-align: center;
  max-width: 400px;
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

.success-card h3 {
  margin-bottom: 8px;
}

.tx-id {
  color: var(--text-muted);
  font-size: 13px;
}

.amount {
  font-size: 32px;
  font-weight: 700;
  color: var(--amount-color);
  margin: 8px 0;
}

.amount-label {
  color: var(--text-muted);
  font-size: 13px;
  margin: -4px 0 8px;
}

.split-summary {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 14px;
  padding: 14px 16px;
  margin: 8px 0 20px;
  text-align: left;
}

.split-summary-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.split-summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding: 4px 0;
  color: var(--text-secondary);
}

.split-summary-row.you {
  color: var(--text-primary);
  font-weight: 700;
}

.success-msg {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 25px;
}

.loyalty-applied-note {
  display: inline-flex;
  align-items: center;
  background: var(--primary-light);
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 20px;
  margin: -10px 0 20px;
}

.btn-track {
  padding: 14px 35px;
  background: var(--primary);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
}

.btn-track:hover {
  background: var(--primary-hover);
}


.item-note {
  padding: 2px 0;
  color: var(--text-muted);
  font-size: 12px;
}

.item-note i {
  margin-right: 4px;
}


.promo-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  color: var(--amount-color);
  font-size: 14px;
}

.promo-discount {
  font-weight: 600;
}


.loyalty-card h5 {
  display: flex;
  align-items: center;
}

.loyalty-balance {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 14px;
}

.loyalty-balance-value {
  color: var(--text-muted);
}

.loyalty-reserved-note {
  font-size: 12px;
  color: var(--text-muted);
  margin: -8px 0 14px;
}

.loyalty-redeem {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loyalty-step-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--dark-border);
  background: var(--dark-surface);
  color: var(--text-primary);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loyalty-step-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.loyalty-step-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.loyalty-redeem-value {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
}

.loyalty-points-val {
  font-size: 15px;
  font-weight: 700;
}

.loyalty-discount-val {
  font-size: 13px;
  color: var(--amount-color);
  font-weight: 600;
}

.loyalty-max-btn {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--dark-border);
  background: var(--dark-surface);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.loyalty-max-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.loyalty-max-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}


.split-card h5 {
  display: flex;
  align-items: center;
}

.split-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0 0 16px;
}

.split-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}

.split-opt {
  border: 1px solid var(--dark-border);
  border-radius: 14px;
  padding: 14px 10px;
  text-align: center;
  cursor: pointer;
  transition: 0.2s;
  background: var(--dark-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.split-opt i {
  font-size: 22px;
  color: var(--primary);
  margin-bottom: 2px;
}

.split-opt span {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.count-btn:hover {
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
  margin-bottom: 14px;
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

.split-name-you {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary);
  display: flex;
  align-items: center;
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

.split-result {
  background: var(--dark-surface);
  border-radius: 12px;
  padding: 14px;
}

.split-result-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding: 4px 0;
  color: var(--text-secondary);
}

.split-result-row.split-per {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--dark-border);
  color: var(--text-primary);
  font-weight: 600;
}

.per-amount {
  color: var(--amount-color);
  font-size: 18px;
  font-weight: 800;
}
</style>

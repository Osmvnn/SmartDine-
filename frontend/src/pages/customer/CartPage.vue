<template>
  <div class="cart-page">

    <div class="cart-header d-flex justify-content-between align-items-center px-4">
      <h4>Your Cart</h4>
      <button class="back-btn" @click="goBack">Back</button>
    </div>

    <div class="container mt-4">
      <div class="row">

        <div class="col-lg-8">

          <div v-if="cart.items.length === 0" class="empty">
            <div class="empty-icon anim-float"><i class="bi bi-bag"></i></div>
            <h5>Your cart is empty</h5>
            <p>Browse the menu and add some items</p>
            <button class="btn-browse" @click="goToMenu">Browse Menu</button>
          </div>

          <TransitionGroup name="cart-item" tag="div">
            <div
              v-for="item in cart.items"
              :key="item.key"
              class="cart-item"
            >
            <img v-if="hasRealPhoto(item)" :src="getImageUrl(item.image_url)" :alt="item.name" class="cart-item-img" />
            <div v-else class="cart-item-emoji">{{ getFoodEmoji(item) }}</div>
            <div class="cart-item-info">
              <h5>{{ item.name }}</h5>
              <p v-if="item.is_reward" class="cart-item-free"><i class="bi bi-gift"></i> FREE - {{ item.reward_name }}</p>
              <p v-else>{{ formatAmount(cart.unitPrice(item)) }}</p>
              <p v-if="item.modifiers?.length" class="cart-item-modifiers">
                {{ item.modifiers.map(m => m.name).join(', ') }}
              </p>
              <input
                v-if="!item.is_reward"
                type="text"
                class="note-input"
                placeholder="Add a note (e.g. no onions)"
                :value="item.notes"
                @input="cart.updateNote(item.key, $event.target.value)"
              />
            </div>

            <div v-if="!item.is_reward" class="controls">
              <button @click="decrease(item)">-</button>
              <span>{{ item.qty }}</span>
              <button @click="increase(item)">+</button>
            </div>

            <button class="remove" @click="remove(item)">
              x
            </button>
          </div>
          </TransitionGroup>

        </div>

        <div class="col-lg-4">
          <div class="summary">

            <div class="promo-section">
              <h6>Promo Code</h6>
              <div class="promo-input-wrap">
                <input
                  v-model="promoCode"
                  type="text"
                  class="promo-input"
                  placeholder="Enter code"
                  :disabled="promoApplied"
                />
                <button
                  v-if="!promoApplied"
                  class="promo-btn"
                  @click="applyPromo"
                  :disabled="!promoCode || promoLoading"
                >
                  {{ promoLoading ? '...' : 'Apply' }}
                </button>
                <button v-else class="promo-btn remove-promo" @click="removePromo">Remove</button>
              </div>
              <p v-if="promoError" class="promo-error">{{ promoError }}</p>
              <p v-if="promoApplied" class="promo-success">
                <i class="bi bi-check-circle"></i> Discount: -{{ formatAmount(discount) }}
              </p>
            </div>

            <h5>Total</h5>
            <h3 v-if="discount > 0">
              <span class="original-total">{{ formatAmount(total) }}</span>
              {{ formatAmount(total - discount) }}
            </h3>
            <h3 v-else>{{ formatAmount(total) }}</h3>

            <button class="checkout-btn" @click="checkout" :disabled="cart.isEmpty">
              Proceed to Checkout
            </button>

          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../../store/cart'
import { getFoodEmoji } from '../../utils/foodEmoji'
import api from '../../services/api'
import { formatMoney, getCurrency } from '../../utils/currency'

const router = useRouter()
const cart = useCartStore()
const currency = ref(getCurrency())

const onCurrencyChanged = (event) => {
  currency.value = event.detail || getCurrency()
}

const formatAmount = (amount) => formatMoney(amount, currency.value)

onMounted(() => {
  window.addEventListener('currency-changed', onCurrencyChanged)
})

onUnmounted(() => {
  window.removeEventListener('currency-changed', onCurrencyChanged)
})

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/images/')) return url
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
  return base + url
}
const hasRealPhoto = (item) => {
  const url = item.image_url
  return !!url && !/^\/images\/[^/]+\.svg$/.test(url)
}

const goToMenu = () => {
  const token = cart.qrToken || 'table_1'
  router.push(`/customer/menu/${token}`)
}

const increase = (item) => cart.increase(item.key)
const decrease = (item) => cart.decrease(item.key)
const remove = (item) => cart.removeItem(item.key)

const total = computed(() => cart.total)

const promoCode = ref(cart.promoCode || '')
const promoLoading = ref(false)
const promoError = ref('')
const promoApplied = ref(!!cart.promoCode)
const discount = ref(cart.promoDiscount || 0)

const applyPromo = async () => {
  promoLoading.value = true
  promoError.value = ''
  try {
    const res = await api.post('/promos/validate', {
      code: promoCode.value,
      order_total: total.value
    })
    discount.value = res.data.data.discount
    promoApplied.value = true
    cart.setPromo(promoCode.value, discount.value)
  } catch (err) {
    promoError.value = err.response?.data?.message || 'Invalid promo code'
  } finally {
    promoLoading.value = false
  }
}

const removePromo = () => {
  promoCode.value = ''
  promoApplied.value = false
  discount.value = 0
  promoError.value = ''
  cart.setPromo('', 0)
}

const goBack = () => {
  router.back()
}

const checkout = () => {
  router.push('/customer/checkout')
}
</script>

<style scoped>

.cart-page {
  background: var(--dark);
  min-height: 100vh;
  color: var(--text-primary);
}


.cart-header {
  padding: 20px;
  background: var(--dark-card);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--dark-border);
}

.back-btn {
  background: transparent;
  border: 1px solid var(--primary);
  padding: 6px 12px;
  border-radius: 8px;
  color: var(--text-primary);
}


.cart-item {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  padding: 14px;
  border-radius: 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: border-color 0.2s, transform 0.2s;
}

.cart-item:hover {
  border-color: var(--primary);
}

.cart-item-img {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}

.cart-item-emoji {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
}

.cart-item-info {
  flex: 1;
  min-width: 0;
}

.cart-item-info h5 {
  margin-bottom: 2px;
  font-size: 15px;
}

.cart-item-info p {
  margin: 0;
  color: var(--amount-color);
  font-weight: 600;
}

.cart-item-modifiers {
  color: var(--text-muted) !important;
  font-size: 12px;
  font-weight: 400 !important;
  margin-top: 2px !important;
}

.cart-item-free {
  color: var(--success) !important;
  font-weight: 700 !important;
}


.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.controls button {
  background: var(--primary);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.1s;
}

.controls button:active {
  transform: scale(0.92);
}

.controls button:hover {
  background: var(--primary-hover);
}

.controls span {
  min-width: 20px;
  text-align: center;
  font-weight: 700;
}


.remove {
  background: transparent;
  border: none;
  color: var(--danger);
  font-size: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background 0.15s;
}

.remove:hover {
  background: rgba(239, 68, 68, 0.12);
}


.summary {
  background: var(--dark-card);
  padding: 20px;
  border-radius: 15px;
  position: sticky;
  top: 20px;
}

.checkout-btn {
  margin-top: 15px;
  width: 100%;
  background: var(--secondary);
  border: none;
  padding: 12px;
  border-radius: 10px;
  color: white;
}


.empty {
  text-align: center;
  margin-top: 50px;
  color: var(--text-secondary);
}

.empty-icon {
  width: 64px;
  height: 64px;
  background: var(--dark-card);
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.empty-icon i {
  font-size: 28px;
  color: var(--text-muted);
}

.empty h5 {
  color: var(--text-primary);
  margin-bottom: 5px;
}

.btn-browse {
  margin-top: 15px;
  background: var(--primary);
  border: none;
  padding: 10px 25px;
  border-radius: 10px;
  color: white;
  cursor: pointer;
}

.checkout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}


.note-input {
  width: 100%;
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  border-radius: 6px;
  color: var(--text-secondary);
  padding: 6px 10px;
  font-size: 12px;
  margin-top: 4px;
}

.note-input:focus {
  outline: none;
  border-color: var(--primary);
  color: var(--text-primary);
}


.promo-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--dark-border);
}

.promo-section h6 {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.promo-input-wrap {
  display: flex;
  gap: 8px;
}

.promo-input {
  flex: 1;
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  border-radius: 8px;
  color: var(--text-primary);
  padding: 8px 12px;
  font-size: 13px;
}

.promo-input:focus {
  outline: none;
  border-color: var(--primary);
}

.promo-btn {
  background: var(--primary);
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  cursor: pointer;
}

.promo-btn:disabled {
  opacity: 0.5;
}

.remove-promo {
  background: var(--danger);
}

.promo-error {
  color: var(--danger);
  font-size: 12px;
  margin-top: 4px;
}

.promo-success {
  color: var(--success);
  font-size: 13px;
  margin-top: 4px;
}

.original-total {
  text-decoration: line-through;
  color: var(--text-muted);
  font-size: 16px;
  margin-right: 8px;
}

</style>

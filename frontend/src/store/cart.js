import { defineStore } from 'pinia'
import { watch } from 'vue'

const CART_STORAGE_KEY = 'smart_restaurant_cart'

function modifiersKey(modifiers) {
  return (modifiers || []).map(m => m.id).sort((a, b) => a - b).join(',')
}

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY)
    if (!saved) return null
    const parsed = JSON.parse(saved)
    if (parsed?.items) {
      parsed.items = parsed.items.map(item => ({
        ...item,
        modifiers: item.modifiers || [],
        key: item.key || `${item.id}::${modifiersKey(item.modifiers)}`
      }))
    }
    return parsed
  } catch { return null }
}

function saveCart(state) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
      items: state.items,
      tableId: state.tableId,
      qrToken: state.qrToken,
      tableNumber: state.tableNumber,
      promoCode: state.promoCode,
      promoDiscount: state.promoDiscount,
      billType: state.billType
    }))
  } catch {  }
}

const saved = loadCart()

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: saved?.items || [],
    tableId: saved?.tableId || null,
    qrToken: saved?.qrToken || null,
    tableNumber: saved?.tableNumber || null,
    lastOrderId: null,
    promoCode: saved?.promoCode || '',
    promoDiscount: saved?.promoDiscount || 0,
    billType: saved?.billType || 'separate'
  }),
  getters: {
    unitPrice: () => (item) => {
      const modTotal = (item.modifiers || []).reduce((sum, m) => sum + Number(m.price_delta || 0), 0)
      return Number(item.price) + modTotal
    },
    total: (state) => {
      return state.items.reduce((sum, item) => {
        const modTotal = (item.modifiers || []).reduce((s, m) => s + Number(m.price_delta || 0), 0)
        return sum + (Number(item.price) + modTotal) * item.qty
      }, 0)
    },
    itemCount: (state) => {
      return state.items.reduce((sum, item) => sum + item.qty, 0)
    },
    isEmpty: (state) => state.items.length === 0
  },
  actions: {
    addItem(item, modifiers = []) {
      const key = `${item.id}::${modifiersKey(modifiers)}`
      const existing = this.items.find(i => i.key === key)
      if (existing) {
        existing.qty++
      } else {
        this.items.push({
          id: item.id,
          key,
          name: item.name,
          price: Number(item.price),
          image_url: item.image_url || '',
          qty: 1,
          notes: '',
          modifiers: modifiers.map(m => ({ id: m.id, name: m.name, price_delta: Number(m.price_delta || 0) }))
        })
      }
      saveCart(this.$state)
    },
    addRewardItem(reward) {
      this.items = this.items.filter(i => !i.is_reward)
      this.items.push({
        id: reward.menu_item_id,
        key: `reward::${reward.id}`,
        name: reward.item_name,
        price: 0,
        image_url: reward.image_url || '',
        qty: 1,
        notes: '',
        modifiers: [],
        is_reward: true,
        reward_id: reward.id,
        reward_name: reward.name,
        points_cost: reward.points_cost
      })
      saveCart(this.$state)
    },
    removeItem(key) {
      this.items = this.items.filter(i => i.key !== key)
      saveCart(this.$state)
    },
    increase(key) {
      const item = this.items.find(i => i.key === key)
      if (item && !item.is_reward) { item.qty++; saveCart(this.$state) }
    },
    decrease(key) {
      const item = this.items.find(i => i.key === key)
      if (item && !item.is_reward && item.qty > 1) { item.qty--; saveCart(this.$state) }
    },
    updateNote(key, note) {
      const item = this.items.find(i => i.key === key)
      if (item) { item.notes = note; saveCart(this.$state) }
    },
    clearCart() {
      this.items = []
      this.promoCode = ''
      this.promoDiscount = 0
      try { localStorage.removeItem(CART_STORAGE_KEY) } catch {}
    },
    setLastOrderId(id) {
      this.lastOrderId = id
    },
    setTable(tableId, qrToken, tableNumber) {
      this.tableId = tableId
      this.qrToken = qrToken
      this.tableNumber = tableNumber
      saveCart(this.$state)
    },
    setBillType(type) {
      this.billType = type
      saveCart(this.$state)
    },
    setPromo(code, discount) {
      this.promoCode = code
      this.promoDiscount = discount
      saveCart(this.$state)
    }
  }
})

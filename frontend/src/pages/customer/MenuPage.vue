<template>
  <div class="menu-page">

    <div class="menu-header d-flex justify-content-between align-items-center px-4">
      <h5>Menu</h5>
      <button class="cart-btn" @click="goToCart">
        <span class="cart-count-badge" v-if="cart.itemCount > 0">{{ cart.itemCount }}</span>
        Cart
      </button>
    </div>

    <div class="search-bar-wrap px-4 pt-3">
      <div class="search-input-wrap">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Search items..."
          autocomplete="off"
        />
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">&times;</button>
      </div>
    </div>

    <div v-if="!loading && categories.length" class="category-tabs-wrap px-4 pt-3">
      <div class="category-tabs">
        <button
          :class="['cat-tab', !activeCategory ? 'active' : '']"
          @click="activeCategory = null"
        >All</button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          :class="['cat-tab', activeCategory === cat.id ? 'active' : '']"
          @click="activeCategory = cat.id"
        >{{ cat.name }}</button>
      </div>
    </div>

    <div v-if="!loading && categories.length" class="filter-chips-wrap px-4 pt-2">
      <div class="filter-chips">
        <button
          :class="['filter-chip', 'fav-chip', showFavoritesOnly ? 'active' : '']"
          @click="showFavoritesOnly = !showFavoritesOnly"
        >
          <i class="bi bi-heart-fill"></i> Favorites
        </button>
        <button
          v-for="tag in dietaryTagOptions"
          :key="tag.value"
          :class="['filter-chip', activeDietaryFilters.has(tag.value) ? 'active' : '']"
          @click="toggleDietaryFilter(tag.value)"
        >{{ tag.label }}</button>
      </div>
    </div>

    <div class="container mt-4">

      <div v-if="loading" class="row">
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4" v-for="n in 8" :key="n">
          <div class="menu-card-skeleton">
            <div class="skel-img"></div>
            <div class="skel-line skel-title"></div>
            <div class="skel-line skel-price"></div>
            <div class="skel-line skel-btn"></div>
          </div>
        </div>
      </div>

      <div v-else-if="error" class="text-center text-danger mt-4">
        {{ error }}
      </div>

      <div v-else-if="filteredCategories.length === 0 || allFilteredItems.length === 0" class="text-center mt-5" style="color: var(--text-muted)">
        <p v-if="searchQuery.trim()">No items match "{{ searchQuery }}"</p>
        <p v-else>No items match the selected filters</p>
        <button class="btn-secondary-custom mt-2" @click="clearFilters">Clear Filters</button>
      </div>

      <div v-else>
        <div v-for="cat in filteredCategories" :key="cat.id" class="mb-5">
          <h4 class="mb-3 category-title">
            {{ cat.name }}
            <span class="cat-count">({{ getFilteredItems(cat).length }})</span>
          </h4>

          <TransitionGroup name="menu-item" tag="div" class="row">
            <div
              class="col-lg-3 col-md-4 col-sm-6 mb-4"
              v-for="(item, idx) in getFilteredItems(cat)"
              :key="item.id"
              :style="{ transitionDelay: `${idx * 40}ms` }"
            >
              <div class="menu-card" :class="{ 'out-of-stock-card': isOutOfStock(item) }">

                <div class="img-wrap">
                  <img v-if="hasRealPhoto(item)" :src="getImageUrl(item.image_url)" :alt="item.name" class="menu-img" />
                  <div v-else class="menu-emoji-card">
                    <span class="menu-emoji anim-float" :style="{ animationDelay: `${(idx % 5) * 0.3}s` }">{{ getFoodEmoji(item) }}</span>
                  </div>
                  <span v-if="isOutOfStock(item)" class="stock-badge out">Out of Stock</span>
                  <span v-else-if="isLowStock(item)" class="stock-badge low">Low Stock</span>
                </div>

                <h5>{{ item.name }}</h5>
                <div v-if="getDietaryTags(item).length" class="dietary-badges">
                  <span v-for="tag in getDietaryTags(item)" :key="tag" class="dietary-badge">
                    {{ tagLabel(tag) }}
                  </span>
                </div>
                <p class="item-desc" v-if="item.description">{{ item.description }}</p>
                <p class="item-price">{{ formatAmount(item.price) }}</p>

                <div class="item-actions">
                  <button class="btn-fav" @click.stop="toggleFav(item)" :title="isFav(item.id) ? 'Remove favorite' : 'Add favorite'">
                    <i :class="isFav(item.id) ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
                  </button>
                  <button
                    class="btn-add"
                    :class="['btn-add', addedId === item.id ? 'btn-added' : '', isOutOfStock(item) ? 'btn-disabled' : '']"
                    @click="addToCart(item)"
                    :disabled="isOutOfStock(item)"
                  >
                    <span v-if="addedId === item.id">✓ Added!</span>
                    <span v-else-if="isOutOfStock(item)">Unavailable</span>
                    <span v-else>Add to Cart</span>
                  </button>
                </div>

              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>

    </div>

    <div v-if="showModifierModal" class="modal-overlay" @click.self="showModifierModal = false">
      <div class="modifier-modal">
        <h5>{{ modifierModalItem?.name }}</h5>
        <p class="modifier-base-price">Base price: {{ formatAmount(modifierModalItem?.price) }}</p>

        <div class="modifier-list">
          <label v-for="mod in modifierModalItem?.modifiers" :key="mod.id" class="modifier-option">
            <input type="checkbox" :value="mod.id" v-model="selectedModifierIds" />
            <span class="modifier-name">{{ mod.name }}</span>
            <span class="modifier-price">
              {{ Number(mod.price_delta) >= 0 ? '+' : '' }}{{ formatAmount(mod.price_delta) }}
            </span>
          </label>
        </div>

        <div class="modifier-modal-total">
          <span>Total</span>
          <span>{{ formatAmount(modifierModalTotal) }}</span>
        </div>

        <div class="modifier-modal-actions">
          <button class="btn-cancel" @click="showModifierModal = false">Cancel</button>
          <button class="btn-confirm" @click="confirmAddToCart">Add to Cart</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../../services/api'
import { useCartStore } from '../../store/cart'
import { getFoodEmoji } from '../../utils/foodEmoji'
import { formatMoney, getCurrency } from '../../utils/currency'

const router = useRouter()
const route = useRoute()
const cart = useCartStore()
const currency = ref(getCurrency())

const onCurrencyChanged = (event) => {
  currency.value = event.detail || getCurrency()
}

const formatAmount = (amount) => formatMoney(amount, currency.value)

const categories = ref([])
const loading = ref(true)
const error = ref(null)
const addedId = ref(null)
const favoriteIds = ref(new Set())
const searchQuery = ref('')
const activeCategory = ref(null)
const activeDietaryFilters = ref(new Set())
const showFavoritesOnly = ref(false)

const dietaryTagOptions = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'dairy-free', label: 'Dairy-Free' },
  { value: 'nut-free', label: 'Nut-Free' },
  { value: 'spicy', label: 'Spicy' }
]

const getDietaryTags = (item) => (item.dietary_tags ? item.dietary_tags.split(',').filter(Boolean) : [])

const tagLabel = (tag) => dietaryTagOptions.find(t => t.value === tag)?.label || tag

const toggleDietaryFilter = (tag) => {
  const next = new Set(activeDietaryFilters.value)
  if (next.has(tag)) next.delete(tag)
  else next.add(tag)
  activeDietaryFilters.value = next
}

const clearFilters = () => {
  searchQuery.value = ''
  activeDietaryFilters.value = new Set()
  showFavoritesOnly.value = false
}

const hasActiveFilters = computed(() =>
  !!searchQuery.value.trim() || activeDietaryFilters.value.size > 0 || showFavoritesOnly.value
)

const itemMatchesFilters = (item) => {
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    const matchesSearch = item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q)
    if (!matchesSearch) return false
  }
  if (activeDietaryFilters.value.size > 0) {
    const tags = getDietaryTags(item)
    for (const f of activeDietaryFilters.value) {
      if (!tags.includes(f)) return false
    }
  }
  if (showFavoritesOnly.value && !isFav(item.id)) return false
  return true
}

const filteredCategories = computed(() => {
  let cats = categories.value
  if (activeCategory.value) cats = cats.filter(c => c.id === activeCategory.value)
  if (!hasActiveFilters.value) return cats
  return cats.map(cat => ({
    ...cat,
    _filtered: cat.items.filter(itemMatchesFilters)
  })).filter(cat => cat._filtered.length > 0)
})

const allFilteredItems = computed(() =>
  filteredCategories.value.flatMap(c => c._filtered || c.items)
)

const getFilteredItems = (cat) => {
  if (hasActiveFilters.value) return cat._filtered || []
  return cat.items
}

const fetchMenu = async () => {
  try {
    const qrToken = route.params.qrToken
    if (qrToken && qrToken !== 'demo') {
      try {
        const tableRes = await api.get(`/tables/qr/${qrToken}`)
        const table = tableRes.data.data
        cart.setTable(table.id, qrToken, table.table_number)
      } catch {
      }
    }

    const res = await api.get('/menu/grouped')
    categories.value = res.data.data

    try {
      const favRes = await api.get('/menu/favorites', { params: { session_id: cart.tableId || 0 } })
      favoriteIds.value = new Set(favRes.data.data.map(f => f.menu_item_id))
    } catch {}
  } catch (err) {
    error.value = 'Failed to load menu'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.addEventListener('currency-changed', onCurrencyChanged)
  fetchMenu()
})

onUnmounted(() => {
  window.removeEventListener('currency-changed', onCurrencyChanged)
})

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return '/images/main-course.svg'
  if (url.startsWith('/images/')) return url
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
  return base + url
}
const hasRealPhoto = (item) => {
  const url = item.image_url
  return !!url && !url.startsWith('http') && !url.startsWith('/images/')
}

const isOutOfStock = (item) => {
  return item.stock_quantity !== null && item.stock_quantity !== undefined && item.stock_quantity !== -1 && item.stock_quantity <= 0
}

const isLowStock = (item) => {
  return item.stock_quantity !== null && item.stock_quantity !== undefined && item.stock_quantity !== -1 && item.stock_quantity > 0 && item.stock_quantity <= 5
}

const isFav = (itemId) => favoriteIds.value.has(itemId)

const toggleFav = async (item) => {
  try {
    const res = await api.post('/menu/favorites', {
      session_id: cart.tableId || 0,
      menu_item_id: item.id
    })
    if (res.data.favorited) {
      favoriteIds.value.add(item.id)
    } else {
      favoriteIds.value.delete(item.id)
    }
    favoriteIds.value = new Set(favoriteIds.value)
  } catch {}
}

const showModifierModal = ref(false)
const modifierModalItem = ref(null)
const selectedModifierIds = ref([])

const modifierModalTotal = computed(() => {
  if (!modifierModalItem.value) return 0
  const base = Number(modifierModalItem.value.price)
  const modTotal = (modifierModalItem.value.modifiers || [])
    .filter(m => selectedModifierIds.value.includes(m.id))
    .reduce((sum, m) => sum + Number(m.price_delta), 0)
  return base + modTotal
})

const flashAdded = (itemId) => {
  addedId.value = itemId
  setTimeout(() => {
    if (addedId.value === itemId) addedId.value = null
  }, 1200)
}

const addToCart = (item) => {
  if (item.modifiers?.length) {
    modifierModalItem.value = item
    selectedModifierIds.value = []
    showModifierModal.value = true
    return
  }
  cart.addItem({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    image_url: item.image_url || ''
  })
  flashAdded(item.id)
}

const confirmAddToCart = () => {
  const item = modifierModalItem.value
  const selectedModifiers = (item.modifiers || []).filter(m => selectedModifierIds.value.includes(m.id))
  cart.addItem({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    image_url: item.image_url || ''
  }, selectedModifiers)
  flashAdded(item.id)
  showModifierModal.value = false
}

const goToCart = () => {
  router.push('/customer/cart')
}
</script>

<style scoped>

.menu-page {
  background: var(--dark);
  min-height: 100vh;
  color: var(--text-primary);
}


.menu-header {
  padding: 20px;
  background: var(--dark-card);
}

.cart-btn {
  background: var(--primary);
  border: none;
  padding: 8px 15px;
  border-radius: 10px;
  color: white;
}


.menu-card {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  padding: 14px;
  border-radius: 14px;
  text-align: center;
  transition: 0.2s;
  height: 100%;
}

.menu-card:hover {
  transform: translateY(-3px);
  border-color: var(--primary);
}


.menu-img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 10px;
}

.menu-emoji-card {
  width: 100%;
  height: 160px;
  border-radius: 10px;
  margin-bottom: 10px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.menu-emoji {
  font-size: 64px;
  line-height: 1;
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.25));
}


.item-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  align-items: center;
}

.btn-fav {
  background: var(--dark-surface);
  border: none;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}

.btn-fav i {
  font-size: 18px;
  color: var(--text-secondary);
  transition: 0.2s;
}

.btn-fav i.bi-heart-fill {
  color: #ef4444;
}

.btn-fav:hover i {
  color: #ef4444;
}

.btn-add {
  flex: 1;
  background: var(--secondary);
  border: none;
  padding: 8px 20px;
  border-radius: 10px;
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: 0.2s;
}

.btn-add:hover {
  background: var(--primary-hover);
}

.btn-add.btn-added {
  background: var(--success, #10b981);
  animation: btn-pop 0.25s ease;
}

.item-desc {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 5px;
}

.item-price {
  color: var(--amount-color);
  font-weight: 700;
  font-size: 18px;
}


.img-wrap {
  position: relative;
}

.stock-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.stock-badge.out {
  background: #ef4444;
  color: white;
}

.stock-badge.low {
  background: #f59e0b;
  color: #0f172a;
}

.btn-add.btn-disabled {
  background: var(--text-muted);
  cursor: not-allowed;
}

.btn-add:disabled {
  opacity: 0.6;
}

.out-of-stock-card {
  opacity: 0.7;
}


.search-bar-wrap { padding-top: 16px; }
.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  border-radius: 12px;
  padding: 0 14px;
  transition: border-color 0.2s;
}
.search-input-wrap:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
.search-icon { width: 18px; height: 18px; color: var(--text-muted); flex-shrink: 0; }
.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  padding: 12px 10px;
  font-size: 15px;
}
.search-input::placeholder { color: var(--text-muted); }
.search-clear { background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; line-height: 1; padding: 0; }
.search-clear:hover { color: var(--text-primary); }


.category-tabs-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
.category-tabs { display: flex; gap: 8px; width: max-content; }
.cat-tab {
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  color: var(--text-secondary);
  padding: 7px 18px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.cat-tab:hover { border-color: var(--primary); color: var(--primary); }
.cat-tab.active { background: var(--primary); border-color: var(--primary); color: white; }

.category-title { font-size: 1.1rem; font-weight: 700; }
.cat-count { font-size: 0.85rem; font-weight: 400; color: var(--text-muted); }


.filter-chips-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
.filter-chips { display: flex; gap: 8px; width: max-content; }
.filter-chip {
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  color: var(--text-secondary);
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 5px;
}
.filter-chip:hover { border-color: var(--primary); color: var(--primary); }
.filter-chip.active { background: var(--primary); border-color: var(--primary); color: white; }
.filter-chip.fav-chip.active { background: #ef4444; border-color: #ef4444; }
.filter-chip i { font-size: 11px; }

.dietary-badges { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
.dietary-badge {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}


.cart-btn { position: relative; }
.cart-count-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--danger, #ef4444);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  animation: badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}


.menu-card-skeleton {
  background: var(--dark-card);
  border-radius: 14px;
  padding: 14px;
  height: 280px;
}
.skel-img { height: 160px; background: var(--dark-surface); border-radius: 10px; margin-bottom: 12px; animation: shimmer 1.5s infinite; }
.skel-line { height: 12px; background: var(--dark-surface); border-radius: 6px; margin-bottom: 10px; animation: shimmer 1.5s infinite; }
.skel-title { width: 70%; }
.skel-price { width: 40%; }
.skel-btn { width: 100%; height: 36px; border-radius: 10px; }


.menu-item-enter-active { transition: all 0.35s ease; }
.menu-item-enter-from { opacity: 0; transform: translateY(16px) scale(0.97); }
.menu-item-leave-active { transition: all 0.25s ease; position: absolute; }
.menu-item-leave-to { opacity: 0; transform: scale(0.95); }

@keyframes btn-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
@keyframes badge-pop {
  from { transform: scale(0); }
  to { transform: scale(1); }
}
@keyframes shimmer {
  0% { background-color: var(--dark-surface); }
  50% { background-color: var(--dark-hover); }
  100% { background-color: var(--dark-surface); }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modifier-modal {
  background: var(--dark-card);
  border-radius: 20px;
  padding: 25px;
  width: 100%;
  max-width: 420px;
  margin: 16px;
  color: var(--text-primary);
}

.modifier-modal h5 {
  margin-bottom: 4px;
}

.modifier-base-price {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 16px;
}

.modifier-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.modifier-option {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.modifier-option:hover {
  border-color: var(--primary);
}

.modifier-name {
  flex: 1;
}

.modifier-price {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.modifier-modal-total {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 16px;
  padding: 12px 0;
  border-top: 1px solid var(--dark-border);
  margin-bottom: 16px;
}

.modifier-modal-actions {
  display: flex;
  gap: 10px;
}

.modifier-modal-actions .btn-cancel {
  flex: 1;
  padding: 10px;
  background: var(--dark-hover);
  border: none;
  border-radius: 10px;
  color: var(--text-primary);
}

.modifier-modal-actions .btn-confirm {
  flex: 1;
  padding: 10px;
  background: var(--primary);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
}

</style>

<template>
  <div class="customer-nav">
    <router-link :to="menuPath" class="nav-item" :class="{ active: $route.path.includes('/menu') }">
      <i class="bi bi-book"></i>
      <span class="nav-label">Menu</span>
    </router-link>

    <router-link to="/customer/cart" class="nav-item" :class="{ active: $route.path === '/customer/cart' }">
      <i class="bi bi-bag"></i>
      <span class="nav-label">Cart</span>
      <span v-if="cart.itemCount > 0" class="badge">{{ cart.itemCount }}</span>
    </router-link>

    <router-link
      v-if="cart.lastOrderId"
      :to="`/customer/order/${cart.lastOrderId}`"
      class="nav-item"
      :class="{ active: $route.path.includes('/order') }"
    >
      <i class="bi bi-geo-alt"></i>
      <span class="nav-label">Track</span>
    </router-link>

    <router-link to="/customer/orders" class="nav-item" :class="{ active: $route.path === '/customer/orders' }">
      <i class="bi bi-clock-history"></i>
      <span class="nav-label">Orders</span>
    </router-link>

    <router-link to="/customer/call-waiter" class="nav-item" :class="{ active: $route.path === '/customer/call-waiter' }">
      <i class="bi bi-bell"></i>
      <span class="nav-label">Waiter</span>
    </router-link>

    <a class="nav-item" @click="handleExit" style="cursor:pointer">
      <i class="bi bi-box-arrow-left"></i>
      <span class="nav-label">Exit</span>
    </a>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../store/cart'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()

const menuPath = computed(() => {
  if (cart.qrToken) return `/customer/menu/${cart.qrToken}`
  return '/customer/menu/table_1'
})

const handleExit = () => {
  cart.clearCart()
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.customer-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65px;
  background: rgba(var(--dark-card-rgb, 33, 25, 21), 0.96);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--dark-border, #1e293b);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  padding: 0 10px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: var(--text-muted, #64748b);
  font-size: 11px;
  position: relative;
  padding: 5px 15px;
  transition: 0.2s;
}

.nav-item.active {
  color: var(--primary, #6c5ce7);
}

.nav-item i {
  font-size: 20px;
  margin-bottom: 2px;
}

.nav-label {
  font-weight: 500;
}

.badge {
  position: absolute;
  top: 0;
  right: 5px;
  background: var(--danger, #ef4444);
  color: white;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}
</style>

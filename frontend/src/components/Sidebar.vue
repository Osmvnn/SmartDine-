<template>
  <div :class="['sidebar', { collapsed: collapsed }]">
    <div class="sidebar-inner">
      <div class="logo">
        <img :src="logoIcon" alt="Smart Dine" class="logo-img" />
        <span class="logo-text">Smart Dine</span>
      </div>

      <nav class="menu">
        <router-link
          v-for="link in links"
          :key="link.path"
          :to="link.path"
          class="item"
          active-class="active"
          @click="$emit('nav-click')"
        >
          <i :class="'bi bi-' + link.icon"></i>
          <span class="item-label">{{ link.label }}</span>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../store/auth'
import logoIcon from '../assets/logo-icon.svg'

defineProps({ collapsed: Boolean })
defineEmits(['nav-click'])

const auth = useAuthStore()

const links = computed(() => {
  const role = auth.role

  if (role === 'admin') {
    return [
      { path: '/admin', label: 'Dashboard', icon: 'grid-1x2' },
      { path: '/admin/users', label: 'Users', icon: 'people' },
      { path: '/admin/categories', label: 'Categories', icon: 'folder' },
      { path: '/admin/items', label: 'Menu Items', icon: 'cup-straw' },
      { path: '/admin/tables', label: 'Tables', icon: 'columns-gap' },
      { path: '/admin/orders', label: 'Orders', icon: 'receipt' },
      { path: '/admin/promos', label: 'Promo Codes', icon: 'ticket-perforated' },
      { path: '/admin/reservations', label: 'Reservations', icon: 'calendar-event' },
      { path: '/admin/shifts', label: 'Staff Shifts', icon: 'clock-history' },
      { path: '/admin/inventory', label: 'Inventory', icon: 'box-seam' },
      { path: '/admin/loyalty-rewards', label: 'Loyalty Rewards', icon: 'gem' },
      { path: '/admin/audit-log', label: 'Audit Log', icon: 'journal-text' },
      { path: '/admin/security', label: 'Security', icon: 'shield-lock' }
    ]
  }

  if (role === 'manager') {
    return [
      { path: '/manager', label: 'Dashboard', icon: 'grid-1x2' },
      { path: '/manager/sales', label: 'Sales Analytics', icon: 'graph-up' },
      { path: '/manager/tables', label: 'Table Stats', icon: 'columns-gap' },
      { path: '/manager/reservations', label: 'Reservations', icon: 'calendar-event' },
      { path: '/manager/shifts', label: 'Staff Shifts', icon: 'person-clock' },
      { path: '/manager/inventory', label: 'Inventory', icon: 'box-seam' },
      { path: '/manager/promos', label: 'Promo Codes', icon: 'tag' }
    ]
  }

  if (role === 'kitchen') {
    return [
      { path: '/kitchen', label: 'Kitchen Orders', icon: 'fire' }
    ]
  }

  if (role === 'waiter') {
    return [
      { path: '/waiter', label: 'Requests', icon: 'bell' }
    ]
  }

  if (role === 'cashier') {
    return [
      { path: '/cashier', label: 'Payments', icon: 'cash-stack' }
    ]
  }

  return []
})
</script>

<style scoped>
.sidebar {
  width: 240px;
  min-width: 240px;
  background: linear-gradient(180deg, var(--sidebar-bg-from, #160f0b), var(--sidebar-bg-to, #0d0907));
  min-height: 100vh;
  border-right: 1px solid var(--sidebar-border, #1e293b);
  transition: 0.3s ease;
}

.sidebar-inner {
  padding: 20px 16px;
  position: sticky;
  top: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--sidebar-text-hover, #fff7ed);
  margin-bottom: 32px;
  padding: 0 8px;
}

.logo-img {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item {
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  color: var(--sidebar-text, #94a3b8);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
}

.item i {
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
}

.item:hover {
  background: var(--sidebar-hover-bg, rgba(255, 247, 237, 0.06));
  color: var(--sidebar-text-hover, #f1f5f9);
}

.item.active {
  background: var(--primary, #6c5ce7);
  color: var(--sidebar-active-text, white);
  box-shadow: 0 10px 22px rgba(200, 121, 42, 0.22);
}

@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 200;
    transform: translateX(0);
    box-shadow: var(--shadow-lg);
    animation: slideIn 0.3s ease-out;
  }
  .sidebar.collapsed {
    transform: translateX(-100%);
    animation: slideOut 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-100%);
    }
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 280px;
    min-width: 280px;
  }
  
  .menu {
    gap: 8px;
  }
  
  .item {
    padding: 12px 14px;
    border-radius: 12px;
  }
  
  .item i {
    font-size: 1.2rem;
    width: 24px;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 100%;
    max-width: 85vw;
  }
  
  .sidebar-inner {
    padding: 16px 12px;
  }
  
  .logo {
    margin-bottom: 24px;
  }
  
  .item-label {
    font-size: 13px;
  }
}
</style>

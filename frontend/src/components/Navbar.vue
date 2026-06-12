<template>
  <div class="navbar">
    <div class="left">
      <button v-if="showMenuToggle" class="menu-toggle" @click="$emit('toggle-sidebar')">
        <i class="bi bi-list"></i>
      </button>
      <span class="logo-mobile">
        <img :src="logoIcon" alt="Smart Dine" class="logo-mobile-img" />
        <span>Smart Dine</span>
      </span>
    </div>
    <div class="right">
      <CurrencyToggle />
      <ThemeToggle />
      <NotificationBell v-if="auth.isLoggedIn" />
      <div v-if="auth.isLoggedIn" class="user-info">
        <span class="user-name">{{ auth.user?.name }}</span>
        <span class="role-badge">{{ (auth.role || '').toUpperCase() }}</span>
      </div>
      <button v-if="auth.isLoggedIn" class="logout-btn" @click="handleLogout">
        <i class="bi bi-box-arrow-right"></i>
        <span class="logout-text">Logout</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import ThemeToggle from './ThemeToggle.vue'
import CurrencyToggle from './CurrencyToggle.vue'
import NotificationBell from './NotificationBell.vue'
import logoIcon from '../assets/logo-icon.svg'

defineProps({ showMenuToggle: Boolean })
defineEmits(['toggle-sidebar'])

const router = useRouter()
const auth = useAuthStore()

const handleLogout = () => {
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.navbar {
  height: 64px;
  background: rgba(var(--dark-card-rgb, 33, 25, 21), 0.96);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 22px;
  border-bottom: 1px solid var(--dark-border, #1e293b);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-toggle {
  display: none;
  background: var(--dark-hover, rgba(255, 247, 237, 0.04));
  border: none;
  color: var(--text-secondary, #94a3b8);
  font-size: 22px;
  cursor: pointer;
  width: 38px;
  height: 38px;
  border-radius: 10px;
}

.logo-mobile {
  font-weight: 700;
  color: var(--text-primary, #fff);
  font-size: 1.05rem;
  display: none;
  align-items: center;
  gap: 8px;
}

.logo-mobile-img {
  width: 28px;
  height: 28px;
  border-radius: 7px;
}

@media (max-width: 1023px) {
  .menu-toggle { display: block; }
  .logo-mobile {
    display: flex;
  }
}

@media (max-width: 480px) {
  .user-name { display: none; }
  .role-badge { display: none; }
  .logout-text { display: none; }
  .navbar {
    padding: 0 10px;
    gap: 8px;
  }
  .right {
    gap: 6px;
    min-width: 0;
  }
  .logout-btn { padding: 6px 10px; }
  .logo-mobile span { display: none; }
}

.right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name {
  color: var(--text-primary, #f1f5f9);
  font-weight: 500;
  font-size: 14px;
}

.role-badge {
  background: var(--primary-light, rgba(108, 92, 231, 0.15));
  color: var(--primary, #6c5ce7);
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.logout-btn {
  background: var(--dark-hover, rgba(255, 247, 237, 0.04));
  border: 1px solid var(--dark-border, #334155);
  padding: 6px 14px;
  border-radius: 10px;
  color: var(--text-secondary, #94a3b8);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  transition: 0.2s;
}

.logout-btn:hover {
  border-color: var(--danger, #ef4444);
  color: var(--danger, #ef4444);
}
</style>

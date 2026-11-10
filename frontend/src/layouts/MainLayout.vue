<template>
  <div class="layout" :class="{ 'customer-theme': isCustomer }">
    <div v-if="showSidebar && !sidebarCollapsed" class="sidebar-overlay" @click="sidebarCollapsed = true"></div>

    <Sidebar v-if="showSidebar" :collapsed="sidebarCollapsed" @nav-click="sidebarCollapsed = true" />

    <div class="main">
      <Navbar :show-menu-toggle="showSidebar" @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed" />
      <div class="content" :class="{ 'has-bottom-nav': isCustomer }">
        <router-view />
      </div>
      <CustomerNav v-if="isCustomer" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { useSocketStore } from '../store/socket'

import Sidebar from '../components/Sidebar.vue'
import Navbar from '../components/Navbar.vue'
import CustomerNav from '../components/CustomerNav.vue'

const route = useRoute()
const auth = useAuthStore()
const socketStore = useSocketStore()
const sidebarCollapsed = ref(true)

const staffPaths = ['/admin', '/manager', '/kitchen', '/waiter', '/cashier']

const showSidebar = computed(() => {
  return auth.isLoggedIn && staffPaths.some(p => route.path.startsWith(p))
})

const isCustomer = computed(() => {
  return route.path.startsWith('/customer')
})

onMounted(() => {
  if (auth.isLoggedIn && auth.role) {
    socketStore.connect()
    socketStore.joinRoom(auth.role)
    if (auth.user?.id) socketStore.joinRoom(`user-${auth.user.id}`)
  }
})

watch(() => auth.token, (token) => {
  socketStore.disconnect()
  const loggedIn = !!token
  if (loggedIn && auth.role) {
    socketStore.connect()
    socketStore.joinRoom(auth.role)
    if (auth.user?.id) socketStore.joinRoom(`user-${auth.user.id}`)
  } else {
    socketStore.disconnect()
  }
})

onUnmounted(() => {
  socketStore.disconnect()
})
</script>

<style scoped>
.layout {
  display: flex;
  background: var(--dark, #1a1410);
  min-height: 100vh;
}

.sidebar-overlay {
  display: none;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.content {
  flex: 1;
  min-width: 0;
}

.content.has-bottom-nav {
  padding-bottom: 80px;
}

@media (max-width: 1024px) {
  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 199;
    animation: fadeIn 0.3s ease-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .main {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .content {
    padding: 0;
  }
}
</style>

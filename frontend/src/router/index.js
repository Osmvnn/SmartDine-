import { createRouter, createWebHistory } from 'vue-router'

import MainLayout from '../layouts/MainLayout.vue'
import WelcomePage from '../pages/WelcomePage.vue'

import CustomerAuthPage from '../pages/auth/CustomerAuthPage.vue'
import MenuPage from '../pages/customer/MenuPage.vue'
import CartPage from '../pages/customer/CartPage.vue'
import CheckoutPage from '../pages/customer/CheckoutPage.vue'
import OrderTrackingPage from '../pages/customer/OrderTrackingPage.vue'
import CallWaiterPage from '../pages/customer/CallWaiterPage.vue'
import OrderHistoryPage from '../pages/customer/OrderHistoryPage.vue'
import ReservationPage from '../pages/customer/ReservationPage.vue'

import LoginPage from '../pages/auth/LoginPage.vue'

import KitchenDashboard from '../pages/kitchen/KitchenDashboard.vue'
import WaiterDashboard from '../pages/waiter/WaiterDashboard.vue'
import WaiterOrderPage from '../pages/waiter/WaiterOrderPage.vue'
import CashierDashboard from '../pages/cashier/CashierDashboard.vue'

import AdminDashboard from '../pages/admin/AdminDashboard.vue'
import ManageUsers from '../pages/admin/ManageUsers.vue'
import ManageCategories from '../pages/admin/ManageCategories.vue'
import ManageItems from '../pages/admin/ManageItems.vue'
import ManageTables from '../pages/admin/ManageTables.vue'
import ManageOrders from '../pages/admin/ManageOrders.vue'
import ManagePromos from '../pages/admin/ManagePromos.vue'
import ManageReservations from '../pages/admin/ManageReservations.vue'
import ManageShifts from '../pages/admin/ManageShifts.vue'
import ManageInventory from '../pages/admin/ManageInventory.vue'
import ManageLoyaltyRewards from '../pages/admin/ManageLoyaltyRewards.vue'
import ManageAuditLog from '../pages/admin/ManageAuditLog.vue'
import SecurityCenter from '../pages/admin/SecurityCenter.vue'

import ManagerDashboard from '../pages/manager/ManagerDashboard.vue'
import SalesAnalytics from '../pages/manager/SalesAnalytics.vue'
import TableStats from '../pages/manager/TableStats.vue'
import PublicReservationPage from '../pages/customer/PublicReservationPage.vue'

const routes = [
  { path: '/', component: WelcomePage },

  { path: '/reserve', component: PublicReservationPage },
  { path: '/customer/login', component: CustomerAuthPage },

  { path: '/table/:qrToken', component: CustomerAuthPage },

  { path: '/login', component: LoginPage },

  {
    path: '/customer',
    component: MainLayout,
    children: [
      { path: '', redirect: '/customer/orders' },
      { path: 'menu/:qrToken', component: MenuPage },
      { path: 'cart', component: CartPage },
      { path: 'checkout', component: CheckoutPage },
      { path: 'order/:id', component: OrderTrackingPage },
      { path: 'call-waiter', component: CallWaiterPage },
      { path: 'orders', component: OrderHistoryPage },
      { path: 'reservation', component: ReservationPage }
    ]
  },

  { path: '/menu/:qrToken', redirect: to => `/customer/menu/${to.params.qrToken}` },

  {
    path: '/kitchen',
    component: MainLayout,
    meta: { requiresAuth: true, role: 'kitchen' },
    children: [
      { path: '', component: KitchenDashboard },
      { path: 'menu/:qrToken', component: MenuPage },
      { path: 'cart', component: CartPage },
      { path: 'checkout', component: CheckoutPage }
    ]
  },

  {
    path: '/waiter',
    component: MainLayout,
    meta: { requiresAuth: true, role: 'waiter' },
    children: [
      { path: '', component: WaiterDashboard },
      { path: 'new-order', component: WaiterOrderPage },
      { path: 'order/:id', component: OrderTrackingPage },
      { path: 'menu/:qrToken', component: MenuPage },
      { path: 'cart', component: CartPage },
      { path: 'checkout', component: CheckoutPage }
    ]
  },

  {
    path: '/cashier',
    component: MainLayout,
    meta: { requiresAuth: true, role: 'cashier' },
    children: [
      { path: '', component: CashierDashboard },
      { path: 'menu/:qrToken', component: MenuPage },
      { path: 'cart', component: CartPage },
      { path: 'checkout', component: CheckoutPage }
    ]
  },

  {
    path: '/admin',
    component: MainLayout,
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      { path: '', component: AdminDashboard },
      { path: 'users', component: ManageUsers },
      { path: 'categories', component: ManageCategories },
      { path: 'items', component: ManageItems },
      { path: 'tables', component: ManageTables },
      { path: 'orders', component: ManageOrders },
      { path: 'promos', component: ManagePromos },
      { path: 'reservations', component: ManageReservations },
      { path: 'shifts', component: ManageShifts },
      { path: 'inventory', component: ManageInventory },
      { path: 'loyalty-rewards', component: ManageLoyaltyRewards },
      { path: 'audit-log', component: ManageAuditLog },
      { path: 'security', component: SecurityCenter }
    ]
  },

  {
    path: '/manager',
    component: MainLayout,
    meta: { requiresAuth: true, role: 'manager' },
    children: [
      { path: '', component: ManagerDashboard },
      { path: 'sales', component: SalesAnalytics },
      { path: 'tables', component: TableStats },
      { path: 'reservations', component: ManageReservations },
      { path: 'shifts', component: ManageShifts },
      { path: 'promos', component: ManagePromos },
      { path: 'inventory', component: ManageInventory }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const requiresAuth = to.matched.some(r => r.meta.requiresAuth)
  if (!requiresAuth) return true

  const token = sessionStorage.getItem('token')
  const user = JSON.parse(sessionStorage.getItem('user') || 'null')

  if (!token || !user) {
    return '/login'
  }

  const requiredRole = to.matched.find(r => r.meta.role)?.meta.role
  if (requiredRole && user.role !== requiredRole) {
    return '/login'
  }

  return true
})

export default router

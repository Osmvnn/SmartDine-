<template>
  <div class="login-page">
    <RestaurantAmbientBg />
    <div class="login-container">

      <div class="login-card">

        <div class="login-logo"><BrandLogo size="md" /></div>
        <p class="subtitle">Staff Login</p>

        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" class="form-input" placeholder="Enter your email" />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" class="form-input" placeholder="Enter your password" />
        </div>

        <button class="btn-login" @click="handleLogin" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>

        <p v-if="error" class="text-danger mt-3 text-center">{{ error }}</p>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import BrandLogo from '../../components/BrandLogo.vue'
import RestaurantAmbientBg from '../../components/RestaurantAmbientBg.vue'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)

const handleLogin = async () => {
  loading.value = true
  error.value = null

  try {
    const data = await auth.login(email.value, password.value)
    const role = data.user.role

    if (role === 'admin') router.push('/admin')
    else if (role === 'manager') router.push('/manager')
    else if (role === 'kitchen') router.push('/kitchen')
    else if (role === 'waiter') router.push('/waiter')
    else if (role === 'cashier') router.push('/cashier')
    else router.push('/')
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  background: var(--dark);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-container {
  width: 100%;
  max-width: 420px;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.login-card {
  background: var(--dark-card);
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  color: var(--text-primary);
}

.login-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.subtitle {
  color: var(--text-secondary);
  margin-bottom: 30px;
}

.form-group {
  text-align: left;
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  background: var(--dark-surface);
  color: var(--text-primary);
  font-size: 15px;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
}

.btn-login {
  width: 100%;
  padding: 14px;
  background: var(--primary);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin-top: 10px;
  transition: 0.3s;
}

.btn-login:hover {
  background: var(--primary-hover);
}

.btn-login:disabled {
  opacity: 0.6;
}


</style>

<template>
  <div class="welcome customer-theme">

    <div class="bg-gradient"></div>

    <div class="welcome-content">

      <div class="logo-section">
        <div class="logo-icon">
          <img :src="logoIcon" alt="Smart Dine" />
        </div>
        <h1 class="brand">Smart Dine</h1>
        <p class="tagline">Smart Campus Dining Experience</p>
      </div>

      <div class="message-box">
        <h2>Welcome</h2>
        <p class="message">
          Scan the <strong>QR code</strong> on your table to start ordering.
          Browse the menu, place your order, pay online, and we'll bring
          your food right to your table.
        </p>
      </div>

      <div class="steps-section">
        <div class="step-card">
          <div class="step-icon"><i class="bi bi-qr-code-scan"></i></div>
          <div class="step-num">1</div>
          <h5>Scan QR Code</h5>
          <p>Use your phone camera on the QR code at your table</p>
        </div>

        <div class="step-card">
          <div class="step-icon"><i class="bi bi-person-check"></i></div>
          <div class="step-num">2</div>
          <h5>Login / Sign Up</h5>
          <p>Quick and easy - just name, email and password</p>
        </div>

        <div class="step-card">
          <div class="step-icon"><i class="bi bi-cart-check"></i></div>
          <div class="step-num">3</div>
          <h5>Browse &amp; Order</h5>
          <p>Pick your favorite dishes and add to cart</p>
        </div>

        <div class="step-card">
          <div class="step-icon"><i class="bi bi-credit-card"></i></div>
          <div class="step-num">4</div>
          <h5>Pay &amp; Enjoy</h5>
          <p>Pay online and we'll deliver to your table</p>
        </div>
      </div>

      <div class="qr-section">
        <div class="qr-visual">
          <div class="qr-frame">
            <i class="bi bi-qr-code" style="font-size: 48px; color: var(--primary)"></i>
          </div>
          <div class="scan-line"></div>
        </div>
        <p class="qr-hint">Point your camera at the QR code on your table</p>
      </div>

      <div class="manual-section">
        <p class="manual-label">Camera not working?</p>
        <button class="btn-choose" @click="showTableSelect = true">Choose Your Table</button>
      </div>

      <div class="cta-actions">
        <router-link to="/customer/login" class="btn-account">
          <i class="bi bi-person-check me-2"></i>Customer Login
        </router-link>
        <router-link to="/reserve" class="btn-reserve">
          <i class="bi bi-calendar-check me-2"></i>Make a Reservation
        </router-link>
      </div>

      <div v-if="showTableSelect" class="table-overlay" @click.self="showTableSelect = false">
        <div class="table-modal">
          <h4>Select Your Table</h4>
          <p class="modal-sub">Choose the table number you're sitting at</p>
          <div class="table-grid">
            <div
              v-for="table in tables"
              :key="table.id"
              :class="['table-chip', selectedTable === table.table_number ? 'active' : '', table.status]"
              @click="selectedTable = table.table_number"
            >
              <span class="table-num">{{ table.table_number }}</span>
              <span class="table-label">{{ table.status }}</span>
            </div>
          </div>
          <button class="btn-go" :disabled="!selectedTable" @click="goToTable">Continue</button>
          <button class="btn-cancel" @click="showTableSelect = false">Cancel</button>
        </div>
      </div>

      <p class="footer-text">
        &copy; Smart Dine System
        <span class="staff-divider">|</span>
        <router-link to="/login" class="staff-link">Staff Login</router-link>
      </p>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import logoIcon from '../assets/logo-icon.svg'

const router = useRouter()
const showTableSelect = ref(false)
const selectedTable = ref(null)
const tables = ref([])

const fetchTables = async () => {
  try {
    const res = await api.get('/tables')
    tables.value = res.data.data || []
  } catch {
    tables.value = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      table_number: index + 1,
      status: 'available'
    }))
  }
}

const goToTable = () => {
  if (selectedTable.value) {
    router.push(`/table/table_${selectedTable.value}`)
  }
}

onMounted(fetchTables)
</script>

<style scoped>
.welcome {
  min-height: 100vh;
  background: var(--dark);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 247, 237, 0.08), transparent 38%),
    radial-gradient(ellipse at 15% 5%, rgba(200, 121, 42, 0.16) 0%, transparent 48%),
    radial-gradient(ellipse at 85% 75%, rgba(45, 143, 123, 0.12) 0%, transparent 46%);
  pointer-events: none;
}

.welcome-content {
  text-align: center;
  width: min(1120px, 100%);
  padding: 34px 22px 28px;
  position: relative;
  z-index: 1;
  animation: welcome-hero 0.6s ease both;
}

.logo-section {
  margin-bottom: 30px;
  animation: welcome-hero 0.5s ease 0.05s both;
}

.logo-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.logo-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand {
  font-size: clamp(2.4rem, 6vw, 4.5rem);
  font-weight: 800;
  letter-spacing: 0;
  background: linear-gradient(135deg, #fff7ed, #f6c177 48%, #c8792a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline { color: var(--text-secondary); font-size: 15px; margin-top: 4px; }

.message-box { margin-bottom: 34px; }
.message-box h2 { font-size: 1.6rem; margin-bottom: 10px; font-weight: 700; }
.message { color: var(--text-secondary); font-size: 15px; max-width: 500px; margin: 0 auto; line-height: 1.7; }

.steps-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 30px;
}

.step-card {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 12px;
  padding: 22px 14px;
  position: relative;
  transition: 0.2s;
  animation: welcome-hero 0.5s ease both;
}

.step-card:nth-child(1) { animation-delay: 0.1s; }
.step-card:nth-child(2) { animation-delay: 0.2s; }
.step-card:nth-child(3) { animation-delay: 0.3s; }
.step-card:nth-child(4) { animation-delay: 0.4s; }

.step-card:hover {
  transform: translateY(-3px);
  border-color: var(--primary);
  background: var(--dark-hover);
}

.step-icon {
  margin-bottom: 10px;
}

.step-icon i {
  font-size: 24px;
  color: var(--primary);
}

.step-num {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 22px;
  height: 22px;
  background: var(--primary);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-card h5 { font-size: 13px; margin-bottom: 4px; font-weight: 600; }
.step-card p { color: var(--text-muted); font-size: 12px; margin: 0; line-height: 1.4; }

.qr-section { margin-bottom: 24px; }
.qr-visual { display: inline-block; position: relative; }

.qr-frame {
  width: 100px;
  height: 100px;
  border: 2px solid var(--dark-border);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  background: var(--dark-card);
}

.scan-line {
  position: absolute;
  width: 80px;
  height: 2px;
  background: var(--secondary);
  left: 50%;
  transform: translateX(-50%);
  animation: scanMove 2s ease-in-out infinite;
  box-shadow: 0 0 8px var(--secondary);
}

@keyframes scanMove {
  0%, 100% { top: 15px; }
  50% { top: 85px; }
}

.qr-hint { color: var(--text-muted); font-size: 13px; margin-top: 12px; }

.manual-section { margin-bottom: 20px; }
.manual-label { color: var(--text-muted); font-size: 13px; margin-bottom: 10px; }

.cta-actions {
  margin-bottom: 36px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-reserve,
.btn-account {
  display: inline-flex;
  align-items: center;
  padding: 11px 28px;
  background: var(--dark-hover);
  border: 1px solid rgba(200, 121, 42, 0.34);
  border-radius: 12px;
  color: var(--primary);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: 0.2s;
}

.btn-reserve:hover {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary);
}

.btn-account {
  background: rgba(245, 158, 11, 0.14);
  border-color: rgba(245, 158, 11, 0.35);
  color: var(--amount-color);
}

.btn-account:hover {
  background: rgba(245, 158, 11, 0.24);
  border-color: #f59e0b;
  color: var(--amount-color);
}

.btn-choose {
  padding: 11px 28px;
  background: transparent;
  border: 1px solid var(--dark-border);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.btn-choose:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.table-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.table-modal {
  background: var(--dark-card);
  border: 1px solid var(--dark-border);
  border-radius: 20px;
  padding: 32px;
  width: 400px;
  max-width: 90vw;
  text-align: center;
  color: var(--text-primary);
}

.table-modal h4 { margin-bottom: 4px; font-weight: 700; }
.modal-sub { color: var(--text-secondary); font-size: 13px; margin-bottom: 24px; }

.table-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}

.table-chip {
  background: var(--dark-border);
  border-radius: 12px;
  padding: 12px 6px;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.table-chip:hover { background: var(--dark-hover); }

.table-chip.active {
  background: var(--primary);
  transform: scale(1.06);
  box-shadow: 0 4px 12px var(--primary-light);
}

.table-num { font-size: 18px; font-weight: 700; color: var(--text-primary); }
.table-label { font-size: 10px; color: var(--text-secondary); }
.table-chip.active .table-num,
.table-chip.active .table-label { color: rgba(255, 255, 255, 0.7); }

.btn-go {
  width: 100%;
  padding: 13px;
  background: var(--primary);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  margin-bottom: 8px;
}

.btn-go:hover { background: var(--primary-hover); }
.btn-go:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-cancel {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  padding: 6px;
}

.btn-cancel:hover { color: var(--text-primary); }

.footer-text { color: var(--text-muted); font-size: 13px; }
.staff-divider { margin: 0 8px; color: var(--dark-border); }

.staff-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 13px;
  transition: 0.2s;
}

.staff-link:hover {
  color: var(--primary);
}

@media (max-width: 768px) {
  .steps-section { grid-template-columns: repeat(2, 1fr); }
  .brand { font-size: 2rem; }
  .message-box h2 { font-size: 1.3rem; }
  .welcome-content { padding: 30px 16px; }
}

@media (max-width: 480px) {
  .steps-section { grid-template-columns: 1fr 1fr; gap: 10px; }
  .table-grid { grid-template-columns: repeat(5, 1fr); gap: 8px; }
}

@keyframes welcome-hero {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>

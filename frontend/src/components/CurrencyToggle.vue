<template>
  <button class="currency-toggle" @click="toggleCurrency" :title="'Currency: ' + currency">
    {{ currency }}
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { getCurrency, setCurrency } from '../utils/currency'

const currency = ref(getCurrency())

function toggleCurrency() {
  const next = currency.value === 'USD' ? 'TRY' : 'USD'
  currency.value = next
  setCurrency(next)
}
</script>

<style scoped>
.currency-toggle {
  background: var(--dark-card, #1e293b);
  border: 1px solid var(--dark-border, #334155);
  color: var(--text-secondary, #94a3b8);
  height: 36px;
  padding: 0 10px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  font-weight: 700;
}

.currency-toggle:hover {
  background: var(--primary, #6c5ce7);
  color: white;
}
</style>

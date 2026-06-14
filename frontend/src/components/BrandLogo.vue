<template>
  <div class="brand-logo" :class="size">
    <img :src="logoIcon" alt="Smart Dine" class="brand-logo-icon" />
    <span class="brand-logo-text">Smart Dine</span>
  </div>
</template>

<script setup>
import logoIcon from '../assets/logo-icon.svg'

defineProps({
  size: { type: String, default: 'md' } // sm | md | lg
})
</script>

<style scoped>
.brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.brand-logo-icon {
  display: block;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: var(--shadow-md);
}

.brand-logo-text {
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1;
  background: linear-gradient(135deg, #fff7ed, #f6c177 48%, #c8792a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

.brand-logo.sm .brand-logo-icon { width: 44px; height: 44px; border-radius: 12px; }
.brand-logo.sm .brand-logo-text { font-size: 1.4rem; }

.brand-logo.md .brand-logo-icon { width: 60px; height: 60px; border-radius: 16px; }
.brand-logo.md .brand-logo-text { font-size: 1.9rem; }

.brand-logo.lg { gap: 22px; }
.brand-logo.lg .brand-logo-icon { width: 88px; height: 88px; border-radius: 22px; }
.brand-logo.lg .brand-logo-text { font-size: clamp(2.4rem, 6vw, 4.5rem); }

@media (max-width: 480px) {
  .brand-logo.lg { gap: 14px; }
  .brand-logo.lg .brand-logo-icon { width: 56px; height: 56px; border-radius: 16px; }
  .brand-logo.lg .brand-logo-text { font-size: 2.2rem; }

  .brand-logo.md .brand-logo-icon { width: 50px; height: 50px; border-radius: 14px; }
  .brand-logo.md .brand-logo-text { font-size: 1.6rem; }
}
</style>

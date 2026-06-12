<template>
  <div class="skeleton-card" :style="{ height: height + 'px' }">
    <div v-if="showImage" class="skel-block skel-img" :style="{ height: imageHeight + 'px' }"></div>
    <div class="skel-block skel-line" style="width: 65%; height: 14px; margin-top: 12px;"></div>
    <div class="skel-block skel-line" style="width: 85%; height: 10px; margin-top: 8px;"></div>
    <div class="skel-block skel-line" style="width: 40%; height: 12px; margin-top: 8px;"></div>
    <div v-if="showButton" class="skel-block skel-btn" style="height: 36px; margin-top: 14px; border-radius: 10px;"></div>
  </div>
</template>

<script setup>
defineProps({
  height: { type: Number, default: 260 },
  imageHeight: { type: Number, default: 140 },
  showImage: { type: Boolean, default: true },
  showButton: { type: Boolean, default: true }
})
</script>

<style scoped>
.skeleton-card {
  background: var(--dark-card, #1e293b);
  border-radius: 14px;
  padding: 14px;
  overflow: hidden;
}
.skel-block {
  background: var(--dark-hover, #334155);
  border-radius: 8px;
  animation: shimmer 1.5s infinite;
}
.skel-img { border-radius: 10px; }
</style>

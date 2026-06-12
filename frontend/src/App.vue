<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :name="route.meta.transition || 'page'" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
  <ToastContainer />
</template>

<script setup>
import ToastContainer from './components/ToastContainer.vue'
</script>

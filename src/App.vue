<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/AppLayout.vue'
import ShopLayout from '@/components/ShopLayout.vue'

const route = useRoute()
const authStore = useAuthStore()

const layoutComponent = computed(() => {
  if (route.meta.layout === 'app') {
    return AppLayout
  } else if (route.meta.layout === 'shop') {
    return ShopLayout
  }
  return 'div'
})

onMounted(() => {
  // Initialize authentication state
  authStore.initialize()
})
</script>
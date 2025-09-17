<template>
  <component :is="layout">
    <router-view />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ShopLayout from '@/components/ShopLayout.vue'

const route = useRoute()

const layout = computed(() => {
  const layoutName = route.meta.layout
  
  if (layoutName === 'shop') {
    return ShopLayout
  }
  
  // Default to div wrapper for pages without layout
  return 'div'
})
</script>
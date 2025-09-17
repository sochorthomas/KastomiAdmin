<template>
  <div class="shop-wrapper">
    <!-- Shop Header from Latte -->
    <ShopHeader />

    <!-- Main Content -->
    <main class="shop-main">
      <router-view :edit-mode="editMode" />
    </main>
    
    <!-- Shop Footer from Latte -->
    <ShopFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ShopHeader from '@/components/shop/ShopHeader.vue'
import ShopFooter from '@/components/shop/ShopFooter.vue'

const router = useRouter()
const authStore = useAuthStore()

// Edit mode is always on for admin shop
const editMode = ref(true)

// Shop configuration
const shopName = ref('Kastomi Shop')
const logoUrl = ref('')

// Computed properties
const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentYear = computed(() => new Date().getFullYear())

// Provide edit mode to all child components
provide('editMode', editMode)

// Methods

// Load shop configuration
const loadShopConfig = async () => {
  // This would load from API
  shopName.value = authStore.clubName || 'Kastomi Shop'
  logoUrl.value = authStore.clubLogo
}

onMounted(() => {
  loadShopConfig()
})
</script>

<style>
/* Import the shop base styles */
@import '@/assets/css/zaklad.css';
</style>

<style scoped>
.shop-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}


/* Main Content */
.shop-main {
  flex: 1;
  padding: 0;
  background: transparent;
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .edit-mode-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .edit-mode-info {
    font-size: 12px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 20px;
  }
  
  .shop-nav {
    width: 100%;
    justify-content: center;
  }
}
</style>
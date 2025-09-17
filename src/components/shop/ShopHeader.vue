<template>
  <div>
    <!-- Kastomi Top Bar -->
    <div class="kastomi-top-bar">
      <a href="mailto:info@kastomi.com">info@kastomi.com</a>
    </div>
    
    <!-- Header -->
    <header class="ts-header" :class="{ scrolled: isScrolled }">
      <div class="ts-header-container">
        <a target="_blank" href="https://kastomi.com" style="text-decoration: none; display: flex; align-items: center; z-index: 500">
          <img :src="logoSrc" class="ts-logo" alt="Kastomi" />
        </a>
        
        <div class="ts-navigation">
          <div class="ts-burger-content" :class="{ responsive: mobileMenuOpen }" id="ts-burger-content">
            <!-- Dynamic pages from API would go here -->
            <router-link to="/shop" class="ts-navbar_item navbar_btn">
              E-shop
              <img src="https://ponozkator.cz/src/img/header-arrow.svg" class="ts-harrow" alt="šipka">
            </router-link>
          </div>
          
          <div class="ts-navbar-icons">
            <!-- Cart icon -->
            <a id="cd-cart-trigger" style="position: relative; cursor: pointer" @click="toggleCart">
              <div id="pocet_na_kosiku" style="position: absolute;top: 65%; left: 50%; color: var(--contrast-color); transform: translate(-50%, -50%);">
                {{ cartCount }}
              </div>
              <img :src="cartIconSrc" alt="Košík" />
            </a>
            
            <!-- Hamburger menu -->
            <div class="ts-burger-box">
              <input id="toggle" type="checkbox" v-model="mobileMenuOpen">
              <label for="toggle" class="ts-hamburger">
                <div class="ts-top-bun"></div>
                <div class="ts-meat"></div>
                <div class="ts-bottom-bun"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Club Header -->
    <div v-if="salesChannel" class="club_header" :class="{ scrolled: isScrolled }">
      <router-link to="/shop" class="club-header-link">
        <div class="club-header-placeholder">
          <span class="club-name-text">{{ salesChannel.name }}</span>
        </div>
      </router-link>
      <h1 class="club_name">{{ salesChannel.name }}</h1>
    </div>

    <!-- Flash messages -->
    <div v-for="flash in flashes" :key="flash.id" :class="['flash', flash.type]">
      {{ flash.message }}
    </div>

    <!-- Cart Shadow Layer -->
    <div id="cd-shadow-layer" :class="{ active: cartOpen }" @click="cartOpen = false"></div>

    <!-- Cart Sidebar -->
    <div id="cd-cart" :class="{ active: cartOpen }">
      <h3>Obsah košíku:<br></h3>
      <h6><router-link to="/shop/cart" class="light">Přejít do košíku &rarr;</router-link></h6>
      <hr style="border-top: 1px solid black;">
      
      <div class="cd-cart-items">
        <!-- Cart items would go here -->
        <div v-if="cartItems.length === 0" class="text-center p-4">
          Košík je prázdný
        </div>
        <div v-for="item in cartItems" :key="item.id" class="row pb-4">
          <!-- Cart item display -->
        </div>
      </div>
      
      <div class="row mt-5 cd-go-to-cart">
        <div class="col-9"><p>Celkem</p></div>
        <div class="col">
          <div class="text-right"><p>{{ totalPrice }} Kč</p></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// State
const isScrolled = ref(false)
const mobileMenuOpen = ref(false)
const cartOpen = ref(false)
const cartItems = ref([])
const flashes = ref([])

// Get sales channel data from auth store
const salesChannel = computed(() => ({
  name: authStore.clubName || 'Kastomi Shop',
  internal: authStore.salesChannelUrl?.split('/').pop() || 'default',
  soubory: {
    logo: { cesta: '' }, // Will use placeholder
    header: { cesta: '' }, // Will use placeholder
    favicon: { cesta: '' }
  },
  kastomi_special_color: 'white'
}))

// Computed
const cartCount = computed(() => cartItems.value.length)
const totalPrice = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const logoSrc = computed(() => {
  // Use white version for now
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDx0ZXh0IHg9IjEwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPgogICAgS2FzdG9taQogIDwvdGV4dD4KPC9zdmc+'
})

const cartIconSrc = computed(() => {
  // Simple cart icon placeholder
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNOSAyMkM5LjU1MjI4IDIyIDEwIDIxLjU1MjMgMTAgMjFDMTAgMjAuNDQ3NyA5LjU1MjI4IDIwIDkgMjBDOC40NDc3MiAyMCA4IDIwLjQ0NzcgOCAyMUM4IDIxLjU1MjMgOC40NDc3MiAyMiA5IDIyWiIgZmlsbD0id2hpdGUiLz4KICA8cGF0aCBkPSJNMjAgMjJDMjAuNTUyMyAyMiAyMSAyMS41NTIzIDIxIDIxQzIxIDIwLjQ0NzcgMjAuNTUyMyAyMCAyMCAyMEMxOS40NDc3IDIwIDE5IDIwLjQ0NzcgMTkgMjFDMTkgMjEuNTUyMyAxOS40NDc3IDIyIDIwIDIyWiIgZmlsbD0id2hpdGUiLz4KICA8cGF0aCBkPSJNMSAxSDQuMjdMNi4xIDZIMTkuNTVDMTkuOSA2IDIwLjI1IDYuMTUgMjAuNDUgNi40QzIwLjcgNi42NSAyMC44NSA3IDIwLjggNy4zNUwyMC43NSA3LjU1TDE4LjcgMTNINy4xTDcuNSAxNEgxOVYxNkg3LjVMNSAzSDFWMVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg=='
})

const clubHeaderImage = computed(() => {
  // Use placeholder image for club header
  const placeholderUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDMwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZTAzM2MiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPgogICAge3sgc2FsZXNDaGFubmVsLm5hbWUgfX0KICA8L3RleHQ+Cjwvc3ZnPg=='
  
  // For now, just use placeholder
  return placeholderUrl
})

// Methods
const toggleCart = () => {
  cartOpen.value = !cartOpen.value
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 90
}

// Lifecycle
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
:root {
  --primary-color: #ee033c;
  --secondary-color: #c7022e;
  --contrast-color: white;
}

/* Top Bar */
.kastomi-top-bar {
  display: none;
  position: relative;
  top: 0;
  text-align: right;
  padding: 2px 2%;
  background: rgb(238,3,60);
  background: radial-gradient(circle, rgba(238,3,60,1) 40%, rgba(199,2,46,1) 64%);
}

.kastomi-top-bar a {
  color: var(--contrast-color);
  text-decoration: none;
  font-size: 0.7rem;
}

/* Header */
.ts-header {
  display: flex;
  background: rgb(238,3,60);  
  background: radial-gradient(circle, rgba(238,3,60,1) 40%, rgba(199,2,46,1) 64%);
  position: sticky;
  top: 0;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 90px;
  z-index: 9210;
  transition: all 200ms linear;
}

.ts-header.scrolled {
  box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px;
}

.ts-header-container {
  width: 95%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ts-navigation {
  display: flex;
  align-items: center;
  gap: 15px;
}

.ts-navbar-icons {
  width: fit-content;
  display: flex;
  align-items: center;
  height: 100%;
  gap: 3px;
  flex-wrap: nowrap;
  z-index: 9900;
}

.ts-burger-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: right;
  gap: 15px;
  background-color: none;
}

.ts-logo {
  width: 100px;
}

.ts-navbar_item {
  font-size: 20px;
  color: black;
  font-weight: bolder;
  text-decoration: none;
}

.ts-navbar_item:hover {
  color: #fff;
  text-decoration: underline;
}

.navbar_btn {
  color: var(--contrast-color); 
  border: 2px solid var(--contrast-color); 
  border-radius: 20px; 
  padding: 0px 8px;
  font-weight: normal;
}

/* Club Header */
.club_header {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background: rgb(238,3,60);
  background: radial-gradient(circle, rgba(238,3,60,1) 40%, rgba(199,2,46,1) 64%);
  width: 100%;
  height: 15vw;
  max-height: 15vw;
  margin-bottom: 0px;
  box-shadow: rgba(17, 12, 46, 0.15) 0px 4.8px 10px 0px;
  transition: all 300ms;
}

.club_header.scrolled {
  margin-bottom: 30px;
  max-height: 60px !important;
  transition: all 300ms;
}

.club_header-logo {
  display: block;
  position: relative; 
  height: 15vw;  
  max-height: 15vw; 
  width: 100%;
  max-width: 100%;
  left: 50%;
  transform: translateX(-50%);
  transform-origin: top;
  transition: all 300ms;
  z-index: 9212;
}

.club_header-logo.scrolled {
  position: fixed;
  height: 60px !important;
  max-height: 60px !important;
  width: auto;
  object-fit: contain;
  top: 15px !important;
  transition: all 300ms;
}

.club_name {
  display: none;
}

/* Club Header Placeholder */
.club-header-link {
  display: block;
  width: 100%;
  height: 100%;
  text-decoration: none;
}

.club-header-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
}

.club-name-text {
  color: white;
  font-size: clamp(24px, 4vw, 48px);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.club_header.scrolled .club-name-text {
  font-size: 20px;
}

/* Hamburger */
#toggle {
  display: none;
}

.ts-burger-box {
  cursor: pointer;
  position: relative;
  width: 43px;
  height: 43px;
  border-radius: 50%;
  border: 3px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  display: none;
}

.ts-hamburger {
  cursor: pointer;
  position: absolute;
  z-index: 5;
  transform: scale(0.5);
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 0;
}

.ts-hamburger div {
  width: 38px;
  height: 7px;
  border-radius: 3px;
  background-color: white;
  transition: all 0.3s ease-in-out;
}

#toggle:checked + .ts-hamburger .ts-top-bun {
  transform: rotate(-45deg);
  margin-top: 15px;
}

#toggle:checked + .ts-hamburger .ts-bottom-bun {
  opacity: 0;
  transform: rotate(45deg);
}

#toggle:checked + .ts-hamburger .ts-meat {
  transform: rotate(45deg);
  margin-top: -14px;
}

.ts-harrow {
  display: none;
}

/* Cart Sidebar */
#cd-cart {
  position: fixed;
  top: 90px;
  right: -300px;
  width: 300px;
  height: calc(100vh - 90px);
  background: white;
  box-shadow: -2px 0 5px rgba(0,0,0,0.1);
  transition: right 0.3s ease;
  z-index: 9999;
  padding: 20px;
  overflow-y: auto;
}

#cd-cart.active {
  right: 0;
}

#cd-shadow-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  z-index: 9998;
}

#cd-shadow-layer.active {
  opacity: 1;
  visibility: visible;
}

/* Flash Messages */
.flash {
  padding: 10px 20px;
  margin: 10px;
  border-radius: 4px;
  animation: slideDown 0.3s ease;
}

.flash.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.flash.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

.flash.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive */
@media screen and (max-width: 1150px) {
  .ts-burger-box {
    display: block;
  }
  
  .ts-burger-content {
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: fixed;
    gap: 5vh;
    margin: 0 auto;
    width: 100%;
    height: 1000px;
    top: 90px;
    left: 0;
    right: 0;
    overflow-y: scroll;
    z-index: 100;
    padding-top: 30px;
    background-color: white;
  }
  
  .ts-burger-content.responsive {
    display: block;
    z-index: 9000;
  }
  
  .ts-harrow {
    display: block;
  }
  
  .ts-navbar_item {
    display: flex;
    flex-wrap: nowrap;
    white-space: nowrap;
    align-items: center;
    justify-content: space-between;
    width: 90%;
    margin: 10px auto;
    border-bottom: 2px solid rgba(0, 0, 0, 0.048);
    color: black;
  }
  
  .navbar_btn {
    border: none;
  }
}

@media only screen and (max-width: 867px) {
  .club_header-logo {
    position: fixed;
    height: 60px !important;
    max-height: 60px !important;
    width: auto !important;
    object-fit: contain;
    top: 15px !important;
    transition: all 300ms;
  }
  
  .club_header {
    top: -70px;
    margin-bottom: 0px;
    max-height: 70px !important;
    transition: all 300ms;
  }
}
</style>
<template>
  <div class="layout-wrapper">
    <!-- Toast notifications -->
    <Toast position="top-right" />
    <ConfirmDialog />

    <!-- Mobile Drawer -->
    <Drawer v-model:visible="sidebarVisible" position="left" :modal="true" :showCloseIcon="true" class="sidebar-mobile" :header="false">
      <template #container>
        <div class="drawer-container">
          <!-- Drawer Header -->
          <div class="drawer-header">
            <div class="flex align-items-center justify-content-between">
              <div class="flex align-items-center gap-3">
                <div class="logo-icon-drawer">
                  <i class="pi pi-box text-white text-xl"></i>
                </div>
                <span class="font-semibold text-lg text-900">Kastomi Admin</span>
              </div>
              <Button 
                icon="pi pi-times" 
                @click="sidebarVisible = false"
                severity="secondary" 
                text 
                rounded 
                class="drawer-close-btn"
              />
            </div>
          </div>
          
          <div class="drawer-content">
        <Menu :model="menuItems" class="border-none w-full" @click="sidebarVisible = false">
          <template #item="{ item, props }">
            <router-link v-if="item.route" v-slot="{ href, navigate, isActive }" :to="item.route" custom>
              <a :href="href" v-bind="props.action" @click="navigate" 
                 class="flex align-items-center px-3 py-2 cursor-pointer border-round-lg transition-colors transition-duration-200"
                 :class="{ 'bg-primary-100 text-primary-700': isActive, 'hover:bg-gray-100': !isActive }">
                <span :class="item.icon" class="mr-3 text-lg" />
                <span class="font-medium">{{ item.label }}</span>
                <Badge v-if="item.badge" :value="item.badge" :severity="item.badgeSeverity" class="ml-auto" />
              </a>
            </router-link>
            <a v-else-if="item.url" :href="item.url" :target="item.external ? '_blank' : '_self'"
               class="flex align-items-center px-3 py-2 cursor-pointer border-round-lg transition-colors transition-duration-200 hover:bg-gray-100"
               v-bind="props.action">
              <span :class="item.icon" class="mr-3 text-lg" />
              <span class="font-medium">{{ item.label }}</span>
              <span v-if="item.external" class="pi pi-external-link ml-auto text-xs"></span>
            </a>
          </template>
        </Menu>
        
            
            <div class="drawer-footer">
              <div class="mb-3 p-3 bg-gray-50 border-round-lg">
                <div class="flex align-items-center gap-3 mb-2">
                  <div class="mobile-club-logo-wrapper">
                    <img v-if="clubLogo" :src="clubLogo" :alt="clubName" class="mobile-club-logo" />
                    <Avatar v-else :label="userInitials" shape="circle" size="large" 
                            style="background: linear-gradient(135deg, #0084ff 0%, #1e3a8a 100%); color: white" />
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-900">{{ clubName }}</div>
                    <div class="text-sm text-600">{{ userEmail }}</div>
                  </div>
                </div>
                <Tag v-if="salesChannelUrl" :value="`${salesChannelUrl}`" severity="info" class="w-full justify-content-center" />
                <Tag v-else value="Not configured" severity="warning" class="w-full justify-content-center" />
              </div>
              <Button label="Odhlásit" icon="pi pi-sign-out" @click="handleLogout" 
                      severity="danger" class="w-full" outlined />
            </div>
          </div>
        </div>
      </template>
    </Drawer>

    <!-- Desktop Layout -->
    <div class="layout-container">
      <!-- Desktop Sidebar -->
      <div class="layout-sidebar">
        <!-- Kastomi Brand Header -->
        <div class="sidebar-brand-header">
          <img src="/src/assets/Kastomi_05_powered.svg" alt="Kastomi" class="brand-logo" />
        </div>

        <div class="sidebar-content">
          <!-- Club Section -->
          <div class="club-section">
            <div class="club-logo-container">
              <img v-if="clubLogo" 
                   :src="clubLogo" 
                   :alt="clubName" 
                   class="club-logo"
                   @error="handleLogoError"
                   @load="handleLogoLoad" />
              <div v-else class="club-logo-placeholder">
                <i class="pi pi-building"></i>
              </div>
            </div>
            <h3 class="club-name-title">{{ clubName }}</h3>
            <div class="club-url-wrapper">
              <span class="club-url-text">{{ salesChannelUrl || 'Není nakonfigurován' }}</span>
              <a v-if="salesChannelUrl" 
                 :href="`https://${salesChannelUrl}`" 
                 target="_blank" 
                 class="club-url-link"
                 v-tooltip.right="'Otevřít v nové kartě'">
                <i class="pi pi-external-link"></i>
              </a>
            </div>
          </div>

          <!-- Club Info Section -->
          <div class="club-info-section" style="display: none;">
            <div class="club-info-card">
              <div class="club-icon-wrapper">
                <i class="pi pi-building club-icon"></i>
              </div>
              <div class="club-details">
                <div class="club-label">Aktivní klub</div>
                <div class="club-name-display">{{ clubName }}</div>
                <Tag v-if="salesChannelUrl" 
                     :value="`${salesChannelUrl}`" 
                     severity="success" 
                     class="club-channel-tag" />
                <Tag v-else 
                     value="Není nakonfigurován" 
                     severity="warning" 
                     class="club-channel-tag" />
              </div>
            </div>
          </div>

          <!-- Navigation Menu -->
          <div class="navigation-menu">
            <div class="menu-section-label">HLAVNÍ MENU</div>
            <div class="menu-items-wrapper">
              <template v-for="item in menuItems" :key="item.label">
                <!-- Internal route -->
                <router-link 
                  v-if="item.route"
                  :to="item.route" 
                  v-slot="{ navigate, isActive }" 
                  custom
                >
                  <a @click="navigate" 
                     class="menu-item" 
                     :class="{ 'menu-item-active': isActive }">
                    <div class="menu-item-content">
                      <span :class="item.icon" class="menu-item-icon" />
                      <span class="menu-item-label">{{ item.label }}</span>
                      <Badge v-if="item.badge" :value="item.badge" :severity="item.badgeSeverity" class="menu-item-badge" />
                    </div>
                    <div v-if="isActive" class="menu-item-indicator"></div>
                  </a>
                </router-link>
                <!-- External URL -->
                <a v-else-if="item.url" 
                   :href="item.url" 
                   :target="item.external ? '_blank' : '_self'"
                   class="menu-item">
                  <div class="menu-item-content">
                    <span :class="item.icon" class="menu-item-icon" />
                    <span class="menu-item-label">{{ item.label }}</span>
                    <span v-if="item.external" class="pi pi-external-link ml-auto text-xs opacity-60"></span>
                  </div>
                </a>
              </template>
            </div>
          </div>

          <!-- User Section at Bottom -->
          <div class="sidebar-user-section">
            <div class="user-divider"></div>
            <div class="user-info-compact">
              <Avatar :label="userInitials" 
                      shape="circle" 
                      size="normal"
                      style="background: linear-gradient(135deg, #0084ff 0%, #1e3a8a 100%); color: white" />
              <div class="user-text">
                <div class="user-email-text">{{ userEmail }}</div>
                <div class="user-role-text">Administrator</div>
              </div>
              <Button icon="pi pi-sign-out" 
                      @click="handleLogout"
                      severity="secondary" 
                      text 
                      rounded 
                      class="logout-btn-compact"
                      v-tooltip.right="'Odhlásit'" />
            </div>
          </div>

        </div>
      </div>

      <!-- Main Content Area -->
      <div class="layout-main">
        <!-- Top Bar -->
        <div class="layout-topbar">
          <div class="topbar-start">
            <Button icon="pi pi-bars" @click="sidebarVisible = true" 
                    class="lg:hidden" severity="secondary" text rounded aria-label="Menu" />
            <div class="hidden lg:block">
              <Breadcrumb :model="breadcrumbItems" class="border-none bg-transparent">
                <template #item="{ item }">
                  <router-link v-if="item.route" :to="item.route" 
                               class="text-600 hover:text-900 transition-colors transition-duration-200">
                    {{ item.label }}
                  </router-link>
                  <span v-else class="text-900 font-medium">{{ item.label }}</span>
                </template>
              </Breadcrumb>
            </div>
          </div>

          <div class="topbar-end">
            
            <Button icon="pi pi-refresh" @click="refreshPage" 
                    severity="secondary" text rounded aria-label="Refresh"
                    v-tooltip.bottom="'Obnovit'" />

            
            <!-- User Menu -->
            <Button @click="toggleUserMenu" severity="secondary" text rounded 
                    class="hidden md:inline-flex" aria-label="User menu">
              <Avatar :label="userInitials" shape="circle" size="normal"
                      style="background: linear-gradient(135deg, #0084ff 0%, #1e3a8a 100%); color: white" />
            </Button>
            <Menu ref="userMenuRef" :model="userMenuItems" :popup="true" />
          </div>
        </div>

        <!-- Page Header -->
        <div class="page-header">
          <div class="page-header-content">
            <div class="page-header-text">
              <h1 class="page-title">{{ pageTitle }}</h1>
              <p v-if="pageDescription" class="page-description">{{ pageDescription }}</p>
            </div>
            <div v-if="route.name === 'Dashboard'" class="page-header-actions">
              <div class="date-filter-group">
                <div class="date-input-group">
                  <label class="date-label">Od:</label>
                  <DatePicker 
                    v-model="dateFrom" 
                    dateFormat="dd.mm.yy"
                    showIcon
                    iconDisplay="input"
                    :manualInput="false"
                    class="compact-datepicker"
                    @date-select="handleDateChange"
                  />
                </div>
                <div class="date-input-group">
                  <label class="date-label">Do:</label>
                  <DatePicker 
                    v-model="dateTo" 
                    dateFormat="dd.mm.yy"
                    showIcon
                    iconDisplay="input"
                    :manualInput="false"
                    class="compact-datepicker"
                    @date-select="handleDateChange"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Page Content -->
        <div class="layout-content">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()
const confirm = useConfirm()

// Refs
const sidebarVisible = ref(false)
const userMenuRef = ref()
const dateFrom = ref(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
const dateTo = ref(new Date())
const dashboardLoading = ref(false)

// Menu items
const menuItems = ref([
  {
    label: 'Přehled',
    icon: 'pi pi-fw pi-home',
    route: '/prehled'
  },
  {
    label: 'Produkty',
    icon: 'pi pi-fw pi-box',
    route: '/produkty'
  },
  {
    label: 'Objednávky',
    icon: 'pi pi-fw pi-shopping-cart',
    route: '/objednavky'
  },
  {
    label: 'Dresy',
    icon: 'pi pi-fw pi-tag',
    route: '/dresy'
  },
  {
    label: 'StanApp',
    icon: 'pi pi-fw pi-money-bill',
    url: 'https://kastomi.com/stanapp',
    external: true
  }
])

// Breadcrumb items
const breadcrumbItems = computed(() => {
  const items = [
    { label: 'Home', route: '/prehled', icon: 'pi pi-home' }
  ]
  
  if (route.name === 'Products') {
    items.push({ label: 'Produkty' })
  } else if (route.name === 'Orders') {
    items.push({ label: 'Objednávky' })
  } else if (route.name === 'Dresy') {
    items.push({ label: 'Dresy' })
  }
  
  return items
})

// Computed properties
const pageTitle = computed(() => {
  const titles = {
    Dashboard: 'Dashboard',
    Products: 'Produkty',
    Orders: 'Objednávky',
    Dresy: 'Dresy'
  }
  return titles[route.name] || 'Kastomi Admin'
})

const pageDescription = computed(() => {
  const descriptions = {
    Dashboard: 'Přehled a statistiky vašeho obchodu',
    Products: 'Správa produktů a cen',
    Orders: 'Správa a zpracování objednávek',
    Dresy: 'Historie objednávek dresů a kastomizací'
  }
  return descriptions[route.name] || ''
})

const userEmail = computed(() => authStore.userEmail || 'Uživatel')
const clubName = computed(() => authStore.clubName || 'Klub')
const salesChannelUrl = computed(() => authStore.salesChannelUrl)
const clubLogo = ref(null)
const clubFavicon = ref(null)
const userInitials = computed(() => {
  const email = authStore.userEmail || ''
  return email.substring(0, 2).toUpperCase()
})

const userMenuItems = computed(() => [
  {
    label: userEmail.value,
    disabled: true,
    class: 'font-semibold'
  },
  {
    separator: true
  },
  {
    label: 'Profil',
    icon: 'pi pi-user',
    command: () => {
      toast.add({ severity: 'info', summary: 'Profil', detail: 'Profil není ještě implementován', life: 3000 })
    }
  },
  {
    label: 'Nastavení',
    icon: 'pi pi-cog',
    command: showSettings
  },
  {
    separator: true
  },
  {
    label: 'Odhlásit',
    icon: 'pi pi-sign-out',
    command: handleLogout
  }
])

// Methods
const handleLogout = () => {
  confirm.require({
    message: 'Opravdu se chcete odhlásit?',
    header: 'Potvrzení odhlášení',
    icon: 'pi pi-sign-out',
    acceptLabel: 'Ano, odhlásit',
    rejectLabel: 'Zrušit',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await authStore.signOut()
      router.push('/prihlaseni')
      toast.add({ severity: 'success', summary: 'Odhlášeno', detail: 'Byli jste úspěšně odhlášeni', life: 3000 })
    }
  })
}

const refreshPage = () => {
  window.location.reload()
}







const toggleUserMenu = (event) => {
  userMenuRef.value.toggle(event)
}

const showSettings = () => {
  toast.add({ 
    severity: 'info', 
    summary: 'Nastavení', 
    detail: 'Nastavení není ještě implementováno', 
    life: 3000 
  })
}

const handleDateChange = () => {
  // Automatically refresh dashboard when date changes
  dashboardLoading.value = true
  window.dispatchEvent(new CustomEvent('dashboard-refresh', {
    detail: {
      dateFrom: dateFrom.value,
      dateTo: dateTo.value
    }
  }))
  // Reset loading state after a delay
  setTimeout(() => {
    dashboardLoading.value = false
  }, 2000)
}

const handleLogoError = (event) => {
  console.error('Failed to load logo from:', event.target.src)
  clubLogo.value = null
}

const handleLogoLoad = (event) => {
  console.log('Successfully loaded logo from:', event.target.src)
}

// Update browser favicon
const updateBrowserFavicon = (faviconUrl) => {
  try {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll("link[rel*='icon']")
    existingLinks.forEach(link => link.remove())
    
    // Create new favicon link
    const link = document.createElement('link')
    link.type = 'image/x-icon'
    link.rel = 'shortcut icon'
    link.href = faviconUrl
    document.getElementsByTagName('head')[0].appendChild(link)
    
    // Also add as icon for better browser support
    const link2 = document.createElement('link')
    link2.type = 'image/x-icon'
    link2.rel = 'icon'
    link2.href = faviconUrl
    document.getElementsByTagName('head')[0].appendChild(link2)
    
    console.log('Browser favicon updated to:', faviconUrl)
  } catch (err) {
    console.error('Failed to update favicon:', err)
  }
}

// Refresh dashboard is now handled by handleDateChange

// Fetch sales channel data to get logo
const fetchSalesChannelData = async () => {
  try {
    console.log('Fetching sales channel data for:', authStore.salesChannelUrl)
    if (!authStore.salesChannelUrl) {
      console.log('No sales channel URL available')
      return
    }
    
    const { data, error } = await supabase.functions.invoke('get-sales-channel', {
      body: {
        sales_channel_url: authStore.salesChannelUrl
      }
    })
    
    console.log('Edge function response:', data)
    console.log('Edge function error:', error)
    
    if (error) throw error
    
    // Check different possible response structures
    let channelData = null
    
    // Try salesChannel property (actual structure from response)
    if (data?.salesChannel) {
      channelData = data.salesChannel
      console.log('Found channel data in data.salesChannel:', channelData)
    }
    // Try data.data[0] structure
    else if (data?.data?.[0]) {
      channelData = data.data[0]
      console.log('Found channel data in data.data[0]:', channelData)
    }
    // Try direct array structure
    else if (Array.isArray(data) && data[0]) {
      channelData = data[0]
      console.log('Found channel data in data[0]:', channelData)
    }
    // Try single object structure
    else if (data && typeof data === 'object' && data.logo) {
      channelData = data
      console.log('Found channel data as direct object:', channelData)
    }
    
    if (channelData) {
      // Construct the CDN URL for the logo
      if (channelData.logo) {
        const logoUrl = `https://cdn.kastomi.com/${channelData.logo}`
        console.log('Setting club logo URL:', logoUrl)
        clubLogo.value = logoUrl
      }
      if (channelData.favicon) {
        const faviconUrl = `https://cdn.kastomi.com/${channelData.favicon}`
        console.log('Setting favicon URL:', faviconUrl)
        clubFavicon.value = faviconUrl
        
        // Update the browser favicon
        updateBrowserFavicon(faviconUrl)
      }
    } else {
      console.log('No channel data found in response')
    }
  } catch (err) {
    console.error('Error fetching sales channel data:', err)
    console.error('Error details:', err.message, err.stack)
  }
}

// Watch route changes to close mobile sidebar
watch(() => route.path, () => {
  sidebarVisible.value = false
})

// Watch date changes to auto-refresh dashboard
watch([dateFrom, dateTo], () => {
  if (route.name === 'Dashboard') {
    handleDateChange()
  }
})

// Fetch club logo on mount
onMounted(() => {
  fetchSalesChannelData()
})

// Watch for sales channel URL changes
watch(() => authStore.salesChannelUrl, () => {
  fetchSalesChannelData()
})
</script>

<style scoped>
/* Layout Structure */
.layout-wrapper {
  min-height: 100vh;
  background: #f8f9fa;
  width: 100%;
  overflow-x: hidden;
}

.layout-container {
  display: flex;
  min-height: 100vh;
  width: 100%;
  position: relative;
}

/* Sidebar Styles */
.layout-sidebar {
  width: 220px;
  min-height: 100vh;
  background: white;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 999;
  display: none;
  border-right: 1px solid #e5e7eb;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.05);
}

@media (min-width: 1024px) {
  .layout-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
}

/* Sidebar Brand Header */
.sidebar-brand-header {
  height: 60px;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.brand-logo {
  height: 32px;
  width: auto;
  max-width: 80%;
  object-fit: contain;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: calc(100% - 60px);
  padding: 0.75rem;
  overflow-y: auto;
}

/* Club Section */
.club-section {
  text-align: center;
  padding: 1rem 0.25rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.club-logo-container {
  width: 60px;
  height: 60px;
  margin: 0 auto 0.75rem;
  position: relative;
}

.club-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
  background: white;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.club-logo-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #d1d5db;
}

.club-logo-placeholder i {
  font-size: 2rem;
  color: #9ca3af;
}

.club-name-title {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
  padding: 0 0.25rem;
}

.club-url-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0 0.5rem;
}

.club-url-text {
  font-size: 0.7rem;
  color: #6b7280;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.club-url-link {
  color: #3b82f6;
  font-size: 0.75rem;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.club-url-link:hover {
  background: #eff6ff;
  color: #2563eb;
  transform: scale(1.1);
}

/* Club Info Section */
.club-info-section {
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
}

.club-info-card {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.club-info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6);
  animation: colorWave 3s ease-in-out infinite;
}

@keyframes colorWave {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

.club-info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  border-color: #9ca3af;
}

.club-icon-wrapper {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.club-icon {
  font-size: 1.25rem;
  color: #3b82f6;
}

.club-details {
  flex: 1;
  min-width: 0;
}

.club-label {
  font-size: 0.625rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.club-name-display {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.club-channel-tag {
  font-size: 0.625rem !important;
  padding: 0.125rem 0.375rem !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  display: inline-block;
}

/* Navigation Menu */
.navigation-menu {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.menu-section-label {
  font-size: 0.625rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 0.625rem;
  margin-bottom: 0.5rem;
}

.menu-items-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.625rem;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #4b5563;
  text-decoration: none;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.menu-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 100%;
  background: rgba(102, 126, 234, 0.05);
  transition: width 0.3s;
}

.menu-item:hover::before {
  width: 100%;
}

.menu-item:hover {
  background: #f9fafb;
  color: #111827;
  transform: translateX(2px);
}

.menu-item-active {
  background: linear-gradient(135deg, #0084ff 0%, #1e3a8a 100%);
  color: white !important;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.menu-item-active:hover {
  transform: translateX(0);
  background: linear-gradient(135deg, #0084ff 0%, #1e3a8a 100%);
}

.menu-item-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  z-index: 1;
}

.menu-item-icon {
  font-size: 1rem;
  width: 18px;
  text-align: center;
}

.menu-item-label {
  font-weight: 500;
  font-size: 0.8125rem;
  flex: 1;
  margin-left: 0.25rem;
}

.menu-item-badge {
  font-size: 0.625rem !important;
  padding: 0.125rem 0.375rem !important;
  min-width: 1.25rem !important;
  height: 1.125rem !important;
  line-height: 0.875rem !important;
}

.menu-item-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: white;
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}


/* Main Content Area */
.layout-main {
  margin-left: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  transition: margin-left 0.3s ease;
}

@media (min-width: 1024px) {
  .layout-main {
    margin-left: 220px;
    width: calc(100% - 220px);
  }
}

/* Topbar */
.layout-topbar {
  height: 64px;
  padding: 0 1.5rem;
  background: white;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 998;
  width: 100%;
}

.topbar-start {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.topbar-end {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Page Header */
.page-header {
  padding: 1.25rem 1.5rem 0.75rem;
  background: white;
  border-bottom: 1px solid #dee2e6;
  width: 100%;
}

.page-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.page-header-text {
  flex-shrink: 0;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
}

.page-description {
  margin: 0.25rem 0 0;
  color: #6c757d;
  font-size: 0.875rem;
}

.page-header-actions {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.date-filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.date-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
}

.compact-datepicker {
  width: 140px !important;
}

.compact-datepicker :deep(input) {
  height: 2rem !important;
  padding: 0.375rem 0.5rem !important;
  font-size: 0.8125rem !important;
}

.compact-datepicker :deep(.p-datepicker-trigger) {
  width: 2rem !important;
}

.compact-button {
  padding: 0.5rem 0.75rem;
  height: 2rem;
}

@media (max-width: 768px) {
  .page-header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .page-header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .date-filter-group {
    flex-wrap: wrap;
  }
}

/* Content Area */
.layout-content {
  flex: 1;
  padding: 1.25rem;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .layout-content {
    padding: 0.75rem;
  }
}

/* Mobile Drawer */
:deep(.sidebar-mobile) {
  width: 280px !important;
}

:deep(.sidebar-mobile .p-drawer-header) {
  display: none !important;
}

:deep(.sidebar-mobile .p-drawer-content) {
  padding: 0 !important;
  height: 100%;
}

.drawer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.drawer-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.logo-icon-drawer {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #0084ff 0%, #1e3a8a 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawer-close-btn {
  width: 32px !important;
  height: 32px !important;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
}

.drawer-footer {
  margin-top: auto;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.mobile-club-logo-wrapper {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.mobile-club-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  background: white;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Badge positioning */
.p-overlay-badge {
  position: relative;
}

.p-overlay-badge .p-badge {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Custom scrollbar for navigation */
.navigation-menu::-webkit-scrollbar {
  width: 4px;
}

.navigation-menu::-webkit-scrollbar-track {
  background: transparent;
}

.navigation-menu::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 10px;
}

.navigation-menu::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}

/* User Section at Bottom */
.sidebar-user-section {
  margin-top: auto;
  padding: 0 0.5rem;
}

.user-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
  margin: 1rem 0;
}

.user-info-compact {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.2s;
}

.user-info-compact:hover {
  background: #f3f4f6;
}

.user-text {
  flex: 1;
  min-width: 0;
}

.user-email-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role-text {
  font-size: 0.625rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.logout-btn-compact {
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
}

/* PrimeVue component overrides */
:deep(.p-menu .p-menuitem-link) {
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

:deep(.p-button-text) {
  color: #6c757d;
}

:deep(.p-button-text:hover) {
  background: rgba(0, 0, 0, 0.04);
  color: #495057;
}
</style>
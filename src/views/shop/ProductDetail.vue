<template>
  <div class="product-detail">
    <Toast />
    <div class="container">
      <!-- Breadcrumb -->
      <div class="row" style="padding-bottom: 18px;">
        <p>
          <router-link to="/shop" class="breadcrumb__item">{{ salesChannel?.name || 'Shop' }}</router-link>
          <a v-if="product?.categories?.[0]" :href="`/shop#cat${product.categories[0].id}`" class="breadcrumb__item">
            {{ product.categories[0].name }}
          </a>
          <span class="breadcrumb__item">{{ product?.name }}</span>
        </p>
      </div>

      <!-- Product Content -->
      <div v-if="product">
        <div class="detail-top">
        <!-- Photos Column -->
        <div class="detail-photos" style="position: relative">
          <a v-if="mainImage" :href="getImageUrl(mainImage)" data-lightbox="photos" id="main-image-link" style="position: relative">
            <img :src="getImageUrl(mainImage)" id="main-image" class="detail-product-image" />
          </a>
          
          <!-- Additional images row -->
          <div class="photo-row">
            <div v-for="(image, index) in additionalImages" :key="index">
              <a :href="getImageUrl(image)" data-lightbox="photos">
                <img class="detail-product-image" :src="getImageUrl(image)">
              </a>
            </div>
          </div>
        </div>

        <!-- Info Column -->
        <div class="detail-info">
          <div>
            <h2>{{ product.name }}</h2>
          </div>

          <br>

          <div class="sales-offer-div">
            <div style="width: 100%">
              <div id="obal_kosik" class="tabcontent left active">

                <!-- Hidden variant table for filtering -->
                <table style="display: none;" class="table">
                  <tr v-for="variant in product.variants" :key="variant.id" 
                      class="rowTab varianta_obal" 
                      :data-varianta-id="variant.id"
                      :data-velikost="variant.size"
                      :data-barva_hex="variant.color_hex"
                      :data-pohlavi="variant.gender">
                    <td>
                      <input :checked="product.variants.length === 1" 
                             style="margin-left: 10px;" 
                             type="radio" 
                             name="sales_offer_variant_id" 
                             :value="variant.id" />
                      <label>{{ variant.size || variant.variant }}</label>
                    </td>
                  </tr>
                </table>

                <!-- Variant filters -->
                <div v-if="hasVariants">
                  <!-- Size filter -->
                  <div v-if="variantGroups.size?.length > 0">
                    <span style="font-weight: bold; float: left; margin: 10px 10px 0px 0px; padding: 10px 10px 0px 0px;">Velikost</span>
                    <br style="clear: both" />
                    <span v-for="size in variantGroups.size" :key="size"
                          class="parametr parametr_aktivni"
                          :data-hodnota="size"
                          data-parametr="velikost"
                          @click="selectFilter('size', size)">
                      {{ size }}
                    </span>
                    <br style="clear: both" />
                  </div>

                  <!-- Color filter -->
                  <div v-if="variantGroups.color?.length > 0">
                    <span style="font-weight: bold; float: left; margin: 10px 10px 0px 0px; padding: 10px 10px 0px 0px;">Barva</span>
                    <br style="clear: both" />
                    <span v-for="color in variantGroups.color" :key="color.name"
                          class="parametr parametr_barva parametr_aktivni"
                          :style="{ background: color.hex }"
                          :data-hodnota="color.hex"
                          data-parametr="barva_hex"
                          @click="selectFilter('color', color.name)">
                    </span>
                    <br style="clear: both" />
                  </div>

                  <a v-if="showResetFilters" id="zrusitFiltry" @click="resetFilters" style="font-size: 76%" class="btn btn-warning btn-sm">
                    <i style="font-size: 80%;" class="fas fa-sync"></i> Začít s výběrem parametrů znovu
                  </a>
                  <br style="clear: both" />
                </div>

              </div>

              <!-- Availability section -->
              <div id="obal_dostupnost" style="text-align: center; border-top: 1px solid #f0f0f0; font-weight: bold; font-size: 100%; clear: both; padding: 20px 0px;">
                <span id="dostupnost">
                  <span v-if="!selectedVariant" style="font-style: italic; font-weight: normal; font-size: 80%">Pro zobrazení dostupnosti vyberte variantu.</span>
                  <span v-else-if="currentVariantAvailability" :style="{ color: currentVariantAvailabilityColor }">
                    {{ currentVariantAvailability }}
                  </span>
                  <span v-else style="color: #10b981;">Skladem</span>
                </span>
                <br />
              </div>

              <!-- Price section -->
              <div id="obal_cena" style="text-align: center; border-top: 1px solid #f0f0f0; font-weight: bold; font-size: 150%; clear: both; padding: 20px 0px;">
                <div v-if="!editMode">
                  Cena <span :data-cena="product.price" id="cena">{{ product.price }}</span> Kč
                </div>
                
                <!-- Edit mode price editing -->
                <div v-if="editMode">
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="font-size: 18px; margin-bottom: 15px; color: #333;">Cenová kalkulace</h3>
                    <div style="background: white; padding: 15px; border-radius: 4px;">
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <label style="font-size: 14px; color: #666;">Velkoobchodní cena:</label>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <input 
                            type="number" 
                            v-model.number="editPrices.wholesale"
                            @change="updatePrices"
                            style="width: 120px; padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; text-align: right;"
                          >
                          <span>Kč</span>
                        </div>
                      </div>
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <label style="font-size: 14px; color: #666;">Klubová podpora:</label>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <input 
                            type="number" 
                            v-model.number="editPrices.support"
                            @change="updatePrices"
                            style="width: 120px; padding: 6px 10px; border: 1px solid #10b981; border-radius: 4px; text-align: right;"
                          >
                          <span>Kč</span>
                        </div>
                      </div>
                      <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid #e5e7eb; font-weight: bold;">
                        <label style="font-size: 14px;">Koncová cena:</label>
                        <div>
                          <span style="font-size: 16px; font-weight: bold; color: #333;">{{ editPrices.wholesale + editPrices.support }} Kč</span>
                        </div>
                      </div>
                      <button @click="savePrices" :disabled="saving"
                              style="width: 100%; margin-top: 15px; padding: 10px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;"
                              :style="saving ? 'opacity: 0.6; cursor: not-allowed;' : 'hover: background: #5a67d8;'">
                        <i v-if="saving" class="pi pi-spin pi-spinner"></i>
                        <i v-else class="pi pi-save"></i>
                        {{ saving ? 'Ukládám...' : 'Uložit ceny' }}
                      </button>
                    </div>
                  </div>
                  
                  <!-- Product Status Toggle -->
                  <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                      <label>Aktivní na e-shopu:</label>
                      <label class="switch">
                        <input 
                          type="checkbox" 
                          :checked="product.active_channel === 1"
                          @change="toggleProductStatus"
                          :disabled="product.sales_offer_status_id > 2"
                        >
                        <span class="slider round"></span>
                      </label>
                      <span v-if="product.sales_offer_status_id > 2" style="color: #ef4444; font-size: 13px;">
                        (Produkt je deaktivován v Kastomi systému)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Add to cart section (non-edit mode) -->
              <div v-if="!editMode" class="counter-col" style="justify-content: center;">
                <span class="minus"><img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNNSAxMkgxOSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=" alt="Minus"></span>
                <div class="counter-number">
                  <input name="pocet" type="text" placeholder="1" v-model="quantity" class="form-control" id="qty" />
                  <span class="counter-unit">ks</span>
                </div>
                <span class="plus" style="margin-right: 35px;">
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTIgNVYxOSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDxwYXRoIGQ9Ik01IDEySDE5IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==" alt="Plus">
                </span>
                <button id="pridat" class="hp-button" style="margin-bottom: 20px;" @click="addToCart">
                  <span class="btn-text">Přidat do košíku</span>
                </button>
              </div>

              <!-- Discount info -->
              <div class="discount" id="discount" :class="{ open: quantity > 4 }">
                <div class="discount-content">
                  <strong>Množstevní sleva</strong>
                  <p>Objednáváte více než 10 kusů?<br>Napište nám na <a href="mailto: info@kastomi.com" style="text-decoration: underline;">info@kastomi.com</a> a získejte individuální nabídku.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
        </div>

        <!-- Tabs section -->
        <div class="detail-bottom" id="tab-2">
          <div class="tab">
            <p class="tab-right" id="salesOfferId">ID {{ product.id }}</p>
            <button type="button" class="tablinks active" @click="openTab($event, 'info', 'tab-2')" id="defaultOpen-2">Popis</button>
          </div>

          <div id="info" class="tabcontent active">
            <div v-if="product.description" style="text-align: left; margin-right: auto" v-html="product.description"></div>
            <div style="padding-top: 20px; width: 100%; margin-right: auto">
              <h4>Další informace</h4>
              <table class="table" style="margin-top: 24px;">
                <tbody>
                  <tr v-for="param in visibleParams" :key="param.id">
                    <td><strong>{{ param.name }}</strong></td>
                    <td>{{ param.value }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <p>Načítání produktu...</p>
      </div>

      <!-- Error State -->
      <div v-else class="error-state">
        <i class="pi pi-exclamation-triangle"></i>
        <h3>Produkt nenalezen</h3>
        <router-link to="/shop" class="btn-back">Zpět na produkty</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import Toast from 'primevue/toast'

const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()

// Inject edit mode from parent
const editMode = inject('editMode', ref(false))

// State
const loading = ref(false)
const saving = ref(false)
const product = ref(null)
const selectedVariant = ref(null)
const selectedFilters = ref({
  size: null,
  color: null
})
const mainImage = ref('')
const additionalImages = ref([])
const editPrices = ref({
  wholesale: 0,
  support: 0
})
const quantity = ref(1)
const showResetFilters = ref(false)
const filterCount = ref(0)

// Sales channel
const salesChannel = computed(() => ({
  name: authStore.clubName || 'Shop'
}))

// Computed
const hasVariants = computed(() => {
  return product.value?.variants && product.value.variants.length > 1
})

const variantGroups = computed(() => {
  if (!product.value?.variants) return {}
  
  const groups = {
    size: [],
    color: []
  }
  
  // Extract unique sizes
  const sizes = new Set()
  product.value.variants.forEach(v => {
    if (v.size) sizes.add(v.size)
  })
  groups.size = Array.from(sizes)
  
  // Extract unique colors
  const colors = new Map()
  product.value.variants.forEach(v => {
    if (v.color) {
      // Check for color hex in params
      let hex = '#cccccc'
      if (v.params) {
        const hexParam = v.params.find(p => p.param?.name === 'Barva - HEX')
        if (hexParam) hex = hexParam.val
      }
      colors.set(v.color, { name: v.color, hex })
    }
  })
  groups.color = Array.from(colors.values())
  
  return groups
})

const filteredVariants = computed(() => {
  if (!product.value?.variants) return []
  
  return product.value.variants.filter(v => {
    let show = true
    if (selectedFilters.value.size && v.size !== selectedFilters.value.size) show = false
    if (selectedFilters.value.color && v.color !== selectedFilters.value.color) show = false
    return show
  })
})

const visibleParams = computed(() => {
  if (!product.value?.params) return []
  return product.value.params.filter(p => p.show && p.value)
})

const currentVariantAvailability = computed(() => {
  if (!selectedVariant.value || !product.value?.variants) return null
  const variant = product.value.variants.find(v => v.id === selectedVariant.value)
  if (!variant?.params) return null
  const availParam = variant.params.find(p => p.param?.internal === 'dostupnost')
  return availParam?.val || null
})

const currentVariantAvailabilityColor = computed(() => {
  if (!selectedVariant.value || !product.value?.variants) return '#10b981'
  const variant = product.value.variants.find(v => v.id === selectedVariant.value)
  if (!variant?.params) return '#10b981'
  const colorParam = variant.params.find(p => p.param?.internal === 'dostupnost_barva')
  return colorParam?.val || '#10b981'
})

// Methods
const fetchProduct = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase.functions.invoke('get-product-detail', {
      body: { seo: route.params.seo }
    })
    
    if (error) throw error
    
    if (data && data.product) {
      product.value = data.product
      mainImage.value = data.product.main_image
      additionalImages.value = data.product.images?.filter(img => img !== data.product.main_image) || []
      
      // Initialize edit prices
      editPrices.value = {
        wholesale: data.product.wholesale_price || 0,
        support: data.product.klub_price || (data.product.price - data.product.wholesale_price) || 0
      }
      
      // Auto-select if only one variant
      if (data.product.variants?.length === 1) {
        selectedVariant.value = data.product.variants[0].id
      }
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    toast.add({
      severity: 'error',
      summary: 'Chyba',
      detail: 'Nepodařilo se načíst produkt',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const getImageUrl = (image) => {
  if (!image) return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZTJlOGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+CiAgICBObyBJbWFnZQogIDwvdGV4dD4KPC9zdmc+'
  if (image.startsWith('http')) return image
  return `https://cdn.kastomi.com/${image}`
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('cs-CZ').format(price)
}

const selectFilter = (type, value) => {
  // Toggle filter
  if (selectedFilters.value[type] === value) {
    selectedFilters.value[type] = null
    filterCount.value--
  } else {
    selectedFilters.value[type] = value
    filterCount.value++
  }
  
  showResetFilters.value = filterCount.value > 1
  
  // Update DOM elements to match filter state
  updateFilterUI(type, value)
  
  // If only one variant is visible after filtering, select it
  if (filteredVariants.value.length === 1) {
    selectedVariant.value = filteredVariants.value[0].id
  }
}

const updateFilterUI = (type, value) => {
  // Update parametr classes based on selection
  const elements = document.querySelectorAll(`[data-parametr="${type === 'size' ? 'velikost' : 'barva_hex'}"]`)
  elements.forEach(el => {
    el.classList.remove('zvoleny_parametr')
    if ((type === 'size' && el.dataset.hodnota === value) ||
        (type === 'color' && el.dataset.hodnota === variantGroups.value.color?.find(c => c.name === value)?.hex)) {
      el.classList.add('zvoleny_parametr')
    }
  })
}

const resetFilters = () => {
  selectedFilters.value = { size: null, color: null }
  filterCount.value = 0
  showResetFilters.value = false
  selectedVariant.value = null
  
  // Reset all filter UI
  const elements = document.querySelectorAll('.parametr')
  elements.forEach(el => {
    el.classList.remove('zvoleny_parametr')
    el.classList.remove('parametr_neaktivni')
    el.classList.add('parametr_aktivni')
  })
}

const isVariantVisible = (variant) => {
  if (selectedFilters.value.size && variant.size !== selectedFilters.value.size) return false
  if (selectedFilters.value.color && variant.color !== selectedFilters.value.color) return false
  return true
}

const updatePrices = () => {
  // Recalculate total when changing inputs
  // Total is calculated automatically from wholesale + support
}

const savePrices = async () => {
  saving.value = true
  try {
    const { data, error } = await supabase.functions.invoke('update-sales-offer', {
      body: { 
        id: Number(product.value.id),
        wholesale_price: editPrices.value.wholesale,
        klub_price: editPrices.value.support,
        text: product.value.description || '',
        active: product.value.active_channel,
        sales_channel_url: authStore.salesChannelUrl
      }
    })
    
    if (error) throw error
    
    // Update local values
    product.value.wholesale_price = editPrices.value.wholesale
    product.value.klub_price = editPrices.value.support
    product.value.price = editPrices.value.wholesale + editPrices.value.support
    
    toast.add({
      severity: 'success',
      summary: 'Uloženo',
      detail: 'Ceny byly aktualizovány',
      life: 2000
    })
  } catch (error) {
    console.error('Error saving prices:', error)
    toast.add({
      severity: 'error',
      summary: 'Chyba',
      detail: 'Nepodařilo se uložit ceny',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const toggleProductStatus = async (event) => {
  const newStatus = event.target.checked ? 1 : 0
  
  try {
    const { data, error } = await supabase.functions.invoke('update-sales-offer', {
      body: { 
        id: Number(product.value.id),
        wholesale_price: product.value.wholesale_price || 0,
        klub_price: product.value.klub_price || (product.value.price - product.value.wholesale_price) || 0,
        text: product.value.description || '',
        active: newStatus,
        sales_channel_url: authStore.salesChannelUrl
      }
    })
    
    if (error) throw error
    
    product.value.active_channel = newStatus
    
    toast.add({
      severity: 'success',
      summary: 'Uloženo',
      detail: `Produkt byl ${newStatus === 1 ? 'aktivován' : 'deaktivován'}`,
      life: 2000
    })
  } catch (error) {
    console.error('Error updating status:', error)
    toast.add({
      severity: 'error',
      summary: 'Chyba',
      detail: 'Nepodařilo se změnit stav produktu',
      life: 3000
    })
    event.target.checked = !event.target.checked
  }
}

const addToCart = () => {
  if (!selectedVariant.value && hasVariants.value) {
    toast.add({
      severity: 'warn',
      summary: 'Vyberte variantu',
      detail: 'Vyberte si prosím parametry produktu',
      life: 3000
    })
    return
  }
  
  // Add to cart logic would go here
  toast.add({
    severity: 'success',
    summary: 'Přidáno do košíku',
    detail: 'Produkt byl přidán do košíku',
    life: 2000
  })
}

const openTab = (evt, tabName, tabId) => {
  const tabElement = document.getElementById(tabId)
  if (!tabElement) return
  
  const tabcontent = tabElement.getElementsByClassName('tabcontent')
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].classList.remove('active')
  }
  
  const tablinks = tabElement.getElementsByClassName('tablinks')
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove('active')
  }
  
  document.getElementById(tabName).classList.add('active')
  evt.currentTarget.classList.add('active')
}

// Lifecycle
onMounted(() => {
  fetchProduct()
  
  // Handle quantity plus/minus buttons
  document.addEventListener('click', (e) => {
    if (e.target.closest('.plus')) {
      quantity.value++
    } else if (e.target.closest('.minus') && quantity.value > 1) {
      quantity.value--
    }
  })
})
</script>

<style scoped>
/* Import shop styles */
@import '@/assets/css/zaklad.css';

/* Breadcrumb */
.breadcrumb__item {
  color: #666;
  text-decoration: none;
  transition: color 0.3s ease;
}

.breadcrumb__item:hover {
  color: #ee033c;
  text-decoration: underline;
}

.breadcrumb__item:not(:last-child)::after {
  content: " / ";
  color: #999;
  margin: 0 8px;
}

/* Detail Layout - matching Latte exactly */
.detail-top {
  display: flex;
  gap: 40px;
  margin-top: 20px;
}

/* Photos Column */
.detail-photos {
  flex: 1;
  position: relative;
}

.detail-product-image {
  width: 100%;
  height: auto;
}

#main-image {
  width: 100%;
  height: auto;
}

.photo-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.photo-row > div {
  width: calc(25% - 7.5px);
}

.photo-row img {
  width: 100%;
  height: auto;
  cursor: pointer;
}

/* Info Column */
.detail-info {
  flex: 1;
}

.detail-info h2 {
  font-size: 28px;
  margin-bottom: 20px;
  color: #333;
  font-weight: 500;
}

/* Price Section */
.detail-price {
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.price {
  font-size: 28px;
  font-weight: bold;
  color: #ee033c;
}

/* Edit Mode Price Editor */
.price-editor-section h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
}

.price-editor {
  background: white;
  padding: 15px;
  border-radius: 4px;
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.price-row label {
  font-size: 14px;
  color: #666;
}

.price-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-input {
  width: 120px;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: right;
}

.price-input.support {
  border-color: #10b981;
}

.price-row.total {
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  font-weight: bold;
}

.price-display {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.btn-save-prices {
  width: 100%;
  margin-top: 15px;
  padding: 10px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.3s ease;
}

.btn-save-prices:hover:not(:disabled) {
  background: #5a67d8;
}

.btn-save-prices:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Status Section */
.status-section {
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 15px;
}

.status-info {
  color: #ef4444;
  font-size: 13px;
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

input:disabled + .slider {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sales offer div */
.sales-offer-div .tabcontent {
  border-radius: 15px !important;
  margin: 0 !important;
}

/* Parametr filters - matching Latte exactly */
.parametr {
  border: 2px solid #000;
  padding: 10px;
  margin: 10px 4px;
  border-radius: 10px;
  float: left;
  cursor: pointer;
  transition: background 0.3s, color 0.3s;
}

.parametr:hover {
  background: black;
  color: white;
}

.parametr:hover i,
.parametr:hover img, .zvoleny_parametr img {
  color: white;
  filter: grayscale(1) invert(1);
}

#obal_kosik {
  display: block;
}

.parametr_aktivni {
  background: white;
  color: black;
  border-color: black;
  pointer-events: auto;
  opacity: 1.0;
}

.parametr_neaktivni {
  background: #f0f0f0;
  color: grey;
  border-color: grey;
  pointer-events: none;
  opacity: 0.3;
}

.parametr_barva.parametr_neaktivni {
  background: repeating-linear-gradient(
    45deg,
    #888888,
    #888888 10px,
    #666666 10px,
    #666666 20px
  ) !important;
}

.parametr_barva {
  width: 40px;
  height: 40px;
  position: relative;
}

.zvoleny_parametr {
  background: black;
  color: white;
  transform: translateY(-10px);
  transition: all 0.4s ease-in-out;
}

.zvoleny_parametr::after {
  content: '';
  width: 100%;
  height: 2px;
  background: #000;
  position: absolute;
  bottom: -15px;
  left: 0;
}

#zrusitFiltry {
  display: none;
  margin-top: 6px;
  border-radius: 10px;
}

#zrusitFiltry.open {
  display: inline-block;
}

/* Counter and add to cart */
.counter-col {
  display: flex;
  align-items: center;
  margin: 20px 0;
}

.counter-number {
  display: flex;
  align-items: center;
  margin: 0 15px;
}

.counter-number input {
  width: 60px;
  text-align: center;
  border: 1px solid #ddd;
  padding: 5px;
  border-radius: 4px;
}

.counter-unit {
  margin-left: 5px;
}

.minus, .plus {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
}

.minus img, .plus img {
  width: 20px;
  height: 20px;
}

.hp-button {
  background: var(--secondary-color, #c7022e);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s ease;
}

.hp-button:hover {
  background: var(--primary-color, #ee033c);
}

.btn-text {
  font-weight: 500;
}

/* Discount box */
.discount {
  display: none;
  background: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.discount.open {
  display: block;
}

.discount-content strong {
  color: #856404;
  display: block;
  margin-bottom: 10px;
}

.discount-content p {
  color: #856404;
  margin: 0;
}

/* Tabs section */
.detail-bottom {
  margin-top: 40px;
}

.tab {
  overflow: hidden;
  border: 1px solid #ccc;
  background-color: #f1f1f1;
  position: relative;
}

.tab button {
  background-color: inherit;
  float: left;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 14px 16px;
  transition: 0.3s;
  font-size: 17px;
}

.tab button:hover {
  background-color: #ddd;
}

.tab button.active {
  background-color: #ccc;
}

.tab-right {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  font-size: 14px;
  color: #666;
}

.tabcontent {
  display: none;
  padding: 20px;
  border: 1px solid #ccc;
  border-top: none;
  background: white;
}

.tabcontent.active {
  display: block;
}

.tabcontent h4 {
  margin-top: 20px;
  margin-bottom: 15px;
  font-size: 18px;
  color: #333;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table td {
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.table td:first-child {
  width: 40%;
  font-weight: 500;
  color: #333;
}

.table td:last-child {
  color: #666;
}

/* States */
.loading-state,
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.loading-state i,
.error-state i {
  font-size: 48px;
  margin-bottom: 20px;
  display: block;
}

.error-state i {
  color: #ef4444;
}

.btn-back {
  display: inline-block;
  margin-top: 20px;
  padding: 10px 20px;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.btn-back:hover {
  background: #5a67d8;
}

/* Responsive */
@media (max-width: 768px) {
  .detail-top {
    flex-direction: column;
  }
  
  .detail-photos {
    position: static;
  }
  
  .photo-row > div {
    width: calc(50% - 5px);
  }
}
</style>
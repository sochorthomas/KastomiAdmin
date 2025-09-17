<template>
  <section class="eshop_section">
    <Toast />
    
    <!-- Filters Section -->
    <div class="filters">
      <div id="filter-opener" @click="toggleFilters">
        <i class="pi pi-filter"></i> Filtry
      </div>
      
      <div :style="{ display: showFilters ? 'block' : 'none' }">
        <!-- Search -->
        <form class="search">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Co hledáte?"
            @input="filterProducts"
          >
          <button type="button" @click="filterProducts">
            <i class="pi pi-search"></i>
          </button>
        </form>
        
        <!-- Categories -->
        <div class="product-category__menu" v-if="categories.length > 0">
          <span>Kategorie</span>
        </div>
        <div class="col-12">
          <button 
            v-for="category in categories" 
            :key="category.id"
            @click="selectCategory(category.id)"
            :class="['filter-value', { 'selected-category': selectedCategory === category.id }]"
          >
            {{ category.name }}
          </button>
        </div>
        
        <!-- Reset Filters -->
        <button v-if="hasActiveFilters" @click="resetFilters" class="reset">
          Zrušit filtry ✕
        </button>
      </div>
    </div>

    <!-- Products Grid -->
    <div class="products">
      <!-- Loading State -->
      <div v-if="loading" style="grid-column: 1/-1; text-align: center; padding: 60px;">
        <i class="pi pi-spin pi-spinner" style="font-size: 48px;"></i>
        <p>Načítání produktů...</p>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="filteredProducts.length === 0" style="grid-column: 1/-1; text-align: center; padding: 60px;">
        <i class="pi pi-inbox" style="font-size: 48px;"></i>
        <h3>Žádné produkty nebyly nalezeny</h3>
        <p>Zkuste upravit filtry nebo vyhledávání</p>
      </div>
      
      <!-- Product Cards -->
      <div 
        v-for="product in filteredProducts" 
        :key="product.id"
        class="product"
        @click="!editMode && goToProduct(product.seo)"
        :style="editMode ? 'cursor: default;' : 'cursor: pointer;'"
      >
        <!-- Gender Icons -->
        <div class="gender-icons" v-if="getGenderIcons(product).length > 0">
          <img 
            v-for="icon in getGenderIcons(product)" 
            :key="icon.type"
            :src="`https://kastomi.kastomi.com/images/${icon.type}.svg`"
            :alt="icon.alt"
            :title="icon.title"
          >
        </div>
        
        <!-- Product Image -->
        <div class="product-image">
          <img 
            :src="getProductImage(product)" 
            :alt="product.name"
            @error="handleImageError"
          >
          <div class="product-overlay">
            <p>Dostupné varianty:<br>
              <strong>{{ getAvailableSizes(product) }}</strong>
            </p>
          </div>
        </div>
        
        <!-- Product Content -->
        <div class="col-start">
          <h3 class="product-name">{{ product.name }}</h3>
          
          <!-- Normal Price Display -->
          <div v-if="!editMode" class="flex-row">
            <p class="product-price">
              <strong>{{ formatPrice(product.price) }} Kč</strong>
            </p>
          </div>
          
          <!-- Edit Mode Prices -->
          <div v-else style="width: 100%; margin: 10px 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
              <label style="font-size: 12px;">Velkoobchod:</label>
              <div style="display: flex; align-items: center; gap: 5px;">
                <input 
                  type="number" 
                  :value="product.wholesale_price"
                  @click.stop
                  @change="updatePrice(product, 'wholesale_price', $event)"
                  style="width: 70px; padding: 2px 5px; border: 1px solid #ddd; border-radius: 4px; text-align: right;"
                >
                <span style="font-size: 12px;">Kč</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
              <label style="font-size: 12px;">Podpora:</label>
              <div style="display: flex; align-items: center; gap: 5px;">
                <input 
                  type="number" 
                  :value="product.price - product.wholesale_price"
                  @click.stop
                  @change="updateSupport(product, $event)"
                  style="width: 70px; padding: 2px 5px; border: 1px solid #10b981; border-radius: 4px; text-align: right;"
                >
                <span style="font-size: 12px;">Kč</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 5px; border-top: 1px solid #ddd;">
              <label style="font-size: 12px; font-weight: bold;">Koncová:</label>
              <div style="display: flex; align-items: center; gap: 5px;">
                <input 
                  type="number" 
                  :value="product.price"
                  @click.stop
                  @change="updatePrice(product, 'price', $event)"
                  style="width: 70px; padding: 2px 5px; border: 1px solid #667eea; border-radius: 4px; text-align: right; font-weight: bold;"
                >
                <span style="font-size: 12px; font-weight: bold;">Kč</span>
              </div>
            </div>
          </div>
          
          <!-- Color Variants -->
          <div v-if="product.color_variants" class="product-color">
            <span 
              v-for="color in product.color_variants" 
              :key="color.hex"
              class="color-box"
              :style="{ background: color.hex }"
              :title="color.name"
              @mouseover="changeProductImage(product, color.image)"
              @mouseleave="resetProductImage(product)"
            ></span>
          </div>
          
          <!-- Availability -->
          <div class="sklad">
            <span v-if="product.supplier === 'Unihoc'" class="orange">
              Dodání od firmy Unihoc
            </span>
            <span v-else-if="product.availability" :style="{ color: product.availability_color }">
              {{ product.availability }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Scroll to top button -->
    <div 
      id="scroll-top-btn"
      v-show="showScrollTop" 
      @click="scrollToTop"
      :style="{ display: showScrollTop ? 'block' : 'none' }"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l-8 8h6v12h4V10h6z"/>
      </svg>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

// Inject edit mode from parent
const editMode = inject('editMode', ref(false))

// State
const loading = ref(false)
const products = ref([])
const filteredProducts = ref([])
const categories = ref([])
const selectedCategory = ref(null)
const searchQuery = ref('')
const showFilters = ref(false)
const showScrollTop = ref(false)
const productImages = ref({})

// Computed
const hasActiveFilters = computed(() => {
  return selectedCategory.value || searchQuery.value
})

// Methods
const fetchProducts = async () => {
  console.log('fetchProducts called with salesChannelUrl:', authStore.salesChannelUrl)
  loading.value = true
  try {
    if (!authStore.salesChannelUrl) {
      console.error('Sales channel URL není k dispozici')
      products.value = []
      filteredProducts.value = []
      return
    }
    
    console.log('Invoking get-sales-offers...')
    const { data, error } = await supabase.functions.invoke('get-sales-offers', {
      body: {
        sales_channel_url: authStore.salesChannelUrl
      }
    })
    
    if (error) throw error
    
    console.log('Received products:', data)
    products.value = data.offers || []
    filteredProducts.value = products.value
    
    // Process products to extract categories and images
    const uniqueCategories = new Set()
    products.value.forEach(product => {
      // Initialize product images
      if (product.variants && product.variants.length > 0) {
        const firstVariantImage = product.variants[0].variant_image
        productImages.value[product.id] = firstVariantImage ? 
          `https://cdn.kastomi.com/files/${firstVariantImage}` : 
          '/placeholder.png'
      }
      
      // Extract categories (if available in product data)
      if (product.categories) {
        product.categories.forEach(cat => uniqueCategories.add(cat))
      }
    })
    
    categories.value = Array.from(uniqueCategories)
    
    // Apply initial filtering
    filterProducts()
  } catch (error) {
    console.error('Error fetching products:', error)
    toast.add({
      severity: 'error',
      summary: 'Chyba',
      detail: 'Nepodařilo se načíst produkty',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const filterProducts = () => {
  let filtered = [...products.value]
  
  // Filter by category
  if (selectedCategory.value) {
    filtered = filtered.filter(p => 
      p.categories && p.categories.some(c => c.id === selectedCategory.value)
    )
  }
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query))
    )
  }
  
  // Filter out inactive products
  filtered = filtered.filter(p => p.sales_offer_status_id !== 3 && p.active_channel === 1)
  
  filteredProducts.value = filtered
}

const selectCategory = (categoryId) => {
  selectedCategory.value = selectedCategory.value === categoryId ? null : categoryId
  filterProducts()
}

const resetFilters = () => {
  selectedCategory.value = null
  searchQuery.value = ''
  filterProducts()
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const goToProduct = (seo) => {
  router.push(`/product/${seo}`)
}

const getProductImage = (product) => {
  // Check if we have a cached image for this product
  if (productImages.value[product.id]) {
    return productImages.value[product.id]
  }
  
  // Try to get image from first variant
  if (product.variants && product.variants.length > 0 && product.variants[0].variant_image) {
    const image = product.variants[0].variant_image
    return image.startsWith('http') ? image : `https://cdn.kastomi.com/files/${image}`
  }
  
  return '/placeholder.png'
}

const changeProductImage = (product, imageFile) => {
  if (imageFile) {
    productImages.value[product.id] = `https://bob.kastomi.com/files/${imageFile}`
  }
}

const resetProductImage = (product) => {
  productImages.value[product.id] = product.main_image
}

const handleImageError = (event) => {
  event.target.src = '/placeholder.png'
}

const getGenderIcons = (product) => {
  const icons = []
  
  if (product.gender_men) icons.push({ type: 'men', alt: 'Pánské', title: 'Pánské' })
  if (product.gender_women) icons.push({ type: 'women', alt: 'Dámské', title: 'Dámské' })
  if (product.gender_kids) icons.push({ type: 'kids', alt: 'Dětské', title: 'Dětské' })
  if (product.gender_unisex) icons.push({ type: 'unisex', alt: 'Unisex', title: 'Unisex' })
  if (product.customizable) icons.push({ type: 'pen', alt: 'Personalizovatelné', title: 'Personalizovatelné' })
  
  return icons
}

const getAvailableSizes = (product) => {
  if (!product.sizes || product.sizes.length === 0) return 'Univerzální'
  return product.sizes.join(', ')
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('cs-CZ').format(price)
}

const updatePrice = async (product, field, event) => {
  const newValue = parseFloat(event.target.value)
  if (isNaN(newValue)) return
  
  try {
    const updates = { [field]: newValue }
    
    const { error } = await supabase.functions.invoke('update-sales-offer', {
      body: { 
        sales_offer_id: product.id,
        updates
      }
    })
    
    if (error) throw error
    
    product[field] = newValue
    
    toast.add({
      severity: 'success',
      summary: 'Uloženo',
      detail: 'Cena byla aktualizována',
      life: 2000
    })
  } catch (error) {
    console.error('Error updating price:', error)
    toast.add({
      severity: 'error',
      summary: 'Chyba',
      detail: 'Nepodařilo se uložit cenu',
      life: 3000
    })
    event.target.value = product[field]
  }
}

const updateSupport = async (product, event) => {
  const support = parseFloat(event.target.value)
  if (isNaN(support)) return
  
  const newPrice = product.wholesale_price + support
  event.target.value = support
  
  const fakeEvent = { target: { value: newPrice } }
  await updatePrice(product, 'price', fakeEvent)
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 300
}

// Track if we've already fetched
const hasFetched = ref(false)

// Watch for sales channel URL changes
watch(() => authStore.salesChannelUrl, (newUrl) => {
  console.log('Sales channel URL watcher:', { 
    newUrl, 
    isAuthenticated: authStore.isAuthenticated,
    hasFetched: hasFetched.value 
  })
  if (newUrl && !hasFetched.value) {
    console.log('Sales channel URL is available, fetching products')
    hasFetched.value = true
    fetchProducts()
  }
})

// Lifecycle
onMounted(async () => {
  console.log('Shop Sales mounted:', {
    salesChannelUrl: authStore.salesChannelUrl,
    isAuthenticated: authStore.isAuthenticated,
    salesChannelLoaded: authStore.salesChannelLoaded
  })
  
  // If auth store is still loading, wait for it
  if (!authStore.salesChannelLoaded && authStore.isAuthenticated) {
    console.log('Waiting for sales channel to load...')
    // Wait up to 5 seconds for sales channel
    const maxWait = 50 // 50 * 100ms = 5 seconds
    let waited = 0
    while (!authStore.salesChannelLoaded && waited < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100))
      waited++
    }
  }
  
  // Now check if we have salesChannelUrl
  if (authStore.salesChannelUrl && !hasFetched.value) {
    console.log('Sales channel URL ready, fetching products')
    hasFetched.value = true
    fetchProducts()
  } else if (!authStore.salesChannelUrl) {
    console.log('No sales channel URL available')
  }
  
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  // Reset fetch flag so products load again when navigating back
  hasFetched.value = false
})
</script>

<style scoped>
/* Mobile adjustments for filter visibility */
@media (min-width: 1001px) {
  #filter-opener {
    display: none !important;
  }
  .filters > div:not(#filter-opener) {
    display: block !important;
  }
}

@media (max-width: 1000px) {
  .filters {
    width: 95% !important;
    margin: 0 auto 20px auto;
  }
  
  .products {
    width: 95% !important;
  }
}

/* Ensure products are visible */
.eshop_section {
  min-height: 500px;
}

.shop-sales {
  min-height: 500px;
}

/* Filters Section */
.filters-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filter-toggle {
  cursor: pointer;
  user-select: none;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
}

.filters-content {
  margin-top: 20px;
}

.search-box {
  display: flex;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 14px;
}

.search-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

.filter-categories h5 {
  margin: 0 0 10px 0;
  color: #666;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.category-btn {
  padding: 8px 16px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-btn:hover {
  background: #e0e0e0;
}

.category-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.reset-filters-btn {
  margin-top: 15px;
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Products Grid */
.products-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
}

.product-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.product-icons {
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 60px;
}

.special-icon {
  width: 50px;
  height: 50px;
}

.icon-placeholder {
  width: 50px;
  height: 50px;
}

.gender-icons {
  display: flex;
  gap: 5px;
}

.gender-icon {
  width: 24px;
  height: 24px;
}

.product-image {
  position: relative;
  padding-top: 100%;
  background: #f5f5f5;
  overflow: hidden;
}

.product-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  padding: 20px;
}

.product-card:hover .product-overlay {
  opacity: 1;
}

.product-info {
  padding: 15px;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: #333;
}

.product-price {
  font-size: 20px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 10px;
}

/* Edit Mode Prices */
.edit-mode-prices {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.price-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.price-row label {
  flex: 1;
  font-size: 12px;
  color: #666;
}

.price-input {
  width: 80px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: right;
}

.price-input.support {
  border-color: #10b981;
}

.price-row.total {
  padding-top: 8px;
  border-top: 1px solid #ddd;
  font-weight: bold;
}

.price-row.total .price-input {
  border-color: #667eea;
  background: white;
}

/* Color Variants */
.product-colors {
  display: flex;
  gap: 8px;
  margin: 10px 0;
}

.color-box {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #ddd;
  cursor: pointer;
}

/* Availability */
.product-availability {
  font-size: 13px;
  margin-top: 10px;
}

.product-availability .orange {
  color: #f59e0b;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.loading-state i,
.empty-state i {
  font-size: 48px;
  margin-bottom: 20px;
  display: block;
}

/* Scroll to Top */
.scroll-top-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  z-index: 100;
}

.scroll-top-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

/* Responsive */
@media (max-width: 768px) {
  .products-list {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .product-name {
    font-size: 14px;
  }
  
  .product-price {
    font-size: 16px;
  }
  
  .edit-mode-prices {
    font-size: 12px;
  }
  
  .price-input {
    width: 60px;
  }
}
</style>
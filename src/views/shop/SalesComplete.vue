<template>
  <div>
    <!-- Christmas countdown banner (conditional based on date) -->
    <div v-if="showChristmasBanner" id="dynamic-note" :style="christmasBannerStyle">
      <span style="font-size: 30px" title="Doručení do Vánoc">🎄</span>
      {{ christmasBannerText }}
    </div>

    <!-- Special club messages -->
    <div v-if="salesChannelInternal === 'florbal-kladno'">
      <p style="box-shadow: rgba(17, 12, 46, 0.15) 0px 4.8px 10px 0px; width: 100%; text-align: center; padding: 15px">
        Náš fanshop právě prochází úpravami spojenými s nadcházející změnou klubové identity 👑
      </p>
    </div>

    <div class="eshop_section">
      <Toast />
      
      <!-- Mobile filter opener -->
      <h4 id="filter-opener" @click="toggleFilters">Filtry</h4>
      
      <!-- Filters sidebar -->
      <div class="filters" id="filters" :style="{ display: showFilters ? 'block' : 'none' }">
        <div>
          <!-- Search form -->
          <form class="search" @submit.prevent="filterProducts">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Co hledáte?"
            >
            <button type="submit"><i class="fa fa-search"></i></button>
          </form>
        </div>
        
        <!-- Categories filter -->
        <div v-if="displayCategories.length > 0">
          <div class="row product-category__menu" @click="toggleCollapse('categories')">
            <div class="col-8"><span class="product-category__name">Kategorie</span></div>
            <div class="col-1">
              <button type="button" class="collapse-btn">{{ collapseStates.categories ? '-' : '+' }}</button>
            </div>
          </div>
          <div v-show="collapseStates.categories" class="collapse show">
            <div class="col-12">
              <a 
                v-for="cat in displayCategories" 
                :key="cat.id"
                class="filter-value"
                :class="{ 'aktivni': selectedCategory === cat.id }"
                @click.prevent="selectCategory(cat.id)"
                href="#"
              >
                <span class="btn-text">{{ cat.name }}</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Dynamic filters -->
        <div v-for="(filter, index) in filters" :key="filter.name">
          <div class="row product-category__menu" @click="toggleCollapse(filter.name)">
            <div class="col-8"><span class="product-category__name">{{ filter.name }}</span></div>
            <div class="col-1">
              <button type="button" class="collapse-btn">
                {{ collapseStates[filter.name] ? '-' : '+' }}
              </button>
            </div>
          </div>
          <div v-show="collapseStates[filter.name] || index < 5" class="collapse">
            <div class="col-12">
              <a 
                v-for="value in filter.values" 
                :key="value"
                class="filter-value"
                :class="{ 'aktivni': activeFilter === filter.name && activeFilterValue === value }"
                @click.prevent="applyFilter(filter.name, value)"
                href="#"
              >
                <span class="btn-text">{{ value }}</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Reset filters button -->
        <div v-if="hasActiveFilters">
          <div class="row product-category__menu">
            <button @click="resetFilters" class="reset">Zrušit filtry ✕</button>
          </div>
        </div>
      </div>

      <!-- Products grid -->
      <div class="products">
        <!-- No products message -->
        <h2 v-if="filteredProducts.length === 0 && !loading">
          Žádné produkty nebyly nalezeny.
        </h2>

        <!-- Loading state -->
        <div v-if="loading" style="grid-column: 1/-1; text-align: center; padding: 60px;">
          <i class="pi pi-spin pi-spinner" style="font-size: 48px;"></i>
          <p>Načítání produktů...</p>
        </div>

        <!-- Category sections with products -->
        <template v-for="category in displayCategories" :key="category.id">
          <div class="category-divider" :id="`cat${category.id}`">{{ category.name }}</div>
          
          <a 
            v-for="product in getProductsByCategory(category.id)" 
            :key="product.id"
            :href="`/shop/product/${product.seo}`"
            @click.prevent="goToProduct(product.seo)"
            :class="{ 'product-inactive': product.active_channel === 0 || product.sales_offer_status_id > 1 }"
          >
            <div class="product" :class="{ 'inactive': product.active_channel === 0 || product.sales_offer_status_id > 1 }">
              <!-- Product toggle in edit mode -->
              <div v-if="editMode" class="product-toggle" @click.stop>
                <div class="form-check form-switch">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    :id="`toggle-${product.id}`"
                    :checked="product.active_channel === 1"
                    :disabled="product.sales_offer_status_id > 2"
                    @change="toggleProductStatus(product, $event)"
                  >
                  <label :for="`toggle-${product.id}`" class="form-check-label">
                    {{ product.active_channel === 1 ? 'Aktivní' : 'Neaktivní' }}
                  </label>
                </div>
                <small v-if="product.sales_offer_status_id > 2" class="text-muted d-block">
                  Produkt je deaktivován centrálně
                </small>
              </div>
              
              <!-- Gender and special icons -->
              <div class="gender">
                <img 
                  v-if="product.special_icon"
                  style="width: 50px; height: 50px"
                  :src="`https://kastomi.kastomi.com/images/${product.special_icon}.png`"
                  :title="product.special_icon_desc || ''"
                >
                <div v-else style="width: 50px; height: 50px"></div>

                <div v-if="getGenderIcons(product).length > 1" class="gender-icons">
                  <img 
                    v-for="icon in getGenderIcons(product)"
                    :key="icon.type"
                    :src="`https://kastomi.kastomi.com/images/${icon.type}.svg`"
                    :alt="icon.alt"
                    :title="icon.title"
                  >
                </div>
                <img 
                  v-else-if="getGenderIcons(product).length === 1"
                  :src="`https://kastomi.kastomi.com/images/${getGenderIcons(product)[0].type}.svg`"
                  :alt="getGenderIcons(product)[0].alt"
                  :title="getGenderIcons(product)[0].title"
                >
              </div>

              <!-- Product image -->
              <div class="product-image">
                <img 
                  :src="getProductImage(product)"
                  :alt="product.name"
                  :id="`image-${product.id}`"
                  @error="handleImageError"
                >
                <div class="product-overlay">
                  <p>Dostupné varianty:<br>
                    <strong>{{ getAvailableSizes(product) }}</strong>
                  </p>
                </div>
              </div>
              
              <p class="product-desc"></p>
              
              <!-- Product info -->
              <div class="col-start">
                <h3 class="product-name">{{ product.name }}</h3>
                
                <!-- Normal price display -->
                <p v-if="!editMode" class="product-price">{{ formatPrice(product.price) }} Kč</p>
                
                <!-- Edit mode prices (readonly - click to edit in detail) -->
                <div v-else style="width: 100%; margin: 10px 0; background: #f8f9fa; padding: 8px; border-radius: 4px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                    <label style="font-size: 12px; color: #666;">Velkoobchod:</label>
                    <span style="font-size: 12px;">{{ product.wholesale_price }} Kč</span>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                    <label style="font-size: 12px; color: #666;">Podpora:</label>
                    <span style="font-size: 12px; color: #10b981;">{{ product.price - product.wholesale_price }} Kč</span>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 5px; border-top: 1px solid #e5e7eb;">
                    <label style="font-size: 12px; font-weight: bold;">Koncová:</label>
                    <span style="font-size: 12px; font-weight: bold;">{{ product.price }} Kč</span>
                  </div>
                  <div style="text-align: center; margin-top: 8px;">
                    <span style="font-size: 10px; color: #999;">
                      <i class="pi pi-info-circle"></i> Ceny upravujte v detailu produktu
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Color variants -->
              <div v-if="product.color_variants && product.color_variants.length > 0" class="product-color">
                <span 
                  v-for="color in product.color_variants"
                  :key="color.hex"
                  class="color-box"
                  :style="{ background: color.hex }"
                  :title="color.name"
                  @mouseover="changeProductImage(product.id, color.image)"
                  @mouseleave="resetProductImage(product.id)"
                ></span>
              </div>

              <!-- Availability -->
              <div class="sklad">
                <span v-if="product.supplier === 'Unihoc'" class="orange">
                  Dodání od firmy Unihoc &nbsp;
                  <span class="tooltip-container" @mouseover="showTooltip" @mouseout="hideTooltip">
                    <i class="fa-solid fa-circle-info"></i>
                    <span class="tooltiptext">Doručení trvá ve většině případů 14 prac. dní. Tuto dobu ale bohužel nejsme schopni garantovat.</span>
                  </span>
                </span>
                <span v-else-if="product.availability" :style="{ color: product.availability_color }">
                  {{ product.availability }}
                </span>
              </div>
            </div>
          </a>
        </template>

        <!-- Last divider -->
        <div class="category-divider last-divider">Nenašli jste co jste hledali?</div>
        
        <!-- Contact section based on channel type -->
        <div v-if="isShopChannel" class="other-products">
          <h4>Máte zájem o výrobu vlastních triček s potiskem?</h4><br>
          <h5>Vyplňte formulář níže a my se Vám ozveme na e-mail.<br></h5>
          <!-- HubSpot form would go here -->
        </div>
        <div v-else-if="salesChannelInternal === 'my-community'" class="other-products">
          <h5>Neváhejte se prosím obrátit na náš e-mail <a href="mailto:info@mycommunity.cz">info@mycommnity.cz</a></h5><br>
        </div>
        <div v-else class="other-products">
          <h5>Rádi pro Vás vyrobíme jakýkoliv další textil na míru.<br><br>Například:<br></h5>
          <ul class="other-products-examples">
            <li>
              <img :src="images.anniversary" class="other-products-icon">
              <p>Limitovaná edice k výročí založení klubu</p>
            </li>
            <li>
              <img :src="images.trophy" class="other-products-icon">
              <p>Připomínka důležitého<br>vítězství</p>
            </li>
            <li>
              <img :src="images.fans" class="other-products-icon">
              <p>Fanouškovský klub<br>či sekce</p>
            </li>
          </ul>
          
          <h5><br>Napadá Vás cokoliv dalšího? Neváhejte se obrátit na <a href="mailto:info@kastomi.com">info@kastomi.com</a></h5>
          
          <h5 v-if="salesChannelInternal === 'vk-jihostroj-ceske-budejovice'">
            <br>Zástupce VK Jihostroj můžete kontaktovat na<br>
            <a href="mailto:katerina.kohoutova@volejbalcb.cz">katerina.kohoutova@volejbalcb.cz</a> nebo tel. 725 030 315
          </h5>
        </div>
      </div>
      
      <!-- Scroll to top button -->
      <span 
        @click="scrollToTop"
        id="scroll-top-btn"
        v-show="showScrollTop"
        title="Zpět na začátek"
        role="button"
      >
        <i class="fa-solid fa-chevron-up"></i>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import Toast from 'primevue/toast'

// Import images
import anniversaryIcon from '@/assets/images/anniversary.svg'
import trophyIcon from '@/assets/images/trophy.svg'
import fansIcon from '@/assets/images/fans.png'

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
const filters = ref([])
const selectedCategory = ref(null)
const searchQuery = ref('')
const showFilters = ref(true) // Default show on desktop
const showScrollTop = ref(false)
const activeFilter = ref(null)
const activeFilterValue = ref(null)
const collapseStates = ref({
  categories: true
})
const originalImages = ref({})

// Christmas banner state
const showChristmasBanner = ref(false)
const christmasBannerText = ref('')
const christmasBannerStyle = ref({
  textAlign: 'center',
  padding: '15px 10px',
  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
})

// Computed
const hasActiveFilters = computed(() => {
  // Don't include selectedCategory since it's just for navigation
  return searchQuery.value || activeFilter.value
})

const salesChannelInternal = computed(() => {
  // Get from auth store or default
  return authStore.salesChannel?.internal || ''
})

const isShopChannel = computed(() => {
  const shopChannels = ['shop-kladno', 'mesto-slany', 'dobris-shop', 'shop-brno', 'slhidfish']
  return shopChannels.includes(salesChannelInternal.value)
})

const displayCategories = computed(() => {
  // Only show categories that have products after filtering
  const categoriesWithProducts = []
  
  // Check each category to see if it has any products
  categories.value.forEach(category => {
    const hasProducts = filteredProducts.value.some(product => {
      // Only skip completely archived products (status 3)
      if (product.sales_offer_status_id === 3) {
        return false
      }
      
      // Check if product belongs to this category
      if (product.categories && product.categories.length > 0) {
        return product.categories.some(cat => cat && cat.id === category.id)
      }
      
      // For default category
      return category.id === 1 && (!product.categories || product.categories.length === 0)
    })
    
    if (hasProducts) {
      categoriesWithProducts.push(category)
    }
  })
  
  return categoriesWithProducts
})

// Methods
const fetchCategories = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('get-sales-categories', {
      body: {
        sales_channel_url: authStore.salesChannelUrl
      }
    })
    
    if (error) throw error
    
    return data.categories || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

const fetchProducts = async () => {
  loading.value = true
  try {
    if (!authStore.salesChannelUrl) {
      console.error('Sales channel URL není k dispozici')
      products.value = []
      filteredProducts.value = []
      return
    }
    
    // Fetch categories first
    const fetchedCategories = await fetchCategories()
    
    const { data, error } = await supabase.functions.invoke('get-sales-offers', {
      body: {
        sales_channel_url: authStore.salesChannelUrl
      }
    })
    
    if (error) throw error
    
    // Process products
    const processedProducts = (data.offers || []).map(product => {
      // Use 'kategorie' field to match PHP structure
      const productCategories = []
      if (product.kategorie) {
        if (Array.isArray(product.kategorie)) {
          productCategories.push(...product.kategorie)
        } else if (product.kategorie.category) {
          // Handle nested structure from API
          const cats = Array.isArray(product.kategorie.category) 
            ? product.kategorie.category 
            : [product.kategorie.category]
          productCategories.push(...cats)
        }
      }
      
      // Extract color variants
      const colorVariants = []
      const uniqueColors = new Map()
      
      if (product.variants) {
        product.variants.forEach(variant => {
          // Look for color info in variant params
          let colorHex = null
          let colorName = null
          let variantImage = variant.variant_image
          
          if (variant.params) {
            variant.params.forEach(param => {
              if (param.param?.name === 'Barva - HEX' || param.param?.internal === 'barva_hex') {
                colorHex = param.val
              }
              if (param.param?.name === 'Barva - pojmenování' || param.param?.internal === 'barva_pojmenovani') {
                colorName = param.val
              }
            })
          }
          
          if (colorHex && colorName && variantImage) {
            const key = colorHex
            if (!uniqueColors.has(key)) {
              uniqueColors.set(key, {
                hex: colorHex,
                name: colorName,
                image: variantImage
              })
            }
          }
        })
      }
      
      return {
        ...product,
        kategorie: product.kategorie || [], // Keep original kategorie field
        categories: productCategories, // Processed categories for display
        color_variants: Array.from(uniqueColors.values())
      }
    })
    
    products.value = processedProducts
    filteredProducts.value = processedProducts
    
    console.log('Processed products:', processedProducts.length)
    if (processedProducts.length > 0) {
      console.log('First product structure:', {
        id: processedProducts[0].id,
        name: processedProducts[0].name,
        kategorie: processedProducts[0].kategorie,
        categories: processedProducts[0].categories
      })
    }
    console.log('Fetched categories:', fetchedCategories)
    
    // Use fetched categories if available
    if (fetchedCategories && fetchedCategories.length > 0) {
      categories.value = fetchedCategories
      
      // Now assign categories to products based on their category IDs
      products.value.forEach(product => {
        const productCategories = []
        
        // Check if product has category information
        if (product.categories && product.categories.length > 0) {
          product.categories.forEach(cat => {
            // Find matching category from fetched categories
            const matchedCategory = fetchedCategories.find(fc => fc.id === cat.id)
            if (matchedCategory) {
              productCategories.push(matchedCategory)
            }
          })
        }
        
        // Update product categories with full category objects
        product.categories = productCategories
      })
      
      filteredProducts.value = products.value
    } else {
      // Fallback: Extract categories from products if API doesn't provide them
      const catMap = new Map()
      let hasCategories = false
      products.value.forEach(product => {
        if (product.categories && product.categories.length > 0) {
          hasCategories = true
          product.categories.forEach(cat => {
            if (cat && cat.id && !catMap.has(cat.id)) {
              catMap.set(cat.id, cat)
            }
          })
        }
      })
      
      // If no products have categories, create a default category
      if (!hasCategories && products.value.length > 0) {
        catMap.set(1, { id: 1, name: 'Všechny produkty' })
        // Assign default category to all products
        products.value.forEach(product => {
          if (!product.categories || product.categories.length === 0) {
            product.categories = [{ id: 1, name: 'Všechny produkty' }]
          }
        })
        filteredProducts.value = products.value
      }
      
      categories.value = Array.from(catMap.values())
    }
    
    console.log('Final categories:', categories.value)
    
    // Extract filters from product params (like PHP version)
    const filtersMap = new Map()
    
    products.value.forEach(product => {
      // Skip archived or inactive products for filter extraction
      if (product.sales_offer_status_id === 3 || product.active_channel === 0) {
        return
      }
      
      // Check variant params
      if (product.variants) {
        product.variants.forEach(variant => {
          if (variant.params) {
            variant.params.forEach(param => {
              // Only include params that should be shown (show == 1) and have values
              if (param.param?.show === 1 && param.val) {
                const filterName = param.param.name
                
                if (!filtersMap.has(filterName)) {
                  filtersMap.set(filterName, new Set())
                }
                
                // Handle semicolon-separated values
                const values = param.val.split(';').filter(v => v.trim())
                values.forEach(value => {
                  filtersMap.get(filterName).add(value.trim())
                })
              }
            })
          }
        })
      }
      
      // Also check product-level params
      if (product.params) {
        product.params.forEach(param => {
          if (param.param?.show === 1 && param.val) {
            const filterName = param.param.name
            
            if (!filtersMap.has(filterName)) {
              filtersMap.set(filterName, new Set())
            }
            
            // Handle semicolon-separated values
            const values = param.val.split(';').filter(v => v.trim())
            values.forEach(value => {
              filtersMap.get(filterName).add(value.trim())
            })
          }
        })
      }
    })
    
    // Convert to array format and sort values
    filters.value = Array.from(filtersMap.entries()).map(([name, valuesSet]) => ({
      name,
      values: Array.from(valuesSet).sort()
    }))
    
    // Skip certain filter types (like in PHP)
    filters.value = filters.value.filter(f => 
      !['Složení', 'Typ', 'Délka'].includes(f.name)
    )
    
    console.log('Extracted filters:', filters.value)
    
    // Store original images
    products.value.forEach(product => {
      originalImages.value[product.id] = getProductImage(product)
    })
    
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

const getProductsByCategory = (categoryId) => {
  return filteredProducts.value.filter(product => {
    // Only skip completely archived products (status 3)
    // Show inactive products (active_channel === 0) but style them differently
    if (product.sales_offer_status_id === 3) {
      return false
    }
    
    // Check if product belongs to this category
    if (product.categories && product.categories.length > 0) {
      return product.categories.some(cat => cat && cat.id === categoryId)
    }
    
    // If no categories, include in default category
    return categoryId === 1
  })
}

const filterProducts = () => {
  let filtered = [...products.value]
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query))
    )
  }
  
  // DON'T filter by category - categories are just for scrolling/navigation
  // if (selectedCategory.value) {
  //   filtered = filtered.filter(p => 
  //     p.categories && p.categories.some(c => c.id === selectedCategory.value)
  //   )
  // }
  
  // Filter by active params filter
  if (activeFilter.value && activeFilterValue.value) {
    filtered = filtered.filter(product => {
      // Check in variant params
      if (product.variants) {
        for (const variant of product.variants) {
          if (variant.params) {
            for (const param of variant.params) {
              if (param.param?.name === activeFilter.value && param.val) {
                // Check if the param value contains the filter value
                const values = param.val.split(';').map(v => v.trim())
                if (values.includes(activeFilterValue.value)) {
                  return true
                }
              }
            }
          }
        }
      }
      
      // Also check product-level params
      if (product.params) {
        for (const param of product.params) {
          if (param.param?.name === activeFilter.value && param.val) {
            // Check if the param value contains the filter value
            const values = param.val.split(';').map(v => v.trim())
            if (values.includes(activeFilterValue.value)) {
              return true
            }
          }
        }
      }
      
      return false
    })
  }
  
  // Only filter out completely archived products (status 3)
  // Keep inactive products (active_channel === 0) to show them disabled
  filtered = filtered.filter(p => p.sales_offer_status_id !== 3)
  
  filteredProducts.value = filtered
}

const selectCategory = (categoryId) => {
  // Just scroll to category - don't filter products
  selectedCategory.value = categoryId
  
  // Scroll to category divider
  setTimeout(() => {
    const element = document.getElementById(`cat${categoryId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, 100)
  
  // Don't filter products - show all
}

const applyFilter = (filterName, value) => {
  if (activeFilter.value === filterName && activeFilterValue.value === value) {
    activeFilter.value = null
    activeFilterValue.value = null
  } else {
    activeFilter.value = filterName
    activeFilterValue.value = value
  }
  filterProducts()
}

const resetFilters = () => {
  // Don't reset selectedCategory - it's just for navigation
  searchQuery.value = ''
  activeFilter.value = null
  activeFilterValue.value = null
  filterProducts()
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const toggleCollapse = (key) => {
  collapseStates.value[key] = !collapseStates.value[key]
}

const goToProduct = (seo) => {
  // Always navigate to product detail page
  router.push(`/shop/product/${seo}`)
}

const getProductImage = (product) => {
  if (product.variants && product.variants.length > 0 && product.variants[0].variant_image) {
    const image = product.variants[0].variant_image
    return image.startsWith('http') ? image : `https://cdn.kastomi.com/files/${image}`
  }
  // Return a data URL placeholder if no image
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNGNUY1RjUiLz4KICA8cGF0aCBkPSJNMjAwIDE0MEMxNzcuOTA5IDE0MCAxNjAgMTU3LjkwOSAxNjAgMTgwVjIyMEMxNjAgMjQyLjA5MSAxNzcuOTA5IDI2MCAyMDAgMjYwQzIyMi4wOTEgMjYwIDI0MCAyNDIuMDkxIDI0MCAyMjBWMTgwQzI0MCAxNTcuOTA5IDIyMi4wOTEgMTQwIDIwMCAxNDBaIiBzdHJva2U9IiNDQ0NDQ0MiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CiAgPHBhdGggZD0iTTE2MCAyMDBIMjQwIiBzdHJva2U9IiNDQ0NDQ0MiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CiAgPHBhdGggZD0iTTIwMCAxNjBWMjQwIiBzdHJva2U9IiNDQ0NDQ0MiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CiAgPHRleHQgeD0iMjAwIiB5PSIyOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QmV6IG9icsOhemt1PC90ZXh0Pgo8L3N2Zz4='
}

const changeProductImage = (productId, imageFile) => {
  if (imageFile) {
    const element = document.getElementById(`image-${productId}`)
    if (element) {
      element.src = `https://bob.kastomi.com/files/${imageFile}`
    }
  }
}

const resetProductImage = (productId) => {
  const element = document.getElementById(`image-${productId}`)
  if (element && originalImages.value[productId]) {
    element.src = originalImages.value[productId]
  }
}

const handleImageError = (event) => {
  // Use the same data URL placeholder on error
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNGNUY1RjUiLz4KICA8cGF0aCBkPSJNMjAwIDE0MEMxNzcuOTA5IDE0MCAxNjAgMTU3LjkwOSAxNjAgMTgwVjIyMEMxNjAgMjQyLjA5MSAxNzcuOTA5IDI2MCAyMDAgMjYwQzIyMi4wOTEgMjYwIDI0MCAyNDIuMDkxIDI0MCAyMjBWMTgwQzI0MCAxNTcuOTA5IDIyMi4wOTEgMTQwIDIwMCAxNDBaIiBzdHJva2U9IiNDQ0NDQ0MiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CiAgPHBhdGggZD0iTTE2MCAyMDBIMjQwIiBzdHJva2U9IiNDQ0NDQ0MiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CiAgPHBhdGggZD0iTTIwMCAxNjBWMjQwIiBzdHJva2U9IiNDQ0NDQ0MiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CiAgPHRleHQgeD0iMjAwIiB5PSIyOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QmV6IG9icsOhemt1PC90ZXh0Pgo8L3N2Zz4='
}

const getGenderIcons = (product) => {
  const icons = []
  
  // Check variants for gender info
  let men = false, women = false, kids = false, unisex = false
  
  if (product.variants) {
    product.variants.forEach(v => {
      if (v.gender === 'Pánské') men = true
      if (v.gender === 'Dámské') women = true
      if (v.gender === 'Dětské') kids = true
      if (v.gender === 'Unisex') unisex = true
    })
  }
  
  // Also check product-level gender
  if (product.gender === 'men' || men) icons.push({ type: 'men', alt: 'Pánské', title: 'Pánské' })
  if (product.gender === 'women' || women) icons.push({ type: 'women', alt: 'Dámské', title: 'Dámské' })
  if (product.gender === 'kids' || kids) icons.push({ type: 'kids', alt: 'Dětské', title: 'Dětské' })
  if (product.gender === 'unisex' || unisex) icons.push({ type: 'unisex', alt: 'Unisex', title: 'Unisex' })
  
  // Check for customization
  if (product.customizable) {
    icons.push({ type: 'pen', alt: 'Tužka', title: 'Personalizovatelné' })
  }
  
  return icons
}

const getAvailableSizes = (product) => {
  if (!product.variants || product.variants.length === 0) return 'Univerzální'
  
  // Extract unique sizes and sort them
  const sizes = [...new Set(product.variants.map(v => v.size || v.variant).filter(Boolean))]
  
  // Size order for sorting
  const sizeOrder = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16',
                     '3M', '6M', '9M', '12M', '18M', '2XS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'XXXL', '4XL']
  
  sizes.sort((a, b) => {
    const aIndex = sizeOrder.indexOf(a)
    const bIndex = sizeOrder.indexOf(b)
    
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    }
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    
    return a.localeCompare(b)
  })
  
  return sizes.join(', ')
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
        updates,
        sales_channel_url: authStore.salesChannelUrl
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

const toggleProductStatus = async (product, event) => {
  const newStatus = event.target.checked ? 1 : 0
  
  try {
    // Use the same format as ProductDetailDialog
    const { data, error } = await supabase.functions.invoke('update-sales-offer', {
      body: { 
        id: Number(product.id), // Use 'id' not 'sales_offer_id'
        active: newStatus, // Use 'active' not 'active_channel'
        wholesale_price: product.wholesale_price || 0,
        klub_price: product.klub_price || (product.price - product.wholesale_price) || 0,
        text: product.description || '',
        sales_channel_url: authStore.salesChannelUrl
      }
    })
    
    if (error) throw error
    
    // Update local state
    product.active_channel = newStatus
    
    toast.add({
      severity: 'success',
      summary: 'Uloženo',
      detail: `Produkt byl ${newStatus === 1 ? 'aktivován' : 'deaktivován'}`,
      life: 2000
    })
  } catch (error) {
    console.error('Error updating product status:', error)
    toast.add({
      severity: 'error',
      summary: 'Chyba',
      detail: 'Nepodařilo se změnit stav produktu',
      life: 3000
    })
    // Revert checkbox state
    event.target.checked = !event.target.checked
  }
}

const scrollToTop = () => {
  document.body.scrollTop = 0
  document.documentElement.scrollTop = 0
}

const handleScroll = () => {
  showScrollTop.value = (document.body.scrollTop > 30 || document.documentElement.scrollTop > 30)
}

const showTooltip = (event) => {
  const tooltip = event.currentTarget.querySelector('.tooltiptext')
  if (tooltip) {
    tooltip.classList.add('show')
  }
}

const hideTooltip = (event) => {
  const tooltip = event.currentTarget.querySelector('.tooltiptext')
  if (tooltip) {
    setTimeout(() => {
      tooltip.classList.remove('show')
    }, 1000)
  }
}

// Initialize Christmas banner
const initChristmasBanner = () => {
  const now = new Date()
  const year = now.getFullYear()
  const showNoteDate = new Date(year, 11, 1, 0, 0, 0)
  const firstChangeNoteDate = new Date(year, 11, 8, 23, 59, 59)
  const secondChangeNoteDate = new Date(year, 11, 12, 23, 59, 59)
  const hideNoteDate = new Date(year, 11, 23, 23, 59, 59)
  
  if (now >= showNoteDate && now < firstChangeNoteDate) {
    showChristmasBanner.value = true
    const updateCountdown = () => {
      const timeLeft = firstChangeNoteDate - new Date()
      if (timeLeft <= 0) {
        christmasBannerText.value = 'Pro doručení objednávek do Vánoc uděláme vše, co bude v našich silách. Bohužel už však nejsme schopni jej plně garantovat.'
        return
      }
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
      
      christmasBannerText.value = `Pro objednávky s garantovaným doručením do Vánoc zbývá: ${days} dnů, ${hours} hodin, ${minutes} minut, ${seconds} sekund.`
    }
    updateCountdown()
    setInterval(updateCountdown, 1000)
  } else if (now >= firstChangeNoteDate && now < secondChangeNoteDate) {
    showChristmasBanner.value = true
    christmasBannerText.value = 'Pro doručení objednávek do Vánoc uděláme vše, co bude v našich silách. Bohužel už však nejsme schopni jej plně garantovat.'
  } else if (now >= secondChangeNoteDate && now < hideNoteDate) {
    showChristmasBanner.value = true
    christmasBannerText.value = 'Objednávky učiněné v tuto chvíli již pravděpodobně do Vánoc nedorazí.'
  }
}

// Track if we've already fetched
const hasFetched = ref(false)

// Expose imported images to template
const images = {
  anniversary: anniversaryIcon,
  trophy: trophyIcon,
  fans: fansIcon
}

// Watch for sales channel URL changes
watch(() => authStore.salesChannelUrl, (newUrl) => {
  if (newUrl && !hasFetched.value) {
    hasFetched.value = true
    fetchProducts()
  }
})

// Lifecycle
onMounted(async () => {
  // Initialize Christmas banner
  initChristmasBanner()
  
  // Set responsive filter visibility
  if (window.innerWidth <= 1000) {
    showFilters.value = false
  }
  
  // If auth store is still loading, wait for it
  if (!authStore.salesChannelLoaded && authStore.isAuthenticated) {
    const maxWait = 50
    let waited = 0
    while (!authStore.salesChannelLoaded && waited < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100))
      waited++
    }
  }
  
  // Fetch products if salesChannelUrl is available
  if (authStore.salesChannelUrl && !hasFetched.value) {
    hasFetched.value = true
    fetchProducts()
  }
  
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  hasFetched.value = false
})
</script>

<style scoped>
/* Fix text colors - ensure links don't override product text */
.products a {
  text-decoration: none;
  color: black;
}

.products a:hover {
  text-decoration: none;
}

/* Ensure product text is styled correctly */
.product {
  color: black;
}

.product-name {
  color: black !important;
  font-weight: bold;
  font-size: 18px;
  line-height: 1em;
  min-height: 2em;
  margin: 0;
}

.product-price {
  color: black !important;
  font-weight: normal;
  margin-top: 10px;
  margin-bottom: 0;
  font-size: 16px;
}

.col-start {
  width: 100%;
  text-align: left;
}

.sklad {
  color: black;
  font-size: 14px;
  margin-top: 5px;
}

.sklad .orange {
  color: #ffa500;
}

/* Include aktivni class style */
.aktivni { 
  background: black !important; 
  color: white !important; 
}

/* Product toggle styles */
.product-toggle {
  padding: 10px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid #ddd;
  margin-bottom: 10px;
}

.product-toggle .form-check {
  margin: 0;
  padding-left: 2.5em;
}

.product-toggle .form-check-label {
  font-size: 14px;
  font-weight: 500;
  margin-left: 5px;
  cursor: pointer;
}

.product-toggle small {
  font-size: 11px;
  margin-top: 5px;
  padding-left: 2.5em;
}

/* Custom toggle switch styles */
.form-check-input {
  width: 3em;
  height: 1.5em;
  background-color: #dee2e6;
  border: 1px solid #ced4da;
  border-radius: 1.5em;
  position: relative;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  transition: background-color 0.3s, border-color 0.3s;
  margin-top: 0.25em;
  vertical-align: top;
}

.form-check-input:before {
  content: '';
  position: absolute;
  width: 1.2em;
  height: 1.2em;
  border-radius: 50%;
  top: 50%;
  left: 0.15em;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transform: translateY(-50%);
  transition: transform 0.3s;
}

.form-check-input:checked {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.form-check-input:checked:before {
  transform: translateY(-50%) translateX(1.5em);
}

.form-check-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-check-input:focus {
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.form-switch {
  padding-left: 0;
  display: flex;
  align-items: center;
}

.form-switch .form-check-input {
  margin-right: 0.5em;
  margin-left: 0;
  float: none;
}

/* Inactive product styles */
.product-inactive {
  opacity: 0.6;
  pointer-events: none; /* Disable clicking on inactive products */
}

.product-inactive .product-toggle {
  pointer-events: all; /* But allow clicking on the toggle switch */
}

.product.inactive {
  position: relative;
}

.product.inactive::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  pointer-events: none;
  z-index: 1;
}

.product.inactive .product-toggle {
  position: relative;
  z-index: 2;
  background: white;
  opacity: 1;
}

.product.inactive .product-image {
  filter: grayscale(100%) opacity(0.5);
}

.product.inactive .product-name {
  color: #999 !important;
}

.product.inactive .product-price {
  color: #999 !important;
  text-decoration: line-through;
}

.product.inactive .sklad {
  display: none;
}

.product.inactive .product-color {
  opacity: 0.3;
  pointer-events: none;
}

/* In edit mode, make inactive products more visible */
.product-inactive.edit-mode-active {
  opacity: 0.8;
}

/* Ensure mobile responsiveness */
@media (max-width: 1000px) {
  #filter-opener {
    display: block !important;
  }
  
  .filters {
    display: none;
  }
}

@media (min-width: 1001px) {
  #filter-opener {
    display: none !important;
  }
  
  .filters {
    display: block !important;
  }
}
</style>
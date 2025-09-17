<template>
  <teleport to="body">
    <transition name="modal-fade">
      <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
        <div class="modal-container">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-left">
              <h2 class="modal-title">{{ currentProduct?.name }}</h2>
              <div class="header-meta">
                <span class="meta-item">
                  <i class="fas fa-hashtag"></i>
                  ID: {{ currentProduct?.variant_id }}
                </span>
                <span class="status-badge" :class="getOverallStatusClass()">
                  <i class="fas fa-circle"></i>
                  {{ getOverallStatusText() }}
                </span>
                <a 
                  v-if="currentProduct?._originalOffer?.seo && salesChannelUrl" 
                  :href="`https://${extractDomain(salesChannelUrl)}/nabidka/produkt/${currentProduct._originalOffer.seo}`"
                  target="_blank"
                  class="meta-item external-link"
                  title="Zobrazit na e-shopu"
                >
                  <i class="fas fa-external-link-alt"></i>
                  Zobrazit na webu
                </a>
              </div>
            </div>
            <button class="close-btn" @click="handleClose" title="Zavřít">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <div class="content-grid">
              <!-- Left Column - Product Image & Variants -->
              <div class="left-column">
                <!-- Main Image -->
                <div class="image-section">
                  <div class="main-image-container">
                    <img 
                      v-if="currentVariantImage" 
                      :src="currentVariantImage" 
                      :alt="currentProduct?.name"
                      class="main-image"
                      @click="showImageFullscreen = true"
                    />
                    <div v-else class="image-placeholder">
                      <i class="fas fa-image"></i>
                      <span>Žádný obrázek</span>
                    </div>
                    <div v-if="currentVariantImage" class="image-zoom-hint">
                      <i class="fas fa-search-plus"></i>
                    </div>
                  </div>


                  <!-- Single Variant Info -->
                  <div v-if="currentProduct._originalOffer?.variants?.length === 1" class="single-variant-info">
                    <h4 class="section-subtitle">
                      <i class="fas fa-info-circle"></i>
                      Informace o variantě
                    </h4>
                    <div class="variant-info-card">
                      <div class="info-row">
                        <span class="info-label">Název:</span>
                        <span class="info-value">{{ currentProduct._originalOffer.variants[0].variant_name || currentProduct._originalOffer.variants[0].name }}</span>
                      </div>
                      <div v-if="currentProduct._originalOffer.variants[0].size" class="info-row">
                        <span class="info-label">Velikost:</span>
                        <span class="info-value">{{ currentProduct._originalOffer.variants[0].size }}</span>
                      </div>
                      <div v-if="currentProduct._originalOffer.variants[0].color" class="info-row">
                        <span class="info-label">Barva:</span>
                        <span class="info-value">{{ currentProduct._originalOffer.variants[0].color }}</span>
                      </div>
                      <div v-if="currentProduct._originalOffer.variants[0].dimensions" class="info-row">
                        <span class="info-label">Rozměry:</span>
                        <span class="info-value">{{ currentProduct._originalOffer.variants[0].dimensions }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column - Product Details -->
              <div class="right-column">
                <!-- Status Section - Ultra Compact -->
                <div class="detail-card status-card-ultra-compact">
                  <div class="status-header-row">
                    <h3 class="card-title-compact">
                      <i class="fas fa-circle-dot"></i>
                      Status
                    </h3>
                    
                  </div>
                  
                  <div class="status-controls-inline">
                    <!-- Kastomi Badge -->
                    <div class="status-item-inline">
                      <span class="status-micro-label">
                        <i class="fas fa-lock"></i>
                        Kastomi:
                      </span>
                      <span class="status-badge-mini" :class="getKastomiStatusClass(currentProduct?._originalOffer?.sales_offer_status_id)">
                        {{ getKastomiStatusTextShort(currentProduct?._originalOffer?.sales_offer_status_id) }}
                      </span>
                      <div class="status-info-icon" @click="toggleTooltip('kastomi')" :class="{'active': activeTooltip === 'kastomi'}">
                        <i class="fas fa-info-circle"></i>
                        <div class="status-tooltip">
                          Toto nastavení určuje Kastomi podle dostupnosti produktu.
                        </div>
                      </div>
                    </div>
                    
                    <span class="status-separator">•</span>
                    
                    <!-- Channel Toggle -->
                    <div class="status-item-inline">
                      <span class="status-micro-label">Klub:</span>
                      <label class="toggle-mini" :class="{'disabled': currentProduct?._originalOffer?.sales_offer_status_id > 2}">
                        <input 
                          type="checkbox" 
                          :checked="Number(currentProduct?._originalOffer?.active_channel) === 1"
                          @change="toggleActive"
                          :disabled="saving || currentProduct?._originalOffer?.sales_offer_status_id > 2"
                        />
                        <span class="toggle-track"></span>
                      </label>
                      <div class="status-info-icon" @click="toggleTooltip('channel')" :class="{'active': activeTooltip === 'channel'}">
                        <i class="fas fa-info-circle"></i>
                        <div class="status-tooltip">
                          {{ currentProduct?._originalOffer?.sales_offer_status_id > 2 
                            ? getDisabledReason(currentProduct?._originalOffer?.sales_offer_status_id)
                            : 'Zapne nebo vypne produkt na vašem fanshopu.' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Price Section -->
                <div class="detail-card pricing-card">
                  <h3 class="card-title">
                    <i class="fas fa-tags"></i>
                    Cenové informace
                  </h3>
                  
                  <div class="price-grid">
                    <!-- Wholesale Price (Read-only) -->
                    <div class="price-item">
                      <div class="price-header">
                        <span class="price-label">Velkoobchodní cena</span>
                        <span class="price-readonly-badge" title="Tuto hodnotu nelze upravit">
                          <i class="fas fa-lock"></i>
                        </span>
                      </div>
                      <div class="price-value">
                        {{ formatCurrency(currentProduct?.wholesale_price) }}
                      </div>
                    </div>

                    <!-- Club Support -->
                    <div class="price-item">
                      <div class="price-header">
                        <span class="price-label">Podpora klubu</span>
                        <button 
                          v-if="!editingFields.club_support" 
                          @click="startEdit('club_support')" 
                          class="edit-btn-inline"
                          title="Upravit"
                        >
                          <i class="fas fa-pen"></i>
                        </button>
                      </div>
                      <div v-if="!editingFields.club_support" class="price-value">
                        {{ formatCurrency(currentProduct?.club_support) }}
                      </div>
                      <div v-else class="edit-field-wrapper">
                        <input 
                          type="number" 
                          v-model.number="editValues.club_support" 
                          class="edit-input"
                          step="1"
                          min="0"
                          @keyup.enter="saveField('club_support')"
                          @keyup.escape="cancelEdit('club_support')"
                        />
                        <div class="edit-actions-inline">
                          <button @click="saveField('club_support')" class="save-btn-inline" title="Uložit">
                            <i class="fas fa-check"></i>
                          </button>
                          <button @click="cancelEdit('club_support')" class="cancel-btn-inline" title="Zrušit">
                            <i class="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Final Price -->
                    <div class="price-item final-price-item">
                      <div class="price-header">
                        <span class="price-label">Koncová cena</span>
                        <i class="fas fa-info-circle" title="Automaticky vypočítáno"></i>
                      </div>
                      <div class="price-value final">
                        {{ formatCurrency(calculatedFinalPrice) }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Description Section -->
                <div class="detail-card">
                  <div class="card-header-with-action">
                    <h3 class="card-title">
                      <i class="fas fa-align-left"></i>
                      Popis produktu
                    </h3>
                    <button 
                      v-if="!editingFields.description" 
                      @click="startEdit('description')" 
                      class="edit-btn-inline"
                      title="Upravit popis"
                    >
                      <i class="fas fa-pen"></i>
                    </button>
                  </div>
                  
                  <div v-if="!editingFields.description" class="description-content">
                    <p v-if="currentProduct?.description">{{ currentProduct.description }}</p>
                    <p v-else class="no-content">Žádný popis není k dispozici</p>
                  </div>
                  <div v-else class="edit-field-wrapper">
                    <textarea 
                      v-model="editValues.description" 
                      class="edit-textarea"
                      rows="4"
                      placeholder="Zadejte popis produktu..."
                      @keyup.escape="cancelEdit('description')"
                    ></textarea>
                    <div class="edit-actions-inline mt-2">
                      <button @click="saveField('description')" class="save-btn-inline">
                        <i class="fas fa-check"></i>
                        Uložit
                      </button>
                      <button @click="cancelEdit('description')" class="cancel-btn-inline">
                        <i class="fas fa-times"></i>
                        Zrušit
                      </button>
                    </div>
                  </div>
                </div>

                
                <!-- All Variants Table (if multiple) -->
                <div v-if="hasMultipleVariants" class="detail-card">
                  <h3 class="card-title">
                    <i class="fas fa-list"></i>
                    Přehled všech variant
                  </h3>
                  <div class="variants-table">
                    <table>
                      <thead>
                        <tr>
                          <th style="width: 60px;">Obrázek</th>
                          <th>Varianta</th>
                          <th>Velikost</th>
                          <th>Barva</th>
                          <th>Stav</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr 
                          v-for="(variant, index) in currentProduct._originalOffer?.variants" 
                          :key="variant.variant_id"
                        >
                          <td>
                            <div class="variant-table-image-wrapper">
                              <img 
                                v-if="variant.variant_image" 
                                :src="variant.variant_image.startsWith('http') ? variant.variant_image : `https://cdn.kastomi.com/files/${variant.variant_image}`" 
                                :alt="variant.variant_name || variant.name"
                                class="variant-table-image"
                              />
                              <div v-else class="variant-table-image-placeholder">
                                <i class="fas fa-image"></i>
                              </div>
                            </div>
                          </td>
                          <td class="variant-name-cell">
                            <strong>{{ variant.variant_name || variant.name }}</strong>
                          </td>
                          <td>{{ variant.size || '-' }}</td>
                          <td>{{ variant.color || '-' }}</td>
                          <td>
                            <span class="status-badge-small" :class="variant.active ? 'active' : 'inactive'">
                              {{ variant.active ? 'Aktivní' : 'Neaktivní' }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <div class="footer-info">
              <span v-if="lastSaved" class="last-saved">
                <i class="fas fa-check-circle"></i>
                Naposledy uloženo {{ formatTime(lastSaved) }}
              </span>
            </div>
            <button class="btn btn-primary" @click="handleClose">
              Zavřít
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Loading Overlay -->
    <div v-if="saving" class="loading-overlay">
      <div class="spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Ukládání...</span>
      </div>
    </div>

    <!-- Fullscreen Image Viewer -->
    <div v-if="showImageFullscreen" class="fullscreen-image" @click="showImageFullscreen = false">
      <img :src="currentVariantImage" :alt="currentProduct?.name" />
      <button class="fullscreen-close" @click="showImageFullscreen = false">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { sortVariants } from '@/utils/variantSorting'

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  product: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['close', 'update'])

// State
const showImageFullscreen = ref(false)
const lastSaved = ref(null)
const salesChannelUrl = ref('')

// Local copy of product data
const localProduct = ref(null)

// State
const editingFields = reactive({
  description: false,
  wholesale_price: false,
  club_support: false,
  status: false
})

const editValues = reactive({
  description: '',
  wholesale_price: 0,
  club_support: 0,
  status: 1
})

const saving = ref(false)
const activeTooltip = ref(null)

// Computed
const currentProduct = computed(() => localProduct.value || props.product)

const isProductActive = computed(() => {
  const product = currentProduct.value
  if (!product) return false
  
  // Handle various possible values - active can be number, string, or undefined
  const active = product.active
  
  
  // Only return true if explicitly 1 (handle both string and number)
  return active !== undefined && active !== null && Number(active) === 1
})

const calculatedFinalPrice = computed(() => {
  const product = currentProduct.value
  const wholesale = editingFields.wholesale_price ? editValues.wholesale_price : (product?.wholesale_price || 0)
  const support = editingFields.club_support ? editValues.club_support : (product?.club_support || 0)
  return wholesale + support
})

// Computed for current variant image (always use first variant)
const currentVariantImage = computed(() => {
  const product = localProduct.value || props.product
  let imageUrl = null
  
  if (product?._originalOffer?.variants && product._originalOffer.variants[0]) {
    imageUrl = product._originalOffer.variants[0].variant_image
  } else if (product?.image) {
    imageUrl = product.image
  }
  
  // Add CDN prefix if image exists and doesn't already have it
  if (imageUrl && !imageUrl.startsWith('http')) {
    return `https://cdn.kastomi.com/files/${imageUrl}`
  }
  
  return imageUrl
})

// Check if we have multiple variants
const hasMultipleVariants = computed(() => {
  const product = localProduct.value || props.product
  return product?._originalOffer?.variants && product._originalOffer.variants.length > 1
})

// Methods
const extractDomain = (url) => {
  if (!url) return ''
  // Remove protocol and any path after the domain
  const match = url.match(/(?:https?:\/\/)?(?:localhost:\d+\/)?([^\/]+)/i)
  return match ? match[1] : url
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0
  }).format(value || 0)
}

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusClass = (status) => {
  const classes = {
    1: 'status-active',
    3: 'status-archived',
    0: 'status-unavailable'
  }
  return classes[status] || 'status-unknown'
}

const getStatusText = (status) => {
  const texts = {
    1: 'Aktivní',
    3: 'Archivované',
    0: 'Nedostupné'
  }
  return texts[status] || 'Neznámý'
}

const getActiveClass = (active) => {
  // Convert to number for comparison - handle string, number, or undefined
  const numActive = active !== undefined && active !== null ? Number(active) : undefined
  return numActive === 1 ? 'status-active' : 'status-inactive'
}

const getActiveText = (active) => {
  // Convert to number for comparison - handle string, number, or undefined
  const numActive = active !== undefined && active !== null ? Number(active) : undefined
  return numActive === 1 ? 'Aktivní na fanshopu' : 'Neaktivní na fanshopu'
}

const getKastomiStatusText = (statusId) => {
  const id = statusId || 1
  switch(id) {
    case 1: return 'Aktivní'
    case 2: return 'Aktivní (nelze koupit)'
    case 3: return 'Neaktivní'
    case 4: return 'Skrytý'
    default: return 'Neznámý'
  }
}

const getKastomiStatusTextShort = (statusId) => {
  const id = statusId || 1
  switch(id) {
    case 1: return 'Aktivní'
    case 2: return 'Omezený'
    case 3: return 'Neaktivní'
    case 4: return 'Skrytý'
    default: return 'N/A'
  }
}

const getKastomiStatusClass = (statusId) => {
  const id = statusId || 1
  switch(id) {
    case 1: return 'kastomi-active'
    case 2: return 'kastomi-active-nobuy'
    case 3: return 'kastomi-inactive'
    case 4: return 'kastomi-hidden'
    default: return 'kastomi-unknown'
  }
}

const getDisabledReason = (statusId) => {
  const id = statusId || 1
  switch(id) {
    case 3: return 'Produkt je vypnutý na úrovni Kastomi, pro aktivaci nás prosím kontaktujte.'
    case 4: return 'Produkt je vypnutý na úrovni Kastomi, pro aktivaci nás prosím kontaktujte.'
    default: return 'Produkt nemůže být aktivován na vašem fanshopu.'
  }
}

// Get overall status class based on both Kastomi and Channel status
const getOverallStatusClass = () => {
  const product = currentProduct.value
  if (!product) return 'status-inactive'
  
  const kastomiStatus = product._originalOffer?.sales_offer_status_id || product.status || 1
  const channelActive = product._originalOffer?.active_channel !== undefined 
    ? Number(product._originalOffer.active_channel) 
    : (product.active !== undefined ? Number(product.active) : 0)
  
  // Product is active only if Kastomi status is 1 AND channel is active
  if (kastomiStatus === 1 && channelActive === 1) {
    return 'status-active'
  }
  
  // If Kastomi allows but channel is off
  if ((kastomiStatus === 1 || kastomiStatus === 2) && channelActive === 0) {
    return 'status-inactive'
  }
  
  // If Kastomi blocks it
  if (kastomiStatus === 3 || kastomiStatus === 4) {
    return 'status-unavailable'
  }
  
  // If Kastomi is 2 (can't buy) but channel is on
  if (kastomiStatus === 2 && channelActive === 1) {
    return 'status-archived'
  }
  
  return 'status-inactive'
}

// Get overall status text based on both Kastomi and Channel status
const getOverallStatusText = () => {
  const product = currentProduct.value
  if (!product) return 'Neaktivní'
  
  const kastomiStatus = product._originalOffer?.sales_offer_status_id || product.status || 1
  const channelActive = product._originalOffer?.active_channel !== undefined 
    ? Number(product._originalOffer.active_channel) 
    : (product.active !== undefined ? Number(product.active) : 0)
  
  // Product is active only if Kastomi status is 1 AND channel is active
  if (kastomiStatus === 1 && channelActive === 1) {
    return 'Aktivní na fanshopu'
  }
  
  // If Kastomi allows but channel is off
  if ((kastomiStatus === 1 || kastomiStatus === 2) && channelActive === 0) {
    return 'Neaktivní na fanshopu'
  }
  
  // If Kastomi blocks it
  if (kastomiStatus === 3) {
    return 'Neaktivní (Kastomi)'
  }
  
  if (kastomiStatus === 4) {
    return 'Skrytý (Kastomi)'
  }
  
  // If Kastomi is 2 (can't buy) but channel is on
  if (kastomiStatus === 2 && channelActive === 1) {
    return 'Omezený (nelze koupit)'
  }
  
  return 'Neaktivní'
}

const startEdit = (field) => {
  // Cancel all other edits
  Object.keys(editingFields).forEach(key => {
    editingFields[key] = false
  })
  
  // Set edit values from local product or props
  const product = localProduct.value || props.product
  editValues[field] = product?.[field] || ''
  editingFields[field] = true
  
  // Focus on input after DOM update
  setTimeout(() => {
    const input = document.querySelector('.edit-input, .edit-textarea, .edit-select')
    if (input) input.focus()
  }, 50)
}

const cancelEdit = (field) => {
  editingFields[field] = false
  const product = localProduct.value || props.product
  editValues[field] = product?.[field] || ''
}

const toggleActive = async (event) => {
  const isChecked = event.target.checked
  const newActive = isChecked ? 1 : 0
  saving.value = true
  
  try {
    const product = currentProduct.value
    const offerId = product._originalOffer?.id || product.id.split('-')[0]
    
    // Get sales channel URL from auth store
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()
    
    // BOB API requires price to be sent with active status
    // Calculate current price from product data
    const currentPrice = (product.wholesale_price || 0) + (product.club_support || 0)
    
    // Call Edge Function to update active status
    const { data, error } = await supabase.functions.invoke('update-sales-offer', {
      body: {
        id: Number(offerId),
        active: newActive,
        wholesale_price: product.wholesale_price || 0,
        klub_price: product.club_support || 0,
        text: product.description || '',
        sales_channel_url: authStore.salesChannelUrl
      }
    })
    
    if (error) throw error
    
    // Update local product data immediately
    if (!localProduct.value) {
      localProduct.value = { ...props.product }
    }
    localProduct.value.active = newActive
    
    // Also update the _originalOffer if it exists
    if (localProduct.value._originalOffer) {
      localProduct.value._originalOffer.active_channel = newActive
    }
    
    // Emit update to parent
    emit('update', { ...localProduct.value })
    
    lastSaved.value = new Date()
    setTimeout(() => {
      lastSaved.value = null
    }, 3000)
    
  } catch (error) {
    console.error('Error updating active status:', error)
    // Revert the checkbox on error
    event.target.checked = !event.target.checked
    alert('Chyba při změně stavu produktu: ' + error.message)
  } finally {
    saving.value = false
  }
}

const saveField = async (field) => {
  saving.value = true
  try {
    // Extract offer ID from the composite ID or use the original offer ID
    const product = currentProduct.value
    const offerId = product._originalOffer?.id || product.id.split('-')[0]
    
    // Prepare update data based on field
    const updateData = {
      id: Number(offerId)
    }
    
    if (field === 'wholesale_price' || field === 'club_support') {
      updateData.wholesale_price = field === 'wholesale_price' ? editValues.wholesale_price : product.wholesale_price
      updateData.klub_price = field === 'club_support' ? editValues.club_support : product.club_support
    } else if (field === 'status') {
      updateData.status = editValues.status
    } else if (field === 'description') {
      updateData.text = editValues.description
    }
    
    // Get sales channel URL from auth store
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()
    
    // Add sales channel URL to update data
    updateData.sales_channel_url = authStore.salesChannelUrl
    
    // Call Edge Function to update
    const { data, error } = await supabase.functions.invoke('update-sales-offer', {
      body: updateData
    })
    
    if (error) throw error
    
    // Update local product data immediately
    if (!localProduct.value) {
      localProduct.value = { ...props.product }
    }
    localProduct.value[field] = editValues[field]
    
    // Emit update to parent
    emit('update', { ...localProduct.value })
    
    // Close edit mode
    editingFields[field] = false
    lastSaved.value = new Date()
    
    // Clear saved message after 3 seconds
    setTimeout(() => {
      lastSaved.value = null
    }, 3000)
    
  } catch (error) {
    console.error('Error saving field:', error)
    alert('Chyba při ukládání: ' + error.message)
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  // Cancel all edits
  Object.keys(editingFields).forEach(key => {
    editingFields[key] = false
  })
  showImageFullscreen.value = false
  activeTooltip.value = null
  emit('close')
}

const toggleTooltip = (type) => {
  if (activeTooltip.value === type) {
    activeTooltip.value = null
  } else {
    activeTooltip.value = type
  }
}

// Close tooltip when clicking outside
const handleOutsideClick = (event) => {
  if (!event.target.closest('.status-info-icon')) {
    activeTooltip.value = null
  }
}

// Add event listener for outside clicks
onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})

// Watch for product changes
watch(() => props.product, async (newProduct) => {
  if (newProduct) {
    
    // Create local copy of product
    localProduct.value = { ...newProduct }
    
    // Sort variants if they exist in the original offer
    if (localProduct.value._originalOffer?.variants) {
      localProduct.value._originalOffer = {
        ...localProduct.value._originalOffer,
        variants: sortVariants(localProduct.value._originalOffer.variants)
      }
    }
    
    Object.keys(editValues).forEach(key => {
      editValues[key] = newProduct[key] || ''
    })
    
    // Get sales channel URL from auth store
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()
    salesChannelUrl.value = authStore.salesChannelUrl || ''
  } else {
    localProduct.value = null
  }
}, { immediate: true })
</script>

<style scoped>
/* Modal Base */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 1400px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Modal Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 28px 32px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #0084ff 0%, #1e3a8a 100%);
  color: white;
}

.header-left {
  flex: 1;
}

.modal-title {
  margin: 0;
  font-size: 1.875rem;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.header-meta {
  display: flex;
  gap: 20px;
  margin-top: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  opacity: 0.95;
}

.meta-item i {
  font-size: 0.75rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.status-badge i {
  font-size: 0.5rem;
}

.status-badge.status-active {
  background: rgba(34, 197, 94, 0.3);
}

.status-badge.status-archived {
  background: rgba(251, 146, 60, 0.3);
}

.status-badge.status-unavailable {
  background: rgba(239, 68, 68, 0.3);
}

.status-badge.status-inactive {
  background: rgba(107, 114, 128, 0.3);
}

.external-link {
  color: white;
  text-decoration: none;
  opacity: 0.95;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.external-link:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.25rem;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

/* Modal Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  background: #f8f9fa;
}

.content-grid {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 32px;
}

/* Left Column */
.left-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.image-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.main-image-container {
  position: relative;
  width: 100%;
  height: 400px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: zoom-in;
  transition: transform 0.3s;
}

.main-image:hover {
  transform: scale(1.05);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #9ca3af;
}

.image-placeholder i {
  font-size: 4rem;
  margin-bottom: 12px;
}

.image-placeholder span {
  font-size: 0.875rem;
}

.image-zoom-hint {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* Variants Selector */
.variants-selector {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section-subtitle {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-subtitle i {
  color: #0084ff;
  font-size: 0.875rem;
}

.variant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.variant-card {
  position: relative;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.variant-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.variant-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.variant-image-wrapper {
  width: 100%;
  height: 100px;
  margin-bottom: 8px;
}

.variant-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  background: white;
}

.variant-image-placeholder {
  width: 100%;
  height: 100%;
  background: #f9fafb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d1d5db;
  font-size: 1.5rem;
}

.variant-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.variant-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.2;
}

.variant-attributes {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.attribute-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.attribute-badge.size {
  background: #eff6ff;
  color: #3b82f6;
}

.attribute-badge.color {
  background: #f3f4f6;
  color: #6b7280;
}

.variant-selected-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #667eea;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

/* Single Variant Info */
.single-variant-info {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.variant-info-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 600;
}

/* Right Column */
.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Detail Cards */
.detail-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}



.card-title {
  margin: 0 0 20px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-title i {
  color: #0084ff;
  font-size: 1rem;
}

.card-header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* Price Grid */
.price-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.price-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.price-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-readonly-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  color: #9ca3af;
  font-size: 0.75rem;
  opacity: 0.7;
}

.price-readonly-badge i {
  font-size: 0.875rem;
}

.price-label {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.price-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.price-value.final {
  color: #059669;
  font-size: 1.75rem;
}

.final-price-item {
  padding-left: 20px;
  border-left: 3px solid #0084ff;
}

/* Edit Controls */
.edit-btn-inline {
  background: transparent;
  border: none;
  color: #0084ff;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.edit-btn-inline:hover {
  background: rgba(0, 132, 255, 0.1);
  color: #0066cc;
}

.edit-field-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.edit-input,
.edit-select {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #0084ff;
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  background: white;
}

.edit-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #0084ff;
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  resize: vertical;
  background: white;
}

.edit-actions-inline {
  display: flex;
  gap: 4px;
}

.edit-actions-inline.mt-2 {
  margin-top: 8px;
}

.save-btn-inline,
.cancel-btn-inline {
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.save-btn-inline {
  background: #10b981;
  color: white;
}

.save-btn-inline:hover {
  background: #059669;
  transform: translateY(-1px);
}

.cancel-btn-inline {
  background: #ef4444;
  color: white;
}

.cancel-btn-inline:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* Description Content */
.description-content {
  line-height: 1.6;
  color: #374151;
}

.description-content p {
  margin: 0;
}

.no-content {
  color: #9ca3af;
  font-style: italic;
}

/* Status Display - Ultra Compact Design */
.status-card-ultra-compact {
  padding: 12px 16px !important;
}

.status-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-title-compact {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-title-compact i {
  font-size: 12px;
  color: #6b7280;
}

.status-disabled-hint {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef3c7;
  border-radius: 50%;
  cursor: help;
}

.status-disabled-hint i {
  font-size: 10px;
  color: #f59e0b;
}

.status-controls-inline {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f9fafb;
  padding: 8px 12px;
  border-radius: 8px;
}

.status-item-inline {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-micro-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-micro-label i {
  font-size: 9px;
  opacity: 0.6;
}

.status-badge-mini {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  height: 20px;
  display: inline-flex;
  align-items: center;
}

.kastomi-active {
  background: #10b981;
  color: white;
}

.kastomi-active-nobuy {
  background: #f59e0b;
  color: white;
}

.kastomi-inactive {
  background: #ef4444;
  color: white;
}

.kastomi-hidden {
  background: #6b7280;
  color: white;
}

.status-separator {
  color: #d1d5db;
  font-size: 14px;
  user-select: none;
}

/* Info Icon with Tooltip */
.status-info-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  cursor: help;
}

.status-info-icon i {
  font-size: 11px;
  color: #9ca3af;
  transition: color 0.2s;
}

.status-info-icon:hover i {
  color: #6b7280;
}

.status-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  background: #1f2937;
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 400;
  white-space: normal;
  word-wrap: break-word;
  width: fit-content;
  min-width: 200px;
  max-width: 400px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s, transform 0.2s;
  z-index: 1200;
}

.status-tooltip:after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #1f2937;
}

/* Show tooltip on hover (desktop) */
.status-info-icon:hover .status-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(-8px);
}

/* Show tooltip when active (mobile/click) */
.status-info-icon.active .status-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(-8px);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .status-tooltip {
    max-width: 150px;
    font-size: 10px;
  }
}

/* Mini Toggle Switch - Same height as badge */
.toggle-mini {
  position: relative;
  display: inline-block;
  cursor: pointer;
  height: 20px;
}

.toggle-mini.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-mini input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-track {
  display: block;
  width: 36px;
  height: 20px;
  background: #cbd5e1;
  border-radius: 10px;
  transition: all 0.2s;
  position: relative;
}

.toggle-track:before {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.toggle-mini input:checked + .toggle-track {
  background: #10b981;
}

.toggle-mini input:checked + .toggle-track:before {
  transform: translateX(16px);
}

.toggle-mini input:disabled + .toggle-track {
  background: #e5e7eb !important;
}

.toggle-mini input:disabled + .toggle-track:before {
  background: #f3f4f6;
}

/* Removed old toggle switch styles - using compact version above */

.status-active {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
}

.status-archived {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  color: white;
}

.status-unavailable {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  color: white;
}

/* Variants Table */
.variants-table {
  overflow-x: auto;
}

.variants-table table {
  width: 100%;
  border-collapse: collapse;
}

.variants-table th {
  background: #f9fafb;
  padding: 12px;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  border-bottom: 2px solid #e5e7eb;
}

.variants-table td {
  padding: 12px;
  font-size: 0.875rem;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}

.variants-table tr {
  cursor: pointer;
  transition: background 0.2s;
}

.variants-table tr:hover {
  background: #f9fafb;
}

.variants-table tr.selected {
  background: linear-gradient(90deg, rgba(0, 132, 255, 0.05) 0%, rgba(30, 58, 138, 0.05) 100%);
}

.variant-table-image-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.variant-table-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: white;
}

.variant-table-image-placeholder {
  width: 100%;
  height: 100%;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d1d5db;
  font-size: 1rem;
}

.variant-name-cell {
  position: relative;
}


.status-badge-small {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge-small.active {
  background: #10b981;
  color: white;
}

.status-badge-small.inactive {
  background: #ef4444;
  color: white;
}

/* Modal Footer */
.modal-footer {
  padding: 20px 32px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.last-saved {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #10b981;
  font-size: 0.875rem;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #0084ff 0%, #1e3a8a 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1060;
}

.spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #0084ff;
}

.spinner i {
  font-size: 2rem;
}

/* Fullscreen Image */
.fullscreen-image {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1070;
  cursor: zoom-out;
  padding: 40px;
}

.fullscreen-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.fullscreen-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.5rem;
  transition: all 0.2s;
}

.fullscreen-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .modal-container {
  transform: scale(0.95) translateY(20px);
}

.modal-fade-leave-to .modal-container {
  transform: scale(0.95) translateY(20px);
}

/* Responsive */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 350px 1fr;
  }
  
  .main-image-container {
    height: 350px;
  }
}

@media (max-width: 992px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .main-image-container {
    height: 300px;
  }
  
  .variant-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  
  .price-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .final-price-item {
    padding-left: 0;
    padding-top: 16px;
    border-left: none;
    border-top: 3px solid #0084ff;
  }
}

@media (max-width: 640px) {
  .modal-container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .modal-header {
    padding: 20px;
  }
  
  .modal-title {
    font-size: 1.5rem;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .content-grid {
    gap: 20px;
  }
  
  .detail-card {
    padding: 16px;
  }
}
</style>
<template>
  <div class="products-container">
    <!-- Quick Stats -->
    <div class="stats-row" v-if="!loading && offers.length > 0">
      <div class="stat-card-mini">
        <div class="stat-mini-icon" style="background: linear-gradient(135deg, #0084ff 0%, #1e3a8a 100%);">
          <i class="pi pi-box"></i>
        </div>
        <div class="stat-mini-content">
          <div class="stat-mini-value">{{ offers.length }}</div>
          <div class="stat-mini-label">Produktů</div>
        </div>
      </div>
      <div class="stat-card-mini">
        <div class="stat-mini-icon" style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%);">
          <i class="pi pi-tags"></i>
        </div>
        <div class="stat-mini-content">
          <div class="stat-mini-value">{{ totalVariants }}</div>
          <div class="stat-mini-label">Variant</div>
        </div>
      </div>
      <div class="stat-card-mini">
        <div class="stat-mini-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);">
          <i class="pi pi-check-circle"></i>
        </div>
        <div class="stat-mini-content">
          <div class="stat-mini-value">{{ activeProducts }}</div>
          <div class="stat-mini-label">Aktivních</div>
        </div>
      </div>
    </div>

    <!-- Main Content Card -->
    <Card class="products-card">
      <template #header>
        <div class="card-header-content">
          <div class="header-left">
            <h2 class="header-title">
              <i class="pi pi-box mr-2 text-primary"></i>
              Produktová nabídka
            </h2>
            <p class="header-subtitle">Správa produktů a variant</p>
          </div>
          <div class="header-actions">
            <div class="search-box">
              <IconField iconPosition="left">
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText 
                  v-model="globalFilter" 
                  placeholder="Hledat produkty..." 
                  class="search-input"
                />
              </IconField>
            </div>
            <Button 
              @click="fetchProducts" 
              :loading="loading"
              icon="pi pi-refresh"
              severity="primary"
              class="refresh-button"
              v-tooltip.bottom="'Aktualizovat data'"
            />
          </div>
        </div>
      </template>

      <template #content>
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <ProgressSpinner />
          <p class="loading-text">Načítání produktů...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="empty-state">
          <i class="pi pi-exclamation-triangle empty-icon text-red-500"></i>
          <h3 class="empty-title">Chyba při načítání</h3>
          <p class="empty-description">{{ error }}</p>
          <Button 
            @click="fetchProducts" 
            label="Zkusit znovu"
            icon="pi pi-refresh"
            severity="primary"
            class="mt-3"
          />
        </div>

        <!-- Empty State -->
        <div v-else-if="offers.length === 0" class="empty-state">
          <i class="pi pi-inbox empty-icon"></i>
          <h3 class="empty-title">Žádné produkty</h3>
          <p class="empty-description">Nebyly nalezeny žádné produkty pro váš prodejní kanál.</p>
        </div>

        <!-- Products Table -->
        <DataTable 
          v-else
          :value="offers" 
          :paginator="true" 
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="Zobrazeno {first} až {last} z {totalRecords} produktů"
          :globalFilter="globalFilter"
          :globalFilterFields="['name', 'seo', 'id']"
          sortMode="multiple"
          removableSort
          class="modern-table"
          stripedRows
        >
          <Column field="id" header="ID" sortable style="width: 80px">
            <template #body="{ data }">
              <span class="product-id">#{{ data.id }}</span>
            </template>
          </Column>
          
          <Column field="name" header="Název produktu" sortable>
            <template #body="{ data }">
              <div class="product-info">
                <div class="product-name">{{ data.name }}</div>
                <div v-if="data.seo" class="product-seo">
                  {{ data.seo }}
                </div>
              </div>
            </template>
          </Column>
          
          <Column field="variant_count" header="Varianty" sortable style="width: 100px">
            <template #body="{ data }">
              <div class="variant-tag-wrapper" 
                   @mouseenter="(e) => handleVariantHover(e, data.id)"
                   @mouseleave="hoveredVariantId = null">
                <Tag 
                  :value="`${data.variant_count}`"
                  severity="info"
                  class="variant-tag"
                  style="cursor: pointer;"
                />
                
                <!-- Variants Hover Card -->
                <transition name="fade-slide">
                  <div v-if="hoveredVariantId === data.id" 
                       class="variants-hover-card"
                       :style="getHoverCardPosition($event)">
                    <div class="hover-card-arrow"></div>
                    <div class="variants-hover-header">
                      <i class="pi pi-tags"></i>
                      <span>Varianty produktu</span>
                    </div>
                    <div class="variants-table-header">
                      <span class="variants-col-name">Název</span>
                      <span class="variants-col-params">Parametry</span>
                    </div>
                    <div class="variants-hover-list">
                      <div v-for="(variant, idx) in data.variants" 
                           :key="idx" 
                           class="variant-hover-item">
                        <span class="variant-name-col">{{ variant.variant_name || variant.name || 'Bez názvu' }}</span>
                        <span class="variant-params-col">
                          <span v-if="variant.size" class="variant-hover-size">{{ variant.size }}</span>
                          <span v-if="variant.color" class="variant-hover-color">{{ variant.color }}</span>
                          <span v-if="variant.dimensions" class="variant-hover-dimensions">{{ variant.dimensions }}</span>
                          <span v-if="!variant.size && !variant.color && !variant.dimensions" class="variant-no-params">-</span>
                        </span>
                      </div>
                    </div>
                    <div class="variants-hover-footer">
                      <button @click.stop="showProductDetail(data)" class="variant-detail-link">
                        <i class="pi pi-external-link"></i>
                        Podrobnosti
                      </button>
                    </div>
                  </div>
                </transition>
              </div>
            </template>
          </Column>
          
          <Column field="wholesale_price" header="VO cena" sortable style="width: 110px">
            <template #body="{ data }">
              <span class="price-cell">{{ formatCurrency(data.wholesale_price || 0) }}</span>
            </template>
          </Column>
          
          <Column field="klub_price" header="Klub podpora" sortable style="width: 120px">
            <template #body="{ data }">
              <span class="price-cell">{{ formatCurrency(calculateKlubPrice(data)) }}</span>
            </template>
          </Column>
          
          <Column field="price" header="Finální cena" sortable style="width: 120px">
            <template #body="{ data }">
              <span class="price-final">{{ formatCurrency(data.price || 0) }}</span>
            </template>
          </Column>
          
          <Column header="Akce" style="width: 60px" bodyClass="text-center">
            <template #body="{ data }">
              <Button 
                @click="showProductDetail(data)"
                icon="pi pi-eye"
                severity="primary"
                text
                rounded
                v-tooltip.left="'Moderní detail'"
                class="mr-1"
              />
              
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Product Detail Dialog -->
    <ProductDetailDialog 
      :isOpen="showDetailDialog"
      :product="selectedProduct"
      @close="showDetailDialog = false"
      @update="handleProductUpdate"
    />

    <!-- Old Detail Dialog (kept for backwards compatibility) -->
    <Dialog 
      v-model:visible="showOfferDialog" 
      :modal="true" 
      :header="dialogHeader"
      :style="{ width: '90vw', maxWidth: '1200px' }"
      :maximizable="true"
      :dismissableMask="!editingPrices"
      :closeOnEscape="!editingPrices"
      class="product-dialog"
    >
      <div v-if="selectedOffer">
        <!-- View Mode -->
        <div v-if="!editingPrices">
          <!-- Product Info -->
          <div class="info-grid">
            <div class="info-card">
              <div class="info-label">ID produktu</div>
              <div class="info-value">
                <Badge :value="`#${selectedOffer.id}`" severity="secondary" />
              </div>
            </div>
            <div class="info-card">
              <div class="info-label">SEO</div>
              <div class="info-value">{{ selectedOffer.seo || '-' }}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Počet variant</div>
              <div class="info-value">
                <Tag :value="`${selectedOffer.variant_count} variant`" severity="info" />
              </div>
            </div>
            <div class="info-card">
              <div class="info-label">Velkoobchodní cena</div>
              <div class="info-value">
                {{ formatCurrency(selectedOffer.wholesale_price || 0) }}
              </div>
            </div>
            <div class="info-card">
              <div class="info-label">Klubová podpora</div>
              <div class="info-value">
                {{ formatCurrency((selectedOffer.price || 0) - (selectedOffer.wholesale_price || 0)) }}
              </div>
            </div>
            <div class="info-card">
              <div class="info-label">Finální cena</div>
              <div class="info-value text-lg font-bold">
                {{ formatCurrency(selectedOffer.price || 0) }}
              </div>
            </div>
          </div>
          
          <!-- Variants Table -->
          <div v-if="selectedOffer.variants && selectedOffer.variants.length > 0" class="variants-section">
            <h3 class="section-title">
              <i class="pi pi-tags mr-2"></i>
              Varianty produktu
            </h3>
            <DataTable 
              :value="selectedOffer.variants" 
              :paginator="selectedOffer.variants.length > 5"
              :rows="5"
              class="variants-table"
              stripedRows
            >
              <Column field="variant_id" header="ID" style="width: 70px">
                <template #body="{ data }">
                  <span class="variant-id">#{{ data.variant_id }}</span>
                </template>
              </Column>
              
              <Column header="Varianta">
                <template #body="{ data }">
                  <div class="variant-info">
                    <img 
                      v-if="data.image" 
                      :src="data.image" 
                      :alt="data.name"
                      class="variant-image"
                    >
                    <div class="variant-details">
                      <div class="variant-name">{{ data.variant_name || data.name }}</div>
                      <div class="variant-specs">
                        <span v-if="data.size">{{ data.size }}</span>
                        <span v-if="data.color && data.size"> • </span>
                        <span v-if="data.color">{{ data.color }}</span>
                        <span v-if="data.dimensions && (data.size || data.color)"> • </span>
                        <span v-if="data.dimensions">{{ data.dimensions }}</span>
                      </div>
                    </div>
                  </div>
                </template>
              </Column>
              
              <Column field="wholesale_price" header="VO cena" style="width: 100px">
                <template #body="{ data }">
                  <span class="price-cell">{{ formatCurrency(data.wholesale_price || 0) }}</span>
                </template>
              </Column>
              
              <Column field="price" header="Finální cena" style="width: 110px">
                <template #body="{ data }">
                  <span class="price-final">{{ formatCurrency(data.price || 0) }}</span>
                </template>
              </Column>
              
              <Column field="active" header="Stav" style="width: 90px">
                <template #body="{ data }">
                  <Tag 
                    :value="data.active ? 'Aktivní' : 'Neaktivní'"
                    :severity="data.active ? 'success' : 'secondary'"
                    class="status-tag-small"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
        
        <!-- Edit Mode -->
        <div v-else class="edit-mode">
          <div class="edit-info-box">
            <i class="pi pi-info-circle"></i>
            <span>Upravte cenu pro celou nabídku. Tato cena bude platit pro všechny varianty produktu.</span>
          </div>
          
          <div class="price-grid">
            <div class="price-field">
              <label>Velkoobchodní cena</label>
              <InputNumber 
                v-model="variantPrices.wholesale_price"
                mode="currency" 
                currency="CZK" 
                locale="cs-CZ"
                :disabled="true"
                class="w-full"
              />
            </div>
            <div class="price-field">
              <label>Klubová podpora</label>
              <InputNumber 
                v-model="variantPrices.klub_price"
                mode="currency" 
                currency="CZK" 
                locale="cs-CZ"
                @input="updateFinalPrice"
                :min="0"
                class="w-full"
              />
            </div>
            <div class="price-field">
              <label class="font-bold">Finální cena</label>
              <InputNumber 
                v-model="variantPrices.final_price"
                mode="currency" 
                currency="CZK" 
                locale="cs-CZ"
                :disabled="true"
                class="w-full font-bold"
              />
            </div>
          </div>
          
          <div class="description-field">
            <label>Popis produktu</label>
            <Textarea 
              v-model="productText"
              rows="3"
              class="w-full"
              placeholder="Zadejte popis produktu..."
            />
          </div>
          
          <div class="variants-list">
            <h4 class="variants-list-title">Tento produkt obsahuje následující varianty:</h4>
            <div class="variants-chips">
              <Chip v-for="variant in selectedOffer.variants" :key="variant.id" class="variant-chip">
                <span>{{ variant.variant_name || variant.name }}</span>
                <span v-if="variant.size" class="chip-detail">({{ variant.size }})</span>
              </Chip>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <Button 
            v-if="!editingPrices" 
            @click="startPriceEdit"
            label="Upravit ceny"
            icon="pi pi-pencil"
            severity="primary"
          />
          <Button 
            v-if="editingPrices" 
            @click="cancelPriceEdit"
            label="Zrušit"
            icon="pi pi-times"
            severity="secondary"
            outlined
          />
          <Button 
            v-if="editingPrices" 
            @click="savePrices"
            :loading="savingPrices"
            label="Uložit změny"
            icon="pi pi-save"
            severity="success"
          />
          <Button 
            v-if="!editingPrices" 
            @click="closeDialog"
            label="Zavřít"
            severity="secondary"
            outlined
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import Chip from 'primevue/chip'
import ProductDetailDialog from '@/components/ProductDetailDialog.vue'

const authStore = useAuthStore()
const toast = useToast()

// State
const loading = ref(false)
const error = ref(null)
const offers = ref([])
const selectedOffer = ref(null)
const editingPrices = ref(false)
const variantPrices = ref({})
const savingPrices = ref(false)
const productText = ref('')
const globalFilter = ref('')
const showDetailDialog = ref(false)
const selectedProduct = ref(null)
const hoveredVariantId = ref(null)
const hoverCardPosition = ref({ top: 0, left: 0 })

// Computed
const showOfferDialog = computed({
  get: () => selectedOffer.value !== null,
  set: (value) => {
    if (!value) {
      selectedOffer.value = null
      editingPrices.value = false
    }
  }
})

const dialogHeader = computed(() => {
  if (!selectedOffer.value) return ''
  return editingPrices.value 
    ? `Úprava cen: ${selectedOffer.value.name}`
    : `Detail produktu: ${selectedOffer.value.name}`
})

const totalVariants = computed(() => {
  return offers.value.reduce((sum, offer) => sum + (offer.variant_count || 0), 0)
})

const activeProducts = computed(() => {
  return offers.value.filter(offer => {
    if (!offer.variants) return true
    return offer.variants.some(v => v.active)
  }).length
})

// Methods
const fetchProducts = async () => {
  loading.value = true
  error.value = null
  
  try {
    if (!authStore.salesChannelUrl) {
      error.value = 'Sales channel URL není k dispozici'
      offers.value = []
      return
    }

    const { data, error: fetchError } = await supabase.functions.invoke('get-sales-offers', {
      body: {
        sales_channel_url: authStore.salesChannelUrl
      }
    })
    
    if (fetchError) throw fetchError
    
    offers.value = data.offers || []
  } catch (err) {
    console.error('Error fetching sales offers:', err)
    error.value = err.message || 'Chyba při načítání produktů'
    offers.value = []
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0
  }).format(value)
}

const calculateKlubPrice = (offer) => {
  const wholesale = offer.wholesale_price || 0
  const final = offer.price || 0
  return final - wholesale
}



const handleVariantHover = (event, offerId) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const cardWidth = 300
  
  // Calculate left position (center above the tag)
  let left = rect.left + (rect.width / 2) - (cardWidth / 2)
  
  // Prevent card from going off-screen
  if (left < 10) left = 10
  if (left + cardWidth > window.innerWidth - 10) {
    left = window.innerWidth - cardWidth - 10
  }
  
  // Position DIRECTLY touching the top of the badge
  // The card will appear with its bottom edge touching the badge top
  let top = rect.top
  
  // Set position first
  hoverCardPosition.value = {
    top: `${top}px`,
    left: `${left}px`,
    transform: 'translateY(-100%)'  // Move card up by its full height
  }
  
  // Then show the card
  hoveredVariantId.value = offerId
}

const getHoverCardPosition = () => {
  return {
    top: hoverCardPosition.value.top,
    left: hoverCardPosition.value.left,
    transform: hoverCardPosition.value.transform || 'translateY(-100%)'
  }
}

const showProductDetail = (offer) => {
  // Transform the offer data to match the ProductDetailDialog expected format
  const wholesale = offer.wholesale_price || 0
  const final = offer.price || 0
  const klubPrice = final - wholesale
  
  selectedProduct.value = {
    id: `${offer.id}-0`, // Create a composite ID
    variant_id: offer.id,
    name: offer.name,
    variant_name: offer.variants?.[0]?.variant_name || offer.variants?.[0]?.name || '',
    size: offer.variants?.[0]?.size || '',
    color: offer.variants?.[0]?.color || '',
    wholesale_price: wholesale,
    club_support: klubPrice,
    final_price: final,
    status: offer.variants?.some(v => v.active) ? 1 : 0,
    description: offer.sales_offer_text || offer.text || '',
    image: offer.variants?.[0]?.image || null,
    // Include original offer data for reference
    _originalOffer: offer
  }
  showDetailDialog.value = true
}

const handleProductUpdate = (updatedProduct) => {
  // Update the offer in the local state
  const offerIndex = offers.value.findIndex(o => o.id === updatedProduct._originalOffer?.id)
  if (offerIndex !== -1) {
    offers.value[offerIndex] = {
      ...offers.value[offerIndex],
      wholesale_price: updatedProduct.wholesale_price,
      price: updatedProduct.final_price,
      sales_offer_text: updatedProduct.description
    }
  }
}

const closeDialog = () => {
  selectedOffer.value = null
  editingPrices.value = false
  variantPrices.value = {}
}

const startPriceEdit = () => {
  editingPrices.value = true
  // Calculate klub_price as the difference between final price and wholesale price
  const wholesale = selectedOffer.value.wholesale_price || 0
  const final = selectedOffer.value.price || 0
  const klubPrice = final - wholesale
  
  variantPrices.value = {
    wholesale_price: wholesale,
    klub_price: klubPrice > 0 ? klubPrice : 0,
    final_price: final
  }
  productText.value = selectedOffer.value.sales_offer_text || ''
}

const cancelPriceEdit = () => {
  editingPrices.value = false
  variantPrices.value = {}
}

const updateFinalPrice = () => {
  variantPrices.value.final_price = Number(variantPrices.value.wholesale_price) + Number(variantPrices.value.klub_price || 0)
}

const savePrices = async () => {
  savingPrices.value = true
  
  try {
    const { data, error: saveError } = await supabase.functions.invoke('update-sales-offer', {
      body: {
        id: selectedOffer.value.id,
        wholesale_price: variantPrices.value.wholesale_price,
        klub_price: variantPrices.value.klub_price,
        text: productText.value || '',
        active: true,
        sales_channel_url: authStore.salesChannelUrl
      }
    })
    
    if (saveError) throw saveError
    
    const offerIndex = offers.value.findIndex(o => o.id === selectedOffer.value.id)
    if (offerIndex !== -1) {
      offers.value[offerIndex] = {
        ...offers.value[offerIndex],
        wholesale_price: variantPrices.value.wholesale_price,
        klub_price: variantPrices.value.klub_price,
        price: variantPrices.value.final_price
      }
    }
    
    editingPrices.value = false
    variantPrices.value = {}
    selectedOffer.value = null
    
    toast.add({
      severity: 'success',
      summary: 'Úspěšně uloženo',
      detail: 'Ceny byly úspěšně aktualizovány.',
      life: 3000
    })
    
    setTimeout(async () => {
      await fetchProducts()
    }, 3000)
    
  } catch (err) {
    console.error('Error saving prices:', err)
    toast.add({
      severity: 'error',
      summary: 'Chyba při ukládání',
      detail: 'Chyba při ukládání cen: ' + err.message,
      life: 5000
    })
  } finally {
    savingPrices.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.products-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card-mini {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-card-mini:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-mini-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.stat-mini-content {
  flex: 1;
}

.stat-mini-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.stat-mini-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-top: 0.25rem;
}

/* Main Card */
.products-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.header-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
}

.header-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.search-box {
  width: 250px;
}

.search-input {
  height: 2.25rem;
  font-size: 0.875rem;
}

.refresh-button {
  height: 2.25rem;
  padding: 0 0.75rem;
}

/* Table Styles */
.modern-table :deep(.p-datatable-thead > tr > th) {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem;
  border: none;
  border-bottom: 1px solid #e5e7eb;
}

.modern-table :deep(.p-datatable-tbody > tr) {
  transition: all 0.2s;
}

.modern-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f9fafb !important;
}

.modern-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.75rem;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  overflow: visible;
}

.modern-table :deep(.p-datatable-wrapper) {
  overflow: visible;
}

.modern-table :deep(.p-datatable-table) {
  overflow: visible;
}

.product-id {
  font-family: 'Monaco', 'Courier New', monospace;
  font-weight: 600;
  color: #6366f1;
  font-size: 0.875rem;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.product-name {
  font-weight: 600;
  color: #111827;
  font-size: 0.875rem;
}

.product-seo {
  font-size: 0.75rem;
  color: #6b7280;
}

.price-cell {
  font-size: 0.875rem;
  color: #374151;
}

.price-final {
  font-weight: 700;
  color: #111827;
  font-size: 0.875rem;
}

/* Variant Tag and Hover Card */
.variant-tag-wrapper {
  position: relative;
  display: inline-block;
}

.variant-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  transition: all 0.2s;
}

.variant-tag:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.variants-hover-card {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  min-width: 280px;
  max-width: 350px;
  z-index: 9999;
  overflow: visible;
}

.hover-card-arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 12px;
  background: white;
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  transform: translateX(-50%) rotate(45deg);
  z-index: -1;
}


.variants-hover-header {
  padding: 12px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px 12px 0 0;
  position: relative;
  z-index: 1;
}

.variants-hover-header i {
  font-size: 1rem;
}

.variants-table-header {
  display: flex;
  padding: 8px 16px;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #6b7280;
}

.variants-col-name {
  flex: 1.2;
}

.variants-col-params {
  flex: 1;
  text-align: right;
}

.variants-hover-list {
  padding: 0;
  max-height: 250px;
  overflow-y: auto;
}

.variant-hover-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  font-size: 0.8125rem;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.2s;
}

.variant-hover-item:hover {
  background: #f9fafb;
}

.variant-hover-item:last-child {
  border-bottom: none;
}

.variant-name-col {
  flex: 1.2;
  font-weight: 500;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 10px;
}

.variant-params-col {
  flex: 1;
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  align-items: center;
}

.variant-no-params {
  color: #d1d5db;
  font-style: italic;
}

.variant-hover-size {
  background: #eff6ff;
  color: #3b82f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.variant-hover-color {
  background: #f3f4f6;
  color: #6b7280;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.variant-hover-dimensions {
  background: #fef3c7;
  color: #92400e;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.variants-hover-footer {
  padding: 0;
  border-top: 1px solid #e5e7eb;
}

.variant-detail-link {
  width: 100%;
  padding: 10px 16px;
  background: #f9fafb;
  border: none;
  color: #3b82f6;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.variant-detail-link:hover {
  background: #eff6ff;
  color: #2563eb;
}

.variant-detail-link i {
  font-size: 0.875rem;
}

/* Transition animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Scrollbar for variants list */
.variants-hover-list::-webkit-scrollbar {
  width: 4px;
}

.variants-hover-list::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 2px;
}

.variants-hover-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.variants-hover-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.loading-text {
  margin-top: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.empty-icon {
  font-size: 3rem;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.empty-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  color: #111827;
}

.empty-description {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

/* Dialog Styles */
.product-dialog :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #0084ff 0%, #1e3a8a 100%);
  color: white;
  padding: 1rem 1.5rem;
}

.product-dialog :deep(.p-dialog-content) {
  padding: 1.5rem;
}

/* Fullscreen mode styles */
.product-dialog :deep(.p-dialog.p-dialog-maximized) {
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  max-height: 100vh !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  margin: 0 !important;
  border-radius: 0 !important;
  transform: none !important;
  position: fixed !important;
}

.product-dialog :deep(.p-dialog-maximized .p-dialog-content) {
  flex: 1 1 auto;
  overflow-y: auto;
  height: calc(100vh - 120px); /* Account for header and footer */
  width: 100%;
  max-width: none !important;
}

/* Dialog mask for click outside to close */
:deep(.p-dialog-mask) {
  backdrop-filter: blur(2px);
  background: rgba(0, 0, 0, 0.4);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-card {
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.info-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.5rem;
}

.info-value {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
}

/* Variants Section */
.variants-section {
  margin-top: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.variants-table :deep(.p-datatable-thead > tr > th) {
  background: #f9fafb;
  font-size: 0.75rem;
  padding: 0.5rem;
}

.variants-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.5rem;
  font-size: 0.875rem;
}

.variant-id {
  font-family: 'Monaco', 'Courier New', monospace;
  color: #6366f1;
  font-size: 0.75rem;
}

.variant-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.variant-image {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.variant-details {
  flex: 1;
}

.variant-name {
  font-weight: 500;
  color: #111827;
  font-size: 0.875rem;
}

.variant-specs {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.125rem;
}

.stock-tag-small,
.status-tag-small {
  font-size: 0.7rem;
  padding: 0.125rem 0.375rem;
}

/* Edit Mode */
.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.edit-info-box {
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #1e40af;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-info-box i {
  font-size: 1.125rem;
}

.price-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.price-field label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.description-field {
  margin-top: 1rem;
}

.description-field label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.variants-list {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.variants-list-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.variants-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.variant-chip {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.8125rem;
}

.chip-detail {
  color: #6b7280;
  margin-left: 0.25rem;
}

.dialog-footer {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* PrimeVue Customizations */
:deep(.p-card-content) {
  padding: 0;
}

:deep(.p-button) {
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s;
}

:deep(.p-inputtext) {
  border-radius: 6px;
  font-size: 0.875rem;
}

:deep(.p-inputnumber input) {
  border-radius: 6px;
  font-size: 0.875rem;
}

:deep(.p-textarea) {
  border-radius: 6px;
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr 1fr;
  }
  
  .card-header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .search-box {
    flex: 1;
  }
  
  .price-grid {
    grid-template-columns: 1fr;
  }
}
</style>
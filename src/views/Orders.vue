<template>
  <div class="orders-container">
    <!-- Main Content Card -->
    <Card class="orders-card">
      <template #header>
        <div class="card-header-content">
          <div class="header-left">
            <h2 class="header-title">
              <i class="pi pi-shopping-cart mr-2 text-primary"></i>
              Správa objednávek
            </h2>
            <p class="header-subtitle">Přehled a zpracování objednávek</p>
          </div>
          <div class="header-actions">
            <Button 
              @click="exportOrders" 
              icon="pi pi-file-excel"
              label="Export"
              severity="success"
              class="export-button"
              v-tooltip.bottom="'Exportovat do Excelu'"
            />
            <Button
              @click="fetchOrders"
              :loading="loading"
              icon="pi pi-refresh"
              severity="secondary"
              class="refresh-button"
              v-tooltip.bottom="'Aktualizovat data'"
            />
          </div>
        </div>
      </template>

      <template #content>
        <!-- Quick Stats -->
        <StatsRow
          v-if="!loading && orders.length > 0"
          :stats="[
            {
              icon: 'pi pi-shopping-cart',
              value: orderStats.totalOrders,
              label: 'Celkem objednávek',
              variant: 'info',
              format: 'number'
            },
            {
              icon: 'pi pi-wallet',
              value: orderStats.totalRevenue,
              label: 'Celková tržba',
              variant: 'success',
              format: 'currency'
            },
            {
              icon: 'pi pi-sync',
              value: orderStats.activeOrders,
              label: 'Aktivní',
              variant: 'warning',
              format: 'number'
            },
            {
              icon: 'pi pi-check-circle',
              value: orderStats.completedOrders,
              label: 'Dokončené',
              variant: 'success',
              format: 'number'
            }
          ]"
        />


        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <ProgressSpinner />
          <p class="loading-text">Načítání objednávek...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="orders.length === 0" class="empty-state">
          <i class="pi pi-inbox empty-icon"></i>
          <h3 class="empty-title">Žádné objednávky</h3>
          <p class="empty-description">Zatím nemáte žádné objednávky.</p>
        </div>

        <!-- Orders Table -->
        <DataTableWithScroll
          v-else
          :value="orders"
          :paginator="true"
          :rows="100"
          :rowsPerPageOptions="[50, 100, 500, 1000]"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="Zobrazeno {first} až {last} z {totalRecords} objednávek"
          removableSort
          class="modern-table"
          stripedRows
          :rowHover="true"
          v-model:expandedRows="expandedRows"
          v-model:filters="columnFilters"
          filterDisplay="row"
          dataKey="id"
          :enableDualScroll="true"
        >
          <Column field="id" header="ID" sortable style="width: 100px" :showFilterMenu="false">
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                @input="filterCallback()"
                placeholder="Hledat ID..."
                class="p-column-filter"
              />
            </template>
            <template #body="{ data }">
              <span class="order-id">#{{ data.order_number || data.id }}</span>
            </template>
          </Column>
          
          <Column field="created_at" header="Datum" sortable style="width: 180px" :showFilterMenu="false">
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                @input="filterCallback()"
                placeholder="Hledat datum..."
                class="p-column-filter"
              />
            </template>
            <template #body="{ data }">
              <div class="date-cell">
                <div class="date-main">{{ formatDate(data.created_at) }}</div>
                <div class="date-time">{{ formatTime(data.created_at) }}</div>
              </div>
            </template>
          </Column>
          
          <Column field="customer_name" header="Zákazník" sortable :showFilterMenu="false">
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                @input="filterCallback()"
                placeholder="Hledat zákazníka..."
                class="p-column-filter"
              />
            </template>
            <template #body="{ data }">
              <div class="customer-info">
                <div class="customer-name">{{ data.customer_name || 'Neznámý' }}</div>
                <div v-if="data.customer_email" class="customer-email">
                  <i class="pi pi-envelope"></i>
                  {{ data.customer_email }}
                </div>
              </div>
            </template>
          </Column>
          
          <Column field="item_count" header="Položky" sortable style="width: 100px" :showFilterMenu="false">
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                @input="filterCallback()"
                placeholder="Počet..."
                class="p-column-filter"
                type="number"
              />
            </template>
            <template #body="{ data }">
              <Badge
                :value="data.item_count || 0"
                severity="secondary"
                class="items-badge"
              />
            </template>
          </Column>
          
          <Column field="total" header="Celkem" sortable style="width: 140px" :showFilterMenu="false">
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                @input="filterCallback()"
                placeholder="Částka..."
                class="p-column-filter"
                type="number"
              />
            </template>
            <template #body="{ data }">
              <span class="price-total">{{ formatCurrency(data.total) }}</span>
            </template>
          </Column>

          <Column field="club_support" header="Klub. podpora" sortable style="width: 140px" :showFilterMenu="false">
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                @input="filterCallback()"
                placeholder="Podpora..."
                class="p-column-filter"
                type="number"
              />
            </template>
            <template #body="{ data }">
              <span class="club-support-amount">{{ formatCurrency(getOrderClubSupport(data)) }}</span>
            </template>
          </Column>
          
          <Column field="status" header="Stav" sortable style="width: 140px" :showFilterMenu="false">
            <template #filter="{ filterModel, filterCallback }">
              <Select
                v-model="filterModel.value"
                @change="filterCallback()"
                :options="[
                  {label: 'Vše', value: null},
                  {label: 'Aktivní', value: 'Aktivní'},
                  {label: 'Čeká', value: 'Čeká'},
                  {label: 'Dokončeno', value: 'Dokončeno'},
                  {label: 'Zrušeno', value: 'Zrušeno'}
                ]"
                optionLabel="label"
                optionValue="value"
                placeholder="Vše"
                class="p-column-filter"
                showClear
              />
            </template>
            <template #body="{ data }">
              <Tag 
                :severity="getOrderStatusSeverity(data.status)" 
                :value="getOrderStatusText(data.status)"
                :icon="getOrderStatusIcon(data.status)"
                class="status-tag"
              />
            </template>
          </Column>
          
          <Column header="Akce" style="width: 60px" bodyClass="text-center">
            <template #body="{ data }">
              <div class="action-buttons">

                <Button 
                  @click="viewOrderDetail(data)"
                  icon="pi pi-eye"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  v-tooltip.left="'Detail objednávky'"
                />
              </div>
            </template>
          </Column>
          <!-- Expandable row for order items -->
          <template #expansion="{ data }">
            <div class="order-items-expansion">
              <div v-if="orderItemsCache[data.id]?.loading" class="items-loading">
                <ProgressSpinner style="width: 30px; height: 30px" />
                <span class="ml-2">Načítání položek objednávky...</span>
              </div>
              <div v-else-if="orderItemsCache[data.id]?.error" class="items-error">
                <i class="pi pi-exclamation-triangle mr-2"></i>
                {{ orderItemsCache[data.id].error }}
              </div>
              <!-- Custom formatted view like in dialog -->
              <div v-else-if="orderItemsCache[data.id]?.parsedItems" class="expansion-items-custom">
                <!-- Products list -->
                <div class="expansion-products-section">
                  <table class="expansion-items-table">
                    <thead>
                      <tr>
                        <th>Produkt</th>
                        <th>Množství</th>
                        <th class="text-right">Cena</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in orderItemsCache[data.id].parsedItems.products" :key="'exp-product-' + index">
                        <td>
                          <a @click.prevent="showProductDetail(item.name)" class="product-link" href="#" title="Zobrazit detail produktu">
                            {{ item.name }}
                          </a>
                        </td>
                        <td>{{ item.quantity }}</td>
                        <td class="text-right">{{ item.priceFormatted }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <!-- Divider -->
                <div class="expansion-divider"></div>
                
                <!-- Shipping -->
                <div v-if="orderItemsCache[data.id].parsedItems.shipping" class="expansion-row">
                  <span class="expansion-label">{{ orderItemsCache[data.id].parsedItems.shipping.name }}</span>
                  <span class="expansion-value">{{ orderItemsCache[data.id].parsedItems.shipping.priceFormatted }}</span>
                </div>
                

                <!-- Club Support Sum -->
                <div v-if="orderItemsCache[data.id].parsedItems.clubSupport > 0" class="expansion-row">
                  <span class="expansion-label">Klubová podpora celkem</span>
                  <span class="expansion-value">{{ formatCurrency(orderItemsCache[data.id].parsedItems.clubSupport) }}</span>
                </div>
                
                <!-- Total -->
                <div class="expansion-total">
                  <span class="expansion-label-total">Celkem k úhradě</span>
                  <span class="expansion-value-total">{{ formatCurrency(orderItemsCache[data.id].parsedItems.total || data.total) }}</span>
                </div>
              </div>
              <!-- Fallback to HTML -->
              <div v-else-if="orderItemsCache[data.id]?.html" class="items-html" v-html="orderItemsCache[data.id].html"></div>
              <div v-else class="items-empty">
                <i class="pi pi-inbox mr-2"></i>
                Žádné položky k zobrazení
              </div>
            </div>
          </template>
        </DataTableWithScroll>
      </template>
    </Card>

    <!-- Order Detail Dialog -->
    <Dialog 
      v-model:visible="showOrderDialog" 
      :modal="true" 
      :header="orderDialogHeader"
      :style="{ width: '90vw', maxWidth: '1100px' }"
      :maximizable="true"
      :dismissableMask="true"
      :closeOnEscape="true"
      class="order-dialog"
    >
      <div v-if="selectedOrder">
        <!-- Order Summary Section -->
        <div class="order-summary-section">
          <div class="summary-header">
            <i class="pi pi-info-circle"></i>
            <span>Souhrn objednávky</span>
          </div>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-icon" style="background: linear-gradient(135deg, #0084ff 0%, #1e3a8a 100%);">
                <i class="pi pi-hashtag"></i>
              </div>
              <div class="summary-content">
                <div class="summary-label">Číslo objednávky</div>
                <div class="summary-value">#{{ selectedOrder.order_number || selectedOrder.id }}</div>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon" style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%);">
                <i class="pi pi-calendar"></i>
              </div>
              <div class="summary-content">
                <div class="summary-label">Datum vytvoření</div>
                <div class="summary-value">{{ formatFullDate(selectedOrder.created_at) }}</div>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);">
                <i class="pi pi-flag"></i>
              </div>
              <div class="summary-content">
                <div class="summary-label">Stav objednávky</div>
                <div class="summary-value">
                  <Tag 
                    :severity="getOrderStatusSeverity(selectedOrder.status)" 
                    :value="getOrderStatusText(selectedOrder.status)"
                    :icon="getOrderStatusIcon(selectedOrder.status)"
                    class="status-tag"
                  />
                </div>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                <i class="pi pi-wallet"></i>
              </div>
              <div class="summary-content">
                <div class="summary-label">Celková částka</div>
                <div class="summary-value price-highlight">{{ formatCurrency(selectedOrder.total) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Customer Info -->
        <div class="customer-detail-section">
          <div class="section-header">
            <i class="pi pi-user"></i>
            <span>Informace o zákazníkovi</span>
          </div>
          <div class="customer-detail-grid">
            <div class="detail-item">
              <i class="pi pi-user detail-icon"></i>
              <div>
                <div class="detail-label">Jméno zákazníka</div>
                <div class="detail-value">{{ selectedOrder.customer_name || 'Neznámý' }}</div>
              </div>
            </div>
            <div class="detail-item" v-if="selectedOrder.customer_email">
              <i class="pi pi-envelope detail-icon"></i>
              <div>
                <div class="detail-label">Email</div>
                <div class="detail-value">{{ selectedOrder.customer_email }}</div>
              </div>
            </div>
            <div class="detail-item" v-if="selectedOrder.customer_phone">
              <i class="pi pi-phone detail-icon"></i>
              <div>
                <div class="detail-label">Telefon</div>
                <div class="detail-value">{{ selectedOrder.customer_phone }}</div>
              </div>
            </div>
            <div class="detail-item" v-if="selectedOrder.delivery_address">
              <i class="pi pi-map-marker detail-icon"></i>
              <div>
                <div class="detail-label">Dodací adresa</div>
                <div class="detail-value">{{ selectedOrder.delivery_address }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Items/Variants -->
        <div class="variants-section">
          <div class="section-header">
            <i class="pi pi-list"></i>
            <span>Položky objednávky</span>
            <ProgressSpinner 
              v-if="loadingOrderItems"
              style="width: 20px; height: 20px; margin-left: 8px"
              strokeWidth="4"
            />
          </div>
          
          <!-- Loading state -->
          <div v-if="loadingOrderItems" class="empty-variants">
            <ProgressSpinner style="width: 50px; height: 50px" />
            <p class="text-600 mt-3">Načítání položek objednávky...</p>
          </div>
          
          <!-- Custom formatted order items -->
          <div v-else-if="selectedOrder.parsedItems" class="order-items-custom">
            <!-- Products list -->
            <div class="items-section-products">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Produkt</th>
                    <th>Množství</th>
                    <th class="text-right">Cena</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in selectedOrder.parsedItems.products" :key="'product-' + index">
                    <td>
                      <a @click.prevent="showProductDetail(item.name)" class="product-link" href="#" title="Zobrazit detail produktu">
                        {{ item.name }}
                      </a>
                    </td>
                    <td>{{ item.quantity }}</td>
                    <td class="text-right">{{ item.priceFormatted }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Divider -->
            <div class="items-divider"></div>

            <!-- Shipping -->
            <div v-if="selectedOrder.parsedItems.shipping" class="items-section-row">
              <span class="items-label">{{ selectedOrder.parsedItems.shipping.name }}</span>
              <span class="items-value">{{ selectedOrder.parsedItems.shipping.priceFormatted }}</span>
            </div>

  
            <!-- Club Support Sum -->
            <div v-if="selectedOrder.parsedItems.clubSupport > 0" class="items-section-row">
              <span class="items-label">Klubová podpora celkem</span>
              <span class="items-value">{{ formatCurrency(selectedOrder.parsedItems.clubSupport) }}</span>
            </div>
            
            <!-- Total -->
            <div class="items-section-total">
              <span class="items-label-total">Celkem k úhradě</span>
              <span class="items-value-total">{{ formatCurrency(selectedOrder.parsedItems.total || selectedOrder.total) }}</span>
            </div>
          </div>
          
          <!-- Fallback to original HTML content from BOB API -->
          <div v-else-if="selectedOrder.itemsHtml" class="order-items-html" v-html="selectedOrder.itemsHtml"></div>
          
          <!-- Empty state -->
          <div v-else class="empty-variants">
            <i class="pi pi-inbox text-3xl text-400 mb-2"></i>
            <p class="text-600 m-0">Žádné položky v objednávce</p>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <Button 
            @click="closeOrderDialog"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { FilterMatchMode } from '@primevue/core/api'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import StatsRow from '@/components/StatsRow.vue'
import DataTableWithScroll from '@/components/DataTableWithScroll.vue'
import {
  mapToSimplifiedStatus,
  getStatusSeverity,
  getStatusIcon,
  SIMPLIFIED_STATUSES,
  filterOrdersByStatus
} from '@/utils/orderStatusMapping'

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

// State
const loading = ref(false)
const loadingOrderItems = ref(false)
const orders = ref([])
const selectedOrder = ref(null)
const showOrderDialog = ref(false)
const expandedRows = ref({})
const orderItemsCache = ref({})

// Filters removed

// Column filters for DataTable
const columnFilters = ref({
  id: { value: null, matchMode: FilterMatchMode.CONTAINS },
  created_at: { value: null, matchMode: FilterMatchMode.CONTAINS },
  customer_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  customer_email: { value: null, matchMode: FilterMatchMode.CONTAINS },
  item_count: { value: null, matchMode: FilterMatchMode.EQUALS },
  total: { value: null, matchMode: FilterMatchMode.EQUALS },
  club_support: { value: null, matchMode: FilterMatchMode.EQUALS },
  status: { value: null, matchMode: FilterMatchMode.EQUALS }
})

// Table controls removed

// Computed
const totalOrders = computed(() => orders.value.length)

// Stats for the stats cards
const orderStats = computed(() => {
  const stats = {
    totalOrders: orders.value.length,
    totalRevenue: 0,
    activeOrders: 0,
    completedOrders: 0
  }

  orders.value.forEach(order => {
    // Total revenue
    if (order.total) {
      stats.totalRevenue += parseFloat(order.total) || 0
    }

    // Status counts
    const simplified = mapToSimplifiedStatus(order.status)
    if (simplified === SIMPLIFIED_STATUSES.ACTIVE) {
      stats.activeOrders++
    } else if (simplified === SIMPLIFIED_STATUSES.COMPLETED) {
      stats.completedOrders++
    }
  })

  return stats
})

const orderDialogHeader = computed(() => {
  if (!selectedOrder.value) return ''
  return `Detail objednávky #${selectedOrder.value.order_number || selectedOrder.value.id}`
})

// Methods
const fetchOrders = async () => {
  loading.value = true
  try {
    if (!authStore.salesChannelUrl) {
      console.warn('Sales channel URL not available yet')
      orders.value = []
      return
    }

    const { data, error } = await supabase.functions.invoke('get-orders', {
      body: {
        sales_channel_url: authStore.salesChannelUrl
      }
    })
    
    if (error) throw error
    
    // Sort orders by ID descending (highest first)
    orders.value = (data.orders || []).sort((a, b) => b.id - a.id)
    
    // Preload club support data for all orders
    preloadClubSupportData()
    
    toast.add({ 
      severity: 'success', 
      summary: 'Data aktualizována', 
      detail: `Načteno ${orders.value.length} objednávek`, 
      life: 3000 
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    orders.value = []
    toast.add({ 
      severity: 'error', 
      summary: 'Chyba', 
      detail: 'Nepodařilo se načíst objednávky', 
      life: 5000 
    })
  } finally {
    loading.value = false
  }
}

// Filter functions removed

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatFullDate = (date) => {
  return new Date(date).toLocaleString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0
  }).format(value || 0)
}

const getOrderStatusSeverity = (status) => {
  const simplified = mapToSimplifiedStatus(status)
  return getStatusSeverity(simplified)
}

const getOrderStatusText = (status) => {
  return mapToSimplifiedStatus(status)
}

const getOrderStatusIcon = (status) => {
  const simplified = mapToSimplifiedStatus(status)
  return getStatusIcon(simplified)
}

const getOrderClubSupport = (order) => {
  // Check if we have cached order items with parsed club support
  if (orderItemsCache.value[order.id]?.parsedItems?.clubSupport) {
    return orderItemsCache.value[order.id].parsedItems.clubSupport
  }
  
  // If order has club_support property (from backend), use it
  if (order.club_support !== undefined) {
    return order.club_support
  }
  
  // Default to 0 if no data available
  return 0
}

const parseOrderItemsHtml = (html) => {
  if (!html) return null
  
  const result = {
    products: [],
    shipping: null,
    clubSupport: 0,
    total: 0
  }
  
  // Create a temporary element to parse HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  
  // Find all table rows
  const rows = tempDiv.querySelectorAll('tr')
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td')
    if (cells.length === 0) return
    
    // Get text content from cells
    const cellTexts = Array.from(cells).map(cell => cell.textContent?.trim() || '')
    
    // Check if this is a product row (has class 'l')
    if (row.classList.contains('l')) {
      const name = cellTexts[0] || ''
      
      // Check if it's a shipping row
      if (name.includes('Dopravné') || name.includes('balné') || name.includes('DOPRAVA')) {
        const priceText = cellTexts[cellTexts.length - 1]
        result.shipping = {
          name: name,
          priceFormatted: priceText
        }
      } else if (name && name.includes('Klubová podpora')) {
        // It's a club support row - extract the amount
        const priceText = cellTexts[cellTexts.length - 1]
        const match = priceText.match(/([\d\s]+(?:,\d+)?)\s*Kč/)
        if (match) {
          const value = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'))
          result.clubSupport += value
        }
      } else if (name && !name.includes('Celkem')) {
        // It's a product row
        result.products.push({
          name: cellTexts[0],
          variant: cellTexts[1] || '',
          quantity: cellTexts[2] || '',
          priceFormatted: cellTexts[cellTexts.length - 1] || ''
        })
      }
    }
    
    // Check for total row
    if (cellTexts.some(text => text.includes('Celkem'))) {
      const totalText = cellTexts[cellTexts.length - 1]
      const totalMatch = totalText.match(/([\d\s]+(?:,\d+)?)\s*Kč/)
      if (totalMatch) {
        result.total = parseFloat(totalMatch[1].replace(/\s/g, '').replace(',', '.'))
      }
    }
  })
  
  // Also check for total in bold tags
  const boldElements = tempDiv.querySelectorAll('b')
  boldElements.forEach(elem => {
    const text = elem.textContent || ''
    const match = text.match(/([\d\s]+(?:,\d+)?)\s*Kč/)
    if (match) {
      const value = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'))
      if (value > result.total) result.total = value
    }
  })
  
  return result
}

const viewOrderDetail = async (order) => {
  console.log('[Orders.vue] Opening order detail for order:', order)
  
  selectedOrder.value = order
  showOrderDialog.value = true
  loadingOrderItems.value = true
  
  // Check if we already have the data cached from the expand functionality
  if (orderItemsCache.value[order.id]?.html) {
    console.log('[Orders.vue] Using cached order items HTML')
    const parsedItems = parseOrderItemsHtml(orderItemsCache.value[order.id].html)
    selectedOrder.value = {
      ...selectedOrder.value,
      itemsHtml: orderItemsCache.value[order.id].html,
      parsedItems: parsedItems
    }
    loadingOrderItems.value = false
    return
  }
  
  // Fetch order items using the BOB API
  try {
    console.log('[Orders.vue] Calling bob-order-items with objednavka_id:', order.id)
    
    const { data, error } = await supabase.functions.invoke('bob-order-items', {
      body: { 
        objednavka_id: order.id.toString()
      }
    })
    
    console.log('[Orders.vue] BOB API response:', { data, error })
    
    if (error) throw error
    
    if (data?.data?.html) {
      console.log('[Orders.vue] Successfully received HTML content for dialog')
      // Parse the HTML to extract structured data
      const parsedItems = parseOrderItemsHtml(data.data.html)
      
      // Cache the result
      orderItemsCache.value[order.id] = {
        loading: false,
        error: null,
        html: data.data.html
      }
      // Update the selected order with HTML content and parsed data
      selectedOrder.value = {
        ...selectedOrder.value,
        itemsHtml: data.data.html,
        parsedItems: parsedItems
      }
    } else {
      console.log('[Orders.vue] No HTML content in response')
      selectedOrder.value = {
        ...selectedOrder.value,
        itemsHtml: null,
        parsedItems: null
      }
    }
  } catch (err) {
    console.error('[Orders.vue] Error fetching order items:', err)
    
    toast.add({
      severity: 'warn',
      summary: 'Upozornění',
      detail: 'Nepodařilo se načíst položky objednávky',
      life: 3000
    })
    // Still show the dialog even if items couldn't be fetched
    selectedOrder.value = {
      ...selectedOrder.value,
      itemsHtml: null,
      parsedItems: null
    }
  } finally {
    loadingOrderItems.value = false
    console.log('[Orders.vue] Loading complete')
  }
}

const toggleOrderItems = async (order) => {
  const orderId = order.id
  
  console.log('[Orders.vue] Toggle order items:', { orderId, order })
  
  // Toggle the expansion state
  if (expandedRows.value[orderId]) {
    delete expandedRows.value[orderId]
    return
  }
  
  expandedRows.value[orderId] = true
  
  // Check if we already have the data cached
  if (orderItemsCache.value[orderId]?.html || orderItemsCache.value[orderId]?.parsedItems) {
    console.log('[Orders.vue] Using cached data for order:', orderId)
    return
  }
  
  // Set loading state
  orderItemsCache.value[orderId] = { loading: true, error: null, html: null, parsedItems: null }
  
  try {
    console.log('[Orders.vue] Calling bob-order-items with objednavka_id:', orderId)
    
    // Use the BOB API edge function to get order items - use order.id directly
    const { data, error } = await supabase.functions.invoke('bob-order-items', {
      body: { 
        objednavka_id: orderId.toString()
      }
    })
    
    console.log('[Orders.vue] BOB API response:', { data, error })
    
    if (error) throw error
    
    if (data?.data?.html) {
      console.log('[Orders.vue] Successfully received HTML content')
      // Parse the HTML to extract structured data
      const parsedItems = parseOrderItemsHtml(data.data.html)
      
      orderItemsCache.value[orderId] = {
        loading: false,
        error: null,
        html: data.data.html,
        parsedItems: parsedItems
      }
    } else if (data?.success === false) {
      console.log('[Orders.vue] BOB API returned success: false')
      orderItemsCache.value[orderId] = {
        loading: false,
        error: data.error || 'Nepodařilo se načíst položky',
        html: null,
        parsedItems: null
      }
    } else {
      console.log('[Orders.vue] No HTML content in response')
      orderItemsCache.value[orderId] = {
        loading: false,
        error: 'Nepodařilo se načíst položky',
        html: null,
        parsedItems: null
      }
    }
  } catch (err) {
    console.error('[Orders.vue] Error fetching order items:', err)
    orderItemsCache.value[orderId] = {
      loading: false,
      error: err.message || 'Chyba při načítání položek objednávky',
      html: null,
      parsedItems: null
    }
  }
}

const closeOrderDialog = () => {
  selectedOrder.value = null
  showOrderDialog.value = false
}

const exportOrders = () => {
  toast.add({ 
    severity: 'info', 
    summary: 'Export', 
    detail: 'Export funkcionalita bude brzy implementována', 
    life: 3000 
  })
}

const preloadClubSupportData = async () => {
  // Limit to first 10 orders to avoid too many API calls
  const ordersToPreload = orders.value.slice(0, 10)
  
  // Fetch order items for each order in parallel
  const promises = ordersToPreload.map(async (order) => {
    // Skip if already cached
    if (orderItemsCache.value[order.id]?.parsedItems) {
      return
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('bob-order-items', {
        body: { 
          objednavka_id: order.id.toString()
        }
      })
      
      if (!error && data?.data?.html) {
        const parsedItems = parseOrderItemsHtml(data.data.html)
        orderItemsCache.value[order.id] = {
          loading: false,
          error: null,
          html: data.data.html,
          parsedItems: parsedItems
        }
      }
    } catch (err) {
      console.error(`Error preloading order ${order.id}:`, err)
    }
  })
  
  // Wait for all to complete (but don't block on errors)
  await Promise.allSettled(promises)
}

// Navigate to products page with product name to search and open
const showProductDetail = async (productName) => {
  if (!productName) return

  // Try to fetch products to find the ID
  try {
    const { data, error } = await supabase.functions.invoke('get-sales-offers', {
      body: {
        sales_channel_url: authStore.salesChannelUrl
      }
    })

    if (!error && data?.offers) {
      // Try to find the product by name
      let product = data.offers.find(offer =>
        offer.sales_offer_name === productName || offer.name === productName
      )

      if (!product) {
        // Try partial match
        product = data.offers.find(offer =>
          offer.sales_offer_name?.includes(productName) ||
          offer.name?.includes(productName) ||
          productName.includes(offer.sales_offer_name) ||
          productName.includes(offer.name)
        )
      }

      if (product && product.id) {
        // Debug: log what we're sending
        console.log('[Orders.vue] Found product:', product)
        console.log('[Orders.vue] Navigating with product ID:', product.id, 'Type:', typeof product.id)

        // Navigate with product ID
        router.push({
          path: '/produkty',
          query: {
            openProductId: product.id
          }
        })
        return
      }
    }
  } catch (err) {
    console.error('Error fetching product for navigation:', err)
  }

  // Fallback: navigate with product name if ID not found
  router.push({
    path: '/produkty',
    query: {
      openProductName: productName
    }
  })
}

// Watch for sales channel URL changes
watch(() => authStore.salesChannelUrl, (newUrl) => {
  if (newUrl && orders.value.length === 0 && !loading.value) {
    fetchOrders()
  }
})

// Lifecycle
onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.orders-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Stats handled by StatsRow component */

/* Main Card */
.orders-card {
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

.export-button,
.refresh-button {
  height: 2.25rem;
  padding: 0 0.75rem;
}

/* Filters Section */
.filters-section {
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.filter-input {
  height: 2.25rem;
  font-size: 0.875rem;
}

.filter-input :deep(input) {
  height: 2.25rem;
  font-size: 0.875rem;
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
}

.order-id {
  font-family: 'Monaco', 'Courier New', monospace;
  font-weight: 600;
  color: #6366f1;
  font-size: 0.875rem;
}

.date-cell {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.date-main {
  font-weight: 500;
  color: #111827;
  font-size: 0.875rem;
}

.date-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.customer-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.customer-name {
  font-weight: 600;
  color: #111827;
  font-size: 0.875rem;
}

.customer-email {
  font-size: 0.75rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.customer-email i {
  font-size: 0.625rem;
}

.items-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.price-total {
  font-weight: 700;
  color: #111827;
  font-size: 0.875rem;
}

.club-support-amount {
  font-weight: 600;
  color: #10b981;
  font-size: 0.875rem;
}

.status-tag {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
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
.order-dialog :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #0084ff 0%, #1e3a8a 100%);
  color: white;
  padding: 1rem 1.5rem;
}

.order-dialog :deep(.p-dialog-content) {
  padding: 1.5rem;
}

/* Fullscreen mode styles */
.order-dialog :deep(.p-dialog.p-dialog-maximized) {
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

.order-dialog :deep(.p-dialog-maximized .p-dialog-content) {
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

/* Order Summary Section */
.order-summary-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.summary-header i {
  font-size: 1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.summary-card:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.summary-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.summary-icon i {
  font-size: 1.125rem;
}

.summary-content {
  flex: 1;
  min-width: 0;
}

.summary-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.summary-value {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
  word-break: break-word;
}

.price-highlight {
  font-size: 1.125rem;
  color: #0084ff;
  font-weight: 700;
}

/* Customer Detail Section */
.customer-detail-section {
  margin-top: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-header i {
  font-size: 1rem;
}

.customer-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.detail-icon {
  color: #6b7280;
  font-size: 1rem;
  margin-top: 0.125rem;
}

.order-info-grid {
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

/* Customer Section */
.customer-section,
.items-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.customer-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.detail-label {
  font-weight: 500;
  color: #6b7280;
  min-width: 80px;
}

.detail-value {
  color: #111827;
}

/* Items Table */
.items-table :deep(.p-datatable-thead > tr > th) {
  background: #f9fafb;
  font-size: 0.75rem;
  padding: 0.5rem;
}

.items-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.5rem;
  font-size: 0.875rem;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.product-image {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.dialog-footer {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* Variants Section */
.variants-section {
  margin-top: 1.5rem;
}

.empty-variants {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.variants-table :deep(.p-datatable-wrapper) {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.variants-table :deep(.p-datatable-thead > tr > th) {
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

.variants-table :deep(.p-datatable-tbody > tr) {
  transition: all 0.2s;
}

.variants-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f9fafb !important;
}

.variants-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.75rem;
  border: none;
  border-bottom: 1px solid #f3f4f6;
}

.product-detail {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.product-thumbnail {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-variant {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.product-variant i {
  font-size: 0.625rem;
}

.sku-code {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.75rem;
  color: #6b7280;
}

.price-cell {
  font-size: 0.875rem;
  color: #4b5563;
}

/* Order Total Summary */
.order-total-summary {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  color: #4b5563;
}

.total-row:last-child {
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 0.5rem;
}

.total-row .price-total {
  color: #0084ff;
  font-weight: 700;
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

:deep(.p-dropdown) {
  border-radius: 6px;
  font-size: 0.875rem;
}

:deep(.p-datepicker input) {
  border-radius: 6px;
  font-size: 0.875rem;
}

/* Order Items Expansion */
.order-items-expansion {
  padding: 1rem 2rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  border-bottom: 2px solid #e5e7eb;
}

/* Expansion Custom Format Styles */
.expansion-items-custom {
  width: 100%;
}

.expansion-products-section {
  background: white;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.expansion-items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.expansion-items-table thead {
  background: #e5e7eb;
}

.expansion-items-table th {
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.expansion-items-table td {
  padding: 0.5rem 0.75rem;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  background: white;
}

.expansion-items-table tbody tr:last-child td {
  border-bottom: none;
}

.expansion-items-table .text-right {
  text-align: right;
}

.expansion-divider {
  height: 1px;
  background: #d1d5db;
  margin: 0.75rem 0;
}

.expansion-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0.5rem;
  background: white;
  border-radius: 4px;
  margin-bottom: 0.375rem;
  font-size: 0.8125rem;
}

.expansion-label {
  color: #6b7280;
  font-weight: 500;
}

.expansion-value {
  color: #111827;
  font-weight: 600;
}

.expansion-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.625rem 0.75rem;
  background: white;
  border-radius: 4px;
  margin-top: 0.75rem;
  border: 1px solid #0084ff;
}

.expansion-label-total {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
}

.expansion-value-total {
  font-size: 1rem;
  color: #0084ff;
  font-weight: 700;
}

.items-loading,
.items-error,
.items-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.items-error {
  color: #ef4444;
}

.items-html,
.order-items-html {
  overflow-x: auto;
}

/* Style the HTML table from BOB API */
.items-html :deep(table),
.order-items-html :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.items-html :deep(table th),
.order-items-html :deep(table th) {
  background: #e5e7eb;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #d1d5db;
}

.items-html :deep(table td),
.order-items-html :deep(table td) {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
}

.items-html :deep(table tr:hover),
.order-items-html :deep(table tr:hover) {
  background: white;
}

.items-html :deep(table tr.l),
.order-items-html :deep(table tr.l) {
  background: transparent;
}

/* Style the HTML table in the dialog */
.order-items-html {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin-top: 0.5rem;
}

/* Custom Order Items Display */
.order-items-custom {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.items-section-products {
  margin-bottom: 0;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  background: white;
  border-radius: 6px;
  overflow: hidden;
}

.items-table thead {
  background: #e5e7eb;
}

.items-table th {
  padding: 0.625rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.items-table td {
  padding: 0.625rem 0.75rem;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  background: white;
}

.items-table tbody tr:last-child td {
  border-bottom: none;
}

.items-table .text-right {
  text-align: right;
}

.items-divider {
  height: 1px;
  background: #d1d5db;
  margin: 1rem 0;
}

.items-section-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: white;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.items-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.items-value {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
}

.items-section-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  margin-top: 1rem;
  border: 2px solid #0084ff;
}

.items-label-total {
  font-size: 0.9375rem;
  color: #111827;
  font-weight: 600;
}

.items-value-total {
  font-size: 1.125rem;
  color: #0084ff;
  font-weight: 700;
}

/* Products List Section */
.products-list-section {
  margin-top: 1rem;
}

.products-table-wrapper {
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.products-table thead {
  background: #f9fafb;
}

.products-table th {
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #6b7280;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
}

.products-table td {
  padding: 0.75rem;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}

.products-table .product-row:hover {
  background: #f9fafb;
}

.products-table .price-cell {
  font-weight: 600;
  color: #111827;
}

.products-table .text-right {
  text-align: right;
}

/* Order Total Block */
.order-total-block {
  margin-top: 1.5rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.total-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.total-header i {
  color: #6b7280;
  font-size: 1rem;
}

.total-details {
  padding: 1rem;
}

.total-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.total-line.text-muted {
  color: #6b7280;
  font-size: 0.8125rem;
}

.total-label {
  font-weight: 500;
}

.total-value {
  font-weight: 600;
  color: #111827;
}

.total-line-final {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 2px solid #e5e7eb;
}

.total-label-final {
  font-weight: 600;
  color: #111827;
  font-size: 0.9375rem;
}

.total-value-final {
  font-weight: 700;
  color: #0084ff;
  font-size: 1.125rem;
}

/* Column Filters */
:deep(.p-column-filter) {
  width: 100%;
  font-size: 11px;
  height: 28px;
  padding: 0.25rem 0.5rem;
}

:deep(.p-datatable .p-datatable-thead > tr > th .p-column-filter) {
  margin-top: 0.5rem;
}

:deep(.p-datatable .p-datatable-thead > tr > th .p-column-header-content) {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:deep(.p-datatable-filter-row) {
  background: #f9fafb;
}

:deep(.p-datatable-filter-row td) {
  padding: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

/* Select component specific styling */
:deep(.p-select.p-column-filter) {
  height: 28px;
  min-height: 28px;
  font-size: 11px !important;
}

:deep(.p-select.p-column-filter .p-select-label) {
  font-size: 11px !important;
  padding: 0.25rem 0.5rem;
  color: #374151;
}

:deep(.p-select.p-column-filter .p-select-dropdown) {
  width: 1.5rem;
  height: 100%;
}

:deep(.p-select.p-column-filter .p-select-label-container) {
  font-size: 11px !important;
}

:deep(.p-select.p-column-filter span) {
  font-size: 11px !important;
}

/* Additional aggressive selectors for Select components */
:deep(.p-select.p-column-filter *) {
  font-size: 11px !important;
}

:deep(.p-select.p-column-filter .p-select-label,
       .p-select.p-column-filter .p-select-placeholder,
       .p-select.p-column-filter .p-select-option,
       .p-select.p-column-filter .p-inputtext) {
  font-size: 11px !important;
  line-height: 1.2 !important;
}

:deep(th .p-select.p-column-filter) {
  font-size: 11px !important;
}

:deep(th .p-select.p-column-filter *) {
  font-size: 11px !important;
}

/* Select dropdown option labels */
:deep(.p-select-option-label) {
  font-size: 11px !important;
}

:deep(.p-select-panel .p-select-option-label) {
  font-size: 11px !important;
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
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .order-info-grid {
    grid-template-columns: 1fr;
  }
  
  .products-table {
    font-size: 0.8125rem;
  }
  
  .products-table th,
  .products-table td {
    padding: 0.5rem;
  }
}

/* Product link styles */
.product-link {
  color: #0084ff;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid transparent;
}

.product-link:hover {
  color: #0066cc;
  text-decoration: none;
  border-bottom-color: #0066cc;
}

.product-link:active {
  color: #004499;
}
</style>
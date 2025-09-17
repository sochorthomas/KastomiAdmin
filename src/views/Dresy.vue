<template>
  <div class="dresy-container">
    <!-- Main Content Card -->
    <Card class="jersey-card">
      <template #header>
        <div class="card-header-content">
          <div class="header-left">
            <h2 class="header-title">
              <svg class="header-icon-svg mr-2"
                   width="20" height="20" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 1L19 3V8H16V16C16 16.2652 15.8946 16.5196 15.7071 16.7071C15.5196 16.8946 15.2652 17 15 17H5C4.73478 17 4.48043 16.8946 4.29289 16.7071C4.10536 16.5196 4 16.2652 4 16V8H1V3L7 1C7 1.79565 7.31607 2.55871 7.87868 3.12132C8.44129 3.68393 9.20435 4 10 4C10.7956 4 11.5587 3.68393 12.1213 3.12132C12.6839 2.55871 13 1.79565 13 1Z" stroke="#0084ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8.5 8H11L9.5 13" stroke="#0084ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Historie objednávek dresů
            </h2>
            <p class="header-subtitle text-600">
              Přehled všech objednávek dresů a kastomizací
            </p>
          </div>
          <div class="header-right">
            <Button
              icon="pi pi-refresh"
              label="Obnovit"
              @click="fetchJerseyData"
              :loading="loading"
              severity="secondary"
              class="p-button-sm"
            />
          </div>
        </div>
      </template>

      <template #content>
        <!-- Quick Stats -->
        <StatsRow
          v-if="!loading && jerseyOrders.length > 0"
          :stats="[
            {
              icon: 'pi pi-shopping-cart',
              value: jerseyOrders.length,
              label: 'Objednávek',
              variant: 'info',
              format: 'number'
            },
            {
              icon: 'pi pi-check-circle',
              value: paidOrdersCount,
              label: 'Zaplacených',
              variant: 'success',
              format: 'number'
            },
            {
              icon: 'pi pi-times-circle',
              value: unpaidOrdersCount,
              label: 'Nezaplacených',
              variant: 'danger',
              format: 'number'
            },
            {
              icon: 'pi pi-box',
              value: totalQuantity,
              label: 'Kusů celkem',
              variant: 'warning',
              format: 'number'
            }
          ]"
        />

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-content-center align-items-center p-5">
          <ProgressSpinner />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="alert-container">
          <Message severity="error" :closable="false">
            <div class="flex align-items-center">
              <i class="pi pi-exclamation-triangle mr-2"></i>
              <span>{{ error }}</span>
            </div>
          </Message>
          <Button 
            label="Zkusit znovu" 
            icon="pi pi-refresh"
            @click="fetchJerseyData"
            class="mt-3"
          />
        </div>

        <!-- Empty State -->
        <div v-else-if="jerseyOrders.length === 0" class="empty-state">
          <i class="pi pi-inbox text-5xl text-300 mb-3"></i>
          <h3 class="text-600 mb-2">Žádné objednávky dresů</h3>
          <p class="text-500">Zatím nebyly nalezeny žádné objednávky dresů.</p>
        </div>

        <!-- Data Table with dual scroll -->
        <div v-else class="table-with-dual-scroll">
          <!-- DataTable -->
          <DataTableWithScroll
            :value="jerseyOrders"
            :paginator="true"
            :rows="100"
            :rowsPerPageOptions="[50, 100, 500, 1000]"
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            currentPageReportTemplate="Zobrazeno {first} až {last} z {totalRecords} objednávek"
            responsiveLayout="scroll"
            v-model:filters="filters"
            filterDisplay="row"
            class="modern-table"
            stripedRows
            :rowHover="true"
            ref="dataTableRef"
          >
          <!-- Header -->
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-600">
                <i class="pi pi-info-circle mr-2"></i>
                Celkem {{ jerseyOrders.length }} objednávek
              </span>
            </div>
          </template>

          <!-- ID Column -->
          <Column field="ID" header="ID" :sortable="true" style="width: 80px" :showFilterMenu="false">
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                @input="filterCallback()"
                placeholder="Hledat ID..."
                class="p-column-filter"
              />
            </template>
            <template #body="slotProps">
              <span class="order-id">#{{ slotProps.data.ID }}</span>
            </template>
          </Column>

          <!-- Date Column -->
          <Column field="Datum" header="Datum" :sortable="true" style="width: 150px" :showFilterMenu="false">
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                @input="filterCallback()"
                placeholder="Hledat datum..."
                class="p-column-filter"
              />
            </template>
            <template #body="slotProps">
              <div class="date-cell">
                <div class="date-main">{{ formatDate(slotProps.data.Datum) }}</div>
              </div>
            </template>
          </Column>

          <!-- Paid Status Column -->
          <Column field="Zaplaceno" header="Zaplaceno" :sortable="true" style="width: 100px" :showFilterMenu="false">
            <template #filter="{ filterModel, filterCallback }">
              <Select
                v-model="filterModel.value"
                @change="filterCallback()"
                :options="[{label: 'ANO', value: 1}, {label: 'NE', value: 0}]"
                optionLabel="label"
                optionValue="value"
                placeholder="Vybrat..."
                class="p-column-filter"
              />
            </template>
            <template #body="slotProps">
              <Tag
                :severity="slotProps.data.Zaplaceno === 1 ? 'success' : 'danger'"
                :value="slotProps.data.Zaplaceno === 1 ? 'ANO' : 'NE'"
                :icon="slotProps.data.Zaplaceno === 1 ? 'pi pi-check' : 'pi pi-times'"
                class="status-tag"
              />
            </template>
          </Column>

          <!-- Product Name Column -->
          <Column field="Název položky" header="Položka" :sortable="true" style="min-width: 250px; max-width: 350px" :showFilterMenu="false">
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                type="text"
                v-model="filterModel.value"
                @input="filterCallback()"
                placeholder="Hledat položku..."
                class="p-column-filter"
              />
            </template>
            <template #body="slotProps">
              <div class="product-info">
                <div class="product-name" v-tooltip.top="slotProps.data['Název položky']">
                  {{ formatProductName(slotProps.data['Název položky']) }}
                </div>
                <div v-if="getProductVariant(slotProps.data['Název položky'])" class="product-variant">
                  {{ getProductVariant(slotProps.data['Název položky']) }}
                </div>
              </div>
            </template>
          </Column>

          <!-- Variant/Size Column -->
          <Column field="Varianta/Velikost" header="Velikost" :sortable="true" style="width: 100px" :showFilterMenu="false">
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                @input="filterCallback()"
                placeholder="Velikost..."
                class="p-column-filter"
              />
            </template>
            <template #body="slotProps">
              <Badge :value="slotProps.data['Varianta/Velikost'] || '-'" severity="secondary" class="size-badge" />
            </template>
          </Column>

          <!-- Customization Column -->
          <Column field="Kastomizace" header="Kastomizace" style="width: 180px" :showFilterMenu="false">
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                @input="filterCallback()"
                placeholder="Hledat kastomizaci..."
                class="p-column-filter"
              />
            </template>
            <template #body="slotProps">
              <span class="customization-text">{{ slotProps.data.Kastomizace || '-' }}</span>
            </template>
          </Column>

          <!-- Quantity Column -->
          <Column field="Počet" header="Počet" :sortable="true" style="width: 80px" :showFilterMenu="false">
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                @input="filterCallback()"
                placeholder="Počet..."
                class="p-column-filter"
                type="number"
              />
            </template>
            <template #body="slotProps">
              <Badge :value="`${slotProps.data.Počet} ks`" severity="secondary" class="items-badge" />
            </template>
          </Column>

          <!-- Customer Name -->
          <Column header="Zákazník" style="min-width: 180px" :showFilterMenu="false">
            <template #filter="{ filterModel, filterCallback }">
              <div class="customer-filters">
                <InputText
                  v-model="filters['Jméno'].value"
                  @input="filterCallback()"
                  placeholder="Jméno..."
                  class="p-column-filter customer-filter-input"
                />
                <InputText
                  v-model="filters['Příjmení'].value"
                  @input="filterCallback()"
                  placeholder="Příjmení..."
                  class="p-column-filter customer-filter-input"
                />
                <InputText
                  v-model="filters['Email'].value"
                  @input="filterCallback()"
                  placeholder="Email..."
                  class="p-column-filter customer-filter-input"
                />
              </div>
            </template>
            <template #body="slotProps">
              <div class="customer-info">
                <div class="customer-name">{{ slotProps.data.Jméno }} {{ slotProps.data.Příjmení }}</div>
                <div class="customer-contact">
                  <i class="pi pi-envelope"></i>
                  <span class="customer-email">{{ slotProps.data.Email }}</span>
                </div>
                <div v-if="slotProps.data.Telefon" class="customer-contact">
                  <i class="pi pi-phone"></i>
                  <span class="customer-phone">{{ formatPhone(slotProps.data.Telefon) }}</span>
                </div>
              </div>
            </template>
          </Column>

          <!-- Address Column -->
          <Column field="Adresa" header="Doručení" style="min-width: 200px" :showFilterMenu="false">
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                @input="filterCallback()"
                placeholder="Hledat adresu..."
                class="p-column-filter"
              />
            </template>
            <template #body="slotProps">
              <div class="delivery-info">
                <div class="address-info" v-if="slotProps.data.Adresa">
                  <div class="address-street">{{ getAddressStreet(slotProps.data.Adresa) }}</div>
                  <div class="address-city">{{ getAddressCity(slotProps.data.Adresa) }}</div>
                </div>
                <div v-if="slotProps.data.Doprava" class="delivery-method">
                  <i class="pi pi-truck text-xs"></i>
                  <span>{{ slotProps.data.Doprava }}</span>
                </div>
              </div>
            </template>
          </Column>
          </DataTableWithScroll>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import { supabase } from '@/lib/supabase'
import { FilterMatchMode } from '@primevue/core/api'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import StatsRow from '@/components/StatsRow.vue'
import DataTableWithScroll from '@/components/DataTableWithScroll.vue'

const authStore = useAuthStore()
const toast = useToast()

// State
const loading = ref(false)
const error = ref(null)
const jerseyOrders = ref([])

// Filters
const filters = ref({
  'ID': { value: null, matchMode: FilterMatchMode.CONTAINS },
  'Datum': { value: null, matchMode: FilterMatchMode.CONTAINS },
  'Název položky': { value: null, matchMode: FilterMatchMode.CONTAINS },
  'Varianta/Velikost': { value: null, matchMode: FilterMatchMode.CONTAINS },
  'Kastomizace': { value: null, matchMode: FilterMatchMode.CONTAINS },
  'Počet': { value: null, matchMode: FilterMatchMode.EQUALS },
  'Jméno': { value: null, matchMode: FilterMatchMode.CONTAINS },
  'Příjmení': { value: null, matchMode: FilterMatchMode.CONTAINS },
  'Email': { value: null, matchMode: FilterMatchMode.CONTAINS },
  'Adresa': { value: null, matchMode: FilterMatchMode.CONTAINS },
  'Zaplaceno': { value: null, matchMode: FilterMatchMode.EQUALS }
})

// Computed
const paidOrdersCount = computed(() => {
  return jerseyOrders.value.filter(order => order.Zaplaceno === 1).length
})

const unpaidOrdersCount = computed(() => {
  return jerseyOrders.value.filter(order => order.Zaplaceno !== 1).length
})

const totalQuantity = computed(() => {
  return jerseyOrders.value.reduce((sum, order) => sum + (order.Počet || 0), 0)
})

// Methods

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date)) return dateString
  
  const pad = (n) => n.toString().padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const formatPhone = (phone) => {
  if (!phone) return '-'
  
  const clean = phone.toString().replace(/\s+/g, '')
  
  if (/^\+?\d{11,14}$/.test(clean) || /^\d{9}$/.test(clean) || /^00\d{11,14}$/.test(clean)) {
    const isPlus = clean.startsWith('+')
    const isDoubleZero = clean.startsWith('00')
    
    if (isPlus) {
      return clean.replace(/^(\+\d{3})(\d{3})(\d{3})(\d{3})?$/, (_, p1, p2, p3, p4) =>
        [p1, p2, p3, p4].filter(Boolean).join(' ')
      )
    } else if (isDoubleZero) {
      return clean.replace(/^(00\d{3})(\d{3})(\d{3})(\d{3})?$/, (_, p1, p2, p3, p4) =>
        [p1, p2, p3, p4].filter(Boolean).join(' ')
      )
    } else if (/^\d{9}$/.test(clean)) {
      return clean.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3')
    }
  }
  
  return phone
}

const extractCustomization = (text) => {
  if (!text) return ''

  // Try to extract the value from JSON-like format
  // Example: {"customization":"Name 10"}}
  const match = text.match(/"customization"\s*:\s*"([^"]+)"/)
  if (match) {
    return match[1]
  }

  // Fallback: try older format
  const oldMatch = text.match(/"([^"]+)"\s*;?\s*\}\}/)
  if (oldMatch) {
    const inside = oldMatch[1].split(':"').pop().replace(/"}$/, '')
    return inside
  }

  // If it's already clean text, return as is
  return text
}

const formatProductName = (name) => {
  if (!name) return '-'

  // Extract main product name (before " - ")
  const parts = name.split(' - ')
  return parts[0] || name
}

const getProductVariant = (name) => {
  if (!name) return ''

  // Extract variant info (after first " - ")
  const parts = name.split(' - ')
  if (parts.length > 1) {
    // Remove "+ kastomizace" from the variant text
    return parts.slice(1).join(' - ').replace(/\s*\+\s*kastomizace\s*$/i, '')
  }
  return ''
}

const getAddressStreet = (address) => {
  if (!address) return ''

  // Parse address: Name, Surname, City, District, Street, Street2, City2, ZIP
  const parts = address.split(', ')

  // Usually street is at index 4 or 5
  if (parts.length >= 5) {
    // Get unique street (remove duplicates)
    const street1 = parts[4]
    const street2 = parts[5]
    if (street1 && street2 && street1 === street2) {
      return street1
    } else if (street1) {
      return street1
    }
  }

  return address.split(', ').slice(0, 3).join(', ')
}

const getAddressCity = (address) => {
  if (!address) return ''

  // Parse address: Name, Surname, City, District, Street, Street2, City2, ZIP
  const parts = address.split(', ')

  // Usually city and ZIP are at the end
  if (parts.length >= 7) {
    const city = parts[parts.length - 2]
    const zip = parts[parts.length - 1]
    return `${city}, ${zip}`
  } else if (parts.length >= 3) {
    return parts.slice(2, 4).join(', ')
  }

  return ''
}

const fetchJerseyData = async () => {
  loading.value = true
  error.value = null

  try {
    // Check if sales channel ID is available
    if (!authStore.salesChannelId) {
      console.log('Waiting for sales channel ID...')
      // Wait a bit for the sales channel to load
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (!authStore.salesChannelId) {
        throw new Error('Sales channel ID not available')
      }
    }

    // Using hardcoded "86" for testing
    const testChannelId = "86"
    console.log('Fetching jersey data for channel:', testChannelId)

    // Call the bob-report edge function with report ID 19 for jerseys
    const { data, error: funcError } = await supabase.functions.invoke('bob-report', {
      body: {
        reportId: 19,
        value: testChannelId
      }
    })

    console.log('Bob report response:', data)
    console.log('Bob report response type:', typeof data)
    console.log('Bob report response keys:', data ? Object.keys(data) : 'null')

    if (funcError) {
      console.error('Bob report error:', funcError)
      throw funcError
    }

    // The BOB API returns the data directly in data.data
    const reportData = data?.data || []

    console.log('Report data extracted:', reportData)
    console.log('Report data is array?:', Array.isArray(reportData))
    console.log('Report data length:', reportData.length)

    if (Array.isArray(reportData)) {
      // Process the data to ensure all fields are properly formatted
      jerseyOrders.value = reportData.map(order => ({
        ...order,
        // Ensure Zaplaceno is a number for comparison
        Zaplaceno: Number(order.Zaplaceno) || 0,
        // Ensure Počet is a number
        Počet: Number(order['Počet']) || order['Počet'] || 0,
        // Clean up Kastomizace field
        Kastomizace: extractCustomization(order.Kastomizace || '')
      }))

      if (jerseyOrders.value.length === 0) {
        toast.add({
          severity: 'info',
          summary: 'Žádná data',
          detail: 'Nebyly nalezeny žádné objednávky dresů',
          life: 3000
        })
      } else {
        toast.add({
          severity: 'success',
          summary: 'Data načtena',
          detail: `Načteno ${jerseyOrders.value.length} objednávek dresů`,
          life: 3000
        })
      }
    } else {
      console.log('Unexpected data structure:', data)
      jerseyOrders.value = []
    }
  } catch (err) {
    console.error('Error fetching jersey data:', err)
    error.value = err.message || 'Nepodařilo se načíst data dresů'
    
    toast.add({
      severity: 'error',
      summary: 'Chyba',
      detail: error.value,
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Only fetch if we have the sales channel ID
  if (authStore.salesChannelId) {
    fetchJerseyData()
  }
})

// Watch for salesChannelId changes
watch(() => authStore.salesChannelId, (newId) => {
  if (newId) {
    fetchJerseyData()
  }
})

</script>

<style scoped>
.dresy-container {
  padding: 1rem;
}

.jersey-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.jersey-card :deep(.p-card-body) {
  padding: 0;
}

.jersey-card :deep(.p-card-content) {
  padding: 1.5rem;
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  flex: 1;
}

.header-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
}

.header-icon-svg {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}

.header-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Stats handled by StatsRow component */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.alert-container {
  padding: 2rem;
  text-align: center;
}

/* Dual Scroll Container */
/* Dual scroll is handled by DataTableWithScroll component */

/* DataTable Styling */
.modern-table :deep(.p-datatable-header) {
  background: #f9fafb;
  border: none;
  padding: 1rem;
}

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

.modern-table :deep(.p-paginator) {
  background: #f9fafb;
  border: none;
  padding: 1rem;
}

/* Table Cell Styles */
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
  color: #374151;
  font-size: 0.875rem;
}

.status-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.product-variant {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
}

.size-badge {
  font-size: 0.75rem;
}

.customization-text {
  font-size: 0.813rem;
  color: #059669;
  font-weight: 500;
}

.customer-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.customer-name {
  font-weight: 500;
  color: #111827;
  font-size: 0.875rem;
}

.customer-contact {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.customer-contact i {
  font-size: 0.625rem;
  color: #9ca3af;
}

.customer-email,
.customer-phone {
  font-size: 0.75rem;
  color: #6b7280;
}

.items-badge {
  font-size: 0.75rem;
  min-width: 2.5rem;
}

.address-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.address-street {
  font-size: 0.813rem;
  color: #374151;
  font-weight: 500;
}

.address-city {
  font-size: 0.75rem;
  color: #6b7280;
}

.delivery-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.delivery-method {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #059669;
  font-weight: 500;
  background: #ecfdf5;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  width: fit-content;
}

.delivery-method i {
  font-size: 0.625rem;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .card-header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .header-right {
    width: 100%;
  }

  .header-right .p-button {
    width: 100%;
  }
}

/* Column Filter Styles */
.modern-table :deep(.p-column-filter) {
  width: 100%;
  font-size: 11px;
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
  min-width: 80px;
}

.modern-table :deep(.p-column-filter:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
  outline: none;
}

.modern-table :deep(.p-column-filter::placeholder) {
  color: #9ca3af;
  font-size: 0.7rem;
}

/* Select component specific styling */
.modern-table :deep(.p-select.p-column-filter) {
  height: auto;
  min-height: 32px;
  font-size: 11px !important;
}

.modern-table :deep(.p-select.p-column-filter .p-select-label) {
  font-size: 11px !important;
  padding: 0.25rem 0.5rem;
  color: #374151;
}

.modern-table :deep(.p-select.p-column-filter .p-select-dropdown) {
  width: 2rem;
  height: 100%;
}

.modern-table :deep(.p-select.p-column-filter .p-select-label-container) {
  font-size: 11px !important;
}

.modern-table :deep(.p-select.p-column-filter span) {
  font-size: 11px !important;
}

/* Additional aggressive selectors for Select components */
.modern-table :deep(.p-select.p-column-filter *) {
  font-size: 11px !important;
}

.modern-table :deep(.p-select.p-column-filter .p-select-label,
                    .p-select.p-column-filter .p-select-placeholder,
                    .p-select.p-column-filter .p-select-option,
                    .p-select.p-column-filter .p-inputtext) {
  font-size: 11px !important;
  line-height: 1.2 !important;
}

.modern-table :deep(th .p-select.p-column-filter) {
  font-size: 11px !important;
}

.modern-table :deep(th .p-select.p-column-filter *) {
  font-size: 11px !important;
}

/* Select dropdown option labels */
.modern-table :deep(.p-select-option-label) {
  font-size: 11px !important;
}

.modern-table :deep(.p-select-panel .p-select-option-label) {
  font-size: 11px !important;
}

.customer-filters {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.customer-filter-input {
  font-size: 0.7rem !important;
  padding: 0.2rem 0.4rem !important;
}
</style>
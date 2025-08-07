<template>
  <div class="dresy-container">
    <!-- Header Stats -->
    <div class="stats-row" v-if="!loading && jerseyOrders.length > 0">
      <div class="stat-card-mini">
        <div class="stat-mini-icon" style="background: linear-gradient(135deg, #0084ff 0%, #1e3a8a 100%);">
          <i class="pi pi-shopping-cart"></i>
        </div>
        <div class="stat-mini-content">
          <div class="stat-mini-value">{{ jerseyOrders.length }}</div>
          <div class="stat-mini-label">Objednávek</div>
        </div>
      </div>
      <div class="stat-card-mini">
        <div class="stat-mini-icon" style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%);">
          <i class="pi pi-check-circle"></i>
        </div>
        <div class="stat-mini-content">
          <div class="stat-mini-value">{{ paidOrdersCount }}</div>
          <div class="stat-mini-label">Zaplacených</div>
        </div>
      </div>
      <div class="stat-card-mini">
        <div class="stat-mini-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
          <i class="pi pi-times-circle"></i>
        </div>
        <div class="stat-mini-content">
          <div class="stat-mini-value">{{ unpaidOrdersCount }}</div>
          <div class="stat-mini-label">Nezaplacených</div>
        </div>
      </div>
      <div class="stat-card-mini">
        <div class="stat-mini-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);">
          <i class="pi pi-box"></i>
        </div>
        <div class="stat-mini-content">
          <div class="stat-mini-value">{{ totalQuantity }}</div>
          <div class="stat-mini-label">Kusů celkem</div>
        </div>
      </div>
    </div>

    <!-- Main Content Card -->
    <Card class="jersey-card">
      <template #header>
        <div class="card-header-content">
          <div class="header-left">
            <h2 class="header-title">
              <i class="pi pi-tag mr-2 text-primary"></i>
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
              class="p-button-sm"
            />
          </div>
        </div>
      </template>

      <template #content>
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

        <!-- Data Table -->
        <DataTable 
          v-else
          :value="jerseyOrders" 
          :paginator="true" 
          :rows="20"
          :rowsPerPageOptions="[10, 20, 50, 100]"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="Zobrazeno {first} až {last} z {totalRecords} objednávek"
          responsiveLayout="scroll"
          :globalFilterFields="['Jméno', 'Příjmení', 'Email', 'Název položky', 'Kastomizace']"
          v-model:filters="filters"
          filterDisplay="row"
          class="modern-table"
          stripedRows
          :rowHover="true"
        >
          <!-- Global Filter -->
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-600">
                <i class="pi pi-info-circle mr-2"></i>
                Celkem {{ jerseyOrders.length }} objednávek
              </span>
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText 
                  v-model="filters['global'].value" 
                  placeholder="Vyhledat..." 
                  class="w-20rem"
                />
              </span>
            </div>
          </template>

          <!-- ID Column -->
          <Column field="ID" header="ID" :sortable="true" style="width: 80px">
            <template #body="slotProps">
              <span class="order-id">#{{ slotProps.data.ID }}</span>
            </template>
          </Column>

          <!-- Date Column -->
          <Column field="Datum" header="Datum" :sortable="true" style="width: 150px">
            <template #body="slotProps">
              <div class="date-cell">
                <div class="date-main">{{ formatDate(slotProps.data.Datum) }}</div>
              </div>
            </template>
          </Column>

          <!-- Paid Status Column -->
          <Column field="Zaplaceno" header="Zaplaceno" :sortable="true" style="width: 100px">
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
          <Column field="Název položky" header="Položka" :sortable="true">
            <template #body="slotProps">
              <span class="product-name">{{ slotProps.data['Název položky'] }}</span>
            </template>
          </Column>

          <!-- Variant/Size Column -->
          <Column field="Varianta/Velikost" header="Velikost" :sortable="true" style="width: 100px">
            <template #body="slotProps">
              <Badge :value="slotProps.data['Varianta/Velikost'] || '-'" severity="secondary" class="size-badge" />
            </template>
          </Column>

          <!-- Customization Column -->
          <Column field="Kastomizace" header="Kastomizace" style="width: 180px">
            <template #body="slotProps">
              <span class="customization-text">{{ extractCustomization(slotProps.data.Kastomizace) || '-' }}</span>
            </template>
          </Column>

          <!-- Quantity Column -->
          <Column field="Počet" header="Počet" :sortable="true" style="width: 80px">
            <template #body="slotProps">
              <Badge :value="`${slotProps.data.Počet} ks`" severity="secondary" class="items-badge" />
            </template>
          </Column>

          <!-- Customer Name -->
          <Column header="Zákazník" style="width: 200px">
            <template #body="slotProps">
              <div class="customer-info">
                <div class="customer-name">{{ slotProps.data.Jméno }} {{ slotProps.data.Příjmení }}</div>
                <div class="customer-email">
                  <i class="pi pi-envelope"></i>
                  {{ slotProps.data.Email }}
                </div>
              </div>
            </template>
          </Column>

          <!-- Phone Column -->
          <Column field="Telefon" header="Telefon" style="width: 120px">
            <template #body="slotProps">
              <span class="phone-number">{{ formatPhone(slotProps.data.Telefon) }}</span>
            </template>
          </Column>

          <!-- Delivery Column -->
          <Column field="Doprava" header="Doprava" style="width: 150px">
            <template #body="slotProps">
              <span class="text-sm">{{ slotProps.data.Doprava || '-' }}</span>
            </template>
          </Column>

          <!-- Address Column -->
          <Column field="Adresa" header="Adresa">
            <template #body="slotProps">
              <span class="text-sm">{{ slotProps.data.Adresa || '-' }}</span>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import { supabase } from '@/lib/supabase'

const authStore = useAuthStore()
const toast = useToast()

// State
const loading = ref(false)
const error = ref(null)
const jerseyOrders = ref([])

// Filters
const filters = ref({
  global: { value: null, matchMode: 'contains' }
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
  
  const match = text.match(/"([^"]+)"\s*;?\s*\}\}/)
  if (match) {
    const inside = match[1].split(':"').pop().replace(/"}$/, '')
    return inside
  }
  
  return text
}

const fetchJerseyData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Get auth token
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    // Call the bob-report edge function with report ID 19 for jerseys
    const { data, error: funcError } = await supabase.functions.invoke('bob-report', {
      body: {
        reportId: 19,
        value: authStore.salesChannelId
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })

    if (funcError) {
      throw funcError
    }

    if (data?.data) {
      jerseyOrders.value = data.data
      
      if (data.data.length === 0) {
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
          detail: `Načteno ${data.data.length} objednávek dresů`,
          life: 3000
        })
      }
    } else if (data?.error) {
      throw new Error(data.error)
    } else {
      throw new Error('Failed to fetch jersey data')
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
  fetchJerseyData()
})
</script>

<style scoped>
.dresy-container {
  padding: 1rem;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card-mini {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.stat-card-mini:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-mini-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
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
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-mini-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.jersey-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  flex: 1;
}

.header-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
}

.header-subtitle {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
}

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

.product-name {
  font-weight: 500;
  color: #111827;
  font-size: 0.875rem;
}

.size-badge {
  font-size: 0.75rem;
}

.customization-text {
  font-size: 0.813rem;
  color: #6b7280;
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

.customer-email {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.customer-email i {
  font-size: 0.625rem;
}

.phone-number {
  font-size: 0.813rem;
  color: #4b5563;
}

.items-badge {
  font-size: 0.75rem;
  min-width: 2.5rem;
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
</style>
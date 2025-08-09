<template>
  <div class="dashboard-container">
    <div>
    <!-- Statistics Cards -->
     <h3 class="section-title">
        <i class="pi pi-chart-line"></i>
        Statistiky
      </h3>
    <div class="stats-grid" v-if="stats.orderCount > 0 || stats.totalRevenue > 0 || stats.productCount > 0">
      <!-- Order Count Card -->
       
      <div class="stat-card" v-if="stats.orderCount >= 0">
        <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #0084ff 0%, #1e3a8a 100%);">
          <i class="pi pi-shopping-cart stat-icon"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">Počet objednávek</div>
          <div class="stat-value">
            <Skeleton v-if="loading" width="100px" height="2rem" />
            <span v-else>{{ stats.orderCount.toLocaleString('cs-CZ') }}</span>
          </div>
        </div>
      </div>

      <!-- Revenue Card -->
      <div class="stat-card">
        <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%);">
          <i class="pi pi-wallet stat-icon"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">Celkové tržby</div>
          <div class="stat-value">
            <Skeleton v-if="loading" width="150px" height="2rem" />
            <span v-else>Bude doplněno</span>
          </div>
        </div>
      </div>

      <!-- Product Count Card -->
      <div class="stat-card" v-if="stats.productCount >= 0">
        <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);">
          <i class="pi pi-box stat-icon"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">Počet produktů</div>
          <div class="stat-value">
            <Skeleton v-if="loading" width="80px" height="2rem" />
            <span v-else>{{ stats.productCount.toLocaleString('cs-CZ') }}</span>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- Quick Actions Section -->
    <div class="quick-actions-section">
      <h3 class="section-title">
        <i class="pi pi-bolt"></i>
        Rychlé akce
      </h3>
      <div class="action-cards-grid">
       

        <!-- Products Management Card -->
        <div class="action-card" @click="$router.push('/produkty')">
          <div class="action-card-icon" style="background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);">
            <i class="pi pi-box"></i>
          </div>
          <div class="action-card-content">
            <h4 class="action-card-title">Přehled produktů</h4>
            <p class="action-card-description">Jaké produkty máte na fanshopu</p>
          </div>
          <i class="pi pi-angle-right action-card-arrow"></i>
        </div>
        <!-- Products Management Card -->
        <div class="action-card" @click="$router.push('/objednavky')">
          <div class="action-card-icon" style="background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);">
            <i class="pi pi-shopping-cart"></i>
          </div>
          <div class="action-card-content">
            <h4 class="action-card-title">Přehled objednávek</h4>
            <p class="action-card-description">Historie objednávek</p>
          </div>
          <i class="pi pi-angle-right action-card-arrow"></i>
        </div>




      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !hasAnyData" class="loading-container">
      <Card>
        <template #content>
          <div class="flex flex-column align-items-center justify-content-center p-5">
            <ProgressSpinner />
            <p class="mt-3 text-600">Načítání dat...</p>
          </div>
        </template>
      </Card>
    </div>

    <!-- No Data State -->
    <div v-if="!loading && !hasAnyData" class="empty-container">
      <Card>
        <template #content>
          <div class="empty-state">
            <i class="pi pi-chart-line"></i>
            <h3>Žádná data k zobrazení</h3>
            <p>Pro vybraný časový úsek nejsou k dispozici žádná data.</p>
            <Button 
              label="Zkusit znovu" 
              icon="pi pi-refresh"
              @click="fetchDashboardData"
              severity="primary"
              class="mt-3"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- Recent Orders (only if there are orders) -->
    <Card v-if="recentOrders.length > 0" class="orders-table-card">
      <template #title>
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-clock text-primary"></i>
            <span>Poslední objednávky</span>
          </div>
          <Button 
            label="Zobrazit vše" 
            icon="pi pi-arrow-right"
            severity="secondary" 
            text 
            size="small"
            @click="$router.push('/objednavky')"
          />
        </div>
      </template>
      <template #content>
        <DataTable 
          :value="recentOrders" 
          :loading="loading"
          responsiveLayout="scroll"
          stripedRows
          :paginator="false"
          class="modern-table"
        >
          <Column field="id" header="ID" style="width: 100px">
            <template #body="slotProps">
              <span class="order-id">#{{ slotProps.data.id }}</span>
            </template>
          </Column>
          
          <Column field="customer_name" header="Zákazník">
            <template #body="slotProps">
              <div class="customer-cell">
                <Avatar 
                  :label="slotProps.data.customer_name?.substring(0, 2).toUpperCase()" 
                  size="small" 
                  shape="circle"
                  style="background: linear-gradient(135deg, #0084ff 0%, #1e3a8a 100%); color: white"
                />
                <span>{{ slotProps.data.customer_name }}</span>
              </div>
            </template>
          </Column>
          
          <Column field="created_at" header="Datum" style="width: 150px">
            <template #body="slotProps">
              <span class="date-cell">{{ formatDate(slotProps.data.created_at) }}</span>
            </template>
          </Column>
          
          <Column field="total" header="Částka" style="width: 150px">
            <template #body="slotProps">
              <span class="amount-cell">{{ formatCurrency(slotProps.data.total) }}</span>
            </template>
          </Column>
          
          <Column field="status" header="Stav" style="width: 120px">
            <template #body="slotProps">
              <Tag 
                :severity="getStatusSeverity(slotProps.data.status)" 
                :value="getStatusLabel(slotProps.data.status)"
                class="status-tag"
              />
            </template>
          </Column>
          
          <Column style="width: 80px" bodyClass="text-center">
            <template #body="slotProps">
              <Button 
                icon="pi pi-eye" 
                severity="secondary" 
                text 
                rounded
                v-tooltip.left="'Zobrazit detail'"
                @click="viewOrderDetail(slotProps.data.id)"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const loading = ref(false)
const dateFrom = ref(null)
const dateTo = ref(new Date())

const stats = ref({
  orderCount: 0,
  totalRevenue: 0,
  productCount: 0
})

const recentOrders = ref([])

// Computed
const hasAnyData = computed(() => {
  return stats.value.orderCount > 0 || 
         stats.value.totalRevenue > 0 || 
         stats.value.productCount > 0 ||
         recentOrders.value.length > 0
})

// Methods
const handleReports = () => {
  toast.add({ 
    severity: 'info', 
    summary: 'Reporty', 
    detail: 'Funkce reportů bude brzy dostupná', 
    life: 3000 
  })
}

const handleSync = async () => {
  toast.add({ 
    severity: 'info', 
    summary: 'Synchronizace', 
    detail: 'Zahajuji synchronizaci dat...', 
    life: 3000 
  })
  // Refresh dashboard data
  await fetchDashboardData()
  toast.add({ 
    severity: 'success', 
    summary: 'Hotovo', 
    detail: 'Data byla úspěšně synchronizována', 
    life: 3000 
  })
}

const handleExport = () => {
  toast.add({ 
    severity: 'info', 
    summary: 'Export', 
    detail: 'Funkce exportu bude brzy dostupná', 
    life: 3000 
  })
}

const handleSettings = () => {
  toast.add({ 
    severity: 'info', 
    summary: 'Nastavení', 
    detail: 'Nastavení bude brzy dostupné', 
    life: 3000 
  })
}

const fetchDashboardData = async () => {
  if (!authStore.salesChannelUrl) {
    console.warn('Sales channel URL not available yet')
    return
  }
  
  loading.value = true
  try {
    const formattedDateFrom = dateFrom.value instanceof Date ? 
      dateFrom.value.toISOString().split('T')[0] : dateFrom.value
    const formattedDateTo = dateTo.value instanceof Date ? 
      dateTo.value.toISOString().split('T')[0] : dateTo.value
    
    const { data, error } = await supabase.functions.invoke('dashboard-stats', {
      body: {
        date_from: formattedDateFrom || null,
        date_to: formattedDateTo,
        sales_channel_url: authStore.salesChannelUrl
      }
    })
    
    if (error) throw error
    
    if (data && data.stats) {
      stats.value = {
        orderCount: data.stats.order_count || 0,
        totalRevenue: data.stats.total_revenue || 0,
        productCount: data.stats.product_count || 0
      }
    }
    
    if (data && data.recent_orders) {
      recentOrders.value = data.recent_orders.slice(0, 5).map(order => ({
        id: order.id || order.order_id,
        created_at: order.created_at || order.date,
        customer_name: order.customer_name || order.customer || 'Neznámý zákazník',
        total: order.total || order.amount || 0,
        status: order.status || 'pending'
      }))
    }
    
    toast.add({ 
      severity: 'success', 
      summary: 'Data aktualizována', 
      detail: 'Dashboard byl úspěšně aktualizován', 
      life: 3000 
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Chyba', 
      detail: 'Nepodařilo se načíst data', 
      life: 5000 
    })
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const getStatusSeverity = (status) => {
  const severities = {
    pending: 'warn',
    processing: 'info',
    completed: 'success',
    cancelled: 'danger',
    returned: 'secondary'
  }
  return severities[status] || 'secondary'
}

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Čekající',
    processing: 'Zpracovává se',
    completed: 'Vyřízeno',
    cancelled: 'Zrušeno',
    returned: 'Vráceno'
  }
  return labels[status] || status
}

const viewOrderDetail = (orderId) => {
  router.push(`/objednavky/${orderId}`)
}

// Watch for sales channel URL changes
watch(() => authStore.salesChannelUrl, (newUrl) => {
  if (newUrl && !hasAnyData.value && !loading.value) {
    fetchDashboardData()
  }
})

// Event listeners for date changes from AppLayout
const handleDateChangeEvent = (event) => {
  dateFrom.value = event.detail.dateFrom
  dateTo.value = event.detail.dateTo
  fetchDashboardData()
}

const handleRefreshEvent = (event) => {
  dateFrom.value = event.detail.dateFrom
  dateTo.value = event.detail.dateTo
  fetchDashboardData()
}

// Lifecycle
onMounted(() => {
  fetchDashboardData()
  
  // Listen for date change events from AppLayout
  window.addEventListener('dashboard-date-change', handleDateChangeEvent)
  window.addEventListener('dashboard-refresh', handleRefreshEvent)
})

// Cleanup
onUnmounted(() => {
  window.removeEventListener('dashboard-date-change', handleDateChangeEvent)
  window.removeEventListener('dashboard-refresh', handleRefreshEvent)
})
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

/* Quick Actions Section */
.quick-actions-section {
  margin-top: 2rem;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title i {
  color: #3b82f6;
}

.action-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.action-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.action-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
  font-size: 1.25rem;
}

.action-card-content {
  flex: 1;
  min-width: 0;
}

.action-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.action-card-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-card-arrow {
  color: #9ca3af;
  font-size: 1.25rem;
  transition: transform 0.2s ease;
}

.action-card:hover .action-card-arrow {
  transform: translateX(4px);
  color: #3b82f6;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #0084ff, #1e3a8a);
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon {
  font-size: 1.25rem;
  color: white;
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

/* Loading & Empty States */
.loading-container,
.empty-container {
  margin-top: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.empty-state i {
  font-size: 3rem;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  color: #111827;
}

.empty-state p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

/* Orders Table */
.orders-table-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

/* Modern Table Styles */
.modern-table :deep(.p-datatable-header) {
  display: none;
}

.modern-table :deep(.p-datatable-thead > tr > th) {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.7rem;
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
}

.customer-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  color: #111827;
}

.date-cell {
  color: #6b7280;
  font-size: 0.875rem;
}

.amount-cell {
  font-weight: 600;
  color: #111827;
}

.status-tag {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
}

/* PrimeVue Customizations */
:deep(.p-card) {
  box-shadow: none;
  border-radius: 8px;
}

:deep(.p-card-title) {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  padding: 0.75rem 1rem;
}

:deep(.p-card-content) {
  padding: 1rem;
}

:deep(.p-button) {
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s;
}

:deep(.p-button:not(.p-button-text):not(.p-button-outlined):hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

:deep(.p-datepicker input) {
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  height: 2.25rem;
  font-size: 0.875rem;
}

.compact-datepicker :deep(input) {
  height: 2rem !important;
  padding: 0.375rem 0.5rem !important;
  font-size: 0.8125rem !important;
}

.compact-datepicker :deep(.p-datepicker-trigger) {
  width: 2rem !important;
}

:deep(.p-datepicker input:hover) {
  border-color: #d1d5db;
}

:deep(.p-datepicker input:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
}
</style>
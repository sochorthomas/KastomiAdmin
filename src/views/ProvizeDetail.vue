<template>
  <div class="provize-detail-container">
    <!-- Main Content Card -->
    <Card class="provize-detail-card">
      <template #header>
        <div class="card-header-content">
          <div class="header-left">
            <h2 class="header-title">
              <i class="pi pi-file-text mr-2 text-primary"></i>
              Detail výplaty #{{ payoutId }}
            </h2>
            <p class="header-subtitle" v-if="payoutData">
              Provize za období od <span style="color: #0084ff; font-weight: 600;">{{ formatDateRange(payoutData.date_from) }}</span> do <span style="color: #0084ff; font-weight: 600;">{{ formatDateRange(payoutData.date_to) }}</span>
            </p>
            <p class="header-subtitle" v-else>
              Načítání...
            </p>
          </div>
          <div class="header-actions">
            <Button
              @click="fetchPayoutDetail"
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
          v-if="!loading && payoutData"
          :stats="[
            {
              icon: 'pi pi-list',
              value: itemsCount,
              label: 'Počet položek',
              variant: 'info',
              format: 'number'
            },
            {
              icon: 'pi pi-wallet',
              value: totalAmount,
              label: 'Celková částka',
              variant: 'success',
              format: 'currency'
            },
            {
              icon: 'pi pi-calendar',
              value: formatDate(payoutData.created_at),
              label: 'Datum vytvoření',
              variant: 'warning'
            },
            {
              icon: 'pi pi-check-circle',
              value: 'Aktivní',
              label: 'Status',
              variant: 'success'
            }
          ]"
          style="margin-bottom: 1.5rem;"
        />

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <ProgressSpinner />
          <p class="loading-text">Načítání detailu výplaty...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="empty-state">
          <i class="pi pi-exclamation-triangle empty-icon text-red-500"></i>
          <h3 class="empty-title">Chyba při načítání</h3>
          <p class="empty-description">{{ error }}</p>
          <Button
            @click="fetchPayoutDetail"
            label="Zkusit znovu"
            icon="pi pi-refresh"
            severity="primary"
            class="mt-3"
          />
        </div>

        <!-- Content -->
        <div v-else-if="payoutData">
          <!-- Items Table Section -->
          <div class="items-section">
            <h3 class="section-title">
              <i class="pi pi-list mr-2"></i>
              Položky zahrnuté ve výplatě
            </h3>

            <DataTableWithScroll
              v-if="payoutItems && payoutItems.length > 0"
              :value="payoutItems"
              :loading="loading"
              :paginator="true"
              :rows="100"
              :rowsPerPageOptions="[50, 100, 500, 1000]"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="Zobrazeno {first} až {last} z {totalRecords} položek"
              class="modern-table"
              stripedRows
              :globalFilterFields="['objednavka_cislo', 'nazev']"
              v-model:filters="filters"
              filterDisplay="row"
              :enableDualScroll="true"
            >
              <!-- Order Number Column -->
              <Column field="objednavka_cislo" header="Číslo objednávky" :sortable="true" style="width: 180px">
                <template #filter="{ filterModel, filterCallback }">
                  <InputText
                    type="text"
                    v-model="filterModel.value"
                    @input="filterCallback()"
                    class="p-column-filter"
                    placeholder="Filtr"
                  />
                </template>
                <template #body="{ data }">
                  <Badge :value="data.objednavka_cislo" severity="info" />
                </template>
              </Column>

              <!-- Order Date Column -->
              <Column field="objednavka_datum" header="Datum objednávky" :sortable="true" style="width: 180px" :showFilterMenu="false">
                <template #filter="{ filterModel, filterCallback }">
                  <InputText
                    v-model="filterModel.value"
                    @input="filterCallback()"
                    placeholder="Hledat datum..."
                    class="p-column-filter"
                  />
                </template>
                <template #body="{ data }">
                  <span>{{ formatDate(data.objednavka_datum) }}</span>
                </template>
              </Column>

              <!-- Product Name Column -->
              <Column field="nazev" header="Položka" :sortable="true">
                <template #filter="{ filterModel, filterCallback }">
                  <InputText
                    type="text"
                    v-model="filterModel.value"
                    @input="filterCallback()"
                    class="p-column-filter"
                    placeholder="Filtr názvu"
                  />
                </template>
                <template #body="{ data }">
                  <div class="product-info">
                    <div class="product-name">{{ data.nazev || '-' }}</div>
                    <div class="product-variant" v-if="data.varianta">
                      <Tag :value="data.varianta" severity="secondary" />
                    </div>
                  </div>
                </template>
              </Column>

              <!-- Unit Price Column -->
              <Column field="cena_ks" header="Cena / KS" :sortable="true" style="width: 120px" :showFilterMenu="false">
                <template #filter="{ filterModel, filterCallback }">
                  <InputText
                    v-model="filterModel.value"
                    @input="filterCallback()"
                    placeholder="Cena..."
                    class="p-column-filter"
                    type="number"
                  />
                </template>
                <template #body="{ data }">
                  <strong>{{ formatCurrency(data.cena_ks) }}</strong>
                </template>
              </Column>

              <!-- Quantity Column -->
              <Column field="pocet_ks" header="Počet KS" :sortable="true" style="width: 100px" :showFilterMenu="false">
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
                  <Badge :value="data.pocet_ks" severity="secondary" />
                </template>
              </Column>

              <!-- Total Price Column -->
              <Column field="total" header="Celkem" :sortable="false" style="width: 150px" :showFilterMenu="false">
                <template #filter="{ filterModel, filterCallback }">
                  <InputText
                    v-model="filterModel.value"
                    @input="filterCallback()"
                    placeholder="Celkem..."
                    class="p-column-filter"
                    type="number"
                  />
                </template>
                <template #body="{ data }">
                  <strong class="text-primary">
                    {{ formatCurrency((data.cena_ks || 0) * (data.pocet_ks || 0)) }}
                  </strong>
                </template>
              </Column>
            </DataTableWithScroll>

            <!-- Empty Items State -->
            <div v-else class="empty-state mt-4">
              <i class="pi pi-inbox empty-icon"></i>
              <h3 class="empty-title">Žádné položky</h3>
              <p class="empty-description">Tato výplata neobsahuje žádné položky.</p>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'
import Badge from 'primevue/badge'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import { FilterMatchMode } from '@primevue/core/api'
import StatsRow from '@/components/StatsRow.vue'
import DataTableWithScroll from '@/components/DataTableWithScroll.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State
const payoutId = ref(route.params.id)
const payoutData = ref(null)
const payoutItems = ref([])
const loading = ref(false)
const error = ref('')
const filters = ref({
  objednavka_cislo: { value: null, matchMode: FilterMatchMode.CONTAINS },
  nazev: { value: null, matchMode: FilterMatchMode.CONTAINS },
  objednavka_datum: { value: null, matchMode: FilterMatchMode.CONTAINS },
  cena_ks: { value: null, matchMode: FilterMatchMode.EQUALS },
  pocet_ks: { value: null, matchMode: FilterMatchMode.EQUALS },
  'total': { value: null, matchMode: FilterMatchMode.EQUALS }
})

// Computed
const itemsCount = computed(() => {
  return payoutItems.value ? payoutItems.value.length : 0
})

const totalAmount = computed(() => {
  if (!payoutItems.value || payoutItems.value.length === 0) return 0
  return payoutItems.value.reduce((sum, item) => {
    const price = parseFloat(item.cena_ks) || 0
    const quantity = parseFloat(item.pocet_ks) || 0
    return sum + (price * quantity)
  }, 0)
})

// Methods
const fetchPayoutDetail = async () => {
  loading.value = true
  error.value = ''

  try {
    // Check for sales channel URL
    if (!authStore.salesChannelUrl) {
      error.value = 'Sales channel URL není k dispozici'
      loading.value = false
      return
    }

    const { data, error: fetchError } = await supabase.functions.invoke('get-payout-detail', {
      body: {
        payout_id: payoutId.value,
        sales_channel_url: authStore.salesChannelUrl
      }
    })

    if (fetchError) {
      throw fetchError
    }

    if (data && data.payout) {
      payoutData.value = data.payout
      payoutItems.value = (data.payout.items || []).map(item => ({
        ...item,
        total: (parseFloat(item.cena_ks) || 0) * (parseFloat(item.pocet_ks) || 0)
      }))
    }
  } catch (err) {
    console.error('Error fetching payout detail:', err)
    error.value = err.message || 'Nepodařilo se načíst detail výplaty'
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value) => {
  if (!value && value !== 0) return '0 Kč'
  const number = parseFloat(value)
  if (isNaN(number)) return '0 Kč'
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(number)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatDateRange = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}


// Lifecycle
onMounted(() => {
  fetchPayoutDetail()
})
</script>

<style scoped>
.provize-detail-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}


/* Main Card - matching Provize view */
.provize-detail-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  flex: 1;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
}

.header-subtitle {
  color: #64748b;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  margin-bottom: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

/* Stats handled by StatsRow component */


/* Items Section */
.items-section {
  margin-top: 1rem;
  padding: 0;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  padding: 0 1.5rem 1.5rem 1.5rem;
  display: flex;
  align-items: center;
}

/* Product Info */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.product-name {
  font-weight: 500;
  color: #1e293b;
}

.product-variant {
  display: inline-block;
}

/* Modern Table Styles - matching Provize view */
:deep(.modern-table .p-datatable-table) {
  font-size: 0.875rem;
}

:deep(.modern-table .p-datatable-thead > tr > th) {
  background: #f9fafb;
  border-color: #e5e7eb;
  font-weight: 600;
  color: #374151;
  padding: 0.75rem 1rem;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.025em;
}

:deep(.modern-table .p-datatable-tbody > tr) {
  transition: all 0.2s;
}

:deep(.modern-table .p-datatable-tbody > tr:hover) {
  background: #f9fafb !important;
}

:deep(.modern-table .p-datatable-tbody > tr > td) {
  border-color: #e5e7eb;
  padding: 0.75rem 1rem;
  vertical-align: middle;
}

:deep(.modern-table .p-paginator) {
  padding: 1rem;
  background: white;
  border-top: 1px solid #e5e7eb;
}

:deep(.p-column-filter) {
  width: 100%;
  padding: 0.375rem 0.5rem;
  font-size: 11px;
}

/* Loading & Empty States - matching Provize view */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.loading-text {
  color: #6b7280;
  font-size: 0.875rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-description {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

/* Utility Classes */
.text-primary {
  color: #0084ff;
}

.text-red-500 {
  color: #ef4444;
}

.mt-3 {
  margin-top: 0.75rem;
}

.mt-4 {
  margin-top: 1rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr 1fr;
  }

  .card-header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .header-title {
    font-size: 1.25rem;
  }

  .header-subtitle {
    font-size: 0.813rem;
  }

  .modern-table :deep(.p-datatable-thead > tr > th),
  .modern-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.5rem;
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .header-title {
    font-size: 1.125rem;
  }

  .product-info {
    font-size: 0.813rem;
  }
}
</style>
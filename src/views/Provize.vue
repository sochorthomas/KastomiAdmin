<template>
  <div class="provize-container">
    <!-- Main Content Card -->
    <Card class="provize-card">
      <template #header>
        <div class="card-header-content">
          <div class="header-left">
            <h2 class="header-title">
              <i class="pi pi-percentage mr-2 text-primary"></i>
              Provize
            </h2>
            <p class="header-subtitle">Přehled provizí a výplat</p>
          </div>
          <div class="header-actions">
            <Button
              @click="showHelpModal = true"
              icon="pi pi-question-circle"
              severity="help"
              class="help-button mr-2"
              v-tooltip.bottom="'Nápověda'"
              label="Nápověda"
            />
            <Button
              @click="fetchProvizeData"
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
        <!-- Quick Stats -->
        <StatsRow
          v-if="!loading && stats"
          :stats="[
            {
              icon: 'pi pi-lock',
              value: stats.blokovano,
              label: 'Blokováno',
              variant: 'danger',
              format: 'currency'
            },
            {
              icon: 'pi pi-unlock',
              value: stats.uvolneno,
              label: 'Uvolněno',
              variant: 'warning',
              format: 'currency'
            },
            {
              icon: 'pi pi-wallet',
              value: stats.payout,
              label: 'Payout',
              variant: 'info',
              format: 'currency'
            },
            {
              icon: 'pi pi-check-circle',
              value: stats.vyplaceno,
              label: 'Vyplaceno',
              variant: 'success',
              format: 'currency'
            }
          ]"
          style="margin-bottom: 1.5rem;"
        />

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <ProgressSpinner />
          <p class="loading-text">Načítání dat o provizích...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="empty-state">
          <i class="pi pi-exclamation-triangle empty-icon text-red-500"></i>
          <h3 class="empty-title">Chyba při načítání</h3>
          <p class="empty-description">{{ error }}</p>
          <Button
            @click="fetchProvizeData"
            label="Zkusit znovu"
            icon="pi pi-refresh"
            severity="primary"
            class="mt-3"
          />
        </div>

        <!-- Content -->
        <div v-else>
          <!-- Payouts to Create Section -->
          <div v-if="payoutData && payoutData.to_payout_items && payoutData.to_payout_items.length > 0" class="payout-create-section">
            <div class="section-header">
              <h3 class="section-title">
                <i class="pi pi-send mr-2"></i>
                Připraveno k výplatě
              </h3>
              <Button
                label="Vytvořit žádost o payout"
                :badge="String(payoutData.to_payout_items.length)"
                icon="pi pi-plus"
                severity="success"
                @click="navigateToNewPayout"
              />
            </div>
            <Message severity="info" :closable="false" class="mt-3">
              <span>Máte <strong>{{ payoutData.to_payout_items.length }}</strong> položek připravených k vyplacení.</span>
            </Message>
          </div>

          <!-- No Items to Payout -->
          <div v-else-if="payoutData && (!payoutData.to_payout_items || payoutData.to_payout_items.length === 0)" class="payout-create-section">
            <Message severity="info" :closable="false">
              Aktuálně není žádná položka uvolněná k vyplacení.
            </Message>
          </div>

          <!-- Existing Payouts Table -->
          <div class="payouts-section">
            <h3 class="section-title">
              <i class="pi pi-history mr-2"></i>
              Historie výplat
            </h3>

            <DataTableWithScroll
              v-if="payoutData && payoutData.payouts && payoutData.payouts.length > 0"
              :value="payoutData.payouts"
              :loading="loading"
              :paginator="true"
              :rows="100"
              :rowsPerPageOptions="[50, 100, 500, 1000]"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="Zobrazeno {first} až {last} z {totalRecords} záznamů"
              class="modern-table"
              stripedRows
              :enableDualScroll="true"
              v-model:filters="filters"
              filterDisplay="row"
            >
              <Column field="id" header="ID" :sortable="true" style="width: 80px" :showFilterMenu="false">
                <template #filter="{ filterModel, filterCallback }">
                  <InputText
                    v-model="filterModel.value"
                    @input="filterCallback()"
                    placeholder="Hledat ID..."
                    class="p-column-filter"
                  />
                </template>
                <template #body="{ data }">
                  <Badge :value="'#' + data.id" severity="secondary" />
                </template>
              </Column>

              <Column field="poznamka" header="Poznámka" :sortable="true" :showFilterMenu="false">
                <template #filter="{ filterModel, filterCallback }">
                  <InputText
                    v-model="filterModel.value"
                    @input="filterCallback()"
                    placeholder="Hledat poznámku..."
                    class="p-column-filter"
                  />
                </template>
                <template #body="{ data }">
                  <span v-html="formatPoznamkaWithColoredDates(data.poznamka)" v-if="data.poznamka"></span>
                  <span v-else>-</span>
                </template>
              </Column>

              <Column field="created_at" header="Datum vytvoření" :sortable="true" style="width: 180px" :showFilterMenu="false">
                <template #filter="{ filterModel, filterCallback }">
                  <InputText
                    v-model="filterModel.value"
                    @input="filterCallback()"
                    placeholder="Hledat datum..."
                    class="p-column-filter"
                  />
                </template>
                <template #body="{ data }">
                  <span v-if="data.created_at">
                    {{ new Date(data.created_at).toLocaleDateString('cs-CZ') }}
                  </span>
                  <span v-else>-</span>
                </template>
              </Column>

              <Column field="items_count" header="Počet položek" :sortable="true" style="width: 140px" :showFilterMenu="false">
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
                    :value="(data.items ? data.items.length : 0) + ' položek'"
                    severity="info"
                  />
                </template>
              </Column>

              <Column field="total_amount" header="Celková částka" :sortable="true" style="width: 150px" :showFilterMenu="false">
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
                  <strong class="text-primary">
                    {{ formatCurrency(data.total_amount) }}
                  </strong>
                </template>
              </Column>

              <Column header="Akce" style="width: 120px">
                <template #body="{ data }">
                  <Button
                    icon="pi pi-eye"
                    label="Detail"
                    severity="primary"
                    size="small"
                    @click="navigateToDetail(data.id)"
                  />
                </template>
              </Column>
            </DataTableWithScroll>

            <!-- Empty Payouts State -->
            <div v-else-if="!loading" class="empty-state">
              <i class="pi pi-inbox empty-icon"></i>
              <h3 class="empty-title">Žádné výplaty</h3>
              <p class="empty-description">Zatím nebyly vytvořeny žádné výplaty provizí.</p>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Help Modal -->
    <HelpModal
      v-model:visible="showHelpModal"
      title="Nápověda - Stavy provizí"
      icon="pi pi-question-circle"
      introduction="Systém provizí automaticky sleduje stav objednávek a vypočítává provize na základě jejich statusu. Zde je vysvětlení jednotlivých stavů:"
      :items="helpItems"
      modalWidth="45vw"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { useToast } from 'primevue/usetoast'
import { FilterMatchMode } from '@primevue/core/api'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import Badge from 'primevue/badge'
import Message from 'primevue/message'
import StatsRow from '@/components/StatsRow.vue'
import DataTableWithScroll from '@/components/DataTableWithScroll.vue'
import HelpModal from '@/components/HelpModal.vue'

// Router and stores
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const loading = ref(false)
const error = ref(null)
const stats = ref(null)
const payoutData = ref(null)
const showHelpModal = ref(false)

// Help modal items
const helpItems = ref([
  {
    term: 'Blokováno',
    description: 'Objednávka byla přijata, ale provize je dočasně blokována. Provize bude uvolněna až po potvrzení, že zákazník objednávku nevrátí (obvykle 14-30 dní).',
    color: '#ef4444',
    icon: 'pi pi-lock'
  },
  {
    term: 'Uvolněno',
    description: 'Provize byla uvolněna a je připravena k vyplacení. Čeká na vytvoření hromadné výplaty administrátorem.',
    color: '#f59e0b',
    icon: 'pi pi-unlock'
  },
  {
    term: 'Payout',
    description: 'Provize byla zařazena do výplaty a čeká na zpracování. V této fázi se připravuje převod prostředků.',
    color: '#3b82f6',
    icon: 'pi pi-clock'
  },
  {
    term: 'Vyplaceno',
    description: 'Provize byla úspěšně vyplacena na váš účet. Prostředky byste měli obdržet do několika pracovních dnů.',
    color: '#10b981',
    icon: 'pi pi-check-circle'
  }
])

// Column filters for DataTable
const filters = ref({
  id: { value: null, matchMode: FilterMatchMode.CONTAINS },
  poznamka: { value: null, matchMode: FilterMatchMode.CONTAINS },
  created_at: { value: null, matchMode: FilterMatchMode.CONTAINS },
  items_count: { value: null, matchMode: FilterMatchMode.EQUALS },
  total_amount: { value: null, matchMode: FilterMatchMode.EQUALS }
})

// Computed
const formatCurrency = (value) => {
  if (!value && value !== 0) return '0 Kč'
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const calculatePayoutTotal = (items) => {
  if (!items || !Array.isArray(items)) return formatCurrency(0)

  const total = items.reduce((sum, item) => {
    const price = parseFloat(item.cena_ks) || 0
    const quantity = parseInt(item.pocet_ks) || 0
    return sum + (price * quantity)
  }, 0)

  return formatCurrency(total)
}

// Format poznámka with colored dates
const formatPoznamkaWithColoredDates = (text) => {
  if (!text) return '-'

  // Replace dates (YYYY-MM-DD format) with colored spans
  const dateRegex = /(\d{4}-\d{2}-\d{2})/g
  const formattedText = text.replace(dateRegex, '<span style="color: #0084ff; font-weight: 600;">$1</span>')

  return formattedText
}

// Methods
const fetchProvizeData = async () => {
  // Commented out for testing with static URL
  // if (!authStore.salesChannelUrl) {
  //   console.warn('Sales channel URL not available yet')
  //   return
  // }

  loading.value = true
  error.value = null

  try {
    // Fetch commission statistics
    const { data: statsData, error: statsError } = await supabase.functions.invoke('get-commission-stats', {
      body: {
        sales_channel_url: "fanshop.tatranflorbal.cz" // Static URL for testing
      }
    })

    if (statsError) throw statsError
    stats.value = statsData

    // Fetch payout data
    const { data: payoutResponse, error: payoutError } = await supabase.functions.invoke('get-payouts', {
      body: {
        sales_channel_url: "fanshop.tatranflorbal.cz" // Static URL for testing
      }
    })

    if (payoutError) throw payoutError
    // Add computed fields for sorting
    if (payoutResponse && payoutResponse.payouts) {
      payoutResponse.payouts = payoutResponse.payouts.map(payout => ({
        ...payout,
        items_count: payout.items ? payout.items.length : 0,
        total_amount: payout.items ? payout.items.reduce((sum, item) => {
          const price = parseFloat(item.cena_ks) || 0
          const quantity = parseFloat(item.pocet_ks) || 0
          return sum + (price * quantity)
        }, 0) : 0
      }))
    }

    payoutData.value = payoutResponse

    toast.add({
      severity: 'success',
      summary: 'Data aktualizována',
      detail: 'Data o provizích byla úspěšně načtena',
      life: 3000
    })
  } catch (err) {
    console.error('Error fetching provize data:', err)
    error.value = err.message || 'Nepodařilo se načíst data o provizích'

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

const navigateToDetail = (payoutId) => {
  router.push(`/provize/${payoutId}`)
}

const navigateToNewPayout = () => {
  router.push('/provize/new')
}

// Watch for sales channel URL changes (disabled for testing)
// watch(() => authStore.salesChannelUrl, (newUrl) => {
//   if (newUrl && !stats.value && !loading.value) {
//     fetchProvizeData()
//   }
// })

// Lifecycle
onMounted(() => {
  // Always fetch for testing with static URL
  fetchProvizeData()
})
</script>

<style scoped>
/* Container - matching Products view */
.provize-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Stats handled by StatsRow component */

/* Main Card - identical to Products view */
.provize-card {
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

/* Loading & Empty States - identical to Products view */
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
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.empty-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

/* ========== PROVIZE-SPECIFIC SECTIONS ========== */

/* Payout Create Section - unique to Provize */
.payout-create-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
}

.section-title i {
  color: #3b82f6;
}

/* Payouts Section - unique to Provize */
.payouts-section {
  margin-top: 1.5rem;
}

.payouts-section .section-title {
  margin-bottom: 1rem;
}

/* Table Styles - matching Products view exactly */
.modern-table :deep(.p-datatable-thead > tr > th) {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
  border: none;
  padding: 0.75rem 1rem;
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
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
}

.modern-table :deep(.p-datatable-wrapper) {
  overflow: visible;
}

.modern-table :deep(.p-datatable-table) {
  overflow: visible;
}

/* Text utilities */
.text-primary {
  color: #3b82f6;
}

.mr-2 {
  margin-right: 0.5rem;
}

.mt-3 {
  margin-top: 0.75rem;
}

.mt-4 {
  margin-top: 1rem;
}

/* Responsive Design - matching Products view */
@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .card-header-content {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }

  .section-header {
    flex-direction: column;
    gap: 0.75rem;
  }

  .payout-create-section {
    padding: 1rem;
  }

  .modern-table :deep(.p-datatable-thead > tr > th),
  .modern-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.5rem;
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
</style>
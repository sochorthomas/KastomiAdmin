<template>
  <div class="provize-new-container">
    <!-- Main Content Card -->
    <Card class="provize-new-card">
      <template #header>
        <div class="card-header-content">
          <div class="header-left">
            <h2 class="header-title">
              <i class="pi pi-plus-circle mr-2 text-primary"></i>
              Vytvořit žádost o výplatu
            </h2>
            <p class="header-subtitle">Vyberte položky pro zahrnutí do výplaty provizí</p>
          </div>
          <div class="header-actions">
            <Button
              @click="fetchPayoutItems"
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
          <p class="loading-text">Načítání položek k výplatě...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="empty-state">
          <i class="pi pi-exclamation-triangle empty-icon text-red-500"></i>
          <h3 class="empty-title">Chyba při načítání</h3>
          <p class="empty-description">{{ error }}</p>
          <Button
            @click="fetchPayoutItems"
            label="Zkusit znovu"
            icon="pi pi-refresh"
            severity="primary"
            class="mt-3"
          />
        </div>

        <!-- Content -->
        <div v-else-if="payoutItems && payoutItems.length > 0">
          <!-- Info Message -->
          <Message severity="info" :closable="false" class="mb-4">
            <div class="flex align-items-center justify-content-between">
              <span>
                Následující položky jsou uvolněné k vyplacení.
                Odškrtnutím můžete konkrétní položku ze žádosti odstranit.
              </span>
              <div class="flex align-items-center gap-3">
                <span class="font-semibold">Vybráno: {{ selectedCount }} položek</span>
                <span class="font-semibold text-primary">Celkem: {{ selectedTotal }}</span>
              </div>
            </div>
          </Message>

          <!-- Selection Controls -->
          <div class="selection-controls mb-3">
            <Button
              label="Vybrat vše"
              icon="pi pi-check-square"
              @click="selectAll"
              severity="secondary"
              size="small"
              outlined
              class="mr-2"
            />
            <Button
              label="Zrušit výběr"
              icon="pi pi-square"
              @click="deselectAll"
              severity="secondary"
              size="small"
              outlined
            />
          </div>

          <!-- Items Table -->
          <DataTable
            v-model:selection="selectedItems"
            :value="payoutItems"
            :loading="loading"
            :paginator="true"
            :rows="100"
            :rowsPerPageOptions="[50, 100, 500, 1000]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Zobrazeno {first} až {last} z {totalRecords} položek"
            class="p-datatable-striped"
            responsiveLayout="scroll"
            dataKey="id"
            :metaKeySelection="false"
          >
            <!-- Checkbox Column -->
            <Column selectionMode="multiple" style="width: 50px" :exportable="false"></Column>

            <!-- Order Number -->
            <Column field="objednavka_cislo" header="Číslo objednávky" :sortable="true" style="width: 150px">
              <template #body="{ data }">
                <Badge :value="data.objednavka_cislo" severity="secondary" />
              </template>
            </Column>

            <!-- Order Date -->
            <Column field="objednavka_datum" header="Datum objednávky" :sortable="true" style="width: 180px">
              <template #body="{ data }">
                <span>{{ formatDateTime(data.objednavka_datum) }}</span>
              </template>
            </Column>

            <!-- Product Name -->
            <Column field="nazev" header="Položka" :sortable="true">
              <template #body="{ data }">
                <div class="product-name">
                  <i class="pi pi-box mr-2 text-primary"></i>
                  <span>{{ data.nazev }}</span>
                </div>
              </template>
            </Column>

            <!-- Price per Unit -->
            <Column field="cena_ks" header="Cena / ks" :sortable="true" style="width: 120px">
              <template #body="{ data }">
                <strong>{{ formatCurrency(data.cena_ks) }}</strong>
              </template>
            </Column>

            <!-- Quantity -->
            <Column field="pocet_ks" header="Počet ks" :sortable="true" style="width: 100px">
              <template #body="{ data }">
                <Badge :value="data.pocet_ks" severity="info" />
              </template>
            </Column>

            <!-- Total -->
            <Column header="Celkem" style="width: 130px">
              <template #body="{ data }">
                <strong class="text-primary">
                  {{ formatCurrency((data.cena_ks || 0) * (data.pocet_ks || 0)) }}
                </strong>
              </template>
            </Column>
          </DataTable>

          <!-- Submit Section -->
          <div class="submit-section">
            <div class="submit-info">
              <div class="submit-summary">
                <div class="summary-item">
                  <span class="summary-label">Vybraných položek:</span>
                  <Badge :value="selectedCount" severity="info" />
                </div>
                <div class="summary-item">
                  <span class="summary-label">Celková částka:</span>
                  <span class="summary-value text-primary">{{ selectedTotal }}</span>
                </div>
              </div>
            </div>

            <div class="submit-form">
              <div class="form-group">
                <label for="payout-note" class="form-label">Poznámka k výplatě (volitelné)</label>
                <Textarea
                  id="payout-note"
                  v-model="payoutNote"
                  placeholder="Zadejte poznámku k této výplatě..."
                  rows="3"
                  class="w-full"
                />
              </div>

              <div class="submit-actions">
                <Button
                  label="Zrušit"
                  icon="pi pi-times"
                  @click="navigateBack"
                  severity="secondary"
                  outlined
                  class="mr-2"
                />
                <Button
                  label="Potvrdit žádost o payout"
                  icon="pi pi-check"
                  @click="confirmPayout"
                  :disabled="selectedCount === 0"
                  :loading="submitting"
                  severity="success"
                  size="large"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <i class="pi pi-inbox empty-icon"></i>
          <h3 class="empty-title">Žádné položky k výplatě</h3>
          <p class="empty-description">Momentálně nejsou k dispozici žádné položky připravené k výplatě.</p>
          <Button
            label="Zpět na přehled"
            icon="pi pi-arrow-left"
            @click="navigateBack"
            severity="primary"
            class="mt-3"
          />
        </div>
      </template>
    </Card>

    <!-- Confirmation Dialog -->
    <Dialog
      v-model:visible="showConfirmDialog"
      :modal="true"
      header="Potvrzení vytvoření payoutu"
      :style="{ width: '450px' }"
      :closable="true"
    >
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle text-warning text-3xl mb-3"></i>
        <p class="mb-3">
          Opravdu chcete vytvořit žádost o payout?
        </p>
        <div class="confirmation-details">
          <div class="detail-item">
            <span class="detail-label">Počet položek:</span>
            <strong>{{ selectedCount }}</strong>
          </div>
          <div class="detail-item">
            <span class="detail-label">Celková částka:</span>
            <strong class="text-primary">{{ selectedTotal }}</strong>
          </div>
          <div v-if="payoutNote" class="detail-item">
            <span class="detail-label">Poznámka:</span>
            <span>{{ payoutNote }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="Zrušit"
          icon="pi pi-times"
          @click="showConfirmDialog = false"
          severity="secondary"
          text
        />
        <Button
          label="Potvrdit"
          icon="pi pi-check"
          @click="submitPayout"
          :loading="submitting"
          severity="success"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'
import Badge from 'primevue/badge'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'

// Router and stores
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()
const confirm = useConfirm()

// State
const loading = ref(false)
const submitting = ref(false)
const error = ref(null)
const payoutItems = ref([])
const selectedItems = ref([])
const payoutNote = ref('')
const showConfirmDialog = ref(false)

// Computed
const selectedCount = computed(() => selectedItems.value.length)

const selectedTotal = computed(() => {
  const total = selectedItems.value.reduce((sum, item) => {
    const price = parseFloat(item.cena_ks) || 0
    const quantity = parseInt(item.pocet_ks) || 0
    return sum + (price * quantity)
  }, 0)
  return formatCurrency(total)
})

// Methods
const formatCurrency = (value) => {
  if (!value && value !== 0) return '0 Kč'
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchPayoutItems = async () => {
  loading.value = true
  error.value = null

  try {
    // Fetch items ready for payout
    const { data, error: fetchError } = await supabase.functions.invoke('get-payouts', {
      body: {
        sales_channel_url: "fanshop.tatranflorbal.cz" // Static URL for testing
      }
    })

    if (fetchError) throw fetchError

    if (data && data.to_payout_items) {
      payoutItems.value = data.to_payout_items
      // Select all items by default
      selectedItems.value = [...data.to_payout_items]

      toast.add({
        severity: 'success',
        summary: 'Data načtena',
        detail: `Načteno ${payoutItems.value.length} položek připravených k výplatě`,
        life: 3000
      })
    } else {
      payoutItems.value = []
      selectedItems.value = []
    }
  } catch (err) {
    console.error('Error fetching payout items:', err)
    error.value = err.message || 'Nepodařilo se načíst položky k výplatě'

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

const selectAll = () => {
  selectedItems.value = [...payoutItems.value]
}

const deselectAll = () => {
  selectedItems.value = []
}

const confirmPayout = () => {
  if (selectedCount.value === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Upozornění',
      detail: 'Vyberte alespoň jednu položku pro vytvoření payoutu',
      life: 3000
    })
    return
  }

  showConfirmDialog.value = true
}

const submitPayout = async () => {
  submitting.value = true

  try {
    // Get IDs of selected items
    const selectedIds = selectedItems.value.map(item => item.id)

    // Create payout request
    const { data, error: submitError } = await supabase.functions.invoke('create-payout', {
      body: {
        sales_channel_url: "fanshop.tatranflorbal.cz", // Static URL for testing
        items: selectedIds,
        poznamka: payoutNote.value || `Payout vytvořen ${new Date().toLocaleDateString('cs-CZ')}`
      }
    })

    if (submitError) throw submitError

    showConfirmDialog.value = false

    toast.add({
      severity: 'success',
      summary: 'Úspěch',
      detail: 'Žádost o payout byla úspěšně vytvořena',
      life: 5000
    })

    // Navigate back to overview after short delay
    setTimeout(() => {
      router.push('/provize')
    }, 2000)
  } catch (err) {
    console.error('Error creating payout:', err)

    toast.add({
      severity: 'error',
      summary: 'Chyba',
      detail: 'Nepodařilo se vytvořit žádost o payout: ' + err.message,
      life: 5000
    })
  } finally {
    submitting.value = false
  }
}


// Lifecycle
onMounted(() => {
  fetchPayoutItems()
})
</script>

<style scoped>
.provize-new-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}


/* Main Card */
.provize-new-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

/* Selection Controls */
.selection-controls {
  display: flex;
  gap: 0.5rem;
  padding: 0 1rem;
}

/* Product Name */
.product-name {
  display: flex;
  align-items: center;
  font-weight: 500;
}

/* Submit Section */
.submit-section {
  margin-top: 2rem;
  background: #f8fafc;
  border-radius: 8px;
}

.submit-info {
  margin-bottom: 1.5rem;
}

.submit-summary {
  display: flex;
  gap: 2rem;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.summary-label {
  font-weight: 500;
  color: #64748b;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 700;
}

/* Form */
.submit-form {
  margin-top: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.submit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

/* Confirmation Dialog */
.confirmation-content {
  text-align: center;
}

.confirmation-details {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.detail-item:not(:last-child) {
  border-bottom: 1px solid #e2e8f0;
}

.detail-label {
  color: #64748b;
  font-weight: 500;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-text {
  margin-top: 1rem;
  color: #64748b;
  font-size: 0.875rem;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 0.5rem 0;
}

.empty-description {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
}

/* DataTable Overrides */
:deep(.p-datatable) {
  font-size: 0.875rem;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f8fafc;
  border: none;
  font-weight: 600;
  color: #475569;
  padding: 1rem;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  border: none;
  padding: 1rem;
  vertical-align: middle;
}

:deep(.p-datatable-striped .p-datatable-tbody > tr:nth-child(even)) {
  background: #f8fafc;
}

:deep(.p-paginator) {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  background: white;
}

/* Responsive - Tablets */
@media (max-width: 1024px) {
  .selection-controls {
    flex-wrap: wrap;
  }

  .submit-summary {
    flex-wrap: wrap;
  }

  :deep(.p-datatable) {
    font-size: 0.813rem;
  }

  :deep(.p-datatable .p-datatable-thead > tr > th) {
    padding: 0.75rem;
    font-size: 0.813rem;
  }

  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.75rem;
  }

  .confirmation-details {
    font-size: 0.875rem;
  }
}

/* Responsive - Mobile */
@media (max-width: 768px) {
  .provize-new-container {
    padding: 0.25rem;
    gap: 0.5rem;
  }


  .provize-new-card {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .card-header-content {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
    align-items: stretch;
  }

  .header-left {
    text-align: center;
  }

  .header-title {
    font-size: 1.25rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .header-subtitle {
    text-align: center;
    font-size: 0.813rem;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }

  .refresh-button {
    width: 100%;
  }

  /* Info message adjustments */
  :deep(.p-message) {
    margin-bottom: 1rem;
  }

  :deep(.p-message .p-message-wrapper) {
    padding: 0.75rem;
  }

  :deep(.p-message .p-message-text) {
    font-size: 0.813rem;
  }

  .selection-controls {
    padding: 0 0.5rem;
    justify-content: center;
    gap: 0.5rem;
  }

  .selection-controls .p-button {
    flex: 1;
    font-size: 0.813rem;
  }

  /* Mobile-optimized DataTable */
  :deep(.p-datatable) {
    font-size: 0.75rem;
  }

  :deep(.p-datatable .p-datatable-wrapper) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  :deep(.p-datatable .p-datatable-thead > tr > th) {
    padding: 0.5rem;
    font-size: 0.75rem;
    white-space: nowrap;
  }

  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.5rem;
  }

  /* Hide less important columns on mobile */
  :deep(.p-datatable .p-datatable-thead > tr > th:nth-child(3)),
  :deep(.p-datatable .p-datatable-tbody > tr > td:nth-child(3)) {
    display: none; /* Hide order date column */
  }

  .product-name {
    font-size: 0.813rem;
  }

  .product-name i {
    display: none;
  }

  :deep(.p-paginator) {
    padding: 0.75rem;
    font-size: 0.813rem;
  }

  :deep(.p-paginator .p-paginator-pages .p-paginator-page) {
    min-width: 1.75rem;
    height: 1.75rem;
    font-size: 0.75rem;
  }

  :deep(.p-paginator .p-dropdown) {
    font-size: 0.75rem;
  }

  /* Submit section adjustments */
  .submit-section {
    margin-top: 1rem;
    border-radius: 6px;
  }

  .submit-info {
    margin-bottom: 0.75rem;
  }

  .submit-summary {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .summary-item {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.5rem;
  }

  .summary-label {
    font-size: 0.813rem;
  }

  .summary-value {
    font-size: 1.125rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-label {
    font-size: 0.875rem;
    margin-bottom: 0.375rem;
  }

  :deep(.p-inputtextarea) {
    font-size: 0.875rem;
  }

  .submit-actions {
    flex-direction: column-reverse;
    gap: 0.75rem;
    padding-top: 0.75rem;
  }

  .submit-actions .p-button {
    width: 100%;
  }

  /* Dialog adjustments */
  :deep(.p-dialog) {
    width: 90vw !important;
    margin: 0 1rem;
  }

  :deep(.p-dialog .p-dialog-header) {
    padding: 1rem;
  }

  :deep(.p-dialog .p-dialog-content) {
    padding: 1rem;
  }

  :deep(.p-dialog .p-dialog-footer) {
    padding: 1rem;
    gap: 0.5rem;
  }

  .confirmation-content {
    font-size: 0.875rem;
  }

  .confirmation-details {
    margin-top: 1rem;
    padding: 0.75rem;
    font-size: 0.813rem;
  }

  .detail-item {
    padding: 0.375rem 0;
  }

  /* Empty state adjustments */
  .empty-state {
    padding: 2rem 1rem;
  }

  .empty-icon {
    font-size: 2.5rem;
  }

  .empty-title {
    font-size: 1.125rem;
  }

  .empty-description {
    font-size: 0.813rem;
  }

  /* Loading state adjustments */
  .loading-state {
    padding: 3rem 1rem;
  }

  .loading-text {
    font-size: 0.813rem;
  }
}

/* Extra small devices */
@media (max-width: 480px) {
  .header-title {
    font-size: 1.125rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .header-title i {
    font-size: 1.5rem;
  }

  /* Stack info message content */
  :deep(.p-message .flex) {
    flex-direction: column !important;
    gap: 0.75rem;
  }

  /* Make selection controls vertical */
  .selection-controls {
    flex-direction: column;
  }

  .selection-controls .p-button {
    width: 100%;
  }

  /* Further reduce table font sizes */
  :deep(.p-datatable .p-datatable-thead > tr > th) {
    padding: 0.375rem;
    font-size: 0.688rem;
  }

  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.375rem;
    font-size: 0.688rem;
  }

  /* Hide more columns on very small screens */
  :deep(.p-datatable .p-datatable-thead > tr > th:nth-child(5)),
  :deep(.p-datatable .p-datatable-tbody > tr > td:nth-child(5)) {
    display: none; /* Also hide price per unit */
  }

  /* Responsive badges */
  :deep(.p-badge) {
    font-size: 0.688rem;
    padding: 0.125rem 0.375rem;
  }

  /* Checkbox column adjustment */
  :deep(.p-datatable .p-datatable-thead > tr > th:first-child),
  :deep(.p-datatable .p-datatable-tbody > tr > td:first-child) {
    width: 35px;
    padding: 0.25rem;
  }

  :deep(.p-checkbox) {
    width: 16px;
    height: 16px;
  }

  :deep(.p-checkbox .p-checkbox-box) {
    width: 16px;
    height: 16px;
  }

  /* Back button adjustment */

  /* Dialog footer buttons */
  :deep(.p-dialog .p-dialog-footer) {
    flex-direction: column-reverse;
  }

  :deep(.p-dialog .p-dialog-footer .p-button) {
    width: 100%;
    margin: 0;
  }

  /* Show horizontal scroll hint */
  :deep(.p-datatable .p-datatable-wrapper) {
    position: relative;
  }

  :deep(.p-datatable .p-datatable-wrapper::after) {
    content: '→';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.9));
    padding: 0.5rem;
    pointer-events: none;
    font-size: 1.5rem;
    color: #64748b;
  }
}
</style>
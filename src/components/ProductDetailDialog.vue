<template>
  <teleport to="body">
    <transition name="modal-fade">
      <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
        <div class="modal-container">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-content">
              <h4 class="modal-title">Detail produktu</h4>
              <div class="product-id">ID: {{ product?.variant_id }}</div>
            </div>
            <button class="close-btn" @click="handleClose">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <!-- Product Image and Basic Info -->
            <div class="product-header">
              <div class="product-image-container">
                <img 
                  v-if="product?.image" 
                  :src="product.image" 
                  :alt="product.name"
                  class="product-image"
                />
                <div v-else class="image-placeholder">
                  <i class="fas fa-image"></i>
                </div>
              </div>
              <div class="product-main-info">
                <h3 class="product-name">{{ product?.name }}</h3>
                <div class="variant-info">
                  <span class="variant-name">{{ product?.variant_name }}</span>
                  <span v-if="product?.size" class="variant-size">• {{ product.size }}</span>
                  <span v-if="product?.color" class="variant-color">• {{ product.color }}</span>
                </div>
                <div class="status-badge" :class="getStatusClass(product?.status)">
                  {{ getStatusText(product?.status) }}
                </div>
              </div>
            </div>

            <!-- Detail Fields -->
            <div class="detail-sections">
              <!-- Description Section -->
              <div class="detail-section">
                <div class="section-header">
                  <i class="fas fa-align-left section-icon"></i>
                  <h5>Popis produktu</h5>
                </div>
                <div class="field-row">
                  <div class="field-value" v-if="!editingFields.description">
                    <p class="description-text">{{ product?.description || 'Žádný popis není k dispozici' }}</p>
                    <button class="edit-btn" @click="startEdit('description')" title="Upravit">
                      <i class="fas fa-pencil-alt"></i>
                    </button>
                  </div>
                  <div class="field-edit" v-else>
                    <textarea 
                      v-model="editValues.description" 
                      class="form-control"
                      rows="3"
                      placeholder="Zadejte popis produktu..."
                    ></textarea>
                    <div class="edit-actions">
                      <button class="action-btn save-btn" @click="saveField('description')" title="Uložit">
                        <i class="fas fa-check"></i>
                      </button>
                      <button class="action-btn cancel-btn" @click="cancelEdit('description')" title="Zrušit">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pricing Section -->
              <div class="detail-section">
                <div class="section-header">
                  <i class="fas fa-tag section-icon"></i>
                  <h5>Cenové informace</h5>
                </div>
                
                <!-- Wholesale Price -->
                <div class="field-row">
                  <label class="field-label">Velkoobchodní cena:</label>
                  <div class="field-value" v-if="!editingFields.wholesale_price">
                    <span class="price-value">{{ formatCurrency(product?.wholesale_price) }}</span>
                    <button class="edit-btn" @click="startEdit('wholesale_price')" title="Upravit">
                      <i class="fas fa-pencil-alt"></i>
                    </button>
                  </div>
                  <div class="field-edit" v-else>
                    <div class="input-group">
                      <input 
                        type="number" 
                        v-model.number="editValues.wholesale_price" 
                        class="form-control"
                        step="0.01"
                        min="0"
                      />
                      <span class="input-group-text">Kč</span>
                    </div>
                    <div class="edit-actions">
                      <button class="action-btn save-btn" @click="saveField('wholesale_price')" title="Uložit">
                        <i class="fas fa-check"></i>
                      </button>
                      <button class="action-btn cancel-btn" @click="cancelEdit('wholesale_price')" title="Zrušit">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Club Support -->
                <div class="field-row">
                  <label class="field-label">Podpora klubu:</label>
                  <div class="field-value" v-if="!editingFields.club_support">
                    <span class="price-value">{{ formatCurrency(product?.club_support) }}</span>
                    <button class="edit-btn" @click="startEdit('club_support')" title="Upravit">
                      <i class="fas fa-pencil-alt"></i>
                    </button>
                  </div>
                  <div class="field-edit" v-else>
                    <div class="input-group">
                      <input 
                        type="number" 
                        v-model.number="editValues.club_support" 
                        class="form-control"
                        step="0.01"
                        min="0"
                      />
                      <span class="input-group-text">Kč</span>
                    </div>
                    <div class="edit-actions">
                      <button class="action-btn save-btn" @click="saveField('club_support')" title="Uložit">
                        <i class="fas fa-check"></i>
                      </button>
                      <button class="action-btn cancel-btn" @click="cancelEdit('club_support')" title="Zrušit">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Final Price (calculated) -->
                <div class="field-row final-price-row">
                  <label class="field-label">Koncová cena:</label>
                  <div class="field-value">
                    <span class="final-price">{{ formatCurrency(calculatedFinalPrice) }}</span>
                    <i class="fas fa-info-circle info-icon" title="Automaticky vypočítáno"></i>
                  </div>
                </div>
              </div>

              <!-- Status Section -->
              <div class="detail-section">
                <div class="section-header">
                  <i class="fas fa-toggle-on section-icon"></i>
                  <h5>Stav produktu</h5>
                </div>
                <div class="field-row">
                  <label class="field-label">Stav:</label>
                  <div class="field-value" v-if="!editingFields.status">
                    <span class="status-display" :class="getStatusClass(product?.status)">
                      {{ getStatusText(product?.status) }}
                    </span>
                    <button class="edit-btn" @click="startEdit('status')" title="Upravit">
                      <i class="fas fa-pencil-alt"></i>
                    </button>
                  </div>
                  <div class="field-edit" v-else>
                    <select v-model.number="editValues.status" class="form-select">
                      <option :value="1">Aktivní</option>
                      <option :value="0">Nedostupné</option>
                      <option :value="3">Archivované</option>
                    </select>
                    <div class="edit-actions">
                      <button class="action-btn save-btn" @click="saveField('status')" title="Uložit">
                        <i class="fas fa-check"></i>
                      </button>
                      <button class="action-btn cancel-btn" @click="cancelEdit('status')" title="Zrušit">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="handleClose">
              Zavřít
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Loading Overlay -->
    <div v-if="saving" class="loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Ukládání...</span>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { supabase } from '@/lib/supabase'

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

// Computed
const calculatedFinalPrice = computed(() => {
  const wholesale = editingFields.wholesale_price ? editValues.wholesale_price : (props.product?.wholesale_price || 0)
  const support = editingFields.club_support ? editValues.club_support : (props.product?.club_support || 0)
  return wholesale + support
})

// Methods
const formatCurrency = (value) => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0
  }).format(value || 0)
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

const startEdit = (field) => {
  // Cancel all other edits
  Object.keys(editingFields).forEach(key => {
    editingFields[key] = false
  })
  
  // Set edit values
  editValues[field] = props.product?.[field] || ''
  editingFields[field] = true
}

const cancelEdit = (field) => {
  editingFields[field] = false
  editValues[field] = props.product?.[field] || ''
}

const saveField = async (field) => {
  saving.value = true
  try {
    // Extract offer ID from the composite ID or use the original offer ID
    const offerId = props.product._originalOffer?.id || props.product.id.split('-')[0]
    
    // Prepare update data based on field
    const updateData = {
      id: Number(offerId)
    }
    
    if (field === 'wholesale_price' || field === 'club_support') {
      updateData.wholesale_price = field === 'wholesale_price' ? editValues.wholesale_price : props.product.wholesale_price
      updateData.klub_price = field === 'club_support' ? editValues.club_support : props.product.club_support
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
    
    // Update local product data
    emit('update', { ...props.product, [field]: editValues[field] })
    
    // Close edit mode
    editingFields[field] = false
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
  emit('close')
}

// Watch for product changes
watch(() => props.product, (newProduct) => {
  if (newProduct) {
    Object.keys(editValues).forEach(key => {
      editValues[key] = newProduct[key] || ''
    })
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
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Modal Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.product-id {
  font-size: 0.875rem;
  opacity: 0.9;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
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
}

/* Product Header */
.product-header {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #f3f4f6;
}

.product-image-container {
  flex-shrink: 0;
  width: 120px;
  height: 120px;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: #f3f4f6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 3rem;
}

.product-main-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-name {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
}

.variant-info {
  display: flex;
  gap: 8px;
  font-size: 0.95rem;
  color: #6b7280;
}

.variant-name {
  font-weight: 500;
}

.status-badge {
  align-self: flex-start;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-top: 8px;
}

.status-active {
  background: #10b981;
  color: white;
}

.status-archived {
  background: #f59e0b;
  color: white;
}

.status-unavailable {
  background: #ef4444;
  color: white;
}

/* Detail Sections */
.detail-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.detail-section {
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.section-icon {
  font-size: 1.25rem;
  color: #667eea;
}

.section-header h5 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
}

/* Field Rows */
.field-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  position: relative;
}

.field-row:last-child {
  margin-bottom: 0;
}

.field-label {
  flex-shrink: 0;
  width: 160px;
  font-weight: 500;
  color: #6b7280;
  padding-top: 8px;
}

.field-value {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  position: relative;
}

.field-edit {
  flex: 1;
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.field-edit .form-control,
.field-edit .form-select {
  flex: 1;
}

/* Values Display */
.description-text {
  margin: 0;
  line-height: 1.6;
  color: #374151;
  flex: 1;
}

.price-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.final-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: #059669;
}


.status-display {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 600;
}

/* Edit Buttons */
.edit-btn {
  background: white;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.edit-btn:hover {
  background: #667eea;
  border-color: #667eea;
  color: white;
  transform: scale(1.05);
}

/* Edit Actions */
.edit-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.save-btn {
  background: #10b981;
  color: white;
}

.save-btn:hover {
  background: #059669;
  transform: scale(1.05);
}

.cancel-btn {
  background: #ef4444;
  color: white;
}

.cancel-btn:hover {
  background: #dc2626;
  transform: scale(1.05);
}

/* Input Group */
.input-group {
  flex: 1;
  display: flex;
}

.input-group-text {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #6b7280;
  padding: 0.375rem 0.75rem;
}

/* Info Icon */
.info-icon {
  color: #9ca3af;
  font-size: 0.875rem;
  cursor: help;
}

/* Final Price Row */
.final-price-row {
  padding-top: 16px;
  border-top: 2px solid white;
  margin-top: 16px;
}

/* Modal Footer */
.modal-footer {
  padding: 20px 32px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: flex-end;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1060;
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
  transform: scale(0.9);
}

.modal-fade-leave-to .modal-container {
  transform: scale(0.9);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    margin: 10px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .product-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .field-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .field-label {
    width: 100%;
    padding-top: 0;
  }
}
</style>
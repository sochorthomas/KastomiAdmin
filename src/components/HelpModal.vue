<template>
  <Dialog
    v-model:visible="isVisible"
    :header="title"
    :modal="true"
    :dismissableMask="true"
    :draggable="false"
    :closeOnEscape="true"
    class="help-modal"
    :style="{ width: modalWidth }"
    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
  >
    <template #header>
      <div class="help-modal-header">
        <i :class="icon || 'pi pi-question-circle'" class="header-icon"></i>
        <span class="header-title">{{ title }}</span>
      </div>
    </template>

    <div class="help-modal-content">
      <!-- Introduction paragraph if provided -->
      <p v-if="introduction" class="introduction-text">
        {{ introduction }}
      </p>

      <!-- Custom content slot -->
      <slot name="content"></slot>

      <!-- Help items list if provided -->
      <div v-if="items && items.length > 0" class="help-items">
        <div v-for="item in items" :key="item.term" class="help-item">
          <div class="help-item-header">
            <span class="help-item-badge" :style="{ backgroundColor: item.color || '#6b7280' }">
              <i :class="item.icon" v-if="item.icon"></i>
            </span>
            <span class="help-item-term">{{ item.term }}</span>
          </div>
          <p class="help-item-description">{{ item.description }}</p>
        </div>
      </div>

      <!-- Default slot for any additional content -->
      <slot></slot>
    </div>

    <template #footer>
      <Button
        label="Rozumím"
        @click="closeModal"
        severity="primary"
        icon="pi pi-check"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Nápověda'
  },
  icon: {
    type: String,
    default: 'pi pi-question-circle'
  },
  introduction: {
    type: String,
    default: ''
  },
  items: {
    type: Array,
    default: () => []
  },
  modalWidth: {
    type: String,
    default: '50vw'
  }
})

const emit = defineEmits(['update:visible'])

const isVisible = ref(props.visible)

// Watch for changes in the visible prop
watch(() => props.visible, (newValue) => {
  isVisible.value = newValue
})

// Watch for changes in internal visibility
watch(isVisible, (newValue) => {
  emit('update:visible', newValue)
})

const closeModal = () => {
  isVisible.value = false
}
</script>

<style scoped>
/* Modal Header */
.help-modal :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px 12px 0 0;
}

.help-modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  font-size: 1.5rem;
  opacity: 0.9;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 600;
}

/* Modal Content */
.help-modal :deep(.p-dialog-content) {
  padding: 2rem;
  background: #ffffff;
}

.help-modal-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.introduction-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #4b5563;
  margin: 0;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

/* Help Items */
.help-items {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.help-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.help-item:hover {
  background: #ffffff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.help-item-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.help-item-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.help-item-badge i {
  font-size: 1rem;
}

.help-item-term {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.help-item-description {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #6b7280;
  padding-left: 44px; /* Align with term text */
}

/* Footer */
.help-modal :deep(.p-dialog-footer) {
  padding: 1.25rem 2rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 12px 12px;
}

/* Dialog overlay */
.help-modal :deep(.p-dialog) {
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: none;
}

.help-modal :deep(.p-dialog-header-close) {
  color: white;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.help-modal :deep(.p-dialog-header-close:hover) {
  opacity: 1;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .help-modal :deep(.p-dialog-header) {
    padding: 1.25rem;
  }

  .help-modal :deep(.p-dialog-content) {
    padding: 1.5rem;
  }

  .help-item-description {
    padding-left: 0;
    margin-top: 0.5rem;
  }
}
</style>
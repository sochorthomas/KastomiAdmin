<template>
  <div class="stat-card-mini" :class="variantClass">
    <div class="stat-icon">
      <i :class="icon"></i>
    </div>
    <div class="stat-content">
      <div v-if="loading" class="stat-value">
        <span class="loading-dots">...</span>
      </div>
      <template v-else>
        <div class="stat-value">
          <slot name="value">{{ formattedValue }}</slot>
          <span v-if="trend" class="stat-trend" :class="trendClass">
            <i :class="trendIcon"></i> {{ trend }}
          </span>
        </div>
      </template>
      <div class="stat-label">{{ label }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    default: '0'
  },
  label: {
    type: String,
    required: true
  },
  trend: {
    type: String,
    default: null
  },
  trendDirection: {
    type: String,
    default: 'up',
    validator: (value) => ['up', 'down'].includes(value)
  },
  loading: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'warning', 'danger', 'info'].includes(value)
  },
  format: {
    type: String,
    default: null,
    validator: (value) => ['number', 'currency', 'percentage', null].includes(value)
  }
})

const variantClass = computed(() => `stat-${props.variant}`)

const trendClass = computed(() => ({
  'trend-up': props.trendDirection === 'up',
  'trend-down': props.trendDirection === 'down'
}))

const trendIcon = computed(() =>
  props.trendDirection === 'up' ? 'fas fa-arrow-up' : 'fas fa-arrow-down'
)

const formattedValue = computed(() => {
  const value = props.value

  if (props.format === 'number') {
    return typeof value === 'number' ? value.toLocaleString('cs-CZ') : value
  }

  if (props.format === 'currency') {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(numValue) ? value : `${numValue.toLocaleString('cs-CZ')} Kč`
  }

  if (props.format === 'percentage') {
    return `${value}%`
  }

  return value
})
</script>

<style scoped>
.stat-card-mini {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-card-mini:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.stat-primary .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-success .stat-icon {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
}

.stat-warning .stat-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  color: white;
}

.stat-danger .stat-icon {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  color: white;
}

.stat-info .stat-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  color: white;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.125rem;
}

.stat-trend {
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.trend-up {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.trend-down {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.loading-dots {
  animation: pulse 1.5s ease-in-out infinite;
  color: #9ca3af;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@media (max-width: 768px) {
  .stat-card-mini {
    padding: 1rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}
</style>
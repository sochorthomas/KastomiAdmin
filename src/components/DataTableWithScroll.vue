<template>
  <div class="datatable-with-scroll">
    <div
      v-if="enableDualScroll && showTopScroll"
      ref="topScroll"
      class="dual-scroll-container"
      @scroll="syncScrollFromTop"
    >
      <div :style="{ width: scrollWidth + 'px', height: '1px' }"></div>
    </div>

    <DataTable
      ref="dataTable"
      v-bind="$attrs"
      :filterDisplay="filterDisplay"
      @vue:mounted="onTableMounted"
    >
      <template v-for="(_, slot) in $slots" :key="slot" #[slot]="slotProps">
        <slot :name="slot" v-bind="slotProps || {}" />
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const props = defineProps({
  enableDualScroll: {
    type: Boolean,
    default: true
  },
  filterDisplay: {
    type: String,
    default: 'row' // Enable row filtering by default
  }
})

const dataTable = ref(null)
const topScroll = ref(null)
const scrollWidth = ref(0)
const showTopScroll = ref(false)
const tableWrapper = ref(null)

let syncingScroll = false

const syncScrollFromTop = (e) => {
  if (syncingScroll || !tableWrapper.value) return
  syncingScroll = true
  tableWrapper.value.scrollLeft = e.target.scrollLeft
  requestAnimationFrame(() => {
    syncingScroll = false
  })
}

const syncScrollFromTable = (e) => {
  if (syncingScroll || !topScroll.value) return
  syncingScroll = true
  topScroll.value.scrollLeft = e.target.scrollLeft
  requestAnimationFrame(() => {
    syncingScroll = false
  })
}

const setupDualScroll = () => {
  if (!props.enableDualScroll) return

  nextTick(() => {
    setTimeout(() => {
      if (!dataTable.value?.$el) return

      const wrapper = dataTable.value.$el.querySelector('.p-datatable-table-container')
      if (!wrapper) return

      const table = wrapper.querySelector('table')
      if (!table) return

      tableWrapper.value = wrapper
      scrollWidth.value = table.scrollWidth

      // Check if horizontal scroll is needed
      showTopScroll.value = table.scrollWidth > wrapper.clientWidth

      if (showTopScroll.value) {
        wrapper.addEventListener('scroll', syncScrollFromTable)
      }
    }, 100)
  })
}

const onTableMounted = () => {
  setupDualScroll()
}

// Re-setup on data changes
watch(() => dataTable.value?.$el?.querySelector('table')?.scrollWidth, () => {
  setupDualScroll()
})

onMounted(() => {
  setupDualScroll()
})

onBeforeUnmount(() => {
  if (tableWrapper.value) {
    tableWrapper.value.removeEventListener('scroll', syncScrollFromTable)
  }
})

// Re-export DataTable instance for parent access
defineExpose({
  dataTable
})
</script>

<style scoped>
.datatable-with-scroll {
  position: relative;
}

.dual-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  margin-bottom: 0.5rem;
  height: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #f9fafb;
}

.dual-scroll-container::-webkit-scrollbar {
  height: 12px;
}

.dual-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.dual-scroll-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.dual-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
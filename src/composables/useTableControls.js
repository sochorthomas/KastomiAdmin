import { ref, computed, watch } from 'vue'

/**
 * Composable for table controls - filtering, searching, sorting
 * @param {Object} options - Configuration options
 * @param {Array} options.data - The data array to filter/search
 * @param {Array} options.searchFields - Fields to search in
 * @param {Object} options.initialFilters - Initial filter values
 * @param {String} options.storageKey - Key for localStorage persistence
 * @returns {Object} - Table control methods and reactive data
 */
export function useTableControls(options = {}) {
  const {
    data = ref([]),
    searchFields = [],
    initialFilters = {},
    storageKey = null
  } = options

  // State
  const globalFilter = ref('')
  const filters = ref({ ...initialFilters })
  const sortField = ref('')
  const sortOrder = ref(1) // 1 for asc, -1 for desc
  
  // Load saved filters from localStorage if storageKey provided
  if (storageKey) {
    const saved = localStorage.getItem(`tableControls_${storageKey}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.filters) filters.value = { ...filters.value, ...parsed.filters }
        if (parsed.globalFilter) globalFilter.value = parsed.globalFilter
        if (parsed.sortField) sortField.value = parsed.sortField
        if (parsed.sortOrder) sortOrder.value = parsed.sortOrder
      } catch (e) {
        console.error('Failed to load table controls from localStorage:', e)
      }
    }
  }

  // Save to localStorage when values change
  const saveToStorage = () => {
    if (storageKey) {
      localStorage.setItem(`tableControls_${storageKey}`, JSON.stringify({
        filters: filters.value,
        globalFilter: globalFilter.value,
        sortField: sortField.value,
        sortOrder: sortOrder.value
      }))
    }
  }

  watch([filters, globalFilter, sortField, sortOrder], saveToStorage, { deep: true })

  /**
   * Search function - checks if any of the specified fields contain the search term
   */
  const matchesGlobalFilter = (item, searchTerm) => {
    if (!searchTerm) return true
    
    const lowerSearch = searchTerm.toLowerCase()
    
    // If no specific search fields defined, search all string/number fields
    if (searchFields.length === 0) {
      return Object.values(item).some(value => {
        if (value === null || value === undefined) return false
        if (typeof value === 'object') {
          // For nested objects, check their values
          return Object.values(value).some(nestedValue => 
            String(nestedValue).toLowerCase().includes(lowerSearch)
          )
        }
        return String(value).toLowerCase().includes(lowerSearch)
      })
    }
    
    // Search only in specified fields
    return searchFields.some(field => {
      // Support nested fields with dot notation (e.g., 'user.name')
      const value = field.split('.').reduce((obj, key) => obj?.[key], item)
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(lowerSearch)
    })
  }

  /**
   * Filter function - applies all active filters
   */
  const matchesFilters = (item) => {
    return Object.entries(filters.value).every(([key, filterValue]) => {
      // Skip empty filters
      if (!filterValue || filterValue === '' || 
          (Array.isArray(filterValue) && filterValue.length === 0)) {
        return true
      }

      // Get the item value (support dot notation)
      const itemValue = key.split('.').reduce((obj, k) => obj?.[k], item)

      // Handle different filter types
      if (Array.isArray(filterValue)) {
        // Multi-select filter
        return filterValue.includes(itemValue)
      } else if (typeof filterValue === 'object' && filterValue !== null) {
        // Range filter (e.g., { min: 0, max: 100 })
        if ('min' in filterValue || 'max' in filterValue) {
          const numValue = Number(itemValue)
          if (isNaN(numValue)) return true
          if (filterValue.min !== undefined && numValue < filterValue.min) return false
          if (filterValue.max !== undefined && numValue > filterValue.max) return false
          return true
        }
        // Date range filter
        if ('from' in filterValue || 'to' in filterValue) {
          const dateValue = new Date(itemValue)
          if (filterValue.from && dateValue < new Date(filterValue.from)) return false
          if (filterValue.to && dateValue > new Date(filterValue.to)) return false
          return true
        }
      } else {
        // Simple equality filter
        return itemValue == filterValue
      }
      
      return true
    })
  }

  /**
   * Sort function
   */
  const sortData = (items) => {
    if (!sortField.value) return items
    
    return [...items].sort((a, b) => {
      // Get values (support dot notation)
      const aValue = sortField.value.split('.').reduce((obj, key) => obj?.[key], a)
      const bValue = sortField.value.split('.').reduce((obj, key) => obj?.[key], b)
      
      // Handle null/undefined
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      // Compare based on type
      let comparison = 0
      if (typeof aValue === 'string') {
        comparison = aValue.localeCompare(bValue, 'cs')
      } else if (typeof aValue === 'number') {
        comparison = aValue - bValue
      } else if (aValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else {
        comparison = String(aValue).localeCompare(String(bValue), 'cs')
      }
      
      return comparison * sortOrder.value
    })
  }

  /**
   * Filtered and sorted data
   */
  const filteredData = computed(() => {
    let result = data.value || []
    
    // Apply global search
    if (globalFilter.value) {
      result = result.filter(item => matchesGlobalFilter(item, globalFilter.value))
    }
    
    // Apply filters
    result = result.filter(matchesFilters)
    
    // Apply sorting
    result = sortData(result)
    
    return result
  })

  /**
   * Set a specific filter
   */
  const setFilter = (key, value) => {
    filters.value[key] = value
  }

  /**
   * Clear a specific filter
   */
  const clearFilter = (key) => {
    delete filters.value[key]
  }

  /**
   * Clear all filters
   */
  const clearAllFilters = () => {
    filters.value = { ...initialFilters }
    globalFilter.value = ''
  }

  /**
   * Toggle sort order or set new sort field
   */
  const toggleSort = (field) => {
    if (sortField.value === field) {
      // Toggle order if same field
      sortOrder.value = sortOrder.value * -1
    } else {
      // New field, default to ascending
      sortField.value = field
      sortOrder.value = 1
    }
  }

  /**
   * Get unique values for a field (useful for filter dropdowns)
   */
  const getUniqueValues = (field) => {
    const values = new Set()
    data.value.forEach(item => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], item)
      if (value !== null && value !== undefined) {
        values.add(value)
      }
    })
    return Array.from(values).sort((a, b) => {
      if (typeof a === 'string') return a.localeCompare(b, 'cs')
      return a - b
    })
  }

  /**
   * Export filtered data (useful for CSV export)
   */
  const exportData = () => {
    return filteredData.value
  }

  return {
    // State
    globalFilter,
    filters,
    sortField,
    sortOrder,
    
    // Computed
    filteredData,
    totalRecords: computed(() => data.value?.length || 0),
    filteredRecords: computed(() => filteredData.value.length),
    
    // Methods
    setFilter,
    clearFilter,
    clearAllFilters,
    toggleSort,
    getUniqueValues,
    exportData,
    
    // Direct filter access
    matchesGlobalFilter,
    matchesFilters
  }
}
/**
 * Order Status Mapping Utility
 * Maps detailed BOB order statuses to simplified admin view statuses
 */


// Simplified statuses for admin view
export const SIMPLIFIED_STATUSES = {
  ACTIVE: 'Aktivní',
  WAITING: 'Čekající',
  CANCELLED: 'Stornované',
  COMPLETED: 'Dokončené'
}

/**
 * Maps detailed status to simplified status for admin view
 * @param {string} detailedStatus - The detailed status from BOB
 * @returns {string} - Simplified status for admin view
 */
export function mapToSimplifiedStatus(detailedStatus) {
  const mapping = {
    // Active statuses
    'Aktivní': SIMPLIFIED_STATUSES.ACTIVE,
    'Aktivní - Budoucí': SIMPLIFIED_STATUSES.ACTIVE,
    
    // Waiting statuses
    'Čekající': SIMPLIFIED_STATUSES.WAITING,
    'Pozastavené': SIMPLIFIED_STATUSES.WAITING,
    'Pozastavené - Podezřelé': SIMPLIFIED_STATUSES.WAITING,
    'Pozastavené - Technický problém': SIMPLIFIED_STATUSES.WAITING,
    'Pozastavené - Nejasná objednávka': SIMPLIFIED_STATUSES.WAITING,
    
    // Completed status
    'Ukončené': SIMPLIFIED_STATUSES.COMPLETED,
    
    // Cancelled statuses
    'Stornované': SIMPLIFIED_STATUSES.CANCELLED,
    'Stornované - Zákazník zrušil': SIMPLIFIED_STATUSES.CANCELLED,
    'Stornované - Zákazník předčasně ukončil': SIMPLIFIED_STATUSES.CANCELLED,
    'Stornované - Vyloučení z klubu': SIMPLIFIED_STATUSES.CANCELLED,
    'Stornované - Neuhrazeno': SIMPLIFIED_STATUSES.CANCELLED,
    'Stornované - Testovací': SIMPLIFIED_STATUSES.CANCELLED,
    'Stornované - Technický problém': SIMPLIFIED_STATUSES.CANCELLED
  }
  
  return mapping[detailedStatus] || detailedStatus
}

/**
 * Gets all detailed statuses that map to a simplified status
 * @param {string} simplifiedStatus - The simplified status
 * @returns {string[]} - Array of detailed statuses
 */
export function getDetailedStatuses(simplifiedStatus) {
  const reverseMapping = {
    [SIMPLIFIED_STATUSES.ACTIVE]: [
      'Aktivní',
      'Aktivní - Budoucí'
    ],
    [SIMPLIFIED_STATUSES.WAITING]: [
      'Čekající',
      'Pozastavené',
      'Pozastavené - Podezřelé',
      'Pozastavené - Technický problém',
      'Pozastavené - Nejasná objednávka'
    ],
    [SIMPLIFIED_STATUSES.COMPLETED]: [
      'Ukončené'
    ],
    [SIMPLIFIED_STATUSES.CANCELLED]: [
      'Stornované',
      'Stornované - Zákazník zrušil',
      'Stornované - Zákazník předčasně ukončil',
      'Stornované - Vyloučení z klubu',
      'Stornované - Neuhrazeno',
      'Stornované - Testovací',
      'Stornované - Technický problém'
    ]
  }
  
  return reverseMapping[simplifiedStatus] || []
}

/**
 * Get status color/severity for PrimeVue components
 * @param {string} simplifiedStatus - The simplified status
 * @returns {string} - PrimeVue severity value
 */
export function getStatusSeverity(simplifiedStatus) {
  const severities = {
    [SIMPLIFIED_STATUSES.ACTIVE]: 'success',
    [SIMPLIFIED_STATUSES.WAITING]: 'warn',
    [SIMPLIFIED_STATUSES.CANCELLED]: 'danger',
    [SIMPLIFIED_STATUSES.COMPLETED]: 'info'
  }
  
  return severities[simplifiedStatus] || 'secondary'
}

/**
 * Get status icon for display
 * @param {string} simplifiedStatus - The simplified status
 * @returns {string} - PrimeIcons class
 */
export function getStatusIcon(simplifiedStatus) {
  const icons = {
    [SIMPLIFIED_STATUSES.ACTIVE]: 'pi pi-play-circle',
    [SIMPLIFIED_STATUSES.WAITING]: 'pi pi-clock',
    [SIMPLIFIED_STATUSES.CANCELLED]: 'pi pi-times-circle',
    [SIMPLIFIED_STATUSES.COMPLETED]: 'pi pi-check-circle'
  }
  
  return icons[simplifiedStatus] || 'pi pi-question-circle'
}

/**
 * Get additional info about the detailed status
 * @param {string} detailedStatus - The detailed status
 * @returns {object} - Object with simplified status and reason
 */
export function getStatusInfo(detailedStatus) {
  const simplified = mapToSimplifiedStatus(detailedStatus)
  
  // Extract reason from detailed status if it contains a dash
  let reason = null
  if (detailedStatus.includes(' - ')) {
    reason = detailedStatus.split(' - ')[1]
  }
  
  return {
    original: detailedStatus,
    simplified: simplified,
    reason: reason,
    severity: getStatusSeverity(simplified),
    icon: getStatusIcon(simplified)
  }
}

/**
 * Filter orders by simplified status
 * @param {array} orders - Array of orders with detailed statuses
 * @param {string} filterStatus - Simplified status to filter by (or empty for all)
 * @returns {array} - Filtered orders
 */
export function filterOrdersByStatus(orders, filterStatus) {
  if (!filterStatus) return orders
  
  const detailedStatuses = getDetailedStatuses(filterStatus)
  return orders.filter(order => detailedStatuses.includes(order.status))
}
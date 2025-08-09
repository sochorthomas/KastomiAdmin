/**
 * Sorts variants based on color, gender, and size
 * Format expected: "COLOR-GENDER-SIZE" or "COLOR-SIZE"
 * Examples: "Červená-D-M", "Modrá-M-XL", "Černá-L", "Modrá-7" (kids)
 * Kids sizes are identified by numeric sizes (3, 5, 7, 9, 11)
 */

// Define size order
const SIZE_ORDER = ['3', '5', '7', '9', '11', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']

// Kids sizes (numeric)
const KIDS_SIZES = ['3', '5', '7', '9', '11']

// Define gender order (D = Dámské/Women, M = Mužské/Men)
const GENDER_ORDER = ['D', 'M', null]

/**
 * Parse variant name into components
 * @param {string} variantName - The variant name to parse
 * @returns {object} - Object with color, gender, and size
 */
function parseVariantName(variantName) {
  if (!variantName) return { color: '', gender: null, size: '' }
  
  const parts = variantName.split('-')
  
  if (parts.length === 1) {
    // Just size or color
    return { color: parts[0], gender: null, size: '' }
  } else if (parts.length === 2) {
    // Color-Size format
    return { color: parts[0], gender: null, size: parts[1] }
  } else if (parts.length === 3) {
    // Color-Gender-Size format
    return { color: parts[0], gender: parts[1], size: parts[2] }
  } else {
    // More complex format, try to extract components
    const color = parts[0]
    const size = parts[parts.length - 1]
    
    // Check if second-to-last part is gender
    const possibleGender = parts[parts.length - 2]
    const gender = (possibleGender === 'D' || possibleGender === 'M') ? possibleGender : null
    
    return { color, gender, size }
  }
}

/**
 * Get sort index for size
 * @param {string} size - The size value
 * @returns {number} - Sort index (lower = earlier in sort)
 */
function getSizeIndex(size) {
  const index = SIZE_ORDER.indexOf(size)
  return index === -1 ? 999 : index // Unknown sizes go to the end
}

/**
 * Get sort index for gender
 * @param {string|null} gender - The gender value
 * @returns {number} - Sort index (lower = earlier in sort)
 */
function getGenderIndex(gender) {
  const index = GENDER_ORDER.indexOf(gender)
  return index === -1 ? 999 : index
}

/**
 * Check if a variant is a kids size
 * @param {object} variant - Parsed variant object
 * @returns {boolean} - True if it's a kids size
 */
function isKidsVariant(variant) {
  return KIDS_SIZES.includes(variant.size) && !variant.gender
}

/**
 * Compare two variants for sorting
 * @param {object} a - First variant
 * @param {object} b - Second variant
 * @returns {number} - Sort comparison result
 */
function compareVariants(a, b) {
  // Parse variant names
  const variantA = parseVariantName(a.variant || a.variant_name || a.name || '')
  const variantB = parseVariantName(b.variant || b.variant_name || b.name || '')
  
  // 1. Sort by color (alphabetically)
  if (variantA.color !== variantB.color) {
    return variantA.color.localeCompare(variantB.color, 'cs')
  }
  
  // 2. Sort by category: Kids → Women → Men
  const isKidsA = isKidsVariant(variantA)
  const isKidsB = isKidsVariant(variantB)
  
  // If one is kids and the other isn't, kids goes first
  if (isKidsA && !isKidsB) return -1
  if (!isKidsA && isKidsB) return 1
  
  // If neither is kids, sort by gender (D before M)
  if (!isKidsA && !isKidsB) {
    const genderDiff = getGenderIndex(variantA.gender) - getGenderIndex(variantB.gender)
    if (genderDiff !== 0) {
      return genderDiff
    }
  }
  
  // 3. Sort by size
  return getSizeIndex(variantA.size) - getSizeIndex(variantB.size)
}

/**
 * Sort variants array
 * @param {Array} variants - Array of variants to sort
 * @returns {Array} - Sorted array of variants
 */
export function sortVariants(variants) {
  if (!variants || !Array.isArray(variants)) return []
  
  // Create a copy to avoid mutating the original
  return [...variants].sort(compareVariants)
}

/**
 * Sort variants within each offer
 * @param {Array} offers - Array of offers with variants
 * @returns {Array} - Offers with sorted variants
 */
export function sortVariantsInOffers(offers) {
  if (!offers || !Array.isArray(offers)) return []
  
  return offers.map(offer => ({
    ...offer,
    variants: sortVariants(offer.variants)
  }))
}

// For debugging - expose parse function
export { parseVariantName, getSizeIndex, getGenderIndex }
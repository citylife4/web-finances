/**
 * Format a number as EUR currency (German locale).
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0
  }).format(amount)
}

/**
 * Format an ISO date string to a locale date.
 * @param {string} dateString
 * @returns {string}
 */
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString()
}

/**
 * Extract the string ID from an accountId field that may be
 * either a plain string or a populated Mongoose object.
 * @param {string|{_id: string}} accountId
 * @returns {string|undefined}
 */
export function extractId(accountId) {
  return typeof accountId === 'string' ? accountId : accountId?._id
}

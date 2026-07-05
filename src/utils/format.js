import { format } from 'date-fns'

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0
})

export const formatCurrency = (amount) => currencyFormatter.format(amount || 0)

// "2024-03" -> "March 2024"
export const formatMonth = (month) => format(new Date(month + '-01'), 'MMMM yyyy')

// "2024-03" -> "Mar 2024"
export const formatMonthShort = (month) => format(new Date(month + '-01'), 'MMM yyyy')

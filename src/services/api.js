import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Account API calls
export const accountsAPI = {
  // Get all accounts
  getAll: () => api.get('/accounts'),
  
  // Create a new account
  create: (accountData) => api.post('/accounts', accountData),
  
  // Update an account
  update: (id, accountData) => api.put(`/accounts/${id}`, accountData),
  
  // Delete an account
  delete: (id) => api.delete(`/accounts/${id}`)
}

// Monthly entries API calls
export const entriesAPI = {
  // Get all entries
  getAll: () => api.get('/entries'),
  
  // Get entries for a specific month
  getByMonth: (month) => api.get(`/entries/month/${month}`),
  
  // Create or update multiple entries
  createOrUpdate: (entries) => api.post('/entries', { entries }),
  
  // Update a single entry
  update: (id, entryData) => api.put(`/entries/${id}`, entryData),
  
  // Delete an entry
  delete: (id) => api.delete(`/entries/${id}`),
  
  // Get analytics totals
  getTotals: () => api.get('/entries/analytics/totals')
}

// Subcategory API calls
export const subcategoriesAPI = {
  // Get all subcategories
  getAll: () => api.get('/subcategories'),
  
  // Get subcategories by parent category
  getByParent: (parentCategory) => api.get(`/subcategories/${parentCategory}`),
  
  // Create a new subcategory
  create: (subcategoryData) => api.post('/subcategories', subcategoryData),
  
  // Update a subcategory
  update: (id, subcategoryData) => api.put(`/subcategories/${id}`, subcategoryData),
  
  // Delete a subcategory
  delete: (id) => api.delete(`/subcategories/${id}`)
}

// Health check
export const healthCheck = () => api.get('/health')

export default api

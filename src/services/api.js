import axios from 'axios'

// Use environment variable with fallback for local development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable cookies for refresh tokens
})

// Token management
let accessToken = localStorage.getItem('accessToken')

// Set access token
export const setAccessToken = (token) => {
  accessToken = token
  if (token) {
    localStorage.setItem('accessToken', token)
  } else {
    localStorage.removeItem('accessToken')
  }
}

// Get access token
export const getAccessToken = () => accessToken

// Request interceptor to add auth header
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for token refresh
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && 
        error.response?.data?.code === 'TOKEN_EXPIRED' && 
        !originalRequest._retry) {
      
      if (isRefreshing) {
        // Wait for the refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => Promise.reject(err))
      }
      
      originalRequest._retry = true
      isRefreshing = true
      
      try {
        const response = await api.post('/auth/refresh')
        const newToken = response.data.accessToken
        setAccessToken(newToken)
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        setAccessToken(null)
        // Redirect to login or emit event
        window.dispatchEvent(new CustomEvent('auth:logout'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    
    return Promise.reject(error)
  }
)

// Auth API calls
export const authAPI = {
  // Register new user
  register: (userData) => api.post('/auth/register', userData),
  
  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    if (response.data.accessToken) {
      setAccessToken(response.data.accessToken)
    }
    return response
  },
  
  // Refresh token
  refresh: () => api.post('/auth/refresh'),
  
  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout')
    setAccessToken(null)
    return response
  },
  
  // Logout from all devices
  logoutAll: async () => {
    const response = await api.post('/auth/logout-all')
    setAccessToken(null)
    return response
  },
  
  // Get current user
  me: () => api.get('/auth/me')
}

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
  createOrUpdate: (entries) => {
    console.log('📤 Sending entries to API:', entries)
    return api.post('/entries', { entries })
      .then(response => {
        console.log('✅ Entries saved successfully:', response.data)
        return response
      })
      .catch(error => {
        console.error('❌ Failed to save entries:', error.response?.data || error.message)
        throw error
      })
  },
  
  // Update a single entry
  update: (id, entryData) => api.put(`/entries/${id}`, entryData),
  
  // Delete an entry
  delete: (id) => api.delete(`/entries/${id}`),
  
  // Get analytics totals
  getTotals: () => api.get('/entries/analytics/totals')
}

// Category API calls
export const categoriesAPI = {
  // Get all categories
  getAll: () => api.get('/categories'),
  
  // Get categories by type
  getByType: (type) => api.get(`/categories/${type}`),
  
  // Create a new category
  create: (categoryData) => api.post('/categories', categoryData),
  
  // Update a category
  update: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  
  // Delete a category
  delete: (id) => api.delete(`/categories/${id}`)
}

// Health check
export const healthCheck = () => api.get('/health')

export default api

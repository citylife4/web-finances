import axios from 'axios'

// Use environment variable with fallback for local development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
})

let accessToken = localStorage.getItem('accessToken')

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
        window.dispatchEvent(new CustomEvent('auth:logout'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    if (response.data.accessToken) {
      setAccessToken(response.data.accessToken)
    }
    return response
  },
  
  refresh: () => api.post('/auth/refresh'),
  logout: async () => {
    const response = await api.post('/auth/logout')
    setAccessToken(null)
    return response
  },
  
  logoutAll: async () => {
    const response = await api.post('/auth/logout-all')
    setAccessToken(null)
    return response
  },
  
  me: () => api.get('/auth/me')
}

export const accountsAPI = {
  getAll: () => api.get('/accounts'),
  create: (accountData) => api.post('/accounts', accountData),
  update: (id, accountData) => api.put(`/accounts/${id}`, accountData),
  delete: (id) => api.delete(`/accounts/${id}`)
}

export const entriesAPI = {
  getAll: () => api.get('/entries'),
  getByMonth: (month) => api.get(`/entries/month/${month}`),
  createOrUpdate: (entries) => api.post('/entries', { entries }),
  update: (id, entryData) => api.put(`/entries/${id}`, entryData),
  delete: (id) => api.delete(`/entries/${id}`),
  getTotals: () => api.get('/entries/analytics/totals')
}

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getByTypeId: (typeId) => api.get(`/categories/type/${typeId}`),
  create: (categoryData) => api.post('/categories', categoryData),
  update: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  delete: (id) => api.delete(`/categories/${id}`)
}

export const categoryTypesAPI = {
  getAll: () => api.get('/category-types'),
  getById: (id) => api.get(`/category-types/${id}`),
  create: (typeData) => api.post('/category-types', typeData),
  update: (id, typeData) => api.put(`/category-types/${id}`, typeData),
  delete: (id) => api.delete(`/category-types/${id}`)
}

// Health check
export const healthCheck = () => api.get('/health')

export default api

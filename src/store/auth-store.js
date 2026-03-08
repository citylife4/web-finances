import { reactive } from 'vue'
import { authAPI, setAccessToken, getAccessToken } from '../services/api'
import { store } from './api-store'

const resetApplicationState = () => {
  store.reset()
}

export const authStore = reactive({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  // Initialize auth state from stored token
  async initialize() {
    const token = getAccessToken()
    if (token) {
      try {
        await this.loadUser()
      } catch (error) {
        console.error('Failed to load user:', error)
        this.logout()
      }
    }
  },

  // Load current user
  async loadUser() {
    try {
      const response = await authAPI.me()
      this.user = response.data.user
      this.isAuthenticated = true
      return response.data.user
    } catch (error) {
      this.user = null
      this.isAuthenticated = false
      throw error
    }
  },

  // Register new user
  async register(userData) {
    this.loading = true
    this.error = null
    try {
      const response = await authAPI.register(userData)
      if (response.data.accessToken) {
        setAccessToken(response.data.accessToken)
        this.user = response.data.user
        this.isAuthenticated = true
      }
      return response.data
    } catch (error) {
      this.error = error.response?.data?.error || 'Registration failed'
      throw error
    } finally {
      this.loading = false
    }
  },

  // Login user
  async login(credentials) {
    this.loading = true
    this.error = null
    try {
      const response = await authAPI.login(credentials)
      if (response.data.accessToken) {
        this.user = response.data.user
        this.isAuthenticated = true
      }
      return response.data
    } catch (error) {
      this.error = error.response?.data?.error || 'Login failed'
      throw error
    } finally {
      this.loading = false
    }
  },

  // Logout user
  async logout() {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setAccessToken(null)
      this.user = null
      this.isAuthenticated = false

      resetApplicationState()
    }
  },

  // Logout from all devices
  async logoutAll() {
    try {
      await authAPI.logoutAll()
    } catch (error) {
      console.error('Logout all error:', error)
    } finally {
      setAccessToken(null)
      this.user = null
      this.isAuthenticated = false

      resetApplicationState()
    }
  }
})

window.addEventListener('auth:logout', async () => {
  setAccessToken(null)
  authStore.user = null
  authStore.isAuthenticated = false
  resetApplicationState()
  window.location.href = '/login'
})

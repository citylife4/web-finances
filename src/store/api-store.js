import { reactive } from 'vue'
import { accountsAPI, entriesAPI, categoriesAPI } from '../services/api'

// Account types
export const ACCOUNT_TYPES = {
  DEPOSITS: 'deposits',
  INVESTMENTS: 'investments'
}

// Application store
export const store = reactive({
  accounts: [],
  monthlyEntries: [],
  categories: [],
  loading: false,
  error: null,
  
  // Set loading state
  setLoading(loading) {
    this.loading = loading
  },
  
  // Set error state
  setError(error) {
    this.error = error
    console.error('Store error:', error)
  },
  
  // Clear error
  clearError() {
    this.error = null
  },
  
  // Account management
  async loadAccounts() {
    try {
      this.setLoading(true)
      this.clearError()
      const response = await accountsAPI.getAll()
      this.accounts = response.data
    } catch (error) {
      this.setError('Failed to load accounts: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  },
  
  async addAccount(account) {
    try {
      this.setLoading(true)
      this.clearError()
      console.log('Adding account via API:', account)
      const response = await accountsAPI.create(account)
      console.log('Account created:', response.data)
      this.accounts.push(response.data)
      return response.data
    } catch (error) {
      this.setError('Failed to add account: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  },
  
  async updateAccount(id, updates) {
    try {
      this.setLoading(true)
      this.clearError()
      const response = await accountsAPI.update(id, updates)
      const index = this.accounts.findIndex(acc => acc._id === id)
      if (index !== -1) {
        this.accounts[index] = response.data
      }
      return response.data
    } catch (error) {
      this.setError('Failed to update account: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  },
  
  async deleteAccount(id) {
    try {
      this.setLoading(true)
      this.clearError()
      await accountsAPI.delete(id)
      this.accounts = this.accounts.filter(acc => acc._id !== id)
      // Also remove related entries from local state
      this.monthlyEntries = this.monthlyEntries.filter(entry => entry.accountId._id !== id)
    } catch (error) {
      this.setError('Failed to delete account: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  },
  
  // Monthly entries management
  async loadEntries() {
    try {
      this.setLoading(true)
      this.clearError()
      const response = await entriesAPI.getAll()
      this.monthlyEntries = response.data
    } catch (error) {
      this.setError('Failed to load entries: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  },
  
  async loadEntriesByMonth(month) {
    try {
      this.setLoading(true)
      this.clearError()
      const response = await entriesAPI.getByMonth(month)
      return response.data
    } catch (error) {
      this.setError('Failed to load entries for month: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  },
  
  async saveMonthlyEntries(entries) {
    try {
      this.setLoading(true)
      this.clearError()
      const response = await entriesAPI.createOrUpdate(entries)
      // Reload entries to get updated data
      await this.loadEntries()
      return response.data
    } catch (error) {
      this.setError('Failed to save entries: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  },
  
  async deleteMonthlyEntry(id) {
    try {
      this.setLoading(true)
      this.clearError()
      await entriesAPI.delete(id)
      this.monthlyEntries = this.monthlyEntries.filter(entry => entry._id !== id)
    } catch (error) {
      this.setError('Failed to delete entry: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  },
  
  // Data analysis
  getTotalByType(type, month = null) {
    const relevantAccounts = this.accounts.filter(acc => acc.type === type)
    
    if (!month) {
      // Get latest values
      return relevantAccounts.reduce((total, account) => {
        const latestEntry = this.monthlyEntries
          .filter(entry => {
            const entryAccountId = typeof entry.accountId === 'string' ? entry.accountId : entry.accountId._id
            return entryAccountId === account._id
          })
          .sort((a, b) => new Date(b.month) - new Date(a.month))[0]
        
        return total + (latestEntry ? latestEntry.amount : 0)
      }, 0)
    }
    
    // Get values for specific month
    return relevantAccounts.reduce((total, account) => {
      const entry = this.monthlyEntries.find(
        entry => {
          const entryAccountId = typeof entry.accountId === 'string' ? entry.accountId : entry.accountId._id
          return entryAccountId === account._id && entry.month === month
        }
      )
      return total + (entry ? entry.amount : 0)
    }, 0)
  },
  
  async getMonthlyTotals() {
    try {
      const response = await entriesAPI.getTotals()
      return response.data
    } catch (error) {
      this.setError('Failed to get monthly totals: ' + error.message)
      throw error
    }
  },
  
  // Initialize store
  async initialize() {
    try {
      await Promise.all([
        this.loadAccounts(),
        this.loadEntries(),
        this.loadCategories()
      ])
    } catch (error) {
      this.setError('Failed to initialize application: ' + error.message)
    }
  },

  // Category management
  async loadCategories() {
    try {
      this.setLoading(true)
      this.clearError()
      const response = await categoriesAPI.getAll()
      this.categories = response.data
    } catch (error) {
      this.setError('Failed to load categories: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  },

  async addCategory(category) {
    try {
      this.setLoading(true)
      this.clearError()
      const response = await categoriesAPI.create(category)
      this.categories.push(response.data)
      return response.data
    } catch (error) {
      this.setError('Failed to add category: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  },

  async updateCategory(id, updates) {
    try {
      this.setLoading(true)
      this.clearError()
      const response = await categoriesAPI.update(id, updates)
      const index = this.categories.findIndex(cat => cat._id === id)
      if (index !== -1) {
        this.categories[index] = response.data
      }
      return response.data
    } catch (error) {
      this.setError('Failed to update category: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  },

  async deleteCategory(id) {
    try {
      this.setLoading(true)
      this.clearError()
      await categoriesAPI.delete(id)
      this.categories = this.categories.filter(cat => cat._id !== id)
    } catch (error) {
      this.setError('Failed to delete category: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  },

  getCategoriesByType(type) {
    return this.categories.filter(cat => cat.type === type)
  }
})

// Note: Don't auto-initialize here to avoid race conditions
// Call store.initialize() from App.vue or main.js after Vue app is mounted

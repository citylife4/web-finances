import { reactive } from 'vue'
import { accountsAPI, entriesAPI, categoriesAPI, categoryTypesAPI } from '../services/api'
import { extractId } from '../utils/formatters'

export const store = reactive({
  accounts: [],
  monthlyEntries: [],
  categories: [],
  categoryTypes: [],
  loading: false,
  error: null,
  initialized: false,
  
  setLoading(loading) {
    this.loading = loading
  },
  
  setError(error) {
    this.error = error
  },
  
  clearError() {
    this.error = null
  },

  reset() {
    this.accounts = []
    this.monthlyEntries = []
    this.categories = []
    this.categoryTypes = []
    this.loading = false
    this.error = null
    this.initialized = false
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
      const response = await accountsAPI.create(account)
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
      this.monthlyEntries = this.monthlyEntries.filter(entry => extractId(entry.accountId) !== id)
    } catch (error) {
      this.setError('Failed to delete account: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  },
  
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
  
  async getMonthlyTotals() {
    try {
      const response = await entriesAPI.getTotals()
      return response.data
    } catch (error) {
      this.setError('Failed to get monthly totals: ' + error.message)
      throw error
    }
  },
  
  async initialize() {
    if (this.initialized) return
    try {
      await Promise.all([
        this.loadCategoryTypes(),
        this.loadAccounts(),
        this.loadEntries(),
        this.loadCategories()
      ])
      this.initialized = true
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
  },

  getCategoriesByTypeId(typeId) {
    return this.categories.filter(cat => {
      const catTypeId = typeof cat.typeId === 'string' ? cat.typeId : cat.typeId?._id
      return catTypeId === typeId
    })
  },

  async loadCategoryTypes() {
    try {
      this.setLoading(true)
      this.clearError()
      const response = await categoryTypesAPI.getAll()
      this.categoryTypes = response.data
    } catch (error) {
      this.setError('Failed to load category types: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  },

  async addCategoryType(categoryType) {
    try {
      this.setLoading(true)
      this.clearError()
      const response = await categoryTypesAPI.create(categoryType)
      this.categoryTypes.push(response.data)
      return response.data
    } catch (error) {
      this.setError('Failed to add category type: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  },

  async updateCategoryType(id, updates) {
    try {
      this.setLoading(true)
      this.clearError()
      const response = await categoryTypesAPI.update(id, updates)
      const index = this.categoryTypes.findIndex(type => type._id === id)
      if (index !== -1) {
        this.categoryTypes[index] = response.data
      }
      return response.data
    } catch (error) {
      this.setError('Failed to update category type: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  },

  async deleteCategoryType(id) {
    try {
      this.setLoading(true)
      this.clearError()
      await categoryTypesAPI.delete(id)
      this.categoryTypes = this.categoryTypes.filter(type => type._id !== id)
    } catch (error) {
      this.setError('Failed to delete category type: ' + error.message)
      throw error
    } finally {
      this.setLoading(false)
    }
  }
})

// Note: Don't auto-initialize here to avoid race conditions
// Call store.initialize() from App.vue or main.js after Vue app is mounted

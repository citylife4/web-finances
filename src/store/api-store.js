import { reactive } from 'vue'
import { accountsAPI, entriesAPI } from '../services/api'

// Account types and categories
export const ACCOUNT_TYPES = {
  DEPOSITS: 'deposits',
  INVESTMENTS: 'investments'
}

export const DEPOSIT_CATEGORIES = [
  'Checking Account',
  'Savings Account',
  'Money Market',
  'Certificate of Deposit (CD)',
  'High Yield Savings'
]

export const INVESTMENT_CATEGORIES = [
  'Stock Portfolio',
  'Mutual Funds',
  'ETFs',
  'Bonds',
  '401(k)',
  'IRA',
  'Roth IRA',
  'Crypto',
  'Real Estate'
]

// Application store
export const store = reactive({
  accounts: [],
  monthlyEntries: [],
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
          .filter(entry => entry.accountId._id === account._id)
          .sort((a, b) => new Date(b.month) - new Date(a.month))[0]
        
        return total + (latestEntry ? latestEntry.amount : 0)
      }, 0)
    }
    
    // Get values for specific month
    return relevantAccounts.reduce((total, account) => {
      const entry = this.monthlyEntries.find(
        entry => entry.accountId._id === account._id && entry.month === month
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
        this.loadEntries()
      ])
    } catch (error) {
      this.setError('Failed to initialize application: ' + error.message)
    }
  }
})

// Initialize store on load
store.initialize()

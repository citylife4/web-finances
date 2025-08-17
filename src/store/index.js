import { reactive } from 'vue'

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
  
  // Account management
  addAccount(account) {
    console.log('Store addAccount called with:', account)
    const id = Date.now().toString()
    const newAccount = {
      id,
      ...account,
      createdAt: new Date().toISOString()
    }
    console.log('Creating account:', newAccount)
    this.accounts.push(newAccount)
    console.log('Accounts after push:', this.accounts)
    this.saveToLocalStorage()
    console.log('Account saved to localStorage')
  },
  
  updateAccount(id, updates) {
    const index = this.accounts.findIndex(acc => acc.id === id)
    if (index !== -1) {
      this.accounts[index] = { ...this.accounts[index], ...updates }
      this.saveToLocalStorage()
    }
  },
  
  deleteAccount(id) {
    this.accounts = this.accounts.filter(acc => acc.id !== id)
    // Also remove related entries
    this.monthlyEntries = this.monthlyEntries.filter(entry => entry.accountId !== id)
    this.saveToLocalStorage()
  },
  
  // Monthly entries management
  addMonthlyEntry(entry) {
    const id = Date.now().toString()
    this.monthlyEntries.push({
      id,
      ...entry,
      createdAt: new Date().toISOString()
    })
    this.saveToLocalStorage()
  },
  
  updateMonthlyEntry(id, updates) {
    const index = this.monthlyEntries.findIndex(entry => entry.id === id)
    if (index !== -1) {
      this.monthlyEntries[index] = { ...this.monthlyEntries[index], ...updates }
      this.saveToLocalStorage()
    }
  },
  
  deleteMonthlyEntry(id) {
    this.monthlyEntries = this.monthlyEntries.filter(entry => entry.id !== id)
    this.saveToLocalStorage()
  },
  
  // Data analysis
  getTotalByType(type, month = null) {
    const relevantAccounts = this.accounts.filter(acc => acc.type === type)
    
    if (!month) {
      // Get latest values
      return relevantAccounts.reduce((total, account) => {
        const latestEntry = this.monthlyEntries
          .filter(entry => entry.accountId === account.id)
          .sort((a, b) => new Date(b.month) - new Date(a.month))[0]
        
        return total + (latestEntry ? latestEntry.amount : 0)
      }, 0)
    }
    
    // Get values for specific month
    return relevantAccounts.reduce((total, account) => {
      const entry = this.monthlyEntries.find(
        entry => entry.accountId === account.id && entry.month === month
      )
      return total + (entry ? entry.amount : 0)
    }, 0)
  },
  
  getMonthlyTotals() {
    const months = [...new Set(this.monthlyEntries.map(entry => entry.month))].sort()
    
    return months.map(month => ({
      month,
      deposits: this.getTotalByType(ACCOUNT_TYPES.DEPOSITS, month),
      investments: this.getTotalByType(ACCOUNT_TYPES.INVESTMENTS, month),
      total: this.getTotalByType(ACCOUNT_TYPES.DEPOSITS, month) + 
             this.getTotalByType(ACCOUNT_TYPES.INVESTMENTS, month)
    }))
  },
  
  // Persistence
  saveToLocalStorage() {
    localStorage.setItem('financeData', JSON.stringify({
      accounts: this.accounts,
      monthlyEntries: this.monthlyEntries
    }))
  },
  
  loadFromLocalStorage() {
    const data = localStorage.getItem('financeData')
    if (data) {
      const parsed = JSON.parse(data)
      this.accounts = parsed.accounts || []
      this.monthlyEntries = parsed.monthlyEntries || []
    }
  }
})

// Load data on app start
store.loadFromLocalStorage()

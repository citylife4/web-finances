<template>
  <div class="monthly-entry">
    <div class="page-header">
      <h2>Monthly Entry</h2>
      <p class="subtitle">Record your account balances for this month</p>
    </div>

    <div v-if="store.accounts.length === 0" class="no-accounts-warning">
      <div class="warning-card">
        <h3>⚠️ No Accounts Found</h3>
        <p>You need to add some accounts before you can record monthly entries.</p>
        <router-link to="/accounts" class="btn btn-primary">Add Accounts</router-link>
      </div>
    </div>

    <div v-else class="entry-form-container">
      <!-- Month Selection -->
      <div class="month-selection">
        <h3>Select Month</h3>
        <div class="month-inputs">
          <input
            v-model="selectedMonth"
            type="month"
            class="month-input"
            :max="currentMonth"
          />
          <button @click="loadExistingEntries" class="btn btn-secondary">
            Load Existing Entries
          </button>
        </div>
        <p class="month-help">
          Select the month for which you want to record or update account balances
        </p>
      </div>

      <!-- Entry Form -->
      <div class="entry-forms">
        <h3>Account Balances for {{ formatSelectedMonth }}</h3>
        
        <!-- Deposit Accounts -->
        <div v-if="depositAccounts.length > 0" class="account-section">
          <h4 class="section-title deposits">💳 Deposit Accounts</h4>
          <div class="accounts-grid">
            <div
              v-for="account in depositAccounts"
              :key="account._id"
              class="account-entry deposits"
            >
              <div class="account-info">
                <h5>{{ account.name }}</h5>
                <p class="account-category">{{ account.categoryId?.name || '' }}</p>
              </div>
              <div class="amount-input">
                <label :for="`amount-${account._id}`">Amount (€)</label>
                <input
                  :id="`amount-${account._id}`"
                  v-model.number="accountValues[account._id]"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>
              <div class="previous-value" v-if="getPreviousValue(account._id)">
                Previous: {{ formatCurrency(getPreviousValue(account._id)) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Investment Accounts -->
        <div v-if="investmentAccounts.length > 0" class="account-section">
          <h4 class="section-title investments">📈 Investment Accounts</h4>
          <div class="accounts-grid">
            <div
              v-for="account in investmentAccounts"
              :key="account._id"
              class="account-entry investments"
            >
              <div class="account-info">
                <h5>{{ account.name }}</h5>
                <p class="account-category">{{ account.categoryId?.name || '' }}</p>
              </div>
              <div class="amount-input">
                <label :for="`amount-${account._id}`">Amount (€)</label>
                <input
                  :id="`amount-${account._id}`"
                  v-model.number="accountValues[account._id]"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>
              <div class="previous-value" v-if="getPreviousValue(account._id)">
                Previous: {{ formatCurrency(getPreviousValue(account._id)) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="entry-summary">
          <h4>Summary for {{ formatSelectedMonth }}</h4>
          <div class="summary-grid">
            <div class="summary-item deposits">
              <span class="label">Total Deposits:</span>
              <span class="value">{{ formatCurrency(totalDepositsEntry) }}</span>
            </div>
            <div class="summary-item investments">
              <span class="label">Total Investments:</span>
              <span class="value">{{ formatCurrency(totalInvestmentsEntry) }}</span>
            </div>
            <div class="summary-item total">
              <span class="label">Total Net Worth:</span>
              <span class="value">{{ formatCurrency(totalNetWorthEntry) }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="form-actions">
          <button @click="clearForm" class="btn btn-secondary">Clear All</button>
          <button @click="saveEntries" class="btn btn-primary" :disabled="!hasAnyValue">
            Save Entries
          </button>
        </div>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="showSuccessMessage" class="success-message">
      ✅ Entries saved successfully!
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { store, ACCOUNT_TYPES } from '../store/api-store'
import { format } from 'date-fns'

export default {
  name: 'MonthlyEntry',
  setup() {
    const selectedMonth = ref(new Date().toISOString().slice(0, 7)) // YYYY-MM format
    const accountValues = ref({})
    const showSuccessMessage = ref(false)

    const currentMonth = new Date().toISOString().slice(0, 7)

    const depositAccounts = computed(() => 
      store.accounts.filter(acc => acc.type === ACCOUNT_TYPES.DEPOSITS)
    )

    const investmentAccounts = computed(() => 
      store.accounts.filter(acc => acc.type === ACCOUNT_TYPES.INVESTMENTS)
    )

    const formatSelectedMonth = computed(() => {
      if (!selectedMonth.value) return ''
      return format(new Date(selectedMonth.value + '-01'), 'MMMM yyyy')
    })

    const totalDepositsEntry = computed(() => {
      return depositAccounts.value.reduce((total, account) => {
        return total + (accountValues.value[account._id] || 0)
      }, 0)
    })

    const totalInvestmentsEntry = computed(() => {
      return investmentAccounts.value.reduce((total, account) => {
        return total + (accountValues.value[account._id] || 0)
      }, 0)
    })

    const totalNetWorthEntry = computed(() => {
      return totalDepositsEntry.value + totalInvestmentsEntry.value
    })

    const hasAnyValue = computed(() => {
      return Object.values(accountValues.value).some(value => value && value > 0)
    })

    const initializeAccountValues = () => {
      const values = {}
      store.accounts.forEach(account => {
        values[account._id] = 0
      })
      accountValues.value = values
    }

    const loadExistingEntries = async () => {
      if (!selectedMonth.value) return

      initializeAccountValues()

      try {
        const existingEntries = await store.loadEntriesByMonth(selectedMonth.value)
        existingEntries.forEach(entry => {
          const accountId = typeof entry.accountId === 'string' ? entry.accountId : entry.accountId._id
          accountValues.value[accountId] = entry.amount
        })
      } catch (error) {
        console.error('Failed to load existing entries:', error)
      }
    }

    const getPreviousValue = (accountId) => {
      const entries = store.monthlyEntries
        .filter(entry => {
          const entryAccountId = typeof entry.accountId === 'string' ? entry.accountId : entry.accountId._id
          return entryAccountId === accountId && entry.month < selectedMonth.value
        })
        .sort((a, b) => new Date(b.month) - new Date(a.month))
      
      return entries.length > 0 ? entries[0].amount : null
    }

    const saveEntries = async () => {
      if (!selectedMonth.value || !hasAnyValue.value) return

      try {
        // Prepare entries for API
        const entries = Object.entries(accountValues.value)
          .filter(([accountId, amount]) => amount && amount > 0)
          .map(([accountId, amount]) => ({
            accountId,
            month: selectedMonth.value,
            amount: parseFloat(amount)
          }))

        await store.saveMonthlyEntries(entries)
        
        // Show success message
        showSuccessMessage.value = true
        setTimeout(() => {
          showSuccessMessage.value = false
        }, 3000)
      } catch (error) {
        console.error('Failed to save entries:', error)
        alert('Failed to save entries. Please try again.')
      }
    }

    const clearForm = () => {
      initializeAccountValues()
    }

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(amount)
    }

    // Watch for month changes to load existing entries
    watch(selectedMonth, () => {
      loadExistingEntries()
    })

    // Initialize on component mount
    initializeAccountValues()
    loadExistingEntries()

    return {
      store,
      selectedMonth,
      currentMonth,
      accountValues,
      showSuccessMessage,
      depositAccounts,
      investmentAccounts,
      formatSelectedMonth,
      totalDepositsEntry,
      totalInvestmentsEntry,
      totalNetWorthEntry,
      hasAnyValue,
      loadExistingEntries,
      getPreviousValue,
      saveEntries,
      clearForm,
      formatCurrency
    }
  }
}
</script>

<style scoped>
.monthly-entry {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-header h2 {
  margin: 0;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #666;
  margin-top: 0.5rem;
}

.no-accounts-warning {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.warning-card {
  background: white;
  border-radius: 15px;
  padding: 3rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  text-align: center;
  max-width: 400px;
}

.warning-card h3 {
  margin-top: 0;
  color: #f39c12;
}

.entry-form-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.month-selection {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.month-selection h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
}

.month-inputs {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.month-input {
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 200px;
}

.month-input:focus {
  outline: none;
  border-color: #667eea;
}

.month-help {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.entry-forms {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.entry-forms h3 {
  margin-top: 0;
  margin-bottom: 2rem;
  color: #333;
}

.account-section {
  margin-bottom: 2rem;
}

.section-title {
  margin: 0 0 1rem 0;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: white;
  font-size: 1.1rem;
}

.section-title.deposits {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.section-title.investments {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.account-entry {
  padding: 1.5rem;
  border-radius: 10px;
  border-left: 4px solid;
  background: #f8f9fa;
}

.account-entry.deposits {
  border-left-color: #f093fb;
}

.account-entry.investments {
  border-left-color: #4facfe;
}

.account-info {
  margin-bottom: 1rem;
}

.account-info h5 {
  margin: 0 0 0.25rem 0;
  color: #333;
  font-size: 1.1rem;
}

.account-category {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.amount-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.amount-input label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.amount-input input {
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
}

.amount-input input:focus {
  outline: none;
  border-color: #667eea;
}

.previous-value {
  color: #666;
  font-size: 0.8rem;
  font-style: italic;
}

.entry-summary {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 10px;
  padding: 1.5rem;
  margin: 2rem 0;
}

.entry-summary h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background: white;
  border-left: 4px solid;
}

.summary-item.deposits {
  border-left-color: #f093fb;
}

.summary-item.investments {
  border-left-color: #4facfe;
}

.summary-item.total {
  border-left-color: #667eea;
}

.summary-item .label {
  font-weight: 600;
  color: #333;
}

.summary-item .value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #28a745;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.success-message {
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: #28a745;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .monthly-entry {
    padding: 1rem;
  }
  
  .page-header h2 {
    font-size: 2rem;
  }
  
  .accounts-grid {
    grid-template-columns: 1fr;
  }
  
  .month-inputs {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>

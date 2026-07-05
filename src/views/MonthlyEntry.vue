<template>
  <div class="monthly-entry page">
    <div class="page-header">
      <h2>Monthly Entry</h2>
      <p class="subtitle">Record your account balances for this month</p>
    </div>

    <div v-if="store.loading || store.categoryTypes.length === 0" class="loading-state">
      <div class="loading-card">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    </div>

    <div v-else-if="store.accounts.length === 0" class="no-accounts-warning">
      <div class="warning-card panel">
        <h3>⚠️ No Accounts Found</h3>
        <p>You need to add some accounts before you can record monthly entries.</p>
        <router-link to="/accounts" class="btn btn-primary">Add Accounts</router-link>
      </div>
    </div>

    <div v-else class="entry-form-container">
      <!-- Month Selection -->
      <div class="month-selection panel">
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
      <div class="entry-forms panel">
        <h3>Account Balances for {{ formatSelectedMonth }}</h3>
        
        <!-- Dynamic Account Type Sections -->
        <template v-for="(group, typeId) in accountsByType" :key="typeId">
          <div
            v-if="group && group.accounts && group.accounts.length > 0"
            class="account-section"
          >
            <h4 class="section-title" :style="{ borderLeftColor: group.type.color }">
              {{ group.type.icon }} {{ group.type.displayName }} Accounts
            </h4>
            <div class="accounts-grid">
              <div
                v-for="account in group.accounts"
                :key="account._id"
                class="account-entry"
                :style="{ borderLeftColor: group.type.color }"
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
                    placeholder="0.00"
                  />
                </div>
                <div class="previous-value" v-if="getPreviousValue(account._id)">
                  Previous: {{ formatCurrency(getPreviousValue(account._id)) }}
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Summary -->
        <div class="entry-summary">
          <h4>Summary for {{ formatSelectedMonth }}</h4>
          <div class="summary-grid">
            <template v-for="(group, typeId) in accountsByType" :key="typeId">
              <div
                v-if="group && group.accounts && group.accounts.length > 0"
                class="summary-item"
                :style="{ borderLeftColor: group.type.color }"
              >
                <span class="label">Total {{ group.type.displayName }}:</span>
                <span class="value">{{ formatCurrency(getTotalByType(typeId)) }}</span>
              </div>
            </template>
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
import { ref, computed, watch, onMounted } from 'vue'
import { store, idOf } from '../store/api-store'
import { formatCurrency, formatMonth } from '../utils/format'

export default {
  name: 'MonthlyEntry',
  setup() {
    const selectedMonth = ref(new Date().toISOString().slice(0, 7)) // YYYY-MM format
    const accountValues = ref({})
    const showSuccessMessage = ref(false)

    const currentMonth = new Date().toISOString().slice(0, 7)

    // Dynamic account groupings by type
    const accountsByType = computed(() => {
      if (!store.categoryTypes || store.categoryTypes.length === 0) {
        return {}
      }
      const grouped = {}
      store.categoryTypes.forEach(type => {
        if (type && type._id) {
          grouped[type._id] = {
            type: type,
            accounts: (store.accounts || []).filter(acc => idOf(acc.typeId) === type._id)
          }
        }
      })
      return grouped
    })

    const formatSelectedMonth = computed(() => {
      if (!selectedMonth.value) return ''
      return formatMonth(selectedMonth.value)
    })

    // Calculate totals by type
    // An input counts as filled in when it holds any number (0 and negatives
    // are valid balances - think credit cards or loans)
    const isFilled = (value) => value !== '' && value !== null && value !== undefined && !isNaN(Number(value))

    const getTotalByType = (typeId) => {
      const group = accountsByType.value[typeId]
      if (!group) return 0
      return group.accounts.reduce((total, account) => {
        const value = accountValues.value[account._id]
        return total + (isFilled(value) ? Number(value) : 0)
      }, 0)
    }

    const totalNetWorthEntry = computed(() => {
      if (!store.accounts || store.accounts.length === 0) return 0
      return store.accounts.reduce((total, account) => {
        const value = accountValues.value[account._id]
        return total + (isFilled(value) ? Number(value) : 0)
      }, 0)
    })

    const hasAnyValue = computed(() => {
      return Object.values(accountValues.value).some(isFilled)
    })

    const initializeAccountValues = () => {
      const values = {}
      if (store.accounts && store.accounts.length > 0) {
        store.accounts.forEach(account => {
          values[account._id] = ''
        })
      }
      accountValues.value = values
    }

    const loadExistingEntries = async () => {
      if (!selectedMonth.value) return

      initializeAccountValues()

      try {
        const existingEntries = await store.loadEntriesByMonth(selectedMonth.value)
        existingEntries.forEach(entry => {
          accountValues.value[idOf(entry.accountId)] = entry.amount
        })
      } catch (error) {
        console.error('Failed to load existing entries:', error)
      }
    }

    const getPreviousValue = (accountId) => {
      const entries = store.monthlyEntries
        .filter(entry => idOf(entry.accountId) === accountId && entry.month < selectedMonth.value)
        .sort((a, b) => new Date(b.month) - new Date(a.month))

      return entries.length > 0 ? entries[0].amount : null
    }

    const saveEntries = async () => {
      if (!selectedMonth.value || !hasAnyValue.value) return

      try {
        // Prepare entries for API - only accounts with a value entered
        const entries = Object.entries(accountValues.value)
          .filter(([, amount]) => isFilled(amount))
          .map(([accountId, amount]) => ({
            accountId,
            month: selectedMonth.value,
            amount: Number(amount)
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

    // Watch for month changes to load existing entries
    watch(selectedMonth, () => {
      loadExistingEntries()
    })

    // Reload data on component mount to ensure fresh data
    onMounted(async () => {
      try {
        // Reload category types, accounts, and categories to get latest changes
        await Promise.all([
          store.loadCategoryTypes(),
          store.loadAccounts(),
          store.loadCategories()
        ])
        // Initialize form after data is loaded
        initializeAccountValues()
        loadExistingEntries()
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    })

    return {
      store,
      selectedMonth,
      currentMonth,
      accountValues,
      showSuccessMessage,
      accountsByType,
      formatSelectedMonth,
      getTotalByType,
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
.no-accounts-warning,
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.loading-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.warning-card {
  text-align: center;
  max-width: 400px;
}

.warning-card h3 {
  color: #b45309;
}

.entry-form-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.month-inputs {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.month-input {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-family: inherit;
  min-width: 200px;
}

.month-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(91, 110, 232, 0.15);
}

.month-help {
  color: var(--color-text-muted);
  font-size: 0.88rem;
  margin: 0;
}

.account-section {
  margin-bottom: 1.5rem;
}

.section-title {
  margin: 0 0 0.85rem 0;
  padding: 0.6rem 1rem;
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--color-primary);
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 600;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.account-entry {
  padding: 1.1rem 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  background: var(--color-surface);
}

.account-info {
  margin-bottom: 0.75rem;
}

.account-info h5 {
  margin: 0 0 0.2rem 0;
  color: var(--color-text);
  font-size: 1rem;
}

.account-category {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.amount-input {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
}

.amount-input label {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.85rem;
}

.amount-input input {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-family: inherit;
}

.amount-input input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(91, 110, 232, 0.15);
}

.previous-value {
  color: var(--color-text-soft);
  font-size: 0.8rem;
  font-style: italic;
}

.entry-summary {
  background: var(--color-surface-muted);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  margin: 1.5rem 0;
}

.entry-summary h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-text);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.85rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
}

.summary-item .label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text);
}

.summary-item .value {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-success);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.success-message {
  position: fixed;
  top: 4.5rem;
  right: 1.5rem;
  background: var(--color-success);
  color: white;
  padding: 0.85rem 1.25rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  animation: slideIn 0.25s ease-out;
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

<template>
  <div class="account-manager page">
    <div class="page-header">
      <h2>Manage Accounts</h2>
      <p class="subtitle">Add and organize your deposit and investment accounts</p>
    </div>

    <!-- Add Account Form -->
    <div class="add-account-section panel">
      <h3>Add New Account</h3>
      <form @submit.prevent="addAccount" class="account-form">
        <div class="form-row">
          <div class="form-group">
            <label for="accountName">Account Name</label>
            <input
              id="accountName"
              v-model="newAccount.name"
              type="text"
              placeholder="e.g., Chase Checking, Vanguard 401k"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="accountType">Account Type</label>
            <select 
              id="accountType" 
              v-model="newAccount.typeId" 
              @change="newAccount.categoryId = ''"
              required
            >
              <option value="">Select Type</option>
              <option 
                v-for="type in store.categoryTypes" 
                :key="type._id"
                :value="type._id"
              >
                {{ type.icon }} {{ type.displayName }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="accountCategory">Category</label>
            <select 
              id="accountCategory" 
              v-model="newAccount.categoryId" 
              :disabled="!newAccount.typeId"
              required
            >
              <option value="">Select Category</option>
              <option 
                v-for="category in availableCategories" 
                :key="category._id" 
                :value="category._id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-row">          
          <div class="form-group">
            <label for="accountDescription">Description (Optional)</label>
            <input
              id="accountDescription"
              v-model="newAccount.description"
              type="text"
              placeholder="Additional details about this account"
            />
          </div>
        </div>

        <button type="submit" class="btn btn-primary">Add Account</button>
      </form>
    </div>

    <!-- Accounts List -->
    <div class="accounts-section panel">
      <h3>Your Accounts</h3>

      <div v-if="store.accounts.length === 0" class="empty-state">
        <p>No accounts added yet. Create your first account above!</p>
      </div>
      
      <div v-else class="accounts-grid">
        <!-- Dynamic account type sections -->
        <div 
          v-for="categoryType in store.categoryTypes" 
          :key="categoryType._id"
          class="account-type-section"
        >
          <h4 class="section-title" :style="{ borderLeftColor: categoryType.color }">
            {{ categoryType.icon }} {{ categoryType.displayName }} Accounts
          </h4>
          <div class="accounts-list">
            <div 
              v-for="account in getAccountsByType(categoryType._id)" 
              :key="account._id"
              class="account-card"
              :style="{ borderLeftColor: categoryType.color }"
            >
              <div class="account-header">
                <h5>{{ account.name }}</h5>
                <div class="account-actions">
                  <button @click="editAccount(account)" class="btn-icon">✏️</button>
                  <button @click="deleteAccount(account._id)" class="btn-icon delete">🗑️</button>
                </div>
              </div>
              <p v-if="account.categoryId" class="account-category">
                📂 {{ account.categoryId.name }}
              </p>
              <p v-if="account.description" class="account-description">{{ account.description }}</p>
              <div class="account-stats">
                <span class="latest-value">
                  Latest: {{ formatCurrency(getLatestValue(account._id)) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Account Modal -->
    <div v-if="editingAccount" class="modal-overlay" @click="cancelEdit">
      <div class="modal" @click.stop>
        <h3>Edit Account</h3>
        <form @submit.prevent="updateAccount" class="account-form">
          <div class="form-group">
            <label for="editAccountName">Account Name</label>
            <input
              id="editAccountName"
              v-model="editingAccount.name"
              type="text"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="editAccountType">Account Type</label>
            <select id="editAccountType" v-model="editingAccount.typeId" required>
              <option 
                v-for="type in store.categoryTypes" 
                :key="type._id"
                :value="type._id"
              >
                {{ type.icon }} {{ type.displayName }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="editAccountCategory">Category</label>
            <select 
              id="editAccountCategory" 
              v-model="editingAccount.categoryId" 
              :disabled="!editingAccount.typeId"
              required
            >
              <option value="">Select Category</option>
              <option 
                v-for="category in getEditCategories" 
                :key="category._id" 
                :value="category._id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="editAccountDescription">Description</label>
            <input
              id="editAccountDescription"
              v-model="editingAccount.description"
              type="text"
            />
          </div>

          <div class="modal-actions">
            <button type="button" @click="cancelEdit" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Update Account</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { store, idOf } from '../store/api-store'
import { formatCurrency } from '../utils/format'

export default {
  name: 'AccountManager',
  setup() {
    const newAccount = ref({
      name: '',
      typeId: '',
      categoryId: '',
      description: ''
    })

    const editingAccount = ref(null)

    // Reload data on mount to get latest category types, accounts, and categories
    onMounted(async () => {
      try {
        await Promise.all([
          store.loadCategoryTypes(),
          store.loadAccounts(),
          store.loadCategories(),
          store.loadEntries()
        ])
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    })

    const availableCategories = computed(() => {
      if (!newAccount.value.typeId) return []
      return store.getCategoriesByTypeId(newAccount.value.typeId)
    })

    const getEditCategories = computed(() => {
      if (!editingAccount.value?.typeId) return []
      return store.getCategoriesByTypeId(editingAccount.value.typeId)
    })

    const getAccountsByType = (typeId) => {
      return store.accounts.filter(acc => idOf(acc.typeId) === typeId)
    }

    const addAccount = async () => {
      try {
        await store.addAccount({ ...newAccount.value })

        // Reset form
        newAccount.value = {
          name: '',
          typeId: '',
          categoryId: '',
          description: ''
        }
      } catch (error) {
        console.error('Failed to add account:', error)
        alert('Failed to add account. Please try again.')
      }
    }

    const editAccount = (account) => {
      editingAccount.value = {
        ...account,
        typeId: typeof account.typeId === 'string' ? account.typeId : account.typeId?._id || '',
        categoryId: account.categoryId?._id || ''
      }
    }

    const updateAccount = async () => {
      try {
        await store.updateAccount(editingAccount.value._id, {
          name: editingAccount.value.name,
          typeId: editingAccount.value.typeId,
          categoryId: editingAccount.value.categoryId,
          description: editingAccount.value.description
        })
        editingAccount.value = null
      } catch (error) {
        console.error('Failed to update account:', error)
        alert('Failed to update account. Please try again.')
      }
    }

    const cancelEdit = () => {
      editingAccount.value = null
    }

    const deleteAccount = async (accountId) => {
      if (confirm('Are you sure you want to delete this account? This will also remove all related entries.')) {
        try {
          await store.deleteAccount(accountId)
        } catch (error) {
          console.error('Failed to delete account:', error)
          alert('Failed to delete account. Please try again.')
        }
      }
    }

    const getLatestValue = (accountId) => {
      const entries = store.monthlyEntries
        .filter(entry => idOf(entry.accountId) === accountId)
        .sort((a, b) => new Date(b.month) - new Date(a.month))

      return entries.length > 0 ? entries[0].amount : 0
    }

    return {
      store,
      newAccount,
      editingAccount,
      availableCategories,
      getEditCategories,
      getAccountsByType,
      addAccount,
      editAccount,
      updateAccount,
      cancelEdit,
      deleteAccount,
      getLatestValue,
      formatCurrency
    }
  }
}
</script>

<style scoped>
.account-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.account-form .btn {
  align-self: flex-start;
}

.add-account-section {
  margin-bottom: 1.5rem;
}

.accounts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.account-type-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.section-title {
  margin: 0;
  padding: 0.6rem 1rem;
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--color-primary);
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 600;
}

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.account-card {
  padding: 1.1rem 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  background: var(--color-surface);
  transition: box-shadow 0.15s ease;
}

.account-card:hover {
  box-shadow: var(--shadow-md);
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
}

.account-header h5 {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
}

.account-actions {
  display: flex;
  gap: 0.35rem;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  transition: background-color 0.15s ease;
}

.btn-icon:hover {
  background-color: rgba(0, 0, 0, 0.07);
}

.btn-icon.delete:hover {
  background-color: var(--color-danger-bg);
}

.account-category {
  margin: 0.3rem 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 500;
}

.account-description {
  margin: 0.3rem 0;
  color: var(--color-text-soft);
  font-size: 0.9rem;
  font-style: italic;
}

.account-stats {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.latest-value {
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--color-success);
}

@media (max-width: 768px) {
  .accounts-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

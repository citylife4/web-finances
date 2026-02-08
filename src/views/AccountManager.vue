<template>
  <div class="account-manager">
    <div class="page-header">
      <h2>Manage Accounts</h2>
      <p class="subtitle">Add and organize your deposit and investment accounts</p>
    </div>

    <!-- Add Account Form -->
    <div class="add-account-section">
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
    <div class="accounts-section">
      <h3>Your Accounts</h3>
      
      <div v-if="store.accounts.length === 0" class="no-accounts">
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
import { store } from '../store/api-store'

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
          store.loadCategories()
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
      return store.accounts.filter(acc => {
        const accTypeId = typeof acc.typeId === 'string' ? acc.typeId : acc.typeId?._id
        return accTypeId === typeId
      })
    }

    const addAccount = async () => {
      try {
        console.log('Adding account:', newAccount.value)
        await store.addAccount({ ...newAccount.value })
        console.log('Account added successfully')
        
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
        .filter(entry => entry.accountId._id === accountId)
        .sort((a, b) => new Date(b.month) - new Date(a.month))
      
      return entries.length > 0 ? entries[0].amount : 0
    }

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(amount)
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
.account-manager {
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

.add-account-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin-bottom: 3rem;
}

.add-account-section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
}

.account-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
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

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
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

.accounts-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.accounts-section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
}

.no-accounts {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.accounts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.account-type-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  margin: 0;
  padding: 0.75rem 1rem;
  padding-left: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.2rem;
}

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.account-card {
  padding: 1.5rem;
  border-radius: 10px;
  border-left: 4px solid;
  background: #f8f9fa;
  transition: transform 0.3s;
}

.account-card:hover {
  transform: translateX(5px);
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.account-header h5 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.account-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.btn-icon:hover {
  background-color: rgba(0,0,0,0.1);
}

.btn-icon.delete:hover {
  background-color: rgba(220, 53, 69, 0.1);
}

.account-category {
  margin: 0.5rem 0;
  color: #666;
  font-weight: 500;
}

.account-subcategory {
  margin: 0.25rem 0 0.5rem 0;
  color: #888;
  font-size: 0.9rem;
}

.account-description {
  margin: 0.5rem 0;
  color: #888;
  font-style: italic;
}

.account-stats {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

.latest-value {
  font-weight: 600;
  color: #28a745;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .accounts-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .account-manager {
    padding: 1rem;
  }
  
  .page-header h2 {
    font-size: 2rem;
  }
}
</style>

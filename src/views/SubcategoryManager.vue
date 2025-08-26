<template>
  <div class="subcategory-manager">
    <div class="page-header">
      <h2>Subcategory Management</h2>
      <p class="subtitle">Manage subcategories for better organization of your accounts</p>
    </div>

    <!-- Add Subcategory Section -->
    <div class="add-subcategory-section">
      <h3>Add New Subcategory</h3>
      <form @submit.prevent="addSubcategory" class="add-form">
        <div class="form-row">
          <div class="form-group">
            <label for="subcategoryName">Subcategory Name</label>
            <input
              id="subcategoryName"
              v-model="newSubcategory.name"
              type="text"
              placeholder="e.g., Emergency Fund, 529 Plan"
              required
            />
          </div>

          <div class="form-group">
            <label for="parentCategory">Parent Category</label>
            <select id="parentCategory" v-model="newSubcategory.parentCategory" required>
              <option value="">Select Parent Category</option>
              <option :value="ACCOUNT_TYPES.DEPOSITS">Deposits</option>
              <option :value="ACCOUNT_TYPES.INVESTMENTS">Investments</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="subcategoryDescription">Description (Optional)</label>
          <input
            id="subcategoryDescription"
            v-model="newSubcategory.description"
            type="text"
            placeholder="Additional details about this subcategory"
          />
        </div>

        <button type="submit" class="btn btn-primary">Add Subcategory</button>
      </form>
    </div>

    <!-- Subcategories List -->
    <div class="subcategories-list">
      <div class="category-section" v-for="parentType in [ACCOUNT_TYPES.DEPOSITS, ACCOUNT_TYPES.INVESTMENTS]" :key="parentType">
        <h3>{{ parentType === ACCOUNT_TYPES.DEPOSITS ? 'Deposits' : 'Investments' }} Subcategories</h3>
        
        <div v-if="getSubcategoriesByParent(parentType).length === 0" class="no-subcategories">
          No subcategories defined for {{ parentType === ACCOUNT_TYPES.DEPOSITS ? 'deposits' : 'investments' }} yet.
        </div>
        
        <div v-else class="subcategories-grid">
          <div 
            v-for="subcategory in getSubcategoriesByParent(parentType)" 
            :key="subcategory._id"
            class="subcategory-card"
          >
            <div v-if="editingSubcategory && editingSubcategory._id === subcategory._id" class="edit-form">
              <form @submit.prevent="updateSubcategory">
                <div class="form-group">
                  <input
                    v-model="editingSubcategory.name"
                    type="text"
                    placeholder="Subcategory name"
                    required
                  />
                </div>
                <div class="form-group">
                  <input
                    v-model="editingSubcategory.description"
                    type="text"
                    placeholder="Description"
                  />
                </div>
                <div class="card-actions">
                  <button type="submit" class="btn btn-primary btn-small">Save</button>
                  <button type="button" @click="cancelEdit" class="btn btn-secondary btn-small">Cancel</button>
                </div>
              </form>
            </div>
            
            <div v-else class="subcategory-info">
              <h4>{{ subcategory.name }}</h4>
              <p v-if="subcategory.description" class="description">{{ subcategory.description }}</p>
              <p class="meta">Created: {{ formatDate(subcategory.createdAt) }}</p>
              <div class="card-actions">
                <button @click="editSubcategory(subcategory)" class="btn btn-secondary btn-small">Edit</button>
                <button @click="deleteSubcategory(subcategory._id)" class="btn btn-danger btn-small">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { store, ACCOUNT_TYPES } from '../store/api-store'

export default {
  name: 'SubcategoryManager',
  setup() {
    const newSubcategory = ref({
      name: '',
      parentCategory: '',
      description: ''
    })

    const editingSubcategory = ref(null)

    const getSubcategoriesByParent = computed(() => {
      return (parentCategory) => store.getSubcategoriesByParent(parentCategory)
    })

    const addSubcategory = async () => {
      try {
        await store.addSubcategory(newSubcategory.value)
        newSubcategory.value = {
          name: '',
          parentCategory: '',
          description: ''
        }
      } catch (error) {
        console.error('Failed to add subcategory:', error)
        alert('Failed to add subcategory. Please try again.')
      }
    }

    const editSubcategory = (subcategory) => {
      editingSubcategory.value = { ...subcategory }
    }

    const updateSubcategory = async () => {
      try {
        await store.updateSubcategory(editingSubcategory.value._id, editingSubcategory.value)
        editingSubcategory.value = null
      } catch (error) {
        console.error('Failed to update subcategory:', error)
        alert('Failed to update subcategory. Please try again.')
      }
    }

    const cancelEdit = () => {
      editingSubcategory.value = null
    }

    const deleteSubcategory = async (subcategoryId) => {
      if (confirm('Are you sure you want to delete this subcategory? This action cannot be undone.')) {
        try {
          await store.deleteSubcategory(subcategoryId)
        } catch (error) {
          console.error('Failed to delete subcategory:', error)
          alert('Failed to delete subcategory. Please try again.')
        }
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString()
    }

    return {
      store,
      ACCOUNT_TYPES,
      newSubcategory,
      editingSubcategory,
      getSubcategoriesByParent,
      addSubcategory,
      editSubcategory,
      updateSubcategory,
      cancelEdit,
      deleteSubcategory,
      formatDate
    }
  }
}
</script>

<style scoped>
.subcategory-manager {
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

.add-subcategory-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 3rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.add-subcategory-section h3 {
  margin-top: 0;
  color: #333;
}

.add-form {
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
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
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
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.subcategories-list {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.category-section h3 {
  color: #333;
  margin-bottom: 1.5rem;
}

.no-subcategories {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  color: #666;
}

.subcategories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.subcategory-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.subcategory-card:hover {
  transform: translateY(-2px);
}

.subcategory-info h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.meta {
  color: #999;
  font-size: 0.8rem;
  margin-bottom: 1rem;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-form .form-group {
  margin-bottom: 1rem;
}

.edit-form input {
  width: 100%;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .subcategories-grid {
    grid-template-columns: 1fr;
  }
}
</style>
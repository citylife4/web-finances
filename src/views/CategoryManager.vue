<template>
  <div class="category-manager">
    <div class="page-header">
      <h2>Category Management</h2>
      <p class="subtitle">Manage categories for better organization of your accounts</p>
    </div>

    <!-- Add Category Section -->
    <div class="add-category-section">
      <h3>Add New Category</h3>
      <form @submit.prevent="addCategory" class="add-form">
        <div class="form-row">
          <div class="form-group">
            <label for="categoryName">Category Name</label>
            <input
              id="categoryName"
              v-model="newCategory.name"
              type="text"
              placeholder="e.g., Emergency Fund, 529 Plan"
              required
            />
          </div>

          <div class="form-group">
            <label for="categoryType">Category Type</label>
            <select id="categoryType" v-model="newCategory.typeId" required>
              <option value="">Select Category Type</option>
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

        <div class="form-group">
          <label for="categoryDescription">Description (Optional)</label>
          <input
            id="categoryDescription"
            v-model="newCategory.description"
            type="text"
            placeholder="Additional details about this category"
          />
        </div>

        <button type="submit" class="btn btn-primary">Add Category</button>
      </form>
    </div>

    <!-- Categories List -->
    <div class="categories-list">
      <div class="category-section" v-for="categoryType in store.categoryTypes" :key="categoryType._id">
        <h3>{{ categoryType.icon }} {{ categoryType.displayName }} Categories</h3>
        
        <div v-if="getCategoriesByTypeId(categoryType._id).length === 0" class="no-categories">
          No categories defined for {{ categoryType.displayName.toLowerCase() }} yet.
        </div>
        
        <div v-else class="categories-grid">
          <div 
            v-for="category in getCategoriesByTypeId(categoryType._id)" 
            :key="category._id"
            class="category-card"
          >
            <div v-if="editingCategory && editingCategory._id === category._id" class="edit-form">
              <form @submit.prevent="updateCategory">
                <div class="form-group">
                  <label>Category Name</label>
                  <input
                    v-model="editingCategory.name"
                    type="text"
                    placeholder="Category name"
                    required
                  />
                </div>
                <div class="form-group">
                  <label>Category Type</label>
                  <select v-model="editingCategory.typeId" required>
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
                  <label>Description</label>
                  <input
                    v-model="editingCategory.description"
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
            
            <div v-else class="category-info">
              <h4>{{ category.name }}</h4>
              <p v-if="category.description" class="description">{{ category.description }}</p>
              <p class="meta">Created: {{ formatDate(category.createdAt) }}</p>
              <div class="card-actions">
                <button @click="editCategory(category)" class="btn btn-secondary btn-small">Edit</button>
                <button @click="deleteCategory(category._id)" class="btn btn-danger btn-small">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { store } from '../store/api-store'

export default {
  name: 'CategoryManager',
  setup() {
    const newCategory = ref({
      name: '',
      typeId: '',
      description: ''
    })

    const editingCategory = ref(null)

    // Reload data on mount to get latest category types and categories
    onMounted(async () => {
      try {
        await Promise.all([
          store.loadCategoryTypes(),
          store.loadCategories()
        ])
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    })

    const getCategoriesByTypeId = (typeId) => {
      return store.getCategoriesByTypeId(typeId)
    }

    const addCategory = async () => {
      try {
        await store.addCategory({ ...newCategory.value })
        
        // Reset form
        newCategory.value = {
          name: '',
          typeId: '',
          description: ''
        }
      } catch (error) {
        // Error is handled by the store
        console.error('Failed to add category:', error)
      }
    }

    const editCategory = (category) => {
      editingCategory.value = { ...category }
      // Extract typeId properly from populated data
      if (editingCategory.value.typeId && typeof editingCategory.value.typeId === 'object') {
        editingCategory.value.typeId = editingCategory.value.typeId._id
      }
    }

    const updateCategory = async () => {
      try {
        await store.updateCategory(editingCategory.value._id, {
          name: editingCategory.value.name,
          typeId: editingCategory.value.typeId,
          description: editingCategory.value.description
        })
        // Reload accounts since the backend cascades typeId changes to accounts
        await store.loadAccounts()
        editingCategory.value = null
      } catch (error) {
        console.error('Failed to update category:', error)
      }
    }

    const deleteCategory = async (id) => {
      if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
        try {
          await store.deleteCategory(id)
        } catch (error) {
          console.error('Failed to delete category:', error)
        }
      }
    }

    const cancelEdit = () => {
      editingCategory.value = null
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString()
    }

    return {
      store,
      newCategory,
      editingCategory,
      getCategoriesByTypeId,
      addCategory,
      editCategory,
      updateCategory,
      deleteCategory,
      cancelEdit,
      formatDate
    }
  }
}
</script>

<style scoped>
.category-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h2 {
  color: white;
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-weight: 300;
}

.subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  margin: 0;
}

.add-category-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 40px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.add-category-section h3 {
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.add-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
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
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.875rem;
}

.categories-list {
  display: grid;
  gap: 40px;
}

.category-section h3 {
  color: white;
  font-size: 1.5rem;
  margin-bottom: 20px;
  text-align: center;
}

.no-categories {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.category-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.category-info h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.2rem;
}

.description {
  color: #666;
  margin: 10px 0;
  font-style: italic;
}

.meta {
  color: #999;
  font-size: 0.875rem;
  margin: 10px 0;
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.edit-form .form-group {
  margin-bottom: 15px;
}

.edit-form input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
  }
  
  .card-actions {
    flex-direction: column;
  }
}
</style>
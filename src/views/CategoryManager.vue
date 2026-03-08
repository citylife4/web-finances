<template>
  <div class="category-manager">
    <div class="page-header">
      <h2>Category Management</h2>
      <p class="subtitle">Manage categories for better organization of your accounts</p>
    </div>

    <div v-if="initializing" class="loading-state">
      <div class="loading-card">
        <div class="spinner"></div>
        <p>Loading categories...</p>
      </div>
    </div>

    <template v-else>

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
                <button @click="showDeleteConfirm(category._id)" class="btn btn-danger btn-small">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal
      :visible="confirmDelete.visible"
      title="Delete Category"
      message="Are you sure you want to delete this category? This action cannot be undone."
      confirmText="Delete"
      :dangerous="true"
      @confirm="deleteCategory"
      @cancel="confirmDelete.visible = false"
    />
    </template>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { store } from '../store/api-store'
import ConfirmModal from '../components/ConfirmModal.vue'
import { useToast } from '../components/ToastContainer.vue'
import { formatDate } from '../utils/formatters'

export default {
  name: 'CategoryManager',
  components: { ConfirmModal },
  setup() {
    const toast = useToast()
    const initializing = ref(true)
    const confirmDelete = ref({ visible: false, categoryId: null })
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
        // ignored — store handles errors
      } finally {
        initializing.value = false
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
        toast.error('Failed to add category.')
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
        toast.error('Failed to update category.')
      }
    }

    const showDeleteConfirm = (id) => {
      confirmDelete.value = { visible: true, categoryId: id }
    }

    const deleteCategory = async () => {
      const id = confirmDelete.value.categoryId
      confirmDelete.value = { visible: false, categoryId: null }
      try {
        await store.deleteCategory(id)
        toast.success('Category deleted.')
      } catch (error) {
        toast.error('Failed to delete category.')
      }
    }

    const cancelEdit = () => {
      editingCategory.value = null
    }

    return {
      store,
      initializing,
      newCategory,
      editingCategory,
      confirmDelete,
      getCategoriesByTypeId,
      addCategory,
      editCategory,
      updateCategory,
      showDeleteConfirm,
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

.loading-state {
  background: white;
  border-radius: 15px;
  padding: 3rem 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.add-category-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 3rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.add-category-section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
}

.add-form {
  max-width: 600px;
  margin: 0 auto;
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
  margin-bottom: 1rem;
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

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-small {
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
}

.categories-list {
  display: grid;
  gap: 2rem;
}

.category-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.category-section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.3rem;
}

.no-categories {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

.category-card {
  padding: 1.25rem;
  border-radius: 10px;
  border-left: 4px solid #667eea;
  background: #f8f9fa;
  transition: transform 0.3s;
}

.category-card:hover {
  transform: translateX(5px);
}

.category-info h4 {
  margin: 0 0 0.5rem;
  color: #333;
  font-size: 1.1rem;
}

.description {
  color: #888;
  margin: 0.5rem 0;
  font-style: italic;
}

.meta {
  color: #999;
  font-size: 0.875rem;
  margin: 0.5rem 0;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.edit-form .form-group {
  margin-bottom: 1rem;
}

.edit-form input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .categories-grid {
    grid-template-columns: 1fr;
  }

  .category-manager {
    padding: 1rem;
  }

  .page-header h2 {
    font-size: 2rem;
  }
}
</style>
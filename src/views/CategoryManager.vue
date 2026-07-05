<template>
  <div class="category-manager page">
    <div class="page-header">
      <h2>Category Management</h2>
      <p class="subtitle">Manage categories for better organization of your accounts</p>
    </div>

    <!-- Add Category Section -->
    <div class="add-category-section panel">
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
      <div class="category-section panel" v-for="categoryType in store.categoryTypes" :key="categoryType._id">
        <h3>{{ categoryType.icon }} {{ categoryType.displayName }} Categories</h3>

        <div v-if="getCategoriesByTypeId(categoryType._id).length === 0" class="empty-state">
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
.add-category-section {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.add-form .btn {
  align-self: flex-start;
}

.btn-small {
  padding: 0.4rem 0.9rem;
  font-size: 0.85rem;
}

.categories-list {
  display: grid;
  gap: 1.5rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.category-card {
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  transition: box-shadow 0.15s ease;
}

.category-card:hover {
  box-shadow: var(--shadow-md);
}

.category-info h4 {
  margin: 0 0 0.5rem 0;
  color: var(--color-text);
  font-size: 1.05rem;
}

.description {
  color: var(--color-text-muted);
  margin: 0.5rem 0;
  font-size: 0.9rem;
  font-style: italic;
}

.meta {
  color: var(--color-text-soft);
  font-size: 0.8rem;
  margin: 0.5rem 0;
}

.card-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.85rem;
}

.edit-form .form-group {
  margin-bottom: 0.85rem;
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
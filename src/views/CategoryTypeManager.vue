<template>
  <div class="category-type-manager">
    <div class="page-header">
      <h2>Category Type Management</h2>
      <p class="subtitle">Manage types to organize your categories and accounts</p>
    </div>

    <!-- Add Category Type Section -->
    <div class="add-type-section">
      <h3>Add New Category Type</h3>
      <form @submit.prevent="addCategoryType" class="add-form">
        <div class="form-row">
          <div class="form-group">
            <label for="typeName">Type Name</label>
            <input
              id="typeName"
              v-model="newType.name"
              type="text"
              placeholder="e.g., liabilities, assets"
              required
            />
            <small>Lowercase, no spaces (used internally)</small>
          </div>

          <div class="form-group">
            <label for="typeDisplayName">Display Name</label>
            <input
              id="typeDisplayName"
              v-model="newType.displayName"
              type="text"
              placeholder="e.g., Liabilities, Assets"
              required
            />
            <small>How it appears in the UI</small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="typeColor">Color</label>
            <input
              id="typeColor"
              v-model="newType.color"
              type="color"
            />
          </div>

          <div class="form-group">
            <label for="typeIcon">Icon (emoji)</label>
            <input
              id="typeIcon"
              v-model="newType.icon"
              type="text"
              placeholder="e.g., 💳, 🏠"
              maxlength="2"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="typeDescription">Description (Optional)</label>
          <input
            id="typeDescription"
            v-model="newType.description"
            type="text"
            placeholder="Description of this category type"
          />
        </div>

        <button type="submit" class="btn btn-primary">Add Category Type</button>
      </form>
    </div>

    <!-- Category Types List -->
    <div class="types-list">
      <h3>Existing Category Types</h3>
      
      <div v-if="store.categoryTypes.length === 0" class="no-types">
        No category types defined yet.
      </div>
      
      <div v-else class="types-grid">
        <div 
          v-for="type in store.categoryTypes" 
          :key="type._id"
          class="type-card"
          :style="{ borderLeftColor: type.color }"
        >
          <div v-if="editingType && editingType._id === type._id" class="edit-form">
            <form @submit.prevent="updateCategoryType">
              <div class="form-group">
                <label>Display Name</label>
                <input
                  v-model="editingType.displayName"
                  type="text"
                  placeholder="Display name"
                  required
                />
              </div>
              <div class="form-group">
                <label>Description</label>
                <input
                  v-model="editingType.description"
                  type="text"
                  placeholder="Description"
                />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Color</label>
                  <input
                    v-model="editingType.color"
                    type="color"
                  />
                </div>
                <div class="form-group">
                  <label>Icon</label>
                  <input
                    v-model="editingType.icon"
                    type="text"
                    maxlength="2"
                  />
                </div>
              </div>
              <div class="card-actions">
                <button type="submit" class="btn btn-primary btn-small">Save</button>
                <button type="button" @click="cancelEdit" class="btn btn-secondary btn-small">Cancel</button>
              </div>
            </form>
          </div>
          
          <div v-else class="type-info">
            <div class="type-header">
              <span class="type-icon" v-if="type.icon">{{ type.icon }}</span>
              <h4>{{ type.displayName }}</h4>
              <span v-if="type.isSystem" class="system-badge">System</span>
            </div>
            <p class="type-name">Internal: {{ type.name }}</p>
            <p v-if="type.description" class="description">{{ type.description }}</p>
            <div class="color-preview" :style="{ backgroundColor: type.color }"></div>
            <p class="meta">Created: {{ formatDate(type.createdAt) }}</p>
            <div class="card-actions">
              <button @click="editCategoryType(type)" class="btn btn-secondary btn-small">Edit</button>
              <button 
                v-if="!type.isSystem"
                @click="deleteCategoryType(type._id)" 
                class="btn btn-danger btn-small"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { store } from '../store/api-store'

export default {
  name: 'CategoryTypeManager',
  setup() {
    const newType = ref({
      name: '',
      displayName: '',
      description: '',
      color: '#667eea',
      icon: ''
    })

    const editingType = ref(null)

    const addCategoryType = async () => {
      try {
        // Convert name to lowercase and remove spaces
        const processedName = newType.value.name.toLowerCase().replace(/\s+/g, '-')
        
        await store.addCategoryType({
          name: processedName,
          displayName: newType.value.displayName,
          description: newType.value.description,
          color: newType.value.color,
          icon: newType.value.icon
        })
        
        // Reset form
        newType.value = {
          name: '',
          displayName: '',
          description: '',
          color: '#667eea',
          icon: ''
        }
      } catch (error) {
        console.error('Failed to add category type:', error)
      }
    }

    const editCategoryType = (type) => {
      editingType.value = { ...type }
    }

    const updateCategoryType = async () => {
      try {
        await store.updateCategoryType(editingType.value._id, {
          displayName: editingType.value.displayName,
          description: editingType.value.description,
          color: editingType.value.color,
          icon: editingType.value.icon
        })
        editingType.value = null
      } catch (error) {
        console.error('Failed to update category type:', error)
      }
    }

    const deleteCategoryType = async (id) => {
      if (confirm('Are you sure you want to delete this category type? This action cannot be undone and will only work if no categories or accounts are using this type.')) {
        try {
          await store.deleteCategoryType(id)
        } catch (error) {
          console.error('Failed to delete category type:', error)
        }
      }
    }

    const cancelEdit = () => {
      editingType.value = null
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString()
    }

    return {
      store,
      newType,
      editingType,
      addCategoryType,
      editCategoryType,
      updateCategoryType,
      deleteCategoryType,
      cancelEdit,
      formatDate
    }
  }
}
</script>

<style scoped>
.category-type-manager {
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

.add-type-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 40px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.add-type-section h3 {
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

.form-group small {
  display: block;
  margin-top: 4px;
  color: #888;
  font-size: 0.85rem;
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

.form-group input[type="color"] {
  height: 50px;
  cursor: pointer;
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

.types-list {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 30px;
}

.types-list h3 {
  color: white;
  font-size: 1.5rem;
  margin-bottom: 20px;
  text-align: center;
}

.no-types {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
}

.types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.type-card {
  background: white;
  border-radius: 12px;
  border-left: 4px solid #667eea;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.type-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.type-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.type-icon {
  font-size: 1.5rem;
}

.type-info h4 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
  flex: 1;
}

.system-badge {
  background: #6c757d;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.type-name {
  color: #888;
  font-size: 0.875rem;
  margin: 5px 0;
  font-family: monospace;
}

.description {
  color: #666;
  margin: 10px 0;
  font-style: italic;
}

.color-preview {
  width: 60px;
  height: 30px;
  border-radius: 4px;
  margin: 10px 0;
  border: 1px solid #ddd;
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
  
  .types-grid {
    grid-template-columns: 1fr;
  }
  
  .card-actions {
    flex-direction: column;
  }
}
</style>

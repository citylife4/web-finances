<template>
  <div class="category-type-manager page">
    <div class="page-header">
      <h2>Category Type Management</h2>
      <p class="subtitle">Manage types to organize your categories and accounts</p>
    </div>

    <!-- Add Category Type Section -->
    <div class="add-type-section panel">
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
    <div class="types-list panel">
      <h3>Existing Category Types</h3>

      <div v-if="store.categoryTypes.length === 0" class="empty-state">
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
import { ref, onMounted } from 'vue'
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

    // Reload data on mount to get latest category types
    onMounted(async () => {
      try {
        await store.loadCategoryTypes()
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    })

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
.add-type-section {
  margin-bottom: 1.5rem;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.add-form .btn {
  align-self: flex-start;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.form-group small {
  color: var(--color-text-soft);
  font-size: 0.8rem;
}

.form-group input[type="color"] {
  height: 44px;
  padding: 0.25rem;
  cursor: pointer;
}

.btn-small {
  padding: 0.4rem 0.9rem;
  font-size: 0.85rem;
}

.types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.type-card {
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  transition: box-shadow 0.15s ease;
}

.type-card:hover {
  box-shadow: var(--shadow-md);
}

.type-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}

.type-icon {
  font-size: 1.35rem;
}

.type-info h4 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  flex: 1;
}

.system-badge {
  background: var(--color-text-muted);
  color: white;
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 500;
}

.type-name {
  color: var(--color-text-soft);
  font-size: 0.82rem;
  margin: 0.3rem 0;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.description {
  color: var(--color-text-muted);
  margin: 0.5rem 0;
  font-size: 0.9rem;
  font-style: italic;
}

.color-preview {
  width: 56px;
  height: 26px;
  border-radius: var(--radius-sm);
  margin: 0.5rem 0;
  border: 1px solid var(--color-border);
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

  .types-grid {
    grid-template-columns: 1fr;
  }

  .card-actions {
    flex-direction: column;
  }
}
</style>

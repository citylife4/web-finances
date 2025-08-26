<template>
  <div class="import-data">
    <div class="page-header">
      <h2>Import Data from XLSX</h2>
      <p class="subtitle">Import financial data from Excel files with tabular format</p>
    </div>

    <!-- Instructions Card -->
    <div class="instructions-card">
      <h3>📋 File Format Requirements</h3>
      <div class="format-description">
        <p><strong>Required XLSX format:</strong></p>
        <ul>
          <li><strong>First column:</strong> Bank/Wallet names</li>
          <li><strong>Second column:</strong> Account type (deposits, investments)</li>
          <li><strong>Third column:</strong> Category or Subcategory (e.g., Checking Account, 401(k), or custom subcategory names)</li>
          <li><strong>Remaining columns:</strong> Months/Years (e.g., Jan/2023, Feb/2023)</li>
        </ul>
        <p class="example-note">
          💡 <strong>Smart Import:</strong> The third column can be either a predefined category (like "Checking Account") or a custom subcategory name. If it matches a predefined category, it will be used as the category. Otherwise, it will be created as a new subcategory under the appropriate default category.
        </p>
        <div class="example-actions">
          <button @click="downloadExample" class="btn btn-secondary">
            📥 Download Example File
          </button>
        </div>
      </div>
      
      <div class="example-table">
        <table>
          <thead>
            <tr>
              <th>Bank/Wallet</th>
              <th>Type</th>
              <th>Category/Subcategory</th>
              <th>Jan/2023</th>
              <th>Feb/2023</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Bank A</td>
              <td>deposits</td>
              <td>Checking Account</td>
              <td>100</td>
              <td>150</td>
            </tr>
            <tr>
              <td>Bank B</td>
              <td>investments</td>
              <td>Stock Portfolio</td>
              <td>200</td>
              <td>250</td>
            </tr>
            <tr>
              <td>Bank C</td>
              <td>deposits</td>
              <td>Emergency Fund</td>
              <td>50</td>
              <td>60</td>
            </tr>
            <tr>
              <td>Brokerage X</td>
              <td>investments</td>
              <td>401k Rollover</td>
              <td>300</td>
              <td>320</td>
            </tr>
          </tbody>
        </table>
        <p class="example-explanation">
          <small>
            <strong>Note:</strong> "Checking Account" and "Stock Portfolio" are predefined categories, while "Emergency Fund" and "401k Rollover" will be created as subcategories.
          </small>
        </p>
      </div>
    </div>

    <!-- Upload Section -->
    <div class="upload-section">
      <h3>📁 Upload XLSX File</h3>
      
      <div class="file-upload-area" :class="{ 'dragover': isDragOver }" 
           @drop="handleDrop" @dragover="handleDragOver" @dragleave="handleDragLeave">
        <input 
          ref="fileInput"
          type="file" 
          accept=".xlsx,.xls" 
          @change="handleFileSelect"
          class="file-input"
        />
        
        <div class="upload-content">
          <div class="upload-icon">📄</div>
          <p class="upload-text">
            <strong>Click to select</strong> or drag and drop your XLSX file here
          </p>
          <p class="upload-hint">Supported formats: .xlsx, .xls</p>
        </div>
      </div>

      <div v-if="selectedFile" class="selected-file">
        <span class="file-name">📎 {{ selectedFile.name }}</span>
        <button @click="clearFile" class="btn btn-secondary btn-small">Remove</button>
      </div>
    </div>

    <!-- Progress Section -->
    <div v-if="isProcessing" class="processing-section">
      <div class="progress-indicator">
        <div class="spinner"></div>
        <p>Processing your file...</p>
      </div>
    </div>

    <!-- Preview Section -->
    <div v-if="previewData && !isProcessing" class="preview-section">
      <h3>📊 Preview Parsed Data</h3>
      
      <div class="preview-summary">
        <div class="summary-item">
          <span class="label">Accounts to create/update:</span>
          <span class="value">{{ previewData.accounts.length }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Monthly entries:</span>
          <span class="value">{{ previewData.entries.length }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Months covered:</span>
          <span class="value">{{ previewData.months.length }}</span>
        </div>
      </div>

      <div class="preview-tabs">
        <button 
          @click="activeTab = 'accounts'" 
          :class="{ active: activeTab === 'accounts' }"
          class="tab-button"
        >
          Accounts ({{ previewData.accounts.length }})
        </button>
        <button 
          @click="activeTab = 'entries'" 
          :class="{ active: activeTab === 'entries' }"
          class="tab-button"
        >
          Entries ({{ previewData.entries.length }})
        </button>
      </div>

      <div class="preview-content">
        <!-- Accounts Preview -->
        <div v-if="activeTab === 'accounts'" class="accounts-preview">
          <div class="table-container">
            <table class="preview-table">
              <thead>
                <tr>
                  <th>Account Name</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Subcategory</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="account in previewData.accounts" :key="account.name">
                  <td>{{ account.name }}</td>
                  <td>{{ account.type }}</td>
                  <td>{{ account.category }}</td>
                  <td>{{ account.subcategoryName || 'None' }}</td>
                  <td>
                    <span class="status-badge" :class="account.exists ? 'existing' : 'new'">
                      {{ account.exists ? 'Existing' : 'New' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Entries Preview -->
        <div v-if="activeTab === 'entries'" class="entries-preview">
          <div class="table-container">
            <table class="preview-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Month</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in previewData.entries.slice(0, 50)" :key="`${entry.accountName}-${entry.month}`">
                  <td>{{ entry.accountName }}</td>
                  <td>{{ entry.month }}</td>
                  <td>{{ formatCurrency(entry.amount) }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="previewData.entries.length > 50" class="preview-note">
              Showing first 50 entries of {{ previewData.entries.length }} total
            </p>
          </div>
        </div>
      </div>

      <!-- Import Actions -->
      <div class="import-actions">
        <button @click="clearPreview" class="btn btn-secondary">Cancel</button>
        <button @click="importData" class="btn btn-primary" :disabled="importing">
          {{ importing ? 'Importing...' : 'Import Data' }}
        </button>
      </div>
    </div>

    <!-- Error Section -->
    <div v-if="error" class="error-section">
      <div class="error-card">
        <h3>⚠️ Import Error</h3>
        <p>{{ error }}</p>
        <button @click="clearError" class="btn btn-secondary">Dismiss</button>
      </div>
    </div>

    <!-- Success Section -->
    <div v-if="successMessage" class="success-section">
      <div class="success-card">
        <h3>✅ Import Successful</h3>
        <p>{{ successMessage }}</p>
        <div class="success-actions">
          <router-link to="/" class="btn btn-primary">View Dashboard</router-link>
          <button @click="clearSuccess" class="btn btn-secondary">Import More</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as XLSX from 'xlsx'
import { store, DEPOSIT_CATEGORIES, INVESTMENT_CATEGORIES } from '../store/api-store'
import { downloadExampleXLSX } from '../utils/exampleFile'

export default {
  name: 'ImportData',
  data() {
    return {
      selectedFile: null,
      isDragOver: false,
      isProcessing: false,
      importing: false,
      previewData: null,
      activeTab: 'accounts',
      error: null,
      successMessage: null
    }
  },
  methods: {
    handleDragOver(e) {
      e.preventDefault()
      this.isDragOver = true
    },
    
    handleDragLeave(e) {
      e.preventDefault()
      this.isDragOver = false
    },
    
    handleDrop(e) {
      e.preventDefault()
      this.isDragOver = false
      
      const files = e.dataTransfer.files
      if (files.length > 0) {
        this.processFile(files[0])
      }
    },
    
    handleFileSelect(e) {
      const file = e.target.files[0]
      if (file) {
        this.processFile(file)
      }
    },
    
    processFile(file) {
      // Validate file type
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        this.error = 'Please select a valid XLSX or XLS file.'
        return
      }
      
      this.selectedFile = file
      this.clearError()
      this.clearSuccess()
      this.parseFile(file)
    },
    
    async parseFile(file) {
      this.isProcessing = true
      this.previewData = null
      
      try {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        if (jsonData.length < 2) {
          throw new Error('File must have at least 2 rows (header row and data rows)')
        }
        
        const parsedData = this.parseReverseTableData(jsonData)
        this.previewData = await this.preparePreviewData(parsedData)
        
      } catch (error) {
        console.error('Parse error:', error)
        this.error = `Failed to parse file: ${error.message}`
      } finally {
        this.isProcessing = false
      }
    },
    
    parseReverseTableData(jsonData) {
      // Extract headers (months/years) from first row, skipping first 3 columns (Bank/Wallet, Type, Sub-type)
      // Normalize headers to strings before trimming to avoid "header.trim is not a function" when
      // a header cell is not already a string (e.g. number, Date, or array).
      const headers = jsonData[0]
        .slice(3)
        .map(h => (h === undefined || h === null) ? '' : String(h))
        .map(h => h.trim())
        .filter(h => h)
      
      if (headers.length === 0) {
        throw new Error('No month/year columns found')
      }
      
      const accounts = []
      const entries = []
      
      // Process data rows (starting from row 2, index 1)
      for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
        const row = jsonData[rowIndex]
        const accountName = row[0]
        const accountType = row[1]
        const subTypeOrCategory = row[2]
        
        if (!accountName || accountName.trim() === '') {
          continue // Skip empty rows
        }
        
        if (!accountType || !subTypeOrCategory) {
          continue // Skip rows without type or sub-type/category
        }
        
        // Validate account type
        const normalizedType = accountType.trim().toLowerCase()
        if (normalizedType !== 'deposits' && normalizedType !== 'investments') {
          console.warn(`Invalid account type '${accountType}' for account '${accountName}'. Must be 'deposits' or 'investments'.`)
          continue
        }
        
        // Determine if the third column is a predefined category or a subcategory
        const trimmedSubType = subTypeOrCategory.trim()
        const availableCategories = normalizedType === 'deposits' 
          ? DEPOSIT_CATEGORIES
          : INVESTMENT_CATEGORIES
        
        let accountCategory
        let subcategoryName = null
        
        // Check if it matches a predefined category
        if (availableCategories.some(cat => cat.toLowerCase() === trimmedSubType.toLowerCase())) {
          accountCategory = availableCategories.find(cat => cat.toLowerCase() === trimmedSubType.toLowerCase())
        } else {
          // Treat as subcategory - use first available category as default
          accountCategory = availableCategories[0]
          subcategoryName = trimmedSubType
        }
        
        // Add account (check for duplicates)
        let account = accounts.find(acc => 
          acc.name === accountName.trim() && 
          acc.type === normalizedType && 
          acc.category === accountCategory &&
          acc.subcategoryName === subcategoryName
        )
        
        if (!account) {
          account = {
            name: accountName.trim(),
            type: normalizedType,
            category: accountCategory,
            subcategoryName: subcategoryName
          }
          accounts.push(account)
        }
        
        // Process monthly data (starting from column 3, index 3)
        for (let colIndex = 3; colIndex < row.length && (colIndex - 3) < headers.length; colIndex++) {
          const monthHeader = headers[colIndex - 3]
          const amount = row[colIndex]
          
          if (amount === undefined || amount === null || amount === '') {
            continue // Skip empty cells
          }
          
          const numAmount = parseFloat(amount)
          if (isNaN(numAmount)) {
            continue // Skip non-numeric values
          }
          
          // Parse month/year
          const monthYear = this.parseMonthYear(monthHeader)
          if (!monthYear) {
            continue // Skip invalid dates
          }
          
          // Add entry
          entries.push({
            accountName: accountName.trim(),
            accountType: normalizedType,
            accountCategory: accountCategory,
            subcategoryName: subcategoryName,
            month: monthYear,
            amount: numAmount
          })
        }
      }
      
      return { accounts, entries }
    },
    
    parseMonthYear(monthHeader) {
      const header = monthHeader.toString().trim()
      
      // Try to parse various formats like "Jan/2023", "January 2023", "01/2023", etc.
      const patterns = [
        /^(\w{3})\/(\d{4})$/i,  // Jan/2023
        /^(\w{3})\s+(\d{4})$/i, // Jan 2023
        /^(\d{1,2})\/(\d{4})$/,  // 1/2023 or 01/2023
        /^(\w+)\s+(\d{4})$/i,    // January 2023
        /^'(\w{3})\/(\d{4})$/i,  // Jan/2023
        /^'(\w{3})\s+(\d{4})$/i, // Jan 2023
        /^'(\d{1,2})\/(\d{4})$/,  // 1/2023 or 01/2023
        /^'(\w+)\s+(\d{4})$/i    // January 2023
      ]
      
      for (const pattern of patterns) {
        const match = header.match(pattern)
        if (match) {
          let month = match[1]
          const year = match[2]
          
          // Convert month name to number
          if (isNaN(month)) {
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                              'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
            const fullMonthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                                   'july', 'august', 'september', 'october', 'november', 'december']
            
            const shortIndex = monthNames.indexOf(month.toLowerCase().substring(0, 3))
            const fullIndex = fullMonthNames.indexOf(month.toLowerCase())
            
            if (shortIndex !== -1) {
              month = (shortIndex + 1).toString().padStart(2, '0')
            } else if (fullIndex !== -1) {
              month = (fullIndex + 1).toString().padStart(2, '0')
            } else {
              continue // Try next pattern
            }
          } else {
            month = parseInt(month).toString().padStart(2, '0')
          }
          
          return `${year}-${month}`
        }
      }
      
      return null
    },
    
    async preparePreviewData(parsedData) {
      // Load existing accounts and subcategories to check which ones already exist
      await Promise.all([store.loadAccounts(), store.loadSubcategories()])
      
      const existingAccounts = store.accounts
      
      // Prepare accounts data with existence check
      const accounts = parsedData.accounts.map(account => ({
        ...account,
        exists: existingAccounts.some(existing => 
          existing.name.toLowerCase() === account.name.toLowerCase() &&
          existing.type === account.type &&
          existing.category === account.category &&
          // Check subcategory match - both null or both match
          ((account.subcategoryName === null && !existing.subcategoryId) ||
           (account.subcategoryName !== null && existing.subcategoryId && 
            store.subcategories.find(sub => sub._id === existing.subcategoryId)?.name === account.subcategoryName))
        )
      }))
      
      // Get unique months
      const months = [...new Set(parsedData.entries.map(entry => entry.month))].sort()
      
      return {
        accounts,
        entries: parsedData.entries,
        months
      }
    },
    
    async importData() {
      if (!this.previewData) return
      
      this.importing = true
      this.clearError()
      
      try {
        // First, create subcategories if needed
        const subcategoryMap = new Map() // Map subcategory names to IDs
        
        for (const accountData of this.previewData.accounts) {
          if (accountData.subcategoryName && !accountData.exists) {
            const subcategoryKey = `${accountData.subcategoryName}-${accountData.type}`
            
            if (!subcategoryMap.has(subcategoryKey)) {
              // Check if subcategory already exists
              let existingSubcategory = store.subcategories.find(sub => 
                sub.name === accountData.subcategoryName && 
                sub.parentCategory === accountData.type
              )
              
              if (!existingSubcategory) {
                // Create new subcategory
                try {
                  existingSubcategory = await store.addSubcategory({
                    name: accountData.subcategoryName,
                    parentCategory: accountData.type,
                    description: `Imported from XLSX`
                  })
                  console.log('Created subcategory:', existingSubcategory)
                } catch (error) {
                  console.warn(`Failed to create subcategory '${accountData.subcategoryName}':`, error)
                  continue
                }
              }
              
              subcategoryMap.set(subcategoryKey, existingSubcategory._id)
            }
          }
        }
        
        // Then, create/update accounts
        const accountMap = new Map() // Map account names to IDs
        
        for (const accountData of this.previewData.accounts) {
          let account
          
          if (accountData.exists) {
            // Find existing account
            account = store.accounts.find(existing =>
              existing.name.toLowerCase() === accountData.name.toLowerCase() &&
              existing.type === accountData.type &&
              existing.category === accountData.category &&
              // Check subcategory match
              ((accountData.subcategoryName === null && !existing.subcategoryId) ||
               (accountData.subcategoryName !== null && existing.subcategoryId && 
                store.subcategories.find(sub => sub._id === existing.subcategoryId)?.name === accountData.subcategoryName))
            )
          } else {
            // Create new account
            const accountPayload = {
              name: accountData.name,
              type: accountData.type,
              category: accountData.category
            }
            
            // Add subcategory if specified
            if (accountData.subcategoryName) {
              const subcategoryKey = `${accountData.subcategoryName}-${accountData.type}`
              const subcategoryId = subcategoryMap.get(subcategoryKey)
              if (subcategoryId) {
                accountPayload.subcategoryId = subcategoryId
              }
            }
            
            account = await store.addAccount(accountPayload)
            console.log('Created account:', account)
          }
          
          if (account && account._id) {
            accountMap.set(`${accountData.name}-${accountData.type}-${accountData.category}-${accountData.subcategoryName || ''}`, account._id)
          }
        }
        
        // Then, create monthly entries
        const entries = []
        
        for (const entryData of this.previewData.entries) {
          const accountKey = `${entryData.accountName}-${entryData.accountType}-${entryData.accountCategory}-${entryData.subcategoryName || ''}`
          const accountId = accountMap.get(accountKey)
          
          if (accountId) {
            entries.push({
              accountId,
              month: entryData.month,
              amount: entryData.amount
            })
          }
        }
        
        if (entries.length > 0) {
          await store.saveMonthlyEntries(entries)
        }
        
        // Count created subcategories
        const createdSubcategoriesCount = subcategoryMap.size
        const createdAccountsCount = this.previewData.accounts.filter(acc => !acc.exists).length
        
        let successMsg = `Successfully imported ${this.previewData.accounts.length} accounts and ${entries.length} monthly entries.`
        if (createdSubcategoriesCount > 0) {
          successMsg += ` Created ${createdSubcategoriesCount} new subcategories.`
        }
        
        this.successMessage = successMsg
        this.clearPreview()
        
      } catch (error) {
        console.error('Import error:', error)
        this.error = `Failed to import data: ${error.message}`
      } finally {
        this.importing = false
      }
    },
    
    clearFile() {
      this.selectedFile = null
      this.$refs.fileInput.value = ''
      this.clearPreview()
    },
    
    clearPreview() {
      this.previewData = null
      this.activeTab = 'accounts'
    },
    
    clearError() {
      this.error = null
    },
    
    clearSuccess() {
      this.successMessage = null
    },
    
    downloadExample() {
      downloadExampleXLSX()
    },
    
    formatCurrency(amount) {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount)
    }
  }
}
</script>

<style scoped>
.import-data {
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

/* Instructions Card */
.instructions-card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.instructions-card h3 {
  margin-top: 0;
  color: #333;
  margin-bottom: 1rem;
}

.format-description ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.format-description li {
  margin-bottom: 0.5rem;
}

.example-note {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  margin: 1rem 0;
}

.example-actions {
  text-align: center;
  margin-top: 1.5rem;
}

.example-table {
  overflow-x: auto;
  margin-top: 1.5rem;
}

.example-explanation {
  margin-top: 0.75rem;
  color: #666;
  font-style: italic;
  text-align: center;
}

.example-table table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px;
}

.example-table th,
.example-table td {
  padding: 0.75rem;
  text-align: left;
  border: 1px solid #ddd;
}

.example-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.type-row {
  background: #e3f2fd;
  font-style: italic;
  text-align: center;
}

.category-row {
  background: #f3e5f5;
  font-style: italic;
  text-align: center;
}

/* Upload Section */
.upload-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.upload-section h3 {
  margin-top: 0;
  color: #333;
  margin-bottom: 1.5rem;
}

.file-upload-area {
  border: 2px dashed #ddd;
  border-radius: 10px;
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
}

.file-upload-area:hover,
.file-upload-area.dragover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-text {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.upload-hint {
  color: #666;
  font-size: 0.9rem;
}

.selected-file {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.file-name {
  font-weight: 500;
}

/* Processing Section */
.processing-section {
  background: white;
  border-radius: 15px;
  padding: 3rem 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  text-align: center;
}

.progress-indicator {
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

/* Preview Section */
.preview-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.preview-section h3 {
  margin-top: 0;
  color: #333;
  margin-bottom: 1.5rem;
}

.preview-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-item .label {
  font-weight: 600;
  color: #333;
}

.summary-item .value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #667eea;
}

.preview-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 600;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.tab-button.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.table-container {
  overflow-x: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.preview-table th,
.preview-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.preview-table th {
  background: #f8f9fa;
  font-weight: 600;
  position: sticky;
  top: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.new {
  background: #d4edda;
  color: #155724;
}

.status-badge.existing {
  background: #d1ecf1;
  color: #0c5460;
}

.preview-note {
  text-align: center;
  color: #666;
  font-style: italic;
  margin-top: 1rem;
}

/* Import Actions */
.import-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

/* Error Section */
.error-section {
  margin-bottom: 2rem;
}

.error-card {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
}

.error-card h3 {
  color: #721c24;
  margin-top: 0;
}

.error-card p {
  color: #721c24;
  margin-bottom: 1.5rem;
}

/* Success Section */
.success-section {
  margin-bottom: 2rem;
}

.success-card {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
}

.success-card h3 {
  color: #155724;
  margin-top: 0;
}

.success-card p {
  color: #155724;
  margin-bottom: 1.5rem;
}

.success-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
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

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .import-data {
    padding: 1rem;
  }
  
  .page-header h2 {
    font-size: 2rem;
  }
  
  .preview-summary {
    grid-template-columns: 1fr;
  }
  
  .import-actions,
  .success-actions {
    flex-direction: column;
  }
  
  .preview-tabs {
    flex-direction: column;
  }
  
  .upload-section,
  .instructions-card,
  .preview-section {
    padding: 1.5rem;
  }
}
</style>
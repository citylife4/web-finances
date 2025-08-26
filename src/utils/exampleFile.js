import * as XLSX from 'xlsx'

export function createExampleXLSX() {
  // Create example data in the new tabular format with both predefined categories and subcategories
  const data = [
    // Header row
    ['Bank/Wallet', 'Type', 'Category/Subcategory', 'Jan/2023', 'Feb/2023', 'Mar/2023', 'Apr/2023', 'May/2023'],
    
    // Data rows - demonstrating both predefined categories and custom subcategories
    ['Chase Checking', 'deposits', 'Checking Account', 1500, 1600, 1700, 1800, 1900], // Predefined category
    ['Emergency Fund', 'deposits', 'Emergency Savings', 5000, 5200, 5400, 5600, 5800], // Custom subcategory
    ['Wells Fargo Business', 'deposits', 'Business Account', 2500, 2600, 2700, 2800, 2900], // Custom subcategory
    ['Vanguard 401k', 'investments', 'Stock Portfolio', 45000, 47000, 48000, 49000, 50000], // Predefined category
    ['Crypto Wallet', 'investments', 'Crypto', 25000, 26000, 27000, 28000, 29000], // Predefined category
    ['Real Estate Fund', 'investments', 'REIT Portfolio', 15000, 15500, 16000, 16500, 17000] // Custom subcategory
  ]
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // Add some basic formatting
  const range = XLSX.utils.decode_range(ws['!ref'])
  
  // Set column widths
  ws['!cols'] = [
    { width: 20 }, // Bank/Wallet column
    { width: 15 }, // Type column
    { width: 22 }, // Category/Subcategory column (wider for longer names)
    { width: 12 }, // Jan/2023
    { width: 12 }, // Feb/2023  
    { width: 12 }, // Mar/2023
    { width: 12 }, // Apr/2023
    { width: 12 }  // May/2023
  ]
  
  XLSX.utils.book_append_sheet(wb, ws, 'Financial Data')
  
  return wb
}

export function downloadExampleXLSX() {
  const wb = createExampleXLSX()
  XLSX.writeFile(wb, 'financial_data_example.xlsx')
}
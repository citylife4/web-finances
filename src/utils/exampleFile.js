import * as XLSX from 'xlsx'

export function createExampleXLSX() {
  // Create example data in the reverse table format
  const data = [
    // Header row (months/years)
    ['Bank/Wallet', 'Jan/2023', 'Feb/2023', 'Mar/2023', 'Apr/2023', 'May/2023'],
    
    // Type row - each column has the same type for consistency
    ['deposits', 'deposits', 'deposits', 'investments', 'investments'],
    
    // Category row - each column has the same category for consistency
    ['Checking Account', 'Checking Account', 'Savings Account', '401(k)', 'IRA'],
    
    // Data rows - realistic scenario where banks have different account types
    ['Chase Checking', 1500, 1600, 0, 0, 0],
    ['Chase Savings', 0, 0, 5000, 0, 0],
    ['Wells Fargo Checking', 2500, 2600, 0, 0, 0],
    ['Vanguard 401k', 0, 0, 0, 45000, 47000],
    ['Fidelity IRA', 0, 0, 0, 0, 25000]
  ]
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // Add some basic formatting
  const range = XLSX.utils.decode_range(ws['!ref'])
  
  // Set column widths
  ws['!cols'] = [
    { width: 20 }, // Bank/Wallet column
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
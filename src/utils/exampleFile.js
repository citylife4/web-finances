import * as XLSX from 'xlsx'

export function createExampleXLSX() {
  // Create example data in the new tabular format
  const data = [
    // Header row
    ['Bank/Wallet', 'Type', 'Sub-type', 'Jan/2023', 'Feb/2023', 'Mar/2023', 'Apr/2023', 'May/2023'],
    
    // Data rows - each row contains account info and monthly balances
    ['Chase Checking', 'deposits', 'Checking Account', 1500, 1600, 1700, 1800, 1900],
    ['Chase Savings', 'deposits', 'Savings Account', 5000, 5200, 5400, 5600, 5800],
    ['Wells Fargo Checking', 'deposits', 'Checking Account', 2500, 2600, 2700, 2800, 2900],
    ['Vanguard 401k', 'investments', '401(k)', 45000, 47000, 48000, 49000, 50000],
    ['Fidelity IRA', 'investments', 'IRA', 25000, 26000, 27000, 28000, 29000]
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
    { width: 18 }, // Sub-type column
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
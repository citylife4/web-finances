# XLSX Import Feature

## Overview

The XLSX import feature allows you to import financial data from Excel files using a reverse table format where banks/wallets are rows and months/years are columns.

## File Format Requirements

### Required Structure

Your XLSX file must follow this specific format:

1. **First column**: Bank/Wallet names
2. **Second row**: Account types (`deposits` or `investments`)
3. **Third row**: Account categories (e.g., `Checking Account`, `401(k)`, `IRA`)
4. **Remaining columns**: Month/Year headers (e.g., `Jan/2023`, `Feb/2023`)

### Example Layout

| Bank/Wallet     | Jan/2023 | Feb/2023 | Mar/2023 |
|-----------------|----------|----------|----------|
| **deposits**    | deposits | deposits | investments |
| **Checking Account** | Checking Account | Savings Account | 401(k) |
| Chase Bank      | 1500     | 1600     | 0        |
| Wells Fargo     | 2500     | 2600     | 5000     |
| Vanguard 401k   | 0        | 0        | 45000    |

## Supported Date Formats

The importer supports various month/year formats:
- `Jan/2023`
- `January 2023`
- `01/2023`
- `1/2023`

## Account Types

- **deposits**: For checking accounts, savings accounts, money market accounts, etc.
- **investments**: For 401(k), IRA, stock portfolios, mutual funds, etc.

## Import Process

1. Navigate to the **Import Data** page
2. Download the example file to understand the format
3. Prepare your XLSX file following the required structure
4. Upload your file using drag-and-drop or file selection
5. Review the preview of accounts and entries to be imported
6. Click **Import Data** to complete the process

## Data Validation

The importer validates:
- File format (must be .xlsx or .xls)
- Required rows and columns
- Date format parsing
- Numeric values for amounts
- Account type validation

## Error Handling

If there are issues with your file, you'll receive specific error messages indicating:
- Missing required rows
- Invalid date formats
- Non-numeric amount values
- File format issues

## Security Note

⚠️ **Security Notice**: The xlsx library used for parsing has known security vulnerabilities. This feature should only be used with trusted files in controlled environments.

## Tips for Success

1. Use the provided example file as a template
2. Ensure all amount values are numeric
3. Use consistent date formatting across all columns
4. Leave cells empty (not zero) for accounts that don't have balances in specific months
5. Double-check account types are either "deposits" or "investments"
6. Use standard category names that match your account management system
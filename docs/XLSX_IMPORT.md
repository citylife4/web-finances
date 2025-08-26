# XLSX Import Feature

## Overview

The XLSX import feature allows you to import financial data from Excel files using a tabular format where each row represents an account with its type and monthly balance data.

## File Format Requirements

### Required Structure

Your XLSX file must follow this specific format:

1. **First column**: Bank/Wallet names
2. **Second column**: Account type (`deposits` or `investments`)
3. **Third column**: Account sub-type (e.g., `Checking Account`, `401(k)`, `IRA`)
4. **Remaining columns**: Month/Year headers (e.g., `Jan/2023`, `Feb/2023`)

### Example Layout

| Bank/Wallet | Type | Sub-type | Jan/2023 | Feb/2023 |
|-------------|------|----------|----------|----------|
| Bank A | deposits | Checking Account | 100 | 150 |
| Bank B | investments | 401(k) | 200 | 250 |
| Wallet X | deposits | Savings Account | 50 | 60 |

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
- Required header row
- Date format parsing
- Numeric values for amounts
- Account type validation (must be 'deposits' or 'investments')

## Error Handling

If there are issues with your file, you'll receive specific error messages indicating:
- Missing header row
- Invalid date formats
- Non-numeric amount values
- Invalid account types
- File format issues

## Security Note

⚠️ **Security Notice**: The xlsx library used for parsing has known security vulnerabilities. This feature should only be used with trusted files in controlled environments.

## Tips for Success

1. Use the provided example file as a template
2. Ensure all amount values are numeric
3. Use consistent date formatting across all columns
4. Leave cells empty (not zero) for accounts that don't have balances in specific months
5. Use account types "deposits" or "investments" only
6. Use descriptive sub-type names that match your account management system
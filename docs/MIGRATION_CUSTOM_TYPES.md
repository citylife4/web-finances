# Migration Guide: Custom Category Types

This guide explains how to migrate an existing finance-tracker installation from hardcoded category types ("deposits" and "investments") to the new dynamic category type system.

## Overview

The new system allows users to create custom category types beyond just "deposits" and "investments". Category types can now have:
- Custom names (e.g., "liabilities", "assets", "real-estate")
- Display names for UI
- Custom colors for visual distinction
- Icons/emojis
- Descriptions

## Prerequisites

- Node.js v24 or higher
- Running MongoDB instance
- Access to the application database

## Migration Steps

### Step 1: Backup Your Database

**IMPORTANT**: Before running any migration, backup your MongoDB database:

```bash
# Create a backup directory
mkdir -p backups

# Backup the database
mongodump --db finance-tracker --out backups/pre-migration-$(date +%Y%m%d)
```

### Step 2: Run the Migration Script

The migration script will:
1. Create two default category types: "deposits" and "investments"
2. Update existing categories to reference the new CategoryType
3. Update existing accounts to reference the new CategoryType

```bash
cd backend/src
node migrate-to-custom-types.js
```

Expected output:
```
Connecting to MongoDB...
Connected to MongoDB

1. Creating default category types...
Created "deposits" type
Created "investments" type

2. Migrating existing categories...
Found X categories to migrate
Migrated category: Checking Account (deposits)
Migrated category: 401k (investments)
...

3. Migrating existing accounts...
Found Y accounts to migrate
Migrated account: Bank A (deposits)
Migrated account: Brokerage X (investments)
...

✅ Migration completed successfully!

MongoDB connection closed
Migration script finished
```

### Step 3: Verify Migration

1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Check the API**:
   ```bash
   # Test category types endpoint
   curl http://localhost:3001/api/category-types
   
   # Should return:
   # [
   #   {
   #     "_id": "...",
   #     "name": "deposits",
   #     "displayName": "Deposits",
   #     "color": "#4CAF50",
   #     "icon": "💰",
   #     "isSystem": true
   #   },
   #   {
   #     "_id": "...",
   #     "name": "investments",
   #     "displayName": "Investments",
   #     "color": "#2196F3",
   #     "icon": "📈",
   #     "isSystem": true
   #   }
   # ]
   ```

3. **Verify accounts and categories**:
   ```bash
   # Check accounts have typeId
   curl http://localhost:3001/api/accounts
   
   # Check categories have typeId
   curl http://localhost:3001/api/categories
   ```

4. **Test the frontend**:
   ```bash
   # In project root
   npm run dev
   ```
   
   Navigate to http://localhost:5173 and verify:
   - Dashboard loads correctly
   - Accounts display correctly
   - Categories display correctly
   - Monthly entry form works
   - Charts render with data

### Step 4: Test Custom Type Creation

1. Navigate to **Category Types** in the navigation menu
2. Create a new category type:
   - Name: `liabilities` (lowercase, no spaces)
   - Display Name: `Liabilities`
   - Color: Choose a color
   - Icon: 💳
   - Description: "Credit cards, loans, and other liabilities"

3. Navigate to **Categories**
4. Create a category with the new type
5. Navigate to **Manage Accounts**
6. Create an account with the new type

## Rollback Procedure

If you need to rollback the migration:

1. **Stop all services**:
   ```bash
   # Stop backend
   pkill -f "node.*server.js"
   
   # Stop frontend
   pkill -f "vite"
   ```

2. **Restore database backup**:
   ```bash
   mongorestore --db finance-tracker --drop backups/pre-migration-YYYYMMDD/finance-tracker
   ```

3. **Checkout previous code version**:
   ```bash
   git checkout <commit-before-migration>
   ```

4. **Restart services**:
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Frontend (separate terminal)
   npm run dev
   ```

## Post-Migration Notes

### Backward Compatibility

- The `type` field in Account and Category models is kept for backward compatibility
- Existing API endpoints continue to work
- Old data format is still readable

### System Types

The default types (deposits, investments) are marked as `isSystem: true` and have special protections:
- Cannot be deleted
- Name cannot be changed (only displayName, color, icon, description)

### Creating New Types

Users can create unlimited custom types through the UI or API:

```bash
curl -X POST http://localhost:3001/api/category-types \
  -H "Content-Type: application/json" \
  -d '{
    "name": "real-estate",
    "displayName": "Real Estate",
    "color": "#FF5722",
    "icon": "🏠",
    "description": "Properties and real estate investments"
  }'
```

## Troubleshooting

### Migration Script Fails

**Problem**: Script fails with "Connection refused"

**Solution**: Ensure MongoDB is running:
```bash
# Check if MongoDB is running
systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS

# Start MongoDB if needed
systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

**Problem**: "typeId is required" errors

**Solution**: Re-run the migration script. It's idempotent and safe to run multiple times.

### Charts Not Displaying

**Problem**: Dashboard charts show no data after migration

**Solution**: 
1. Clear browser cache and reload
2. Check browser console for errors
3. Verify analytics endpoint returns correct data:
   ```bash
   curl http://localhost:3001/api/entries/analytics/totals
   ```

### Import Fails with Type Error

**Problem**: Excel import fails with "Invalid account type" error

**Solution**: Update your Excel file to use the correct type names (lowercase):
- Old: "Deposits", "Investments"
- New: "deposits", "investments", or any custom type name you created

## Support

If you encounter issues not covered in this guide:
1. Check application logs
2. Verify MongoDB is running and accessible
3. Ensure all dependencies are installed (`npm install`)
4. Check GitHub issues for similar problems

## Migration Checklist

- [ ] Database backup created
- [ ] Migration script executed successfully
- [ ] API endpoints verified
- [ ] Frontend loads without errors
- [ ] Accounts display correctly
- [ ] Categories display correctly
- [ ] Monthly entries work
- [ ] Charts render with data
- [ ] Import functionality tested
- [ ] Custom type creation tested

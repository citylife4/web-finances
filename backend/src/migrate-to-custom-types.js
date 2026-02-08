const mongoose = require('mongoose');
const { CategoryType, Category, Account } = require('./models');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-tracker';

async function migrateToCustomTypes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Step 1: Create default category types if they don't exist
    console.log('\n1. Creating default category types...');
    
    let depositsType = await CategoryType.findOne({ name: 'deposits' });
    if (!depositsType) {
      depositsType = await CategoryType.create({
        name: 'deposits',
        displayName: 'Deposits',
        description: 'Savings accounts, checking accounts, and other deposit accounts',
        color: '#4CAF50',
        icon: '💰',
        isSystem: true
      });
      console.log('Created "deposits" type');
    } else {
      console.log('"deposits" type already exists');
    }

    let investmentsType = await CategoryType.findOne({ name: 'investments' });
    if (!investmentsType) {
      investmentsType = await CategoryType.create({
        name: 'investments',
        displayName: 'Investments',
        description: 'Stocks, bonds, mutual funds, and other investment accounts',
        color: '#2196F3',
        icon: '📈',
        isSystem: true
      });
      console.log('Created "investments" type');
    } else {
      console.log('"investments" type already exists');
    }

    // Step 2: Migrate existing categories
    console.log('\n2. Migrating existing categories...');
    
    const categoriesWithoutTypeId = await Category.find({ typeId: { $exists: false } });
    console.log(`Found ${categoriesWithoutTypeId.length} categories to migrate`);
    
    for (const category of categoriesWithoutTypeId) {
      const typeId = category.type === 'deposits' ? depositsType._id : investmentsType._id;
      await Category.updateOne(
        { _id: category._id },
        { $set: { typeId } }
      );
      console.log(`Migrated category: ${category.name} (${category.type})`);
    }

    // Step 3: Migrate existing accounts
    console.log('\n3. Migrating existing accounts...');
    
    const accountsWithoutTypeId = await Account.find({ typeId: { $exists: false } });
    console.log(`Found ${accountsWithoutTypeId.length} accounts to migrate`);
    
    for (const account of accountsWithoutTypeId) {
      const typeId = account.type === 'deposits' ? depositsType._id : investmentsType._id;
      await Account.updateOne(
        { _id: account._id },
        { $set: { typeId } }
      );
      console.log(`Migrated account: ${account.name} (${account.type})`);
    }

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  migrateToCustomTypes()
    .then(() => {
      console.log('\nMigration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nMigration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToCustomTypes };

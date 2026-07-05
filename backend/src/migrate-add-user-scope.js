/**
 * Migration: assign existing data to a user.
 *
 * Accounts, categories, category types and monthly entries created before
 * per-user data isolation have no userId. This script assigns them to an
 * existing user so they stay visible after upgrading.
 *
 * Usage:
 *   node src/migrate-add-user-scope.js                  # works if exactly one user exists
 *   MIGRATE_USER_EMAIL=you@example.com node src/migrate-add-user-scope.js
 */
const mongoose = require('mongoose');
const config = require('./config');
const { User, Account, Category, CategoryType, MonthlyEntry } = require('./models');

async function migrate() {
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to MongoDB');

  let user;
  if (process.env.MIGRATE_USER_EMAIL) {
    user = await User.findOne({ email: process.env.MIGRATE_USER_EMAIL.toLowerCase() });
    if (!user) {
      throw new Error(`No user found with email ${process.env.MIGRATE_USER_EMAIL}`);
    }
  } else {
    const users = await User.find().limit(2);
    if (users.length === 0) {
      throw new Error('No users exist. Register a user first, then re-run this migration.');
    }
    if (users.length > 1) {
      throw new Error('Multiple users exist. Set MIGRATE_USER_EMAIL to choose the owner of the existing data.');
    }
    user = users[0];
  }

  console.log(`Assigning unowned data to ${user.email}`);

  const results = await Promise.all([
    Account.updateMany({ userId: { $exists: false } }, { $set: { userId: user._id } }),
    Category.updateMany({ userId: { $exists: false } }, { $set: { userId: user._id } }),
    MonthlyEntry.updateMany({ userId: { $exists: false } }, { $set: { userId: user._id } }),
    // Custom (non-system) category types become the user's; system types stay shared
    CategoryType.updateMany(
      { userId: { $exists: false }, isSystem: { $ne: true } },
      { $set: { userId: user._id } }
    ),
    CategoryType.updateMany(
      { userId: { $exists: false }, isSystem: true },
      { $set: { userId: null } }
    )
  ]);

  const [accounts, categories, entries, customTypes, systemTypes] = results.map(r => r.modifiedCount);
  console.log(`Updated: ${accounts} accounts, ${categories} categories, ${entries} entries, ${customTypes} custom types, ${systemTypes} system types`);

  // Rebuild indexes to match the new schemas (drops stale unique indexes)
  for (const model of [Account, Category, CategoryType, MonthlyEntry]) {
    await model.syncIndexes();
    console.log(`Synced indexes for ${model.modelName}`);
  }

  await mongoose.connection.close();
  console.log('Migration complete');
}

migrate().catch(async (error) => {
  console.error('Migration failed:', error.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});

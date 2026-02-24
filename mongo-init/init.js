print('Starting database initialization...');

db = db.getSiblingDB('finance-tracker');

db.createCollection('users');
db.createCollection('categorytypes');
db.createCollection('accounts');
db.createCollection('categories');
db.createCollection('monthlyentries');

// Indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.accounts.createIndex({ userId: 1 });
db.accounts.createIndex({ typeId: 1 });
db.accounts.createIndex({ categoryId: 1 });
db.categories.createIndex({ userId: 1 });
db.categories.createIndex({ name: 1, typeId: 1, userId: 1 }, { unique: true });
db.monthlyentries.createIndex({ accountId: 1, month: 1 }, { unique: true });
db.monthlyentries.createIndex({ month: 1 });
db.monthlyentries.createIndex({ userId: 1 });
db.categorytypes.createIndex({ name: 1 }, { unique: true });

print('Database initialization completed.');

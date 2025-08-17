// MongoDB initialization script
print('Starting database initialization...');

// Switch to the finance-tracker database
db = db.getSiblingDB('finance-tracker');

// Create collections with validation
db.createCollection('accounts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'type', 'category'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Account name is required and must be a string'
        },
        type: {
          bsonType: 'string',
          enum: ['deposits', 'investments'],
          description: 'Account type must be either deposits or investments'
        },
        category: {
          bsonType: 'string',
          description: 'Account category is required and must be a string'
        },
        description: {
          bsonType: 'string',
          description: 'Account description must be a string'
        }
      }
    }
  }
});

db.createCollection('monthlyentries', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['accountId', 'month', 'amount'],
      properties: {
        accountId: {
          bsonType: 'objectId',
          description: 'Account ID is required and must be an ObjectId'
        },
        month: {
          bsonType: 'string',
          pattern: '^[0-9]{4}-[0-9]{2}$',
          description: 'Month must be in YYYY-MM format'
        },
        amount: {
          bsonType: 'number',
          minimum: 0,
          description: 'Amount must be a positive number'
        }
      }
    }
  }
});

// Create indexes for better performance
db.accounts.createIndex({ name: 1, type: 1 });
db.monthlyentries.createIndex({ accountId: 1, month: 1 }, { unique: true });
db.monthlyentries.createIndex({ month: 1 });

print('Database initialization completed successfully!');

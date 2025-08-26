// Database factory - creates appropriate database adapter based on configuration
const MongoAdapter = require('./adapters/mongodb');
const OracleAdapter = require('./adapters/oracle');

class DatabaseFactory {
  static async createAdapter() {
    const dbType = process.env.DB_TYPE || 'mongodb';
    
    switch (dbType.toLowerCase()) {
      case 'oracle':
        return new OracleAdapter();
      case 'mongodb':
      default:
        return new MongoAdapter();
    }
  }
}

module.exports = DatabaseFactory;
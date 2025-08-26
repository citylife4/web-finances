const BaseAdapter = require('./base');
const oracledb = require('oracledb');

class OracleAdapter extends BaseAdapter {
  constructor() {
    super();
    this.connection = null;
  }

  async connect() {
    try {
      // Oracle Autonomous Database connection configuration
      const config = {
        user: process.env.ORACLE_USER || 'ADMIN',
        password: process.env.ORACLE_PASSWORD,
        connectString: process.env.ORACLE_CONNECTION_STRING,
        // For Autonomous Database, typically need wallet configuration
        walletLocation: process.env.ORACLE_WALLET_LOCATION,
        walletPassword: process.env.ORACLE_WALLET_PASSWORD
      };

      // If using Oracle Instant Client with wallet
      if (config.walletLocation && config.walletPassword) {
        oracledb.initOracleClient({ 
          configDir: config.walletLocation 
        });
      }

      this.connection = await oracledb.getConnection(config);
      console.log('Connected to Oracle Autonomous Database');
      
      // Initialize schema if needed
      await this.initializeSchema();
    } catch (error) {
      console.error('Oracle connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  async initializeSchema() {
    // Create tables if they don't exist
    const createAccountsTable = `
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE accounts (
          id VARCHAR2(36) DEFAULT SYS_GUID() PRIMARY KEY,
          name VARCHAR2(255) NOT NULL,
          type VARCHAR2(50) NOT NULL CHECK (type IN (''deposits'', ''investments'')),
          category VARCHAR2(255) NOT NULL,
          description CLOB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -955 THEN -- Table already exists
            RAISE;
          END IF;
      END;`;

    const createEntriesTable = `
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE monthly_entries (
          id VARCHAR2(36) DEFAULT SYS_GUID() PRIMARY KEY,
          account_id VARCHAR2(36) NOT NULL,
          month VARCHAR2(7) NOT NULL CHECK (REGEXP_LIKE(month, ''^[0-9]{4}-[0-9]{2}$'')),
          amount NUMBER(15,2) NOT NULL CHECK (amount >= 0),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
          CONSTRAINT uk_account_month UNIQUE (account_id, month)
        )';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -955 THEN -- Table already exists
            RAISE;
          END IF;
      END;`;

    const createIndexes = `
      BEGIN
        EXECUTE IMMEDIATE 'CREATE INDEX idx_accounts_name_type ON accounts(name, type)';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -955 THEN -- Index already exists
            RAISE;
          END IF;
      END;`;

    const createUpdateTriggers = `
      CREATE OR REPLACE TRIGGER accounts_update_trigger
        BEFORE UPDATE ON accounts
        FOR EACH ROW
      BEGIN
        :NEW.updated_at := CURRENT_TIMESTAMP;
      END;
      /
      
      CREATE OR REPLACE TRIGGER entries_update_trigger
        BEFORE UPDATE ON monthly_entries
        FOR EACH ROW
      BEGIN
        :NEW.updated_at := CURRENT_TIMESTAMP;
      END;`;

    try {
      await this.connection.execute(createAccountsTable);
      await this.connection.execute(createEntriesTable);
      await this.connection.execute(createIndexes);
      await this.connection.execute(createUpdateTriggers);
      await this.connection.commit();
    } catch (error) {
      console.error('Schema initialization error:', error);
      // Don't throw - tables might already exist
    }
  }

  async getAccounts() {
    const result = await this.connection.execute(
      `SELECT id, name, type, category, description, created_at, updated_at 
       FROM accounts 
       ORDER BY created_at DESC`
    );
    
    return result.rows.map(row => ({
      _id: row[0],
      name: row[1],
      type: row[2],
      category: row[3],
      description: row[4],
      createdAt: row[5],
      updatedAt: row[6]
    }));
  }

  async createAccount(accountData) {
    const { name, type, category, description } = accountData;
    const id = this.generateId();
    
    await this.connection.execute(
      `INSERT INTO accounts (id, name, type, category, description) 
       VALUES (:id, :name, :type, :category, :description)`,
      { id, name, type, category, description: description || null }
    );
    
    await this.connection.commit();
    
    // Return the created account
    const result = await this.connection.execute(
      `SELECT id, name, type, category, description, created_at, updated_at 
       FROM accounts WHERE id = :id`,
      { id }
    );
    
    const row = result.rows[0];
    return {
      _id: row[0],
      name: row[1],
      type: row[2],
      category: row[3],
      description: row[4],
      createdAt: row[5],
      updatedAt: row[6]
    };
  }

  async updateAccount(id, updates) {
    const { name, type, category, description } = updates;
    
    await this.connection.execute(
      `UPDATE accounts 
       SET name = :name, type = :type, category = :category, description = :description 
       WHERE id = :id`,
      { id, name, type, category, description }
    );
    
    await this.connection.commit();
    
    // Return the updated account
    const result = await this.connection.execute(
      `SELECT id, name, type, category, description, created_at, updated_at 
       FROM accounts WHERE id = :id`,
      { id }
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      _id: row[0],
      name: row[1],
      type: row[2],
      category: row[3],
      description: row[4],
      createdAt: row[5],
      updatedAt: row[6]
    };
  }

  async deleteAccount(id) {
    // First get the account to return it
    const accountResult = await this.connection.execute(
      `SELECT id, name, type, category, description, created_at, updated_at 
       FROM accounts WHERE id = :id`,
      { id }
    );
    
    if (accountResult.rows.length === 0) {
      return null;
    }
    
    // Delete the account (cascade will handle entries)
    await this.connection.execute(
      `DELETE FROM accounts WHERE id = :id`,
      { id }
    );
    
    await this.connection.commit();
    
    const row = accountResult.rows[0];
    return {
      _id: row[0],
      name: row[1],
      type: row[2],
      category: row[3],
      description: row[4],
      createdAt: row[5],
      updatedAt: row[6]
    };
  }

  async getEntries() {
    const result = await this.connection.execute(
      `SELECT e.id, e.account_id, e.month, e.amount, e.created_at, e.updated_at,
              a.id as account_id_2, a.name, a.type, a.category, a.description
       FROM monthly_entries e
       JOIN accounts a ON e.account_id = a.id
       ORDER BY e.month DESC, e.created_at DESC`
    );
    
    return result.rows.map(row => ({
      _id: row[0],
      accountId: {
        _id: row[6],
        name: row[7],
        type: row[8],
        category: row[9],
        description: row[10]
      },
      month: row[2],
      amount: row[3],
      createdAt: row[4],
      updatedAt: row[5]
    }));
  }

  async getEntriesByMonth(month) {
    const result = await this.connection.execute(
      `SELECT e.id, e.account_id, e.month, e.amount, e.created_at, e.updated_at,
              a.id as account_id_2, a.name, a.type, a.category, a.description
       FROM monthly_entries e
       JOIN accounts a ON e.account_id = a.id
       WHERE e.month = :month
       ORDER BY e.created_at DESC`,
      { month }
    );
    
    return result.rows.map(row => ({
      _id: row[0],
      accountId: {
        _id: row[6],
        name: row[7],
        type: row[8],
        category: row[9],
        description: row[10]
      },
      month: row[2],
      amount: row[3],
      createdAt: row[4],
      updatedAt: row[5]
    }));
  }

  async createOrUpdateEntry(entryData) {
    const { accountId, month, amount } = entryData;
    
    // Try to update first
    const updateResult = await this.connection.execute(
      `UPDATE monthly_entries 
       SET amount = :amount 
       WHERE account_id = :accountId AND month = :month`,
      { accountId, month, amount }
    );
    
    if (updateResult.rowsAffected === 0) {
      // Insert new entry
      const id = this.generateId();
      await this.connection.execute(
        `INSERT INTO monthly_entries (id, account_id, month, amount) 
         VALUES (:id, :accountId, :month, :amount)`,
        { id, accountId, month, amount }
      );
    }
    
    await this.connection.commit();
    
    // Return the entry with populated account
    const result = await this.connection.execute(
      `SELECT e.id, e.account_id, e.month, e.amount, e.created_at, e.updated_at,
              a.id as account_id_2, a.name, a.type, a.category, a.description
       FROM monthly_entries e
       JOIN accounts a ON e.account_id = a.id
       WHERE e.account_id = :accountId AND e.month = :month`,
      { accountId, month }
    );
    
    const row = result.rows[0];
    return {
      _id: row[0],
      accountId: {
        _id: row[6],
        name: row[7],
        type: row[8],
        category: row[9],
        description: row[10]
      },
      month: row[2],
      amount: row[3],
      createdAt: row[4],
      updatedAt: row[5]
    };
  }

  async deleteEntry(id) {
    const entryResult = await this.connection.execute(
      `SELECT id, account_id, month, amount, created_at, updated_at 
       FROM monthly_entries WHERE id = :id`,
      { id }
    );
    
    if (entryResult.rows.length === 0) {
      return null;
    }
    
    await this.connection.execute(
      `DELETE FROM monthly_entries WHERE id = :id`,
      { id }
    );
    
    await this.connection.commit();
    
    const row = entryResult.rows[0];
    return {
      _id: row[0],
      accountId: row[1],
      month: row[2],
      amount: row[3],
      createdAt: row[4],
      updatedAt: row[5]
    };
  }

  async getMonthlyTotals() {
    const result = await this.connection.execute(
      `SELECT e.month,
              SUM(CASE WHEN a.type = 'deposits' THEN e.amount ELSE 0 END) as deposits,
              SUM(CASE WHEN a.type = 'investments' THEN e.amount ELSE 0 END) as investments,
              SUM(e.amount) as total
       FROM monthly_entries e
       JOIN accounts a ON e.account_id = a.id
       GROUP BY e.month
       ORDER BY e.month`
    );
    
    return result.rows.map(row => ({
      month: row[0],
      deposits: row[1],
      investments: row[2],
      total: row[3]
    }));
  }

  generateId() {
    // Generate a simple UUID-like string for Oracle
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

module.exports = OracleAdapter;
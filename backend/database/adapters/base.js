// Base database adapter interface
class BaseAdapter {
  async connect() {
    throw new Error('connect() method must be implemented');
  }

  async disconnect() {
    throw new Error('disconnect() method must be implemented');
  }

  async getAccounts() {
    throw new Error('getAccounts() method must be implemented');
  }

  async createAccount(accountData) {
    throw new Error('createAccount() method must be implemented');
  }

  async updateAccount(id, updates) {
    throw new Error('updateAccount() method must be implemented');
  }

  async deleteAccount(id) {
    throw new Error('deleteAccount() method must be implemented');
  }

  async getEntries() {
    throw new Error('getEntries() method must be implemented');
  }

  async getEntriesByMonth(month) {
    throw new Error('getEntriesByMonth() method must be implemented');
  }

  async createOrUpdateEntry(entryData) {
    throw new Error('createOrUpdateEntry() method must be implemented');
  }

  async updateEntry(id, updates) {
    throw new Error('updateEntry() method must be implemented');
  }

  async deleteEntry(id) {
    throw new Error('deleteEntry() method must be implemented');
  }

  async getMonthlyTotals() {
    throw new Error('getMonthlyTotals() method must be implemented');
  }
}

module.exports = BaseAdapter;
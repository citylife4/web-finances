const BaseAdapter = require('./base');
const mongoose = require('mongoose');
const Account = require('../../models/Account');
const MonthlyEntry = require('../../models/MonthlyEntry');

class MongoAdapter extends BaseAdapter {
  constructor() {
    super();
    this.connected = false;
  }

  async connect() {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-tracker';
    
    try {
      await mongoose.connect(MONGODB_URI);
      this.connected = true;
      console.log('Connected to MongoDB');
    } catch (error) {
      this.connected = false;
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    this.connected = false;
  }

  async getAccounts() {
    if (!this.connected) {
      return [];
    }
    return await Account.find().sort({ createdAt: -1 });
  }

  async createAccount(accountData) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    const account = new Account(accountData);
    return await account.save();
  }

  async updateAccount(id, updates) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    return await Account.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
  }

  async deleteAccount(id) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    const account = await Account.findByIdAndDelete(id);
    if (account) {
      // Also delete all related monthly entries
      await MonthlyEntry.deleteMany({ accountId: id });
    }
    return account;
  }

  async getEntries() {
    if (!this.connected) {
      return [];
    }
    return await MonthlyEntry.find()
      .populate('accountId')
      .sort({ month: -1, createdAt: -1 });
  }

  async getEntriesByMonth(month) {
    if (!this.connected) {
      return [];
    }
    return await MonthlyEntry.find({ month })
      .populate('accountId')
      .sort({ createdAt: -1 });
  }

  async createOrUpdateEntry(entryData) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    const { accountId, month, amount } = entryData;
    
    return await MonthlyEntry.findOneAndUpdate(
      { accountId, month },
      { amount },
      { upsert: true, new: true, runValidators: true }
    ).populate('accountId');
  }

  async deleteEntry(id) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    return await MonthlyEntry.findByIdAndDelete(id);
  }

  async getMonthlyTotals() {
    if (!this.connected) {
      return [];
    }
    const aggregation = await MonthlyEntry.aggregate([
      {
        $lookup: {
          from: 'accounts',
          localField: 'accountId',
          foreignField: '_id',
          as: 'account'
        }
      },
      {
        $unwind: '$account'
      },
      {
        $group: {
          _id: {
            month: '$month',
            type: '$account.type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.month',
          deposits: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'deposits'] }, '$total', 0]
            }
          },
          investments: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'investments'] }, '$total', 0]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return aggregation.map(item => ({
      month: item._id,
      deposits: item.deposits,
      investments: item.investments,
      total: item.deposits + item.investments
    }));
  }
}

module.exports = MongoAdapter;
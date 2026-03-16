const express = require('express');
const router = express.Router();
const { MonthlyEntry, Account, CategoryType } = require('../models');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const entries = await MonthlyEntry.find({ userId: req.userId })
      .populate('accountId', 'name typeId categoryId')
      .sort({ month: -1, createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

router.get('/month/:month', async (req, res) => {
  try {
    const { month } = req.params;
    
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }
    
    const entries = await MonthlyEntry.find({ month, userId: req.userId })
      .populate('accountId', 'name typeId categoryId')
      .sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: 'Entries must be an array' });
    }

    if (entries.length === 0) {
      return res.status(400).json({ error: 'Entries array cannot be empty' });
    }

    const accountIds = new Set();
    for (let i = 0; i < entries.length; i++) {
      const { accountId, month, amount } = entries[i] || {};

      if (!accountId || typeof accountId !== 'string' || !mongoose.Types.ObjectId.isValid(accountId)) {
        return res.status(400).json({ error: `Invalid accountId at index ${i}` });
      }

      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: `Invalid month format at index ${i}. Use YYYY-MM` });
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount)) {
        return res.status(400).json({ error: `Invalid amount at index ${i}. Must be a valid number.` });
      }

      accountIds.add(accountId);
    }

    const accounts = await Account.find({ 
      _id: { $in: Array.from(accountIds) },
      userId: req.userId
    }).select('_id name');
    
    const accountMap = new Map(accounts.map(acc => [acc._id.toString(), acc]));

    for (const accountId of accountIds) {
      if (!accountMap.has(accountId)) {
        return res.status(400).json({ error: `Account ${accountId} not found` });
      }
    }

    const bulkOps = entries.map(({ accountId, month, amount }) => ({
      updateOne: {
        filter: { accountId, month, userId: req.userId },
        update: { $set: { amount: Number(amount) }, $setOnInsert: { userId: req.userId } },
        upsert: true
      }
    }));

    await MonthlyEntry.bulkWrite(bulkOps);

    const monthsToFetch = [...new Set(entries.map(e => e.month))];
    const results = await MonthlyEntry.find({
      accountId: { $in: Array.from(accountIds) },
      month: { $in: monthsToFetch },
      userId: req.userId
    }).populate('accountId', 'name typeId');

    res.status(201).json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save entries' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }
    
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
      return res.status(400).json({ error: 'Amount must be a valid number' });
    }
    
    const entry = await MonthlyEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { amount: numAmount },
      { new: true, runValidators: true }
    ).populate('accountId', 'name typeId categoryId');
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }

    const entry = await MonthlyEntry.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

router.get('/analytics/totals', async (req, res) => {
  try {
    const userAccounts = await Account.find({ userId: req.userId }).select('_id');
    const userAccountIds = userAccounts.map(a => a._id);

    const categoryTypes = await CategoryType.find();
    
    const pipeline = [
      {
        $match: {
          accountId: { $in: userAccountIds }
        }
      },
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
        $lookup: {
          from: 'categorytypes',
          localField: 'account.typeId',
          foreignField: '_id',
          as: 'categoryType'
        }
      },
      {
        $unwind: '$categoryType'
      },
      {
        $group: {
          _id: {
            month: '$month',
            typeId: '$categoryType._id',
            typeName: '$categoryType.name'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.month',
          typeBreakdown: {
            $push: {
              typeId: '$_id.typeId',
              typeName: '$_id.typeName',
              total: '$total'
            }
          }
        }
      },
      {
        $project: {
          month: '$_id',
          typeBreakdown: 1,
          total: { $sum: '$typeBreakdown.total' },
          _id: 0
        }
      },
      {
        $sort: { month: 1 }
      }
    ];
    
    const totals = await MonthlyEntry.aggregate(pipeline);
    res.json(totals);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;

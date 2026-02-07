const express = require('express');
const router = express.Router();
const { MonthlyEntry, Account } = require('../models');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// GET /api/entries - Get all monthly entries
router.get('/', async (req, res) => {
  try {
    const entries = await MonthlyEntry.find()
      .populate('accountId', 'name type category')
      .sort({ month: -1, createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// GET /api/entries/month/:month - Get entries for a specific month
router.get('/month/:month', async (req, res) => {
  try {
    const { month } = req.params;
    
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }
    
    const entries = await MonthlyEntry.find({ month })
      .populate('accountId', 'name type category')
      .sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// POST /api/entries - Create or update monthly entries (batch)
router.post('/', async (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: 'Entries must be an array' });
    }

    if (entries.length === 0) {
      return res.status(400).json({ error: 'Entries array cannot be empty' });
    }

    // Validate all entries first
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
      // Allow negative amounts for credit cards, loans, debts, etc.

      accountIds.add(accountId);
    }

    // Batch fetch all accounts at once (fixes N+1 query problem)
    const accounts = await Account.find({ 
      _id: { $in: Array.from(accountIds) } 
    }).select('_id name');
    
    const accountMap = new Map(accounts.map(acc => [acc._id.toString(), acc]));

    // Verify all accounts exist
    for (const accountId of accountIds) {
      if (!accountMap.has(accountId)) {
        return res.status(400).json({ error: `Account ${accountId} not found` });
      }
    }

    // Prepare bulk operations
    const bulkOps = entries.map(({ accountId, month, amount }) => ({
      updateOne: {
        filter: { accountId, month },
        update: { $set: { amount: Number(amount) } },
        upsert: true
      }
    }));

    // Execute bulk operation
    await MonthlyEntry.bulkWrite(bulkOps);

    // Fetch and return the updated entries
    const monthsToFetch = [...new Set(entries.map(e => e.month))];
    const results = await MonthlyEntry.find({
      accountId: { $in: Array.from(accountIds) },
      month: { $in: monthsToFetch }
    }).populate('accountId', 'name type');

    res.status(201).json(results);
  } catch (error) {
    console.error('Error saving entries:', error);
    res.status(500).json({ error: 'Failed to save entries' });
  }
});

// PUT /api/entries/:id - Update a monthly entry
router.put('/:id', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
      return res.status(400).json({ error: 'Amount must be a valid number' });
    }
    // Allow negative amounts for credit cards, loans, debts, etc.
    
    const entry = await MonthlyEntry.findByIdAndUpdate(
      req.params.id,
      { amount: numAmount },
      { new: true, runValidators: true }
    ).populate('accountId', 'name type category');
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// DELETE /api/entries/:id - Delete a monthly entry
router.delete('/:id', async (req, res) => {
  try {
    const entry = await MonthlyEntry.findByIdAndDelete(req.params.id);
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// GET /api/entries/analytics/totals - Get monthly totals for analytics
router.get('/analytics/totals', async (req, res) => {
  try {
    const pipeline = [
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
              $cond: [
                { $eq: ['$_id.type', 'deposits'] },
                '$total',
                0
              ]
            }
          },
          investments: {
            $sum: {
              $cond: [
                { $eq: ['$_id.type', 'investments'] },
                '$total',
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          month: '$_id',
          deposits: 1,
          investments: 1,
          total: { $add: ['$deposits', '$investments'] },
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
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;

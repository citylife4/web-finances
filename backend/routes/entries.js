const express = require('express');
const router = express.Router();
const MonthlyEntry = require('../models/MonthlyEntry');
const Account = require('../models/Account');
const mongoose = require('mongoose');

// GET /api/entries - Get all monthly entries
router.get('/', async (req, res) => {
  try {
    const entries = await MonthlyEntry.find()
      .populate('accountId', 'name type category')
      .sort({ month: -1, createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/entries/month/:month - Get entries for a specific month
router.get('/month/:month', async (req, res) => {
  try {
    const entries = await MonthlyEntry.find({ month: req.params.month })
      .populate('accountId', 'name type category')
      .sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/entries - Create or update monthly entries
router.post('/', async (req, res) => {
  try {
    const { entries } = req.body; // Array of { accountId, month, amount }

    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: 'Entries must be an array' });
    }

    // Log incoming payload (trimmed) to help debugging large imports
    console.log(`POST /api/entries received ${entries.length} entries`);
    if (entries.length > 0) {
      console.log('First entry:', JSON.stringify(entries[0], null, 2));
    }

    const results = [];

    for (let i = 0; i < entries.length; i++) {
      const entryData = entries[i];
      const { accountId, month, amount } = entryData || {};

      // Basic validation with helpful error messages
      if (!accountId || typeof accountId !== 'string' || !mongoose.Types.ObjectId.isValid(accountId)) {
        console.error(`Invalid accountId at index ${i}:`, accountId);
        return res.status(400).json({ error: `Invalid accountId at index ${i}: ${accountId}` });
      }

      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        console.error(`Invalid month at index ${i}:`, month);
        return res.status(400).json({ error: `Invalid month format at index ${i}: ${month}` });
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < 0) {
        console.error(`Invalid amount at index ${i}:`, amount);
        return res.status(400).json({ error: `Invalid amount at index ${i}: ${amount}` });
      }

      // Verify account exists
      console.log(`Looking for account with ID: ${accountId}`);
      const account = await Account.findById(accountId);
      if (!account) {
        console.error(`Account not found: ${accountId}`);
        return res.status(400).json({ error: `Account ${accountId} not found at index ${i}` });
      }

      console.log(`Found account: ${account.name} (${account.type})`);

      // Update or create entry (upsert)
      const entry = await MonthlyEntry.findOneAndUpdate(
        { accountId, month },
        { amount: numAmount },
        { new: true, upsert: true, runValidators: true }
      );

      results.push(entry);
    }

    console.log(`Successfully processed ${results.length} entries`);
    res.status(201).json(results);
  } catch (error) {
    console.error('Error saving entries:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/entries/:id - Update a monthly entry
router.put('/:id', async (req, res) => {
  try {
    const { amount } = req.body;
    
    const entry = await MonthlyEntry.findByIdAndUpdate(
      req.params.id,
      { amount },
      { new: true, runValidators: true }
    ).populate('accountId', 'name type category');
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

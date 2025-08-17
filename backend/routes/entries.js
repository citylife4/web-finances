const express = require('express');
const router = express.Router();
const MonthlyEntry = require('../models/MonthlyEntry');
const Account = require('../models/Account');

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
    
    const results = [];
    
    for (const entryData of entries) {
      const { accountId, month, amount } = entryData;
      
      // Verify account exists
      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(400).json({ error: `Account ${accountId} not found` });
      }
      
      // Update or create entry (upsert)
      const entry = await MonthlyEntry.findOneAndUpdate(
        { accountId, month },
        { amount },
        { new: true, upsert: true, runValidators: true }
      );
      
      results.push(entry);
    }
    
    res.status(201).json(results);
  } catch (error) {
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

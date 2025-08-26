const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// GET /api/entries - Get all monthly entries
router.get('/', async (req, res) => {
  try {
    const entries = await req.app.locals.db.getEntries();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/entries/month/:month - Get entries for a specific month
router.get('/month/:month', async (req, res) => {
  try {
    const entries = await req.app.locals.db.getEntriesByMonth(req.params.month);
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
      // Check if accountId is a valid MongoDB ObjectId or Oracle UUID format
      if (!accountId || typeof accountId !== 'string') {
        console.error(`Invalid accountId at index ${i}:`, accountId);
        return res.status(400).json({ error: `Invalid accountId at index ${i}: ${accountId}` });
      }
      
      // Validate ID format - either MongoDB ObjectId or UUID format
      const isValidMongoId = mongoose.Types.ObjectId.isValid(accountId);
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId);
      
      if (!isValidMongoId && !isValidUuid) {
        console.error(`Invalid accountId format at index ${i}:`, accountId);
        return res.status(400).json({ error: `Invalid accountId format at index ${i}: ${accountId}` });
      }

      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        console.error(`Invalid month at index ${i}:`, month);
        return res.status(400).json({ error: `Invalid month format at index ${i}: ${month}` });
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount)) {
        console.error(`Invalid amount at index ${i}:`, amount);
        return res.status(400).json({ error: `Invalid amount at index ${i}: ${amount}` });
      }

      // Verify account exists
      console.log(`Looking for account with ID: ${accountId}`);
      const accounts = await req.app.locals.db.getAccounts();
      const account = accounts.find(acc => acc._id === accountId);
      if (!account) {
        console.error(`Account not found: ${accountId}`);
        return res.status(400).json({ error: `Account ${accountId} not found at index ${i}` });
      }

      console.log(`Found account: ${account.name} (${account.type})`);

      // Update or create entry (upsert)
      const entry = await req.app.locals.db.createOrUpdateEntry({ accountId, month, amount: numAmount });
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
    
    const entry = await req.app.locals.db.updateEntry(req.params.id, { amount });
    
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
    const entry = await req.app.locals.db.deleteEntry(req.params.id);
    
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
    const totals = await req.app.locals.db.getMonthlyTotals();
    res.json(totals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

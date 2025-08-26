const express = require('express');
const router = express.Router();

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
    
    const results = [];
    
    for (const entryData of entries) {
      const { accountId, month, amount } = entryData;
      
      // Verify account exists
      const accounts = await req.app.locals.db.getAccounts();
      const account = accounts.find(acc => acc._id === accountId);
      if (!account) {
        return res.status(400).json({ error: `Account ${accountId} not found` });
      }
      
      // Update or create entry (upsert)
      const entry = await req.app.locals.db.createOrUpdateEntry({ accountId, month, amount });
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
    
    // For now, this is a simple implementation - in a more complex system,
    // we'd need to get the entry first, then update it
    const entries = await req.app.locals.db.getEntries();
    const existingEntry = entries.find(e => e._id === req.params.id);
    
    if (!existingEntry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    const updatedEntry = await req.app.locals.db.createOrUpdateEntry({
      accountId: existingEntry.accountId._id,
      month: existingEntry.month,
      amount
    });
    
    res.json(updatedEntry);
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

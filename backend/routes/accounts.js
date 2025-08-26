const express = require('express');
const router = express.Router();

// GET /api/accounts - Get all accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await req.app.locals.db.getAccounts();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/accounts - Create a new account
router.post('/', async (req, res) => {
  try {
    const { name, type, category, description } = req.body;
    
    const accountData = {
      name,
      type,
      category,
      description
    };
    
    const savedAccount = await req.app.locals.db.createAccount(accountData);
    res.status(201).json(savedAccount);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/accounts/:id - Update an account
router.put('/:id', async (req, res) => {
  try {
    const { name, type, category, description } = req.body;
    
    const updates = { name, type, category, description };
    const account = await req.app.locals.db.updateAccount(req.params.id, updates);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json(account);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/accounts/:id - Delete an account
router.delete('/:id', async (req, res) => {
  try {
    const account = await req.app.locals.db.deleteAccount(req.params.id);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json({ message: 'Account and related entries deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

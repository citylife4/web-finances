const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const MonthlyEntry = require('../models/MonthlyEntry');

// GET /api/accounts - Get all accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find().sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/accounts - Create a new account
router.post('/', async (req, res) => {
  try {
    const { name, type, category, description } = req.body;
    
    const account = new Account({
      name,
      type,
      category,
      description
    });
    
    const savedAccount = await account.save();
    res.status(201).json(savedAccount);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/accounts/:id - Update an account
router.put('/:id', async (req, res) => {
  try {
    const { name, type, category, description } = req.body;
    
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { name, type, category, description },
      { new: true, runValidators: true }
    );
    
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
    const account = await Account.findByIdAndDelete(req.params.id);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Also delete all related monthly entries
    await MonthlyEntry.deleteMany({ accountId: req.params.id });
    
    res.json({ message: 'Account and related entries deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

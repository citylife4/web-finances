const express = require('express');
const router = express.Router();
const { Account, MonthlyEntry } = require('../models');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// GET /api/accounts - Get all accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find()
      .populate('categoryId', 'name type')
      .sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// POST /api/accounts - Create a new account
router.post('/', async (req, res) => {
  try {
    const { name, type, categoryId, description } = req.body;
    
    if (!name || !type || !categoryId) {
      return res.status(400).json({ error: 'Name, type, and categoryId are required' });
    }
    
    if (!['deposits', 'investments'].includes(type)) {
      return res.status(400).json({ error: 'Type must be deposits or investments' });
    }
    
    const account = new Account({
      name: name.trim(),
      type,
      categoryId,
      description: description?.trim()
    });
    
    const savedAccount = await account.save();
    const populatedAccount = await Account.findById(savedAccount._id)
      .populate('categoryId', 'name type');
    res.status(201).json(populatedAccount);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// PUT /api/accounts/:id - Update an account
router.put('/:id', async (req, res) => {
  try {
    const { name, type, categoryId, description } = req.body;
    
    if (type && !['deposits', 'investments'].includes(type)) {
      return res.status(400).json({ error: 'Type must be deposits or investments' });
    }
    
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (type) updateData.type = type;
    if (categoryId) updateData.categoryId = categoryId;
    if (description !== undefined) updateData.description = description?.trim();
    
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name type');
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json(account);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update account' });
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
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;

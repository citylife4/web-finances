const express = require('express');
const router = express.Router();
const { Account, CategoryType, Category, MonthlyEntry } = require('../models');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// GET /api/accounts - Get all accounts with populated category and type
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find()
      .populate('categoryId', 'name typeId')
      .populate('typeId', 'name displayName color')
      .sort({ createdAt: -1 });
    
    // Also populate the category's type for backward compatibility
    for (let account of accounts) {
      if (account.categoryId && account.categoryId.typeId) {
        await account.categoryId.populate('typeId', 'name displayName color');
      }
    }
    
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// POST /api/accounts - Create a new account
router.post('/', async (req, res) => {
  try {
    const { name, typeId, categoryId, description } = req.body;
    
    if (!name || !typeId || !categoryId) {
      return res.status(400).json({ error: 'Name, typeId, and categoryId are required' });
    }
    
    // Verify the type exists
    const categoryType = await CategoryType.findById(typeId);
    if (!categoryType) {
      return res.status(400).json({ error: 'Invalid category type' });
    }
    
    // Verify the category exists and matches the type
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    if (category.typeId.toString() !== typeId.toString()) {
      return res.status(400).json({ error: 'Category does not belong to the specified type' });
    }
    
    const account = new Account({
      name: name.trim(),
      typeId,
      type: categoryType.name, // Keep for backward compatibility
      categoryId,
      description: description?.trim()
    });
    
    const savedAccount = await account.save();
    const populatedAccount = await Account.findById(savedAccount._id)
      .populate('categoryId', 'name typeId')
      .populate('typeId', 'name displayName color');
    
    // Populate category's type too
    if (populatedAccount.categoryId) {
      await populatedAccount.categoryId.populate('typeId', 'name displayName color');
    }
    
    res.status(201).json(populatedAccount);
  } catch (error) {
    console.error('Error creating account:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create account', details: error.message });
  }
});

// PUT /api/accounts/:id - Update an account
router.put('/:id', async (req, res) => {
  try {
    const { name, typeId, categoryId, description } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    
    // If typeId is being changed, verify it exists
    if (typeId) {
      const categoryType = await CategoryType.findById(typeId);
      if (!categoryType) {
        return res.status(400).json({ error: 'Invalid category type' });
      }
      updateData.typeId = typeId;
      updateData.type = categoryType.name; // Keep for backward compatibility
    }
    
    // If categoryId is being changed, verify it exists and matches the type
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }
      
      // If both typeId and categoryId are provided, ensure they match
      const targetTypeId = typeId || (await Account.findById(req.params.id)).typeId;
      if (category.typeId.toString() !== targetTypeId.toString()) {
        return res.status(400).json({ error: 'Category does not belong to the specified type' });
      }
      
      updateData.categoryId = categoryId;
    }
    
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('categoryId', 'name typeId')
      .populate('typeId', 'name displayName color');
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Populate category's type too
    if (account.categoryId) {
      await account.categoryId.populate('typeId', 'name displayName color');
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

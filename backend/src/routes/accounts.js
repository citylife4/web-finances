const express = require('express');
const router = express.Router();
const { Account, CategoryType, Category, MonthlyEntry } = require('../models');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

const accountPopulate = [
  {
    path: 'categoryId',
    select: 'name typeId',
    populate: { path: 'typeId', select: 'name displayName color' }
  },
  { path: 'typeId', select: 'name displayName color' }
];

// A category type is visible to a user if it's a system type or their own
const visibleTypeFilter = (userId, typeId) => ({
  _id: typeId,
  $or: [{ isSystem: true }, { userId }]
});

// GET /api/accounts - Get the user's accounts with populated category and type
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.userId })
      .populate(accountPopulate)
      .sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
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

    const categoryType = await CategoryType.findOne(visibleTypeFilter(req.userId, typeId));
    if (!categoryType) {
      return res.status(400).json({ error: 'Invalid category type' });
    }

    const category = await Category.findOne({ _id: categoryId, userId: req.userId });
    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    if (category.typeId.toString() !== typeId.toString()) {
      return res.status(400).json({ error: 'Category does not belong to the specified type' });
    }

    const account = new Account({
      userId: req.userId,
      name: name.trim(),
      typeId,
      type: categoryType.name, // Keep for backward compatibility
      categoryId,
      description: description?.trim()
    });

    const savedAccount = await account.save();
    const populatedAccount = await Account.findById(savedAccount._id).populate(accountPopulate);

    res.status(201).json(populatedAccount);
  } catch (error) {
    console.error('Error creating account:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// PUT /api/accounts/:id - Update an account
router.put('/:id', async (req, res) => {
  try {
    const { name, typeId, categoryId, description } = req.body;

    const existingAccount = await Account.findOne({ _id: req.params.id, userId: req.userId });
    if (!existingAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();

    if (typeId) {
      const categoryType = await CategoryType.findOne(visibleTypeFilter(req.userId, typeId));
      if (!categoryType) {
        return res.status(400).json({ error: 'Invalid category type' });
      }
      updateData.typeId = typeId;
      updateData.type = categoryType.name; // Keep for backward compatibility
    }

    if (categoryId) {
      const category = await Category.findOne({ _id: categoryId, userId: req.userId });
      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }

      const targetTypeId = typeId || existingAccount.typeId;
      if (category.typeId.toString() !== targetTypeId.toString()) {
        return res.status(400).json({ error: 'Category does not belong to the specified type' });
      }

      updateData.categoryId = categoryId;
    }

    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    ).populate(accountPopulate);

    res.json(account);
  } catch (error) {
    console.error('Error updating account:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// DELETE /api/accounts/:id - Delete an account
router.delete('/:id', async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Also delete all related monthly entries
    await MonthlyEntry.deleteMany({ accountId: account._id });

    res.json({ message: 'Account and related entries deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;

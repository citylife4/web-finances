const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Account, CategoryType, Category, MonthlyEntry } = require('../models');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.userId })
      .populate('categoryId', 'name typeId')
      .populate('typeId', 'name displayName color')
      .sort({ createdAt: -1 });
    
    const typeIds = [...new Set(accounts
      .filter(a => a.categoryId?.typeId)
      .map(a => a.categoryId.typeId.toString())
    )];
    const types = await CategoryType.find({ _id: { $in: typeIds } }).select('name displayName color');
    const typeMap = new Map(types.map(t => [t._id.toString(), t]));
    
    for (const account of accounts) {
      if (account.categoryId?.typeId) {
        const typeData = typeMap.get(account.categoryId.typeId.toString());
        if (typeData) account.categoryId.typeId = typeData;
      }
    }
    
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, typeId, categoryId, description } = req.body;
    
    if (!name || !typeId || !categoryId) {
      return res.status(400).json({ error: 'Name, typeId, and categoryId are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(typeId) || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: 'Invalid typeId or categoryId' });
    }
    
    const categoryType = await CategoryType.findById(typeId);
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
      categoryId,
      description: description?.trim()
    });
    
    const savedAccount = await account.save();
    const populatedAccount = await Account.findById(savedAccount._id)
      .populate('categoryId', 'name typeId')
      .populate('typeId', 'name displayName color');
    
    if (populatedAccount.categoryId) {
      await populatedAccount.categoryId.populate('typeId', 'name displayName color');
    }
    
    res.status(201).json(populatedAccount);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, typeId, categoryId, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid account ID' });
    }
    
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    
    if (typeId) {
      if (!mongoose.Types.ObjectId.isValid(typeId)) {
        return res.status(400).json({ error: 'Invalid typeId' });
      }
      const categoryType = await CategoryType.findById(typeId);
      if (!categoryType) {
        return res.status(400).json({ error: 'Invalid category type' });
      }
      updateData.typeId = typeId;
    }
    
    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ error: 'Invalid categoryId' });
      }
      const category = await Category.findOne({ _id: categoryId, userId: req.userId });
      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }
      
      const targetTypeId = typeId || (await Account.findOne({ _id: req.params.id, userId: req.userId }))?.typeId;
      if (category.typeId.toString() !== targetTypeId?.toString()) {
        return res.status(400).json({ error: 'Category does not belong to the specified type' });
      }
      
      updateData.categoryId = categoryId;
    }
    
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('categoryId', 'name typeId')
      .populate('typeId', 'name displayName color');
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
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

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid account ID' });
    }

    const account = await Account.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    await MonthlyEntry.deleteMany({ accountId: req.params.id, userId: req.userId });
    
    res.json({ message: 'Account and related entries deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;

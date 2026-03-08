const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { CategoryType, Category, Account } = require('../models');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const types = await CategoryType.find({
      $or: [{ isSystem: true }, { userId: req.userId }]
    }).sort({ name: 1 });
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category types' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const type = await CategoryType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({ error: 'Category type not found' });
    }
    res.json(type);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category type' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, displayName, description, color, icon } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ error: 'Name and display name are required' });
    }

    const existingType = await CategoryType.findOne({ name: name.toLowerCase() });
    if (existingType) {
      return res.status(400).json({ error: 'A category type with this name already exists' });
    }

    const categoryType = new CategoryType({
      userId: req.userId,
      name: name.toLowerCase(),
      displayName,
      description,
      color: color || '#667eea',
      icon,
      isSystem: false
    });

    await categoryType.save();
    res.status(201).json(categoryType);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A category type with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create category type' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const { displayName, description, color, icon } = req.body;
    
    const type = await CategoryType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({ error: 'Category type not found' });
    }

    if (type.isSystem && req.body.name && req.body.name !== type.name) {
      return res.status(403).json({ error: 'Cannot change name of system category types' });
    }

    if (!type.isSystem && type.userId?.toString() !== req.userId) {
      return res.status(404).json({ error: 'Category type not found' });
    }

    if (displayName) type.displayName = displayName;
    if (description !== undefined) type.description = description;
    if (color) type.color = color;
    if (icon !== undefined) type.icon = icon;

    await type.save();
    res.json(type);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category type' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const type = await CategoryType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({ error: 'Category type not found' });
    }

    if (type.isSystem) {
      return res.status(403).json({ error: 'Cannot delete system category types' });
    }

    if (type.userId?.toString() !== req.userId) {
      return res.status(404).json({ error: 'Category type not found' });
    }

    const categoriesCount = await Category.countDocuments({ typeId: req.params.id });
    if (categoriesCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete: ${categoriesCount} categories are using this type.` 
      });
    }

    const accountsCount = await Account.countDocuments({ typeId: req.params.id });
    if (accountsCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete: ${accountsCount} accounts are using this type.` 
      });
    }

    await CategoryType.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category type deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category type' });
  }
});

module.exports = router;

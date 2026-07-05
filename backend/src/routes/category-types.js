const express = require('express');
const router = express.Router();
const { CategoryType, Category, Account } = require('../models');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// A category type is visible to a user if it's a system type or their own
const visibleTypeFilter = (userId, extra = {}) => ({
  ...extra,
  $or: [{ isSystem: true }, { userId }]
});

// GET /api/category-types - Get all category types visible to the user
router.get('/', async (req, res) => {
  try {
    const types = await CategoryType.find(visibleTypeFilter(req.userId)).sort({ name: 1 });
    res.json(types);
  } catch (error) {
    console.error('Error fetching category types:', error);
    res.status(500).json({ error: 'Failed to fetch category types' });
  }
});

// GET /api/category-types/:id - Get a single category type
router.get('/:id', async (req, res) => {
  try {
    const type = await CategoryType.findOne(visibleTypeFilter(req.userId, { _id: req.params.id }));
    if (!type) {
      return res.status(404).json({ error: 'Category type not found' });
    }
    res.json(type);
  } catch (error) {
    console.error('Error fetching category type:', error);
    res.status(500).json({ error: 'Failed to fetch category type' });
  }
});

// POST /api/category-types - Create a new category type
router.post('/', async (req, res) => {
  try {
    const { name, displayName, description, color, icon } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ error: 'Name and display name are required' });
    }

    // Check against types visible to this user (system types + their own)
    const existingType = await CategoryType.findOne(
      visibleTypeFilter(req.userId, { name: name.toLowerCase() })
    );
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
    console.error('Error creating category type:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A category type with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create category type' });
  }
});

// PUT /api/category-types/:id - Update a category type (own types only)
router.put('/:id', async (req, res) => {
  try {
    const { displayName, description, color, icon } = req.body;

    const type = await CategoryType.findOne({ _id: req.params.id, userId: req.userId });
    if (!type) {
      const isSystemType = await CategoryType.exists({ _id: req.params.id, isSystem: true });
      if (isSystemType) {
        return res.status(403).json({ error: 'Cannot modify system category types' });
      }
      return res.status(404).json({ error: 'Category type not found' });
    }

    if (displayName) type.displayName = displayName;
    if (description !== undefined) type.description = description;
    if (color) type.color = color;
    if (icon !== undefined) type.icon = icon;

    await type.save();
    res.json(type);
  } catch (error) {
    console.error('Error updating category type:', error);
    res.status(500).json({ error: 'Failed to update category type' });
  }
});

// DELETE /api/category-types/:id - Delete a category type (own types only)
router.delete('/:id', async (req, res) => {
  try {
    const type = await CategoryType.findOne({ _id: req.params.id, userId: req.userId });
    if (!type) {
      const isSystemType = await CategoryType.exists({ _id: req.params.id, isSystem: true });
      if (isSystemType) {
        return res.status(403).json({ error: 'Cannot delete system category types' });
      }
      return res.status(404).json({ error: 'Category type not found' });
    }

    // Check if any categories are using this type
    const categoriesCount = await Category.countDocuments({ typeId: req.params.id, userId: req.userId });
    if (categoriesCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category type. ${categoriesCount} categories are using this type. Please reassign or delete those categories first.`
      });
    }

    // Check if any accounts are using this type
    const accountsCount = await Account.countDocuments({ typeId: req.params.id, userId: req.userId });
    if (accountsCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category type. ${accountsCount} accounts are using this type. Please reassign or delete those accounts first.`
      });
    }

    await CategoryType.deleteOne({ _id: type._id });
    res.json({ message: 'Category type deleted successfully' });
  } catch (error) {
    console.error('Error deleting category type:', error);
    res.status(500).json({ error: 'Failed to delete category type' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { CategoryType, Category, Account } = require('../models');
const { authenticate } = require('../middleware/auth');

// Get all category types
router.get('/', authenticate, async (req, res) => {
  try {
    const types = await CategoryType.find().sort({ name: 1 });
    res.json(types);
  } catch (error) {
    console.error('Error fetching category types:', error);
    res.status(500).json({ error: 'Failed to fetch category types' });
  }
});

// Get a single category type
router.get('/:id', authenticate, async (req, res) => {
  try {
    const type = await CategoryType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({ error: 'Category type not found' });
    }
    res.json(type);
  } catch (error) {
    console.error('Error fetching category type:', error);
    res.status(500).json({ error: 'Failed to fetch category type' });
  }
});

// Create a new category type
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, displayName, description, color, icon } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ error: 'Name and display name are required' });
    }

    // Check if type with this name already exists
    const existingType = await CategoryType.findOne({ name: name.toLowerCase() });
    if (existingType) {
      return res.status(400).json({ error: 'A category type with this name already exists' });
    }

    const categoryType = new CategoryType({
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

// Update a category type
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { displayName, description, color, icon } = req.body;
    
    const type = await CategoryType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({ error: 'Category type not found' });
    }

    // Prevent updating system types' name
    if (type.isSystem && req.body.name && req.body.name !== type.name) {
      return res.status(403).json({ error: 'Cannot change name of system category types' });
    }

    // Update fields
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

// Delete a category type
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const type = await CategoryType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({ error: 'Category type not found' });
    }

    // Prevent deleting system types
    if (type.isSystem) {
      return res.status(403).json({ error: 'Cannot delete system category types' });
    }

    // Check if any categories are using this type
    const categoriesCount = await Category.countDocuments({ typeId: req.params.id });
    if (categoriesCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category type. ${categoriesCount} categories are using this type. Please reassign or delete those categories first.` 
      });
    }

    // Check if any accounts are using this type
    const accountsCount = await Account.countDocuments({ typeId: req.params.id });
    if (accountsCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category type. ${accountsCount} accounts are using this type. Please reassign or delete those accounts first.` 
      });
    }

    await CategoryType.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category type deleted successfully' });
  } catch (error) {
    console.error('Error deleting category type:', error);
    res.status(500).json({ error: 'Failed to delete category type' });
  }
});

module.exports = router;

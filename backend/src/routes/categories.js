const express = require('express');
const router = express.Router();
const { Category, Account } = require('../models');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ type: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/:type - Get categories by type
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    if (!['deposits', 'investments'].includes(type)) {
      return res.status(400).json({ error: 'Invalid category type' });
    }
    
    const categories = await Category.find({ type }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories - Create a new category
router.post('/', async (req, res) => {
  try {
    const { name, type, description } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    
    if (!['deposits', 'investments'].includes(type)) {
      return res.status(400).json({ error: 'Type must be deposits or investments' });
    }
    
    const category = new Category({
      name: name.trim(),
      type,
      description: description?.trim()
    });
    
    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ error: 'Category already exists in this type' });
    } else if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
});

// PUT /api/categories/:id - Update a category
router.put('/:id', async (req, res) => {
  try {
    const { name, type, description } = req.body;
    
    if (type && !['deposits', 'investments'].includes(type)) {
      return res.status(400).json({ error: 'Type must be deposits or investments' });
    }
    
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (type) updateData.type = type;
    if (description !== undefined) updateData.description = description?.trim();
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ error: 'Category already exists in this type' });
    } else if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update category' });
    }
  }
});

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', async (req, res) => {
  try {
    // Check if any accounts use this category
    const accountCount = await Account.countDocuments({ categoryId: req.params.id });
    
    if (accountCount > 0) {
      return res.status(409).json({ 
        error: `Cannot delete category: ${accountCount} account(s) are using this category. Please reassign or delete those accounts first.` 
      });
    }
    
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;

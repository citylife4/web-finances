const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ type: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

// POST /api/categories - Create a new category
router.post('/', async (req, res) => {
  try {
    const { name, type, description } = req.body;
    
    const category = new Category({
      name,
      type,
      description
    });
    
    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Category already exists in this type' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// PUT /api/categories/:id - Update a category
router.put('/:id', async (req, res) => {
  try {
    const { name, type, description } = req.body;
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, type, description },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Category already exists in this type' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { Category, CategoryType, Account } = require('../models');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// GET /api/categories - Get all categories with type population
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('typeId', 'name displayName color')
      .sort({ typeId: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/type/:typeId - Get categories by type ID
router.get('/type/:typeId', async (req, res) => {
  try {
    const { typeId } = req.params;
    
    // Verify the type exists
    const categoryType = await CategoryType.findById(typeId);
    if (!categoryType) {
      return res.status(404).json({ error: 'Category type not found' });
    }
    
    const categories = await Category.find({ typeId })
      .populate('typeId', 'name displayName color')
      .sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/by-name/:typeName - Get categories by type name (backward compatibility)
router.get('/by-name/:typeName', async (req, res) => {
  try {
    const { typeName } = req.params;
    
    // Find the type by name
    const categoryType = await CategoryType.findOne({ name: typeName.toLowerCase() });
    if (!categoryType) {
      return res.status(404).json({ error: 'Category type not found' });
    }
    
    const categories = await Category.find({ typeId: categoryType._id })
      .populate('typeId', 'name displayName color')
      .sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories - Create a new category
router.post('/', async (req, res) => {
  try {
    const { name, typeId, description } = req.body;
    
    if (!name || !typeId) {
      return res.status(400).json({ error: 'Name and typeId are required' });
    }
    
    // Verify the type exists
    const categoryType = await CategoryType.findById(typeId);
    if (!categoryType) {
      return res.status(400).json({ error: 'Invalid category type' });
    }
    
    const category = new Category({
      name: name.trim(),
      typeId,
      type: categoryType.name, // Keep for backward compatibility
      description: description?.trim()
    });
    
    const savedCategory = await category.save();
    await savedCategory.populate('typeId', 'name displayName color');
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
    const { name, typeId, description } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    
    // If typeId is being changed, verify it exists and update the type field
    if (typeId) {
      const categoryType = await CategoryType.findById(typeId);
      if (!categoryType) {
        return res.status(400).json({ error: 'Invalid category type' });
      }
      updateData.typeId = typeId;
      updateData.type = categoryType.name; // Keep for backward compatibility
    }
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('typeId', 'name displayName color');
    
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

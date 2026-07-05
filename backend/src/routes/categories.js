const express = require('express');
const router = express.Router();
const { Category, CategoryType, Account } = require('../models');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// A category type is visible to a user if it's a system type or their own
const visibleTypeFilter = (userId, extra = {}) => ({
  ...extra,
  $or: [{ isSystem: true }, { userId }]
});

// GET /api/categories - Get the user's categories with type population
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.userId })
      .populate('typeId', 'name displayName color')
      .sort({ typeId: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/type/:typeId - Get categories by type ID
router.get('/type/:typeId', async (req, res) => {
  try {
    const { typeId } = req.params;

    const categoryType = await CategoryType.findOne(visibleTypeFilter(req.userId, { _id: typeId }));
    if (!categoryType) {
      return res.status(404).json({ error: 'Category type not found' });
    }

    const categories = await Category.find({ userId: req.userId, typeId })
      .populate('typeId', 'name displayName color')
      .sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/by-name/:typeName - Get categories by type name (backward compatibility)
router.get('/by-name/:typeName', async (req, res) => {
  try {
    const { typeName } = req.params;

    const categoryType = await CategoryType.findOne(
      visibleTypeFilter(req.userId, { name: typeName.toLowerCase() })
    );
    if (!categoryType) {
      return res.status(404).json({ error: 'Category type not found' });
    }

    const categories = await Category.find({ userId: req.userId, typeId: categoryType._id })
      .populate('typeId', 'name displayName color')
      .sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
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

    const categoryType = await CategoryType.findOne(visibleTypeFilter(req.userId, { _id: typeId }));
    if (!categoryType) {
      return res.status(400).json({ error: 'Invalid category type' });
    }

    const category = new Category({
      userId: req.userId,
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
      console.error('Error creating category:', error);
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
      const categoryType = await CategoryType.findOne(visibleTypeFilter(req.userId, { _id: typeId }));
      if (!categoryType) {
        return res.status(400).json({ error: 'Invalid category type' });
      }
      updateData.typeId = typeId;
      updateData.type = categoryType.name; // Keep for backward compatibility
    }

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('typeId', 'name displayName color');

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // If typeId was changed, cascade the update to all accounts using this category
    if (typeId) {
      await Account.updateMany(
        { categoryId: req.params.id, userId: req.userId },
        { typeId: typeId }
      );
    }

    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ error: 'Category already exists in this type' });
    } else if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  }
});

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', async (req, res) => {
  try {
    // Check if any accounts use this category
    const accountCount = await Account.countDocuments({
      categoryId: req.params.id,
      userId: req.userId
    });

    if (accountCount > 0) {
      return res.status(409).json({
        error: `Cannot delete category: ${accountCount} account(s) are using this category. Please reassign or delete those accounts first.`
      });
    }

    const category = await Category.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;

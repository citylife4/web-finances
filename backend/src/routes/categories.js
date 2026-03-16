const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Category, CategoryType, Account } = require('../models');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.userId })
      .populate('typeId', 'name displayName color')
      .sort({ typeId: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/type/:typeId', async (req, res) => {
  try {
    const { typeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(typeId)) {
      return res.status(400).json({ error: 'Invalid typeId' });
    }
    
    const categoryType = await CategoryType.findById(typeId);
    if (!categoryType) {
      return res.status(404).json({ error: 'Category type not found' });
    }
    
    const categories = await Category.find({ typeId, userId: req.userId })
      .populate('typeId', 'name displayName color')
      .sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/by-name/:typeName', async (req, res) => {
  try {
    const { typeName } = req.params;
    
    const categoryType = await CategoryType.findOne({ name: typeName.toLowerCase() });
    if (!categoryType) {
      return res.status(404).json({ error: 'Category type not found' });
    }
    
    const categories = await Category.find({ typeId: categoryType._id, userId: req.userId })
      .populate('typeId', 'name displayName color')
      .sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, typeId, description } = req.body;
    
    if (!name || !typeId) {
      return res.status(400).json({ error: 'Name and typeId are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(typeId)) {
      return res.status(400).json({ error: 'Invalid typeId' });
    }
    
    const categoryType = await CategoryType.findById(typeId);
    if (!categoryType) {
      return res.status(400).json({ error: 'Invalid category type' });
    }
    
    const category = new Category({
      userId: req.userId,
      name: name.trim(),
      typeId,
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

router.put('/:id', async (req, res) => {
  try {
    const { name, typeId, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid category ID' });
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

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('typeId', 'name displayName color');

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

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
      res.status(500).json({ error: 'Failed to update category' });
    }
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const accountCount = await Account.countDocuments({ categoryId: req.params.id, userId: req.userId });
    
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
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;

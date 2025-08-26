const express = require('express');
const router = express.Router();
const Subcategory = require('../models/Subcategory');

// GET /api/subcategories - Get all subcategories
router.get('/', async (req, res) => {
  try {
    const subcategories = await Subcategory.find().sort({ parentCategory: 1, name: 1 });
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/subcategories/:parentCategory - Get subcategories by parent category
router.get('/:parentCategory', async (req, res) => {
  try {
    const { parentCategory } = req.params;
    if (!['deposits', 'investments'].includes(parentCategory)) {
      return res.status(400).json({ error: 'Invalid parent category' });
    }
    
    const subcategories = await Subcategory.find({ parentCategory }).sort({ name: 1 });
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subcategories - Create a new subcategory
router.post('/', async (req, res) => {
  try {
    const { name, parentCategory, description } = req.body;
    
    const subcategory = new Subcategory({
      name,
      parentCategory,
      description
    });
    
    const savedSubcategory = await subcategory.save();
    res.status(201).json(savedSubcategory);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Subcategory already exists in this parent category' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// PUT /api/subcategories/:id - Update a subcategory
router.put('/:id', async (req, res) => {
  try {
    const { name, parentCategory, description } = req.body;
    
    const subcategory = await Subcategory.findByIdAndUpdate(
      req.params.id,
      { name, parentCategory, description },
      { new: true, runValidators: true }
    );
    
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    
    res.json(subcategory);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Subcategory already exists in this parent category' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// DELETE /api/subcategories/:id - Delete a subcategory
router.delete('/:id', async (req, res) => {
  try {
    const subcategory = await Subcategory.findByIdAndDelete(req.params.id);
    
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
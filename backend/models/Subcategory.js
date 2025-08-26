const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  parentCategory: {
    type: String,
    required: true,
    enum: ['deposits', 'investments']
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Ensure unique subcategory names within each parent category
subcategorySchema.index({ name: 1, parentCategory: 1 }, { unique: true });

module.exports = mongoose.model('Subcategory', subcategorySchema);
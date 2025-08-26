const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
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

// Ensure unique category names within each type
categorySchema.index({ name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
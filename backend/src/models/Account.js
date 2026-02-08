const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategoryType',
    required: true
  },
  // Keep type field for backward compatibility during migration
  type: {
    type: String,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for performance
accountSchema.index({ typeId: 1 });
accountSchema.index({ categoryId: 1 });

module.exports = mongoose.model('Account', accountSchema);

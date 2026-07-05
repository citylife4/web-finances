const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Ensure unique category names within each type, per user
categorySchema.index({ userId: 1, typeId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);

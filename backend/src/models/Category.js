const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
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
    description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Ensure unique category names within each type
categorySchema.index({ name: 1, typeId: 1, userId: 1 }, { unique: true });
categorySchema.index({ typeId: 1 });

module.exports = mongoose.model('Category', categorySchema);

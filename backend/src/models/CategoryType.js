const mongoose = require('mongoose');

const categoryTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#667eea',
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  isSystem: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CategoryType', categoryTypeSchema);

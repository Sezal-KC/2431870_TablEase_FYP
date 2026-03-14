const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  unit: {
    type: String,
    enum: ['kg', 'g', 'liter', 'ml', 'pcs'],
    required: true
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    required: true,
    default: 1
  },
  category: {
    type: String,
    enum: ['Meat', 'Vegetable', 'Spice', 'Sauce', 'Grain', 'Dairy', 'Other'],
    default: 'Other'
  }
}, { timestamps: true });

module.exports = mongoose.model('Ingredient', IngredientSchema);
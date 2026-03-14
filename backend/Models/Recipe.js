const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
    unique: true
  },
  ingredients: [
    {
      ingredient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 0
      },
      unit: {
        type: String,
        enum: ['kg', 'g', 'liter', 'ml', 'pcs'],
        required: true
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Recipe', RecipeSchema);
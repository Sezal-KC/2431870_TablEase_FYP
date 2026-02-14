const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  category: { 
    type: String, 
    enum: ['Starters', 'Main Course', 'Drinks', 'Desserts', 'Other'],
    required: true 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  imageUrl: { 
    type: String, 
    default: 'https://via.placeholder.com/300x200?text=Menu+Item' 
  },
  description: { 
    type: String, 
    trim: true 
  },
  available: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', MenuItemSchema);
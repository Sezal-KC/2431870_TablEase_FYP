const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'tables'
  },
  waiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  items: [
    {
      name: String,
      qty: Number,
      price: Number
    }
  ],
  allergies: [String],
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served', 'billed', 'paid'],
    default: 'pending'
  },
  totalAmount: Number
}, { timestamps: true });

module.exports = mongoose.model('orders', OrderSchema);
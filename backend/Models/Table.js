// Models/Table.js
const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  tableNumber: String,
  seats: Number,
  status: {
    type: String,
    enum: ['available', 'occupied', 'ordered'],
    default: 'available'
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'orders'
  }
});

module.exports = mongoose.model('tables', TableSchema);

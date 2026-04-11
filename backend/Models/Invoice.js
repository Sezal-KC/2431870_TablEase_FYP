const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: Number,
    required: true
  },
  fiscalYear: {
    type: String,
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'orders',
    required: true
  },
  billType: {
    type: String,
    enum: ['normal', 'vat'],
    required: true
  },
  // VAT bill specific fields
  customerName: { type: String, default: '' },
  customerPAN: { type: String, default: '' },
  customerAddress: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);
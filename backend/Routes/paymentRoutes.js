const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middlewares/auth');
const Order = require('../Models/Order');
const Table = require('../Models/Table');
const Invoice = require('../Models/Invoice');
const crypto = require('crypto');

const ESEWA_SECRET = '8gBm/:&EnhH.1/q';

// Get current fiscal year (Nepal: Shrawan-Ashadh, mid-July to mid-July)
const getCurrentFiscalYear = () => {
  return process.env.FISCAL_YEAR || '2081/82';
};

// Get next invoice number for current fiscal year
const getNextInvoiceNumber = async (fiscalYear) => {
  const lastInvoice = await Invoice.findOne({ fiscalYear })
    .sort({ invoiceNumber: -1 });
  return lastInvoice ? lastInvoice.invoiceNumber + 1 : 1;
};

// GET /api/payments/restaurant-info
router.get('/restaurant-info', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      name: process.env.RESTAURANT_NAME || 'TablEase Restaurant',
      address: process.env.RESTAURANT_ADDRESS || 'Kathmandu, Nepal',
      phone: process.env.RESTAURANT_PHONE || '9800000000',
      vatNo: process.env.RESTAURANT_VAT_NO || '123456789',
      panNo: process.env.RESTAURANT_PAN_NO || '987654321',
      fiscalYear: getCurrentFiscalYear()
    }
  });
});

// POST /api/payments/generate-invoice — generate invoice for an order
router.post('/generate-invoice', authMiddleware, async (req, res) => {
  try {
    const { orderId, billType, customerName, customerPAN, customerAddress } = req.body;

    if (!orderId || !billType) {
      return res.status(400).json({ success: false, message: 'Order ID and bill type are required' });
    }

    // Check if invoice already exists for this order and type
    const existing = await Invoice.findOne({ order: orderId, billType });
    if (existing) {
      return res.json({ success: true, data: existing, message: 'Invoice already exists' });
    }

    const fiscalYear = getCurrentFiscalYear();
    const invoiceNumber = await getNextInvoiceNumber(fiscalYear);

    const invoice = await Invoice.create({
      invoiceNumber,
      fiscalYear,
      order: orderId,
      billType,
      customerName: customerName || '',
      customerPAN: customerPAN || '',
      customerAddress: customerAddress || ''
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    console.error('Invoice error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate invoice' });
  }
});

// Verify eSewa payment
router.post('/esewa/verify', authMiddleware, async (req, res) => {
  try {
    const { orderId, totalAmount, transactionUuid, transactionCode, status } = req.body;

    if (status !== 'COMPLETE') {
      return res.status(400).json({ success: false, message: 'Payment not complete' });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: 'paid' },
      { new: true }
    ).populate('table');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await Table.findByIdAndUpdate(order.table._id, {
      status: 'available',
      currentOrder: null
    });

    const io = req.app.get('io');
    io.emit('orderPaid', {
      tableNumber: order.table.tableNumber,
      message: `Table ${order.table.tableNumber} has been cleared and is now available`
    });

    res.json({ success: true, message: 'Payment verified successfully', data: { transactionCode, orderId } });
  } catch (err) {
    console.error('eSewa verify error:', err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

module.exports = router;
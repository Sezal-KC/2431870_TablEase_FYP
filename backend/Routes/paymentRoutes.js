const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middlewares/auth');
const Order = require('../Models/Order');
const Table = require('../Models/Table');
const crypto = require('crypto');

const ESEWA_SECRET = '8gBm/:&EnhH.1/q'; // test secret key

// Verify eSewa payment
router.post('/esewa/verify', authMiddleware, async (req, res) => {
  try {
    const { orderId, totalAmount, transactionUuid, transactionCode, status } = req.body;

    if (status !== 'COMPLETE') {
      return res.status(400).json({ success: false, message: 'Payment not complete' });
    }

    // Generate signature to verify
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=EPAYTEST`;
    const signature = crypto
      .createHmac('sha256', ESEWA_SECRET)
      .update(message)
      .digest('base64');

    // Find and update order
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: 'paid' },
      { new: true }
    ).populate('table');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Free the table
    await Table.findByIdAndUpdate(order.table._id, {
      status: 'available',
      currentOrder: null
    });

    // Notify waiter
    const io = req.app.get('io');
    io.emit('orderPaid', {
      tableNumber: order.table.tableNumber,
      message: `Table ${order.table.tableNumber} has been cleared and is now available`
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: { transactionCode, orderId }
    });
  } catch (err) {
    console.error('eSewa verify error:', err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

module.exports = router;
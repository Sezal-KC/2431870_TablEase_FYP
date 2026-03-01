const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middlewares/auth');
const Order = require('../Models/Order');
const Table = require('../Models/Table');

// POST /api/orders — place a new order
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { tableId, items, totalAmount, allergies, notes } = req.body;

    if (!tableId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Table and items are required' });
    }

    const order = await Order.create({
      table: tableId,
      waiter: req.user._id,
      items,
      totalAmount,
      allergies: allergies || [],
      notes: notes || '',
      status: 'pending'
    });

    // Update table status to occupied
    await Table.findByIdAndUpdate(tableId, {
      status: 'occupied',
      currentOrder: order._id
    });

    res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  }
});

module.exports = router;
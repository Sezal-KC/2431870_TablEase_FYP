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

// GET /api/orders/table/:tableId — get active order for a table
router.get('/table/:tableId', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      table: req.params.tableId,
      status: { $in: ['pending', 'preparing', 'ready'] }
    }).sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({ success: false, message: 'No active order found for this table' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

// PATCH /api/orders/:orderId/add-items — add more items to existing order
router.patch('/:orderId/add-items', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Merge items — if item name exists increase qty, else add new
    items.forEach(newItem => {
      const existing = order.items.find(i => i.name === newItem.name);
      if (existing) {
        existing.qty += newItem.qty;
      } else {
        order.items.push(newItem);
      }
    });

    // Recalculate total
    order.totalAmount = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);

    // Reset to pending so kitchen sees new items
    order.status = 'pending';

    await order.save();

    res.json({ success: true, message: 'Items added to order', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
});

module.exports = router;
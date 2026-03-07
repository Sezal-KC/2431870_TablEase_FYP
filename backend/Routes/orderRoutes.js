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

// GET /api/orders/active — all active orders for kitchen
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['pending', 'preparing'] }
    })
      .populate('table', 'tableNumber')
      .sort({ createdAt: 1 }); // oldest first
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch active orders' });
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



// PATCH /api/orders/:orderId/status — update order status
router.patch('/:orderId/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'billed', 'paid'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    ).populate('table', 'tableNumber');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Emit socket event when order is ready
    if (status === 'ready') {
      const io = req.app.get('io');
      io.emit('orderReady', {
        orderId: order._id,
        tableNumber: order.table?.tableNumber,
        message: `Order for ${order.table?.tableNumber} is ready to serve! 🍽️`
      });
    }

    res.json({ success: true, message: `Order marked as ${status}`, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

module.exports = router;
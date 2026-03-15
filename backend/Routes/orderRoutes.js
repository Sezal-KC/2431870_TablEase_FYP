const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middlewares/auth');
const Order = require('../Models/Order');
const Table = require('../Models/Table');
const Recipe = require('../Models/Recipe');
const Ingredient = require('../Models/Ingredient');
const MenuItem = require('../Models/MenuItem');

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

    // Auto-deduct ingredients for each ordered item
    for (const orderedItem of items) {
      const menuItem = await MenuItem.findOne({ name: orderedItem.name });
      if (!menuItem) continue;

      const recipe = await Recipe.findOne({ menuItem: menuItem._id })
        .populate('ingredients.ingredient');
      if (!recipe) continue;

      for (const recipeIngredient of recipe.ingredients) {
        const deductAmount = recipeIngredient.quantity * orderedItem.qty;
        await Ingredient.findByIdAndUpdate(
          recipeIngredient.ingredient._id,
          { $inc: { currentStock: -deductAmount } }
        );

        // Check low stock and emit alert
        const updated = await Ingredient.findById(recipeIngredient.ingredient._id);
        if (updated.currentStock <= updated.lowStockThreshold) {
          const io = req.app.get('io');
          io.emit('lowStock', {
            ingredient: updated.name,
            currentStock: updated.currentStock,
            unit: updated.unit,
            message: `⚠️ Low stock: ${updated.name} (${updated.currentStock}${updated.unit} remaining)`
          });
        }
      }
    }

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

// GET /api/orders/stats — waiter dashboard stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Today's orders
    const todaysOrders = await Order.find({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    }).populate('table', 'tableNumber');

    // Revenue from paid/billed orders today
    const todaysRevenue = todaysOrders
      .filter(o => ['billed', 'paid'].includes(o.status))
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Orders count today
    const ordersToday = todaysOrders.length;

    // Avg order value
    const avgOrderValue = ordersToday > 0
      ? todaysOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / ordersToday
      : 0;

    // Table stats
    const allTables = await Table.find({});
    const availableTables = allTables.filter(t => t.status === 'available').length;
    const occupiedTables = allTables.filter(t => t.status === 'occupied').length;
    const totalTables = allTables.length;

    // Recent 5 orders
    const recentOrders = await Order.find({})
      .populate('table', 'tableNumber')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        todaysRevenue,
        ordersToday,
        avgOrderValue,
        activeTables: `${occupiedTables}/${totalTables}`,
        availableTables,
        occupiedTables,
        totalTables,
        recentOrders
      }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// GET /api/orders/ready — orders ready to be billed
router.get('/ready', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      status: 'ready'
    })
      .populate('table', 'tableNumber seats')
      .sort({ createdAt: 1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch ready orders' });
  }
});

// PATCH /api/orders/:orderId/pay — mark order as paid and free table
router.patch('/:orderId/pay', authMiddleware, async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status: 'paid' },
      { new: true }
    ).populate('table', 'tableNumber');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Free the table
    await Table.findByIdAndUpdate(order.table._id, {
      status: 'available',
      currentOrder: null
    });

    // Notify waiter via socket
    const io = req.app.get('io');
    io.emit('orderPaid', {
      tableNumber: order.table.tableNumber,
      message: `Table ${order.table.tableNumber} has been cleared and is now available`
    });

    res.json({ success: true, message: 'Payment successful', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
});

// GET /api/orders/sales-report — manager sales data
router.get('/sales-report', authMiddleware, async (req, res) => {
  try {
    const { period } = req.query; // 'today', 'week', 'month'

    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate.setHours(0, 0, 0, 0);
    }

    const orders = await Order.find({
      createdAt: { $gte: startDate },
      status: { $in: ['paid', 'billed'] }
    }).populate('table', 'tableNumber');

    // Total revenue
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Orders per day for chart
    const dailyMap = {};
    orders.forEach(order => {
      const day = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dailyMap[day]) dailyMap[day] = { date: day, revenue: 0, orders: 0 };
      dailyMap[day].revenue += order.totalAmount || 0;
      dailyMap[day].orders += 1;
    });
    const dailyData = Object.values(dailyMap).slice(-7);

    // Popular items
    const itemMap = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
        itemMap[item.name].qty += item.qty;
        itemMap[item.name].revenue += item.price * item.qty;
      });
    });
    const popularItems = Object.values(itemMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders: orders.length,
        dailyData,
        popularItems
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sales report' });
  }
});

module.exports = router;
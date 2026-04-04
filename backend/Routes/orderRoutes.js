// const express = require('express');
// const router = express.Router();
// const authMiddleware = require('../Middlewares/auth');
// const Order = require('../Models/Order');
// const Table = require('../Models/Table');
// const Recipe = require('../Models/Recipe');
// const Ingredient = require('../Models/Ingredient');
// const MenuItem = require('../Models/MenuItem');

// // POST /api/orders — place a new order
// router.post('/', authMiddleware, async (req, res) => {
//   try {
//     const { tableId, items, totalAmount, allergies, notes } = req.body;

//     if (!tableId || !items || items.length === 0) {
//       return res.status(400).json({ success: false, message: 'Table and items are required' });
//     }

//     const order = await Order.create({
//       table: tableId,
//       waiter: req.user._id,
//       items,
//       totalAmount,
//       allergies: allergies || [],
//       notes: notes || '',
//       status: 'pending'
//     });

//     await Table.findByIdAndUpdate(tableId, {
//       status: 'ordered',
//       currentOrder: order._id
//     });

//     // Auto-deduct ingredients for each ordered item
//     for (const orderedItem of items) {
//       const menuItem = await MenuItem.findOne({ name: orderedItem.name });
//       if (!menuItem) continue;

//       const recipe = await Recipe.findOne({ menuItem: menuItem._id })
//         .populate('ingredients.ingredient');
//       if (!recipe) continue;

//       for (const recipeIngredient of recipe.ingredients) {
//         const deductAmount = recipeIngredient.quantity * orderedItem.qty;
//         await Ingredient.findByIdAndUpdate(
//           recipeIngredient.ingredient._id,
//           { $inc: { currentStock: -deductAmount } }
//         );

//         // Check low stock and emit alert
//         const updated = await Ingredient.findById(recipeIngredient.ingredient._id);
//         if (updated.currentStock <= updated.lowStockThreshold) {
//           const io = req.app.get('io');
//           io.emit('lowStock', {
//             ingredient: updated.name,
//             currentStock: updated.currentStock,
//             unit: updated.unit,
//             message: `⚠️ Low stock: ${updated.name} (${updated.currentStock}${updated.unit} remaining)`
//           });
//         }
//       }
//     }

//     res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
//   } catch (err) {
//     console.error('Order error:', err);
//     res.status(500).json({ success: false, message: 'Failed to place order' });
//   }
// });

// // GET /api/orders/active — all active orders for kitchen
// router.get('/active', authMiddleware, async (req, res) => {
//   try {
//     const orders = await Order.find({
//       status: { $in: ['pending', 'preparing'] }
//     })
//       .populate('table', 'tableNumber')
//       .sort({ createdAt: 1 }); // oldest first
//     res.json({ success: true, data: orders });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to fetch active orders' });
//   }
// });

// // GET /api/orders/table/:tableId — get active order for a table
// router.get('/table/:tableId', authMiddleware, async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       table: req.params.tableId,
//       status: { $in: ['pending', 'preparing', 'ready'] }
//     }).sort({ createdAt: -1 });

//     if (!order) {
//       return res.status(404).json({ success: false, message: 'No active order found for this table' });
//     }

//     res.json({ success: true, data: order });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to fetch order' });
//   }
// });

// // PATCH /api/orders/:orderId/add-items — add more items to existing order
// router.patch('/:orderId/add-items', authMiddleware, async (req, res) => {
//   try {
//     const { items } = req.body;

//     if (!items || items.length === 0) {
//       return res.status(400).json({ success: false, message: 'No items provided' });
//     }

//     const order = await Order.findById(req.params.orderId);
//     if (!order) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     // Mark existing items as NOT new
//     order.items = order.items.map(i => ({ ...i.toObject(), isNew: false }));

//     // Add new items with isNew: true
//     items.forEach(newItem => {
//       const existing = order.items.find(i => i.name === newItem.name);
//       if (existing) {
//         existing.qty += newItem.qty;
//         existing.isNew = true; // re-flag as new since qty changed
//       } else {
//         order.items.push({ ...newItem, isNew: true });
//       }
//     });


//     // Recalculate total
//     order.totalAmount = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);

//     // Reset to pending so kitchen sees new items
//     order.status = 'pending';

//     await order.save();

//     res.json({ success: true, message: 'Items added to order', data: order });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to update order' });
//   }
// });



// // PATCH /api/orders/:orderId/status — update order status
// router.patch('/:orderId/status', authMiddleware, async (req, res) => {
//   try {
//     const { status } = req.body;
//     const validStatuses = ['pending', 'preparing', 'ready', 'served', 'billed', 'paid'];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ success: false, message: 'Invalid status' });
//     }

//     const order = await Order.findById(req.params.orderId);
//     if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

//     // When kitchen starts preparing, mark all items as not new
//     if (status === 'preparing') {
//       order.items = order.items.map(i => ({ ...i.toObject(), isNew: false }));
//     }

//     order.status = status;
//     await order.save();

//     await order.populate('table', 'tableNumber');

//     // Emit socket event when order is ready
//     if (status === 'ready') {
//       const io = req.app.get('io');
//       io.emit('orderReady', {
//         orderId: order._id,
//         tableNumber: order.table?.tableNumber,
//         message: `Order for ${order.table?.tableNumber} is ready to serve! 🍽️`
//       });
//     }

//     res.json({ success: true, message: `Order marked as ${status}`, data: order });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to update status' });
//   }
// });

// // GET /api/orders/stats — waiter dashboard stats
// router.get('/stats', authMiddleware, async (req, res) => {
//   try {
//     // Today's date range
//     const todayStart = new Date();
//     todayStart.setHours(0, 0, 0, 0);
//     const todayEnd = new Date();
//     todayEnd.setHours(23, 59, 59, 999);

//     // Today's orders
//     const todaysOrders = await Order.find({
//       createdAt: { $gte: todayStart, $lte: todayEnd }
//     }).populate('table', 'tableNumber');

//     // Revenue from paid/billed orders today
//     const todaysRevenue = todaysOrders
//       .filter(o => ['billed', 'paid'].includes(o.status))
//       .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

//     // Orders count today
//     const ordersToday = todaysOrders.length;

//     // Avg order value
//     const avgOrderValue = ordersToday > 0
//       ? todaysOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / ordersToday
//       : 0;

//     // Table stats
//     const allTables = await Table.find({});
//     const availableTables = allTables.filter(t => t.status === 'available').length;
//     const occupiedTables = allTables.filter(t => t.status === 'occupied').length;
//     const totalTables = allTables.length;

//     // Recent 5 orders
//     const recentOrders = await Order.find({})
//       .populate('table', 'tableNumber')
//       .sort({ createdAt: -1 })
//       .limit(5);

//     res.json({
//       success: true,
//       data: {
//         todaysRevenue,
//         ordersToday,
//         avgOrderValue,
//         activeTables: `${occupiedTables}/${totalTables}`,
//         availableTables,
//         occupiedTables,
//         totalTables,
//         recentOrders
//       }
//     });
//   } catch (err) {
//     console.error('Stats error:', err);
//     res.status(500).json({ success: false, message: 'Failed to fetch stats' });
//   }
// });

// // GET /api/orders/ready — orders ready to be billed
// router.get('/ready', authMiddleware, async (req, res) => {
//   try {
//     const orders = await Order.find({
//       status: 'ready'
//     })
//       .populate('table', 'tableNumber seats')
//       .sort({ createdAt: 1 });
//     res.json({ success: true, data: orders });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to fetch ready orders' });
//   }
// });

// // PATCH /api/orders/:orderId/pay — mark order as paid and free table
// router.patch('/:orderId/pay', authMiddleware, async (req, res) => {
//   try {
//     const { paymentMethod } = req.body;

//     const order = await Order.findByIdAndUpdate(
//       req.params.orderId,
//       { status: 'paid' },
//       { new: true }
//     ).populate('table', 'tableNumber');

//     if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

//     // Free the table
//     await Table.findByIdAndUpdate(order.table._id, {
//       status: 'available',
//       currentOrder: null
//     });

//     // Notify waiter via socket
//     const io = req.app.get('io');
//     io.emit('orderPaid', {
//       tableNumber: order.table.tableNumber,
//       message: `Table ${order.table.tableNumber} has been cleared and is now available`
//     });

//     res.json({ success: true, message: 'Payment successful', data: order });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to process payment' });
//   }
// });

// // GET /api/orders/sales-report — manager sales data
// router.get('/sales-report', authMiddleware, async (req, res) => {
//   try {
//     const { period } = req.query; // 'today', 'week', 'month'

//     let startDate = new Date();
//     if (period === 'week') {
//       startDate.setDate(startDate.getDate() - 7);
//     } else if (period === 'month') {
//       startDate.setDate(startDate.getDate() - 30);
//     } else {
//       startDate.setHours(0, 0, 0, 0);
//     }

//     const orders = await Order.find({
//       createdAt: { $gte: startDate },
//       status: { $in: ['paid', 'billed'] }
//     }).populate('table', 'tableNumber');

//     // Total revenue
//     const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

//     // Orders per day for chart
//     const dailyMap = {};
//     orders.forEach(order => {
//       const day = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
//       if (!dailyMap[day]) dailyMap[day] = { date: day, revenue: 0, orders: 0 };
//       dailyMap[day].revenue += order.totalAmount || 0;
//       dailyMap[day].orders += 1;
//     });
//     const dailyData = Object.values(dailyMap).slice(-7);

//     // Popular items
//     const itemMap = {};
//     orders.forEach(order => {
//       order.items.forEach(item => {
//         if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
//         itemMap[item.name].qty += item.qty;
//         itemMap[item.name].revenue += item.price * item.qty;
//       });
//     });
//     const popularItems = Object.values(itemMap)
//       .sort((a, b) => b.qty - a.qty)
//       .slice(0, 5);

//     res.json({
//       success: true,
//       data: {
//         totalRevenue,
//         totalOrders: orders.length,
//         dailyData,
//         popularItems
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to fetch sales report' });
//   }
// });

// // GET /api/orders/receipts — all paid orders for cashier
// router.get('/receipts', authMiddleware, async (req, res) => {
//   try {
//     const { date } = req.query;

//     let startDate, endDate;

//     if (date) {
//       // Specific date filter
//       startDate = new Date(date);
//       startDate.setHours(0, 0, 0, 0);
//       endDate = new Date(date);
//       endDate.setHours(23, 59, 59, 999);
//     } else {
//       // Default to today
//       startDate = new Date();
//       startDate.setHours(0, 0, 0, 0);
//       endDate = new Date();
//       endDate.setHours(23, 59, 59, 999);
//     }

//     const orders = await Order.find({
//       status: 'paid',
//       updatedAt: { $gte: startDate, $lte: endDate }
//     })
//       .populate('table', 'tableNumber')
//       .populate('waiter', 'name')
//       .sort({ updatedAt: -1 });

//     // Calculate totals
//     const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
//     const totalOrders = orders.length;

//     res.json({
//       success: true,
//       data: { orders, totalRevenue, totalOrders }
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to fetch receipts' });
//   }
// });

// // PATCH /api/orders/:orderId/item-ready — mark individual item as ready
// router.patch('/:orderId/item-ready', authMiddleware, async (req, res) => {
//   try {
//     const { itemName } = req.body;

//     const order = await Order.findById(req.params.orderId)
//       .populate('table', 'tableNumber');
//     if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

//     // Mark the specific item as ready
//     const item = order.items.find(i => i.name === itemName);
//     if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

//     item.isReady = true;

//     // Check if ALL items are ready
//     const allReady = order.items.every(i => i.isReady === true);
//     if (allReady) {
//       order.status = 'ready';
//       // Notify waiter that full order is ready
//       const io = req.app.get('io');
//       io.emit('orderReady', {
//         orderId: order._id,
//         tableNumber: order.table?.tableNumber,
//         message: `Full order for ${order.table?.tableNumber} is ready to serve! 🍽️`
//       });
//     } else {
//       // Notify waiter that specific item is ready
//       const io = req.app.get('io');
//       io.emit('itemReady', {
//         orderId: order._id,
//         tableNumber: order.table?.tableNumber,
//         itemName,
//         message: `${itemName} for ${order.table?.tableNumber} is ready to serve! 🍽️`
//       });
//     }

//     await order.save();
//     res.json({ success: true, message: `${itemName} marked as ready`, data: order });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to mark item ready' });
//   }
// });

// // GET /api/orders/consolidated — group items across all active orders
// router.get('/consolidated', authMiddleware, async (req, res) => {
//   try {
//     const orders = await Order.find({
//       status: { $in: ['pending', 'preparing'] }
//     }).populate('table', 'tableNumber');

//     // Group items by name across all orders
//     const itemMap = {};
//     orders.forEach(order => {
//       order.items
//         .filter(item => item.isNew !== false && item.isReady !== true)
//         .forEach(item => {
//           if (!itemMap[item.name]) {
//             itemMap[item.name] = {
//               name: item.name,
//               totalQty: 0,
//               tables: []
//             };
//           }
//           itemMap[item.name].totalQty += item.qty;
//           itemMap[item.name].tables.push({
//             tableNumber: order.table?.tableNumber,
//             orderId: order._id,
//             qty: item.qty
//           });
//         });
//     });

//     const consolidated = Object.values(itemMap).sort((a, b) => b.totalQty - a.totalQty);
//     res.json({ success: true, data: consolidated });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to fetch consolidated orders' });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middlewares/auth');
const Order = require('../Models/Order');
const Table = require('../Models/Table');
const Recipe = require('../Models/Recipe');
const Ingredient = require('../Models/Ingredient');
const MenuItem = require('../Models/MenuItem');

// ── POST /api/orders — place a new order ─────────────────────────
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
      status: 'ordered',
      currentOrder: order._id
    });

    // Auto-deduct ingredients
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

// ── NAMED GET ROUTES (must be before /:orderId routes) ────────────

// GET /api/orders/active — kitchen active orders
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['pending', 'preparing'] }
    })
      .populate('table', 'tableNumber')
      .sort({ createdAt: 1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch active orders' });
  }
});

// GET /api/orders/stats — waiter dashboard stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaysOrders = await Order.find({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    }).populate('table', 'tableNumber');

    const todaysRevenue = todaysOrders
      .filter(o => ['billed', 'paid'].includes(o.status))
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const ordersToday = todaysOrders.length;
    const avgOrderValue = ordersToday > 0
      ? todaysOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / ordersToday
      : 0;

    const allTables = await Table.find({});
    const availableTables = allTables.filter(t => t.status === 'available').length;
    const occupiedTables = allTables.filter(t => t.status === 'occupied').length;
    const totalTables = allTables.length;

    const recentOrders = await Order.find({})
      .populate('table', 'tableNumber')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        todaysRevenue, ordersToday, avgOrderValue,
        activeTables: `${occupiedTables}/${totalTables}`,
        availableTables, occupiedTables, totalTables,
        recentOrders
      }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// GET /api/orders/ready — cashier ready orders
router.get('/ready', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ status: 'ready' })
      .populate('table', 'tableNumber seats')
      .sort({ createdAt: 1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch ready orders' });
  }
});

// GET /api/orders/receipts — cashier receipts
router.get('/receipts', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    let startDate, endDate;

    if (date) {
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    const orders = await Order.find({
      status: 'paid',
      updatedAt: { $gte: startDate, $lte: endDate }
    })
      .populate('table', 'tableNumber')
      .populate('waiter', 'name')
      .sort({ updatedAt: -1 });

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    res.json({ success: true, data: { orders, totalRevenue, totalOrders: orders.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch receipts' });
  }
});

// GET /api/orders/consolidated — batch view for kitchen
router.get('/consolidated', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['pending', 'preparing'] }
    }).populate('table', 'tableNumber');

    const itemMap = {};
    orders.forEach(order => {
      order.items
        .filter(item => item.isReady !== true) // ← only filter out already ready items
        .forEach(item => {
          if (!itemMap[item.name]) {
            itemMap[item.name] = { name: item.name, totalQty: 0, tables: [] };
          }
          itemMap[item.name].totalQty += item.qty;
          itemMap[item.name].tables.push({
            tableNumber: order.table?.tableNumber,
            orderId: order._id,
            qty: item.qty
          });
        });
    });

    const consolidated = Object.values(itemMap).sort((a, b) => b.totalQty - a.totalQty);
    res.json({ success: true, data: consolidated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch consolidated orders' });
  }
});

// GET /api/orders/sales-report — manager sales
router.get('/sales-report', authMiddleware, async (req, res) => {
  try {
    const { period } = req.query;
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

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const dailyMap = {};
    orders.forEach(order => {
      const day = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dailyMap[day]) dailyMap[day] = { date: day, revenue: 0, orders: 0 };
      dailyMap[day].revenue += order.totalAmount || 0;
      dailyMap[day].orders += 1;
    });
    const dailyData = Object.values(dailyMap).slice(-7);

    const itemMap = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
        itemMap[item.name].qty += item.qty;
        itemMap[item.name].revenue += item.price * item.qty;
      });
    });
    const popularItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

    res.json({ success: true, data: { totalRevenue, totalOrders: orders.length, dailyData, popularItems } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sales report' });
  }
});

// GET /api/orders/table/:tableId — active order for a table
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

// ── PARAMETERIZED PATCH ROUTES (after all named GET routes) ───────

// PATCH /api/orders/:orderId/add-items
router.patch('/:orderId/add-items', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Mark existing items as NOT new
    order.items = order.items.map(i => ({ ...i.toObject(), isNew: false }));

    // Add new items with isNew: true
    items.forEach(newItem => {
      const existing = order.items.find(i => i.name === newItem.name);
      if (existing) {
        existing.qty += newItem.qty;
        existing.isNew = true;
      } else {
        order.items.push({ ...newItem, isNew: true });
      }
    });

    order.totalAmount = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    order.status = 'pending';
    await order.save();

    res.json({ success: true, message: 'Items added to order', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
});

// PATCH /api/orders/:orderId/status
router.patch('/:orderId/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'billed', 'paid'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (status === 'preparing') {
      order.items = order.items.map(i => ({ ...i.toObject(), isNew: false }));
    }

    order.status = status;
    await order.save();
    await order.populate('table', 'tableNumber');

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


// PATCH /api/orders/item-ready-all — mark item ready for all tables
router.patch('/item-ready-all', authMiddleware, async (req, res) => {
  try {
    const { itemName } = req.body;

    const orders = await Order.find({
      status: { $in: ['pending', 'preparing'] }
    }).populate('table', 'tableNumber');

    // Find orders that have this item
    const ordersWithItem = orders.filter(o =>
      o.items.some(i => i.name === itemName && !i.isReady)
    );

    // Check if any are still pending
    const pendingOrders = ordersWithItem.filter(o => o.status === 'pending');
    const preparingOrders = ordersWithItem.filter(o => o.status === 'preparing');

    if (pendingOrders.length > 0 && preparingOrders.length === 0) {
      // ALL orders are still pending — block completely
      const tableNums = pendingOrders.map(o => o.table?.tableNumber).join(', ');
      return res.status(400).json({
        success: false,
        message: `Please click "Start Preparing" first for: ${tableNums}`
      });
    }

    const io = req.app.get('io');
    let markedCount = 0;
    const skippedTables = [];

    for (const order of ordersWithItem) {
      // Skip pending orders
      if (order.status === 'pending') {
        skippedTables.push(order.table?.tableNumber);
        continue;
      }

      const item = order.items.find(i => i.name === itemName && !i.isReady);
      if (!item) continue;

      item.isReady = true;
      markedCount++;

      const allReady = order.items.every(i => i.isReady === true);
      if (allReady) {
        order.status = 'ready';
        io.emit('orderReady', {
          orderId: order._id,
          tableNumber: order.table?.tableNumber,
          message: `Full order for ${order.table?.tableNumber} is ready to serve! 🍽️`
        });
      } else {
        io.emit('itemReady', {
          orderId: order._id,
          tableNumber: order.table?.tableNumber,
          itemName,
          message: `${itemName} for ${order.table?.tableNumber} is ready! 🍽️`
        });
      }
      await order.save();
    }

    let message = `${itemName} marked ready for ${markedCount} table(s)`;
    if (skippedTables.length > 0) {
      message += `. Skipped (not preparing yet): ${skippedTables.join(', ')}`;
    }

    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark all ready' });
  }
});

// PATCH /api/orders/:orderId/item-ready
router.patch('/:orderId/item-ready', authMiddleware, async (req, res) => {
  try {
    const { itemName } = req.body;

    const order = await Order.findById(req.params.orderId)
      .populate('table', 'tableNumber');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // ← Block if not in preparing status
    if (order.status !== 'preparing') {
      return res.status(400).json({
        success: false,
        message: `Please click "Start Preparing" for Table ${order.table?.tableNumber} first`
      });
    }

    const item = order.items.find(i => i.name === itemName);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    item.isReady = true;

    const allReady = order.items.every(i => i.isReady === true);
    if (allReady) {
      order.status = 'ready';
      const io = req.app.get('io');
      io.emit('orderReady', {
        orderId: order._id,
        tableNumber: order.table?.tableNumber,
        message: `Full order for ${order.table?.tableNumber} is ready to serve! 🍽️`
      });
    } else {
      const io = req.app.get('io');
      io.emit('itemReady', {
        orderId: order._id,
        tableNumber: order.table?.tableNumber,
        itemName,
        message: `${itemName} for ${order.table?.tableNumber} is ready! 🍽️`
      });
    }

    await order.save();
    res.json({ success: true, message: `${itemName} marked as ready`, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark item ready' });
  }
});

// PATCH /api/orders/:orderId/pay
router.patch('/:orderId/pay', authMiddleware, async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status: 'paid' },
      { new: true }
    ).populate('table', 'tableNumber');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    await Table.findByIdAndUpdate(order.table._id, {
      status: 'available',
      currentOrder: null
    });

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



module.exports = router;
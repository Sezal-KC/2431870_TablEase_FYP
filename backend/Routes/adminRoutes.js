const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middlewares/auth');
const User = require('../Models/user');
const MenuItem = require('../Models/MenuItem');
const upload = require('../Middlewares/upload');

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admins only.' });
  }
  next();
};

router.use(authMiddleware);
router.use(requireAdmin);

// Users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password -emailVerificationToken -emailVerificationExpires');
    res.json({ success: true, data: users });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch users' }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch { res.status(500).json({ success: false, message: 'Failed to delete user' }); }
});

// Menu
router.get('/menu', async (req, res) => {
  try {
    const items = await MenuItem.find({});
    res.json({ success: true, data: items });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch menu' }); }
});

router.post('/menu', async (req, res) => {
  try {
    const { name, category, price, imageUrl, description, available } = req.body;
    if (!name || !category || !price)
      return res.status(400).json({ success: false, message: 'Name, category, and price are required' });
    const item = await MenuItem.create({ name, category, price, imageUrl, description, available });
    res.status(201).json({ success: true, message: 'Menu item added', data: item });
  } catch { res.status(500).json({ success: false, message: 'Failed to add item' }); }
});

router.put('/menu/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Menu item updated', data: item });
  } catch { res.status(500).json({ success: false, message: 'Failed to update item' }); }
});

router.delete('/menu/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Menu item deleted' });
  } catch { res.status(500).json({ success: false, message: 'Failed to delete item' }); }
});

// Upload image
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const imageUrl = `http://localhost:8080/uploads/${req.file.filename}`;
  res.json({ success: true, imageUrl });
});

module.exports = router;
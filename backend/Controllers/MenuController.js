const MenuItem = require('../Models/MenuItem');

/**
 * GET all available menu items
 */
const getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find({ available: true })
      .sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items'
    });
  }
};

/**
 * POST - Add a new menu item (Admin)
 * Requires image file upload handled by multer
 */
const addMenuItem = async (req, res) => {
  try {
    const { name, category, price, description, available } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    const imageUrl = `/uploads/${req.file.filename}`; // path to saved image

    const newItem = new MenuItem({
      name,
      category,
      price,
      description,
      available: available !== undefined ? available : true,
      imageUrl,
    });

    await newItem.save();

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully',
      data: newItem
    });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add menu item'
    });
  }
};

module.exports = { getMenuItems, addMenuItem };

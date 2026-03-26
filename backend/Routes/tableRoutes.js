const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middlewares/auth'); 
const { getAllTables } = require('../Controllers/TableController');
const Table = require('../Models/Table');

// GET all tables – now protected
router.get('/', authMiddleware, getAllTables);

// PATCH /api/tables/:id/occupy — mark table as occupied when guests sit
router.patch('/:id/occupy', authMiddleware, async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { status: 'occupied' },
      { new: true }
    );
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, message: 'Table marked as occupied', data: table });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update table' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middlewares/auth'); 
const { getAllTables } = require('../Controllers/TableController');

// GET all tables – now protected
router.get('/', authMiddleware, getAllTables);

module.exports = router;
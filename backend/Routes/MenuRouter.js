
const express = require('express');
const router = express.Router();

const {
  getMenuItems,
  addMenuItem
} = require('../Controllers/MenuController');

const upload = require('../Middlewares/upload');

router.get('/', getMenuItems);

router.post(
  '/',
  upload.single('image'),
  addMenuItem
);

module.exports = router;


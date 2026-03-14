const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middlewares/auth');
const Ingredient = require('../Models/Ingredient');
const Recipe = require('../Models/Recipe');
const MenuItem = require('../Models/MenuItem');

// ── INGREDIENT ROUTES ──────────────────────────────────────────────

// GET all ingredients
router.get('/ingredients', authMiddleware, async (req, res) => {
  try {
    const ingredients = await Ingredient.find({}).sort({ category: 1, name: 1 });
    res.json({ success: true, data: ingredients });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch ingredients' });
  }
});

// POST add ingredient
router.post('/ingredients', authMiddleware, async (req, res) => {
  try {
    const { name, unit, currentStock, lowStockThreshold, category } = req.body;
    if (!name || !unit) {
      return res.status(400).json({ success: false, message: 'Name and unit are required' });
    }
    const ingredient = await Ingredient.create({ name, unit, currentStock, lowStockThreshold, category });
    res.status(201).json({ success: true, message: 'Ingredient added', data: ingredient });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add ingredient' });
  }
});

// PUT update ingredient
router.put('/ingredients/:id', authMiddleware, async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!ingredient) return res.status(404).json({ success: false, message: 'Ingredient not found' });
    res.json({ success: true, message: 'Ingredient updated', data: ingredient });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update ingredient' });
  }
});

// DELETE ingredient
router.delete('/ingredients/:id', authMiddleware, async (req, res) => {
  try {
    await Ingredient.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Ingredient deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete ingredient' });
  }
});

// PATCH restock ingredient
router.patch('/ingredients/:id/restock', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }
    const ingredient = await Ingredient.findByIdAndUpdate(
      req.params.id,
      { $inc: { currentStock: quantity } },
      { new: true }
    );
    if (!ingredient) return res.status(404).json({ success: false, message: 'Ingredient not found' });
    res.json({ success: true, message: `Restocked ${ingredient.name}`, data: ingredient });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to restock' });
  }
});

// GET low stock ingredients
router.get('/ingredients/low-stock', authMiddleware, async (req, res) => {
  try {
    const ingredients = await Ingredient.find({
      $expr: { $lte: ['$currentStock', '$lowStockThreshold'] }
    });
    res.json({ success: true, data: ingredients });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch low stock' });
  }
});

// ── RECIPE ROUTES ──────────────────────────────────────────────────

// GET all recipes
router.get('/recipes', authMiddleware, async (req, res) => {
  try {
    const recipes = await Recipe.find({})
      .populate('menuItem', 'name category')
      .populate('ingredients.ingredient', 'name unit');
    res.json({ success: true, data: recipes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch recipes' });
  }
});

// GET recipe for a specific menu item
router.get('/recipes/:menuItemId', authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ menuItem: req.params.menuItemId })
      .populate('menuItem', 'name category')
      .populate('ingredients.ingredient', 'name unit');
    res.json({ success: true, data: recipe });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch recipe' });
  }
});

// POST create/update recipe for menu item
router.post('/recipes', authMiddleware, async (req, res) => {
  try {
    const { menuItemId, ingredients } = req.body;
    if (!menuItemId || !ingredients || ingredients.length === 0) {
      return res.status(400).json({ success: false, message: 'Menu item and ingredients are required' });
    }
    const recipe = await Recipe.findOneAndUpdate(
      { menuItem: menuItemId },
      { menuItem: menuItemId, ingredients },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json({ success: true, message: 'Recipe saved', data: recipe });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save recipe' });
  }
});

// DELETE recipe
router.delete('/recipes/:menuItemId', authMiddleware, async (req, res) => {
  try {
    await Recipe.findOneAndDelete({ menuItem: req.params.menuItemId });
    res.json({ success: true, message: 'Recipe deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete recipe' });
  }
});

module.exports = router;
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { handleSuccess, handleError } from '../utils';
import { MdLogout, MdRefresh, MdAdd, MdDelete, MdBook, MdTableRestaurant } from 'react-icons/md';
import { io } from 'socket.io-client';
import '../css/kitchen-dashboard.css';
import logo from '../assets/logo.jpg';
import { useNavigate } from 'react-router-dom';
import API from '../config';

// Status config defines label and next action for each order status
const STATUS_CONFIG = {
  pending: { label: 'New Order', next: 'preparing', nextLabel: 'Start Preparing' },
  preparing: { label: 'Preparing', next: 'ready', nextLabel: 'Mark All Ready' }
};

function KitchenDashboard() {

  const navigate = useNavigate();

  // Which tab is active: orders, batch, or recipes
  const [activeTab, setActiveTab] = useState('orders');

  // All active orders (pending + preparing) from backend
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Timestamp of last refresh shown in header
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Consolidated batch view — items grouped by name across all tables
  const [consolidated, setConsolidated] = useState([]);
  const [loadingConsolidated, setLoadingConsolidated] = useState(false);

  // Recipe tab states
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);

  // JWT auth header used in all API requests
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Fetches all active orders (pending + preparing) from backend
  // Also refreshes batch view if currently on batch tab
  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/orders/active`, { headers });
      setOrders(res.data.data || []);
      setLastRefresh(new Date());
      if (activeTab === 'batch') fetchConsolidated();
    } catch (err) {
      handleError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Fetches consolidated batch view — groups same items across all active orders
  const fetchConsolidated = async () => {
    setLoadingConsolidated(true);
    try {
      const res = await axios.get(`${API}/api/orders/consolidated`, { headers });
      setConsolidated(res.data.data || []);
    } catch (err) {
      handleError('Failed to fetch consolidated orders');
    } finally {
      setLoadingConsolidated(false);
    }
  };

  // Socket.io — listens for real-time order events and refreshes orders automatically
  useEffect(() => {
    const socket = io(API);

    const handleOrderChange = () => {
      fetchOrders();
    };

    socket.on('orderPlaced', handleOrderChange);
    socket.on('orderUpdated', handleOrderChange);
    socket.on('orderStatusChanged', handleOrderChange);
    socket.on('orderPaid', handleOrderChange);

    return () => {
      socket.disconnect();
    };
  }, [fetchOrders]);

  // Fetches orders on mount and sets auto-refresh every 30 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Fetches relevant data when tab changes
  useEffect(() => {
    if (activeTab === 'batch') fetchConsolidated();
    if (activeTab === 'recipes') fetchRecipeData();
  }, [activeTab]);

  // Fetches menu items, ingredients, and recipes for the recipes tab
  // All three are loaded in parallel using Promise.all for efficiency
  const fetchRecipeData = async () => {
    setLoadingRecipes(true);
    try {
      const [menuRes, ingredientRes, recipeRes] = await Promise.all([
        axios.get(`${API}/api/menu`, { headers }),
        axios.get(`${API}/api/inventory/ingredients`, { headers }),
        axios.get(`${API}/api/inventory/recipes`, { headers })
      ]);
      setMenuItems(menuRes.data.data || []);
      setIngredients(ingredientRes.data.data || []);
      setRecipes(recipeRes.data.data || []);
    } catch (err) {
      handleError('Failed to load recipe data');
    } finally {
      setLoadingRecipes(false);
    }
  };

  // When a menu item is selected in recipes tab, load its existing recipe if available
  const handleSelectMenuItem = async (item) => {
    setSelectedMenuItem(item);
    const existing = recipes.find(r => r.menuItem?._id === item._id);
    if (existing) {
      setRecipeIngredients(existing.ingredients.map(i => ({
        ingredientId: i.ingredient._id,
        name: i.ingredient.name,
        unit: i.unit,
        quantity: i.quantity,
        searchTerm: i.ingredient.name,
        showDropdown: false
      })));
    } else {
      setRecipeIngredients([]);
    }
  };

  // Adds a blank ingredient row to the recipe builder
  const addIngredientRow = () => {
    setRecipeIngredients(prev => [...prev, {
      ingredientId: '', name: '', searchTerm: '',
      showDropdown: false, unit: 'g', quantity: ''
    }]);
  };

  // Updates a specific field in a recipe ingredient row by index
  const updateIngredientRow = (index, field, value) => {
    setRecipeIngredients(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Removes an ingredient row from the recipe builder by index
  const removeIngredientRow = (index) => {
    setRecipeIngredients(prev => prev.filter((_, i) => i !== index));
  };

  // Saves the recipe for the selected menu item
  // Creates or updates the recipe via POST (backend uses upsert)
  const handleSaveRecipe = async () => {
    if (!selectedMenuItem) return handleError('Select a menu item first');
    if (recipeIngredients.length === 0) return handleError('Add at least one ingredient');

    const hasEmpty = recipeIngredients.some(i => !i.ingredientId || !i.quantity);
    if (hasEmpty) return handleError('Select an ingredient and enter quantity for all rows');

    setSavingRecipe(true);
    try {
      await axios.post(`${API}/api/inventory/recipes`, {
        menuItemId: selectedMenuItem._id,
        ingredients: recipeIngredients.map(i => ({
          ingredient: i.ingredientId,
          quantity: parseFloat(i.quantity),
          unit: i.unit
        }))
      }, { headers });
      handleSuccess(`Recipe saved for ${selectedMenuItem.name}!`);
      fetchRecipeData();
    } catch (err) {
      handleError('Failed to save recipe');
    } finally {
      setSavingRecipe(false);
    }
  };

  // Deletes a recipe for a menu item after confirmation
  const handleDeleteRecipe = async (menuItemId, name) => {
    if (!window.confirm(`Delete recipe for "${name}"?`)) return;
    try {
      await axios.delete(`${API}/api/inventory/recipes/${menuItemId}`, { headers });
      handleSuccess('Recipe deleted');
      fetchRecipeData();
      if (selectedMenuItem?._id === menuItemId) {
        setSelectedMenuItem(null);
        setRecipeIngredients([]);
      }
    } catch (err) {
      handleError('Failed to delete recipe');
    }
  };

  // Updates order status — pending → preparing or preparing → ready
  // Refreshes both orders and batch view after status change
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await axios.patch(`${API}/api/orders/${orderId}/status`, { status: newStatus }, { headers });
      handleSuccess(newStatus === 'preparing' ? 'Started preparing!' : 'Order marked as ready!');
      fetchOrders();
      if (activeTab === 'batch') fetchConsolidated();
    } catch (err) {
      handleError('Failed to update order status');
    }
  };

  // Marks a single item as ready within an order
  // Only works if order is in preparing status (validated on backend)
  const handleItemReady = async (orderId, itemName) => {
    try {
      await axios.patch(`${API}/api/orders/${orderId}/item-ready`, { itemName }, { headers });
      handleSuccess(`${itemName} marked as ready!`);
      fetchOrders();
      fetchConsolidated();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to mark item ready';
      handleError(msg);
    }
  };

  // Marks an item ready for ALL tables at once from the batch view
  // Automatically starts preparing for any tables still in pending status
  const handleItemReadyAll = async (itemName) => {
    try {
      const res = await axios.patch(`${API}/api/orders/item-ready-all`, { itemName }, { headers });
      handleSuccess(res.data.message);
      fetchOrders();
      fetchConsolidated();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to mark all ready';
      handleError(msg);
    }
  };

  // Clears auth and redirects to login
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  // Returns human-readable elapsed time since order was placed
  const getElapsedTime = (createdAt) => {
    const diff = Math.floor((new Date() - new Date(createdAt)) / 1000 / 60);
    if (diff < 1) return 'Just now';
    if (diff === 1) return '1 min ago';
    return `${diff} mins ago`;
  };

  // Split orders into pending (new) and preparing columns
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');

  // Check if a menu item already has a recipe set
  const hasRecipe = (itemId) => recipes.some(r => r.menuItem?._id === itemId);

  return (
    <div className="kitchen-layout">

      {/* Header — logo, order counts, tab buttons, logout */}
      <header className="kitchen-header">
        <div className="kitchen-brand">
          <img
            src={logo}
            alt="TablEase"
            className="kitchen-logo"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div>
            <h1>Kitchen Display</h1>
            <p>Welcome, {localStorage.getItem('loggedInUser') || 'Kitchen Staff'}</p>
          </div>
        </div>

        <div className="kitchen-header-right">

          {/* Order count badges — only shown on Orders tab */}
          {activeTab === 'orders' && (
            <>
              <div className="order-counts">
                <span className="count-badge pending">{pendingOrders.length} New</span>
                <span className="count-badge preparing">{preparingOrders.length} Preparing</span>
              </div>
              <button className="refresh-btn" onClick={fetchOrders}>
                <MdRefresh size={20} /> Refresh
              </button>
              <p className="last-refresh">Updated: {lastRefresh.toLocaleTimeString()}</p>
            </>
          )}

          {/* Tab switcher — Orders, Batch, Recipes */}
          <div className="kitchen-tabs">
            <button
              className={`kitchen-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </button>
            <button
              className={`kitchen-tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
              onClick={() => setActiveTab('batch')}
            >
              <MdTableRestaurant size={16} /> Batch
            </button>
            <button
              className={`kitchen-tab-btn ${activeTab === 'recipes' ? 'active' : ''}`}
              onClick={() => setActiveTab('recipes')}
            >
              <MdBook size={16} /> Recipes
            </button>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <MdLogout size={18} /> Logout
          </button>

        </div>
      </header>

      {/* Orders Tab */}
      {/* Two columns: New Orders (pending) on left, Preparing on right */}
      {activeTab === 'orders' && (
        <main className="kitchen-main">
          {loading ? (
            <div className="kitchen-loading">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="kitchen-empty">
              <span>🎉</span>
              <h2>All caught up!</h2>
              <p>No active orders right now.</p>
            </div>
          ) : (
            <div className="kitchen-columns">

              {/* Left column — New Orders (pending) */}
              <div className="kitchen-column">
                <div className="column-header pending-header">
                  <h2>🔴 New Orders</h2>
                  <span className="column-count">{pendingOrders.length}</span>
                </div>
                <div className="orders-list">
                  {pendingOrders.length === 0 ? (
                    <div className="column-empty">No new orders</div>
                  ) : (
                    pendingOrders.map(order => (
                      <OrderCard
                        key={order._id}
                        order={order}
                        onStatusUpdate={handleStatusUpdate}
                        onItemReady={handleItemReady}
                        getElapsedTime={getElapsedTime}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Right column — Preparing */}
              <div className="kitchen-column">
                <div className="column-header preparing-header">
                  <h2>🟡 Preparing</h2>
                  <span className="column-count">{preparingOrders.length}</span>
                </div>
                <div className="orders-list">
                  {preparingOrders.length === 0 ? (
                    <div className="column-empty">Nothing being prepared</div>
                  ) : (
                    preparingOrders.map(order => (
                      <OrderCard
                        key={order._id}
                        order={order}
                        onStatusUpdate={handleStatusUpdate}
                        onItemReady={handleItemReady}
                        getElapsedTime={getElapsedTime}
                      />
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </main>
      )}

      {/* Batch Tab */}
      {/* Shows all pending/preparing items grouped by item name across all tables */}
      {activeTab === 'batch' && (
        <main className="kitchen-main">

          <div className="batch-header">
            <h2>Batch Preparation View</h2>
            <p>All pending items grouped together to prepare same items at once</p>
            <button className="refresh-btn" onClick={fetchConsolidated}>
              <MdRefresh size={18} /> Refresh
            </button>
          </div>

          {loadingConsolidated ? (
            <div className="kitchen-loading">Loading batch view...</div>
          ) : consolidated.length === 0 ? (
            <div className="kitchen-empty">
              <span>🎉</span>
              <h2>Nothing to prepare!</h2>
              <p>No pending items right now.</p>
            </div>
          ) : (
            <div className="batch-grid">
              {consolidated.map((item, i) => (
                <div key={i} className="batch-card">

                  {/* Item name and total quantity across all tables */}
                  <div className="batch-card-top">
                    <span className="batch-item-name">{item.name}</span>
                    <span className="batch-total-qty">{item.totalQty} total</span>
                  </div>

                  {/* Mark All Ready — marks this item ready for all tables at once */}
                  {/* Auto-starts preparing for any tables still pending */}
                  <button
                    className="batch-all-ready-btn"
                    onClick={() => handleItemReadyAll(item.name)}
                  >
                    ✓ Mark All Ready ({item.tables.length} tables)
                  </button>

                  {/* Individual table rows — mark ready per table */}
                  <div className="batch-tables">
                    {item.tables.map((t, j) => (
                      <div key={j} className="batch-table-row">
                        <span className="batch-table-num">Table {t.tableNumber}</span>
                        <span className="batch-table-qty">x{t.qty}</span>
                        <button
                          className="batch-ready-btn"
                          onClick={() => {
                            handleItemReady(t.orderId, item.name);
                            setTimeout(() => fetchConsolidated(), 500);
                          }}
                        >
                          ✓ Ready
                        </button>
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* Recipes Tab */}
      {/* Left: menu item list | Right: recipe builder for selected item */}
      {activeTab === 'recipes' && (
        <main className="kitchen-main">
          {loadingRecipes ? (
            <div className="kitchen-loading">Loading recipes...</div>
          ) : (
            <div className="recipes-layout">

              {/* Left — list of all menu items with recipe status badges */}
              <div className="recipes-menu-list">
                <h2>Menu Items</h2>
                <p className="recipes-hint">Select a dish to set its recipe</p>
                <div className="recipes-items">
                  {menuItems.map(item => (
                    <div
                      key={item._id}
                      className={`recipe-menu-item ${selectedMenuItem?._id === item._id ? 'selected' : ''}`}
                      onClick={() => handleSelectMenuItem(item)}
                    >
                      <div className="recipe-item-info">
                        <span className="recipe-item-name">{item.name}</span>
                        <span className="recipe-item-category">{item.category}</span>
                      </div>
                      <div className="recipe-item-right">
                        {hasRecipe(item._id)
                          ? <span className="recipe-badge has-recipe">✅ Recipe Set</span>
                          : <span className="recipe-badge no-recipe">⚠️ No Recipe</span>}
                        {hasRecipe(item._id) && (
                          <button
                            className="btn-delete-recipe"
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteRecipe(item._id, item.name);
                            }}
                          >
                            <MdDelete size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — recipe builder for selected menu item */}
              <div className="recipe-builder">
                {!selectedMenuItem ? (
                  <div className="recipe-empty">
                    <span>👈</span>
                    <p>Select a menu item to set its recipe</p>
                  </div>
                ) : (
                  <>
                    <div className="recipe-builder-header">
                      <h2>Recipe for: <span>{selectedMenuItem.name}</span></h2>
                      <p>Define ingredients needed for one serving</p>
                    </div>

                    {/* Ingredient rows — each row has search, quantity and unit */}
                    <div className="recipe-ingredients">
                      {recipeIngredients.length === 0 && (
                        <p className="recipe-no-ingredients">
                          No ingredients added yet. Click below to add.
                        </p>
                      )}

                      {recipeIngredients.map((row, index) => {
                        const filtered = ingredients.filter(i =>
                          i.name.toLowerCase().includes(row.searchTerm?.toLowerCase() || '')
                        );
                        const exactMatch = ingredients.find(
                          i => i.name.toLowerCase() === row.searchTerm?.toLowerCase()
                        );

                        return (
                          <div key={index} className="recipe-ingredient-row">

                            {/* Ingredient search with dropdown — can create new if not found */}
                            <div className="ingredient-search-wrap">
                              <input
                                type="text"
                                value={row.searchTerm || row.name}
                                onChange={e => updateIngredientRow(index, 'searchTerm', e.target.value)}
                                onFocus={() => updateIngredientRow(index, 'showDropdown', true)}
                                onBlur={() => setTimeout(() => updateIngredientRow(index, 'showDropdown', false), 200)}
                                placeholder="Search ingredient..."
                                className={row.ingredientId ? 'selected-ingredient' : ''}
                              />

                              {row.showDropdown && row.searchTerm && (
                                <div className="ingredient-dropdown">
                                  {filtered.map(ing => (
                                    <div
                                      key={ing._id}
                                      className="ingredient-option"
                                      onMouseDown={() => {
                                        updateIngredientRow(index, 'ingredientId', ing._id);
                                        updateIngredientRow(index, 'name', ing.name);
                                        updateIngredientRow(index, 'searchTerm', ing.name);
                                        updateIngredientRow(index, 'unit', ing.unit);
                                        updateIngredientRow(index, 'showDropdown', false);
                                      }}
                                    >
                                      {ing.name} <span className="ing-unit">({ing.unit})</span>
                                    </div>
                                  ))}

                                  {/* Create new ingredient if no exact match found */}
                                  {!exactMatch && row.searchTerm.trim() && (
                                    <div
                                      className="ingredient-option create-new"
                                      onMouseDown={async () => {
                                        try {
                                          const res = await axios.post(`${API}/api/inventory/ingredients`, {
                                            name: row.searchTerm.trim(),
                                            unit: row.unit,
                                            currentStock: 0,
                                            lowStockThreshold: 1,
                                            category: 'Other'
                                          }, { headers });
                                          const newIng = res.data.data;
                                          handleSuccess(`"${newIng.name}" added!`);
                                          await fetchRecipeData();
                                          updateIngredientRow(index, 'ingredientId', newIng._id);
                                          updateIngredientRow(index, 'name', newIng.name);
                                          updateIngredientRow(index, 'searchTerm', newIng.name);
                                          updateIngredientRow(index, 'showDropdown', false);
                                        } catch {
                                          handleError('Failed to create ingredient');
                                        }
                                      }}
                                    >
                                      ➕ Create "{row.searchTerm.trim()}"
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Quantity input */}
                            <input
                              type="number"
                              value={row.quantity}
                              onChange={e => updateIngredientRow(index, 'quantity', e.target.value)}
                              placeholder="Qty"
                              min="0"
                            />

                            {/* Unit selector */}
                            <select
                              value={row.unit}
                              onChange={e => updateIngredientRow(index, 'unit', e.target.value)}
                            >
                              {['kg', 'g', 'liter', 'ml', 'pcs'].map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>

                            {/* Remove this ingredient row */}
                            <button
                              className="btn-remove-ingredient"
                              onClick={() => removeIngredientRow(index)}
                            >
                              <MdDelete size={16} />
                            </button>

                          </div>
                        );
                      })}
                    </div>

                    {/* Add new ingredient row button */}
                    <button className="btn-add-ingredient" onClick={addIngredientRow}>
                      <MdAdd size={16} /> Add Ingredient
                    </button>

                    {/* Save recipe button */}
                    <button
                      className="btn-save-recipe"
                      onClick={handleSaveRecipe}
                      disabled={savingRecipe}
                    >
                      {savingRecipe ? 'Saving...' : '💾 Save Recipe'}
                    </button>
                  </>
                )}
              </div>

            </div>
          )}
        </main>
      )}

    </div>
  );
}

// OrderCard component — renders a single order card in the orders tab
// Shows items, allergies, notes and action button (Start Preparing or Mark All Ready)
function OrderCard({ order, onStatusUpdate, onItemReady, getElapsedTime }) {
  const config = STATUS_CONFIG[order.status];
  const tableNum = order.table?.tableNumber || 'Unknown';
  if (!config) return null;

  // Only show new items (isNew: true) when order is pending
  // Show all items when order is preparing
  const visibleItems = order.items.filter(item =>
    order.status === 'pending' ? item.isNew !== false : true
  );

  return (
    <div className={`order-card ${order.status}`}>

      {/* Card header — table number and elapsed time */}
      <div className="order-card-header">
        <div className="order-table">Table {tableNum}</div>
        <div className="order-time">{getElapsedTime(order.createdAt)}</div>
      </div>

      {/* Status bar — shows current status label */}
      <div className="order-status-bar">{config.label}</div>

      {/* Items list — shows ✓ Ready button per item when preparing */}
      <div className="order-items">
        {visibleItems.map((item, i) => (
          <div key={i} className={`order-item ${item.isReady ? 'item-ready' : ''}`}>
            <span className="order-item-qty">x{item.qty}</span>
            <span className="order-item-name">{item.name}</span>

            {/* Show Ready button only for unready items in preparing status */}
            {order.status === 'preparing' && !item.isReady && (
              <button
                className="item-ready-btn"
                onClick={() => onItemReady(order._id, item.name)}
              >
                ✓ Ready
              </button>
            )}

            {/* Show checkmark badge when item is already marked ready */}
            {item.isReady && (
              <span className="item-ready-badge">✅ Ready</span>
            )}
          </div>
        ))}
      </div>

      {/* Allergy warning — shown if order has any allergies */}
      {order.allergies && order.allergies.length > 0 && (
        <div className="order-allergies">
          <span className="allergy-label">⚠️ Allergies:</span>
          {order.allergies.map(a => (
            <span key={a} className="allergy-chip">{a}</span>
          ))}
        </div>
      )}

      {/* Special notes from waiter */}
      {order.notes && (
        <div className="order-notes">📝 {order.notes}</div>
      )}

      {/* Main action button — Start Preparing or Mark All Ready */}
      <button
        className={`action-btn ${order.status}`}
        onClick={() => onStatusUpdate(order._id, config.next)}
      >
        {config.nextLabel}
      </button>

    </div>
  );
}

export default KitchenDashboard;
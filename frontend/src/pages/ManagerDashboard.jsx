import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleSuccess, handleError } from '../utils';
import {
  MdLogout, MdInventory, MdBarChart, MdRefresh,
  MdAdd, MdEdit, MdDelete, MdClose, MdKitchen
} from 'react-icons/md';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
  PointElement, LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import '../css/manager-dashboard.css';
import logo from '../assets/logo.jpg';
import API from '../config';

// Register all Chart.js components needed for Bar and Doughnut charts
ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
  PointElement, LineElement
);

function ManagerDashboard() {

  // Which sidebar tab is currently active
  const [activeTab, setActiveTab] = useState('stock');

  // All ingredients fetched from the database
  const [ingredients, setIngredients] = useState([]);

  // Loading state for the stock table
  const [loadingStock, setLoadingStock] = useState(false);

  // Which ingredient is being restocked (null = modal closed)
  const [restockModal, setRestockModal] = useState(null);

  // Quantity and unit entered in the restock modal
  const [restockQty, setRestockQty] = useState('');
  const [restockUnit, setRestockUnit] = useState('');

  // Controls visibility of the add/edit ingredient modal
  const [showIngredientModal, setShowIngredientModal] = useState(false);

  // Holds the ingredient being edited (null = adding new)
  const [editingIngredient, setEditingIngredient] = useState(null);

  // Form values for add/edit ingredient modal
  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    unit: 'kg',
    currentStock: '',
    lowStockThreshold: '',
    category: 'Other'
  });

  // Sales report data returned from backend
  const [salesData, setSalesData] = useState(null);

  // Loading state for the sales tab
  const [loadingSales, setLoadingSales] = useState(false);

  // Selected period for sales report: today, week, or month
  const [period, setPeriod] = useState('today');

  // JWT token from localStorage used in all API request headers
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Dropdown options for ingredient categories and units
  const ingredientCategories = ['Meat', 'Vegetable', 'Spice', 'Sauce', 'Grain', 'Dairy', 'Other'];
  const units = ['kg', 'g', 'liter', 'ml', 'pcs', 'packet'];

  // Fetch data whenever the active tab changes
  useEffect(() => {
    if (activeTab === 'stock' || activeTab === 'ingredients') fetchStock();
    if (activeTab === 'sales') fetchSales();
  }, [activeTab]);

  // Fetches all ingredients from the inventory API
  // Used by both the Stock tab and the Ingredients tab
  const fetchStock = async () => {
    setLoadingStock(true);
    try {
      const res = await axios.get(`${API}/api/inventory/ingredients`, { headers });
      setIngredients(res.data.data || []);
    } catch {
      handleError('Failed to load stock');
    } finally {
      setLoadingStock(false);
    }
  };

  // Fetches sales report data for the selected period (today/week/month)
  const fetchSales = async (p = period) => {
    setLoadingSales(true);
    try {
      const res = await axios.get(`${API}/api/orders/sales-report?period=${p}`, { headers });
      setSalesData(res.data.data);
    } catch {
      handleError('Failed to load sales data');
    } finally {
      setLoadingSales(false);
    }
  };

  // Sends a PATCH request to add quantity to an ingredient's stock
  // Also updates the unit in case manager changed it during restock
  const handleRestock = async () => {
    if (!restockQty || parseFloat(restockQty) <= 0) {
      return handleError('Enter a valid quantity');
    }
    try {
      await axios.patch(
        `${API}/api/inventory/ingredients/${restockModal._id}/restock`,
        { quantity: parseFloat(restockQty), unit: restockUnit },
        { headers }
      );
      handleSuccess(`Restocked ${restockModal.name} — added ${restockQty} ${restockUnit}!`);
      setRestockModal(null);
      setRestockQty('');
      fetchStock();
    } catch {
      handleError('Failed to restock');
    }
  };

  // Opens the ingredient modal in ADD mode with blank form fields
  const openAddIngredientModal = () => {
    setEditingIngredient(null);
    setIngredientForm({
      name: '',
      unit: 'kg',
      currentStock: '',
      lowStockThreshold: '',
      category: 'Other'
    });
    setShowIngredientModal(true);
  };

  // Opens the ingredient modal in EDIT mode pre-filled with existing data
  const openEditIngredientModal = (ingredient) => {
    setEditingIngredient(ingredient);
    setIngredientForm({
      name: ingredient.name,
      unit: ingredient.unit,
      currentStock: ingredient.currentStock,
      lowStockThreshold: ingredient.lowStockThreshold,
      category: ingredient.category
    });
    setShowIngredientModal(true);
  };

  // Saves ingredient — calls POST to create new or PUT to update existing
  const handleIngredientSave = async () => {
    if (!ingredientForm.name || !ingredientForm.unit) {
      return handleError('Name and unit are required');
    }
    try {
      if (editingIngredient) {
        // Update existing ingredient
        await axios.put(
          `${API}/api/inventory/ingredients/${editingIngredient._id}`,
          ingredientForm,
          { headers }
        );
        handleSuccess('Ingredient updated!');
      } else {
        // Create new ingredient
        await axios.post(
          `${API}/api/inventory/ingredients`,
          ingredientForm,
          { headers }
        );
        handleSuccess('Ingredient added!');
      }
      setShowIngredientModal(false);
      fetchStock();
    } catch {
      handleError('Failed to save ingredient');
    }
  };

  // Deletes an ingredient after user confirms the action
  const handleIngredientDelete = async (id, name) => {
    if (!window.confirm(`Delete ingredient "${name}"?`)) return;
    try {
      await axios.delete(`${API}/api/inventory/ingredients/${id}`, { headers });
      handleSuccess('Ingredient deleted');
      fetchStock();
    } catch {
      handleError('Failed to delete ingredient');
    }
  };

  // Updates the period state and re-fetches sales data for new period
  const handlePeriodChange = (p) => {
    setPeriod(p);
    fetchSales(p);
  };

  // Clears localStorage and redirects to login page
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  // Filter ingredients where currentStock is at or below the alert threshold
  const lowStockItems = ingredients.filter(
    i => i.currentStock <= i.lowStockThreshold
  );

  // Bar chart configuration for daily revenue
  const revenueChartData = {
    labels: salesData?.dailyData?.map(d => d.date) || [],
    datasets: [{
      label: 'Revenue (Rs.)',
      data: salesData?.dailyData?.map(d => d.revenue) || [],
      backgroundColor: 'rgba(240, 165, 0, 0.7)',
      borderColor: '#f0a500',
      borderWidth: 2,
      borderRadius: 6,
    }]
  };

  const revenueChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Daily Revenue (Rs.)',
        font: { size: 14 }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `Rs. ${ctx.raw.toLocaleString()}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `Rs. ${value.toLocaleString()}`
        }
      }
    }
  };

  // Doughnut chart configuration for popular items by quantity sold
  const popularChartData = {
    labels: salesData?.popularItems?.map(i => i.name) || [],
    datasets: [{
      data: salesData?.popularItems?.map(i => i.qty) || [],
      backgroundColor: ['#f0a500', '#ff8c42', '#27ae60', '#2980b9', '#9b59b6'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const popularChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: { font: { size: 12 } }
      },
      title: {
        display: true,
        text: 'Popular Items by Quantity Sold',
        font: { size: 14 }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.raw} sold`
        }
      }
    }
  };

  return (
    <div className="manager-layout">

      {/* Sidebar with logo, nav tabs and logout */}
      <aside className="manager-sidebar">

        {/* Brand section with logo and welcome message */}
        <div className="manager-brand">
          <img src={logo} alt="TablEase" className="sidebar-logo" />
          <div>
            <div className="manager-brand-name">TablEase</div>
            <div className="manager-brand-role">
              Welcome, {localStorage.getItem('loggedInUser') || 'Manager'}
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="manager-nav">

          {/* Stock & Inventory — view stock levels and restock */}
          <button
            className={`manager-nav-item ${activeTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            <MdInventory size={20} /> Stock & Inventory
          </button>

          {/* Ingredients — full CRUD management */}
          <button
            className={`manager-nav-item ${activeTab === 'ingredients' ? 'active' : ''}`}
            onClick={() => setActiveTab('ingredients')}
          >
            <MdKitchen size={20} /> Ingredients
          </button>

          {/* Sales & Reports — charts and revenue data */}
          <button
            className={`manager-nav-item ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            <MdBarChart size={20} /> Sales & Reports
          </button>

        </nav>

        {/* Logout button at bottom of sidebar */}
        <button className="manager-logout-btn" onClick={handleLogout}>
          <MdLogout size={20} /> Logout
        </button>

      </aside>

      {/* Main content area — changes based on activeTab */}
      <main className="manager-main">

        {/* Stock & Inventory Tab */}
        {/* Shows all ingredients with current stock levels and restock button */}
        {activeTab === 'stock' && (
          <div className="manager-section">

            <div className="manager-section-header">
              <h1>Stock & Inventory</h1>
              <button className="manager-refresh-btn" onClick={fetchStock}>
                <MdRefresh size={18} /> Refresh
              </button>
            </div>

            {/* Red banner showing ingredients below threshold */}
            {lowStockItems.length > 0 && (
              <div className="low-stock-banner">
                <h3>⚠️ Low Stock Alerts ({lowStockItems.length})</h3>
                <div className="low-stock-items">
                  {lowStockItems.map(item => (
                    <div key={item._id} className="low-stock-chip">
                      {item.name}: {item.currentStock}{item.unit}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stock table — shows all ingredients with restock button */}
            {loadingStock ? (
              <div className="manager-loading">Loading stock...</div>
            ) : (
              <div className="stock-table-wrap">
                <table className="stock-table">
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Category</th>
                      <th>Current Stock</th>
                      <th>Unit</th>
                      <th>Alert Threshold</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}
                        >
                          No ingredients found
                        </td>
                      </tr>
                    ) : (
                      ingredients.map(ing => (
                        <tr
                          key={ing._id}
                          className={
                            ing.currentStock <= ing.lowStockThreshold
                              ? 'low-stock-row'
                              : ''
                          }
                        >
                          <td><strong>{ing.name}</strong></td>
                          <td>{ing.category}</td>
                          <td>
                            {/* Stock value turns red when below threshold */}
                            <span className={`stock-value ${ing.currentStock <= ing.lowStockThreshold ? 'low' : 'ok'}`}>
                              {ing.currentStock}
                            </span>
                          </td>
                          <td>{ing.unit}</td>
                          <td>{ing.lowStockThreshold} {ing.unit}</td>
                          <td>
                            {ing.currentStock <= ing.lowStockThreshold
                              ? <span className="status-low">⚠️ Low</span>
                              : <span className="status-ok">✅ OK</span>}
                          </td>
                          <td>
                            {/* Opens restock modal for this ingredient */}
                            <button
                              className="restock-btn"
                              onClick={() => {
                                setRestockModal(ing);
                                setRestockQty('');
                                setRestockUnit(ing.unit);
                              }}
                            >
                              <MdAdd size={14} /> Restock
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Ingredients Tab */}
        {/* Full CRUD — manager can add, edit and delete ingredients */}
        {activeTab === 'ingredients' && (
          <div className="manager-section">

            <div className="manager-section-header">
              <h1>Ingredients</h1>
              {/* Opens the add ingredient modal */}
              <button className="manager-refresh-btn" onClick={openAddIngredientModal}>
                <MdAdd size={18} /> Add Ingredient
              </button>
            </div>

            {loadingStock ? (
              <div className="manager-loading">Loading ingredients...</div>
            ) : ingredients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                <p>No ingredients yet.</p>
                <button className="manager-refresh-btn" onClick={openAddIngredientModal}>
                  <MdAdd size={16} /> Add your first ingredient
                </button>
              </div>
            ) : (
              <div className="stock-table-wrap">
                <table className="stock-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Current Stock</th>
                      <th>Unit</th>
                      <th>Low Stock Alert</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map(ingredient => (
                      <tr key={ingredient._id}>
                        <td><strong>{ingredient.name}</strong></td>
                        <td>{ingredient.category}</td>
                        <td>{ingredient.currentStock}</td>
                        <td>{ingredient.unit}</td>
                        <td>{ingredient.lowStockThreshold} {ingredient.unit}</td>
                        <td>
                          {ingredient.currentStock <= ingredient.lowStockThreshold
                            ? <span className="status-low">⚠️ Low Stock</span>
                            : <span className="status-ok">✅ OK</span>}
                        </td>
                        <td>
                          {/* Edit and Delete action buttons */}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="restock-btn"
                              style={{ background: '#2980b9' }}
                              onClick={() => openEditIngredientModal(ingredient)}
                            >
                              <MdEdit size={14} /> Edit
                            </button>
                            <button
                              className="restock-btn"
                              style={{ background: '#e74c3c' }}
                              onClick={() => handleIngredientDelete(ingredient._id, ingredient.name)}
                            >
                              <MdDelete size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sales & Reports Tab */}
        {/* Shows revenue charts and popular items for selected period */}
        {activeTab === 'sales' && (
          <div className="manager-section">

            <div className="manager-section-header">
              <h1>Sales & Reports</h1>
              {/* Period filter buttons — today, week, month */}
              <div className="period-buttons">
                {['today', 'week', 'month'].map(p => (
                  <button
                    key={p}
                    className={`period-btn ${period === p ? 'active' : ''}`}
                    onClick={() => handlePeriodChange(p)}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {loadingSales ? (
              <div className="manager-loading">Loading sales data...</div>
            ) : !salesData ? null : (
              <>
                {/* Summary stat cards */}
                <div className="sales-stats">
                  <div className="sales-stat-card">
                    <h3>Total Revenue</h3>
                    <p className="sales-stat-value">
                      Rs. {salesData.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="sales-stat-card">
                    <h3>Total Orders</h3>
                    <p className="sales-stat-value">{salesData.totalOrders}</p>
                  </div>
                  <div className="sales-stat-card">
                    <h3>Avg Order Value</h3>
                    <p className="sales-stat-value">
                      Rs. {salesData.totalOrders > 0
                        ? (salesData.totalRevenue / salesData.totalOrders).toFixed(0)
                        : 0}
                    </p>
                  </div>
                </div>

                {/* Revenue bar chart and popular items doughnut chart */}
                <div className="charts-grid">
                  <div className="chart-card">
                    {salesData.dailyData.length === 0 ? (
                      <div className="chart-empty">No revenue data for this period</div>
                    ) : (
                      <Bar data={revenueChartData} options={revenueChartOptions} />
                    )}
                  </div>
                  <div className="chart-card">
                    {salesData.popularItems.length === 0 ? (
                      <div className="chart-empty">No sales data for this period</div>
                    ) : (
                      <Doughnut data={popularChartData} options={popularChartOptions} />
                    )}
                  </div>
                </div>

                {/* Top 5 popular items with progress bars */}
                <div className="popular-card">
                  <h2>🔥 Top 5 Popular Items</h2>
                  {salesData.popularItems.length === 0 ? (
                    <p className="chart-empty">No data for this period</p>
                  ) : (
                    <div className="popular-items">
                      {salesData.popularItems.map((item, i) => (
                        <div key={i} className="popular-item">
                          <div className="popular-rank">#{i + 1}</div>
                          <div className="popular-info">
                            <span className="popular-name">{item.name}</span>
                            {/* Progress bar width = this item's qty as % of top item's qty */}
                            <div className="popular-bar-wrap">
                              <div
                                className="popular-bar"
                                style={{
                                  width: `${(item.qty / salesData.popularItems[0].qty) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                          <div className="popular-stats">
                            <span className="popular-qty">{item.qty} sold</span>
                            <span className="popular-revenue">Rs. {item.revenue.toFixed(0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

      </main>

      {/* Restock Modal */}
      {/* Opens when manager clicks Restock button on a stock row */}
      {restockModal && (
        <div className="modal-overlay" onClick={() => setRestockModal(null)}>
          <div className="restock-modal" onClick={e => e.stopPropagation()}>

            <h2>Restock: {restockModal.name}</h2>
            <p>
              Current stock:{' '}
              <strong>{restockModal.currentStock} {restockModal.unit}</strong>
            </p>

            <div className="restock-input-wrap">
              <label>Add quantity</label>
              <div className="restock-input-row">
                {/* Quantity input */}
                <input
                  type="number"
                  value={restockQty}
                  onChange={e => setRestockQty(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  autoFocus
                />
                {/* Unit selector — manager can change unit during restock */}
                <select
                  value={restockUnit}
                  onChange={e => setRestockUnit(e.target.value)}
                >
                  {units.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview of what will be added */}
            {restockQty && (
              <p className="restock-preview">
                Adding: <strong>{restockQty} {restockUnit}</strong> to current stock of{' '}
                <strong>{restockModal.currentStock} {restockModal.unit}</strong>
              </p>
            )}

            <div className="restock-modal-footer">
              <button className="btn-cancel" onClick={() => setRestockModal(null)}>
                Cancel
              </button>
              <button className="btn-confirm-restock" onClick={handleRestock}>
                Confirm Restock
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add / Edit Ingredient Modal */}
      {/* Used by both add new and edit existing ingredient actions */}
      {showIngredientModal && (
        <div className="modal-overlay" onClick={() => setShowIngredientModal(false)}>
          <div
            className="restock-modal"
            style={{ width: '480px', maxWidth: '95vw' }}
            onClick={e => e.stopPropagation()}
          >

            {/* Modal header with title and close button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>
                {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
              </h2>
              <button
                onClick={() => setShowIngredientModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
              >
                <MdClose size={22} />
              </button>
            </div>

            {/* Name and Category row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#555', display: 'block', marginBottom: '4px' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={ingredientForm.name}
                  onChange={e => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                  placeholder="e.g. Chicken"
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#555', display: 'block', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  value={ingredientForm.category}
                  onChange={e => setIngredientForm({ ...ingredientForm, category: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '0.88rem', outline: 'none' }}
                >
                  {ingredientCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Unit and Current Stock row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#555', display: 'block', marginBottom: '4px' }}>
                  Unit *
                </label>
                <select
                  value={ingredientForm.unit}
                  onChange={e => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '0.88rem', outline: 'none' }}
                >
                  {units.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#555', display: 'block', marginBottom: '4px' }}>
                  Current Stock *
                </label>
                <input
                  type="number"
                  value={ingredientForm.currentStock}
                  onChange={e => setIngredientForm({ ...ingredientForm, currentStock: e.target.value })}
                  placeholder="e.g. 10"
                  min="0"
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Low stock threshold — alert fires when stock drops to this level */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#555', display: 'block', marginBottom: '4px' }}>
                Low Stock Alert Threshold *
              </label>
              <input
                type="number"
                value={ingredientForm.lowStockThreshold}
                onChange={e => setIngredientForm({ ...ingredientForm, lowStockThreshold: e.target.value })}
                placeholder="e.g. 1 (alert when stock falls below this)"
                min="0"
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Modal action buttons */}
            <div className="restock-modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowIngredientModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-confirm-restock"
                onClick={handleIngredientSave}
              >
                {editingIngredient ? 'Save Changes' : 'Add Ingredient'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default ManagerDashboard;
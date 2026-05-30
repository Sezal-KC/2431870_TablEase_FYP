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
import { io } from 'socket.io-client';
import '../css/manager-dashboard.css';
import logo from '../assets/logo.jpg';
import API from '../config';
import { useNavigate } from 'react-router-dom';

// Register all Chart.js components needed for Bar and Doughnut charts
ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
  PointElement, LineElement
);

function ManagerDashboard() {

  const navigate = useNavigate();

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

  // Search terms for stock and ingredients tabs
  const [stockSearch, setStockSearch] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');

  // JWT token from localStorage used in all API request headers
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Dropdown options for ingredient categories and units
  const ingredientCategories = ['Meat', 'Vegetable', 'Spice', 'Sauce', 'Grain', 'Dairy', 'Other'];
  const units = ['kg', 'g', 'liter', 'ml', 'pcs', 'packet'];

  // Socket.io for real-time stock updates
  useEffect(() => {
    const socket = io(API);

    socket.on('stockUpdate', (updatedIngredient) => {
      setIngredients(prev => {
        const exists = prev.some(item => item._id === updatedIngredient._id);
        if (exists) {
          return prev.map(item => item._id === updatedIngredient._id ? updatedIngredient : item);
        }
        return [...prev, updatedIngredient].sort((a, b) => a.name.localeCompare(b.name));
      });
    });

    socket.on('ingredientDeleted', (id) => {
      setIngredients(prev => prev.filter(item => item._id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch data whenever the active tab changes
  useEffect(() => {
    if (activeTab === 'stock' || activeTab === 'ingredients') fetchStock();
    if (activeTab === 'sales') fetchSales();
  }, [activeTab]);

  // Fetches all ingredients from the inventory API
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

  // Handles restock with automatic unit conversion

  const handleRestock = async () => {
    if (!restockQty || parseFloat(restockQty) <= 0) {
      return handleError('Enter a valid quantity');
    }

    // Convert unit if different from ingredient's stored unit
    let finalQty = parseFloat(restockQty);
    let finalUnit = restockUnit;

    if (restockUnit === 'kg' && restockModal.unit === 'g') {
      finalQty = finalQty * 1000;
      finalUnit = 'g';
    } else if (restockUnit === 'g' && restockModal.unit === 'kg') {
      finalQty = finalQty / 1000;
      finalUnit = 'kg';
    } else if (restockUnit === 'liter' && restockModal.unit === 'ml') {
      finalQty = finalQty * 1000;
      finalUnit = 'ml';
    } else if (restockUnit === 'ml' && restockModal.unit === 'liter') {
      finalQty = finalQty / 1000;
      finalUnit = 'liter';
    }

    try {
      await axios.patch(
        `${API}/api/inventory/ingredients/${restockModal._id}/restock`,
        { quantity: finalQty, unit: finalUnit },
        { headers }
      );
      handleSuccess(
        `Restocked ${restockModal.name} — added ${restockQty} ${restockUnit}` +
        (finalUnit !== restockUnit ? ` (converted to ${finalQty} ${finalUnit})` : '') +
        `!`
      );
      setRestockModal(null);
      setRestockQty('');
      fetchStock();
    } catch {
      handleError('Failed to restock');
    }
  };

  // Calculates the converted quantity for preview in restock modal
  const getConvertedQty = () => {
    if (!restockQty) return null;
    const qty = parseFloat(restockQty);
    if (restockUnit === 'kg' && restockModal.unit === 'g') return { qty: qty * 1000, unit: 'g' };
    if (restockUnit === 'g' && restockModal.unit === 'kg') return { qty: qty / 1000, unit: 'kg' };
    if (restockUnit === 'liter' && restockModal.unit === 'ml') return { qty: qty * 1000, unit: 'ml' };
    if (restockUnit === 'ml' && restockModal.unit === 'liter') return { qty: qty / 1000, unit: 'liter' };
    return null;
  };

  // Calculates the new total stock after restock for preview
  const getNewTotal = () => {
    if (!restockQty) return null;
    const converted = getConvertedQty();
    const addQty = converted ? converted.qty : parseFloat(restockQty);
    return restockModal.currentStock + addQty;
  };

  // Opens the ingredient modal in ADD mode with blank form fields
  const openAddIngredientModal = () => {
    setEditingIngredient(null);
    setIngredientForm({
      name: '', unit: 'kg', currentStock: '', lowStockThreshold: '', category: 'Other'
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

  // Saves ingredient — POST to create new or PUT to update existing
  const handleIngredientSave = async () => {
    if (!ingredientForm.name || !ingredientForm.unit) {
      return handleError('Name and unit are required');
    }
    try {
      if (editingIngredient) {
        await axios.put(
          `${API}/api/inventory/ingredients/${editingIngredient._id}`,
          ingredientForm,
          { headers }
        );
        handleSuccess('Ingredient updated!');
      } else {
        await axios.post(`${API}/api/inventory/ingredients`, ingredientForm, { headers });
        handleSuccess('Ingredient added!');
      }
      setShowIngredientModal(false);
      fetchStock();
    } catch {
      handleError('Failed to save ingredient');
    }
  };

  // Deletes an ingredient after user confirms
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

  // Updates the period state and re-fetches sales data
  const handlePeriodChange = (p) => {
    setPeriod(p);
    fetchSales(p);
  };

  // Clears localStorage and redirects to login
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  // Exports current sales report as a CSV file
  const handleExportReport = () => {
    if (!salesData) return handleError('No data to export. Load a report first.');

    const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
    const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

    // Section 1: Summary
    const summaryRows = [
      ['TablEase POS - Sales Report'],
      [`Period: ${periodLabel}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['SUMMARY'],
      ['Metric', 'Value'],
      ['Total Revenue', `Rs. ${salesData.totalRevenue.toLocaleString()}`],
      ['Total Orders', salesData.totalOrders],
      ['Average Order Value', `Rs. ${salesData.totalOrders > 0 ? (salesData.totalRevenue / salesData.totalOrders).toFixed(0) : 0}`],
      [],
    ];

    // Section 2: Daily Revenue
    const dailyRows = [
      ['DAILY REVENUE'],
      ['Date', 'Revenue (Rs.)', 'Orders'],
      ...salesData.dailyData.map(d => [d.date, d.revenue.toFixed(0), d.orders]),
      [],
    ];

    // Section 3: Popular Items
    const popularRows = [
      ['TOP 5 POPULAR ITEMS'],
      ['Rank', 'Item Name', 'Qty Sold', 'Revenue (Rs.)'],
      ...salesData.popularItems.map((item, i) => [
        `#${i + 1}`,
        item.name,
        item.qty,
        item.revenue.toFixed(0)
      ]),
    ];

    // Combine all sections and convert to CSV string
    const csvContent = [...summaryRows, ...dailyRows, ...popularRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TablEase_Report_${periodLabel}_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    handleSuccess(`${periodLabel} report downloaded!`);
  };

  // Ingredients below or at their alert threshold
  const lowStockItems = ingredients.filter(i => i.currentStock <= i.lowStockThreshold);

  // Filtered ingredients for stock tab search
  const filteredStock = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(stockSearch.toLowerCase())
  );

  // Filtered ingredients for ingredients tab search
  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  // Chart configurations

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
      title: { display: true, text: 'Daily Revenue (Rs.)', font: { size: 14 } },
      tooltip: { callbacks: { label: (ctx) => `Rs. ${ctx.raw.toLocaleString()}` } }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (value) => `Rs. ${value.toLocaleString()}` }
      }
    }
  };

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
      legend: { position: 'right', labels: { font: { size: 12 } } },
      title: { display: true, text: 'Popular Items by Quantity Sold', font: { size: 14 } },
      tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} sold` } }
    }
  };

  return (
    <div className="manager-layout">

      {/* Sidebar with logo, nav tabs and logout */}
      <aside className="manager-sidebar">

        {/* Brand section */}
        <div className="manager-brand">
          <img src={logo} alt="TablEase" className="sidebar-logo" />
          <div>
            <div className="manager-brand-name">TablEase</div>
            <div className="manager-brand-role">
              Welcome, {localStorage.getItem('loggedInUser') || 'Manager'}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="manager-nav">
          <button
            className={`manager-nav-item ${activeTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            <MdInventory size={20} /> Stock & Inventory
          </button>
          <button
            className={`manager-nav-item ${activeTab === 'ingredients' ? 'active' : ''}`}
            onClick={() => setActiveTab('ingredients')}
          >
            <MdKitchen size={20} /> Ingredients
          </button>
          <button
            className={`manager-nav-item ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            <MdBarChart size={20} /> Sales & Reports
          </button>
        </nav>

        <button className="manager-logout-btn" onClick={handleLogout}>
          <MdLogout size={20} /> Logout
        </button>

      </aside>

      {/* Main content */}
      <main className="manager-main">

        {/* STOCK & INVENTORY TAB */}
        {activeTab === 'stock' && (
          <div className="manager-section">

            <div className="manager-section-header">
              <h1>Stock & Inventory</h1>
              <button className="manager-refresh-btn" onClick={fetchStock}>
                <MdRefresh size={18} /> Refresh
              </button>
            </div>

            {/* Search bar for filtering stock table */}
            <div className="menu-search" style={{ marginBottom: '16px', maxWidth: '400px' }}>
              <input
                type="text"
                value={stockSearch}
                onChange={e => setStockSearch(e.target.value)}
                placeholder="🔍 Search ingredients..."
                className="menu-search-input"
              />
              {stockSearch && (
                <button className="search-clear-btn" onClick={() => setStockSearch('')}>✕</button>
              )}
            </div>

            {/* Low stock alert banner */}
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

            {/* Stock table with search filter applied */}
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
                    {filteredStock.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>
                          {stockSearch ? `No results for "${stockSearch}"` : 'No ingredients found'}
                        </td>
                      </tr>
                    ) : (
                      filteredStock.map(ing => (
                        <tr
                          key={ing._id}
                          className={ing.currentStock <= ing.lowStockThreshold ? 'low-stock-row' : ''}
                        >
                          <td><strong>{ing.name}</strong></td>
                          <td>{ing.category}</td>
                          <td>
                            {/* Turns red when stock is at or below threshold */}
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

        {/* INGREDIENTS TAB */}
        {activeTab === 'ingredients' && (
          <div className="manager-section">

            <div className="manager-section-header">
              <h1>Ingredients</h1>
              <button className="manager-refresh-btn" onClick={openAddIngredientModal}>
                <MdAdd size={18} /> Add Ingredient
              </button>
            </div>

            {/* Search bar for filtering ingredients table */}
            <div className="menu-search" style={{ marginBottom: '16px', maxWidth: '400px' }}>
              <input
                type="text"
                value={ingredientSearch}
                onChange={e => setIngredientSearch(e.target.value)}
                placeholder="🔍 Search ingredients..."
                className="menu-search-input"
              />
              {ingredientSearch && (
                <button className="search-clear-btn" onClick={() => setIngredientSearch('')}>✕</button>
              )}
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
                    {filteredIngredients.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>
                          {ingredientSearch ? `No results for "${ingredientSearch}"` : 'No ingredients found'}
                        </td>
                      </tr>
                    ) : (
                      filteredIngredients.map(ingredient => (
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SALES & REPORTS TAB */}
        {activeTab === 'sales' && (
          <div className="manager-section">

            <div className="manager-section-header">
              <h1>Sales & Reports</h1>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* Period filter buttons */}
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
                {/* Export button — only shows when data is loaded */}
                {salesData && (
                  <button className="export-csv-btn" onClick={handleExportReport}>
                    ⬇ Export CSV
                  </button>
                )}
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
                    <p className="sales-stat-value">Rs. {salesData.totalRevenue.toLocaleString()}</p>
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

                {/* Revenue bar chart + popular items doughnut */}
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
                            {/* Bar width = item qty as % of top item qty */}
                            <div className="popular-bar-wrap">
                              <div
                                className="popular-bar"
                                style={{ width: `${(item.qty / salesData.popularItems[0].qty) * 100}%` }}
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

      {/* RESTOCK MODAL */}
      {/* Shows when manager clicks Restock — handles unit conversion */}
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
                <input
                  type="number"
                  value={restockQty}
                  onChange={e => setRestockQty(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  autoFocus
                />
                {/* Unit selector — changing unit triggers auto conversion */}
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

            {/* Preview section — shows conversion and new total */}
            {restockQty && parseFloat(restockQty) > 0 && (
              <div style={{ background: '#fdf6f0', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>

                {/* Show conversion if units differ */}
                {getConvertedQty() && (
                  <p style={{ fontSize: '0.85rem', color: '#f0a500', marginBottom: '6px' }}>
                    🔄 Converting: <strong>{restockQty} {restockUnit}</strong>{' '}
                    → <strong>{getConvertedQty().qty} {getConvertedQty().unit}</strong>
                  </p>
                )}

                <p className="restock-preview" style={{ margin: 0 }}>
                  Adding: <strong>{getConvertedQty() ? getConvertedQty().qty : restockQty} {restockModal.unit}</strong>
                  {' '}to <strong>{restockModal.currentStock} {restockModal.unit}</strong>
                  {' '}= <strong style={{ color: '#27ae60' }}>
                    {getNewTotal()} {restockModal.unit}
                  </strong>
                </p>
              </div>
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

      {/* ADD / EDIT INGREDIENT MODAL */}
      {showIngredientModal && (
        <div className="modal-overlay" onClick={() => setShowIngredientModal(false)}>
          <div
            className="restock-modal"
            style={{ width: '480px', maxWidth: '95vw' }}
            onClick={e => e.stopPropagation()}
          >

            {/* Header with title and close button */}
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

            {/* Name and Category */}
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
                  {ingredientCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Unit and Current Stock */}
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
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
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

            {/* Low stock threshold */}
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

            {/* Action buttons */}
            <div className="restock-modal-footer">
              <button className="btn-cancel" onClick={() => setShowIngredientModal(false)}>
                Cancel
              </button>
              <button className="btn-confirm-restock" onClick={handleIngredientSave}>
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
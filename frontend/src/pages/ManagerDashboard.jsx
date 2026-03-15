import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleSuccess, handleError } from '../utils';
import { MdLogout, MdInventory, MdBarChart, MdRefresh, MdAdd } from 'react-icons/md';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import '../css/manager-dashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
  PointElement, LineElement
);

const API = 'http://localhost:8080';

function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState('stock');
  const [ingredients, setIngredients] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockUnit, setRestockUnit] = useState('');
  const [salesData, setSalesData] = useState(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [period, setPeriod] = useState('today');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchStock = async () => {
    setLoadingStock(true);
    try {
      const res = await axios.get(`${API}/api/inventory/ingredients`, { headers });
      setIngredients(res.data.data || []);
    } catch { handleError('Failed to load stock'); }
    finally { setLoadingStock(false); }
  };

  const fetchSales = async (p = period) => {
    setLoadingSales(true);
    try {
      const res = await axios.get(`${API}/api/orders/sales-report?period=${p}`, { headers });
      setSalesData(res.data.data);
    } catch { handleError('Failed to load sales data'); }
    finally { setLoadingSales(false); }
  };

  useEffect(() => {
    if (activeTab === 'stock') fetchStock();
    if (activeTab === 'sales') fetchSales();
  }, [activeTab]);

  const handleRestock = async () => {
    if (!restockQty || parseFloat(restockQty) <= 0) return handleError('Enter a valid quantity');
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
    } catch { handleError('Failed to restock'); }
  };

  const handlePeriodChange = (p) => {
    setPeriod(p);
    fetchSales(p);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const lowStockItems = ingredients.filter(i => i.currentStock <= i.lowStockThreshold);

  // Chart.js data for revenue bar chart
  const revenueChartData = {
    labels: salesData?.dailyData?.map(d => d.date) || [],
    datasets: [
      {
        label: 'Revenue (Rs.)',
        data: salesData?.dailyData?.map(d => d.revenue) || [],
        backgroundColor: 'rgba(240, 165, 0, 0.7)',
        borderColor: '#f0a500',
        borderWidth: 2,
        borderRadius: 6,
      }
    ]
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

  // Chart.js data for popular items doughnut chart
  const popularChartData = {
    labels: salesData?.popularItems?.map(i => i.name) || [],
    datasets: [
      {
        data: salesData?.popularItems?.map(i => i.qty) || [],
        backgroundColor: [
          '#f0a500', '#ff8c42', '#27ae60',
          '#2980b9', '#9b59b6'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
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
      {/* Sidebar */}
      <aside className="manager-sidebar">
        <div className="manager-brand">
          <span>📊</span>
          <div>
            <div className="manager-brand-name">TablEase</div>
            <div className="manager-brand-role">Manager Panel</div>
          </div>
        </div>
        <nav className="manager-nav">
          <button
            className={`manager-nav-item ${activeTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            <MdInventory size={20} /> Stock & Inventory
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

      {/* Main */}
      <main className="manager-main">

        {/* STOCK TAB */}
        {activeTab === 'stock' && (
          <div className="manager-section">
            <div className="manager-section-header">
              <h1>Stock & Inventory</h1>
              <button className="manager-refresh-btn" onClick={fetchStock}>
                <MdRefresh size={18} /> Refresh
              </button>
            </div>

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

            {loadingStock ? <div className="manager-loading">Loading stock...</div> : (
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
                      <tr><td colSpan="7" style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>No ingredients found</td></tr>
                    ) : (
                      ingredients.map(ing => (
                        <tr key={ing._id} className={ing.currentStock <= ing.lowStockThreshold ? 'low-stock-row' : ''}>
                          <td><strong>{ing.name}</strong></td>
                          <td>{ing.category}</td>
                          <td>
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

        {/* SALES TAB */}
        {activeTab === 'sales' && (
          <div className="manager-section">
            <div className="manager-section-header">
              <h1>Sales & Reports</h1>
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

            {loadingSales ? <div className="manager-loading">Loading sales data...</div> : !salesData ? null : (
              <>
                {/* Stats Cards */}
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

                {/* Charts */}
                <div className="charts-grid">
                  {/* Revenue Bar Chart */}
                  <div className="chart-card">
                    {salesData.dailyData.length === 0 ? (
                      <div className="chart-empty">No revenue data for this period</div>
                    ) : (
                      <Bar data={revenueChartData} options={revenueChartOptions} />
                    )}
                  </div>

                  {/* Popular Items Doughnut Chart */}
                  <div className="chart-card">
                    {salesData.popularItems.length === 0 ? (
                      <div className="chart-empty">No sales data for this period</div>
                    ) : (
                      <Doughnut data={popularChartData} options={popularChartOptions} />
                    )}
                  </div>
                </div>

                {/* Popular Items Table */}
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
      {restockModal && (
        <div className="modal-overlay" onClick={() => setRestockModal(null)}>
          <div className="restock-modal" onClick={e => e.stopPropagation()}>
            <h2>Restock: {restockModal.name}</h2>
            <p>Current stock: <strong>{restockModal.currentStock} {restockModal.unit}</strong></p>
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
                <select
                  value={restockUnit}
                  onChange={e => setRestockUnit(e.target.value)}
                >
                  {['kg', 'g', 'liter', 'ml', 'pcs', 'packet'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            {restockQty && (
              <p className="restock-preview">
                Adding: <strong>{restockQty} {restockUnit}</strong> to current stock of <strong>{restockModal.currentStock} {restockModal.unit}</strong>
              </p>
            )}
            <div className="restock-modal-footer">
              <button className="btn-cancel" onClick={() => setRestockModal(null)}>Cancel</button>
              <button className="btn-confirm-restock" onClick={handleRestock}>Confirm Restock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerDashboard;
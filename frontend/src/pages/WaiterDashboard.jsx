// src/pages/WaiterDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { handleSuccess } from '../utils';
import {
  MdDashboard, MdReceiptLong, MdNotificationsActive, MdLogout, MdPerson
} from 'react-icons/md';
import '../css/waiter-dashboard.css';
import logo from '../assets/logo.jpg';


import API from '../config';

function WaiterDashboard() {
  const loggedInUser = localStorage.getItem('loggedInUser') || 'Waiter';
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [tableError, setTableError] = useState(null);
  const [confirmTable, setConfirmTable] = useState(null);

  const [stats, setStats] = useState({
    todaysRevenue: 0,
    ordersToday: 0,
    activeTables: '0/0',
    avgOrderValue: 0,
    availableTables: 0,
    occupiedTables: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [alerts, setAlerts] = useState([]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
    handleSuccess('Logged out successfully');
  };

  const fetchTables = async () => {
    setLoadingTables(true);
    setTableError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/api/tables`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTables(res.data.data || []);
    } catch (err) {
      console.error('Fetch tables error:', err);
      setTableError('Failed to load tables. Please try again.');
    } finally {
      setLoadingTables(false);
    }
  };

  // Socket.io
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:8080');

    socket.on('orderReady', (data) => {
      handleSuccess(`🍽️ ${data.message}`);
      setAlerts(prev => [`🍽️ ${data.message}`, ...prev]);
    });

    socket.on('orderPaid', (data) => {
      handleSuccess(`✅ ${data.message}`);
      setAlerts(prev => [`✅ ${data.message}`, ...prev]);
      fetchTables();
    });

    socket.on('itemReady', (data) => {
      handleSuccess(`🍽️ ${data.message}`);
      setAlerts(prev => [`🍽️ ${data.message}`, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  // Fetch tables when Orders tab is active
  useEffect(() => {
    if (activeTab === 'orders') fetchTables();
  }, [activeTab]);

  // Fetch real stats
  useEffect(() => {
    if (activeTab === 'dashboard') {
      const fetchStats = async () => {
        setLoadingStats(true);
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${API}/api/orders/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = res.data.data;
          setStats({
            todaysRevenue: data.todaysRevenue,
            ordersToday: data.ordersToday,
            activeTables: data.activeTables,
            avgOrderValue: data.avgOrderValue,
            availableTables: data.availableTables,
            occupiedTables: data.occupiedTables
          });
          setRecentOrders(data.recentOrders || []);
        } catch (err) {
          console.error('Stats fetch error:', err);
        } finally {
          setLoadingStats(false);
        }
      };
      fetchStats();
    }
  }, [activeTab]);

  const handleNewOrder = () => setActiveTab('orders');

  const handleTableClick = (table) => {
    if (table.status === 'available') {
      setConfirmTable(table);
    } else if (table.status === 'occupied') {
      navigate(`/new-order/${table.tableNumber}`);
    } else if (table.status === 'ordered') {
      navigate(`/view-order/${table.tableNumber}/${table._id}`);
    }
  };

  const handleConfirmOccupy = async () => {
    if (!confirmTable) return;
    const token = localStorage.getItem('token');
    try {
      await axios.patch(
        `${API}/api/tables/${confirmTable._id}/occupy`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Occupy failed:', err);
    }
    navigate(`/new-order/${confirmTable.tableNumber}`);
    setConfirmTable(null);
  };

  return (
    <div className="waiter-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="TablEase" className="sidebar-logo" />
          <h2>TablEase</h2>
          <p>Restaurant POS</p>
        </div>

        <div className="user-info">
          <div className="user-avatar"><MdPerson /></div>
          <div>
            <p className="user-name">{loggedInUser}</p>
            <p className="user-role">Waiter</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <MdDashboard className="icon" /> Dashboard
          </button>
          <button
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <MdReceiptLong className="icon" /> Orders
          </button>
          <button
            className={`nav-item ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <MdNotificationsActive className="icon" />
            Alerts
            {alerts.length > 0 && (
              <span className="alerts-count-badge">{alerts.length}</span>
            )}
          </button>
          <button className="nav-item logout" onClick={handleLogout}>
            <MdLogout className="icon" /> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <>
            <header className="header">
              <h1>Dashboard</h1>
              <p className="welcome">Welcome back, <strong>{loggedInUser}</strong>! Here's what's happening today.</p>
            </header>

            <div className="stats-grid">
             
              <div className="stat-card orders">
                <h3>Orders Today</h3>
                <p className="value">{stats.ordersToday.toLocaleString()}</p>
              </div>
              <div className="stat-card tables">
                <h3>Active Tables</h3>
                <p className="value">{stats.activeTables}</p>
              </div>
              <div className="stat-card avg">
                <h3>Avg Order Value</h3>
                <p className="value">Rs. {stats.avgOrderValue.toFixed(0)}</p>
              </div>
            </div>

            <section className="recent-orders">
              <h2>Recent Orders</h2>
              <div className="orders-table">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Table</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', color: '#888' }}>No orders yet today</td></tr>
                    ) : (
                      recentOrders.map((order) => (
                        <tr key={order._id}>
                          <td>#{order._id.slice(-4)}</td>
                          <td>{order.table?.tableNumber || 'N/A'}</td>
                          <td className={`status ${order.status}`}>{order.status}</td>
                          <td>Rs. {order.totalAmount?.toLocaleString()}</td>
                          <td>{new Date(order.createdAt).toLocaleTimeString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="side-panels">
              <div className="alerts-panel">
                <h2>Recent Alerts</h2>
                {alerts.length === 0 ? (
                  <div className="alert-item">No alerts right now</div>
                ) : (
                  alerts.slice(0, 5).map((alert, i) => (
                    <div key={i} className="alert-item">{alert}</div>
                  ))
                )}
                {alerts.length > 5 && (
                  <button
                    className="view-all-alerts-btn"
                    onClick={() => setActiveTab('alerts')}
                  >
                    View all {alerts.length} alerts →
                  </button>
                )}
              </div>
              <div className="quick-actions">
                <h2>Quick Actions</h2>
                <button className="action-btn" onClick={handleNewOrder}>New Order</button>
              </div>
            </div>
          </>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <section className="orders-section">
            <header className="header">
              <h1>Table Selection</h1>
              <p className="welcome">Select a table to create or manage orders</p>
            </header>

            <div className="table-stats">
              <div className="stat-box available">
                <h3>Available Tables</h3>
                <p className="big-number">{stats.availableTables}</p>
              </div>
              <div className="stat-box occupied">
                <h3>Occupied Tables</h3>
                <p className="big-number">{stats.occupiedTables}</p>
              </div>
              <div className="stat-box ordered">
                <h3>Total Tables</h3>
                <p className="big-number">{stats.availableTables + stats.occupiedTables}</p>
              </div>
            </div>

            <div className="table-grid">
              {loadingTables ? (
                <p className="loading-message">Loading tables...</p>
              ) : tableError ? (
                <p className="error-message">{tableError}</p>
              ) : tables.length === 0 ? (
                <p className="empty-message">No tables found in database.</p>
              ) : (
                tables.map((table) => (
                  <div
                    key={table._id}
                    className={`table-card ${table.status}`}
                    onClick={() => handleTableClick(table)}
                    style={{ cursor: 'pointer' }}
                  >
                    <h3>{table.tableNumber}</h3>
                    <p>{table.seats} seats</p>
                    <span className="status-label">
                      {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="legend">
              <h3>Legend:</h3>
              <div className="legend-items">
                <div><span className="legend-color available"></span> Available</div>
                <div><span className="legend-color occupied"></span> Occupied (Seated)</div>
                <div><span className="legend-color ordered"></span> Order Placed</div>
              </div>
            </div>
          </section>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'alerts' && (
          <section className="orders-section">
            <header className="header">
              <h1>Alerts</h1>
              <p className="welcome">All notifications from kitchen and cashier</p>
            </header>

            <div className="alerts-full-panel">
              {alerts.length === 0 ? (
                <div className="alerts-empty">
                  <span>🔔</span>
                  <p>No alerts yet. Kitchen and cashier notifications will appear here.</p>
                </div>
              ) : (
                <>
                  <div className="alerts-toolbar">
                    <span className="alerts-total">
                      {alerts.length} notification{alerts.length > 1 ? 's' : ''}
                    </span>
                    <button
                      className="clear-alerts-btn"
                      onClick={() => setAlerts([])}
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="alerts-full-list">
                    {alerts.map((alert, i) => (
                      <div key={i} className="alert-full-item">
                        <div className="alert-full-icon">
                          {alert.includes('paid') || alert.includes('✅') ? '✅' : '🍽️'}
                        </div>
                        <div className="alert-full-content">
                          <p className="alert-full-message">{alert}</p>
                          <span className="alert-full-time">This session</span>
                        </div>
                        <button
                          className="alert-dismiss-btn"
                          onClick={() => setAlerts(prev => prev.filter((_, idx) => idx !== i))}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Table Confirmation Modal */}
      {confirmTable && (
        <div className="modal-overlay" onClick={() => setConfirmTable(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">🪑</div>
            <h3>Mark Table {confirmTable.tableNumber} as Occupied?</h3>
            <p>This means guests have been seated at this table.</p>
            <div className="confirm-buttons">
              <button className="confirm-btn-no" onClick={() => setConfirmTable(null)}>
                Cancel
              </button>
              <button className="confirm-btn-yes" onClick={handleConfirmOccupy}>
                Yes, Mark Occupied
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WaiterDashboard;
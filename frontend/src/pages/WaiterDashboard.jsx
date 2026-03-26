
// src/pages/WaiterDashboard.jsx
import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { handleSuccess } from '../utils';


// React Icons
import { 
  MdDashboard, MdReceiptLong, MdNotificationsActive, MdLogout, MdPerson
} from 'react-icons/md';

import '../css/waiter-dashboard.css';

function WaiterDashboard() {
  const loggedInUser = localStorage.getItem('loggedInUser') || 'Waiter';
  const navigate = useNavigate();

  // State for active tab
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'orders'
  

  // Fetch real tables
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [tableError, setTableError] = useState(null);

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

  // Socket.io — listen for order ready notifications
  useEffect(() => {
    const socket = io('http://localhost:8080');

    socket.on('orderReady', (data) => {
      handleSuccess(`🍽️ ${data.message}`);
      setAlerts(prev => [`🍽️ ${data.message}`, ...prev].slice(0, 5));
    });

    socket.on('orderPaid', (data) => {
      handleSuccess(`✅ ${data.message}`);
      setAlerts(prev => [`✅ ${data.message}`, ...prev].slice(0, 5));
      if (activeTab === 'orders') {
        fetchTables();
      }
    });

    return () => socket.disconnect();
  }, []);

  // Fetch tables when Orders tab is active
  useEffect(() => {
    if (activeTab === 'orders') {
      const fetchTables = async () => {
        setLoadingTables(true);
        setTableError(null);
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get('http://localhost:8080/api/tables', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setTables(res.data.data || []);
        } catch (err) {
          console.error('Fetch tables error:', err);
          setTableError('Failed to load tables. Please try again.');
        } finally {
          setLoadingTables(false);
        }
      };

      fetchTables();
    }
  }, [activeTab]);

  // Fetch real stats
useEffect(() => {
  if (activeTab === 'dashboard') {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8080/api/orders/stats', {
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



  // Switch to Orders tab on "New Order" click
  const handleNewOrder = () => {
    setActiveTab('orders');
  };

  return (
    <div className="waiter-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>TablEase</h2>
          <p>Restaurant POS</p>
        </div>

        <div className="user-info">
          <div className="user-avatar">
            <MdPerson />
          </div>
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

          <a href="#" className="nav-item">
            <MdNotificationsActive className="icon" /> Alerts
          </a>

          <button className="nav-item logout" onClick={handleLogout}>
            <MdLogout className="icon" /> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <>
            <header className="header">
              <h1>Dashboard</h1>
              <p className="welcome">Welcome back! Here's what's happening today.</p>
            </header>

            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card revenue">
                <h3>Today's Revenue</h3>
                <p className="value">Rs. {stats.todaysRevenue.toLocaleString()}</p>
              </div>
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

            {/* Recent Orders */}
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

            {/* Alerts & Quick Actions */}
            <div className="side-panels">
              <div className="alerts-panel">
                <h2>Alerts</h2>
                {alerts.length === 0 ? (
                  <div className="alert-item">No alerts right now</div>
                ) : (
                  alerts.map((alert, i) => (
                    <div key={i} className="alert-item">{alert}</div>
                  ))
                )}
              </div>

              <div className="quick-actions">
                <h2>Quick Actions</h2>
                <button className="action-btn" onClick={handleNewOrder}>
                  New Order
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <section className="orders-section">
            <header className="header">
              <h1>Table Selection</h1>
              <p className="welcome">Select a table to create or manage orders</p>
            </header>

            {/* Table Stats */}
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

            {/* Table Grid - Always render, handle states inside */}
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
                    onClick={() => {
                      if (table.status === 'available') {
                        // Mark table as occupied first, then go to new order
                        const token = localStorage.getItem('token');
                        axios.patch(`http://localhost:8080/api/tables/${table._id}/occupy`, {}, {
                          headers: { Authorization: `Bearer ${token}` }
                        }).then(() => {
                          navigate(`/new-order/${table.tableNumber}`);
                        }).catch(() => {
                          navigate(`/new-order/${table.tableNumber}`);
                        });
                      } else if (table.status === 'occupied') {
                        navigate(`/new-order/${table.tableNumber}`);
                      } else if (table.status === 'ordered') {
                        navigate(`/view-order/${table.tableNumber}/${table._id}`);
                      }
                    }}
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

            {/* Legend */}
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
      </main>
    </div>
  );
}

export default WaiterDashboard;
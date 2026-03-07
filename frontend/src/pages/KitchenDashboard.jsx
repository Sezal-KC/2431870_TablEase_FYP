import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { handleSuccess, handleError } from '../utils';
import { MdLogout, MdRefresh } from 'react-icons/md';
import '../css/kitchen-dashboard.css';

const API = 'http://localhost:8080';

const STATUS_CONFIG = {
  pending: { label: 'New Order', color: '#e74c3c', next: 'preparing', nextLabel: 'Start Preparing' },
  preparing: { label: 'Preparing', color: '#f39c12', next: 'ready', nextLabel: 'Mark Ready' }
};

function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/orders/active`, { headers });
      console.log('Orders:', res.data.data);
      setOrders(res.data.data || []);
      setLastRefresh(new Date());
    } catch (err) {
      handleError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await axios.patch(`${API}/api/orders/${orderId}/status`, { status: newStatus }, { headers });
      handleSuccess(newStatus === 'preparing' ? 'Started preparing!' : 'Order marked as ready!');
      fetchOrders(); // refresh immediately
    } catch (err) {
      handleError('Failed to update order status');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const getElapsedTime = (createdAt) => {
    const diff = Math.floor((new Date() - new Date(createdAt)) / 1000 / 60);
    if (diff < 1) return 'Just now';
    if (diff === 1) return '1 min ago';
    return `${diff} mins ago`;
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');

  return (
    <div className="kitchen-layout">
      {/* Header */}
      <header className="kitchen-header">
        <div className="kitchen-brand">
          <span>🍳</span>
          <div>
            <h1>Kitchen Display</h1>
            <p>TablEase POS</p>
          </div>
        </div>

        <div className="kitchen-header-right">
          <div className="order-counts">
            <span className="count-badge pending">{pendingOrders.length} New</span>
            <span className="count-badge preparing">{preparingOrders.length} Preparing</span>
          </div>
          <button className="refresh-btn" onClick={fetchOrders}>
            <MdRefresh size={20} /> Refresh
          </button>
          <p className="last-refresh">Updated: {lastRefresh.toLocaleTimeString()}</p>
          <button className="logout-btn" onClick={handleLogout}>
            <MdLogout size={18} /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
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
            {/* Pending Column */}
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
                      getElapsedTime={getElapsedTime}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Preparing Column */}
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
                      getElapsedTime={getElapsedTime}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function OrderCard({ order, onStatusUpdate, getElapsedTime }) {
  const config = STATUS_CONFIG[order.status];
  const tableNum = order.table?.tableNumber || 'Unknown';

  if (!config) return null; 

  return (
    <div className={`order-card ${order.status}`}>
      <div className="order-card-header">
        <div className="order-table">Table {tableNum}</div>
        <div className="order-time">{getElapsedTime(order.createdAt)}</div>
      </div>

    

      {/* Items */}
      <div className="order-items">
        {order.items.map((item, i) => (
          <div key={i} className="order-item">
            <span className="order-item-qty">x{item.qty}</span>
            <span className="order-item-name">{item.name}</span>
            <span className="order-item-price">Rs.{item.price * item.qty}</span>
          </div>
        ))}
      </div>

      {/* Allergies */}
      {order.allergies && order.allergies.length > 0 && (
        <div className="order-allergies">
          <span className="allergy-label">⚠️ Allergies:</span>
          {order.allergies.map(a => (
            <span key={a} className="allergy-chip">{a}</span>
          ))}
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="order-notes">
          📝 {order.notes}
        </div>
      )}

      {/* Action Button */}
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
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MdArrowBack, MdAdd, MdRemove, MdDelete } from 'react-icons/md';
import { handleSuccess, handleError } from '../utils';
import '../css/view-order.css';

const API = 'http://localhost:8080';

const STATUS_COLORS = {
  pending: '#f39c12',
  preparing: '#2980b9',
  ready: '#27ae60',
  served: '#8e44ad',
  billed: '#e67e22',
  paid: '#2ecc71'
};

function ViewOrder() {
  const { tableNumber, tableId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Menu state for adding more items
  const [menuItems, setMenuItems] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState({});
  const [showMenu, setShowMenu] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch active order
  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/orders/table/${tableId}`, { headers });
      setOrder(res.data.data);
    } catch (err) {
      handleError('Could not load order for this table');
      navigate('/waiter-dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Fetch menu for adding more items
  const fetchMenu = async () => {
    try {
      const res = await axios.get(`${API}/api/menu`, { headers });
      const grouped = res.data.data.reduce((acc, item) => {
        if (!item.available) return acc;
        const cat = item.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {});
      setMenuItems(grouped);
      setSelectedCategory(Object.keys(grouped)[0] || '');
    } catch (err) {
      handleError('Failed to load menu');
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchMenu();
  }, []);

  // Cart helpers
  const addToCart = (item) => {
    setCart(prev => ({
      ...prev,
      [item._id]: prev[item._id]
        ? { ...prev[item._id], qty: prev[item._id].qty + 1 }
        : { ...item, qty: 1 }
    }));
  };

  const decreaseQty = (itemId) => {
    setCart(prev => {
      if (!prev[itemId]) return prev;
      if (prev[itemId].qty === 1) {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      }
      return { ...prev, [itemId]: { ...prev[itemId], qty: prev[itemId].qty - 1 } };
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  // Add more items to existing order
  const handleAddMoreItems = async () => {
    if (cartItems.length === 0) return handleError('Select at least one item to add');
    setSubmitting(true);
    try {
      const items = cartItems.map(item => ({
        name: item.name,
        qty: item.qty,
        price: item.price
      }));
      await axios.patch(`${API}/api/orders/${order._id}/add-items`, { items }, { headers });
      handleSuccess('Items added to order!');
      setCart({});
      setShowMenu(false);
      fetchOrder(); // refresh order
    } catch (err) {
      handleError('Failed to add items');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="vo-loading">Loading order...</div>;
  if (!order) return null;

  return (
    <div className="vo-page">
      <header className="vo-header">
        <button className="back-btn" onClick={() => navigate('/waiter-dashboard')}>
          <MdArrowBack /> Back
        </button>
        <div>
          <h1>Table {tableNumber}</h1>
          <span className="vo-status-badge" style={{ background: STATUS_COLORS[order.status] }}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
      </header>

      <div className="vo-layout">
        {/* LEFT: Current Order */}
        <div className="vo-order-panel">
          <h2>Current Order</h2>

          <div className="vo-items">
            {order.items.map((item, i) => (
              <div key={i} className="vo-item">
                <div className="vo-item-info">
                  <span className="vo-item-name">{item.name}</span>
                  <span className="vo-item-qty">x{item.qty}</span>
                </div>
                <span className="vo-item-price">Rs. {(item.price * item.qty).toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div className="vo-divider" />

          <div className="vo-total">
            <span>Total</span>
            <span className="vo-total-amount">Rs. {order.totalAmount?.toFixed(0)}</span>
          </div>

          {/* Allergies */}
          {order.allergies && order.allergies.length > 0 && (
            <div className="vo-allergies">
              <h4>⚠️ Allergies</h4>
              <div className="vo-allergy-tags">
                {order.allergies.map(a => (
                  <span key={a} className="vo-allergy-tag">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="vo-notes">
              <h4>📝 Notes</h4>
              <p>{order.notes}</p>
            </div>
          )}

          {/* Add More Items Button */}
          <button className="btn-add-more" onClick={() => setShowMenu(!showMenu)}>
            {showMenu ? 'Hide Menu' : '+ Add More Items'}
          </button>
        </div>

        {/* RIGHT: Add More Items Menu */}
        {showMenu && (
          <div className="vo-menu-panel">
            <h2>Add Items</h2>

            <div className="menu-categories">
              {Object.keys(menuItems).map(cat => (
                <button
                  key={cat}
                  className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="vo-menu-items">
              {(menuItems[selectedCategory] || []).map(item => {
                const inCart = cart[item._id];
                return (
                  <div key={item._id} className="vo-menu-item">
                    <img
                      src={item.imageUrl?.startsWith('/uploads') ? `${API}${item.imageUrl}` : item.imageUrl}
                      alt={item.name}
                      className="vo-menu-item-img"
                      onError={e => { e.target.src = 'https://via.placeholder.com/60x60?text=No+Image'; }}
                    />
                    <div className="vo-menu-item-info">
                      <span className="vo-menu-item-name">{item.name}</span>
                      <span className="vo-menu-item-price">Rs. {item.price}</span>
                    </div>
                    <div className="item-controls">
                      {inCart ? (
                        <div className="qty-controls">
                          <button className="qty-btn" onClick={() => decreaseQty(item._id)}><MdRemove /></button>
                          <span className="qty-num">{inCart.qty}</span>
                          <button className="qty-btn" onClick={() => addToCart(item)}><MdAdd /></button>
                        </div>
                      ) : (
                        <button className="add-btn" onClick={() => addToCart(item)}>Add</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Summary */}
            {cartItems.length > 0 && (
              <div className="vo-cart-summary">
                <div className="vo-cart-items">
                  {cartItems.map(item => (
                    <div key={item._id} className="cart-item">
                      <div className="cart-item-info">
                        <span className="cart-item-name">{item.name}</span>
                        <span className="cart-item-qty">x{item.qty}</span>
                      </div>
                      <div className="cart-item-right">
                        <span className="cart-item-price">Rs. {(item.price * item.qty).toFixed(0)}</span>
                        <button className="remove-btn" onClick={() => removeFromCart(item._id)}>
                          <MdDelete size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="vo-cart-total">
                  <span>Adding: Rs. {cartTotal.toFixed(0)}</span>
                  <button
                    className="submit-order-btn"
                    onClick={handleAddMoreItems}
                    disabled={submitting}
                  >
                    {submitting ? 'Adding...' : 'Confirm Add Items'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewOrder;
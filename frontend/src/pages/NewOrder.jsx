import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MdArrowBack, MdAdd, MdRemove, MdDelete } from 'react-icons/md';
import { handleSuccess, handleError } from '../utils';
import '../css/new-order.css';

const API = 'http://localhost:8080';

function NewOrder() {
  const { tableNumber } = useParams();
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState({});
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState({}); // { itemId: { ...item, qty } }
  const [tableId, setTableId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [allergies, setAllergies] = useState([]);
  const [notes, setNotes] = useState('');

  const ALLERGIES = ['Nuts', 'Gluten', 'Dairy', 'Seafood', 'Eggs', 'Soy', 'Spicy'];

  const toggleAllergy = (allergy) => {
    setAllergies(prev =>
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch menu
  useEffect(() => {
    const fetchMenu = async () => {
      setLoadingMenu(true);
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
        setMenuError('Failed to load menu. Please try again.');
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchMenu();
  }, []);

  // Fetch tableId from tableNumber
  useEffect(() => {
    const fetchTableId = async () => {
      try {
        const res = await axios.get(`${API}/api/tables`, { headers });
        const table = res.data.data.find(t => t.tableNumber === tableNumber);
        if (table) setTableId(table._id);
      } catch (err) {
        console.error('Failed to fetch table ID');
      }
    };
    fetchTableId();
  }, [tableNumber]);

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
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);

  // Submit order
  const handleSubmitOrder = async () => {
  if (cartItems.length === 0) return handleError('Add at least one item to the order');
  if (!tableId) return handleError('Table not found');

  setSubmitting(true);
  try {
    const items = cartItems.map(item => ({
      name: item.name,
      qty: item.qty,
      price: item.price
    }));

    await axios.post(`${API}/api/orders`,
      { tableId, items, totalAmount, allergies, notes },
      { headers }
    );
    handleSuccess(`Order placed for ${tableNumber}!`);
    setTimeout(() => navigate('/waiter-dashboard'), 1500);
  } catch (err) {
    handleError('Failed to place order. Please try again.');
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="new-order-page">
      <header className="new-order-header">
        <button className="back-btn" onClick={() => navigate('/waiter-dashboard')}>
          <MdArrowBack /> Back
        </button>
        <h1>New Order — {tableNumber}</h1>
      </header>

      <div className="new-order-layout">
        {/* LEFT: Menu */}
        <div className="menu-panel">
          {/* Categories */}
          <div className="menu-categories">
            {Object.keys(menuItems).map(category => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Items */}
          <div className="menu-items">
            {loadingMenu ? (
              <p className="loading-message">Loading menu...</p>
            ) : menuError ? (
              <p className="error-message">{menuError}</p>
            ) : !menuItems[selectedCategory] || menuItems[selectedCategory].length === 0 ? (
              <p className="loading-message">No items in {selectedCategory}</p>
            ) : (
              menuItems[selectedCategory].map(item => {
                const inCart = cart[item._id];
                return (
                  <div key={item._id} className="menu-item-card">
                    <img
                      src={item.imageUrl?.startsWith('/uploads')
                        ? `${API}${item.imageUrl}` : item.imageUrl}
                      alt={item.name}
                      className="menu-item-image"
                      onError={e => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
                    />
                    <div className="item-info">
                      <h3>{item.name}</h3>
                      <p className="item-price">Rs. {item.price}</p>
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
              })
            )}
          </div>
        </div>

        {/* RIGHT: Order Summary */}
        <div className="order-summary">
          <h2>Order Summary</h2>
          <p className="table-label">Table: <strong>{tableNumber}</strong></p>

          {cartItems.length === 0 ? (
            <p className="empty-summary">No items added yet</p>
          ) : (
            <>
              <div className="cart-items">
                {cartItems.map(item => (
                  <div key={item._id} className="cart-item">
                    <div className="cart-item-info">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-qty">x{item.qty}</span>
                    </div>
                    <div className="cart-item-right">
                      <span className="cart-item-price">Rs. {(item.price * item.qty).toFixed(0)}</span>
                      <button className="remove-btn" onClick={() => removeFromCart(item._id)}>
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-divider" />

              <div className="cart-total">
                <span>Total ({totalQty} items)</span>
                <span className="total-amount">Rs. {totalAmount.toFixed(0)}</span>
              </div>
              
              {/* Allergies */}
              <div className="allergies-section">
                <h4>⚠️ Allergies</h4>
                <div className="allergy-tags">
                  {ALLERGIES.map(a => (
                    <button
                      key={a}
                      className={`allergy-tag ${allergies.includes(a) ? 'selected' : ''}`}
                      onClick={() => toggleAllergy(a)}
                      type="button"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="notes-section">
                <h4>📝 Special Notes</h4>
                <textarea
                  className="notes-input"
                  placeholder="e.g. less spicy, no onion, separate packing..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  maxLength={200}
                />
              </div>

              <button
                className="submit-order-btn"
                onClick={handleSubmitOrder}
                disabled={submitting}
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewOrder;
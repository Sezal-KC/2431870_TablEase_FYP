// src/pages/NewOrder.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios'; // make sure this is installed (npm install axios)
import { MdArrowBack } from 'react-icons/md';
import '../css/new-order.css';

function NewOrder() {
  const { tableNumber } = useParams();
  const navigate = useNavigate();

  // State for menu data from backend
  const [menuItems, setMenuItems] = useState({});
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState(null);

  // Selected category
  const [selectedCategory, setSelectedCategory] = useState('Starters');

  // Current order items
  const [orderItems, setOrderItems] = useState([]);

  // Fetch real menu from backend
  useEffect(() => {
    const fetchMenu = async () => {
      setLoadingMenu(true);
      setMenuError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8080/api/menu', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Group items by category
        const grouped = res.data.data.reduce((acc, item) => {
          const cat = item.category;
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(item);
          return acc;
        }, {});

        setMenuItems(grouped);
      } catch (err) {
        console.error('Menu fetch error:', err);
        setMenuError('Failed to load menu. Please try again.');
      } finally {
        setLoadingMenu(false);
      }
    };

    fetchMenu();
  }, []);

  const addItem = (item) => {
    setOrderItems([...orderItems, item]);
  };

  const totalItems = orderItems.length;
  const totalAmount = orderItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="new-order-page">
      {/* Header with Back button */}
      <header className="new-order-header">
        <button className="back-btn" onClick={() => navigate('/waiter-dashboard')}>
          <MdArrowBack /> Back
        </button>
        <h1>New Order - {tableNumber}</h1>
      </header>

      <div className="new-order-content">
        {/* Menu Categories */}
        <div className="menu-categories">
          {Object.keys(menuItems).map((category) => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Items - now from backend */}
        <div className="menu-items">
          {loadingMenu ? (
            <p>Loading menu...</p>
          ) : menuError ? (
            <p style={{ color: 'red' }}>{menuError}</p>
          ) : !menuItems[selectedCategory] || menuItems[selectedCategory].length === 0 ? (
            <p>No items in {selectedCategory}</p>
          ) : (
            menuItems[selectedCategory].map((item) => (
              <div key={item._id} className="menu-item-card">

                <img
                  src={
                    item.imageUrl.startsWith('/uploads')
                      ? `http://localhost:8080${item.imageUrl}`
                      : item.imageUrl
                  }
                  alt={item.name}
                  className="menu-item-image"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />

                <div className="item-info">
                  <h3>{item.name}</h3>
                  <p>Rs. {item.price}</p>
                </div>
                <button className="add-btn" onClick={() => addItem(item)}>
                  Add
                </button>
              </div>
            ))
          )}
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h2>Order Summary</h2>
          {totalItems === 0 ? (
            <p className="empty-summary">No items added yet</p>
          ) : (
            <>
              <p>{totalItems} items selected</p>
              <p className="total-amount">Total: Rs. {totalAmount.toFixed(0)}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewOrder;
// src/pages/NewOrder.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import '../css/new-order.css';

function NewOrder() {
  const { tableNumber } = useParams();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState('Starters');
  const [orderItems, setOrderItems] = useState([]);

  // Nepali menu items with realistic prices in Rs.
  const menuItems = {
    Starters: [
      { name: 'Chicken Chilli', price: 380 },
      { name: 'Badam Sadheko', price: 220 },
      { name: 'Mushroom Soup', price: 320 },
      { name: 'Aloo Jeera', price: 180 },
      { name: 'Bara', price: 150 },
      { name: 'Buff Sausage', price: 350 }
    ],
    'Main Course': [
      { name: 'Chicken Thakali Set', price: 350 },
      { name: 'Mutton Sekuwa Set', price: 550 },
      { name: 'Fish and Chips', price: 520 },
      { name: 'Butter Chicken & Naan', price: 480 },
      { name: 'Veg Thakali Set', price: 320 },
      { name: 'Pasta Alfredo', price: 350 }
    ],
    Drinks: [
      { name: 'Lassi (Sweet/Salted)', price: 120 },
      { name: 'Lemon Soda', price: 80 },
      { name: 'Soft Drinks', price: 90 },
      { name: 'Virgin Mojito', price: 100 },
      { name: 'Black Tea', price: 40 },
      { name: 'Milk Tea', price: 60 }
    ],
    Desserts: [
      { name: 'Chocolate Pastry', price: 140 },
      { name: 'Jeri / Dahi', price: 100 },
      { name: 'Gulab Jamun (2 pcs)', price: 120 },
      { name: 'Yomari', price: 80 },
      { name: 'Sikarni', price: 160 },
      { name: 'Rasbari', price: 130 }
    ]
  };

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

        {/* Menu Items */}
        <div className="menu-items">
          {menuItems[selectedCategory].map((item, index) => (
            <div key={index} className="menu-item-card">
              <div className="item-info">
                <div className="item-icon">🍽️</div>
                <div>
                  <h3>{item.name}</h3>
                  <p>Rs. {item.price.toFixed(0)}</p>
                </div>
              </div>
              <button className="add-btn" onClick={() => addItem(item)}>
                Add
              </button>
            </div>
          ))}
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
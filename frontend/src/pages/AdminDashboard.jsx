import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleSuccess, handleError } from '../utils';
import {
  MdRestaurantMenu, MdPeople, MdLogout, MdAdd,
  MdEdit, MdDelete, MdClose, MdCheck, MdKitchen
} from 'react-icons/md';
import '../css/admin-dashboard.css';
import logo from '../assets/logo.jpg';
import { useNavigate } from 'react-router-dom';

import API from '../config';

//const API = 'http://localhost:8080';

function AdminDashboard() {

  const navigate = useNavigate();

  // ── Active tab state ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('menu');

  // ── Data states ──────────────────────────────────────────────────
  const [menuItems, setMenuItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  // ── Loading states 
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // ── Modal visibility states
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  // ── Currently editing item states 
  const [editingItem, setEditingItem] = useState(null);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // ── Form states 
  const [menuForm, setMenuForm] = useState({
    name: '',
    category: 'Starters',
    price: '',
    imageUrl: '',
    description: '',
    available: true
  });

  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    unit: 'kg',
    currentStock: '',
    lowStockThreshold: '',
    category: 'Other'
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    address: ''
  });

  // ── Auth header ──────────────────────────────────────────────────
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // ── Constants ────────────────────────────────────────────────────
  const roleColors = {
    admin: '#e74c3c',
    manager: '#9b59b6',
    waiter: '#2980b9',
    cashier: '#27ae60',
    kitchen_staff: '#f39c12'
  };

  const categories = ['Starters', 'Main Course', 'Drinks', 'Desserts', 'Other'];
  const ingredientCategories = ['Meat', 'Vegetable', 'Spice', 'Sauce', 'Grain', 'Dairy', 'Other'];
  const units = ['kg', 'g', 'liter', 'ml', 'pcs'];

  // ── Fetch data when tab changes ──────────────────────────────────
  useEffect(() => {
    if (activeTab === 'menu') fetchMenu();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'ingredients') fetchIngredients();
  }, [activeTab]);

  // ── Fetch functions ──────────────────────────────────────────────

  const fetchMenu = async () => {
    setLoadingMenu(true);
    try {
      const res = await axios.get(`${API}/api/admin/menu`, { headers });
      setMenuItems(res.data.data || []);
    } catch {
      handleError('Failed to load menu items');
    } finally {
      setLoadingMenu(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get(`${API}/api/admin/users`, { headers });
      setUsers(res.data.data || []);
    } catch {
      handleError('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchIngredients = async () => {
    setLoadingIngredients(true);
    try {
      const res = await axios.get(`${API}/api/inventory/ingredients`, { headers });
      setIngredients(res.data.data || []);
    } catch {
      handleError('Failed to load ingredients');
    } finally {
      setLoadingIngredients(false);
    }
  };

  // ── Menu handlers ────────────────────────────────────────────────

  // Open blank modal for adding a new menu item
  const openAddModal = () => {
    setEditingItem(null);
    setMenuForm({
      name: '',
      category: 'Starters',
      price: '',
      imageUrl: '',
      description: '',
      available: true
    });
    setShowMenuModal(true);
  };

  // Open modal pre-filled with existing item data for editing
  const openEditModal = (item) => {
    setEditingItem(item);
    setMenuForm({
      name: item.name,
      category: item.category,
      price: item.price,
      imageUrl: item.imageUrl || '',
      description: item.description || '',
      available: item.available
    });
    setShowMenuModal(true);
  };

  // Save new or updated menu item
  const handleMenuSave = async () => {
    if (!menuForm.name || !menuForm.category || !menuForm.price) {
      return handleError('Name, category, and price are required');
    }
    try {
      if (editingItem) {
        await axios.put(`${API}/api/admin/menu/${editingItem._id}`, menuForm, { headers });
        handleSuccess('Menu item updated!');
      } else {
        await axios.post(`${API}/api/admin/menu`, menuForm, { headers });
        handleSuccess('Menu item added!');
      }
      setShowMenuModal(false);
      fetchMenu();
    } catch {
      handleError('Failed to save menu item');
    }
  };

  // Delete a menu item after confirmation
  const handleMenuDelete = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await axios.delete(`${API}/api/admin/menu/${id}`, { headers });
      handleSuccess('Menu item deleted');
      fetchMenu();
    } catch {
      handleError('Failed to delete menu item');
    }
  };

  // ── User handlers ────────────────────────────────────────────────

  // Open modal pre-filled with user data for editing
  const openEditUserModal = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      address: user.address || ''
    });
    setShowUserModal(true);
  };

  // Save updated user data
  const handleUserSave = async () => {
    if (!userForm.name || !userForm.email || !userForm.role) {
      return handleError('Name, email and role are required');
    }
    try {
      await axios.put(`${API}/api/admin/users/${editingUser._id}`, userForm, { headers });
      handleSuccess('User updated!');
      setShowUserModal(false);
      fetchUsers();
    } catch {
      handleError('Failed to update user');
    }
  };

  // Delete a user after confirmation
  const handleUserDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try {
      await axios.delete(`${API}/api/admin/users/${id}`, { headers });
      handleSuccess('User deleted');
      fetchUsers();
    } catch {
      handleError('Failed to delete user');
    }
  };

  // ── Ingredient handlers ──────────────────────────────────────────

  // Open blank modal for adding a new ingredient
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

  // Open modal pre-filled with ingredient data for editing
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

  // Save new or updated ingredient
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
      fetchIngredients();
    } catch {
      handleError('Failed to save ingredients');
    }
  };

  // Delete an ingredient after confirmation
  const handleIngredientDelete = async (id, name) => {
    if (!window.confirm(`Delete ingredient "${name}"?`)) return;
    try {
      await axios.delete(`${API}/api/inventory/ingredients/${id}`, { headers });
      handleSuccess('Ingredient deleted');
      fetchIngredients();
    } catch {
      handleError('Failed to delete ingredient');
    }
  };

  //Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  // ── Render 
  return (
    <div className="admin-layout">

      {/* ── Sidebar */}
      <aside className="admin-sidebar">

        {/* Brand / Logo */}
        <div className="admin-brand">
          <img src={logo} alt="TablEase" className="sidebar-logo" />
          <div>
            <div className="brand-name">TablEase</div>
            <div className="brand-role">
              Welcome, {localStorage.getItem('loggedInUser') || 'Admin'}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="admin-nav">
          <button
            className={`nav-item ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            <MdRestaurantMenu size={20} /> Menu Management
          </button>

          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <MdPeople size={20} /> User Management
          </button>

          <button
            className={`nav-item ${activeTab === 'ingredients' ? 'active' : ''}`}
            onClick={() => setActiveTab('ingredients')}
          >
            <MdKitchen size={20} /> Ingredient Management
          </button>
        </nav>

        {/* Logout */}
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <MdLogout size={20} /> Logout
        </button>

      </aside>

      {/* ── Main Content */}
      <main className="admin-main">

        {/* ── MENU TAB  */}
        {activeTab === 'menu' && (
          <div className="admin-section">

            <div className="section-header">
              <h1>Menu Management</h1>
              <button className="btn-primary" onClick={openAddModal}>
                <MdAdd size={18} /> Add Item
              </button>
            </div>

            {loadingMenu ? (
              <div className="loading">Loading menu...</div>
            ) : menuItems.length === 0 ? (
              <div className="empty-state">
                <p>No menu items yet.</p>
                <button className="btn-primary" onClick={openAddModal}>
                  Add your first item
                </button>
              </div>
            ) : (
              <div className="menu-grid">
                {menuItems.map(item => (
                  <div
                    key={item._id}
                    className={`menu-card ${!item.available ? 'unavailable' : ''}`}
                  >
                    {/* Menu Item Image */}
                    <img
                      src={item.imageUrl || 'https://via.placeholder.com/300x180?text=No+Image'}
                      alt={item.name}
                      onError={e => { e.target.src = 'https://placehold.co/300x200?text=No+Image'; }}
                    />

                    <div className="menu-card-body">
                      <div className="menu-card-top">
                        <span className="item-category">{item.category}</span>
                        <span className={`item-status ${item.available ? 'avail' : 'unavail'}`}>
                          {item.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>

                      <h3>{item.name}</h3>
                      {item.description && <p className="item-desc">{item.description}</p>}

                      <div className="menu-card-footer">
                        <span className="item-price">Rs. {item.price}</span>
                        <div className="card-actions">
                          <button
                            className="btn-icon edit"
                            onClick={() => openEditModal(item)}
                          >
                            <MdEdit size={16} />
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleMenuDelete(item._id)}
                          >
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ── USERS TAB ─────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="admin-section">

            <div className="section-header">
              <h1>User Management</h1>
              <span className="user-count">{users.length} users total</span>
            </div>

            {loadingUsers ? (
              <div className="loading">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="empty-state"><p>No users found.</p></div>
            ) : (
              <div className="users-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th>Role</th>
                      <th>Verified</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td><strong>{user.name}</strong></td>
                        <td>{user.email}</td>
                        <td>{user.phone || '—'}</td>
                        <td>{user.address || '—'}</td>
                        <td>
                          <span
                            className="role-badge"
                            style={{ background: roleColors[user.role] || '#888' }}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td>
                          {user.isEmailVerified
                            ? <span className="verified"><MdCheck size={14} /> Yes</span>
                            : <span className="unverified">No</span>}
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="card-actions">
                            <button
                              className="btn-icon edit"
                              onClick={() => openEditUserModal(user)}
                            >
                              <MdEdit size={16} />
                            </button>
                            <button
                              className="btn-icon delete"
                              onClick={() => handleUserDelete(user._id, user.name)}
                            >
                              <MdDelete size={16} />
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

        {/* ── INGREDIENTS TAB  */}
        {activeTab === 'ingredients' && (
          <div className="admin-section">

            <div className="section-header">
              <h1>Ingredient Management</h1>
              <button className="btn-primary" onClick={openAddIngredientModal}>
                <MdAdd size={18} /> Add Ingredient
              </button>
            </div>

            {loadingIngredients ? (
              <div className="loading">Loading ingredients...</div>
            ) : ingredients.length === 0 ? (
              <div className="empty-state">
                <p>No ingredients yet.</p>
                <button className="btn-primary" onClick={openAddIngredientModal}>
                  Add your first ingredient
                </button>
              </div>
            ) : (
              <div className="users-table-wrap">
                <table className="users-table">
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
                            ? <span className="unverified">⚠️ Low Stock</span>
                            : <span className="verified"><MdCheck size={14} /> OK</span>}
                        </td>
                        <td>
                          <div className="card-actions">
                            <button
                              className="btn-icon edit"
                              onClick={() => openEditIngredientModal(ingredient)}
                            >
                              <MdEdit size={16} />
                            </button>
                            <button
                              className="btn-icon delete"
                              onClick={() => handleIngredientDelete(ingredient._id, ingredient.name)}
                            >
                              <MdDelete size={16} />
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

      </main>

      {/* ── MENU MODAL  */}
      {showMenuModal && (
        <div className="modal-overlay" onClick={() => setShowMenuModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <h2>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              <button className="modal-close" onClick={() => setShowMenuModal(false)}>
                <MdClose size={22} />
              </button>
            </div>

            <div className="modal-body">
              {/* Name + Category */}
              <div className="form-row">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    value={menuForm.name}
                    onChange={e => setMenuForm({ ...menuForm, name: e.target.value })}
                    placeholder="e.g. Chicken Momo"
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={menuForm.category}
                    onChange={e => setMenuForm({ ...menuForm, category: e.target.value })}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Price + Image Upload */}
              <div className="form-row">
                <div className="form-group">
                  <label>Price (Rs.) *</label>
                  <input
                    type="number"
                    value={menuForm.price}
                    onChange={e => setMenuForm({ ...menuForm, price: e.target.value })}
                    placeholder="e.g. 350"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Image</label>
                  <div className="image-upload-area">
                    {menuForm.imageUrl && (
                      <img
                        src={menuForm.imageUrl}
                        alt="preview"
                        className="image-preview"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    )}
                    {/* Hidden file input triggered by Upload button */}
                    <input
                      type="file"
                      accept="image/*"
                      id="imageUpload"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('image', file);
                        try {
                          const res = await axios.post(`${API}/api/admin/upload`, formData, {
                            headers: {
                              Authorization: `Bearer ${token}`,
                              'Content-Type': 'multipart/form-data'
                            }
                          });
                          setMenuForm({ ...menuForm, imageUrl: res.data.imageUrl });
                          handleSuccess('Image uploaded!');
                        } catch {
                          handleError('Image upload failed');
                        }
                      }}
                    />
                    <div className="image-input-row">
                      <input
                        type="text"
                        value={menuForm.imageUrl}
                        onChange={e => setMenuForm({ ...menuForm, imageUrl: e.target.value })}
                        placeholder="Paste image URL or upload file"
                      />
                      <label htmlFor="imageUpload" className="btn-upload">📁 Upload</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={menuForm.description}
                  onChange={e => setMenuForm({ ...menuForm, description: e.target.value })}
                  placeholder="Short description (optional)"
                  rows={3}
                />
              </div>

              {/* Availability toggle */}
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={menuForm.available}
                    onChange={e => setMenuForm({ ...menuForm, available: e.target.checked })}
                  />
                  Available on menu
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowMenuModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleMenuSave}>
                {editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── INGREDIENT MODAL  */}
      {showIngredientModal && (
        <div className="modal-overlay" onClick={() => setShowIngredientModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <h2>{editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}</h2>
              <button className="modal-close" onClick={() => setShowIngredientModal(false)}>
                <MdClose size={22} />
              </button>
            </div>

            <div className="modal-body">
              {/* Name + Category */}
              <div className="form-row">
                <div className="form-group">
                  <label>Ingredient Name *</label>
                  <input
                    type="text"
                    value={ingredientForm.name}
                    onChange={e => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                    placeholder="e.g. Chicken"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={ingredientForm.category}
                    onChange={e => setIngredientForm({ ...ingredientForm, category: e.target.value })}
                  >
                    {ingredientCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Unit + Current Stock */}
              <div className="form-row">
                <div className="form-group">
                  <label>Unit *</label>
                  <select
                    value={ingredientForm.unit}
                    onChange={e => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                  >
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Current Stock *</label>
                  <input
                    type="number"
                    value={ingredientForm.currentStock}
                    onChange={e => setIngredientForm({ ...ingredientForm, currentStock: e.target.value })}
                    placeholder="e.g. 10"
                    min="0"
                  />
                </div>
              </div>

              {/* Low stock threshold */}
              <div className="form-group">
                <label>Low Stock Alert Threshold *</label>
                <input
                  type="number"
                  value={ingredientForm.lowStockThreshold}
                  onChange={e => setIngredientForm({ ...ingredientForm, lowStockThreshold: e.target.value })}
                  placeholder="e.g. 1 (alert when stock falls below this)"
                  min="0"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowIngredientModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleIngredientSave}>
                {editingIngredient ? 'Save Changes' : 'Add Ingredient'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── USER EDIT MODAL */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <h2>Edit User</h2>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>
                <MdClose size={22} />
              </button>
            </div>

            <div className="modal-body">
              {/* Name + Email */}
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="Email address"
                  />
                </div>
              </div>

              {/* Role + Phone */}
              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={userForm.role}
                    onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="">Select role</option>
                    <option value="waiter">Waiter</option>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="kitchen_staff">Kitchen Staff</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="e.g. 9800000000"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={userForm.address}
                  onChange={e => setUserForm({ ...userForm, address: e.target.value })}
                  placeholder="e.g. Kathmandu, Nepal"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowUserModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleUserSave}>
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
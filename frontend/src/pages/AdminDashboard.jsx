import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleSuccess, handleError } from '../utils';
import { MdRestaurantMenu, MdPeople, MdLogout, MdAdd, MdEdit, MdDelete, MdClose, MdCheck, MdKitchen } from 'react-icons/md';
import '../css/admin-dashboard.css';

const API = 'http://localhost:8080';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('menu');
  const [menuItems, setMenuItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingIngredient, setEditingIngredient] = useState(null);

  const [menuForm, setMenuForm] = useState({
    name: '', category: 'Starters', price: '', imageUrl: '', description: '', available: true
  });

  const [ingredientForm, setIngredientForm] = useState({
    name: '', unit: 'kg', currentStock: '', lowStockThreshold: '', category: 'Other'
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // ── Fetch functions ─────────────────────────────────────────────
  const fetchMenu = async () => {
    setLoadingMenu(true);
    try {
      const res = await axios.get(`${API}/api/admin/menu`, { headers });
      setMenuItems(res.data.data || []);
    } catch { handleError('Failed to load menu items'); }
    finally { setLoadingMenu(false); }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get(`${API}/api/admin/users`, { headers });
      setUsers(res.data.data || []);
    } catch { handleError('Failed to load users'); }
    finally { setLoadingUsers(false); }
  };

  const fetchIngredients = async () => {
    setLoadingIngredients(true);
    try {
      const res = await axios.get(`${API}/api/inventory/ingredients`, { headers });
      setIngredients(res.data.data || []);
    } catch { handleError('Failed to load ingredients'); }
    finally { setLoadingIngredients(false); }
  };

  useEffect(() => {
    if (activeTab === 'menu') fetchMenu();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'ingredients') fetchIngredients();
  }, [activeTab]);

  // ── Menu handlers ───────────────────────────────────────────────
  const openAddModal = () => {
    setEditingItem(null);
    setMenuForm({ name: '', category: 'Starters', price: '', imageUrl: '', description: '', available: true });
    setShowMenuModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setMenuForm({ name: item.name, category: item.category, price: item.price, imageUrl: item.imageUrl || '', description: item.description || '', available: item.available });
    setShowMenuModal(true);
  };

  const handleMenuSave = async () => {
    if (!menuForm.name || !menuForm.category || !menuForm.price) return handleError('Name, category, and price are required');
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
    } catch { handleError('Failed to save menu item'); }
  };

  const handleMenuDelete = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await axios.delete(`${API}/api/admin/menu/${id}`, { headers });
      handleSuccess('Menu item deleted');
      fetchMenu();
    } catch { handleError('Failed to delete menu item'); }
  };

  // ── User handlers ───────────────────────────────────────────────
  const handleUserDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try {
      await axios.delete(`${API}/api/admin/users/${id}`, { headers });
      handleSuccess('User deleted');
      fetchUsers();
    } catch { handleError('Failed to delete user'); }
  };

  // ── Ingredient handlers ─────────────────────────────────────────
  const openAddIngredientModal = () => {
    setEditingIngredient(null);
    setIngredientForm({ name: '', unit: 'kg', currentStock: '', lowStockThreshold: '', category: 'Other' });
    setShowIngredientModal(true);
  };

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

  const handleIngredientSave = async () => {
    if (!ingredientForm.name || !ingredientForm.unit) return handleError('Name and unit are required');
    try {
      if (editingIngredient) {
        await axios.put(`${API}/api/inventory/ingredients/${editingIngredient._id}`, ingredientForm, { headers });
        handleSuccess('Ingredient updated!');
      } else {
        await axios.post(`${API}/api/inventory/ingredients`, ingredientForm, { headers });
        handleSuccess('Ingredient added!');
      }
      setShowIngredientModal(false);
      fetchIngredients();
    } catch { handleError('Failed to save ingredients'); }
  };

  const handleIngredientDelete = async (id, name) => {
    if (!window.confirm(`Delete ingredient "${name}"?`)) return;
    try {
      await axios.delete(`${API}/api/inventory/ingredients/${id}`, { headers });
      handleSuccess('Ingredient deleted');
      fetchIngredients();
    } catch { handleError('Failed to delete ingredient'); }
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };

  const roleColors = { admin: '#e74c3c', manager: '#9b59b6', waiter: '#2980b9', cashier: '#27ae60', kitchen_staff: '#f39c12' };
  const categories = ['Starters', 'Main Course', 'Drinks', 'Desserts', 'Other'];
  const ingredientCategories = ['Meat', 'Vegetable', 'Spice', 'Sauce', 'Grain', 'Dairy', 'Other'];
  const units = ['kg', 'g', 'liter', 'ml', 'pcs'];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-icon">🍽️</span>
          <div>
            <div className="brand-name">TablEase</div>
            <div className="brand-role">Admin Panel</div>
          </div>
        </div>
        <nav className="admin-nav">
          <button className={`nav-item ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
            <MdRestaurantMenu size={20} /> Menu Management
          </button>
          <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <MdPeople size={20} /> User Management
          </button>
          <button className={`nav-item ${activeTab === 'ingredients' ? 'active' : ''}`} onClick={() => setActiveTab('ingredients')}>
            <MdKitchen size={20} /> Ingredients
          </button>
        </nav>
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <MdLogout size={20} /> Logout
        </button>
      </aside>

      <main className="admin-main">

        {/* MENU TAB */}
        {activeTab === 'menu' && (
          <div className="admin-section">
            <div className="section-header">
              <h1>Menu Management</h1>
              <button className="btn-primary" onClick={openAddModal}><MdAdd size={18} /> Add Item</button>
            </div>
            {loadingMenu ? <div className="loading">Loading menu...</div>
              : menuItems.length === 0 ? (
                <div className="empty-state">
                  <p>No menu items yet.</p>
                  <button className="btn-primary" onClick={openAddModal}>Add your first item</button>
                </div>
              ) : (
                <div className="menu-grid">
                  {menuItems.map(item => (
                    <div key={item._id} className={`menu-card ${!item.available ? 'unavailable' : ''}`}>
                      <img src={item.imageUrl || 'https://via.placeholder.com/300x180?text=No+Image'} alt={item.name}
                        onError={e => { e.target.src = 'https://via.placeholder.com/300x180?text=No+Image'; }} />
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
                            <button className="btn-icon edit" onClick={() => openEditModal(item)}><MdEdit size={16} /></button>
                            <button className="btn-icon delete" onClick={() => handleMenuDelete(item._id)}><MdDelete size={16} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="admin-section">
            <div className="section-header">
              <h1>User Management</h1>
              <span className="user-count">{users.length} users total</span>
            </div>
            {loadingUsers ? <div className="loading">Loading users...</div>
              : users.length === 0 ? <div className="empty-state"><p>No users found.</p></div>
              : (
                <div className="users-table-wrap">
                  <table className="users-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th>Joined</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user._id}>
                          <td><strong>{user.name}</strong></td>
                          <td>{user.email}</td>
                          <td><span className="role-badge" style={{ background: roleColors[user.role] || '#888' }}>{user.role}</span></td>
                          <td>{user.isEmailVerified ? <span className="verified"><MdCheck size={14} /> Yes</span> : <span className="unverified">No</span>}</td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td><button className="btn-icon delete" onClick={() => handleUserDelete(user._id, user.name)}><MdDelete size={16} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

        {/* INGREDIENTS TAB */}
        {activeTab === 'ingredients' && (
          <div className="admin-section">
            <div className="section-header">
              <h1>Ingredient Management</h1>
              <button className="btn-primary" onClick={openAddIngredientModal}><MdAdd size={18} /> Add Ingredient</button>
            </div>
            {loadingIngredients ? <div className="loading">Loading ingredients...</div>
              : ingredients.length === 0 ? (
                <div className="empty-state">
                  <p>No ingredients yet.</p>
                  <button className="btn-primary" onClick={openAddIngredientModal}>Add your first ingredient</button>
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
                              <button className="btn-icon edit" onClick={() => openEditIngredientModal(ingredient)}><MdEdit size={16} /></button>
                              <button className="btn-icon delete" onClick={() => handleIngredientDelete(ingredient._id, ingredient.name)}><MdDelete size={16} /></button>
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

      {/* MENU MODAL */}
      {showMenuModal && (
        <div className="modal-overlay" onClick={() => setShowMenuModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              <button className="modal-close" onClick={() => setShowMenuModal(false)}><MdClose size={22} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input type="text" value={menuForm.name} onChange={e => setMenuForm({ ...menuForm, name: e.target.value })} placeholder="e.g. Chicken Momo" />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select value={menuForm.category} onChange={e => setMenuForm({ ...menuForm, category: e.target.value })}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (Rs.) *</label>
                  <input type="number" value={menuForm.price} onChange={e => setMenuForm({ ...menuForm, price: e.target.value })} placeholder="e.g. 350" min="0" />
                </div>
                <div className="form-group">
                  <label>Image</label>
                  <div className="image-upload-area">
                    {menuForm.imageUrl && (
                      <img src={menuForm.imageUrl} alt="preview" className="image-preview"
                        onError={e => { e.target.style.display = 'none'; }} />
                    )}
                    <input type="file" accept="image/*" id="imageUpload" style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('image', file);
                        try {
                          const res = await axios.post(`${API}/api/admin/upload`, formData, {
                            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                          });
                          setMenuForm({ ...menuForm, imageUrl: res.data.imageUrl });
                          handleSuccess('Image uploaded!');
                        } catch { handleError('Image upload failed'); }
                      }}
                    />
                    <div className="image-input-row">
                      <input type="text" value={menuForm.imageUrl}
                        onChange={e => setMenuForm({ ...menuForm, imageUrl: e.target.value })}
                        placeholder="Paste image URL or upload file" />
                      <label htmlFor="imageUpload" className="btn-upload">📁 Upload</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={menuForm.description} onChange={e => setMenuForm({ ...menuForm, description: e.target.value })} placeholder="Short description (optional)" rows={3} />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={menuForm.available} onChange={e => setMenuForm({ ...menuForm, available: e.target.checked })} />
                  Available on menu
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowMenuModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleMenuSave}>{editingItem ? 'Save Changes' : 'Add Item'}</button>
            </div>
          </div>
        </div>
      )}

      {/* INGREDIENT MODAL */}
      {showIngredientModal && (
        <div className="modal-overlay" onClick={() => setShowIngredientModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}</h2>
              <button className="modal-close" onClick={() => setShowIngredientModal(false)}><MdClose size={22} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Ingredient Name *</label>
                  <input type="text" value={ingredientForm.name}
                    onChange={e => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                    placeholder="e.g. Chicken" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={ingredientForm.category}
                    onChange={e => setIngredientForm({ ...ingredientForm, category: e.target.value })}>
                    {ingredientCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Unit *</label>
                  <select value={ingredientForm.unit}
                    onChange={e => setIngredientForm({ ...ingredientForm, unit: e.target.value })}>
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Current Stock *</label>
                  <input type="number" value={ingredientForm.currentStock}
                    onChange={e => setIngredientForm({ ...ingredientForm, currentStock: e.target.value })}
                    placeholder="e.g. 10" min="0" />
                </div>
              </div>
              <div className="form-group">
                <label>Low Stock Alert Threshold *</label>
                <input type="number" value={ingredientForm.lowStockThreshold}
                  onChange={e => setIngredientForm({ ...ingredientForm, lowStockThreshold: e.target.value })}
                  placeholder="e.g. 1 (alert when stock falls below this)" min="0" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowIngredientModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleIngredientSave}>
                {editingIngredient ? 'Save Changes' : 'Add Ingredient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
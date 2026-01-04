import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const role = localStorage.getItem('userRole') || 'Staff';
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <h1>{role.charAt(0).toUpperCase() + role.slice(1)} Dashboard</h1>
      <p>Welcome! You are logged in as <strong>{role}</strong>.</p>

      {/* Role-based content */}
      {role === 'waiter' && <p>Take new orders • View table status</p>}
      {role === 'cashier' && <p>Process payments • Generate bills</p>}
      {role === 'manager' && <p>View reports • Manage inventory</p>}
      {role === 'admin' && <p>Full control • User management • Settings</p>}

      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </div>
  );
}

export default Dashboard;
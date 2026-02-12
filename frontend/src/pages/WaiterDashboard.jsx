// // // src/pages/WaiterDashboard.jsx
// // import React from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import { handleSuccess } from '../utils';

// // // Import professional icons from Material Design (md)
// // import { 
// //   MdDashboard,           // Dashboard icon
// //   MdReceiptLong,         // Orders icon
// //   MdNotificationsActive, // Alerts icon (bell with notification)
// //   MdLogout,              // Logout icon
// //   MdPerson,              // User avatar icon
// //   MdTableRestaurant      // Optional table icon (for future use)
// // } from 'react-icons/md';

// // import '../css/waiter-dashboard.css'; 

// // function WaiterDashboard() {
// //   const loggedInUser = localStorage.getItem('loggedInUser') || 'Waiter';
// //   const navigate = useNavigate();

// //   const handleLogout = () => {
// //     localStorage.clear();
// //     navigate('/login', { replace: true });
// //     handleSuccess('Logged out successfully');
// //   };

// //   // Mock data — later replace with real API
// //   const stats = {
// //     todaysRevenue: 2560,
// //     ordersToday: 84,
// //     activeTables: '12/20',
// //     avgOrderValue: 30.48,
// //   };

// //   const recentOrders = [
// //     { id: 1234, table: 'T4', status: 'Preparing', amount: 71.45, time: '5 min ago' },
// //     { id: 1235, table: 'T3', status: 'Ready', amount: 68.16, time: '10 min ago' },
// //     { id: 1236, table: 'T5', status: 'Pending', amount: 45.99, time: '3 min ago' },
// //     { id: 1237, table: 'T8', status: 'Preparing', amount: 59.36, time: '15 min ago' },
// //   ];

// //   const alerts = [
// //     'Table T4 waiting for 12 minutes',
// //     '3 items low in stock',
// //     'Kitchen order #1234 taking longer than usual',
// //   ];

// //   return (
// //     <div className="waiter-dashboard">
// //       {/* Sidebar */}
// //       <aside className="sidebar">
// //         <div className="sidebar-header">
// //           <h2>TablEase</h2>
// //           <p>Restaurant POS</p>
// //         </div>

// //         <div className="user-info">
// //           <div className="user-avatar">
// //             <MdPerson /> {/* Professional user icon instead of 👤 */}
// //           </div>
// //           <div>
// //             <p className="user-name">{loggedInUser}</p>
// //             <p className="user-role">Waiter</p>
// //           </div>
// //         </div>

// //         <nav className="sidebar-nav">
// //           <a href="#" className="nav-item active">
// //             <MdDashboard className="icon" /> Dashboard
// //           </a>
// //           <a href="#" className="nav-item">
// //             <MdReceiptLong className="icon" /> Orders
// //           </a>
// //           <a href="#" className="nav-item">
// //             <MdNotificationsActive className="icon" /> Alerts
// //           </a>
// //           <button className="nav-item logout" onClick={handleLogout}>
// //             <MdLogout className="icon" /> Logout
// //           </button>
// //         </nav>
// //       </aside>

// //       {/* Main Content */}
// //       <main className="main-content">
// //         <header className="header">
// //           <h1>Dashboard</h1>
// //           <p className="welcome">Welcome back! Here's what's happening today.</p>
// //         </header>

// //         {/* Stats Cards */}
// //         <div className="stats-grid">
// //           <div className="stat-card revenue">
// //             <h3>Today's Revenue</h3>
// //             <p className="value">Rs. {stats.todaysRevenue}</p>
// //           </div>
// //           <div className="stat-card orders">
// //             <h3>Orders Today</h3>
// //             <p className="value">{stats.ordersToday}</p>
// //           </div>
// //           <div className="stat-card tables">
// //             <h3>Active Tables</h3>
// //             <p className="value">{stats.activeTables}</p>
// //           </div>
// //           <div className="stat-card avg">
// //             <h3>Avg Order Value</h3>
// //             <p className="value">Rs. {stats.avgOrderValue}</p>
// //           </div>
// //         </div>

// //         {/* Recent Orders */}
// //         <section className="recent-orders">
// //           <h2>Recent Orders</h2>
// //           <div className="orders-table">
// //             <table>
// //               <thead>
// //                 <tr>
// //                   <th>Order ID</th>
// //                   <th>Table</th>
// //                   <th>Status</th>
// //                   <th>Amount</th>
// //                   <th>Time</th>
// //                 </tr>
// //               </thead>
// //               <tbody>
// //                 {recentOrders.map((order) => (
// //                   <tr key={order.id}>
// //                     <td>#{order.id}</td>
// //                     <td>{order.table}</td>
// //                     <td className={`status ${order.status.toLowerCase()}`}>
// //                       {order.status}
// //                     </td>
// //                     <td>Rs. {order.amount}</td>
// //                     <td>{order.time}</td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //         </section>

// //         {/* Alerts & Quick Actions */}
// //         <div className="side-panels">
// //           <div className="alerts-panel">
// //             <h2>Alerts</h2>
// //             {alerts.map((alert, i) => (
// //               <div key={i} className="alert-item">
// //                 {alert}
// //               </div>
// //             ))}
// //           </div>

// //           <div className="quick-actions">
// //             <h2>Quick Actions</h2>
// //             <button className="action-btn">New Order</button>
// //           </div>
// //         </div>
// //       </main>
// //     </div>
// //   );
// // }

// // export default WaiterDashboard;

// // src/pages/WaiterDashboard.jsx
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { handleSuccess } from '../utils';

// // React Icons
// import { 
//   MdDashboard, MdReceiptLong, MdNotificationsActive, MdLogout, MdPerson,
//   MdTableRestaurant, MdEventAvailable, MdEventBusy, MdShoppingCart
// } from 'react-icons/md';

// import '../css/waiter-dashboard.css';

// function WaiterDashboard() {
//   const loggedInUser = localStorage.getItem('loggedInUser') || 'Waiter';
//   const navigate = useNavigate();

//   // State for active tab
//   const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'orders'

//   const handleLogout = () => {
//     localStorage.clear();
//     navigate('/login', { replace: true });
//     handleSuccess('Logged out successfully');
//   };

//   // Mock data
//   const stats = {
//     todaysRevenue: 2560,
//     ordersToday: 84,
//     activeTables: '12/20',
//     avgOrderValue: 30.48,
//   };

//   const recentOrders = [
//     { id: 1234, table: 'T4', status: 'Preparing', amount: 71.45, time: '5 min ago' },
//     { id: 1235, table: 'T3', status: 'Ready', amount: 68.16, time: '10 min ago' },
//     { id: 1236, table: 'T5', status: 'Pending', amount: 45.99, time: '3 min ago' },
//     { id: 1237, table: 'T8', status: 'Preparing', amount: 59.36, time: '15 min ago' },
//   ];

//   const alerts = [
//     'Table T4 waiting for 12 minutes',
//     '3 items low in stock',
//     'Kitchen order #1234 taking longer than usual',
//   ];

//   // Mock table data (replace with real API later)
//   const tables = [
//     { id: 'T1', seats: 2, status: 'available' },
//     { id: 'T2', seats: 4, status: 'occupied', orderId: '#1234' },
//     { id: 'T3', seats: 4, status: 'ordered', orderId: '#1235' },
//     { id: 'T4', seats: 6, status: 'available' },
//     { id: 'T5', seats: 2, status: 'occupied', orderId: '#1236' },
//     { id: 'T6', seats: 4, status: 'available' },
//     { id: 'T7', seats: 8, status: 'available' },
//     { id: 'T8', seats: 4, status: 'ordered', orderId: '#1237' },
//     { id: 'T9', seats: 2, status: 'available' },
//     { id: 'T10', seats: 6, status: 'available' },
//     { id: 'T11', seats: 4, status: 'occupied', orderId: '#1238' },
//     { id: 'T12', seats: 4, status: 'available' },
//   ];

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'available': return '#d4edda'; // light green
//       case 'occupied': return '#fff3cd';  // light yellow
//       case 'ordered': return '#cce5ff';   // light blue
//       default: return '#f8f9fa';
//     }
//   };

//   return (
//     <div className="waiter-dashboard">
//       {/* Sidebar */}
//       <aside className="sidebar">
//         <div className="sidebar-header">
//           <h2>TablEase</h2>
//           <p>Restaurant POS</p>
//         </div>

//         <div className="user-info">
//           <div className="user-avatar">
//             <MdPerson />
//           </div>
//           <div>
//             <p className="user-name">{loggedInUser}</p>
//             <p className="user-role">Waiter</p>
//           </div>
//         </div>

//         <nav className="sidebar-nav">
//           <button 
//             className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
//             onClick={() => setActiveTab('dashboard')}
//           >
//             <MdDashboard className="icon" /> Dashboard
//           </button>

//           <button 
//             className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
//             onClick={() => setActiveTab('orders')}
//           >
//             <MdReceiptLong className="icon" /> Orders
//           </button>

//           <a href="#" className="nav-item">
//             <MdNotificationsActive className="icon" /> Alerts
//           </a>

//           <button className="nav-item logout" onClick={handleLogout}>
//             <MdLogout className="icon" /> Logout
//           </button>
//         </nav>
//       </aside>

//       {/* Main Content */}
//       <main className="main-content">
//         {activeTab === 'dashboard' && (
//           <>
//             <header className="header">
//               <h1>Dashboard</h1>
//               <p className="welcome">Welcome back! Here's what's happening today.</p>
//             </header>

//             {/* Stats Cards */}
//             <div className="stats-grid">
//               <div className="stat-card revenue">
//                 <h3>Today's Revenue</h3>
//                 <p className="value">Rs. {stats.todaysRevenue}</p>
//               </div>
//               <div className="stat-card orders">
//                 <h3>Orders Today</h3>
//                 <p className="value">{stats.ordersToday}</p>
//               </div>
//               <div className="stat-card tables">
//                 <h3>Active Tables</h3>
//                 <p className="value">{stats.activeTables}</p>
//               </div>
//               <div className="stat-card avg">
//                 <h3>Avg Order Value</h3>
//                 <p className="value">Rs. {stats.avgOrderValue}</p>
//               </div>
//             </div>

//             {/* Recent Orders */}
//             <section className="recent-orders">
//               <h2>Recent Orders</h2>
//               <div className="orders-table">
//                 <table>
//                   <thead>
//                     <tr>
//                       <th>Order ID</th>
//                       <th>Table</th>
//                       <th>Status</th>
//                       <th>Amount</th>
//                       <th>Time</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {recentOrders.map((order) => (
//                       <tr key={order.id}>
//                         <td>#{order.id}</td>
//                         <td>{order.table}</td>
//                         <td className={`status ${order.status.toLowerCase()}`}>
//                           {order.status}
//                         </td>
//                         <td>Rs. {order.amount}</td>
//                         <td>{order.time}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </section>

//             {/* Alerts & Quick Actions */}
//             <div className="side-panels">
//               <div className="alerts-panel">
//                 <h2>Alerts</h2>
//                 {alerts.map((alert, i) => (
//                   <div key={i} className="alert-item">
//                     {alert}
//                   </div>
//                 ))}
//               </div>

//               <div className="quick-actions">
//                 <h2>Quick Actions</h2>
//                 <button className="action-btn">New Order</button>
//               </div>
//             </div>
//           </>
//         )}

//         {activeTab === 'orders' && (
//           <section className="orders-section">
//             <header className="header">
//               <h1>Table Selection</h1>
//               <p className="welcome">Select a table to create or manage orders</p>
//             </header>

//             {/* Table Stats */}
//             <div className="table-stats">
//               <div className="stat-box available">
//                 <h3>Available Tables</h3>
//                 <p className="big-number">7</p>
//               </div>
//               <div className="stat-box occupied">
//                 <h3>Occupied Tables</h3>
//                 <p className="big-number">3</p>
//               </div>
//               <div className="stat-box ordered">
//                 <h3>Orders Placed</h3>
//                 <p className="big-number">2</p>
//               </div>
//             </div>

//             {/* Table Grid */}
//             <div className="table-grid">
//               {tables.map((table) => (
//                 <div 
//                   key={table.id} 
//                   className={`table-card ${table.status}`}
//                   onClick={() => {
//                     if (table.status !== 'available') {
//                       alert(`Managing order for ${table.id} (${table.orderId || 'No order'})`);
//                     } else {
//                       alert(`Creating new order for ${table.id}`);
//                     }
//                   }}
//                 >
//                   <h3>{table.id}</h3>
//                   <p>{table.seats} seats</p>
//                   {table.status !== 'available' && (
//                     <p className="order-id">{table.orderId}</p>
//                   )}
//                   <span className="status-label">
//                     {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
//                   </span>
//                 </div>
//               ))}
//             </div>

//             {/* Legend */}
//             <div className="legend">
//               <h3>Legend:</h3>
//               <div className="legend-items">
//                 <div><span className="legend-color available"></span> Available</div>
//                 <div><span className="legend-color occupied"></span> Occupied</div>
//                 <div><span className="legend-color ordered"></span> Order Placed</div>
//               </div>
//             </div>
//           </section>
//         )}
//       </main>
//     </div>
//   );
// }

// export default WaiterDashboard;

// src/pages/WaiterDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
    handleSuccess('Logged out successfully');
  };

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

  // Mock data for dashboard tab
  const stats = {
    todaysRevenue: 2560,
    ordersToday: 84,
    activeTables: '12/20',
    avgOrderValue: 30.48,
  };

  const recentOrders = [
    { id: 1234, table: 'T4', status: 'Preparing', amount: 71.45, time: '5 min ago' },
    { id: 1235, table: 'T3', status: 'Ready', amount: 68.16, time: '10 min ago' },
    { id: 1236, table: 'T5', status: 'Pending', amount: 45.99, time: '3 min ago' },
    { id: 1237, table: 'T8', status: 'Preparing', amount: 59.36, time: '15 min ago' },
  ];

  const alerts = [
    'Table T4 waiting for 12 minutes',
    '3 items low in stock',
    'Kitchen order #1234 taking longer than usual',
  ];

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
                <p className="value">Rs. {stats.avgOrderValue.toLocaleString()}</p>
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
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.table}</td>
                        <td className={`status ${order.status.toLowerCase()}`}>
                          {order.status}
                        </td>
                        <td>Rs. {order.amount.toLocaleString()}</td>
                        <td>{order.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Alerts & Quick Actions */}
            <div className="side-panels">
              <div className="alerts-panel">
                <h2>Alerts</h2>
                {alerts.map((alert, i) => (
                  <div key={i} className="alert-item">
                    {alert}
                  </div>
                ))}
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
                <p className="big-number">7</p>
              </div>
              <div className="stat-box occupied">
                <h3>Occupied Tables</h3>
                <p className="big-number">3</p>
              </div>
              <div className="stat-box ordered">
                <h3>Orders Placed</h3>
                <p className="big-number">2</p>
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
                        navigate(`/new-order/${table.tableNumber}`);
                      } else {
                        // Optional: show toast or alert for occupied/ordered
                        handleSuccess(`Viewing order for ${table.tableNumber}`);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <h3>{table.tableNumber}</h3>
                    <p>{table.seats} seats</p>
                    {table.currentOrder && (
                      <p className="order-id">#{table.currentOrder.id?.slice(-4) || 'N/A'}</p>
                    )}
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
                <div><span className="legend-color occupied"></span> Occupied</div>
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
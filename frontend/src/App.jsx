  import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import WaiterDashboard from './pages/WaiterDashboard'; //
import RefreshHandler from './RefreshHandler';
import './App.css';
import VerifyEmail from './pages/VerifyEmail';
import NewOrder from './pages/NewOrder';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  return (
    <div className="App">
      <RefreshHandler setIsAuthenticated={setIsAuthenticated} />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />               {/* Landing page is now the home */}
        <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
        <Route path="/signup" element={<Signup />} />

        {/* Role-specific protected routes */}
        <Route
          path="/waiter-dashboard"
          element={
            <PrivateRoute>
              <WaiterDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/new-order/:tableNumber"
          element={
            <PrivateRoute>
              <NewOrder />
            </PrivateRoute>
          }
        />

        {/* Redirect unknown paths to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

      </Routes>
    </div>
  );
}

export default App;
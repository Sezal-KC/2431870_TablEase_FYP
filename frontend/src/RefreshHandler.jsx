// RefreshHandler.jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function RefreshHandler({ setIsAuthenticated }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole')?.trim().toLowerCase();


    // List of public (unauthenticated) routes
      const publicPaths = [ '/login', '/signup', '/verify-otp', '/verify-email'];

    if (token) {
      setIsAuthenticated(true);

      // Valid roles (must match backend)
      const validRoles = ['waiter', 'cashier', 'manager', 'admin', 'kitchen_staff'];

      // If role is invalid or missing → treat as unauthenticated
      if (!role || !validRoles.includes(role)) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('loggedInUser');
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
        return;
      }

      // Only redirect if on public route
      if (publicPaths.includes(location.pathname)) {
        const dashboardPath = `/${role}-dashboard`;
        if (location.pathname !== dashboardPath) {
          navigate(dashboardPath, { replace: true });
        }
      }
    } else {
      setIsAuthenticated(false);

      // Protect private routes
      if (!publicPaths.includes(location.pathname) && location.pathname !== '/') {
        navigate('/login', { replace: true });
      }
    }
  },[location.pathname, navigate, setIsAuthenticated]);
    
  return null;
}

export default RefreshHandler;
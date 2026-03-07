// RefreshHandler.jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function RefreshHandler({ setIsAuthenticated }) {
  const location = useLocation();
  const navigate = useNavigate();

  const getDashboardPath = (role) => {
    switch (role) {
      case 'admin': return '/admin-dashboard';
      case 'waiter': return '/waiter-dashboard';
      case 'cashier': return '/cashier-dashboard';
      case 'manager': return '/manager-dashboard';
      case 'kitchen_staff': return '/kitchen-dashboard';
      default: return '/login';
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole')?.trim().toLowerCase();

    const publicPaths = ['/login', '/signup', '/verify-otp', '/verify-email'];

    if (token) {
      setIsAuthenticated(true);

      const validRoles = ['waiter', 'cashier', 'manager', 'admin', 'kitchen_staff'];

      if (!role || !validRoles.includes(role)) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('loggedInUser');
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
        return;
      }

      if (publicPaths.includes(location.pathname)) {
        const dashboardPath = getDashboardPath(role);
        if (location.pathname !== dashboardPath) {
          navigate(dashboardPath, { replace: true });
        }
      }
    } else {
      setIsAuthenticated(false);

      if (!publicPaths.includes(location.pathname) && location.pathname !== '/') {
        navigate('/login', { replace: true });
      }
    }
  }, [location.pathname, navigate, setIsAuthenticated]);

  return null;
}

export default RefreshHandler;
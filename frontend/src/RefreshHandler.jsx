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

    // Check if current path is public
    // startsWith handles dynamic routes like /reset-password/abc123
    const isPublicPath =
      ['/login', '/signup', '/verify-otp', '/verify-email', '/forgot-password', '/'].includes(location.pathname) ||
      location.pathname.startsWith('/reset-password') ||
      location.pathname.startsWith('/verify-email');

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

      // Prevent users from accessing other role's pages via back button
      const roleDashboards = {
        waiter: ['/waiter-dashboard', '/new-order', '/view-order'],
        cashier: ['/cashier-dashboard'],
        manager: ['/manager-dashboard'],
        admin: ['/admin-dashboard'],
        kitchen_staff: ['/kitchen-dashboard']
      };

      const allowedPaths = roleDashboards[role] || [];
      const isAllowed = allowedPaths.some(path => location.pathname.startsWith(path));
      const isPublic = isPublicPath;

      if (!isPublic && !isAllowed) {
        // User is trying to access another role's page — redirect to their dashboard
        navigate(getDashboardPath(role), { replace: true });
        return;
      }

      // If logged in user visits a public path like reset-password
      // let them stay — don't redirect to dashboard
      if (isPublicPath) {
        // Only redirect to dashboard if on login/signup pages
        // NOT on reset-password or verify pages
        if (
          location.pathname === '/login' ||
          location.pathname === '/signup'
        ) {
          navigate(getDashboardPath(role), { replace: true });
        }
        // Otherwise let them stay on the page (reset-password, verify etc)
        return;
      }

    } else {
      setIsAuthenticated(false);

      // If not logged in and trying to access protected route → go to login
      // But allow public paths including reset-password
      if (!isPublicPath) {
        navigate('/login', { replace: true });
      }
    }
  }, [location.pathname, navigate, setIsAuthenticated]);

  return null;
}

export default RefreshHandler;
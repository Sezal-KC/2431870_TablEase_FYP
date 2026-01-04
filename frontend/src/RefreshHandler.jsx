// RefreshHandler.jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function RefreshHandler({ setIsAuthenticated }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      setIsAuthenticated(true);

      // List of public (unauthenticated) routes
      const publicPaths = ['/', '/login', '/signup'];

      // Only redirect if the user is currently on a public route
      // AND not already on dashboard (prevents loop)
      if (
        publicPaths.includes(location.pathname) &&
        location.pathname !== '/dashboard'
      ) {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setIsAuthenticated(false);
    }
  }, [location.pathname, navigate, setIsAuthenticated]); // ← Only pathname as dependency

  return null;
}

export default RefreshHandler;
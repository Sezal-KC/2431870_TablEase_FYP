const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Get token from Authorization header (Bearer <token>)
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided - authorization denied'
    });
  }

  try {
    // Verify the token with your secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request (userId + role)
    req.user = decoded;

    next(); // Proceed to the route handler
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = authMiddleware;
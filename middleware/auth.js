// Authentication Middleware
// JWT token validation and user authentication

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || 'host'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to require authentication
 */
function requireAuth(req, res, next) {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid token.'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify token
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token. Please login again.'
    });
  }

  // Attach user info to request
  req.user = decoded;
  next();
}

/**
 * Middleware to optionally check authentication
 * Continues even if not authenticated
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (decoded) {
      req.user = decoded;
    }
  }
  
  next();
}

/**
 * Middleware to require specific role
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
}

/**
 * Middleware to check if user owns the resource
 */
function requireOwnership(resourceIdParam = 'id', userIdField = 'userId') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const resourceUserId = req.body[userIdField] || req.params[resourceIdParam];
    
    if (req.user.id !== resourceUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource'
      });
    }

    next();
  };
}

/**
 * Extract user from token without requiring auth
 */
function getUserFromToken(token) {
  if (!token) return null;
  
  // Remove 'Bearer ' if present
  if (token.startsWith('Bearer ')) {
    token = token.substring(7);
  }
  
  return verifyToken(token);
}

/**
 * Refresh token (generate new token with extended expiry)
 */
function refreshToken(oldToken) {
  const decoded = verifyToken(oldToken);
  
  if (!decoded) {
    return null;
  }

  // Remove jwt fields (iat, exp)
  const { iat, exp, ...userData } = decoded;
  
  return generateToken(userData);
}

module.exports = {
  generateToken,
  verifyToken,
  requireAuth,
  optionalAuth,
  requireRole,
  requireOwnership,
  getUserFromToken,
  refreshToken,
  JWT_SECRET,
  JWT_EXPIRES_IN
};

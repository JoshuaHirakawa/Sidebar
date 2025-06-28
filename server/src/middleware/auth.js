import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

/**
 * Middleware to authenticate JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist
    const userResult = await query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Add user to request object
    req.user = userResult.rows[0];
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without authentication
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length > 0) {
      req.user = userResult.rows[0];
    }

    next();

  } catch (error) {
    // Log error but don't fail the request
    console.error('Optional auth error:', error);
    next();
  }
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
export const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id,
      username: user.username 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
    }
  );
};

/**
 * Middleware to check if user owns a resource
 * @param {string} resourceType - Type of resource (project, session, etc.)
 * @param {Function} getResourceOwner - Function to get resource owner ID
 */
export const requireOwnership = (resourceType, getResourceOwner) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params.projectId || req.params.sessionId;
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: `${resourceType} ID required`,
          code: 'MISSING_RESOURCE_ID'
        });
      }

      const ownerId = await getResourceOwner(resourceId);
      
      if (!ownerId) {
        return res.status(404).json({
          success: false,
          error: `${resourceType} not found`,
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      if (ownerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: `Access denied to ${resourceType}`,
          code: 'ACCESS_DENIED'
        });
      }

      next();

    } catch (error) {
      console.error(`Ownership check error for ${resourceType}:`, error);
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed',
        code: 'AUTH_CHECK_ERROR'
      });
    }
  };
};

/**
 * Rate limiting helper for authentication endpoints
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authRateLimit = (req, res, next) => {
  // This would typically integrate with a rate limiting library
  // For now, we'll implement basic IP-based rate limiting
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Simple in-memory rate limiting (in production, use Redis)
  if (!req.app.locals.authAttempts) {
    req.app.locals.authAttempts = new Map();
  }

  const attempts = req.app.locals.authAttempts.get(clientIP) || 0;
  
  if (attempts > 5) { // 5 attempts per window
    return res.status(429).json({
      success: false,
      error: 'Too many authentication attempts',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  req.app.locals.authAttempts.set(clientIP, attempts + 1);
  
  // Reset after 15 minutes
  setTimeout(() => {
    req.app.locals.authAttempts.delete(clientIP);
  }, 15 * 60 * 1000);

  next();
}; 
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to verify access token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Optionally verify user still exists and is active
      const user = await User.findById(decoded.userId).select('-password -refreshTokens');
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      if (!user.isActive) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }
      
      req.user = user;
      req.userId = decoded.userId;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Optional authentication - attaches user if token present, but doesn't require it
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password -refreshTokens');
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = decoded.userId;
      }
    } catch {
      // Token invalid or expired - continue without user
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = { authenticate, optionalAuth };

const jwt = require('jsonwebtoken');

// Middleware om gebruikers te verifiëren met JWT
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ status: 'fail', message: 'Access Denied: No Token Provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Voeg de gebruiker toe aan het request
    next();
  } catch (error) {
    const errorMessage = error.name === 'TokenExpiredError' ? 'Token Expired' : 'Invalid Token';
    res.status(401).json({ status: 'fail', message: errorMessage });
  }
};

// Middleware om alleen toegang te geven aan admins
const adminAuth = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ status: 'fail', message: 'Access Denied: Admins Only' });
  }
  next();
};

// Middleware om toegang te beperken tot specifieke rollen
const roleAuth = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ status: 'fail', message: `Access Denied: Only ${role}s Allowed` });
  }
  next();
};

// Optionele authenticatie (voor routes die ook anoniem toegankelijk zijn)
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      console.warn('Optional auth: Invalid token, proceeding as guest');
    }
  }
  next();
};

module.exports = { auth, adminAuth, roleAuth, optionalAuth };

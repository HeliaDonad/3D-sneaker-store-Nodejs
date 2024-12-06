const jwt = require('jsonwebtoken');

// Middleware om gebruikers te verifiëren met JWT
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    console.error('Auth failed: No token provided');
    return res.status(401).json({ status: 'fail', message: 'Access Denied: No Token Provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error('Auth failed: Token expired', error.message);
      return res.status(401).json({ status: 'fail', message: 'Token Expired' });
    }
    console.error('Auth failed: Invalid token', error.message);
    res.status(400).json({ status: 'fail', message: 'Invalid Token' });
  }
};

// Middleware om alleen toegang te geven aan admins
const adminAuth = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    console.error('Admin auth failed: Not an admin');
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

exports.auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ status: 'fail', message: 'Toegang geweigerd: Geen token verstrekt.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode de token
    req.user = decoded; // Voeg de gebruiker toe aan de request
    next(); // Ga naar de volgende middleware of route
  } catch (error) {
    res.status(400).json({ status: 'fail', message: 'Ongeldige token.' });
  }
};
module.exports = { auth, adminAuth, roleAuth, optionalAuth };
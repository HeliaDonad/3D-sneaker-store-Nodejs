// Controleert of iemand toegang heeft tot de API (bijvoorbeeld door in te loggen en een token te krijgen)
// Verifieert of een gebruiker een geldig token heeft.

const jwt = require('jsonwebtoken');

// Middleware om gebruikers te verifiëren met JWT
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ status: 'fail', message: 'Access Denied: No Token Provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ status: 'fail', message: 'Invalid Token' });
  }
};

// Middleware om alleen toegang te geven aan admins
const adminAuth = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ status: 'fail', message: 'Access Denied: Admins Only' });
  }
  next();
};

module.exports = { auth, adminAuth };

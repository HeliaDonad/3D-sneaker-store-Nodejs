// Controleert of iemand toegang heeft tot de API (bijvoorbeeld door in te loggen en een token te krijgen)
// Verifieert of een gebruiker een geldig token heeft.

const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization'); // Haal het token op uit de Authorization-header
  if (!token) return res.status(401).json({ status: 'fail', message: 'Access Denied: No Token Provided' });

  try {
    // Verifieer het token en decodeer de gegevens
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Bewaar de gebruiker info in req.user voor verdere toegang
    next(); // Ga verder naar de volgende middleware of route
  } catch (error) {
    res.status(400).json({ status: 'fail', message: 'Invalid Token' });
  }
};

const adminAuth = (req, res, next) => {
  if (!req.user.isAdmin) { // Controleer of de gebruiker admin-rechten heeft
    return res.status(403).json({ status: 'fail', message: 'Access Denied: Admins Only' });
  }
  next(); // Ga verder naar de volgende middleware of route
};

module.exports = { auth, adminAuth };


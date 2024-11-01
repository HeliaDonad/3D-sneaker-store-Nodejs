const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
    let token = req.headers.authorization.split(' ')[1];
    if (!token) return res.status(401).jsend.fail({ message: 'No token provided' });

    jwt.verify(token, 'YOUR_SECRET_KEY', (err, decoded) => {
        if (err) return res.status(401).jsend.fail({ message: 'Unauthorized' });
        req.user = decoded;
        next();
    });
};

exports.restrictTo = (role) => (req, res, next) => {
    if (req.user.role !== role) {
        return res.status(403).jsend.fail({ message: 'Access denied' });
    }
    next();
};

// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const header = req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : (header || null);

  if (!token) {
    console.warn('[AUTH] No token in header');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id || decoded;
    return next();
  } catch (err) {
    console.warn('[AUTH] Token verification failed:', err.name, err.message);
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired' });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Token invalid' });
    return res.status(401).json({ message: 'Token verification failed' });
  }
};

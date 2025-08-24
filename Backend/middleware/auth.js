// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function auth(req, res, next) {
  try {
    const hdr = req.header('Authorization') || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({ code: 'NO_TOKEN', message: 'Authorization token missing' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ code: 'BAD_TOKEN', message: 'Invalid or expired token' });
    }

    const userId = decoded.id || decoded._id;
    if (!userId) {
      return res.status(401).json({ code: 'BAD_TOKEN', message: 'Token missing user id' });
    }

    const user = await User.findById(userId).select('_id');
    if (!user) {
      return res.status(401).json({ code: 'USER_NOT_FOUND', message: 'Invalid session. Please log in again.' });
    }

    // Backward compatibility: expose the uid in multiple places
    const uid = user._id.toString();
    req.user = uid;             // many controllers expect a string ObjectId here
    req.userId = uid;           // convenient alias
    req.auth = { id: uid };     // if newer code reads req.auth.id
    req.userObj = { id: uid };  // if some code reads req.user.id

    return next();
  } catch (err) {
    console.error('[auth] unexpected error:', err);
    return res.status(401).json({ code: 'AUTH_ERROR', message: 'Authentication failed' });
  }
};

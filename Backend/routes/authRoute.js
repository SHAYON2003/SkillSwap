
const express = require('express');
const router = express.Router();

const { 
  forgotPassword, 
  resetPassword,
} = require('../controllers/userController');

const { forgotPasswordLimiter, resetPasswordLimiter } = require('../middleware/rateLimiter');

// quick ping to verify mount
router.get('/__ping', (req, res) => res.json({ ok: true, where: 'authRoutes' }));

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', resetPasswordLimiter, resetPassword);

module.exports = router;
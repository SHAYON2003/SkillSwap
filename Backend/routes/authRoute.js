// routes/authRoutes.js
const express = require('express');
const router = express.Router();

const { forgotPassword, resetPassword } = require('../controllers/userController');

// quick ping to verify mount
router.get('/__ping', (req, res) => res.json({ ok: true, where: 'authRoutes' }));

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', resetPassword);

module.exports = router;

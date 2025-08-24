const express = require('express');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateSkills,
  addSkill,
  removeSkill,
  uploadAvatar,
  deleteAvatar,
  updateMe,
} = require('../controllers/userController');

const auth = require('../middleware/auth');
const User = require('../models/User');
const { upload } = require('../utils/multer');
const { registerLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginUser);

router.post('/avatar', auth, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', auth, deleteAvatar);

router.get('/me', auth, getUserProfile);
router.patch('/me', auth, updateMe);

router.get('/', auth, async (_req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

router.put('/skills', auth, updateSkills);
router.post('/skills/add', auth, addSkill);
router.delete('/skills/remove', auth, removeSkill);

module.exports = router;

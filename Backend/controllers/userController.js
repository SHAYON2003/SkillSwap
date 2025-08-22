const User = require('../models/User');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { cloudinary } = require('../utils/cloudinary');
const streamifier = require('streamifier');

// REGISTER
exports.registerUser = async (req, res) => {
  try {
    let { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email, and password are required" });
    }

    username = String(username).trim();
    email = String(email).toLowerCase().trim();

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hashedPassword });

    // issue token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: newUser._id, username: newUser.username, email: newUser.email },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// LOGIN
exports.loginUser = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const identifier = (email ?? username ?? '').toString().trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: "email/username and password are required" });
    }

    const query = email
      ? { email: identifier.toLowerCase() }
      : { username: identifier };

    const user = await User.findOne(query).select('+password');
    if (!user) return res.status(400).json({ message: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET PROFILE
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// UPDATE ALL SKILLS
exports.updateSkills = async (req, res) => {
  try {
    const { skillsOffered = [], skillsWanted = [] } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user,
      { $set: { skillsOffered, skillsWanted } },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    console.error("Update skills error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ADD SINGLE SKILL
exports.addSkill = async (req, res) => {
  try {
    const { type, name, level } = req.body; // type: "offered" | "wanted"
    if (!["offered", "wanted"].includes(type)) {
      return res.status(400).json({ message: "type must be 'offered' or 'wanted'" });
    }

    const field = type === "offered" ? "skillsOffered" : "skillsWanted";
    const skillObj = level ? { name, level } : { name };

    const user = await User.findByIdAndUpdate(
      req.user,
      { $addToSet: { [field]: skillObj } },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    console.error("Add skill error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// REMOVE SINGLE SKILL
exports.removeSkill = async (req, res) => {
  try {
    const { type, name } = req.body;
    if (!["offered", "wanted"].includes(type)) {
      return res.status(400).json({ message: "type must be 'offered' or 'wanted'" });
    }

    const field = type === "offered" ? "skillsOffered" : "skillsWanted";

    const user = await User.findByIdAndUpdate(
      req.user,
      { $pull: { [field]: { name } } },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    console.error("Remove skill error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};



exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No file uploaded or invalid file' });
    }

    const userExists = await User.findById(req.user);
    if (!userExists) return res.status(404).json({ message: 'User not found' });

    const uploadFromBuffer = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'skillswap/avatars',
            transformation: [{ width: 800, height: 800, crop: 'limit' }],
            resource_type: 'image',
            format: 'jpg',
          },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await uploadFromBuffer(req.file.buffer);

    const avatarObj = { url: result.secure_url, public_id: result.public_id };

    if (userExists.avatar?.public_id) {
      await cloudinary.uploader.destroy(userExists.avatar.public_id).catch(() => {});
    }

    const updated = await User.findByIdAndUpdate(
      req.user,
      { $set: { avatar: avatarObj } },
      { new: true, runValidators: true }
    ).select('-password').lean();

    return res.json({ message: 'Avatar uploaded successfully', user: updated, avatar: avatarObj });

  } catch (err) {
    console.error('[uploadAvatar] error:', err);
    return res.status(500).json({ message: 'Failed to upload avatar', error: err.message });
  }
};

exports.deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.avatar?.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id).catch(() => {});
    }

    user.avatar = undefined;
    await user.save();

    const updatedUser = await User.findById(req.user).select('-password').lean();
    return res.json({ message: 'Avatar removed successfully', user: updatedUser });
  } catch (err) {
    console.error('[deleteAvatar] error:', err);
    return res.status(500).json({ message: 'Failed to remove avatar', error: err.message });
  }
};


exports.updateMe = async (req, res) => {
  try {
    const { bio, isEmailPublic, linkedin, instagram, youtube } = req.body;
    const updates = {};
    if (typeof bio === 'string') updates.bio = bio.slice(0, 500);
    if (typeof isEmailPublic === 'boolean') updates.isEmailPublic = isEmailPublic;
    if (typeof linkedin === 'string')  updates.linkedin  = linkedin.trim();
    if (typeof instagram === 'string') updates.instagram = instagram.trim();
    if (typeof youtube === 'string')   updates.youtube   = youtube.trim();

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true, runValidators: true
    }).select('-password');

    return res.json(user);
  } catch (e) {
    console.error('updateMe error:', e);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond with 200 for privacy (email enumeration protection)
  if (!user) {
    return res.status(200).json({ message: 'If an account exists, we sent a reset link.' });
  }

  const rawToken = user.createPasswordResetToken(15); // 15 mins
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${rawToken}`;

  try {
    await sendEmail(
      user.email,
      'Reset your SkillSwap password',
      `Click the link to reset your password:\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.`
    );
    return res.status(200).json({ message: 'If an account exists, we sent a reset link.' });
  } catch (e) {
    // cleanup token on email failure
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({ message: 'Could not send reset email' });
  }

}

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash the token to compare with DB
  const hashed = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() }
  }).select('+password');

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  user.setPassword(password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save(); // will hash the password via pre('save')

  res.status(200).json({ message: 'Password reset successful' });
};

const User = require('../models/User');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { cloudinary } = require('../utils/cloudinary');
const streamifier = require('streamifier');
const crypto = require('crypto');
const {
  sanitizeInput,
  validateRegistrationInput,
  validatePassword,
  validateEmail,            // ← add this (used in forgotPassword)
} = require('../utils/validation');

/** Normalize requester id (auth middleware sets req.user to a string) */
function getUid(req) {
  return String(
    req.userId ||
    (req.userObj && req.userObj.id) ||
    req.auth?.id ||
    req.user || ''
  );
}

// REGISTER
exports.registerUser = async (req, res) => {
  try {
    let { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required",
        errors: {
          ...((!username) && { username: 'Username is required' }),
          ...((!email) && { email: 'Email is required' }),
          ...((!password) && { password: 'Password is required' })
        }
      });
    }

    username = sanitizeInput(username);
    email = sanitizeInput(email).toLowerCase();
    password = String(password);

    const validationErrors = validateRegistrationInput(username, email, password);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors
      });
    }

    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
        errors: { email: "An account with this email already exists" }
      });
    }

    const existingUsernameUser = await User.findOne({ username });
    if (existingUsernameUser) {
      return res.status(409).json({
        message: "Username is already taken",
        errors: { username: "Username is already taken" }
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      registrationDate: new Date(),
      isEmailVerified: false,
      accountStatus: 'active'
    });

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(`New user registered: ${username} (${email}) at ${new Date().toISOString()}`);

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        registrationDate: newUser.registrationDate
      },
    });

  } catch (err) {
    console.error("Registration error:", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const message = field === 'email'
        ? 'An account with this email already exists'
        : 'Username is already taken';

      return res.status(409).json({
        message,
        errors: { [field]: message }
      });
    }
    return res.status(500).json({ message: "Registration failed. Please try again." });
  }
};

// LOGIN
exports.loginUser = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const identifier = email?.trim() || username?.trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email or username and password are required" });
    }

    let query;
    if (email && email.trim()) {
      query = { email: email.toLowerCase().trim() };
    } else if (username && username.trim()) {
      query = { username: username.trim() };
    } else {
      return res.status(400).json({ message: "Please provide either email or username" });
    }

    const user = await User.findOne(query).select('+password');
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET PROFILE (/users/me)
exports.getUserProfile = async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: "Not authenticated" });

    const user = await User.findById(uid).select("-password");
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
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Not authenticated' });

    const { skillsOffered = [], skillsWanted = [] } = req.body;
    const user = await User.findByIdAndUpdate(
      uid,
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
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Not authenticated' });

    const { type, name, level } = req.body; // type: "offered" | "wanted"
    if (!["offered", "wanted"].includes(type)) {
      return res.status(400).json({ message: "type must be 'offered' or 'wanted'" });
    }

    const field = type === "offered" ? "skillsOffered" : "skillsWanted";
    const skillObj = level ? { name, level } : { name };

    const user = await User.findByIdAndUpdate(
      uid,
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
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Not authenticated' });

    const { type, name } = req.body;
    if (!["offered", "wanted"].includes(type)) {
      return res.status(400).json({ message: "type must be 'offered' or 'wanted'" });
    }

    const field = type === "offered" ? "skillsOffered" : "skillsWanted";

    const user = await User.findByIdAndUpdate(
      uid,
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
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Not authenticated' });

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No file uploaded or invalid file' });
    }

    const userExists = await User.findById(uid);
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
      uid,
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
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Not authenticated' });

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.avatar?.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id).catch(() => {});
    }

    user.avatar = undefined;
    await user.save();

    const updatedUser = await User.findById(uid).select('-password').lean();
    return res.json({ message: 'Avatar removed successfully', user: updatedUser });
  } catch (err) {
    console.error('[deleteAvatar] error:', err);
    return res.status(500).json({ message: 'Failed to remove avatar', error: err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Not authenticated' });

    const { bio, isEmailPublic, linkedin, instagram, youtube } = req.body;
    const updates = {};
    if (typeof bio === 'string') updates.bio = bio.slice(0, 500);
    if (typeof isEmailPublic === 'boolean') updates.isEmailPublic = isEmailPublic;
    if (typeof linkedin === 'string')  updates.linkedin  = linkedin.trim();
    if (typeof instagram === 'string') updates.instagram = instagram.trim();
    if (typeof youtube === 'string')   updates.youtube   = youtube.trim();

    const user = await User.findByIdAndUpdate(uid, updates, {
      new: true, runValidators: true
    }).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (e) {
    console.error('updateMe error:', e);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
        errors: { email: 'Email is required' }
      });
    }

    email = sanitizeInput(email).toLowerCase();

    if (!validateEmail(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address',
        errors: { email: 'Please enter a valid email address' }
      });
    }

    const user = await User.findOne({ email });

    const successMessage = 'If an account exists, we sent a reset link to your email.';

    if (!user) {
      console.log(`Password reset attempted for non-existent email: ${email} at ${new Date().toISOString()}`);
      return res.status(200).json({ message: successMessage });
    }

    const recentResetRequest = user.resetPasswordExpire && user.resetPasswordExpire > Date.now();
    if (recentResetRequest) {
      console.log(`Duplicate password reset request for: ${email}`);
      return res.status(200).json({ message: successMessage });
    }

    const rawToken = user.createPasswordResetToken(15);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${rawToken}`;

    const emailSubject = 'Reset your SkillSwap password';
    const emailBody = `
Hello ${user.username},

You requested a password reset for your SkillSwap account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 15 minutes for security.

If you didn't request this reset, please ignore this email and your password will remain unchanged.

Best regards,
The SkillSwap Team
    `.trim();

    // NOTE: sendEmail must exist in your utils; if not, plug in your mailer here.
    try {
      const { sendEmail } = require('../utils/sendEmail');
      await sendEmail(user.email, emailSubject, emailBody);
      console.log(`Password reset email sent to: ${user.email} at ${new Date().toISOString()}`);
      return res.status(200).json({ message: successMessage });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Could not send reset email. Please try again later.' });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    let { password } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required', errors: { token: 'Reset token is required' } });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required', errors: { password: 'Password is required' } });
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ message: 'Password does not meet requirements', errors: { password: passwordErrors[0] } });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired reset link. Please request a new password reset.',
        errors: { token: 'Invalid or expired reset link' }
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.lastPasswordChange = new Date();

    await user.save({ validateBeforeSave: false });

    console.log(`Password reset successful for user: ${user.email} at ${new Date().toISOString()}`);

    res.status(200).json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Password reset failed. Please try again.' });
  }
};

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const avatarSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },        // public URL (Cloudinary or local)
    public_id: { type: String, default: '' },  // cloud provider id (optional)
    thumb: { type: String, default: '' }       // small thumbnail URL (optional)
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    lastSeen: { type: Date },

    username: { type: String, required: true, unique: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },

    // Recommend select:false so it never leaks in accidental .find()
    password: { type: String, required: true, minlength: 6, select: false },

    // Optional: track password change to invalidate old JWTs if needed
    passwordChangedAt: { type: Date },

    // Password reset support
    resetPasswordToken: { type: String, index: true },
    resetPasswordExpire: { type: Date },

    avatar: { type: avatarSchema, default: () => ({}) },

    skillsOffered: [
      {
        name: { type: String },
        level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'] },
        swapsCount: { type: Number, default: 0 },
      }
    ],
    skillsWanted: [
      {
        name: { type: String },
        level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'] },
        swapsCount: { type: Number, default: 0 }
      }
    ],


    bio:           { type: String, maxlength: 500, default: '' },
    linkedin:      { type: String, default: '' },
    instagram:     { type: String, default: '' },
    youtube:       { type: String, default: '' },
    isEmailPublic: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now }
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // hide sensitive fields when sending to client
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Virtual: safeAvatar - returns avatar.url || avatar.thumb || default image
userSchema.virtual('safeAvatar').get(function () {
  if (this.avatar && this.avatar.url) return this.avatar.url;
  if (this.avatar && this.avatar.thumb) return this.avatar.thumb;
  // Replace with your public default avatar path or an absolute CDN URL
  return '/default-avatar.png';
});

/* ===========================
 * Password hashing middleware
 * =========================== */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  // update passwordChangedAt (small backdate to avoid token timing issues)
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }

  next();
});

/* ===========================
 * Instance methods
 * =========================== */

// Compare candidate password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  // this.password is available only if selected with .select('+password')
  return bcrypt.compare(candidatePassword, this.password);
};

// Set a new password (will be hashed by pre('save'))
userSchema.methods.setPassword = function (newPassword) {
  this.password = newPassword;
};

// Generate a password reset token (returns raw token to email to user)
// Stores a SHA-256 hash of the token + expiry in DB
userSchema.methods.createPasswordResetToken = function (ttlMinutes = 15) {
  // raw token to send to user
  const resetToken = crypto.randomBytes(32).toString('hex');

  // store hashed token in DB
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = new Date(Date.now() + ttlMinutes * 60 * 1000);

  return resetToken; // send this in the email link
};

// Check if user changed password after a given JWT iat (optional helper)
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (!this.passwordChangedAt) return false;
  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return changedTimestamp > JWTTimestamp;
};

module.exports = mongoose.model('User', userSchema);
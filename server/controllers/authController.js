const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Post = require('../models/Post');
const { sendResetEmail } = require('../utils/email');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
};

exports.register = async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body;

    if (
      typeof username !== 'string' ||
      typeof fullName !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid field types provided',
      });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedUsername || !trimmedFullName || !trimmedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (username, full name, email, password)',
      });
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters',
      });
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(trimmedUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, underscores and dots',
      });
    }

    if (trimmedFullName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Full name cannot exceed 50 characters',
      });
    }

    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const emailExists = await User.findOne({ email: trimmedEmail });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const usernameExists = await User.findOne({ username: trimmedUsername });
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: 'This username is already taken. Please pick another.',
      });
    }

    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      trimmedFullName
    )}&backgroundColor=1d4ed8&textColor=ffffff`;

    const user = await User.create({
      username: trimmedUsername,
      fullName: trimmedFullName,
      email: trimmedEmail,
      password,
      avatar: defaultAvatar,
      coverPhoto: '',
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        coverPhoto: user.coverPhoto,
        bio: user.bio,
        role: user.role,
        followersCount: 0,
        followingCount: 0,
        token,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      const message = field === 'email'
        ? 'An account with this email already exists'
        : 'This username is already taken. Please pick another.';
      return res.status(400).json({ success: false, message });
    }
    if (error.name === 'ValidationError') {
      const firstMessage = Object.values(error.errors || {})[0]?.message || 'Validation failed';
      return res.status(400).json({ success: false, message: firstMessage });
    }
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { loginId, password } = req.body;

    if (typeof loginId !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password',
      });
    }

    const trimmedLoginId = loginId.trim();
    if (!trimmedLoginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password',
      });
    }

    const isEmail = trimmedLoginId.includes('@');
    const query = isEmail
      ? { email: trimmedLoginId.toLowerCase() }
      : { username: trimmedLoginId.toLowerCase() };

    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    const token = generateToken(user._id);
    const postsCount = await Post.countDocuments({ author: user._id });

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        coverPhoto: user.coverPhoto,
        bio: user.bio,
        website: user.website,
        location: user.location,
        followers: user.followers,
        following: user.following,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        postsCount,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const postsCount = await Post.countDocuments({ author: user._id });

    return res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        followersCount: user.followers.length,
        followingCount: user.following.length,
        postsCount,
      },
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error getting user profile',
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide your current and new password',
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your current and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('changePassword error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error changing password',
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide your email address' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const user = await User.findOne({ email: trimmedEmail });


    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    try {
      await sendResetEmail({
        to: user.email,
        name: user.fullName || user.username,
        resetUrl,
      });
    } catch (emailError) {
      console.error('Reset email failed:', emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        success: false,
        message: 'We could not send the reset email. Please try again later.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing password reset request',
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (typeof token !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire +password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired. Please request a new one.',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const authToken = generateToken(user._id);

    const postsCount = await Post.countDocuments({ author: user._id });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.',
      data: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        coverPhoto: user.coverPhoto,
        bio: user.bio,
        website: user.website,
        location: user.location,
        followers: user.followers,
        following: user.following,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        postsCount,
        role: user.role,
        token: authToken,
      },
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error resetting password',
    });
  }
};

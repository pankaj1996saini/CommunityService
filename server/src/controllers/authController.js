const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { EMAIL_RE, str, cleanPhone, failIfErrors } = require('../utils/validate');

const signToken = (user) => jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: config.jwtExpires });

// Public sign-up always creates a normal "user". Staff and admins are made by an admin.
exports.register = asyncHandler(async (req, res) => {
  const name = str(req.body.name);
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const phone = cleanPhone(req.body.phone);
  const unit = str(req.body.unit);

  const errors = {};
  if (name.length < 2) errors.name = 'Please enter your name';
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';
  if (password.length < 6) errors.password = 'Password needs at least 6 characters';
  if (phone && phone.length !== 10) errors.phone = 'Phone number should have 10 digits';
  failIfErrors(errors);

  const user = await User.create({ name, email, password, phone, unit, role: 'user' });
  res.status(201).json({ token: signToken(user), user });
});

exports.login = asyncHandler(async (req, res) => {
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) throw new HttpError(400, 'Email and password are required');

  const user = await User.findOne({ email }).select('+password');
  // same message for "no such user" and "wrong password" on purpose
  if (!user || !(await user.checkPassword(password))) {
    throw new HttpError(401, 'Incorrect email or password');
  }
  if (!user.active) throw new HttpError(403, 'This account has been deactivated. Please contact the administrator.');

  res.json({ token: signToken(user), user });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  const errors = {};

  if (req.body.name !== undefined) {
    const name = str(req.body.name);
    if (name.length < 2) errors.name = 'Please enter your name';
    else user.name = name;
  }
  if (req.body.phone !== undefined) {
    const phone = cleanPhone(req.body.phone);
    if (phone && phone.length !== 10) errors.phone = 'Phone number should have 10 digits';
    else user.phone = phone;
  }
  if (req.body.unit !== undefined) user.unit = str(req.body.unit);

  if (req.body.newPassword) {
    if (!req.body.currentPassword || !(await user.checkPassword(req.body.currentPassword))) {
      errors.currentPassword = 'Current password is not correct';
    } else if (req.body.newPassword.length < 6) {
      errors.newPassword = 'New password needs at least 6 characters';
    } else {
      user.password = req.body.newPassword;
    }
  }

  failIfErrors(errors);
  await user.save();
  res.json({ user });
});

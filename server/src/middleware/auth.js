const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Please log in to continue');

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, 'Your session has expired, please log in again');
  }

  const user = await User.findById(payload.id);
  if (!user || !user.active) throw new HttpError(401, 'This account is no longer active');

  req.user = user;
  next();
});

// usage: router.get('/x', protect, allow('admin', 'staff'), handler)
const allow =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You are not allowed to do that'));
    }
    next();
  };

module.exports = { protect, allow };

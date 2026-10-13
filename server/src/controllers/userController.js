const User = require('../models/User');
const Complaint = require('../models/Complaint');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { EMAIL_RE, str, cleanPhone, escapeRegex, failIfErrors } = require('../utils/validate');

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (['user', 'staff', 'admin'].includes(req.query.role)) filter.role = req.query.role;
  const q = str(req.query.q);
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { unit: rx }, { department: rx }];
  }
  const users = await User.find(filter).sort({ name: 1 }).limit(200);
  res.json({ items: users });
});

// Active staff plus how many unfinished jobs each one is carrying right now.
// The admin sees this when picking who to assign a complaint to.
exports.staff = asyncHandler(async (_req, res) => {
  const [staff, load] = await Promise.all([
    User.find({ role: 'staff', active: true }).sort({ name: 1 }),
    Complaint.aggregate([
      { $match: { assignedTo: { $ne: null }, status: { $ne: 'Resolved' } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
    ]),
  ]);
  const loadOf = new Map(load.map((l) => [String(l._id), l.count]));
  res.json({ items: staff.map((s) => ({ ...s.toJSON(), workload: loadOf.get(String(s._id)) || 0 })) });
});

exports.create = asyncHandler(async (req, res) => {
  const name = str(req.body.name);
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const role = ['user', 'staff'].includes(req.body.role) ? req.body.role : 'staff';
  const phone = cleanPhone(req.body.phone);

  const errors = {};
  if (name.length < 2) errors.name = 'Please enter a name';
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';
  if (password.length < 6) errors.password = 'Password needs at least 6 characters';
  if (phone && phone.length !== 10) errors.phone = 'Phone number should have 10 digits';
  failIfErrors(errors);

  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
    unit: str(req.body.unit),
    department: str(req.body.department),
  });
  res.status(201).json({ user });
});

exports.update = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+password');
  if (!user) throw new HttpError(404, 'User not found');

  const errors = {};
  const { body } = req;

  if (body.name !== undefined) {
    const name = str(body.name);
    if (name.length < 2) errors.name = 'Please enter a name';
    else user.name = name;
  }
  if (body.phone !== undefined) {
    const phone = cleanPhone(body.phone);
    if (phone && phone.length !== 10) errors.phone = 'Phone number should have 10 digits';
    else user.phone = phone;
  }
  if (body.unit !== undefined) user.unit = str(body.unit);
  if (body.department !== undefined) user.department = str(body.department);

  if (body.password) {
    if (body.password.length < 6) errors.password = 'Password needs at least 6 characters';
    else user.password = body.password;
  }

  if (body.active !== undefined) {
    if (String(user._id) === String(req.user._id) && body.active === false) {
      throw new HttpError(400, "You can't deactivate your own account");
    }
    user.active = Boolean(body.active);
  }

  failIfErrors(errors);
  await user.save();
  res.json({ user });
});

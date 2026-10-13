const Complaint = require('../models/Complaint');
const User = require('../models/User');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { nextTicketId } = require('../utils/ticket');
const { notify } = require('../utils/notify');
const { str, escapeRegex, failIfErrors } = require('../utils/validate');
const { publicPath } = require('../middleware/upload');
const { CATEGORIES, STATUSES, PRIORITIES } = require('../constants');

// What a given person is allowed to see.
function scopeFor(user) {
  if (user.role === 'admin') return {};
  if (user.role === 'staff') return { assignedTo: user._id };
  return { createdBy: user._id };
}

const withPeople = (query) =>
  query
    .populate('createdBy', 'name email phone unit')
    .populate('assignedTo', 'name phone department');

const timelineEntry = (user, status, note) => ({
  status,
  note,
  by: user._id,
  byName: user.name,
  byRole: user.role,
});

async function adminIds() {
  const admins = await User.find({ role: 'admin', active: true }).select('_id');
  return admins.map((a) => a._id);
}

// ---------------------------------------------------------------- list / read

exports.list = asyncHandler(async (req, res) => {
  const { q, status, category, priority, unassigned } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 15, 1), 50);

  const filter = scopeFor(req.user);
  if (STATUSES.includes(status)) filter.status = status;
  if (CATEGORIES.includes(category)) filter.category = category;
  if (PRIORITIES.includes(priority)) filter.priority = priority;
  if (unassigned === 'true' && req.user.role === 'admin') filter.assignedTo = null;

  const search = str(q);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: rx }, { ticketId: rx }, { location: rx }, { description: rx }];
  }

  const [items, total] = await Promise.all([
    withPeople(
      Complaint.find(filter)
        .select('-timeline') // the list doesn't need the whole history
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
    ),
    Complaint.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
});

exports.getOne = asyncHandler(async (req, res) => {
  const complaint = await withPeople(Complaint.findOne({ _id: req.params.id, ...scopeFor(req.user) }));
  if (!complaint) throw new HttpError(404, 'Complaint not found');
  res.json({ complaint });
});

// -------------------------------------------------------------------- create

exports.create = asyncHandler(async (req, res) => {
  const title = str(req.body.title);
  const description = str(req.body.description);
  const location = str(req.body.location);
  const category = str(req.body.category);

  const errors = {};
  if (title.length < 3) errors.title = 'Give the problem a short title (3+ characters)';
  else if (title.length > 100) errors.title = 'Title is too long (100 characters max)';
  if (!CATEGORIES.includes(category)) errors.category = 'Pick a category';
  if (location.length < 2) errors.location = 'Tell us where the problem is';
  if (description.length < 10) errors.description = 'Please describe it in a bit more detail (10+ characters)';
  else if (description.length > 1000) errors.description = 'Description is too long (1000 characters max)';
  failIfErrors(errors);

  const complaint = await Complaint.create({
    ticketId: await nextTicketId(),
    title,
    description,
    location,
    category,
    images: (req.files || []).map(publicPath),
    createdBy: req.user._id,
    timeline: [timelineEntry(req.user, 'Open', 'Complaint submitted')],
  });

  await notify(
    await adminIds(),
    'New complaint',
    `${complaint.ticketId}: ${complaint.title} (${complaint.category})`,
    complaint._id
  );

  const full = await withPeople(Complaint.findById(complaint._id));
  res.status(201).json({ complaint: full });
});

// ------------------------------------------------------------- admin actions

exports.assign = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new HttpError(404, 'Complaint not found');
  if (complaint.status === 'Resolved') throw new HttpError(400, 'This complaint is already resolved');

  const staff = await User.findOne({ _id: req.body.staffId, role: 'staff', active: true });
  if (!staff) throw new HttpError(400, 'Pick an active staff member');

  if (req.body.priority !== undefined) {
    if (!PRIORITIES.includes(req.body.priority)) throw new HttpError(400, 'Invalid priority');
    complaint.priority = req.body.priority;
  }

  const wasAssigned = complaint.assignedTo && String(complaint.assignedTo) !== String(staff._id);
  complaint.assignedTo = staff._id;
  complaint.status = 'Assigned';
  complaint.timeline.push(
    timelineEntry(
      req.user,
      'Assigned',
      `${wasAssigned ? 'Reassigned' : 'Assigned'} to ${staff.name}${staff.department ? ` (${staff.department})` : ''}`
    )
  );
  await complaint.save();

  await notify(staff._id, 'New task assigned', `${complaint.ticketId}: ${complaint.title}`, complaint._id);
  await notify(
    complaint.createdBy,
    'Your complaint was assigned',
    `${complaint.ticketId} is now with ${staff.name}.`,
    complaint._id
  );

  res.json({ complaint: await withPeople(Complaint.findById(complaint._id)) });
});

exports.setPriority = asyncHandler(async (req, res) => {
  const { priority } = req.body;
  if (!PRIORITIES.includes(priority)) throw new HttpError(400, 'Invalid priority');

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new HttpError(404, 'Complaint not found');

  if (complaint.priority !== priority) {
    complaint.priority = priority;
    complaint.timeline.push(timelineEntry(req.user, complaint.status, `Priority changed to ${priority}`));
    await complaint.save();
  }
  res.json({ complaint: await withPeople(Complaint.findById(complaint._id)) });
});

// ---------------------------------------------------------- status / progress

// Used by staff (accept, progress notes, resolve) and by admins (any status).
exports.updateStatus = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new HttpError(404, 'Complaint not found');

  const isAdmin = req.user.role === 'admin';
  const isStaff = req.user.role === 'staff';
  const remarks = str(req.body.remarks);
  const next = req.body.status || complaint.status;

  if (!STATUSES.includes(next)) throw new HttpError(400, 'Invalid status');
  if (remarks.length > 500) throw new HttpError(400, 'Remarks are too long (500 characters max)');

  if (isStaff) {
    if (String(complaint.assignedTo) !== String(req.user._id)) {
      throw new HttpError(403, 'This complaint is not assigned to you');
    }
    const from = complaint.status;
    const okMoves = {
      Assigned: ['In Progress'], // accepting the task
      'In Progress': ['In Progress', 'Resolved'], // progress note, or done
    };
    if (!(okMoves[from] || []).includes(next)) {
      throw new HttpError(400, from === 'Resolved' ? 'This complaint is already resolved' : `You can't move a complaint from ${from} to ${next}`);
    }
    // accepting needs no explanation, everything else does
    if (!(from === 'Assigned' && next === 'In Progress') && !remarks) {
      throw new HttpError(400, 'Please add a remark describing the progress', { remarks: 'Remarks are required' });
    }
  } else if (isAdmin) {
    if (next !== 'Open' && !complaint.assignedTo) {
      throw new HttpError(400, 'Assign the complaint to a staff member first');
    }
  }

  const uploaded = (req.files || []).map(publicPath);
  if (uploaded.length) complaint.workImages.push(...uploaded);

  const defaultNote =
    next === 'In Progress' && complaint.status === 'Assigned'
      ? 'Task accepted, work started'
      : next === 'Resolved'
      ? 'Marked as resolved'
      : `Status set to ${next}`;

  const becameResolved = next === 'Resolved' && complaint.status !== 'Resolved';
  const statusChanged = next !== complaint.status;

  complaint.status = next;
  if (becameResolved) complaint.resolvedAt = new Date();
  if (next !== 'Resolved') complaint.resolvedAt = undefined;
  complaint.timeline.push(timelineEntry(req.user, next, remarks || defaultNote));
  await complaint.save();

  // tell the reporter, and the staff member if an admin did it
  const msg = remarks || defaultNote;
  const title = statusChanged ? `Complaint ${next.toLowerCase()}` : 'Progress update';
  await notify(complaint.createdBy, title, `${complaint.ticketId}: ${msg}`, complaint._id);
  if (isAdmin && complaint.assignedTo) {
    await notify(complaint.assignedTo, `Status changed to ${next}`, complaint.ticketId, complaint._id);
  }
  if (isStaff && becameResolved) {
    await notify(await adminIds(), 'Complaint resolved', `${complaint.ticketId} was resolved by ${req.user.name}`, complaint._id);
  }

  res.json({ complaint: await withPeople(Complaint.findById(complaint._id)) });
});

// ------------------------------------------------------------------ feedback

exports.addFeedback = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!complaint) throw new HttpError(404, 'Complaint not found');
  if (complaint.status !== 'Resolved') throw new HttpError(400, 'You can give feedback once the complaint is resolved');
  if (complaint.feedback && complaint.feedback.rating) throw new HttpError(400, 'You already left feedback for this one');

  const rating = Number(req.body.rating);
  const comment = str(req.body.comment);
  const errors = {};
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = 'Choose a rating from 1 to 5';
  if (comment.length > 300) errors.comment = 'Comment is too long (300 characters max)';
  failIfErrors(errors);

  complaint.feedback = { rating, comment, at: new Date() };
  await complaint.save();

  if (complaint.assignedTo) {
    await notify(complaint.assignedTo, 'You got feedback', `${complaint.ticketId}: rated ${rating}/5`, complaint._id);
  }

  res.json({ complaint: await withPeople(Complaint.findById(complaint._id)) });
});

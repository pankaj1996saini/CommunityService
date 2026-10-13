const Complaint = require('../models/Complaint');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { STATUSES } = require('../constants');

const emptyStatusMap = () => Object.fromEntries(STATUSES.map((s) => [s, 0]));

// Last 7 calendar days including today, zero-filled so the chart has no gaps.
function fillLastSevenDays(rows) {
  const counts = new Map(rows.map((r) => [r._id, r.count]));
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, count: counts.get(key) || 0 });
  }
  return out;
}

exports.get = asyncHandler(async (req, res) => {
  const { user } = req;

  // Normal users and staff only see numbers for their own complaints.
  if (user.role !== 'admin') {
    const match = user.role === 'staff' ? { assignedTo: user._id } : { createdBy: user._id };
    const rows = await Complaint.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    const byStatus = emptyStatusMap();
    rows.forEach((r) => (byStatus[r._id] = r.count));
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
    return res.json({ role: user.role, total, byStatus, pending: total - byStatus.Resolved });
  }

  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const [statusRows, categoryRows, priorityRows, dayRows, resolutionRows, ratingRows, staffRows, unassigned, userCount, staffCount] =
    await Promise.all([
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Complaint.aggregate([{ $match: { status: { $ne: 'Resolved' } } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Complaint.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $match: { resolvedAt: { $exists: true, $ne: null } } },
        { $group: { _id: null, avgMs: { $avg: { $subtract: ['$resolvedAt', '$createdAt'] } } } },
      ]),
      Complaint.aggregate([
        { $match: { 'feedback.rating': { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$feedback.rating' }, count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $match: { assignedTo: { $ne: null } } },
        {
          $group: {
            _id: '$assignedTo',
            assigned: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
          },
        },
        { $sort: { resolved: -1 } },
        { $limit: 5 },
      ]),
      Complaint.countDocuments({ status: 'Open', assignedTo: null }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'staff' }),
    ]);

  const byStatus = emptyStatusMap();
  statusRows.forEach((r) => (byStatus[r._id] = r.count));
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

  const staffNames = await User.find({ _id: { $in: staffRows.map((s) => s._id) } }).select('name department');
  const nameOf = new Map(staffNames.map((s) => [String(s._id), s]));

  res.json({
    role: 'admin',
    total,
    byStatus,
    pending: total - byStatus.Resolved,
    unassigned,
    byCategory: categoryRows.map((r) => ({ category: r._id, count: r.count })),
    pendingByPriority: priorityRows.map((r) => ({ priority: r._id, count: r.count })),
    last7Days: fillLastSevenDays(dayRows),
    avgResolutionHours: resolutionRows[0] ? Math.round((resolutionRows[0].avgMs / 36e5) * 10) / 10 : null,
    avgRating: ratingRows[0] ? Math.round(ratingRows[0].avg * 10) / 10 : null,
    ratingCount: ratingRows[0] ? ratingRows[0].count : 0,
    resolutionRate: total ? Math.round((byStatus.Resolved / total) * 100) : 0,
    staffPerformance: staffRows.map((s) => {
      const info = nameOf.get(String(s._id));
      return {
        id: s._id,
        name: info ? info.name : 'Removed staff',
        department: info ? info.department : '',
        assigned: s.assigned,
        resolved: s.resolved,
      };
    }),
    people: { users: userCount, staff: staffCount },
  });
});

const Notification = require('../models/Notification');

// Fire-and-forget. A failed notification should never break the request that caused it.
async function notify(userIds, title, message, complaintId) {
  const ids = [...new Set([].concat(userIds).filter(Boolean).map(String))];
  if (!ids.length) return;
  try {
    await Notification.insertMany(ids.map((user) => ({ user, title, message, complaint: complaintId })));
  } catch (err) {
    console.error('[notify] could not save notification:', err.message);
  }
}

module.exports = { notify };

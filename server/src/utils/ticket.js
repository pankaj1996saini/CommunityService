const Counter = require('../models/Counter');

// Atomic increment so two people submitting at the same moment never get the same number.
async function nextTicketId() {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { key: `ticket-${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `CMP-${year}-${String(counter.seq).padStart(4, '0')}`;
}

module.exports = { nextTicketId };

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Notification', notificationSchema);

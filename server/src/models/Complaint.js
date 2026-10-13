const mongoose = require('mongoose');
const { CATEGORIES, STATUSES, PRIORITIES } = require('../constants');

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    note: { type: String, default: '' },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // store the name too so old entries still read fine if a user gets renamed or removed
    byName: { type: String, default: '' },
    byRole: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const complaintSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true, index: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, minlength: 3, maxlength: 100 },
    description: { type: String, required: [true, 'Description is required'], trim: true, minlength: 10, maxlength: 1000 },
    category: { type: String, enum: CATEGORIES, required: [true, 'Category is required'] },
    priority: { type: String, enum: PRIORITIES, default: 'Medium' },
    status: { type: String, enum: STATUSES, default: 'Open', index: true },
    location: { type: String, required: [true, 'Location is required'], trim: true, maxlength: 120 },

    images: [String], // evidence photos from the person who reported it
    workImages: [String], // photos from staff when the work is done

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    timeline: [timelineSchema],

    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true, maxlength: 300, default: '' },
      at: Date,
    },
    resolvedAt: Date,
  },
  { timestamps: true }
);

complaintSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Complaint', complaintSchema);

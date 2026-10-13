const mongoose = require('mongoose');

// One document per counter, used for ticket numbers (CMP-2026-0001 and so on).
const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);

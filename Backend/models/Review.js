const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  request:    { type: mongoose.Schema.Types.ObjectId, ref: 'SkillRequest' }, // optional but recommended
  chat:       { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },         // optional
  rating:     { type: Number, min: 1, max: 5, required: true },
  comment:    { type: String, trim: true, default: '' },
  createdAt:  { type: Date, default: Date.now }
});

reviewSchema.index({ reviewee: 1 }); // fast queries by reviewee

module.exports = mongoose.model('Review', reviewSchema);

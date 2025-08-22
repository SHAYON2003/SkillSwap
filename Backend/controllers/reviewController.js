// controllers/reviewController.js
const Review = require('../models/Review');
const SkillRequest = require('../models/SkillRequest');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.createReview = async (req, res) => {
  try {
    // if your auth middleware attaches full user object
    const reviewerId = req.user?._id || req.user;
    const { revieweeId, requestId, chatId, rating, comment = '' } = req.body;

    // validation
    if (!revieweeId || !rating) {
      return res.status(400).json({ message: 'revieweeId and rating required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating must be 1..5' });
    }

    // check reviewee exists
    const reviewee = await User.findById(revieweeId);
    if (!reviewee) return res.status(404).json({ message: 'Reviewee not found' });

    if (String(reviewerId) === String(revieweeId)) {
      return res.status(400).json({ message: 'Cannot review yourself' });
    }

    // Optional: check request
    if (requestId) {
      const reqDoc = await SkillRequest.findById(requestId);
      if (!reqDoc) return res.status(404).json({ message: 'Request not found' });

      const involved = [String(reqDoc.from), String(reqDoc.to)];
      if (!involved.includes(String(reviewerId)) || !involved.includes(String(revieweeId))) {
        return res.status(403).json({ message: 'Not allowed to review this request' });
      }
      if (!['accepted', 'completed'].includes(reqDoc.status)) {
        return res.status(400).json({ message: 'Request not completed yet' });
      }

      // prevent duplicate
      const existing = await Review.findOne({ reviewer: reviewerId, request: requestId });
      if (existing) return res.status(400).json({ message: 'You already reviewed this exchange' });
    }

    const review = await Review.create({
      reviewer: reviewerId,
      reviewee: revieweeId,
      request: requestId ? new mongoose.Types.ObjectId(requestId) : undefined,
      chat: chatId ? new mongoose.Types.ObjectId(chatId) : undefined,
      rating,
      comment
    });

    await User.findByIdAndUpdate(revieweeId, {
      $inc: { ratingCount: 1, ratingSum: rating },
      $set: { updatedAt: new Date() }
    });

    const updated = await User.findById(revieweeId).select('ratingCount ratingSum');
    const avg = (updated.ratingSum || 0) / (updated.ratingCount || 1);

    res.status(201).json({ review, avgRating: avg });
  } catch (err) {
    console.error('[review.createReview]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getReviewsForUser = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?._id || req.user;
    const reviews = await Review.find({ reviewee: userId })
      .sort({ createdAt: -1 })
      .populate('reviewer', 'username email');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAverageRating = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const agg = await Review.aggregate([
      { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$reviewee', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    if (!agg.length) return res.json({ avg: 0, count: 0 });
    res.json({ avg: agg[0].avg, count: agg[0].count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

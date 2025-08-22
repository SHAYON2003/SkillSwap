const router = require('express').Router();
const auth = require('../middleware/auth');
const { createReview, getReviewsForUser, getAverageRating } = require('../controllers/reviewController');

router.post('/', auth, createReview);                 // create review
router.get('/user/:userId', auth, getReviewsForUser); // get reviews for user
router.get('/user/:userId/avg', auth, getAverageRating); // get avg & count

module.exports = router;

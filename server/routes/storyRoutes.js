const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  createStory,
  getStoryFeed,
  markViewed,
  deleteStory,
  getUploadSignature,
} = require('../controllers/storyController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const uploadSignatureLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many upload requests, please try again after 15 minutes',
  },
});

router.get('/upload-signature', protect, uploadSignatureLimiter, getUploadSignature);
router.post('/', protect, upload.single('image'), createStory);
router.get('/feed', protect, getStoryFeed);
router.post('/:id/view', protect, markViewed);
router.delete('/:id', protect, deleteStory);

module.exports = router;

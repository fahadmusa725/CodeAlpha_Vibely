const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { getUploadSignature } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

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

router.get('/signature', protect, uploadSignatureLimiter, getUploadSignature);

module.exports = router;


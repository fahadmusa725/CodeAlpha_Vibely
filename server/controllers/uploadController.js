const { cloudinary } = require('../config/cloudinary');

const PURPOSE_FOLDERS = {
  story: 'vibely/stories',
  post: 'vibely_posts',
  avatar: 'vibely_profiles',
  cover: 'vibely_profiles',
};

const PURPOSE_ALLOWED_FORMATS = {
  story: 'jpg,png,webp,gif,mp4,mov,webm',
  post: 'jpg,png,webp,gif',
  avatar: 'jpg,png,webp,gif',
  cover: 'jpg,png,webp,gif',
};

exports.getUploadSignature = async (req, res) => {
  try {
    const { purpose } = req.query;

    if (!purpose || !PURPOSE_FOLDERS[purpose]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid upload purpose. Must be one of: story, post, avatar, cover',
      });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const hasValidCloudinary =
      cloudName &&
      cloudName !== 'demo' &&
      apiKey &&
      apiKey !== '123456789012345' &&
      apiSecret;

    if (!hasValidCloudinary) {
      return res.status(200).json({
        success: true,
        directUpload: false,
      });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = PURPOSE_FOLDERS[purpose];
    const allowedFormats = PURPOSE_ALLOWED_FORMATS[purpose];

    const signature = cloudinary.utils.api_sign_request(
      {
        allowed_formats: allowedFormats,
        folder,
        timestamp,
      },
      apiSecret
    );

    return res.status(200).json({
      success: true,
      directUpload: true,
      cloudName,
      apiKey,
      timestamp,
      folder,
      allowedFormats,
      signature,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error generating upload signature',
    });
  }
};


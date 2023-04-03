const rateLimit = require('express-rate-limit');

// Define rate limit options for upload and download
const uploadLimiter = rateLimit({
  windowMs: process.env.UPLOAD_INTERVAL, // 24 hours
  max: process.env.UPLOAD_LIMIT ?? 10, // 10 upload requests per day
  message: (_, res) => {
    res.status(400).json({
      success: false,
      message: 'Upload limit exceeded. Please try again later.'
    })
  }
});

const downloadLimiter = rateLimit({
  windowMs: process.env.DOWNLOAD_INTERVAL, // 24 hours
  max: process.env.DOWNLOAD_LIMIT ?? 20, // 20 download requests per day
  message: (_, res) => {
    res.status(400).json({
      success: false,
      message: 'Download limit exceeded. Please try again later.'
    })
  }
});

module.exports = { uploadLimiter, downloadLimiter }
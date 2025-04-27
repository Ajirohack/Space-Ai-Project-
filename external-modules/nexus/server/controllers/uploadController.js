const path = require('path');
const logger = require('../utils/logger');

/**
 * Handle file uploads
 */
exports.handleFileUpload = (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = req.body.userId || 'anonymous';
    logger.info(`File uploaded by user ${userId}: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Generate file URL (in production this would be a proper URL)
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Return file information
    res.json({
      success: true,
      file: {
        originalName: req.file.originalname,
        name: req.file.filename,
        url: fileUrl,
        size: req.file.size,
        type: req.file.mimetype
      }
    });
    
  } catch (error) {
    logger.error('Error handling file upload:', error);
    res.status(500).json({ error: 'Failed to process file upload' });
  }
};

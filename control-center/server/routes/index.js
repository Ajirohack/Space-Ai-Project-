/**
 * Main Routes Index
 * Consolidates all API routes for the control center
 */

const express = require('express');
const invitationRoutes = require('./invitation');
const { errorHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    service: 'control-center'
  });
});

// Register all route modules
router.use('/invitations', invitationRoutes);

// Add more route modules here as they are implemented
// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/modules', moduleRoutes);

// Apply error handling middleware
router.use(errorHandler);

module.exports = router;
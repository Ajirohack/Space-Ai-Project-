const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const moduleRoutes = require('./modules');
const misRoutes = require('./mis');
const ragRoutes = require('./modules/rag');

// Define routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/modules', moduleRoutes);
router.use('/mis', misRoutes);
router.use('/modules/rag-system', ragRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Space Control Center API',
    version: '1.0.0',
    documentation: '/docs',
    status: 'operational',
  });
});

module.exports = router;

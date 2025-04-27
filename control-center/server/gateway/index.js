/**
 * API Gateway
 * Entry point for all API requests
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const { errorHandler } = require('../middleware/errorHandler');
const { requestLogger, stream } = require('../middleware/logger');
const { trackApiMiddleware } = require('../middleware/analytics');
const { metricsMiddleware } = require('../services/metrics');

/**
 * Environment configuration
 */
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

/**
 * Initialize Express app
 */
const app = express();

/**
 * Security middleware
 */
app.use(helmet());
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));

/**
 * Performance middleware
 */
app.use(compression());

/**
 * Rate limiting
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

/**
 * Body parsing
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Logging middleware
 */
app.use(requestLogger);
app.use(morgan('combined', { stream }));

/**
 * Analytics and metrics middleware
 */
app.use(trackApiMiddleware);
app.use(metricsMiddleware());

/**
 * Health check endpoint (simple)
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

/**
 * API Routes
 */
// Use new API router (src/api/index.js)
app.use('/api', require('../../src/api'));

/**
 * 404 handler
 */
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
});

/**
 * Error handling
 */
app.use(errorHandler);

/**
 * Start server
 */
const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  });
};

module.exports = {
  app,
  startServer
};
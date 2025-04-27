/**
 * API Gateway
 * Main entry point for routing requests to Control Center
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { validateMembershipKey } = require('./middleware/auth');
const { errorHandler } = require('./middleware/error');
const logger = require('./utils/logger');

const app = express();

// Load environment variables
const {
  PORT = 3000,
  NODE_ENV = 'development',
  CONTROL_CENTER_URL = 'http://localhost:4000',
  RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS = 100,
} = process.env;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);

// Performance middleware
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(RATE_LIMIT_WINDOW_MS),
  max: parseInt(RATE_LIMIT_MAX_REQUESTS),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later',
  },
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// API routes
const apiProxy = createProxyMiddleware({
  target: CONTROL_CENTER_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '',
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add custom headers if needed
    if (req.membershipKey) {
      proxyReq.setHeader('X-Membership-Key', req.membershipKey);
    }
  },
  onError: (err, req, res) => {
    logger.error('Proxy Error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Unable to complete the request',
    });
  },
});

// Protected routes require membership key
app.use('/api/protected/*', validateMembershipKey);

// Route all API requests to Control Center
app.use('/api', apiProxy);

// Error handling
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`API Gateway running in ${NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Closing server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server };

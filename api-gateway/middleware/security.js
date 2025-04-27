/**
 * Security middleware for the API Gateway
 * Implements rate limiting, input validation, and other security measures
 */
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Rate limiters for different endpoints
const createRateLimiter = (windowMs, max, prefix) =>
  rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: `rate-limit:${prefix}:`,
    }),
    windowMs,
    max,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

// General API rate limiter
const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per windowMs
  'api'
);

// More strict limiter for auth endpoints
const authLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  5, // 5 attempts per hour
  'auth'
);

// Extra strict limiter for membership validation
const membershipLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 attempts per hour
  'membership'
);

// Enhanced security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.MIS_API_URL],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

// Request sanitization middleware
const sanitizeRequests = [
  // Clean XSS
  xss(),
  // Prevent HTTP Parameter Pollution
  hpp(),
  // Custom request sanitizer
  (req, res, next) => {
    // Sanitize request body
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      });
    }
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = req.query[key].trim();
        }
      });
    }
    next();
  },
];

// Response security headers middleware
const secureResponseHeaders = (req, res, next) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  next();
};

module.exports = {
  apiLimiter,
  authLimiter,
  membershipLimiter,
  securityHeaders,
  sanitizeRequests,
  secureResponseHeaders,
};

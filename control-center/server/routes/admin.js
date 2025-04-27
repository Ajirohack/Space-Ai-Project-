/**
 * Admin routes
 * Handles administrative functions
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');
const { 
  validateInvitation,
  validatePagination,
  formatValidationErrors
} = require('../utils/validators');
const {
  generateToken,
  hashString,
  generatePIN,
  getPagination
} = require('../utils/helpers');
const { Membership, Invitation, AuditLog, ModelMetrics } = require('../models');

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination
 * @access  Private/Admin
 */
router.get('/users', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    // Validate pagination parameters
    const { value } = validatePagination(req.query);
    const { page, limit, sort } = value;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await Membership.countDocuments();
    
    // Get users
    const users = await Membership.find()
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-passwordHash -passwordSalt -resetToken -resetTokenExpiry');
    
    // Generate pagination info
    const pagination = getPagination(total, page, limit);
    
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin
 */
router.get('/users/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await Membership.findById(id)
      .select('-passwordHash -passwordSalt -resetToken -resetTokenExpiry');
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/admin/invite
 * @desc    Create a new invitation
 * @access  Private/Admin
 */
router.post('/invite', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = validateInvitation(req.body);
    
    if (error) {
      const errors = formatValidationErrors(error);
      throw new ApiError('Validation failed', 400, errors);
    }
    
    const { email, permissions, expiresIn } = value;
    
    // Check if email already has an active invitation
    const existingInvitation = await Invitation.findOne({
      email,
      used: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (existingInvitation) {
      throw new ApiError('An active invitation already exists for this email', 409);
    }
    
    // Check if user already exists
    const existingUser = await Membership.findOne({ email });
    
    if (existingUser) {
      throw new ApiError('User already exists', 409);
    }
    
    // Generate invitation code
    const invitationCode = generateToken(16);
    
    // Generate PIN
    const pin = generatePIN(6);
    const hashedPin = hashString(pin);
    
    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);
    
    // Create invitation
    const invitation = await Invitation.create({
      email,
      invitationCode,
      hashedPin,
      permissions: permissions || ['user'],
      createdBy: req.user._id,
      expiresAt
    });
    
    // Send invitation email with code and PIN
    const emailService = require('../services/email');
    await emailService.sendInvitationEmail(email, invitationCode, pin);
    
    // Log action
    await AuditLog.create({
      userId: req.user._id,
      action: 'create_invitation',
      resourceType: 'Invitation',
      resourceId: invitation._id,
      details: { email, permissions },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json({
      success: true,
      message: 'Invitation created successfully',
      data: {
        invitation: {
          id: invitation._id,
          email: invitation.email,
          invitationCode: invitation.invitationCode,
          pin, // Only returned once for email sending
          permissions: invitation.permissions,
          expiresAt: invitation.expiresAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/invitations
 * @desc    Get all invitations with pagination
 * @access  Private/Admin
 */
router.get('/invitations', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    // Validate pagination parameters
    const { value } = validatePagination(req.query);
    const { page, limit, sort } = value;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await Invitation.countDocuments();
    
    // Get invitations
    const invitations = await Invitation.find()
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-hashedPin')
      .populate('createdBy', 'email name');
    
    // Generate pagination info
    const pagination = getPagination(total, page, limit);
    
    res.status(200).json({
      success: true,
      data: {
        invitations,
        pagination
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/metrics
 * @desc    Get system metrics
 * @access  Private/Admin
 */
router.get('/metrics', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    // Get user counts
    const totalUsers = await Membership.countDocuments();
    const activeUsers = await Membership.countDocuments({ active: true });
    
    // Get recent registrations
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await Membership.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Get invitation metrics
    const pendingInvitations = await Invitation.countDocuments({
      used: false,
      expiresAt: { $gt: new Date() }
    });
    
    // Get model performance metrics
    const modelMetrics = await ModelMetrics.aggregate([
      {
        $group: {
          _id: '$modelId',
          avgResponseTime: { $avg: '$responseTime' },
          totalRequests: { $sum: 1 },
          errorRate: {
            $avg: { $cond: [{ $gt: ['$errorCount', 0] }, 1, 0] }
          }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newLast30Days: newUsers
        },
        invitations: {
          pending: pendingInvitations
        },
        models: modelMetrics.map(metric => ({
          modelId: metric._id,
          avgResponseTime: metric.avgResponseTime,
          totalRequests: metric.totalRequests,
          errorRate: metric.errorRate
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs with pagination
 * @access  Private/Admin
 */
router.get('/audit-logs', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    // Validate pagination parameters
    const { value } = validatePagination(req.query);
    const { page, limit, sort } = value;    
    // Build filter
    const filter = {};
    
    // Filter by user ID if provided
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    
    // Filter by action if provided
    if (req.query.action) {
      filter.action = req.query.action;
    }
    
    // Filter by resource type if provided
    if (req.query.resourceType) {
      filter.resourceType = req.query.resourceType;
    }    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await AuditLog.countDocuments(filter);
    
    // Get audit logs
    const auditLogs = await AuditLog.find(filter)
      .sort(sort || '-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('userId', 'email name');
    
    // Generate pagination info
    const pagination = getPagination(total, page, limit);
    
    res.status(200).json({
      success: true,
      data: {
        logs: auditLogs,tLogs,
        pagination
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/system-info
 * @desc    Get system information
 * @access  Private/Admin
 */
router.get('/system-info', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const os = require('os');
    const packageInfo = require('../../../package.json');
    const mongoose = require('mongoose');
    const contentRouter = require('../../services/content-router');
    
    // Get system information
    const systemInfo = {
      version: packageInfo.version,
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
      serverTime: new Date().toISOString(),
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          usage: process.memoryUsage(),
          heapUsed: process.memoryUsage().heapUsed,
          heapTotal: process.memoryUsage().heapTotal,
          rss: process.memoryUsage().rss
        },
        cpus: os.cpus().length,
        loadAvg: os.loadavg()
      },
      os: {
        type: os.type(),
        release: os.release(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        userInfo: os.userInfo().username,
        cpuInfo: os.cpus().slice(0, 1).map(cpu => ({
          model: cpu.model,
          speed: cpu.speed
        }))[0],
        networkInterfaces: Object.keys(os.networkInterfaces()).length
      }
    };
    
    // Get database connection status
    const dbConnection = {
      state: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      models: Object.keys(mongoose.models),
      modelCount: Object.keys(mongoose.models).length,
      connectionState: [
        'disconnected',
        'connected',
        'connecting',
        'disconnecting'
      ][mongoose.connection.readyState] || 'unknown'
    };
    
    // Get database stats
    const dbStats = {
      users: await Membership.countDocuments(),
      invitations: await Invitation.countDocuments(),
      auditLogs: await AuditLog.countDocuments()
    };
    
    // Try to get Module model stats if it exists
    try {
      if (mongoose.models.Module) {
        dbStats.modules = await mongoose.models.Module.countDocuments();
      }
    } catch (err) {
      console.error('Error getting module stats:', err.message);
      dbStats.modules = 'Not available';
    }
    
    // Get API stats if available
    let apiStats = {};
    try {
      if (global.apiRequestStats) {
        apiStats = {
          totalRequests: global.apiRequestStats.totalRequests || 0,
          successfulRequests: global.apiRequestStats.successfulRequests || 0,
          failedRequests: global.apiRequestStats.failedRequests || 0,
          averageResponseTime: global.apiRequestStats.averageResponseTime || 0,
          requestsPerMinute: global.apiRequestStats.requestsPerMinute || 0,
          lastUpdated: global.apiRequestStats.lastUpdated || new Date().toISOString()
        };
      }
    } catch (statsError) {
      console.error('Error retrieving API stats:', statsError);
    }
    
    // Get content types information
    let contentTypes = [];
    try {
      contentTypes = contentRouter.getContentTypes();
    } catch (contentError) {
      console.error('Error retrieving content types:', contentError);
    }
    
    // Get cache stats if available
    let cacheStats = {};
    try {
      if (global.cacheStats) {
        cacheStats = {
          hits: global.cacheStats.hits || 0,
          misses: global.cacheStats.misses || 0,
          keys: global.cacheStats.keys || 0,
          size: global.cacheStats.size || 0,
          ttl: global.cacheStats.ttl || 0
        };
      }
    } catch (cacheError) {
      console.error('Error retrieving cache stats:', cacheError);
    }
    
    // Get active connections if available
    let connections = {};
    try {
      if (req.app.locals.connections) {
        connections = {
          active: Object.keys(req.app.locals.connections).length,
          websockets: req.app.locals.websocketConnections || 0,
          http: req.app.locals.httpConnections || 0
        };
      }
    } catch (connectionsError) {
      console.error('Error retrieving connection stats:', connectionsError);
    }
    
    res.status(200).json({
      success: true,
      data: {
        system: systemInfo,
        database: dbConnection,
        stats: dbStats,
        api: apiStats,
        content: {
          types: contentTypes
        },
        cache: cacheStats,
        connections: connections
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/system-metrics
 * @desc    Get real-time system metrics
 * @access  Private/Admin
 */
router.get('/system-metrics', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const os = require('os');
    
    // Get current CPU usage
    const cpuUsage = process.cpuUsage();
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    // Get load average
    const loadAvg = os.loadavg();
    
    // Get uptime
    const uptime = process.uptime();
    
    // Get active handles and requests
    const activeHandles = process._getActiveHandles().length;
    const activeRequests = process._getActiveRequests().length;
    
    // Calculate memory usage percentages
    const memoryPercentage = (usedMemory / totalMemory) * 100;
    const heapPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    res.status(200).json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        cpu: {
          usage: cpuUsage,
          loadAvg: loadAvg,
          cores: os.cpus().length
        },
        memory: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
          percentage: memoryPercentage.toFixed(2),
          heap: {
            total: memoryUsage.heapTotal,
            used: memoryUsage.heapUsed,
            percentage: heapPercentage.toFixed(2)
          },
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        process: {
          uptime: uptime,
          activeHandles: activeHandles,
          activeRequests: activeRequests,
          pid: process.pid
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

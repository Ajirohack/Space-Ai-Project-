/**
 * Authentication middleware for the API Gateway
 * Handles membership key verification and other auth-related tasks
 */

const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Redis = require('ioredis');

// Redis client for caching membership keys
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Verifies the membership key by checking against MIS backend
 * Uses Redis cache to reduce load on MIS service
 */
const verifyMembershipKey = async (req, res, next) => {
  const membershipKey = req.headers['x-membership-key'];

  if (!membershipKey) {
    return res.status(401).json({
      success: false,
      message: 'Membership key is required',
    });
  }

  try {
    // Check Redis cache first
    const cachedStatus = await redis.get(`membership:${membershipKey}`);
    if (cachedStatus) {
      if (cachedStatus === 'valid') {
        return next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired membership key',
        });
      }
    }

    // If not in cache, verify with MIS backend
    const response = await fetch(`${process.env.MIS_API_URL}/memberships/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MIS_API_KEY}`,
      },
      body: JSON.stringify({ membershipKey }),
    });

    if (!response.ok) {
      // Cache invalid result for 5 minutes
      await redis.set(`membership:${membershipKey}`, 'invalid', 'EX', 300);
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired membership key',
      });
    }

    const data = await response.json();
    if (data.success) {
      // Cache valid result for 15 minutes
      await redis.set(`membership:${membershipKey}`, 'valid', 'EX', 900);
      next();
    } else {
      // Cache invalid result for 5 minutes
      await redis.set(`membership:${membershipKey}`, 'invalid', 'EX', 300);
      return res.status(403).json({
        success: false,
        message: data.message || 'Invalid or expired membership key',
      });
    }
  } catch (err) {
    console.error('Membership verification error:', err);
    // Don't cache on error to avoid service degradation
    return res.status(500).json({
      success: false,
      message: 'Unable to verify membership key',
    });
  }
};

/**
 * Validates invitation codes against MIS backend
 */
const validateInvitation = async (req, res, next) => {
  const invitationCode = req.body.invitationCode;

  try {
    const response = await fetch(`${process.env.MIS_API_URL}/invitations/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MIS_API_KEY}`,
      },
      body: JSON.stringify({ invitationCode }),
    });

    if (!response.ok) {
      return res.status(403).json({
        success: false,
        message: 'Invalid invitation code',
      });
    }

    const data = await response.json();
    if (data.success) {
      req.invitation = data.invitation;
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: data.message || 'Invalid invitation code',
      });
    }
  } catch (err) {
    console.error('Invitation validation error:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to validate invitation code',
    });
  }
};

module.exports = {
  verifyMembershipKey,
  validateInvitation,
};

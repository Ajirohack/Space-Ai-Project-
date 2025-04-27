/**
 * MIS Controller
 * Handles Membership Initiation System functionality
 */
const axios = require('axios');
const config = require('../config/env');
const { Invitation, MembershipKey } = require('../models');
const User = require('../models/user');
const crypto = require('crypto');
const logger = require('../utils/logger');
const csv = require('csv-stringify');

// Configure MIS API client
const misApiClient = axios.create({
  baseURL: config.MIS_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add operator token if available
misApiClient.interceptors.request.use(config => {
  const operatorToken = process.env.MIS_OPERATOR_TOKEN;
  if (operatorToken) {
    config.headers['Authorization'] = `Bearer ${operatorToken}`;
  }
  return config;
});

/**
 * Create invitation in MIS
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function createInvitation(req, res) {
  try {
    const { email, fullName, permissions } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Email and full name are required',
      });
    }

    // Generate invitation in Control Center first
    const invitationCode = crypto.randomBytes(8).toString('hex');
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPin = crypto.createHash('sha256').update(pin).digest('hex');

    // Calculate expiry date (default 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create local invitation record
    const invitation = await Invitation.create({
      email,
      invitationCode,
      hashedPin,
      permissions: permissions || ['user'],
      createdBy: req.user ? req.user._id : null,
      expiresAt,
      metadata: { fullName },
    });

    // Now try to create invitation in MIS
    try {
      if (config.MIS_INTEGRATION) {
        await misApiClient.post(
          '/admin/create-invitation',
          {
            email,
            invited_name: fullName,
            code: invitationCode,
            pin,
          },
          {
            auth: {
              username: config.MIS_ADMIN_USERNAME || 'admin',
              password: config.MIS_ADMIN_PASSWORD || '',
            },
          }
        );

        logger.info(`Invitation for ${email} created in MIS successfully`);
      }
    } catch (misError) {
      logger.error('Failed to create invitation in MIS:', misError.message);
      // Don't fail the request if MIS is unavailable, just log it
    }

    res.status(201).json({
      success: true,
      message: 'Invitation created successfully',
      data: {
        invitationCode,
        pin,
        email,
        expiresAt,
      },
    });
  } catch (error) {
    logger.error('Error creating invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invitation',
      error: error.message,
    });
  }
}

/**
 * Create bulk invitations
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function createBulkInvitations(req, res) {
  try {
    const { invitations } = req.body;

    if (!Array.isArray(invitations) || invitations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid invitations array is required',
      });
    }

    const results = {
      successful: [],
      failed: [],
    };

    // Process each invitation
    for (const invite of invitations) {
      try {
        const { email, fullName, permissions } = invite;

        if (!email || !fullName) {
          results.failed.push({
            email: email || 'Missing email',
            fullName: fullName || 'Missing name',
            error: 'Email and full name are required',
          });
          continue;
        }

        // Generate invitation details
        const invitationCode = crypto.randomBytes(8).toString('hex');
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPin = crypto.createHash('sha256').update(pin).digest('hex');

        // Calculate expiry date (default 7 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create local invitation record
        await Invitation.create({
          email,
          invitationCode,
          hashedPin,
          permissions: permissions || ['user'],
          createdBy: req.user ? req.user._id : null,
          expiresAt,
          metadata: { fullName },
        });

        // Try to create invitation in MIS
        if (config.MIS_INTEGRATION) {
          try {
            await misApiClient.post(
              '/admin/create-invitation',
              {
                email,
                invited_name: fullName,
                code: invitationCode,
                pin,
              },
              {
                auth: {
                  username: config.MIS_ADMIN_USERNAME || 'admin',
                  password: config.MIS_ADMIN_PASSWORD || '',
                },
              }
            );
          } catch (misError) {
            logger.warn(`MIS integration failed for ${email}: ${misError.message}`);
            // Continue anyway
          }
        }

        results.successful.push({
          email,
          fullName,
          invitationCode,
          pin,
        });
      } catch (inviteError) {
        results.failed.push({
          email: invite.email || 'Unknown',
          fullName: invite.fullName || 'Unknown',
          error: inviteError.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${results.successful.length} invitations, ${results.failed.length} failed`,
      data: results,
    });
  } catch (error) {
    logger.error('Error creating bulk invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bulk invitations',
      error: error.message,
    });
  }
}

/**
 * Get all invitations with optional filtering
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getInvitations(req, res) {
  try {
    const { status, email, page = 1, limit = 20 } = req.query;
    const query = {};

    // Apply filters if provided
    if (status) query.status = status;
    if (email) query.email = new RegExp(email, 'i');

    // Parse pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get invitations with pagination
    const invitations = await Invitation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'name email')
      .populate('statusUpdatedBy', 'name email');

    // Get total count for pagination
    const totalCount = await Invitation.countDocuments(query);

    res.json({
      success: true,
      data: invitations,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error getting invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invitations',
      error: error.message,
    });
  }
}

/**
 * Validate invitation code
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function validateInvitation(req, res) {
  try {
    const { invitationCode, pin, email } = req.body;

    if (!invitationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invitation code is required',
      });
    }

    // Find invitation in local database
    const query = { invitationCode };
    if (email) query.email = email;

    const invitation = await Invitation.findOne(query);

    // If not found locally, check MIS
    if (!invitation) {
      try {
        // Try to validate with MIS
        const misResponse = await misApiClient.post('/validate-invitation', {
          code: invitationCode,
          pin: pin,
        });

        // If MIS reports valid, create a local copy
        if (misResponse.data && misResponse.data.valid) {
          return res.json({
            success: true,
            valid: true,
            message: 'Invitation code is valid',
            source: 'mis',
          });
        }
      } catch (misError) {
        // MIS validation failed or service unavailable
        logger.error('MIS validation failed:', misError.message);
      }

      // If we get here, neither local nor MIS validation succeeded
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid invitation code',
      });
    }

    // Check if invitation is used
    if (invitation.used) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Invitation code has already been used',
      });
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Invitation code has expired',
      });
    }

    // If PIN is provided, validate it
    if (pin) {
      const hashedPin = crypto.createHash('sha256').update(pin).digest('hex');
      if (hashedPin !== invitation.hashedPin) {
        return res.status(400).json({
          success: false,
          valid: false,
          message: 'Invalid PIN',
        });
      }
    }

    res.json({
      success: true,
      valid: true,
      message: 'Invitation code is valid',
      source: 'local',
    });
  } catch (error) {
    logger.error('Error validating invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate invitation',
      error: error.message,
    });
  }
}

/**
 * Resend invitation email
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function resendInvitation(req, res) {
  try {
    const { invitationCode } = req.params;

    // Find invitation
    const invitation = await Invitation.findOne({ invitationCode });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found',
      });
    }

    // Check if used or expired
    if (invitation.used) {
      return res.status(400).json({
        success: false,
        message: 'Cannot resend used invitation',
      });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot resend expired invitation',
      });
    }

    // Generate a new PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPin = crypto.createHash('sha256').update(pin).digest('hex');

    // Update invitation with new PIN
    invitation.hashedPin = hashedPin;
    await invitation.save();

    // Try to update MIS invitation
    let misSynced = false;
    if (config.MIS_INTEGRATION) {
      try {
        await misApiClient.post(
          '/admin/update-invitation',
          {
            code: invitationCode,
            pin: pin,
          },
          {
            auth: {
              username: config.MIS_ADMIN_USERNAME || 'admin',
              password: config.MIS_ADMIN_PASSWORD || '',
            },
          }
        );
        misSynced = true;
      } catch (misError) {
        logger.error('Failed to update invitation in MIS:', misError.message);
        // Continue anyway
      }
    }

    // TODO: Send actual email with invitation details

    res.json({
      success: true,
      message: 'Invitation resent successfully',
      data: {
        email: invitation.email,
        invitationCode,
        pin,
        misSynced,
      },
    });
  } catch (error) {
    logger.error('Error resending invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend invitation',
      error: error.message,
    });
  }
}

/**
 * Submit onboarding information
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function submitOnboarding(req, res) {
  try {
    const { invitationCode, voiceConsent, responses } = req.body;

    if (!invitationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invitation code is required',
      });
    }

    if (typeof voiceConsent !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Voice consent must be a boolean',
      });
    }

    if (!responses) {
      return res.status(400).json({
        success: false,
        message: 'Responses are required',
      });
    }

    // Find invitation in local database
    const invitation = await Invitation.findOne({ invitationCode });

    // If found locally, update its status
    if (invitation) {
      invitation.status = 'onboarded';
      invitation.onboardingData = {
        voiceConsent,
        responses,
        submittedAt: new Date(),
      };
      await invitation.save();
    }

    // Try to submit onboarding to MIS regardless of local status
    if (config.MIS_INTEGRATION) {
      try {
        await misApiClient.post('/submit-onboarding', {
          code: invitationCode,
          voice_consent: voiceConsent,
          responses: responses,
        });
      } catch (misError) {
        logger.error('Failed to submit onboarding to MIS:', misError.message);
        // Don't fail the request if MIS is unavailable, just log it
      }
    }

    res.json({
      success: true,
      message: 'Onboarding submitted successfully',
    });
  } catch (error) {
    logger.error('Error submitting onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit onboarding',
      error: error.message,
    });
  }
}

/**
 * Get onboarding submissions with optional filtering
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getOnboardingSubmissions(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Parse pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Find invitations with onboarding data
    const submissions = await Invitation.find({
      status: 'onboarded',
      'onboardingData.submittedAt': { $exists: true },
    })
      .sort({ 'onboardingData.submittedAt': -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'name email');

    // Get total count for pagination
    const totalCount = await Invitation.countDocuments({
      status: 'onboarded',
      'onboardingData.submittedAt': { $exists: true },
    });

    res.json({
      success: true,
      data: submissions,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error getting onboarding submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding submissions',
      error: error.message,
    });
  }
}

/**
 * Get onboarding details for specific invitation
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getOnboardingDetail(req, res) {
  try {
    const { invitationCode } = req.params;

    const invitation = await Invitation.findOne({
      invitationCode,
      status: 'onboarded',
      'onboardingData.submittedAt': { $exists: true },
    }).populate('createdBy', 'name email');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding submission not found',
      });
    }

    res.json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    logger.error('Error getting onboarding detail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding detail',
      error: error.message,
    });
  }
}

/**
 * Validate membership key
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function validateMembershipKey(req, res) {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Membership key is required',
      });
    }

    // Find membership key in local database
    const membershipKey = await MembershipKey.findOne({ key, active: true });

    // If not found locally, check MIS
    if (!membershipKey && config.MIS_INTEGRATION) {
      try {
        // Try to validate with MIS
        const misResponse = await misApiClient.post('/validate-key', {
          key: key,
        });

        // If MIS reports valid, return success
        if (misResponse.data && misResponse.data.valid) {
          return res.json({
            success: true,
            valid: true,
            message: 'Membership key is valid',
            user_name: misResponse.data.user_name,
            source: 'mis',
          });
        }
      } catch (misError) {
        // MIS validation failed or service unavailable
        logger.error('MIS validation failed:', misError.message);
      }

      // If we get here, neither local nor MIS validation succeeded
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid membership key',
      });
    }

    // If not found in either system
    if (!membershipKey) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid membership key',
      });
    }

    // Check if key has expired (if expiry is set)
    if (membershipKey.expiresAt && membershipKey.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Membership key has expired',
      });
    }

    // Get user data if available
    let userData = {};
    if (membershipKey.userId) {
      const user = await User.findById(membershipKey.userId);
      if (user) {
        userData = {
          user_name: user.name || user.email,
          email: user.email,
        };
      }
    }

    res.json({
      success: true,
      valid: true,
      message: 'Membership key is valid',
      ...userData,
      source: 'local',
    });
  } catch (error) {
    logger.error('Error validating membership key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate membership key',
      error: error.message,
    });
  }
}

/**
 * Approve or reject membership application
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function approveMembership(req, res) {
  try {
    const { invitationCode, approved, notes } = req.body;

    if (!invitationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invitation code is required',
      });
    }

    if (typeof approved !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Approval status must be a boolean',
      });
    }

    // Find invitation in local database
    const invitation = await Invitation.findOne({ invitationCode });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found',
      });
    }

    if (invitation.status !== 'onboarded') {
      return res.status(400).json({
        success: false,
        message: 'Invitation has not been onboarded',
      });
    }

    // Update invitation status
    invitation.status = approved ? 'approved' : 'rejected';
    invitation.statusUpdatedAt = new Date();
    invitation.statusUpdatedBy = req.user ? req.user._id : null;

    if (notes) {
      invitation.metadata = {
        ...invitation.metadata,
        approvalNotes: notes,
      };
    }

    await invitation.save();

    // If approved, create a membership key
    let membershipKey = null;
    let membershipCode = null;

    if (approved) {
      membershipCode = `MEMBER-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const key = `${membershipCode}-${Math.floor(Date.now() / 1000)}`;

      membershipKey = await MembershipKey.create({
        key,
        createdBy: req.user ? req.user._id : null,
        createdAt: new Date(),
        invitation: invitation._id,
        active: true,
        permissions: invitation.permissions || ['user'],
      });
    }

    // Try to notify MIS about the approval/rejection
    let misSynced = false;
    if (config.MIS_INTEGRATION) {
      try {
        await misApiClient.post(
          '/admin/approve-membership',
          {
            invitation_code: invitationCode,
            approved: approved,
            membership_key: membershipKey ? membershipKey.key : null,
            membership_code: membershipCode,
          },
          {
            auth: {
              username: config.MIS_ADMIN_USERNAME || 'admin',
              password: config.MIS_ADMIN_PASSWORD || '',
            },
          }
        );
        misSynced = true;
      } catch (misError) {
        logger.error('Failed to notify MIS about membership approval:', misError.message);
        // Don't fail the request if MIS is unavailable, just log it
      }
    }

    res.json({
      success: true,
      message: approved ? 'Membership approved successfully' : 'Membership rejected',
      data: {
        invitationCode,
        status: invitation.status,
        membershipKey: membershipKey ? membershipKey.key : null,
        membershipCode,
        misSynced,
      },
    });
  } catch (error) {
    logger.error('Error processing membership approval:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process membership approval',
      error: error.message,
    });
  }
}

/**
 * Get all memberships with optional filtering
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getMemberships(req, res) {
  try {
    const { active, page = 1, limit = 20 } = req.query;
    const query = {};

    // Apply filters if provided
    if (active !== undefined) {
      query.active = active === 'true';
    }

    // Parse pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get memberships with pagination
    const memberships = await MembershipKey.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'name email')
      .populate('invitation');

    // Get total count for pagination
    const totalCount = await MembershipKey.countDocuments(query);

    res.json({
      success: true,
      data: memberships,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error getting memberships:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get memberships',
      error: error.message,
    });
  }
}

/**
 * Get membership details
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getMembershipDetail(req, res) {
  try {
    const { membershipKey } = req.params;

    const membership = await MembershipKey.findOne({ key: membershipKey })
      .populate('createdBy', 'name email')
      .populate('invitation');

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found',
      });
    }

    res.json({
      success: true,
      data: membership,
    });
  } catch (error) {
    logger.error('Error getting membership detail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get membership detail',
      error: error.message,
    });
  }
}

/**
 * Revoke membership
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function revokeMembership(req, res) {
  try {
    const { membershipKey, reason } = req.body;

    if (!membershipKey) {
      return res.status(400).json({
        success: false,
        message: 'Membership key is required',
      });
    }

    // Find membership
    const membership = await MembershipKey.findOne({ key: membershipKey });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found',
      });
    }

    // Update membership status
    membership.active = false;
    membership.revokedAt = new Date();
    membership.revokedBy = req.user ? req.user._id : null;
    membership.metadata = {
      ...membership.metadata,
      revocationReason: reason,
      previouslyActive: membership.active,
    };

    await membership.save();

    // Try to sync with MIS
    let misSynced = false;
    if (config.MIS_INTEGRATION) {
      try {
        await misApiClient.post(
          '/admin/revoke-membership',
          {
            membership_key: membershipKey,
            reason,
          },
          {
            auth: {
              username: config.MIS_ADMIN_USERNAME || 'admin',
              password: config.MIS_ADMIN_PASSWORD || '',
            },
          }
        );
        misSynced = true;
      } catch (misError) {
        logger.error('Failed to sync membership revocation with MIS:', misError.message);
      }
    }

    res.json({
      success: true,
      message: 'Membership revoked successfully',
      data: {
        membershipKey,
        active: false,
        revokedAt: membership.revokedAt,
        misSynced,
      },
    });
  } catch (error) {
    logger.error('Error revoking membership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke membership',
      error: error.message,
    });
  }
}

/**
 * Update membership permissions
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function updateMembershipPermissions(req, res) {
  try {
    const { membershipKey } = req.params;
    const { permissions } = req.body;

    if (!membershipKey) {
      return res.status(400).json({
        success: false,
        message: 'Membership key is required',
      });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be an array',
      });
    }

    // Find membership
    const membership = await MembershipKey.findOne({ key: membershipKey });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found',
      });
    }

    // Update permissions
    membership.permissions = permissions;
    membership.updatedAt = new Date();
    await membership.save();

    // If user exists, update user permissions too
    if (membership.userId) {
      const user = await User.findById(membership.userId);
      if (user) {
        user.permissions = permissions;
        await user.save();
      }
    }

    res.json({
      success: true,
      message: 'Membership permissions updated successfully',
      data: {
        membershipKey,
        permissions,
      },
    });
  } catch (error) {
    logger.error('Error updating membership permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update membership permissions',
      error: error.message,
    });
  }
}

/**
 * Get membership status for an email
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getMembershipStatus(req, res) {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find invitation in local database
    const invitation = await Invitation.findOne({ email }).sort({ createdAt: -1 });

    // If not found locally, check MIS
    if (!invitation && config.MIS_INTEGRATION) {
      try {
        // Try to get status from MIS
        const misResponse = await misApiClient.get(`/admin/membership-status/${email}`, {
          auth: {
            username: config.MIS_ADMIN_USERNAME || 'admin',
            password: config.MIS_ADMIN_PASSWORD || '',
          },
        });

        // Return MIS response
        if (misResponse.data) {
          return res.json({
            success: true,
            data: misResponse.data,
            source: 'mis',
          });
        }
      } catch (misError) {
        logger.error('Failed to get membership status from MIS:', misError.message);
      }

      // If we get here, neither local nor MIS lookup succeeded
      return res.json({
        success: true,
        data: {
          status: 'not_found',
          message: 'No membership record found for this email',
        },
      });
    }

    // If not found in either system
    if (!invitation) {
      return res.json({
        success: true,
        data: {
          status: 'not_found',
          message: 'No membership record found for this email',
        },
      });
    }

    // Check if there's an associated membership key
    let membershipKey = null;
    if (invitation._id) {
      membershipKey = await MembershipKey.findOne({ invitation: invitation._id, active: true });
    }

    // Return full status
    res.json({
      success: true,
      data: {
        email: invitation.email,
        status: invitation.status,
        invitationCode: invitation.invitationCode,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
        used: invitation.used,
        usedAt: invitation.usedAt,
        membershipKey: membershipKey ? membershipKey.key : null,
        membershipActive: membershipKey ? membershipKey.active : false,
      },
      source: 'local',
    });
  } catch (error) {
    logger.error('Error getting membership status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get membership status',
      error: error.message,
    });
  }
}

/**
 * Handle MIS sync invitation request
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function syncInvitation(req, res) {
  try {
    const { code, pin, invitedName, status } = req.body;

    if (!code || !pin || !invitedName) {
      return res.status(400).json({
        success: false,
        message: 'Code, PIN, and invited name are required',
      });
    }

    // Check if invitation already exists
    let invitation = await Invitation.findOne({ invitationCode: code });

    // If not, create it
    if (!invitation) {
      const hashedPin = crypto.createHash('sha256').update(pin).digest('hex');

      // Calculate expiry date (default 7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      invitation = await Invitation.create({
        invitationCode: code,
        hashedPin,
        status: status || 'pending',
        expiresAt,
        syncedFromMis: true,
        metadata: {
          invitedName,
          originalSource: 'mis',
        },
      });

      logger.info(`Created invitation from MIS sync: ${code}`);
    } else {
      // Update existing invitation
      invitation.metadata = {
        ...invitation.metadata,
        invitedName,
        lastSyncedAt: new Date(),
        syncSource: 'mis',
      };

      if (status && invitation.status === 'pending') {
        invitation.status = status;
      }

      await invitation.save();
      logger.info(`Updated existing invitation from MIS sync: ${code}`);
    }

    res.status(201).json({
      success: true,
      message: 'Invitation synced successfully',
      data: {
        code,
        status: invitation.status,
      },
    });
  } catch (error) {
    logger.error('Error syncing invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync invitation',
      error: error.message,
    });
  }
}

/**
 * Handle MIS notification about approved membership
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function notifyMembershipApproved(req, res) {
  try {
    const { invitationCode, membershipKey, membershipCode, approved } = req.body;

    if (!invitationCode || !membershipKey || !approved) {
      return res.status(400).json({
        success: false,
        message: 'Invitation code, membership key, and approval status are required',
      });
    }

    // Find invitation in local database
    let invitation = await Invitation.findOne({ invitationCode });

    // If not found, create a placeholder
    if (!invitation) {
      invitation = await Invitation.create({
        invitationCode,
        status: 'approved',
        syncedFromMis: true,
        metadata: {
          originalSource: 'mis',
          syncedAt: new Date(),
        },
      });
    } else {
      // Update invitation status
      invitation.status = 'approved';
      invitation.statusUpdatedAt = new Date();
      await invitation.save();
    }

    // Check if membership key already exists
    let membershipKeyDoc = await MembershipKey.findOne({ key: membershipKey });

    // If not, create it
    if (!membershipKeyDoc) {
      membershipKeyDoc = await MembershipKey.create({
        key: membershipKey,
        invitation: invitation._id,
        createdAt: new Date(),
        active: true,
        metadata: {
          membershipCode,
          originalSource: 'mis',
          syncedAt: new Date(),
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Membership approval notification processed',
      data: {
        invitationCode,
        membershipKey,
        status: 'synced',
      },
    });
  } catch (error) {
    logger.error('Error processing membership approval notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process membership approval notification',
      error: error.message,
    });
  }
}

/**
 * Export memberships as CSV
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function exportMemberships(req, res) {
  try {
    const { active } = req.query;
    const query = {};

    // Apply filters if provided
    if (active !== undefined) {
      query.active = active === 'true';
    }

    // Get all memberships matching the query
    const memberships = await MembershipKey.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('invitation');

    // Format data for CSV export
    const data = memberships.map(m => {
      const invitation = m.invitation || {};

      return {
        membershipKey: m.key,
        membershipCode: m.metadata?.membershipCode || '',
        status: m.active ? 'Active' : 'Inactive',
        email: invitation.email || '',
        fullName: invitation.metadata?.fullName || '',
        createdAt: m.createdAt ? m.createdAt.toISOString() : '',
        createdBy: m.createdBy ? m.createdBy.name || m.createdBy.email : '',
        permissions: m.permissions ? m.permissions.join(', ') : '',
        revokedAt: m.revokedAt ? m.revokedAt.toISOString() : '',
      };
    });

    // Generate CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="memberships.csv"');

    // Create CSV stringifier
    const stringifier = csv.stringify({
      header: true,
      columns: [
        { key: 'membershipKey', header: 'Membership Key' },
        { key: 'membershipCode', header: 'Membership Code' },
        { key: 'status', header: 'Status' },
        { key: 'email', header: 'Email' },
        { key: 'fullName', header: 'Full Name' },
        { key: 'createdAt', header: 'Created At' },
        { key: 'createdBy', header: 'Created By' },
        { key: 'permissions', header: 'Permissions' },
        { key: 'revokedAt', header: 'Revoked At' },
      ],
    });

    // Pipe through to response
    stringifier.pipe(res);
    data.forEach(row => stringifier.write(row));
    stringifier.end();
  } catch (error) {
    logger.error('Error exporting memberships:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export memberships',
      error: error.message,
    });
  }
}

/**
 * Get MIS system statistics
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getStats(req, res) {
  try {
    // Gather stats from local database
    const [totalInvitations, pendingInvitations, onboardingCompleted, approvedMemberships] =
      await Promise.all([
        Invitation.countDocuments(),
        Invitation.countDocuments({ status: 'pending' }),
        Invitation.countDocuments({ status: 'onboarded' }),
        MembershipKey.countDocuments({ active: true }),
      ]);

    // Check MIS system connectivity
    let syncStatus = 'unknown';
    if (config.MIS_INTEGRATION) {
      try {
        await misApiClient.get('/health');
        syncStatus = 'healthy';
      } catch (error) {
        syncStatus = 'degraded';
        logger.warn('MIS system health check failed:', error.message);
      }
    } else {
      syncStatus = 'disabled';
    }

    res.json({
      success: true,
      data: {
        totalInvitations,
        pendingInvitations,
        onboardingCompleted,
        approvedMemberships,
        syncStatus,
      },
    });
  } catch (error) {
    logger.error('Error getting MIS stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get MIS stats',
      error: error.message,
    });
  }
}

/**
 * Trigger full sync between Control Center and MIS
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function triggerSync(req, res) {
  try {
    if (!config.MIS_INTEGRATION) {
      return res.status(400).json({
        success: false,
        message: 'MIS integration is disabled in configuration',
      });
    }

    const results = {
      invitations: { synced: 0, failed: 0 },
      memberships: { synced: 0, failed: 0 },
    };

    // 1. Sync local invitations to MIS
    const localInvitations = await Invitation.find({
      syncedFromMis: { $ne: true },
    }).limit(100); // Limit to prevent timeouts

    for (const invitation of localInvitations) {
      try {
        // We don't have the original pin, so we need to generate a new one
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPin = crypto.createHash('sha256').update(pin).digest('hex');

        // Update local invitation with new pin
        invitation.hashedPin = hashedPin;
        await invitation.save();

        // Sync to MIS
        await misApiClient.post(
          '/admin/create-invitation',
          {
            email: invitation.email || 'unknown@example.com',
            invited_name: invitation.metadata?.fullName || 'Unknown User',
            code: invitation.invitationCode,
            pin,
          },
          {
            auth: {
              username: config.MIS_ADMIN_USERNAME || 'admin',
              password: config.MIS_ADMIN_PASSWORD || '',
            },
          }
        );

        results.invitations.synced++;
      } catch (error) {
        logger.error(`Failed to sync invitation ${invitation.invitationCode}:`, error.message);
        results.invitations.failed++;
      }
    }

    // 2. Sync local memberships to MIS
    const localMemberships = await MembershipKey.find({
      'metadata.syncedToMis': { $ne: true },
    })
      .populate('invitation')
      .limit(100);

    for (const membership of localMemberships) {
      try {
        if (membership.invitation && membership.active) {
          // Sync to MIS
          await misApiClient.post(
            '/admin/approve-membership',
            {
              invitation_code: membership.invitation.invitationCode,
              approved: true,
              membership_key: membership.key,
              membership_code: membership.metadata?.membershipCode || 'UNKNOWN',
            },
            {
              auth: {
                username: config.MIS_ADMIN_USERNAME || 'admin',
                password: config.MIS_ADMIN_PASSWORD || '',
              },
            }
          );

          // Update local membership to mark as synced
          membership.metadata = {
            ...membership.metadata,
            syncedToMis: true,
            syncedAt: new Date(),
          };
          await membership.save();

          results.memberships.synced++;
        }
      } catch (error) {
        logger.error(`Failed to sync membership ${membership.key}:`, error.message);
        results.memberships.failed++;
      }
    }

    // 3. Pull invitations from MIS
    try {
      const misInvitations = await misApiClient.get('/admin/invitations', {
        auth: {
          username: config.MIS_ADMIN_USERNAME || 'admin',
          password: config.MIS_ADMIN_PASSWORD || '',
        },
        params: {
          limit: 100,
          syncedToControlCenter: false,
        },
      });

      if (misInvitations.data && misInvitations.data.data) {
        for (const misInv of misInvitations.data.data) {
          try {
            // Check if invitation already exists locally
            const existingInvitation = await Invitation.findOne({
              invitationCode: misInv.code,
            });

            if (!existingInvitation) {
              // Create new invitation locally
              await Invitation.create({
                invitationCode: misInv.code,
                email: misInv.email || 'unknown@example.com',
                hashedPin: crypto
                  .createHash('sha256')
                  .update(misInv.pin || '0000')
                  .digest('hex'),
                status: misInv.status || 'pending',
                expiresAt: misInv.expires_at
                  ? new Date(misInv.expires_at)
                  : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                syncedFromMis: true,
                metadata: {
                  invitedName: misInv.invited_name,
                  originalSource: 'mis',
                },
              });

              results.invitations.synced++;
            }
          } catch (error) {
            logger.error(`Failed to sync MIS invitation ${misInv.code}:`, error.message);
            results.invitations.failed++;
          }
        }
      }
    } catch (error) {
      logger.error('Failed to fetch invitations from MIS:', error.message);
    }

    res.json({
      success: true,
      message: 'Sync completed',
      data: results,
    });
  } catch (error) {
    logger.error('Error during MIS sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync with MIS',
      error: error.message,
    });
  }
}

module.exports = {
  createInvitation,
  createBulkInvitations,
  getInvitations,
  validateInvitation,
  resendInvitation,
  submitOnboarding,
  getOnboardingSubmissions,
  getOnboardingDetail,
  validateMembershipKey,
  approveMembership,
  getMemberships,
  getMembershipDetail,
  revokeMembership,
  updateMembershipPermissions,
  getMembershipStatus,
  syncInvitation,
  notifyMembershipApproved,
  exportMemberships,
  getStats,
  triggerSync,
};

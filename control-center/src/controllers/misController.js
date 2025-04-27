/**
 * MIS Controller
 * Handles Membership Initiation System functionality
 */
const axios = require('axios');
const config = require('../config/env');
const { Invitation, MembershipKey } = require('../models');
const crypto = require('crypto');

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
    });

    // Now try to create invitation in MIS
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

      console.log(`Invitation for ${email} created in MIS successfully`);
    } catch (misError) {
      console.error('Failed to create invitation in MIS:', misError.message);
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
    console.error('Error creating invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invitation',
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
        console.error('MIS validation failed:', misError.message);
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
    console.error('Error validating invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate invitation',
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
    try {
      await misApiClient.post('/submit-onboarding', {
        code: invitationCode,
        voice_consent: voiceConsent,
        responses: responses,
      });
    } catch (misError) {
      console.error('Failed to submit onboarding to MIS:', misError.message);
      // Don't fail the request if MIS is unavailable, just log it
    }

    res.json({
      success: true,
      message: 'Onboarding submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit onboarding',
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
    if (!membershipKey) {
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
        console.error('MIS validation failed:', misError.message);
      }

      // If we get here, neither local nor MIS validation succeeded
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
      const User = require('../models/user');
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
    console.error('Error validating membership key:', error);
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
    const { invitationCode, approved } = req.body;

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
      });
    }

    // Try to notify MIS about the approval/rejection
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
    } catch (misError) {
      console.error('Failed to notify MIS about membership approval:', misError.message);
      // Don't fail the request if MIS is unavailable, just log it
    }

    res.json({
      success: true,
      message: approved ? 'Membership approved successfully' : 'Membership rejected',
      data: {
        invitationCode,
        status: invitation.status,
        membershipKey: membershipKey ? membershipKey.key : null,
        membershipCode,
      },
    });
  } catch (error) {
    console.error('Error processing membership approval:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process membership approval',
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
    if (!invitation) {
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
        console.error('Failed to get membership status from MIS:', misError.message);
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
    console.error('Error getting membership status:', error);
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

      console.log(`Created invitation from MIS sync: ${code}`);
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
      console.log(`Updated existing invitation from MIS sync: ${code}`);
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
    console.error('Error syncing invitation:', error);
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
    console.error('Error processing membership approval notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process membership approval notification',
      error: error.message,
    });
  }
}

module.exports = {
  createInvitation,
  validateInvitation,
  submitOnboarding,
  validateMembershipKey,
  approveMembership,
  getMembershipStatus,
  syncInvitation,
  notifyMembershipApproved,
};

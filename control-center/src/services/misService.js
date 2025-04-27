/**
 * Membership Initiation System (MIS) Service
 * Handles communication with the MIS API for invitation codes and membership keys
 */
const axios = require('axios');
const config = require('../config/env');

// Configure API client
const apiClient = axios.create({
  baseURL: config.MIS_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authorization token if available
apiClient.interceptors.request.use(config => {
  const operatorToken = process.env.MIS_OPERATOR_TOKEN;
  if (operatorToken) {
    config.headers['Authorization'] = `Bearer ${operatorToken}`;
  }
  return config;
});

/**
 * Create a new invitation in MIS system
 * @param {Object} invitationData - Data for the invitation
 * @param {String} invitationData.email - Email of the invitee
 * @param {String[]} invitationData.permissions - Permissions to grant
 * @param {Object} invitationData.metadata - Additional metadata
 * @returns {Promise<Object>} - Invitation details including PIN
 */
async function createInvitation(invitationData) {
  try {
    const response = await apiClient.post('/invitations', invitationData);
    return response.data;
  } catch (error) {
    console.error('Error creating MIS invitation:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to create invitation in MIS');
  }
}

/**
 * Validate an invitation code through MIS API
 * @param {Object} validationData - Data to validate
 * @param {String} validationData.email - Email of the invitee
 * @param {String} validationData.invitationCode - Invitation code to validate
 * @param {String} validationData.pin - PIN to validate
 * @returns {Promise<Object>} - Validation result
 */
async function validateInvitation(validationData) {
  try {
    const response = await apiClient.post('/invitations/validate', validationData);
    return response.data;
  } catch (error) {
    console.error('Error validating MIS invitation:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to validate invitation');
  }
}

/**
 * Process onboarding through MIS API
 * @param {Object} onboardingData - Onboarding data
 * @param {String} onboardingData.email - Email of the user
 * @param {String} onboardingData.invitationCode - Invitation code
 * @param {String} onboardingData.pin - PIN for verification
 * @returns {Promise<Object>} - Onboarding result including membership key
 */
async function processOnboarding(onboardingData) {
  try {
    const response = await apiClient.post('/onboarding', onboardingData);
    return response.data;
  } catch (error) {
    console.error('Error processing MIS onboarding:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to complete onboarding');
  }
}

/**
 * Validate membership key through MIS API
 * @param {Object} validationData - Data to validate
 * @param {String} validationData.key - Membership key to validate
 * @returns {Promise<Object>} - Validation result including user data if valid
 */
async function validateMembershipKey(validationData) {
  try {
    const response = await apiClient.post('/membership-key/validate', validationData);
    return response.data;
  } catch (error) {
    console.error('Error validating membership key:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to validate membership key');
  }
}

/**
 * Approve membership through MIS API
 * @param {Object} approvalData - Approval data
 * @param {String} approvalData.email - Email of the user
 * @param {String[]} approvalData.permissions - Permissions to grant
 * @returns {Promise<Object>} - Approval result
 */
async function approveMembership(approvalData) {
  try {
    const response = await apiClient.post('/membership/approve', approvalData);
    return response.data;
  } catch (error) {
    console.error('Error approving membership:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to approve membership');
  }
}

/**
 * Get membership status from MIS API
 * @param {String} email - Email of the user
 * @returns {Promise<Object>} - Membership status data
 */
async function getMembershipStatus(email) {
  try {
    const response = await apiClient.get(`/membership/status/${email}`);
    return response.data;
  } catch (error) {
    console.error('Error getting membership status:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to get membership status');
  }
}

module.exports = {
  createInvitation,
  validateInvitation,
  processOnboarding,
  validateMembershipKey,
  approveMembership,
  getMembershipStatus,
};

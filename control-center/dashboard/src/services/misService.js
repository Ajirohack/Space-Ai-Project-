import axios from 'axios';
import { getAuthHeader } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * Fetch MIS statistics and system status
 * @returns {Promise<Object>} - Statistics data
 */
export const fetchMisStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/mis/stats`, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching MIS stats:', error);
    throw error;
  }
};

/**
 * Create a new invitation
 * @param {Object} invitationData - Invitation details
 * @returns {Promise<Object>} - Created invitation
 */
export const createInvitation = async invitationData => {
  try {
    const response = await axios.post(`${API_URL}/mis/invitations`, invitationData, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error creating invitation:', error);
    throw error;
  }
};

/**
 * Get all invitations with optional filters
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} - Invitations list
 */
export const getInvitations = async (filters = {}) => {
  try {
    const response = await axios.get(`${API_URL}/mis/invitations`, {
      params: filters,
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching invitations:', error);
    throw error;
  }
};

/**
 * Get onboarding submissions
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} - Onboarding submissions
 */
export const getOnboardingSubmissions = async (filters = {}) => {
  try {
    const response = await axios.get(`${API_URL}/mis/onboarding`, {
      params: filters,
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching onboarding submissions:', error);
    throw error;
  }
};

/**
 * Get onboarding details for a specific invitation
 * @param {string} invitationCode - Invitation code
 * @returns {Promise<Object>} - Onboarding details
 */
export const getOnboardingDetail = async invitationCode => {
  try {
    const response = await axios.get(`${API_URL}/mis/onboarding/${invitationCode}`, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching onboarding detail:', error);
    throw error;
  }
};

/**
 * Approve or reject a membership application
 * @param {string} invitationCode - Invitation code
 * @param {boolean} approved - Whether to approve or reject
 * @param {string} notes - Optional reviewer notes
 * @returns {Promise<Object>} - Updated membership status
 */
export const approveMembership = async (invitationCode, approved, notes = '') => {
  try {
    const response = await axios.post(
      `${API_URL}/mis/memberships/approve`,
      { invitationCode, approved, notes },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error approving/rejecting membership:', error);
    throw error;
  }
};

/**
 * Get all memberships
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} - Memberships list
 */
export const getMemberships = async (filters = {}) => {
  try {
    const response = await axios.get(`${API_URL}/mis/memberships`, {
      params: filters,
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching memberships:', error);
    throw error;
  }
};

/**
 * Get membership details
 * @param {string} membershipKey - Membership key
 * @returns {Promise<Object>} - Membership details
 */
export const getMembershipDetail = async membershipKey => {
  try {
    const response = await axios.get(`${API_URL}/mis/memberships/${membershipKey}`, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching membership detail:', error);
    throw error;
  }
};

/**
 * Revoke a membership
 * @param {string} membershipKey - Membership key to revoke
 * @param {string} reason - Reason for revocation
 * @returns {Promise<Object>} - Result
 */
export const revokeMembership = async (membershipKey, reason) => {
  try {
    const response = await axios.post(
      `${API_URL}/mis/memberships/revoke`,
      { membershipKey, reason },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error revoking membership:', error);
    throw error;
  }
};

/**
 * Sync data between Control Center and MIS
 * @returns {Promise<Object>} - Sync results
 */
export const syncWithMis = async () => {
  try {
    const response = await axios.post(`${API_URL}/mis/sync`, {}, { headers: getAuthHeader() });
    return response.data;
  } catch (error) {
    console.error('Error syncing with MIS:', error);
    throw error;
  }
};

/**
 * Validate a membership key
 * @param {string} key - Membership key to validate
 * @returns {Promise<Object>} - Validation result
 */
export const validateMembershipKey = async key => {
  try {
    const response = await axios.post(`${API_URL}/mis/memberships/validate`, { key });
    return response.data;
  } catch (error) {
    console.error('Error validating membership key:', error);
    throw error;
  }
};

/**
 * Get membership status for an email address
 * @param {string} email - Email address to check
 * @returns {Promise<Object>} - Membership status information
 */
export const getMembershipStatusByEmail = async email => {
  try {
    const response = await axios.get(`${API_URL}/mis/memberships/status/${email}`, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching membership status:', error);
    throw error;
  }
};

/**
 * Update membership permissions
 * @param {string} membershipKey - The membership key
 * @param {Array} permissions - Updated permissions array
 * @returns {Promise<Object>} - Updated membership
 */
export const updateMembershipPermissions = async (membershipKey, permissions) => {
  try {
    const response = await axios.put(
      `${API_URL}/mis/memberships/${membershipKey}/permissions`,
      { permissions },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating membership permissions:', error);
    throw error;
  }
};

/**
 * Resend invitation email
 * @param {string} invitationCode - Invitation code
 * @returns {Promise<Object>} - Result
 */
export const resendInvitation = async invitationCode => {
  try {
    const response = await axios.post(
      `${API_URL}/mis/invitations/${invitationCode}/resend`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error resending invitation:', error);
    throw error;
  }
};

/**
 * Create bulk invitations
 * @param {Array} invitations - Array of invitation objects
 * @returns {Promise<Object>} - Result with created invitations
 */
export const createBulkInvitations = async invitations => {
  try {
    const response = await axios.post(
      `${API_URL}/mis/invitations/bulk`,
      { invitations },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating bulk invitations:', error);
    throw error;
  }
};

/**
 * Export membership data
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Blob>} - CSV file blob
 */
export const exportMemberships = async (filters = {}) => {
  try {
    const response = await axios.get(`${API_URL}/mis/memberships/export`, {
      params: filters,
      headers: {
        ...getAuthHeader(),
        Accept: 'text/csv',
      },
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting memberships:', error);
    throw error;
  }
};

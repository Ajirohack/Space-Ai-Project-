import axios from 'axios';

// Get API base URL from environment variables or use default
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

/**
 * Send a message to Nexus and get a response
 * @param {string} message - The user's message
 * @param {Array} attachments - Optional array of attachment objects
 * @param {string} apiKey - The user's API key
 * @returns {Promise<string>} - Nexus's response
 */
export const sendMessage = async (message, attachments = [], apiKey) => {
  try {
    // For attachments, we need to create FormData
    const formData = new FormData();
    formData.append('message', message);
    formData.append('apiKey', apiKey);

    // Append each attachment to the FormData
    attachments.forEach((attachment, index) => {
      formData.append(`attachment${index}`, attachment.file);
    });

    const response = await axios.post(`${API_BASE_URL}/api/chat`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return response.data.response;
  } catch (error) {
    console.error('Error sending message to Nexus:', error);
    throw new Error('Failed to communicate with Nexus');
  }
};

const nexusApi = {
  sendMessage
};

export default nexusApi;

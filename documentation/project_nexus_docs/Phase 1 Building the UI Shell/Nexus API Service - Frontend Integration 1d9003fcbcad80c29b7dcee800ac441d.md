# Nexus API Service - Frontend Integration

---

```jsx
// File: src/services/nexusApi.js
import axios from 'axios';

// Get API base URL from environment variables or use default
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// Generate a session ID for the current user
// In a real implementation, this would be based on user authentication
const generateSessionId = () => {
  const storedId = localStorage.getItem('nexus_session_id');
  if (storedId) return storedId;
  
  const newId = 'user_' + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('nexus_session_id', newId);
  return newId;
};

const userId = generateSessionId();

/**
 * Send a message to Nexus and get a response
 * @param {string} message - The user's message
 * @returns {Promise<string>} - Nexus's response
 */
export const sendMessage = async (message) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/chat`, {
      message,
      userId
    });
    
    return response.data.response;
  } catch (error) {
    console.error('Error sending message to Nexus:', error);
    throw new Error('Failed to communicate with Nexus');
  }
};

/**
 * Initialize connection with Nexus
 * In a more complex implementation, this could:
 * - Sync user preferences
 * - Load conversation history
 * - Check system status
 */
export const initializeNexus = async () => {
  // For now, this is a placeholder
  // In a real implementation, this would establish initial connection
  return {
    status: 'online',
    message: 'Nexus is ready for interaction'
  };
};

// Export the API functions
const nexusApi = {
  sendMessage,
  initializeNexus
};

export default nexusApi;
```
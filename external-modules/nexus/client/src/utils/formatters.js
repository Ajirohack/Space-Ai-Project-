/**
 * Format current time for message timestamps
 * @returns {string} Formatted time string (HH:MM)
 */
export const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Truncate a string to a specified length
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated string
 */
export const truncateString = (str, length = 20) => {
  if (!str) return '';
  if (str.length <= length) return str;
  
  return str.substring(0, length) + '...';
};

/**
 * Generate a session ID for the current user
 * @returns {string} Unique session ID
 */
export const generateSessionId = () => {
  const storedId = localStorage.getItem('nexus_session_id');
  if (storedId) return storedId;
  
  const newId = 'user_' + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('nexus_session_id', newId);
  return newId;
};

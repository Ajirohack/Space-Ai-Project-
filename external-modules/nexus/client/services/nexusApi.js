import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // Local backend server URL

const nexusApi = {
  initializeNexus: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/initialize`);
      return response.data;
    } catch (error) {
      console.error('Error initializing Nexus:', error);
      throw error;
    }
  },
  
  sendMessage: async (messageText, attachments = []) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/send-message`, {
        text: messageText,
        attachments: attachments.map(attachment => ({
          id: attachment.id,
          type: attachment.type,
          url: attachment.url,
          name: attachment.name,
          duration: attachment.duration
        }))
      });
      return response.data.text;
    } catch (error) {
      console.error('Error sending message to Nexus:', error);
      throw error;
    }
  },
  
  uploadAttachment: async (formData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/upload-attachment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  }
};

export default nexusApi;

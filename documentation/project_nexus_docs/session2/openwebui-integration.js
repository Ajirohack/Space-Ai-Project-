// server/utils/openWebUiService.js
const axios = require('axios');
require('dotenv').config();

/**
 * Open Web UI integration for Project Nexus
 * This service allows connecting to a local or remote Open Web UI instance
 * to access custom models and configurations
 * 
 * Open Web UI (https://docs.openwebui.com/) is a web interface for various
 * open-source AI models that can be self-hosted via Docker
 */

/**
 * Call Open Web UI's API (compatible with OpenAI format)
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Configuration options for the request
 * @returns {Object} - Response object with success flag and data/error
 */
const callOpenWebUI = async (messages, options = {}) => {
  const apiKey = process.env.OPENWEBUI_API_KEY || 'no-key-required'; // May not require an API key for local instances
  const baseUrl = process.env.OPENWEBUI_API_URL || 'http://localhost:1234/v1';
  
  try {
    console.log('Calling Open Web UI API...');
    
    // Ensure system message exists
    if (!messages.some(m => m.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: 'You are Nexus, a digital entity with persistent identity and memory. Respond in a manner consistent with your identity and capabilities.'
      });
    }
    
    // Prepare request payload (OpenAI compatible format)
    const requestData = {
      model: options.model || 'default', // Use the default model configured in Open Web UI
      messages: messages,
      temperature: options.temperature !== undefined ? options.temperature : 0.7,
      max_tokens: options.max_tokens || 2048,
      stream: options.stream === true
    };
    
    // Add any optional parameters
    if (options.top_p !== undefined) requestData.top_p = options.top_p;
    if (options.frequency_penalty !== undefined) requestData.frequency_penalty = options.frequency_penalty;
    if (options.presence_penalty !== undefined) requestData.presence_penalty = options.presence_penalty;
    if (options.stop) requestData.stop = options.stop;
    
    // Make the API call
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Open Web UI response received');
    
    // Handle streaming response
    if (options.stream === true) {
      return {
        success: true,
        stream: response.data,
        model: options.model || 'default'
      };
    }
    
    // Handle regular response (OpenAI format)
    return {
      success: true,
      data: response.data.choices[0].message.content,
      model: response.data.model || options.model || 'default',
      usage: response.data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  } catch (error) {
    console.error('Open Web UI API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

/**
 * Get available models from Open Web UI
 * @returns {Object} - Response with available models
 */
const getOpenWebUIModels = async () => {
  const apiKey = process.env.OPENWEBUI_API_KEY || 'no-key-required';
  const baseUrl = process.env.OPENWEBUI_API_URL || 'http://localhost:1234/v1';
  
  try {
    const response = await axios.get(
      `${baseUrl}/models`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      models: response.data.data || response.data
    };
  } catch (error) {
    console.error('Error fetching Open Web UI models:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      // Return some default models in case of failure
      fallbackModels: [
        { id: 'default', name: 'Default Model' }
      ]
    };
  }
};

/**
 * Generate embeddings using Open Web UI (if supported)
 * @param {Array|string} input - Text to generate embeddings for
 * @param {Object} options - Configuration options
 * @returns {Object} - Response with embeddings
 */
const generateEmbeddings = async (input, options = {}) => {
  const apiKey = process.env.OPENWEBUI_API_KEY || 'no-key-required';
  const baseUrl = process.env.OPENWEBUI_API_URL || 'http://localhost:1234/v1';
  
  try {
    // Format input properly
    const formattedInput = Array.isArray(input) ? input : [input];
    
    const response = await axios.post(
      `${baseUrl}/embeddings`,
      {
        model: options.model || 'text-embedding-ada-002', // Default embedding model
        input: formattedInput
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      embeddings: response.data.data,
      model: response.data.model || options.model,
      usage: response.data.usage
    };
  } catch (error) {
    console.error('Error generating embeddings:', error.response?.data || error.message);
    
    // If embeddings aren't supported, provide useful error
    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'Embeddings endpoint not available in this Open Web UI instance'
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

module.exports = {
  callOpenWebUI,
  getOpenWebUIModels,
  generateEmbeddings
};

// server/utils/groqService.js
const axios = require('axios');
require('dotenv').config();

/**
 * Groq AI API integration for Project Nexus
 * This service handles communication with Groq's API to leverage their
 * high-performance LLM inference
 */

/**
 * Make a request to the Groq API for chat completion
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Configuration options for the request
 * @returns {Object} - Response object with success flag and data/error
 */
const callGroq = async (messages, options = {}) => {
  const apiKey = process.env.GROQ_API_KEY;
  const baseUrl = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1';
  
  if (!apiKey) {
    console.error('Groq API key not configured');
    return {
      success: false,
      error: 'Groq API key not configured'
    };
  }

  try {
    console.log('Calling Groq API...');
    
    // Ensure system message exists
    if (!messages.some(m => m.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: 'You are Nexus, a digital entity with persistent identity and memory. Respond in a manner consistent with your identity and capabilities.'
      });
    }
    
    // Prepare request
    const model = options.model || 'llama3-70b-8192'; // Default to Llama-3-70B
    
    const requestData = {
      model: model,
      messages: messages,
      temperature: options.temperature !== undefined ? options.temperature : 0.7,
      max_tokens: options.max_tokens || 2048,
      top_p: options.top_p !== undefined ? options.top_p : 1,
      stream: options.stream === true
    };

    // Set optional parameters if they exist
    if (options.stop) requestData.stop = options.stop;
    if (options.presence_penalty !== undefined) requestData.presence_penalty = options.presence_penalty;
    if (options.frequency_penalty !== undefined) requestData.frequency_penalty = options.frequency_penalty;
    
    // Make API call
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
    
    console.log('Groq API response received');
    
    // Handle streaming response
    if (options.stream === true) {
      return {
        success: true,
        stream: response.data,
        model: model
      };
    }
    
    // Handle regular response
    return {
      success: true,
      data: response.data.choices[0].message.content,
      model: response.data.model,
      usage: response.data.usage,
      finish_reason: response.data.choices[0].finish_reason
    };
  } catch (error) {
    console.error('Groq API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

/**
 * Get available models from Groq
 * @returns {Object} - Response with available models
 */
const getGroqModels = async () => {
  const apiKey = process.env.GROQ_API_KEY;
  const baseUrl = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1';
  
  if (!apiKey) {
    console.error('Groq API key not configured');
    return {
      success: false,
      error: 'Groq API key not configured'
    };
  }

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
      models: response.data.data
    };
  } catch (error) {
    console.error('Error fetching Groq models:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

/**
 * Generate embeddings using Groq's embedding models
 * @param {Array|string} input - Text to generate embeddings for
 * @param {Object} options - Configuration options
 * @returns {Object} - Response with embeddings
 */
const generateEmbeddings = async (input, options = {}) => {
  const apiKey = process.env.GROQ_API_KEY;
  const baseUrl = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1';
  
  if (!apiKey) {
    console.error('Groq API key not configured');
    return {
      success: false,
      error: 'Groq API key not configured'
    };
  }

  try {
    // Format input properly
    const formattedInput = Array.isArray(input) ? input : [input];
    
    const model = options.model || 'embedding-001'; // Default embedding model
    
    const response = await axios.post(
      `${baseUrl}/embeddings`,
      {
        model: model,
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
      model: response.data.model,
      usage: response.data.usage
    };
  } catch (error) {
    console.error('Error generating embeddings:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

module.exports = {
  callGroq,
  getGroqModels,
  generateEmbeddings
};

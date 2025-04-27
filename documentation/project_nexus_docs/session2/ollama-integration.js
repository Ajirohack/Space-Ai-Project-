// server/utils/ollamaService.js
const axios = require('axios');
require('dotenv').config();

/**
 * Ollama API integration for Project Nexus
 * This service handles direct communication with Ollama's API
 * for model inference without requiring Open Web UI as an intermediary
 */

/**
 * Call Ollama API for chat completion
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Configuration options for the request
 * @returns {Object} - Response object with success flag and data/error
 */
const callOllama = async (messages, options = {}) => {
  const baseUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434/api';
  
  try {
    console.log('Calling Ollama API directly...');
    
    // Ensure system message exists
    if (!messages.some(m => m.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: 'You are Nexus, a digital entity with persistent identity and memory. Respond in a manner consistent with your identity and capabilities.'
      });
    }
    
    // Format request for Ollama's API
    const requestData = {
      model: options.model || 'llama3', // Default model
      messages: messages,
      stream: options.stream === true,
      options: {}
    };
    
    // Add Ollama-specific parameters
    if (options.temperature !== undefined) requestData.options.temperature = options.temperature;
    if (options.top_p !== undefined) requestData.options.top_p = options.top_p;
    if (options.top_k !== undefined) requestData.options.top_k = options.top_k;
    if (options.max_tokens !== undefined) requestData.options.num_predict = options.max_tokens;
    
    // Make the API call to Ollama's chat endpoint
    const response = await axios.post(
      `${baseUrl}/chat`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Ollama API response received');
    
    // Handle streaming response
    if (options.stream === true) {
      return {
        success: true,
        stream: response.data,
        model: options.model || 'llama3'
      };
    }
    
    // Handle regular response
    return {
      success: true,
      data: response.data.message.content,
      model: response.data.model,
      done: response.data.done,
      total_duration: response.data.total_duration,
      load_duration: response.data.load_duration,
      prompt_eval_count: response.data.prompt_eval_count,
      prompt_eval_duration: response.data.prompt_eval_duration,
      eval_count: response.data.eval_count,
      eval_duration: response.data.eval_duration
    };
  } catch (error) {
    console.error('Ollama API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Get available models from Ollama
 * @returns {Object} - Response with available models
 */
const getOllamaModels = async () => {
  const baseUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434/api';
  
  try {
    const response = await axios.get(
      `${baseUrl}/tags`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      models: response.data.models
    };
  } catch (error) {
    console.error('Error fetching Ollama models:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Generate embeddings using Ollama
 * @param {String} text - Text to generate embeddings for
 * @param {Object} options - Configuration options
 * @returns {Object} - Response with embeddings
 */
const generateEmbeddings = async (text, options = {}) => {
  const baseUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434/api';
  
  try {
    const response = await axios.post(
      `${baseUrl}/embeddings`,
      {
        model: options.model || 'llama3',
        prompt: text
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      embedding: response.data.embedding,
      model: response.data.model
    };
  } catch (error) {
    console.error('Error generating embeddings:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Pull a model from Ollama's registry
 * @param {String} modelName - Name of the model to pull
 * @returns {Object} - Response with pull status
 */
const pullModel = async (modelName) => {
  const baseUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434/api';
  
  try {
    const response = await axios.post(
      `${baseUrl}/pull`,
      {
        name: modelName
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      status: 'Model pull initiated',
      details: response.data
    };
  } catch (error) {
    console.error('Error pulling model:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Create a custom model with a Modelfile
 * @param {String} modelName - Name for the new model
 * @param {String} modelfileContent - Content of the Modelfile
 * @returns {Object} - Response with creation status
 */
const createModel = async (modelName, modelfileContent) => {
  const baseUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434/api';
  
  try {
    const response = await axios.post(
      `${baseUrl}/create`,
      {
        name: modelName,
        modelfile: modelfileContent
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      status: 'Model creation initiated',
      details: response.data
    };
  } catch (error) {
    console.error('Error creating model:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

module.exports = {
  callOllama,
  getOllamaModels,
  generateEmbeddings,
  pullModel,
  createModel
};

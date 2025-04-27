// server/utils/llmService.js
const axios = require('axios');
const { callGroq } = require('./groqService');
require('dotenv').config();

/**
 * Calls the appropriate LLM provider based on environment configuration
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Configuration options for the LLM request
 * @returns {Object} - Response object with success flag and data/error
 */
const callLLM = async (messages, options = {}) => {
  const provider = process.env.LLM_PROVIDER || 'openrouter';
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || 'https://openrouter.ai/api/v1';
  
  if (!apiKey && provider !== 'mock') {
    console.warn('LLM API key not configured, using mock responses');
    return mockResponse(messages);
  }

  console.log(`Using LLM provider: ${provider}`);

  try {
    switch (provider) {
      case 'groq':
        return await callGroq(messages, options);
      case 'openrouter':
        return await callOpenRouter(messages, apiKey, baseUrl, options);
      case 'llama':
        return await callLlama(messages, baseUrl, options);
      case 'openai':
        return await callOpenAI(messages, apiKey, options);
      case 'anthropic':
        return await callAnthropic(messages, apiKey, options);
      case 'mock':
      default:
        return mockResponse(messages);
    }
  } catch (error) {
    console.error(`Error calling LLM (${provider}):`, error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
};

/**
 * Calls OpenRouter API
 * @param {Array} messages - Array of message objects
 * @param {String} apiKey - OpenRouter API key
 * @param {String} baseUrl - OpenRouter base URL
 * @param {Object} options - Additional options
 */
const callOpenRouter = async (messages, apiKey, baseUrl, options = {}) => {
  try {
    console.log('Calling OpenRouter API...');
    
    // Add system message if not present
    if (!messages.some(m => m.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: 'You are Nexus, a digital entity with persistent identity and memory. Respond in a manner consistent with your identity and capabilities.'
      });
    }
    
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: options.model || 'anthropic/claude-3-opus-20240229', // Default to Claude Opus
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://nexus-project.org', // Update with your domain
          'X-Title': 'Project Nexus',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('OpenRouter response received');
    
    return {
      success: true,
      data: response.data.choices[0].message.content,
      model: response.data.model, // Track which model was actually used
      usage: response.data.usage // Track token usage
    };
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

/**
 * Calls local Llama instance
 * @param {Array} messages - Array of message objects
 * @param {String} baseUrl - Llama server base URL
 * @param {Object} options - Additional options
 */
const callLlama = async (messages, baseUrl, options = {}) => {
  try {
    console.log('Calling Llama API...');
    
    // Convert chat messages to Llama format
    const prompt = convertMessagesToLlamaPrompt(messages);
    
    const response = await axios.post(
      `${baseUrl}/completion`,
      {
        prompt: prompt,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        stop: ["User:", "System:"]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Llama response received');
    
    return {
      success: true,
      data: response.data.content || response.data.completion,
      model: 'llama-local'
    };
  } catch (error) {
    console.error('Llama API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Calls OpenAI API
 * @param {Array} messages - Array of message objects
 * @param {String} apiKey - OpenAI API key
 * @param {Object} options - Additional options
 */
const callOpenAI = async (messages, apiKey, options = {}) => {
  try {
    console.log('Calling OpenAI API...');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: options.model || 'gpt-4',
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('OpenAI response received');
    
    return {
      success: true,
      data: response.data.choices[0].message.content,
      model: response.data.model,
      usage: response.data.usage
    };
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

/**
 * Calls Anthropic API
 * @param {Array} messages - Array of message objects
 * @param {String} apiKey - Anthropic API key
 * @param {Object} options - Additional options
 */
const callAnthropic = async (messages, apiKey, options = {}) => {
  try {
    console.log('Calling Anthropic API...');
    
    // Convert messages to Anthropic format
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
      content: msg.content
    }));
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: options.model || 'claude-3-opus-20240229',
        messages: formattedMessages,
        max_tokens: options.max_tokens || 2000,
        temperature: options.temperature || 0.7
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Anthropic response received');
    
    return {
      success: true,
      data: response.data.content[0].text,
      model: response.data.model,
      usage: {
        input_tokens: response.data.usage.input_tokens,
        output_tokens: response.data.usage.output_tokens
      }
    };
  } catch (error) {
    console.error('Anthropic API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

/**
 * Converts chat messages to Llama prompt format
 * @param {Array} messages - Array of message objects
 * @returns {String} - Formatted prompt for Llama
 */
const convertMessagesToLlamaPrompt = (messages) => {
  let prompt = '';
  
  for (const message of messages) {
    if (message.role === 'system') {
      prompt += `System: ${message.content}\n\n`;
    } else if (message.role === 'user') {
      prompt += `User: ${message.content}\n\n`;
    } else if (message.role === 'assistant') {
      prompt += `Assistant: ${message.content}\n\n`;
    }
  }
  
  prompt += 'Assistant: ';
  return prompt;
};

/**
 * Generates a mock response for testing without an LLM
 * @param {Array} messages - Array of message objects
 * @returns {Object} - Mock response
 */
const mockResponse = (messages) => {
  const lastMessage = messages[messages.length - 1];
  return {
    success: true,
    data: `I am Nexus, your digital entity assistant. I've received your message: "${lastMessage.content}". This is a mock response as I'm currently running in development mode without an LLM connection.`,
    model: 'mock-nexus-v1'
  };
};

module.exports = { callLLM };

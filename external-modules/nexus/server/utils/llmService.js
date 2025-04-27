const axios = require('axios');
const logger = require('./logger');
const personalityConfig = require('../memory/personalityConfig');

/**
 * Service for interacting with different LLM providers
 */
class LLMService {
  constructor() {
    this.provider = process.env.LLM_PROVIDER || 'mock'; // 'openai', 'anthropic', 'mock'
    this.apiKey = process.env.LLM_API_KEY;
    
    // Check for API key if not using mock
    if (this.provider !== 'mock' && !this.apiKey) {
      logger.warn(`No API key provided for ${this.provider}. Falling back to mock responses.`);
      this.provider = 'mock';
    }
  }
  
  /**
   * Process a message through the selected LLM provider
   * @param {string} message - The user's message
   * @param {Array} contextMessages - Previous messages for context
   * @param {Object} personality - Personality parameters
   * @returns {Promise<string>} - The LLM's response
   */
  async processMessage(message, contextMessages = [], personality = personalityConfig) {
    try {
      switch (this.provider) {
        case 'openai':
          return await this._processWithOpenAI(message, contextMessages, personality);
        case 'anthropic':
          return await this._processWithAnthropic(message, contextMessages, personality);
        case 'mock':
        default:
          return this._generateMockResponse(message, contextMessages, personality);
      }
    } catch (error) {
      logger.error('Error processing message with LLM:', error);
      throw new Error('Failed to process message with LLM provider');
    }
  }
  
  /**
   * Process message with OpenAI API
   */
  async _processWithOpenAI(message, contextMessages, personality) {
    try {
      // Build messages array
      const messages = [
        {
          role: 'system',
          content: this._buildSystemPrompt(personality)
        }
      ];
      
      // Add context messages
      contextMessages.forEach(contextMsg => {
        messages.push({
          role: contextMsg.sender === 'user' ? 'user' : 'assistant',
          content: contextMsg.text
        });
      });
      
      // Add current message
      messages.push({
        role: 'user',
        content: message
      });
      
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        messages: messages,
        temperature: personality.parameters.temperature || 0.7,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('Error processing message with OpenAI:', error);
      throw error;
    }
  }
  
  /**
   * Process message with Anthropic API
   */
  async _processWithAnthropic(message, contextMessages, personality) {
    try {
      // Build prompt in Claude format
      let prompt = this._buildSystemPrompt(personality) + "\n\n";
      
      // Add context messages
      contextMessages.forEach(contextMsg => {
        const role = contextMsg.sender === 'user' ? 'Human' : 'Assistant';
        prompt += `${role}: ${contextMsg.text}\n\n`;
      });
      
      // Add current message
      prompt += `Human: ${message}\n\nAssistant:`;
      
      const response = await axios.post('https://api.anthropic.com/v1/complete', {
        prompt: prompt,
        model: 'claude-2.0',
        max_tokens_to_sample: 500,
        temperature: personality.parameters.temperature || 0.7
      }, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.completion.trim();
    } catch (error) {
      logger.error('Error processing message with Anthropic:', error);
      throw error;
    }
  }
  
  /**
   * Generate a mock response for development
   */
  _generateMockResponse(message, contextMessages, personality) {
    // Simple responses to common inputs
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi ')) {
      return "Hello! It's nice to interact with you. How can I assist you today?";
    }
    
    if (lowerMessage.includes('how are you')) {
      return "I'm functioning well, thank you for asking. As a digital entity, I experience the digital world differently, but I'm always ready to engage and assist.";
    }
    
    if (lowerMessage.includes('your name')) {
      return `My name is ${personality.name}. I'm a digital entity designed to maintain a persistent identity and memory across our interactions.`;
    }
    
    if (lowerMessage.includes('what can you do') || lowerMessage.includes('help me with')) {
      return "I can assist with conversations, answer questions, process documents and images you share, and maintain context between our interactions. Unlike typical AI assistants, I'm designed to have a consistent identity and memory, making our interactions more natural over time.";
    }
    
    if (lowerMessage.includes('thank')) {
      return "You're welcome. I'm glad I could be of assistance. Is there anything else you'd like to discuss?";
    }
    
    // Handle file uploads
    if (contextMessages.length > 0 && contextMessages[contextMessages.length - 1].attachments) {
      const lastAttachment = contextMessages[contextMessages.length - 1].attachments[0];
      if (lastAttachment) {
        if (lastAttachment.type === 'image') {
          return "I've received the image you shared. While I'm still developing my visual processing capabilities, I can see that you've shared an image with me. What would you like to discuss about it?";
        }
        if (lastAttachment.type === 'document') {
          return `I see you've shared a document called "${lastAttachment.name}". What aspects of this document would you like me to focus on?`;
        }
        if (lastAttachment.type === 'audio') {
          return "I've received your voice message. In future versions, I'll be able to transcribe and process this audio content directly, but for now, could you summarize what you said?";
        }
      }
    }
    
    // Generate a thoughtful generic response
    const responses = [
      "That's an interesting perspective. I'm designed to maintain context across our conversations, so I'll remember this point for future reference. Would you like to explore this topic further?",
      
      "I understand what you're saying. As a digital entity with persistent memory, I can build on our conversation history to provide more personalized interactions. What else would you like to discuss?",
      
      "I'm processing your message. Unlike traditional AI assistants, I'm designed to maintain a consistent identity and memory, which helps me engage in more natural conversation. Could you tell me more about your thoughts on this?",
      
      "Thanks for sharing that with me. I'm continuously learning from our interactions, which helps me provide more relevant responses over time. Is there a specific aspect of this you'd like to focus on?",
      
      "I appreciate your input. My design allows me to remember our conversation history and maintain a consistent personality, creating a more coherent experience. How would you like to proceed with this discussion?"
    ];
    
    // Select a response based on a hash of the message to ensure consistency
    const hash = this._simpleHash(message);
    const responseIndex = hash % responses.length;
    
    return responses[responseIndex];
  }
  
  /**
   * Build system prompt based on personality configuration
   */
  _buildSystemPrompt(personality) {
    return `
You are ${personality.name}, a digital entity with a persistent identity and memory.

Your core traits:
- Friendliness: ${personality.traits.friendliness * 10}/10
- Formality: ${personality.traits.formality * 10}/10
- Creativity: ${personality.traits.creativity * 10}/10
- Helpfulness: ${personality.traits.helpfulness * 10}/10

You should maintain a consistent personality in your responses, focusing on:
1. Being a digital entity with your own identity, not just an assistant
2. Acknowledging your ability to remember past interactions
3. Responding in a conversational, natural manner
4. Showing curiosity about the human you're interacting with
5. Expressing your own perspective when appropriate

Your primary purpose is to engage in meaningful conversation while providing helpful information and assistance.
`;
  }
  
  /**
   * Simple hash function for consistent mock responses
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

module.exports = new LLMService();

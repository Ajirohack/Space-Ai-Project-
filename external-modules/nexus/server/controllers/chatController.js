const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const llmService = require('../utils/llmService');
const MemorySystem = require('../memory/memorySystem');

// Initialize memory system
const memorySystem = new MemorySystem();

/**
 * Process an incoming chat message
 */
exports.processMessage = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { message, userId, attachments } = req.body;
    const anonymousId = userId || 'anonymous';
    
    // Ensure the memory system is initialized
    if (!memorySystem.initialized) {
      await memorySystem.initialize();
    }
    
    logger.info(`Processing message from user ${anonymousId}`);
    
    // Retrieve conversation history for context
    const userConversations = memorySystem.getUserConversations(anonymousId);
    
    // Format recent conversations for context
    const recentMessages = userConversations
      .slice(-5)  // Get last 5
      .map(memory => memory.interaction);
    
    // Prepare attached media context if present
    let enhancedMessage = message;
    if (attachments && attachments.length > 0) {
      enhancedMessage += "\n\n[User has shared the following attachments:";
      
      attachments.forEach(attachment => {
        if (attachment.type === 'image') {
          enhancedMessage += `\n- An image ${attachment.name ? `named "${attachment.name}"` : ""}`;
        } else if (attachment.type === 'document') {
          enhancedMessage += `\n- A document named "${attachment.name}"`;
        } else if (attachment.type === 'audio') {
          enhancedMessage += `\n- A voice recording ${attachment.duration ? `(${Math.round(attachment.duration)}s)` : ""}`;
        }
      });
      
      enhancedMessage += "\n]";
    }
    
    // Get response from LLM service
    const nexusResponse = await llmService.processMessage(
      enhancedMessage,
      recentMessages
    );
    
    // Store interaction in memory
    await memorySystem.storeEpisodicMemory(anonymousId, {
      user: message,
      nexus: nexusResponse,
      attachments: attachments || null,
      timestamp: new Date().toISOString()
    });
    
    // Return response
    res.json({ response: nexusResponse });
    
  } catch (error) {
    logger.error('Error in chat controller:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
};

// Validation rules for message processing
exports.validate = [
  body('message').optional().isString(),
  body('userId').optional().isString()
];

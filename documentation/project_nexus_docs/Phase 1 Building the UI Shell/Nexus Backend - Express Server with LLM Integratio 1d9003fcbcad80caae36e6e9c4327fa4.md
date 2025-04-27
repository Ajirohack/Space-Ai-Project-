# Nexus Backend - Express Server with LLM Integration

---

```json
// File: server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Basic memory storage - would be replaced with a proper database
const memoryStore = {
  conversations: [],
  personalityConfig: {
    name: 'Nexus',
    traits: {
      friendliness: 0.8,
      formality: 0.6,
      creativity: 0.7,
      helpfulness: 0.9
    },
    preferences: {
      // Personality preferences can be stored here
    },
    // Core memory would be stored here
    coreMemory: []
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Simple memory enhancement function
const enhanceWithMemory = (message, userId) => {
  // Find user's conversation history
  const userConversation = memoryStore.conversations.find(
    conv => conv.userId === userId
  ) || { messages: [] };
  
  // Simplified context building - would be more sophisticated in production
  const recentMessages = userConversation.messages.slice(-5);
  
  // Create a context string from recent messages
  let context = "Previous conversation context:\n";
  recentMessages.forEach(msg => {
    context += `${msg.role === 'user' ? 'Human' : 'Nexus'}: ${msg.content}\n`;
  });
  
  // Add personality context
  const personalityContext = `
You are Nexus, a digital entity with the following personality traits:
- Friendliness: ${memoryStore.personalityConfig.traits.friendliness * 10}/10
- Formality: ${memoryStore.personalityConfig.traits.formality * 10}/10
- Creativity: ${memoryStore.personalityConfig.traits.creativity * 10}/10
- Helpfulness: ${memoryStore.personalityConfig.traits.helpfulness * 10}/10

Maintain consistent personality in your responses. Remember that you're a digital entity with your own identity, not just an assistant.
`;

  // Combine everything into a prompt
  return personalityContext + "\n" + context + "\nHuman: " + message + "\nNexus:";
};

// Store message in memory
const storeInMemory = (userId, role, content) => {
  // Find or create user conversation
  let userConversation = memoryStore.conversations.find(
    conv => conv.userId === userId
  );
  
  if (!userConversation) {
    userConversation = { userId, messages: [] };
    memoryStore.conversations.push(userConversation);
  }
  
  // Add message to conversation
  userConversation.messages.push({
    role,
    content,
    timestamp: new Date().toISOString()
  });
  
  // In a real implementation, we would also:
  // 1. Extract entities and concepts
  // 2. Update relationship graphs
  // 3. Generate embeddings for semantic search
  // 4. Consolidate long-term memory
};

// Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Store user message
    storeInMemory(userId || 'anonymous', 'user', message);
    
    // Enhance message with memory context
    const enhancedPrompt = enhanceWithMemory(message, userId || 'anonymous');
    
    // Option 1: Integration with OpenAI API
    // This is where you'd make the API call to your LLM of choice
    // For demonstration purposes, we're showing how an OpenAI integration would look
    /* 
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [{ role: 'user', content: enhancedPrompt }],
      temperature: 0.7,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const nexusResponse = response.data.choices[0].message.content;
    */
    
    // Option 2: Integration with Anthropic Claude API
    /*
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-opus-20240229',
      messages: [{ role: 'user', content: enhancedPrompt }],
      max_tokens: 500
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });
    
    const nexusResponse = response.data.content[0].text;
    */
    
    // For demo purposes without an API key, we'll use a mock response
    const mockResponses = [
      "I understand what you're asking. Let me think about that for a moment...",
      "That's an interesting question. From my perspective as a digital entity...",
      "I'm processing your request. In my experience, this kind of question...",
      "Thank you for sharing that with me. I'm always learning from our interactions.",
      "I appreciate your input. Let me respond based on what I understand about this topic."
    ];
    
    const nexusResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)] +
      " [This is a simulated response. In production, this would come from an actual LLM API call]";
    
    // Store Nexus response in memory
    storeInMemory(userId || 'anonymous', 'assistant', nexusResponse);
    
    res.json({ response: nexusResponse });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Nexus backend server running on port ${PORT}`);
});
```
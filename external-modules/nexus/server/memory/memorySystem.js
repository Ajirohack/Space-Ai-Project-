const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * A basic implementation of Nexus's memory system
 * This will be expanded significantly in later development
 */
class MemorySystem {
  constructor(storagePath = path.join(__dirname, '../data')) {
    this.storagePath = storagePath;
    this.episodicMemory = [];
    this.semanticMemory = {};
    this.initialized = false;
  }
  
  /**
   * Initialize the memory system
   */
  async initialize() {
    try {
      // Ensure storage directory exists
      await fs.mkdir(this.storagePath, { recursive: true });
      
      // Load existing memories if they exist
      try {
        const episodicData = await fs.readFile(
          path.join(this.storagePath, 'episodic.json'),
          'utf8'
        );
        this.episodicMemory = JSON.parse(episodicData);
        
        const semanticData = await fs.readFile(
          path.join(this.storagePath, 'semantic.json'),
          'utf8'
        );
        this.semanticMemory = JSON.parse(semanticData);
      } catch (loadError) {
        // It's okay if files don't exist yet
        logger.info('No existing memory files found, starting fresh');
      }
      
      this.initialized = true;
      logger.info('Memory system initialized');
    } catch (error) {
      logger.error('Failed to initialize memory system:', error);
      throw error;
    }
  }
  
  /**
   * Save memories to persistent storage
   */
  async persistMemories() {
    if (!this.initialized) {
      throw new Error('Memory system not initialized');
    }
    
    try {
      await fs.writeFile(
        path.join(this.storagePath, 'episodic.json'),
        JSON.stringify(this.episodicMemory, null, 2)
      );
      
      await fs.writeFile(
        path.join(this.storagePath, 'semantic.json'),
        JSON.stringify(this.semanticMemory, null, 2)
      );
      
      logger.info('Memories persisted to storage');
    } catch (error) {
      logger.error('Failed to persist memories:', error);
      throw error;
    }
  }
  
  /**
   * Store a new episodic memory (conversation or interaction)
   */
  async storeEpisodicMemory(userId, interaction) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const memory = {
      userId,
      timestamp: new Date().toISOString(),
      interaction,
      retrievalCount: 0,
      lastRetrieved: null,
      importance: this._calculateImportance(interaction)
    };
    
    this.episodicMemory.push(memory);
    
    // Extract entities and concepts for semantic memory
    this._extractSemanticConcepts(memory);
    
    // Persist after significant updates
    if (this.episodicMemory.length % 10 === 0) {
      await this.persistMemories();
    }
    
    return memory;
  }
  
  /**
   * Retrieve relevant memories for a given context
   */
  retrieveRelevantMemories(userId, context, limit = 5) {
    if (!this.initialized) {
      throw new Error('Memory system not initialized');
    }
    
    // Filter memories by user
    const userMemories = this.episodicMemory.filter(m => m.userId === userId);
    
    // In a real implementation, this would use embeddings and vector similarity
    // For now, we'll use simple keyword matching
    const contextWords = context.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    
    // Score memories by relevance
    const scoredMemories = userMemories.map(memory => {
      const interactionText = this._getInteractionText(memory.interaction);
      const interactionWords = interactionText.toLowerCase().split(/\W+/);
      
      // Count matching words
      let matchScore = 0;
      contextWords.forEach(word => {
        if (interactionWords.includes(word)) {
          matchScore++;
        }
      });
      
      // Consider recency and importance
      const recencyScore = this._calculateRecencyScore(memory.timestamp);
      const totalScore = (matchScore * 0.6) + (memory.importance * 0.3) + (recencyScore * 0.1);
      
      return { memory, score: totalScore };
    });
    
    // Sort by score and take top memories
    const relevantMemories = scoredMemories
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.memory);
      
    // Update retrieval stats for these memories
    relevantMemories.forEach(memory => {
      memory.retrievalCount++;
      memory.lastRetrieved = new Date().toISOString();
    });
    
    return relevantMemories;
  }
  
  /**
   * Get all conversations for a specific user
   */
  getUserConversations(userId) {
    return this.episodicMemory.filter(memory => memory.userId === userId);
  }
  
  /**
   * Extract a simple text representation of an interaction
   */
  _getInteractionText(interaction) {
    if (typeof interaction === 'string') {
      return interaction;
    }
    
    if (interaction.user && interaction.nexus) {
      return `${interaction.user} ${interaction.nexus}`;
    }
    
    return JSON.stringify(interaction);
  }
  
  /**
   * Calculate a simple importance score for a memory
   * This would be more sophisticated in a real implementation
   */
  _calculateImportance(interaction) {
    // For now, just return a random importance
    // In reality, this would evaluate emotional content, rare concepts, etc.
    return Math.random() * 0.5 + 0.5; // Score between 0.5 and 1.0
  }
  
  /**
   * Calculate a recency score (newer = higher score)
   */
  _calculateRecencyScore(timestamp) {
    const memoryDate = new Date(timestamp);
    const now = new Date();
    const ageInDays = (now - memoryDate) / (1000 * 60 * 60 * 24);
    
    // Newer memories get higher scores
    // Score decays over time (1.0 for brand new, approaching 0 for old memories)
    return Math.max(0, 1 - (ageInDays / 30)); // 30 day decay period
  }
  
  /**
   * Extract concepts and entities from a memory
   * This is a placeholder for more sophisticated processing
   */
  _extractSemanticConcepts(memory) {
    // In a real implementation, this would use NLP to extract 
    // entities, concepts, relationships, etc.
    
    // For now, just extract some words as simple concepts
    const text = this._getInteractionText(memory.interaction);
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 5);
    
    words.forEach(word => {
      if (!this.semanticMemory[word]) {
        this.semanticMemory[word] = {
          occurrences: 0,
          firstSeen: memory.timestamp,
          lastSeen: memory.timestamp,
          relatedMemories: []
        };
      }
      
      this.semanticMemory[word].occurrences++;
      this.semanticMemory[word].lastSeen = memory.timestamp;
      
      // Keep track of related memories (avoid duplicates)
      if (!this.semanticMemory[word].relatedMemories.includes(memory.timestamp)) {
        this.semanticMemory[word].relatedMemories.push(memory.timestamp);
      }
    });
  }
}

module.exports = MemorySystem;

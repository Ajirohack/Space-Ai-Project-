// server/memory/memorySystem.js
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Memory System for Project Nexus
 * 
 * This implements a basic but effective memory architecture with:
 * - Episodic Memory: Conversation history and interactions
 * - Working Memory: Recent context to inform responses
 * - Basic memory consolidation
 */
class MemorySystem {
  constructor(config = {}) {
    this.config = {
      dataDir: path.join(__dirname, '..', 'data'),
      episodicMemoryFile: 'episodic-memory.json',
      workingMemoryCapacity: 20,
      semanticMemoryFile: 'semantic-memory.json',
      ...config
    };
    
    this.episodicMemory = [];
    this.workingMemory = [];
    this.semanticMemory = {
      concepts: {},
      relationships: []
    };
    
    this.initialized = false;
  }

  /**
   * Initialize the memory system
   */
  async initialize() {
    try {
      // Ensure data directory exists
      await fs.mkdir(this.config.dataDir, { recursive: true });
      
      // Load episodic memory if file exists
      try {
        const episodicData = await fs.readFile(
          path.join(this.config.dataDir, this.config.episodicMemoryFile),
          'utf8'
        );
        this.episodicMemory = JSON.parse(episodicData);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error('Error loading episodic memory:', error);
        }
        // Initialize empty episodic memory if file doesn't exist
        this.episodicMemory = [];
        await this.saveEpisodicMemory();
      }
      
      // Load semantic memory if file exists
      try {
        const semanticData = await fs.readFile(
          path.join(this.config.dataDir, this.config.semanticMemoryFile),
          'utf8'
        );
        this.semanticMemory = JSON.parse(semanticData);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error('Error loading semantic memory:', error);
        }
        // Initialize empty semantic memory if file doesn't exist
        this.semanticMemory = {
          concepts: {},
          relationships: []
        };
        await this.saveSemanticMemory();
      }
      
      // Initialize working memory from the most recent episodic memories
      this.workingMemory = this.episodicMemory
        .slice(-this.config.workingMemoryCapacity)
        .map(memory => ({ ...memory }));
      
      this.initialized = true;
      console.log('Memory system initialized');
      console.log(`Loaded ${this.episodicMemory.length} episodic memories`);
      console.log(`Loaded ${Object.keys(this.semanticMemory.concepts).length} semantic concepts`);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize memory system:', error);
      return false;
    }
  }

  /**
   * Store a new memory in episodic memory
   * @param {Object} memory - Memory object to store
   */
  async storeMemory(memory) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Generate unique ID for the memory if not provided
    const memoryId = memory.id || crypto.randomUUID();
    
    // Create a formatted memory object
    const formattedMemory = {
      id: memoryId,
      timestamp: memory.timestamp || new Date().toISOString(),
      type: memory.type || 'conversation',
      content: memory.content,
      metadata: memory.metadata || {},
      importance: memory.importance || this.calculateImportance(memory),
      tags: memory.tags || []
    };
    
    // Add to episodic memory
    this.episodicMemory.push(formattedMemory);
    
    // Also add to working memory, removing oldest if at capacity
    this.workingMemory.push({ ...formattedMemory });
    if (this.workingMemory.length > this.config.workingMemoryCapacity) {
      this.workingMemory.shift();
    }
    
    // Extract potential semantic concepts
    this.extractSemanticConcepts(formattedMemory);
    
    // Save to disk
    await this.saveEpisodicMemory();
    
    return memoryId;
  }

  /**
   * Store a conversation message in memory
   * @param {Object} message - Message object with role and content
   * @param {Object} metadata - Additional metadata about the message
   */
  async storeMessage(message, metadata = {}) {
    return this.storeMemory({
      type: 'message',
      content: {
        role: message.role,
        content: message.content
      },
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Retrieve relevant memories based on query
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} - Relevant memories
   */
  retrieveRelevantMemories(query, options = {}) {
    if (!this.initialized) {
      return [];
    }
    
    const {
      limit = 10,
      includeTypes = ['conversation', 'message', 'interaction'],
      excludeTypes = [],
      recency = 0.3, // weight for recency in relevance calculation
      importance = 0.3, // weight for importance in relevance calculation
      similarity = 0.4, // weight for similarity in relevance calculation
    } = options;
    
    // For now, implement a simple relevance algorithm
    // In a more advanced implementation, this would use embeddings and vector similarity
    const memories = this.episodicMemory
      .filter(memory => 
        includeTypes.includes(memory.type) && 
        !excludeTypes.includes(memory.type)
      )
      .map(memory => {
        // Calculate basic text similarity (for demo purposes)
        // In production, use proper embeddings and vector similarity
        const contentString = typeof memory.content === 'string' 
          ? memory.content 
          : JSON.stringify(memory.content);
        
        const simScore = this.calculateSimpleTextSimilarity(query, contentString);
        
        // Calculate recency score (0-1, 1 being most recent)
        const ageInDays = (new Date() - new Date(memory.timestamp)) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.max(0, 1 - (ageInDays / 30)); // Scale to 0-1 over 30 days
        
        // Combine scores with weights
        const relevanceScore = 
          (recency * recencyScore) + 
          (importance * (memory.importance || 0.5)) + 
          (similarity * simScore);
          
        return {
          ...memory,
          relevanceScore
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
    
    return memories;
  }

  /**
   * Get the current working memory
   * @returns {Array} - Working memory contents
   */
  getWorkingMemory() {
    return [...this.workingMemory];
  }

  /**
   * Get the full episodic memory
   * @param {Object} options - Filter options
   * @returns {Array} - Filtered episodic memories
   */
  getEpisodicMemory(options = {}) {
    const {
      limit = 100,
      offset = 0,
      fromDate = null,
      toDate = null,
      types = null,
      sortBy = 'timestamp',
      sortDirection = 'desc'
    } = options;
    
    let memories = [...this.episodicMemory];
    
    // Apply date filters
    if (fromDate) {
      memories = memories.filter(m => new Date(m.timestamp) >= new Date(fromDate));
    }
    
    if (toDate) {
      memories = memories.filter(m => new Date(m.timestamp) <= new Date(toDate));
    }
    
    // Apply type filter
    if (types && Array.isArray(types) && types.length > 0) {
      memories = memories.filter(m => types.includes(m.type));
    }
    
    // Apply sorting
    memories.sort((a, b) => {
      if (sortDirection === 'asc') {
        return a[sortBy] < b[sortBy] ? -1 : 1;
      } else {
        return a[sortBy] > b[sortBy] ? -1 : 1;
      }
    });
    
    // Apply pagination
    return memories.slice(offset, offset + limit);
  }
  
  /**
   * Get semantic memory concepts
   * @param {Array} conceptIds - Optional specific concept IDs to retrieve
   * @returns {Object} - Semantic concepts
   */
  getSemanticConcepts(conceptIds = null) {
    if (!conceptIds) {
      return this.semanticMemory.concepts;
    }
    
    const concepts = {};
    conceptIds.forEach(id => {
      if (this.semanticMemory.concepts[id]) {
        concepts[id] = this.semanticMemory.concepts[id];
      }
    });
    
    return concepts;
  }
  
  /**
   * Extract and store semantic concepts from episodic memory
   * @param {Object} memory - Memory to extract concepts from
   */
  extractSemanticConcepts(memory) {
    // This is a simplified implementation
    // In a production system, this would use NLP to extract entities and concepts
    
    // Extract potential entities from content
    let contentText = '';
    if (typeof memory.content === 'string') {
      contentText = memory.content;
    } else if (memory.content && memory.content.content) {
      contentText = memory.content.content;
    } else {
      contentText = JSON.stringify(memory.content);
    }
    
    // For now, just extract simple entities like names, locations, etc.
    // This is placeholder logic - in production use NER models
    const words = contentText.split(/\s+/);
    const potentialEntities = words.filter(word => 
      word.length > 3 && 
      word[0] === word[0].toUpperCase() &&
      !['The', 'This', 'That', 'These', 'Those', 'When', 'Where', 'What', 'Who', 'Why', 'How'].includes(word)
    );
    
    // Store unique entities
    const uniqueEntities = [...new Set(potentialEntities)];
    uniqueEntities.forEach(entity => {
      const conceptId = entity.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      if (!this.semanticMemory.concepts[conceptId]) {
        // Create new concept
        this.semanticMemory.concepts[conceptId] = {
          id: conceptId,
          name: entity,
          type: 'entity',
          firstMentioned: memory.timestamp,
          lastMentioned: memory.timestamp,
          mentionCount: 1,
          relatedMemories: [memory.id]
        };
      } else {
        // Update existing concept
        const concept = this.semanticMemory.concepts[conceptId];
        concept.lastMentioned = memory.timestamp;
        concept.mentionCount += 1;
        if (!concept.relatedMemories.includes(memory.id)) {
          concept.relatedMemories.push(memory.id);
        }
      }
    });
  }
  
  /**
   * Calculate memory importance score
   * @param {Object} memory - Memory to calculate importance for
   * @returns {number} - Importance score between 0-1
   */
  calculateImportance(memory) {
    // Simple importance heuristic - can be enhanced with ML later
    let score = 0.5; // Default importance
    
    // Increase importance for longer content
    const contentLength = typeof memory.content === 'string' 
      ? memory.content.length 
      : JSON.stringify(memory.content).length;
    
    if (contentLength > 1000) score += 0.2;
    else if (contentLength > 500) score += 0.1;
    
    // Adjust based on type
    if (memory.type === 'interaction') score += 0.1;
    
    // Cap at 0-1 range
    return Math.min(1, Math.max(0, score));
  }
  
  /**
   * Calculate simple text similarity
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} - Similarity score between 0-1
   */
  calculateSimpleTextSimilarity(text1, text2) {
    // This is a very basic implementation
    // In production, use proper embeddings and vector similarity
    
    // Tokenize and normalize
    const tokens1 = text1.toLowerCase().split(/\W+/).filter(t => t.length > 2);
    const tokens2 = text2.toLowerCase().split(/\W+/).filter(t => t.length > 2);
    
    // Count shared tokens
    const set1 = new Set(tokens1);
    const shared = tokens2.filter(token => set1.has(token)).length;
    
    // Calculate Jaccard similarity
    const total = new Set([...tokens1, ...tokens2]).size;
    return total === 0 ? 0 : shared / total;
  }
  
  /**
   * Save episodic memory to disk
   */
  async saveEpisodicMemory() {
    try {
      await fs.writeFile(
        path.join(this.config.dataDir, this.config.episodicMemoryFile),
        JSON.stringify(this.episodicMemory, null, 2),
        'utf8'
      );
      return true;
    } catch (error) {
      console.error('Error saving episodic memory:', error);
      return false;
    }
  }
  
  /**
   * Save semantic memory to disk
   */
  async saveSemanticMemory() {
    try {
      await fs.writeFile(
        path.join(this.config.dataDir, this.config.semanticMemoryFile),
        JSON.stringify(this.semanticMemory, null, 2),
        'utf8'
      );
      return true;
    } catch (error) {
      console.error('Error saving semantic memory:', error);
      return false;
    }
  }
  
  /**
   * Run memory consolidation process
   * This typically runs periodically to organize memories and extract patterns
   */
  async consolidateMemories() {
    console.log('Running memory consolidation...');
    
    // 1. Update importance scores based on patterns
    this.episodicMemory = this.episodicMemory.map(memory => {
      // Recalculate importance based on relations to other memories
      const relatedMemories = this.semanticMemory.concepts;
      let importanceBoost = 0;
      
      Object.values(relatedMemories).forEach(concept => {
        if (concept.relatedMemories.includes(memory.id)) {
          // Boost importance of memories that are referenced by multiple concepts
          importanceBoost += 0.01;
        }
      });
      
      return {
        ...memory,
        importance: Math.min(1, (memory.importance || 0.5) + importanceBoost)
      };
    });
    
    // 2. Identify relationships between concepts
    this.identifyConceptRelationships();
    
    // 3. Save updated memories
    await this.saveEpisodicMemory();
    await this.saveSemanticMemory();
    
    console.log('Memory consolidation complete');
    return true;
  }
  
  /**
   * Identify relationships between concepts in semantic memory
   */
  identifyConceptRelationships() {
    // Get all concepts
    const concepts = Object.values(this.semanticMemory.concepts);
    
    // Reset relationships
    this.semanticMemory.relationships = [];
    
    // Find concepts that co-occur in the same memories
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const concept1 = concepts[i];
        const concept2 = concepts[j];
        
        // Find shared memories
        const sharedMemories = concept1.relatedMemories.filter(id => 
          concept2.relatedMemories.includes(id)
        );
        
        if (sharedMemories.length > 0) {
          this.semanticMemory.relationships.push({
            source: concept1.id,
            target: concept2.id,
            type: 'co-occurrence',
            strength: sharedMemories.length / 
              Math.min(concept1.relatedMemories.length, concept2.relatedMemories.length),
            sharedMemories
          });
        }
      }
    }
  }
  
  /**
   * Prepare context for LLM from memory
   * @param {string} query - Current user query
   * @param {Object} options - Options for context preparation
   * @returns {string} - Formatted context from memory
   */
  prepareContextFromMemory(query, options = {}) {
    const {
      maxTokens = 2000,
      includeWorkingMemory = true,
      includeRelevantMemories = true,
      includeSemanticConcepts = true
    } = options;
    
    let context = '';
    
    // Add working memory if requested
    if (includeWorkingMemory) {
      const recentMessages = this.workingMemory
        .filter(m => m.type === 'message')
        .slice(-5)  // Last 5 messages
        .map(m => {
          const msg = m.content;
          return `${msg.role === 'user' ? 'Human' : 'Nexus'}: ${msg.content}`;
        })
        .join('\n');
      
      if (recentMessages) {
        context += `# Recent Conversation\n${recentMessages}\n\n`;
      }
    }
    
    // Add relevant memories if requested
    if (includeRelevantMemories && query) {
      const relevantMemories = this.retrieveRelevantMemories(query, { limit: 5 });
      if (relevantMemories.length > 0) {
        context += `# Relevant Past Interactions\n`;
        relevantMemories.forEach(memory => {
          // Format based on memory type
          if (memory.type === 'message') {
            const msg = memory.content;
            context += `[${new Date(memory.timestamp).toLocaleString()}] ${msg.role === 'user' ? 'Human' : 'Nexus'}: ${msg.content}\n`;
          } else {
            context += `[${new Date(memory.timestamp).toLocaleString()}] ${memory.type}: ${JSON.stringify(memory.content)}\n`;
          }
        });
        context += '\n';
      }
    }
    
    // Add semantic concepts if requested
    if (includeSemanticConcepts && query) {
      // Extract potential entities from query
      const queryWords = query.split(/\s+/);
      const potentialEntities = queryWords.filter(word => 
        word.length > 3 && 
        word[0] === word[0].toUpperCase()
      );
      
      // Find relevant concepts
      const relevantConcepts = [];
      potentialEntities.forEach(entity => {
        const conceptId = entity.toLowerCase().replace(/[^a-z0-9]/g, '-');
        if (this.semanticMemory.concepts[conceptId]) {
          relevantConcepts.push(this.semanticMemory.concepts[conceptId]);
        }
      });
      
      if (relevantConcepts.length > 0) {
        context += `# Known Entities\n`;
        relevantConcepts.forEach(concept => {
          context += `${concept.name}: Mentioned ${concept.mentionCount} times. First seen: ${new Date(concept.firstMentioned).toLocaleDateString()}\n`;
        });
        context += '\n';
      }
    }
    
    // TODO: Implement token counting and truncation to fit maxTokens
    // For now, we'll use a simple character-based approximation
    if (context.length > maxTokens * 4) {  // Rough approximation: 4 chars per token
      context = context.slice(0, maxTokens * 4) + '...';
    }
    
    return context.trim();
  }
}
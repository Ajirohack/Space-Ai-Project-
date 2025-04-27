# Nexus Control Center: Integrated Implementation Guide

## Executive Summary

This guide integrates the comprehensive Control Center architecture with the detailed backend design, creating a unified system that combines administrative control, AI orchestration, and scalable infrastructure. The system provides invitation-only membership access, intelligent content routing, and a multi-model AI council operating as a unified consciousness.

## System Overview

### Core Architecture Principles

1. **Unified Control Interface**: All services managed through a single administrative dashboard
2. **Membership-Based Access**: Secure invitation-only system with key authentication
3. **Intelligent Content Routing**: Dynamic selection of AI models based on content analysis
4. **AI Agent Council**: Multiple specialized models working as one unified consciousness
5. **Modular Architecture**: Extensible system supporting custom modules and integrations

## Detailed Component Implementation

### 1. API Gateway Layer

```javascript
// server/gateway/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { validateMembershipKey } = require('../middleware/auth');
const { errorHandler } = require('../middleware/errorHandler');
const { requestLogger } = require('../middleware/logger');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use(requestLogger);

// Authentication middleware
app.use('/api/*', validateMembershipKey);

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/content', require('../routes/content'));
app.use('/api/admin', require('../routes/admin'));
app.use('/api/modules', require('../routes/modules'));

// Error handling
app.use(errorHandler);

module.exports = app;
```

### 2. Membership Authentication System

```javascript
// server/services/membership/index.js
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Membership, Invitation } = require('../../models');
const emailService = require('../email');

class MembershipService {
  constructor() {
    this.saltRounds = 10;
    this.invitationExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
  }

  async createInvitation(email, permissions, createdBy) {
    // Generate secure invitation code
    const invitationCode = crypto.randomBytes(32).toString('hex');
    
    // Generate temporary PIN
    const pin = this.generatePin();
    const hashedPin = await bcrypt.hash(pin, this.saltRounds);

    // Create invitation record
    const invitation = await Invitation.create({
      email,
      invitationCode,
      hashedPin,
      permissions,
      createdBy,
      expiresAt: new Date(Date.now() + this.invitationExpiry)
    });

    // Send invitation email
    await emailService.sendInvitation(email, invitationCode, pin);

    return { invitationId: invitation._id, email };
  }

  async activateMembership(email, invitationCode, pin) {
    // Validate invitation
    const invitation = await Invitation.findOne({
      email,
      invitationCode,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Verify PIN
    const pinValid = await bcrypt.compare(pin, invitation.hashedPin);
    if (!pinValid) {
      throw new Error('Invalid PIN');
    }

    // Generate membership key
    const membershipKey = this.generateMembershipKey();

    // Create membership record
    const membership = await Membership.create({
      email,
      membershipKey,
      permissions: invitation.permissions,
      invitedBy: invitation.createdBy,
      lastLogin: new Date()
    });

    // Mark invitation as used
    invitation.used = true;
    await invitation.save();

    return { membershipKey, permissions: membership.permissions };
  }

  generateMembershipKey() {
    return `nexus_${crypto.randomBytes(32).toString('hex')}`;
  }

  generatePin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async validateMembershipKey(membershipKey) {
    const membership = await Membership.findOne({ 
      membershipKey, 
      active: true 
    });

    if (!membership) {
      return null;
    }

    // Update last login
    membership.lastLogin = new Date();
    await membership.save();

    return membership;
  }
}

module.exports = new MembershipService();
```

### 3. Content Router Implementation

```javascript
// server/services/content-router/index.js
const { analyzeContent, detectContentType, assessComplexity } = require('./analyzer');
const modelCouncil = require('../model-council');
const ragSystem = require('../rag');
const moduleRegistry = require('../module-registry');

class ContentRouter {
  async route(message, attachments, user) {
    // Analyze content
    const analysis = await this.analyzeRequest(message, attachments);
    
    // Determine routing based on analysis
    const routingDecision = this.determineRoute(analysis, user);
    
    // Execute routing decision
    return this.executeRoute(routingDecision, { message, attachments, user });
  }

  async analyzeRequest(message, attachments) {
    const contentTypes = await detectContentType(message, attachments);
    const complexity = await assessComplexity(message, contentTypes);
    const priority = this.calculatePriority(complexity, contentTypes);
    
    return {
      contentTypes,
      complexity,
      priority,
      hasCode: contentTypes.includes('code'),
      hasImage: contentTypes.includes('image'),
      requiresReasoning: complexity > 7,
      requiresMultiModal: contentTypes.length > 1
    };
  }

  determineRoute(analysis, user) {
    // Check if user has specific modules enabled
    const userModules = moduleRegistry.getUserModules(user.id);
    
    // Priority routing decisions
    if (analysis.contentTypes.includes('character')) {
      return { type: 'module', moduleId: 'character-archivist' };
    }
    
    if (analysis.requiresMultiModal && analysis.requiresReasoning) {
      return { type: 'council', mode: 'full' };
    }
    
    if (analysis.hasCode) {
      return { type: 'model', modelId: 'code' };
    }
    
    if (analysis.hasImage) {
      return { type: 'model', modelId: 'vision' };
    }
    
    if (analysis.complexity > 7) {
      return { type: 'council', mode: 'reasoning' };
    }
    
    // Default to RAG for simple queries
    return { type: 'rag' };
  }

  async executeRoute(routingDecision, context) {
    switch (routingDecision.type) {
      case 'council':
        return modelCouncil.processWithCouncil(context, routingDecision.mode);
      
      case 'model':
        return modelCouncil.processWithModel(routingDecision.modelId, context);
      
      case 'module':
        return moduleRegistry.executeModule(routingDecision.moduleId, context);
      
      case 'rag':
        return ragSystem.query(context.message, context.user.id);
      
      default:
        throw new Error(`Unknown routing type: ${routingDecision.type}`);
    }
  }

  calculatePriority(complexity, contentTypes) {
    let priority = complexity;
    
    // Adjust priority based on content types
    if (contentTypes.includes('urgent')) priority += 3;
    if (contentTypes.includes('realtime')) priority += 2;
    if (contentTypes.includes('security')) priority += 4;
    
    return Math.min(priority, 10); // Max priority is 10
  }
}

module.exports = new ContentRouter();
```

### 4. AI Agent Council Implementation

```javascript
// server/services/model-council/index.js
const { OpenAI } = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const SharedContext = require('./shared-context');

class AIAgentCouncil {
  constructor() {
    this.models = new Map();
    this.adapters = new Map();
    this.sharedContext = new SharedContext();
    this.initializeModels();
  }

  initializeModels() {
    // Register specialized models
    this.registerModel('reasoning', {
      type: 'anthropic',
      modelId: 'claude-3-sonnet',
      specialization: 'logical reasoning and analysis',
      priority: 1
    });
    
    this.registerModel('vision', {
      type: 'openai',
      modelId: 'gpt-4-vision-preview',
      specialization: 'image understanding and visual analysis',
      priority: 2
    });
    
    this.registerModel('code', {
      type: 'openai',
      modelId: 'gpt-4',
      specialization: 'code generation and technical analysis',
      priority: 2
    });
    
    this.registerModel('creative', {
      type: 'anthropic',
      modelId: 'claude-3-opus',
      specialization: 'creative writing and content generation',
      priority: 3
    });
  }

  registerModel(modelId, config) {
    this.models.set(modelId, config);
    this.adapters.set(modelId, this.createAdapter(config));
  }

  createAdapter(config) {
    switch (config.type) {
      case 'openai':
        return new OpenAIAdapter(config.modelId);
      case 'anthropic':
        return new AnthropicAdapter(config.modelId);
      default:
        throw new Error(`Unknown model type: ${config.type}`);
    }
  }

  async processWithCouncil(context, mode = 'full') {
    const sessionId = this.generateSessionId(context);
    const sharedCtx = this.sharedContext.createSession(sessionId);
    
    // Planning Phase
    const plan = await this.createExecutionPlan(context, mode, sharedCtx);
    
    // Execution Phase
    const results = await this.executePlan(plan, sharedCtx);
    
    // Integration Phase
    const response = await this.integrateResults(results, sharedCtx);
    
    // Cleanup
    this.sharedContext.closeSession(sessionId);
    
    return response;
  }

  async createExecutionPlan(context, mode, sharedCtx) {
    // Analyze the request and determine which models to use
    const plan = {
      steps: [],
      mode,
      priority: context.priority || 5
    };
    
    if (mode === 'full') {
      // Use all models in a coordinated flow
      plan.steps = [
        { modelId: 'reasoning', phase: 'analysis', weight: 0.4 },
        { modelId: 'vision', phase: 'visual', weight: 0.2, condition: context.hasImage },
        { modelId: 'code', phase: 'technical', weight: 0.2, condition: context.hasCode },
        { modelId: 'creative', phase: 'synthesis', weight: 0.2 }
      ];
    } else if (mode === 'reasoning') {
      // Focus on logical reasoning
      plan.steps = [
        { modelId: 'reasoning', phase: 'analysis', weight: 0.7 },
        { modelId: 'code', phase: 'technical', weight: 0.3, condition: context.hasCode }
      ];
    }
    
    // Filter out conditional steps that don't apply
    plan.steps = plan.steps.filter(step => 
      step.condition === undefined || step.condition === true
    );
    
    return plan;
  }

  async executePlan(plan, sharedCtx) {
    const results = [];
    
    for (const step of plan.steps) {
      const model = this.models.get(step.modelId);
      const adapter = this.adapters.get(step.modelId);
      
      // Prepare input with shared context
      const input = this.prepareInput(step, sharedCtx);
      
      // Execute model
      const result = await adapter.execute(input);
      
      // Update shared context
      sharedCtx.addResult(step.modelId, step.phase, result);
      
      results.push({
        modelId: step.modelId,
        phase: step.phase,
        weight: step.weight,
        result
      });
    }
    
    return results;
  }

  async integrateResults(results, sharedCtx) {
    // Use a integration model to combine all results
    const integrationInput = {
      results,
      context: sharedCtx.getFullContext(),
      prompt: this.getIntegrationPrompt()
    };
    
    const integrationModel = this.adapters.get('reasoning');
    const finalResponse = await integrationModel.execute(integrationInput);
    
    return {
      response: finalResponse,
      metadata: {
        modelsUsed: results.map(r => r.modelId),
        confidenceScore: this.calculateConfidence(results),
        processingTime: sharedCtx.getProcessingTime()
      }
    };
  }

  generateSessionId(context) {
    return `${context.user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  prepareInput(step, sharedCtx) {
    const previousResults = sharedCtx.getResults();
    
    return {
      message: sharedCtx.originalRequest.message,
      attachments: sharedCtx.originalRequest.attachments,
      phase: step.phase,
      specialization: this.models.get(step.modelId).specialization,
      previousAnalysis: previousResults,
      systemPrompt: this.getSystemPromptForPhase(step.phase)
    };
  }

  getSystemPromptForPhase(phase) {
    const prompts = {
      analysis: "Analyze the request comprehensively, identifying key requirements and potential challenges.",
      visual: "Focus on visual elements, describing what you see and its relevance to the request.",
      technical: "Provide technical analysis, code examples if relevant, and implementation considerations.",
      synthesis: "Synthesize all analyses into a coherent, actionable response that addresses the original request."
    };
    
    return prompts[phase] || "Process the request according to your specialization.";
  }

  getIntegrationPrompt() {
    return `You are the integration layer of an AI council. Your task is to combine the analyses from 
    multiple specialized models into a single, coherent response. Ensure the response maintains a 
    consistent voice and addresses all aspects of the original request. Do not mention the different 
    models explicitly - present the response as from a unified intelligence.`;
  }

  calculateConfidence(results) {
    // Weighted average of confidence scores from each model
    let totalWeight = 0;
    let weightedScore = 0;
    
    results.forEach(result => {
      if (result.result.confidence) {
        weightedScore += result.result.confidence * result.weight;
        totalWeight += result.weight;
      }
    });
    
    return totalWeight > 0 ? weightedScore / totalWeight : 0.5;
  }
}

// Model Adapter Classes
class OpenAIAdapter {
  constructor(modelId) {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.modelId = modelId;
  }

  async execute(input) {
    const response = await this.client.chat.completions.create({
      model: this.modelId,
      messages: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: this.formatInput(input) }
      ],
      temperature: 0.7
    });
    
    return {
      content: response.choices[0].message.content,
      confidence: this.calculateConfidence(response)
    };
  }

  formatInput(input) {
    if (input.previousAnalysis && input.previousAnalysis.length > 0) {
      return `Previous Analysis: ${JSON.stringify(input.previousAnalysis)}\n\nRequest: ${input.message}`;
    }
    return input.message;
  }

  calculateConfidence(response) {
    // Simple confidence based on model's response characteristics
    return 0.8; // Default confidence
  }
}

class AnthropicAdapter {
  constructor(modelId) {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.modelId = modelId;
  }

  async execute(input) {
    const response = await this.client.messages.create({
      model: this.modelId,
      max_tokens: 4096,
      messages: [{ role: 'user', content: input.message }],
      system: input.systemPrompt
    });
    
    return {
      content: response.content[0].text,
      confidence: 0.85 // Default confidence for Claude models
    };
  }
}

module.exports = new AIAgentCouncil();
```

### 5. RAG System Integration

```javascript
// server/services/rag/index.js
const { Pinecone } = require('@pinecone-database/pinecone');
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { Document } = require('langchain/document');

class RAGSystem {
  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT
    });
    
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    });
    
    this.indexName = process.env.PINECONE_INDEX_NAME;
    this.globalNamespace = 'global';
  }

  async initialize() {
    // Ensure index exists
    const indexList = await this.pinecone.listIndexes();
    if (!indexList.includes(this.indexName)) {
      await this.pinecone.createIndex({
        name: this.indexName,
        dimension: 1536, // OpenAI embeddings dimension
        metric: 'cosine'
      });
    }
  }

  async indexDocument(document, namespace = this.globalNamespace) {
    const index = this.pinecone.Index(this.indexName);
    
    // Generate embeddings for the document
    const vector = await this.embeddings.embedQuery(document.content);
    
    // Upsert to Pinecone
    await index.upsert({
      vectors: [{
        id: document.id,
        values: vector,
        metadata: {
          title: document.title,
          content: document.content,
          source: document.source,
          timestamp: new Date().toISOString(),
          ...document.metadata
        }
      }],
      namespace
    });
  }

  async query(question, userId) {
    const index = this.pinecone.Index(this.indexName);
    
    // Generate query embedding
    const queryVector = await this.embeddings.embedQuery(question);
    
    // Search in both user namespace and global namespace
    const [userResults, globalResults] = await Promise.all([
      index.query({
        vector: queryVector,
        topK: 5,
        includeMetadata: true,
        namespace: `user_${userId}`
      }),
      index.query({
        vector: queryVector,
        topK: 5,
        includeMetadata: true,
        namespace: this.globalNamespace
      })
    ]);
    
    // Combine and deduplicate results
    const combinedResults = this.combineResults(userResults, globalResults);
    
    // Format results for LLM consumption
    const documents = combinedResults.map(match => new Document({
      pageContent: match.metadata.content,
      metadata: match.metadata
    }));
    
    // Generate response using retrieved documents
    const response = await this.generateResponseWithContext(question, documents);
    
    return {
      answer: response,
      sources: documents.map(doc => ({
        title: doc.metadata.title,
        source: doc.metadata.source
      }))
    };
  }

  combineResults(userResults, globalResults) {
    const combinedMap = new Map();
    
    // Add user results first (higher priority)
    userResults.matches.forEach(match => {
      combinedMap.set(match.id, { ...match, priority: 1 });
    });
    
    // Add global results (lower priority)
    globalResults.matches.forEach(match => {
      if (!combinedMap.has(match.id)) {
        combinedMap.set(match.id, { ...match, priority: 2 });
      }
    });
    
    // Sort by score and priority
    return Array.from(combinedMap.values())
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.score - a.score;
      })
      .slice(0, 5);
  }

  async generateResponseWithContext(question, documents) {
    // This would ideally use a dedicated LLM for generation
    const context = documents.map(doc => doc.pageContent).join('\n\n');
    
    const prompt = `Context:\n${context}\n\nQuestion: ${question}\n\nPlease provide a comprehensive answer based on the given context.`;
    
    // For now, return a placeholder
    // In production, this would call an LLM
    return {
      content: `Based on the provided context, here's the answer to your question...`,
      confidence: 0.9
    };
  }
}

module.exports = new RAGSystem();
```

### 6. Module Registry and Character Archivist

```javascript
// server/services/module-registry/index.js
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class ModuleRegistry extends EventEmitter {
  constructor() {
    super();
    this.modules = new Map();
    this.instances = new Map();
    this.userModuleAssignments = new Map();
  }

  async registerModule(modulePath) {
    try {
      // Dynamically import the module
      const moduleExports = require(modulePath);
      
      // Validate module interface
      if (!this.validateModuleInterface(moduleExports)) {
        throw new Error(`Invalid module interface: ${modulePath}`);
      }
      
      const moduleId = moduleExports.metadata.id;
      
      // Store module definition
      this.modules.set(moduleId, {
        path: modulePath,
        metadata: moduleExports.metadata,
        status: 'registered',
        exports: moduleExports
      });
      
      this.emit('moduleRegistered', moduleId);
      
      return moduleId;
    } catch (error) {
      console.error(`Failed to register module: ${modulePath}`, error);
      throw error;
    }
  }

  validateModuleInterface(moduleExports) {
    return (
      moduleExports.metadata &&
      moduleExports.metadata.id &&
      moduleExports.metadata.version &&
      typeof moduleExports.initialize === 'function' &&
      typeof moduleExports.execute === 'function'
    );
  }

  async initializeModule(moduleId, config = {}) {
    const module = this.modules.get(moduleId);
    
    if (!module) {
      throw new Error(`Module not found: ${moduleId}`);
    }
    
    try {
      // Initialize the module
      const instance = await module.exports.initialize(config);
      
      // Store the instance
      this.instances.set(moduleId, instance);
      module.status = 'initialized';
      
      this.emit('moduleInitialized', moduleId);
      
      return instance;
    } catch (error) {
      module.status = 'failed';
      module.error = error.message;
      throw error;
    }
  }

  async executeModule(moduleId, context) {
    const instance = this.instances.get(moduleId);
    
    if (!instance) {
      throw new Error(`Module not initialized: ${moduleId}`);
    }
    
    try {
      const result = await instance.execute(context);
      
      this.emit('moduleExecuted', {
        moduleId,
        userId: context.user.id,
        executionTime: Date.now()
      });
      
      return result;
    } catch (error) {
      console.error(`Module execution failed: ${moduleId}`, error);
      throw error;
    }
  }

  assignModuleToUser(userId, moduleId) {
    if (!this.userModuleAssignments.has(userId)) {
      this.userModuleAssignments.set(userId, new Set());
    }
    
    this.userModuleAssignments.get(userId).add(moduleId);
    this.emit('moduleAssigned', { userId, moduleId });
  }

  getUserModules(userId) {
    return Array.from(this.userModuleAssignments.get(userId) || []);
  }
}

// Character Archivist Module Implementation
const CharacterArchivistModule = {
  metadata: {
    id: 'character-archivist',
    version: '1.0.0',
    name: 'Character Archivist',
    description: 'Manages character personas and maintains consistent behavior'
  },
  
  async initialize(config) {
    const instance = {
      config,
      knowledgeBases: {},
      characterTraits: {},
      systemPrompt: await fs.readFile(config.systemPromptPath, 'utf8')
    };
    
    // Load character knowledge bases
    if (config.knowledgeBasePaths) {
      for (const [characterName, path] of Object.entries(config.knowledgeBasePaths)) {
        instance.knowledgeBases[characterName] = await fs.readFile(path, 'utf8');
      }
    }
    
    return instance;
  },
  
  async execute(context) {
    const { message, user, characterName } = context;
    
    // Build character-specific context
    const characterContext = this.buildCharacterContext(characterName);
    
    // Retrieve relevant knowledge
    const relevantKnowledge = await this.retrieveCharacterKnowledge(message, characterName);
    
    // Generate in-character response
    const response = await this.generateCharacterResponse(
      message,
      characterContext,
      relevantKnowledge
    );
    
    return {
      response: response.content,
      metadata: {
        characterName,
        sourcesUsed: relevantKnowledge.sources,
        confidence: response.confidence
      }
    };
  }
};

module.exports = {
  ModuleRegistry: new ModuleRegistry(),
  CharacterArchivistModule
};
```

### 7. Admin Control Center React Component

```javascript
// client/src/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { LineChart, BarChart, PieChart } from 'recharts';
import SystemMetrics from './components/SystemMetrics';
import ModelPerformance from './components/ModelPerformance';
import MembershipManager from './components/MembershipManager';
import ModuleConfiguration from './components/ModuleConfiguration';
import AdminAPI from '../services/adminApi';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await AdminAPI.getDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Set up real-time updates
    const ws = new WebSocket(process.env.REACT_APP_WS_URL);
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      if (update.type === 'metrics') {
        setMetrics(prev => ({ ...prev, ...update.data }));
      }
    };
    
    return () => ws.close();
  }, []);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="admin-dashboard">
      <Typography variant="h4" gutterBottom>
        Nexus Control Center
      </Typography>
      
      <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
        <Tab label="Overview" value="overview" />
        <Tab label="Models" value="models" />
        <Tab label="Users" value="users" />
        <Tab label="Modules" value="modules" />
        <Tab label="System" value="system" />
      </Tabs>
      
      {selectedTab === 'overview' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">System Status</Typography>
                <SystemMetrics data={metrics.system} />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Model Performance</Typography>
                <ModelPerformance data={metrics.models} />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6">Active Users</Typography>
                <LineChart
                  width={800}
                  height={300}
                  data={metrics.userActivity}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="time" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" />
                  <Line type="monotone" dataKey="requests" stroke="#82ca9d" />
                </LineChart>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {selectedTab === 'models' && (
        <ModelManagement 
          models={metrics.models} 
          onUpdateConfig={handleModelConfigUpdate}
        />
      )}
      
      {selectedTab === 'users' && (
        <MembershipManager 
          memberships={metrics.memberships}
          onCreateInvitation={handleCreateInvitation}
        />
      )}
      
      {selectedTab === 'modules' && (
        <ModuleConfiguration 
          modules={metrics.modules}
          onRegisterModule={handleRegisterModule}
          onAssignModule={handleAssignModule}
        />
      )}
      
      {selectedTab === 'system' && (
        <SystemConfiguration 
          config={metrics.systemConfig}
          logs={metrics.logs}
          onUpdateConfig={handleSystemConfigUpdate}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
```

### 8. Database Models

```javascript
// server/models/index.js
const mongoose = require('mongoose');

// Membership Schema
const membershipSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  membershipKey: { 
    type: String, 
    required: true, 
    unique: true 
  },
  permissions: [{
    type: String,
    enum: ['admin', 'user', 'module_access', 'premium_models']
  }],
  modules: [{
    moduleId: String,
    enabled: Boolean,
    config: mongoose.Schema.Types.Mixed
  }],
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership'
  },
  lastLogin: Date,
  active: {
    type: Boolean,
    default: true
  },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Invitation Schema
const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  invitationCode: {
    type: String,
    required: true,
    unique: true
  },
  hashedPin: {
    type: String,
    required: true
  },
  permissions: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership'
  },
  used: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership'
  },
  action: {
    type: String,
    required: true
  },
  resourceType: String,
  resourceId: String,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String
}, { timestamps: true });

// Model Performance Metrics Schema
const modelMetricsSchema = new mongoose.Schema({
  modelId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  responseTime: Number,
  tokenCount: Number,
  confidenceScore: Number,
  errorCount: Number,
  metadata: mongoose.Schema.Types.Mixed
});

module.exports = {
  Membership: mongoose.model('Membership', membershipSchema),
  Invitation: mongoose.model('Invitation', invitationSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
  ModelMetrics: mongoose.model('ModelMetrics', modelMetricsSchema)
};
```

## Deployment Architecture

### Docker Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  api-gateway:
    build:
      context: ./server
      dockerfile: Dockerfile.gateway
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - mongodb
      - redis
      - rabbitmq
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure

  ai-council:
    build:
      context: ./server
      dockerfile: Dockerfile.council
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - redis
      - rabbitmq
    deploy:
      replicas: 2
      resources:
        reservations:
          devices:
            - capabilities: [gpu]

  rag-system:
    build:
      context: ./server
      dockerfile: Dockerfile.rag
    environment:
      - PINECONE_API_KEY=${PINECONE_API_KEY}
      - PINECONE_ENVIRONMENT=${PINECONE_ENVIRONMENT}
    depends_on:
      - mongodb
      - redis

  admin-dashboard:
    build:
      context: ./client
      dockerfile: Dockerfile.admin
    ports:
      - "3002:3002"
    environment:
      - REACT_APP_API_URL=${API_URL}
      - REACT_APP_WS_URL=${WS_URL}

  mongodb:
    image: mongo:6.0
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  mongodb_data:
  redis_data:
  rabbitmq_data:
```

## Monitoring and Observability

```javascript
// server/monitoring/index.js
const prometheus = require('prom-client');
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

// Prometheus metrics
const httpRequestDurationMicroseconds = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const modelExecutionTime = new prometheus.Histogram({
  name: 'model_execution_duration_seconds',
  help: 'Time spent executing AI models',
  labelNames: ['model_id', 'model_type'],
  buckets: [0.5, 1, 2, 5, 10, 30]
});

const activeUsers = new prometheus.Gauge({
  name: 'active_users_total',
  help: 'Number of currently active users'
});

// Winston logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: { node: process.env.ELASTICSEARCH_URL }
    })
  ]
});

// Middleware for request tracking
const requestTracker = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    httpRequestDurationMicroseconds.observe(
      {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode
      },
      duration / 1000
    );
    
    logger.info('Request processed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id
    });
  
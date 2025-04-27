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
    const plan = await this.createExecutionPlan(context, mode, sharedCtx);
    const results = await this.executePlan(plan, sharedCtx);
    const response = await this.integrateResults(results, sharedCtx);
    this.sharedContext.closeSession(sessionId);
    return response;
  }

  async createExecutionPlan(context, mode, sharedCtx) {
    const plan = {
      steps: [],
      mode,
      priority: context.priority || 5
    };
    if (mode === 'full') {
      plan.steps = [
        { modelId: 'reasoning', phase: 'analysis', weight: 0.4 },
        { modelId: 'vision', phase: 'visual', weight: 0.2, condition: context.hasImage },
        { modelId: 'code', phase: 'technical', weight: 0.2, condition: context.hasCode },
        { modelId: 'creative', phase: 'synthesis', weight: 0.2 }
      ];
    } else if (mode === 'reasoning') {
      plan.steps = [
        { modelId: 'reasoning', phase: 'analysis', weight: 0.7 },
        { modelId: 'code', phase: 'technical', weight: 0.3, condition: context.hasCode }
      ];
    }
    plan.steps = plan.steps.filter(step => step.condition === undefined || step.condition === true);
    return plan;
  }

  async executePlan(plan, sharedCtx) {
    const results = [];
    for (const step of plan.steps) {
      const model = this.models.get(step.modelId);
      const adapter = this.adapters.get(step.modelId);
      const input = this.prepareInput(step, sharedCtx);
      const result = await adapter.execute(input);
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
    return `You are the integration layer of an AI council. Your task is to combine the analyses from \
    multiple specialized models into a single, coherent response. Ensure the response maintains a \
    consistent voice and addresses all aspects of the original request. Do not mention the different \
    models explicitly - present the response as from a unified intelligence.`;
  }

  calculateConfidence(results) {
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
    return 0.8;
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
      confidence: 0.85
    };
  }
}

module.exports = new AIAgentCouncil();

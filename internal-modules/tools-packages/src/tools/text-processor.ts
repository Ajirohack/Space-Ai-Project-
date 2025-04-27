import { BaseTool } from '../base-tool';
import { ToolDefinition } from '../types';

const textProcessorDefinition: ToolDefinition = {
  id: 'text-processor',
  name: 'Text Processor',
  description: 'Basic text processing operations like counting words, characters, etc.',
  version: '1.0.0',
  category: 'text',
  capabilities: ['text-analysis'],
  inputs: [
    {
      name: 'text',
      type: 'string',
      description: 'The text to process',
      required: true
    },
    {
      name: 'operation',
      type: 'string',
      description: 'The operation to perform (wordCount, charCount, lineCount)',
      required: true
    }
  ],
  outputs: [
    {
      type: 'object',
      description: 'Analysis results',
      schema: {
        type: 'object',
        properties: {
          count: { type: 'number' },
          operation: { type: 'string' }
        }
      }
    }
  ]
};

export class TextProcessor extends BaseTool {
  constructor() {
    super(textProcessorDefinition);
  }

  protected async runTool(inputs: Record<string, any>): Promise<any> {
    const { text, operation } = inputs;

    switch (operation) {
      case 'wordCount':
        return {
          count: text.trim().split(/\s+/).length,
          operation: 'wordCount'
        };
      
      case 'charCount':
        return {
          count: text.length,
          operation: 'charCount'
        };

      case 'lineCount':
        return {
          count: text.split('\n').length,
          operation: 'lineCount'
        };

      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  async validate(inputs: Record<string, any>): Promise<boolean> {
    if (!await super.validate?.(inputs)) {
      return false;
    }

    // Additional validation
    const validOperations = ['wordCount', 'charCount', 'lineCount'];
    return typeof inputs.text === 'string' && 
           validOperations.includes(inputs.operation);
  }
}
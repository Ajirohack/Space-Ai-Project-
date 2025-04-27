import { Tool, ToolExecutionResult, ToolDefinition } from './types';

export class ExampleTool implements Tool {
  private readonly definition: ToolDefinition = {
    id: 'example-calculator',
    name: 'Example Calculator',
    version: '1.0.0',
    description: 'A simple calculator tool for demonstration',
    author: 'System',
    requirements: {
      resources: {
        cpu: '0.1',
        memory: '128m'
      },
      permissions: ['execute'],
      envVars: ['NODE_ENV']
    },
    schema: {
      input: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['add', 'subtract', 'multiply', 'divide']
          },
          a: { type: 'number' },
          b: { type: 'number' }
        },
        required: ['operation', 'a', 'b']
      },
      output: {
        type: 'object',
        properties: {
          result: { type: 'number' }
        }
      }
    }
  };

  // Optional persistent files for the tool
  public persistentFiles = {
    'history.json': '[]' // Initialize empty history array
  };

  async execute(input: any): Promise<ToolExecutionResult> {
    try {
      // Validate input matches schema
      this.validateInput(input);

      // Perform calculation
      let result: number;
      switch (input.operation) {
        case 'add':
          result = input.a + input.b;
          break;
        case 'subtract':
          result = input.a - input.b;
          break;
        case 'multiply':
          result = input.a * input.b;
          break;
        case 'divide':
          if (input.b === 0) {
            throw new Error('Division by zero');
          }
          result = input.a / input.b;
          break;
        default:
          throw new Error(`Unknown operation: ${input.operation}`);
      }

      // Try to update history if we have access to persistent storage
      try {
        const fs = require('fs');
        const historyPath = '/data/history.json';
        const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        history.push({
          timestamp: new Date().toISOString(),
          operation: input.operation,
          a: input.a,
          b: input.b,
          result
        });
        // Keep only last 100 operations
        if (history.length > 100) {
          history.shift();
        }
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
      } catch (error) {
        // Ignore history update errors - persistence is optional
      }

      return {
        success: true,
        data: { result }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'CALCULATION_ERROR',
          details: { input }
        }
      };
    }
  }

  private validateInput(input: any): void {
    const { operation, a, b } = input;
    
    if (!operation || !['add', 'subtract', 'multiply', 'divide'].includes(operation)) {
      throw new Error('Invalid operation');
    }
    
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Operands must be numbers');
    }
  }

  serialize(): string {
    // Return the tool's code as a string for Docker execution
    return `
      ${this.validateInput.toString()}
      
      const tool = {
        persistentFiles: ${JSON.stringify(this.persistentFiles)},
        execute: ${this.execute.toString()}
      };
    `;
  }

  getDefinition(): ToolDefinition {
    return this.definition;
  }
}
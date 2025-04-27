import { Tool, ToolDefinition, ExecutionResult } from './types';
import { validateToolDefinition } from './validation';
import { performance } from 'perf_hooks';

/**
 * Abstract base class for implementing tools
 */
export abstract class BaseTool implements Tool {
  constructor(protected readonly definition: ToolDefinition) {
    const validationResult = validateToolDefinition(definition);
    if (!validationResult.valid) {
      throw new Error(`Invalid tool definition: ${validationResult.errors.join(', ')}`);
    }
  }

  get definition(): ToolDefinition {
    return this.definition;
  }

  /**
   * Execute the tool with the given inputs
   */
  async execute(inputs: Record<string, any>): Promise<ExecutionResult> {
    const startTime = performance.now();
    let memoryBefore = process.memoryUsage().heapUsed;

    try {
      // Validate inputs if validation method is implemented
      if (this.validate && !(await this.validate(inputs))) {
        throw new Error('Input validation failed');
      }

      // Execute the tool-specific implementation
      const result = await this.runTool(inputs);

      // Calculate metrics
      const executionTime = performance.now() - startTime;
      const memoryUsage = process.memoryUsage().heapUsed - memoryBefore;

      return {
        success: true,
        data: result,
        metrics: {
          executionTime,
          memoryUsage
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metrics: {
          executionTime: performance.now() - startTime,
          memoryUsage: process.memoryUsage().heapUsed - memoryBefore
        }
      };
    }
  }

  /**
   * Validate inputs before execution
   * Override this method to implement custom validation
   */
  async validate?(inputs: Record<string, any>): Promise<boolean> {
    // Default implementation checks for required inputs
    return this.definition.inputs
      .filter(input => input.required)
      .every(input => inputs[input.name] !== undefined);
  }

  /**
   * Clean up any resources used by the tool
   * Override this method if cleanup is needed
   */
  async cleanup?(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Tool-specific implementation
   * Must be implemented by concrete tool classes
   */
  protected abstract runTool(inputs: Record<string, any>): Promise<any>;
}
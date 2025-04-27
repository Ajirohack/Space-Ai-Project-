import { ToolDefinition, ToolInput, ToolOutput } from './types';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a tool input definition
 */
function validateInput(input: ToolInput): ValidationResult {
  const errors: string[] = [];

  if (!input.name) errors.push('Input name is required');
  if (!input.type) errors.push('Input type is required');
  if (!input.description) errors.push('Input description is required');
  if (typeof input.required !== 'boolean') errors.push('Input required field must be a boolean');

  if (input.schema && typeof input.schema !== 'object') {
    errors.push('Input schema must be an object if provided');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates a tool output definition
 */
function validateOutput(output: ToolOutput): ValidationResult {
  const errors: string[] = [];

  if (!output.type) errors.push('Output type is required');
  if (!output.description) errors.push('Output description is required');

  if (output.schema && typeof output.schema !== 'object') {
    errors.push('Output schema must be an object if provided');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates a complete tool definition
 */
export function validateToolDefinition(definition: ToolDefinition): ValidationResult {
  const errors: string[] = [];

  // Validate required metadata
  if (!definition.id) errors.push('Tool ID is required');
  if (!definition.name) errors.push('Tool name is required');
  if (!definition.description) errors.push('Tool description is required');
  if (!definition.version) errors.push('Tool version is required');

  // Validate version format (semver)
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
  if (!semverRegex.test(definition.version)) {
    errors.push('Tool version must be in semantic versioning format (e.g., 1.0.0)');
  }

  // Validate arrays
  if (definition.tags && !Array.isArray(definition.tags)) {
    errors.push('Tool tags must be an array if provided');
  }
  if (definition.capabilities && !Array.isArray(definition.capabilities)) {
    errors.push('Tool capabilities must be an array if provided');
  }

  // Validate inputs
  if (!Array.isArray(definition.inputs)) {
    errors.push('Tool inputs must be an array');
  } else {
    definition.inputs.forEach((input, index) => {
      const inputValidation = validateInput(input);
      if (!inputValidation.valid) {
        errors.push(`Input ${index} (${input.name || 'unnamed'}): ${inputValidation.errors.join(', ')}`);
      }
    });
  }

  // Validate outputs
  if (!Array.isArray(definition.outputs)) {
    errors.push('Tool outputs must be an array');
  } else {
    definition.outputs.forEach((output, index) => {
      const outputValidation = validateOutput(output);
      if (!outputValidation.valid) {
        errors.push(`Output ${index}: ${outputValidation.errors.join(', ')}`);
      }
    });
  }

  // Validate resource requirements if present
  if (definition.resourceRequirements) {
    const { memory, cpu, gpuRequired } = definition.resourceRequirements;
    
    if (memory && !/^\d+[KMG]B$/.test(memory)) {
      errors.push('Memory requirement must be in format: {number}[K|M|G]B');
    }
    
    if (cpu && !/^\d+(\.\d+)?$/.test(cpu)) {
      errors.push('CPU requirement must be a number');
    }

    if (gpuRequired !== undefined && typeof gpuRequired !== 'boolean') {
      errors.push('gpuRequired must be a boolean if specified');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
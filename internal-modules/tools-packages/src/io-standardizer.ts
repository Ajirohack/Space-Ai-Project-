// IO standardizer for validating and normalizing tool inputs and outputs
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { ToolSchema } from './types';
import { ErrorSeverity } from './error-handler';

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

interface TransformOptions {
  stripAdditional?: boolean;
  coerceTypes?: boolean;
  removeUndefined?: boolean;
}

export class IOStandardizer {
  private readonly ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      useDefaults: true,
      coerceTypes: true,
      removeAdditional: 'all',
    });

    // Add common formats like date-time, email, etc.
    addFormats(this.ajv);

    // Add custom formats if needed
    this.addCustomFormats();
  }

  /**
   * Validate input against schema
   */
  validateInput(input: any, schema: ToolSchema['input']): ValidationResult {
    return this.validate(input, schema);
  }

  /**
   * Validate output against schema
   */
  validateOutput(output: any, schema: ToolSchema['output']): ValidationResult {
    return this.validate(output, schema);
  }

  /**
   * Transform input to match schema (coerce types, remove additional properties, etc.)
   */
  transformInput(input: any, schema: ToolSchema['input'], options?: TransformOptions): any {
    return this.transform(input, schema, options);
  }

  /**
   * Transform output to match schema
   */
  transformOutput(output: any, schema: ToolSchema['output'], options?: TransformOptions): any {
    return this.transform(output, schema, options);
  }

  /**
   * General validation function
   */
  private validate(data: any, schema: any): ValidationResult {
    const validate = this.ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
      const errors =
        validate.errors?.map(err => {
          const path = err.instancePath || '';
          return `${path} ${err.message}`;
        }) || [];

      return { valid: false, errors };
    }

    return { valid: true };
  }

  /**
   * Transform data according to schema
   */
  private transform(data: any, schema: any, options?: TransformOptions): any {
    const ajv = new Ajv({
      allErrors: true,
      useDefaults: true,
      coerceTypes: options?.coerceTypes !== false,
      removeAdditional: options?.stripAdditional !== false ? 'all' : false,
    });

    // Add common formats
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const clonedData = JSON.parse(JSON.stringify(data));
    validate(clonedData);

    // Handle removeUndefined option
    if (options?.removeUndefined) {
      this.removeUndefinedValues(clonedData);
    }

    return clonedData;
  }

  /**
   * Remove undefined values recursively
   */
  private removeUndefinedValues(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedValues(item));
    }

    const result: Record<string, any> = {};

    for (const key of Object.keys(obj)) {
      if (obj[key] === undefined) {
        continue;
      }

      result[key] = this.removeUndefinedValues(obj[key]);
    }

    return result;
  }

  /**
   * Register custom formats for validation
   */
  private addCustomFormats(): void {
    // Custom format for semantic version
    this.ajv.addFormat('semver', {
      type: 'string',
      validate: (data: string) => {
        return /^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/.test(
          data
        );
      },
    });

    // Custom format for tool IDs
    this.ajv.addFormat('tool-id', {
      type: 'string',
      validate: (data: string) => {
        return /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*$/.test(data);
      },
    });

    // Custom format for file paths
    this.ajv.addFormat('file-path', {
      type: 'string',
      validate: (data: string) => {
        // Basic file path validation (could be enhanced for platform-specific rules)
        return !/[<>:"|?*]/.test(data);
      },
    });
  }

  /**
   * Generate validation error report
   */
  formatValidationErrors(
    errors: string[],
    severity: ErrorSeverity = ErrorSeverity.HIGH
  ): {
    message: string;
    details: {
      errors: string[];
      severity: ErrorSeverity;
    };
  } {
    return {
      message: `Validation failed with ${errors.length} errors`,
      details: {
        errors,
        severity,
      },
    };
  }
}

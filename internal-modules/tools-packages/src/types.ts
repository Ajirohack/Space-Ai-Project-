export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

export interface Tool {
  execute(input: any): Promise<ToolExecutionResult>;
  serialize(): string;
  persistentFiles?: { [path: string]: string };
}

export interface ToolResource {
  cpu: string;
  memory: string;
  storage?: string;
  network?: {
    ingress?: number;
    egress?: number;
  };
}

export interface ToolRequirements {
  resources: ToolResource;
  permissions?: string[];
  capabilities?: string[];
  envVars?: string[];
}

export interface ToolSchema {
  input: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
  output: {
    type: string;
    properties?: Record<string, any>;
  };
}

export interface ToolDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  requirements: ToolRequirements;
  schema: ToolSchema;
  dependencies?: { [key: string]: string };
  tags?: string[];
}
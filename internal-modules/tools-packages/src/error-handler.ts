// Error handler for tracking, logging, and responding to errors in the tools system
import { EventEmitter } from 'events';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  code: string;
  severity: ErrorSeverity;
  toolId?: string;
  containerId?: string;
  timestamp: number;
  details?: any;
}

export interface ErrorRecord extends ErrorContext {
  error: Error;
  message: string;
  stack?: string;
  handled: boolean;
}

export class ErrorHandler extends EventEmitter {
  private errors: ErrorRecord[] = [];
  private readonly maxErrors: number;
  private readonly criticalErrorTTL: number; // Time in ms for considering an error "recent"

  constructor(maxErrors: number = 1000, criticalErrorTTL: number = 30 * 60 * 1000) {
    super();
    this.maxErrors = maxErrors;
    this.criticalErrorTTL = criticalErrorTTL;
  }

  /**
   * Handle an error and emit appropriate events
   */
  handleError(error: Error, context: Omit<ErrorContext, 'timestamp'>): void {
    // Create the full error record
    const errorRecord: ErrorRecord = {
      ...context,
      error,
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      handled: false,
    };

    // Add to error list
    this.errors.push(errorRecord);

    // Trim errors if we have too many
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Emit events based on severity
    this.emit('error', errorRecord);

    switch (context.severity) {
      case ErrorSeverity.LOW:
        this.emit('low-error', errorRecord);
        break;
      case ErrorSeverity.MEDIUM:
        this.emit('medium-error', errorRecord);
        break;
      case ErrorSeverity.HIGH:
        this.emit('high-error', errorRecord);
        break;
      case ErrorSeverity.CRITICAL:
        this.emit('critical-error', errorRecord);
        break;
    }

    // Log the error
    this.logError(errorRecord);

    // Mark as handled
    errorRecord.handled = true;
  }

  /**
   * Check if there have been any critical errors within the TTL period
   */
  hasRecentCriticalErrors(): boolean {
    const now = Date.now();
    const recentCriticalTime = now - this.criticalErrorTTL;

    return this.errors.some(
      error => error.severity === ErrorSeverity.CRITICAL && error.timestamp >= recentCriticalTime
    );
  }

  /**
   * Get errors filtered by various criteria
   */
  getErrors(
    options: {
      severity?: ErrorSeverity;
      toolId?: string;
      containerId?: string;
      code?: string;
      since?: number;
      limit?: number;
    } = {}
  ): ErrorRecord[] {
    let filtered = this.errors;

    if (options.severity) {
      filtered = filtered.filter(error => error.severity === options.severity);
    }

    if (options.toolId) {
      filtered = filtered.filter(error => error.toolId === options.toolId);
    }

    if (options.containerId) {
      filtered = filtered.filter(error => error.containerId === options.containerId);
    }

    if (options.code) {
      filtered = filtered.filter(error => error.code === options.code);
    }

    if (options.since) {
      filtered = filtered.filter(error => error.timestamp >= options.since);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit if specified
    if (options.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Get error statistics
   */
  getErrorStats(since?: number): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCode: Record<string, number>;
    byTool: Record<string, number>;
    recentCritical: boolean;
  } {
    const stats = {
      total: 0,
      bySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0,
      },
      byCode: {} as Record<string, number>,
      byTool: {} as Record<string, number>,
      recentCritical: this.hasRecentCriticalErrors(),
    };

    // Filter errors if 'since' is specified
    const errors = since ? this.errors.filter(err => err.timestamp >= since) : this.errors;

    stats.total = errors.length;

    // Count errors by severity, code, and tool
    errors.forEach(error => {
      // Count by severity
      stats.bySeverity[error.severity]++;

      // Count by code
      if (!stats.byCode[error.code]) {
        stats.byCode[error.code] = 0;
      }
      stats.byCode[error.code]++;

      // Count by tool (if tool ID is present)
      if (error.toolId) {
        if (!stats.byTool[error.toolId]) {
          stats.byTool[error.toolId] = 0;
        }
        stats.byTool[error.toolId]++;
      }
    });

    return stats;
  }

  /**
   * Clear all errors or a subset of errors
   */
  clearErrors(
    options: {
      severity?: ErrorSeverity;
      toolId?: string;
      containerId?: string;
      code?: string;
      before?: number;
    } = {}
  ): number {
    const initialCount = this.errors.length;

    if (Object.keys(options).length === 0) {
      // Clear all errors if no options provided
      this.errors = [];
      return initialCount;
    }

    // Filter errors to keep based on provided options
    this.errors = this.errors.filter(error => {
      if (options.severity && error.severity === options.severity) {
        return false;
      }

      if (options.toolId && error.toolId === options.toolId) {
        return false;
      }

      if (options.containerId && error.containerId === options.containerId) {
        return false;
      }

      if (options.code && error.code === options.code) {
        return false;
      }

      if (options.before && error.timestamp < options.before) {
        return false;
      }

      return true;
    });

    return initialCount - this.errors.length;
  }

  /**
   * Log an error to the console
   */
  private logError(errorRecord: ErrorRecord): void {
    const timestamp = new Date(errorRecord.timestamp).toISOString();
    const details = errorRecord.details ? ` - ${JSON.stringify(errorRecord.details)}` : '';
    const toolId = errorRecord.toolId ? ` [Tool: ${errorRecord.toolId}]` : '';
    const containerId = errorRecord.containerId ? ` [Container: ${errorRecord.containerId}]` : '';

    let logMethod: (message: string) => void;

    switch (errorRecord.severity) {
      case ErrorSeverity.LOW:
        logMethod = console.debug;
        break;
      case ErrorSeverity.MEDIUM:
        logMethod = console.info;
        break;
      case ErrorSeverity.HIGH:
        logMethod = console.warn;
        break;
      case ErrorSeverity.CRITICAL:
        logMethod = console.error;
        break;
      default:
        logMethod = console.log;
    }

    logMethod(
      `[${timestamp}] [${errorRecord.severity.toUpperCase()}] [${
        errorRecord.code
      }]${toolId}${containerId} ${errorRecord.message}${details}`
    );

    if (
      errorRecord.severity === ErrorSeverity.CRITICAL ||
      errorRecord.severity === ErrorSeverity.HIGH
    ) {
      console.error(errorRecord.stack || 'No stack trace available');
    }
  }
}

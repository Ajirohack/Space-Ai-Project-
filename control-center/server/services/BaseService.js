/**
 * Base Service Class
 * Provides common functionality for all services
 */
const EventEmitter = require('events');
const logger = require('../utils/logger');

class BaseService extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.logger = logger.child({ service: name });
    this.isInitialized = false;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.info('Initializing service...');
      await this._init();
      this.isInitialized = true;
      this.emit('initialized');
      this.logger.info('Service initialized successfully');
    } catch (error) {
      this.logger.error('Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Clean up service resources
   */
  async cleanup() {
    if (!this.isInitialized) {
      return;
    }

    try {
      this.logger.info('Cleaning up service...');
      await this._cleanup();
      this.isInitialized = false;
      this.emit('cleanup');
      this.logger.info('Service cleanup completed');
    } catch (error) {
      this.logger.error('Service cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Internal initialization method to be implemented by subclasses
   */
  async _init() {
    // Override in subclass
  }

  /**
   * Internal cleanup method to be implemented by subclasses
   */
  async _cleanup() {
    // Override in subclass
  }

  /**
   * Check if service is healthy
   */
  async healthCheck() {
    return {
      service: this.name,
      status: this.isInitialized ? 'healthy' : 'not_initialized',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    return {
      service: this.name,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = BaseService;

/**
 * Database Utility
 * Manages MongoDB connection and provides database utilities
 */
const mongoose = require('mongoose');
const logger = require('./logger');

let connection = null;

/**
 * Connect to MongoDB
 */
exports.connectDatabase = async uri => {
  if (connection) {
    return connection;
  }

  try {
    connection = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', err => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      connection = null;
    });

    // Handle process termination
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGHUP', cleanup);

    return connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

/**
 * Get database connection
 */
exports.getConnection = () => connection;

/**
 * Check database connection status
 */
exports.isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Create indexes for collections
 */
exports.createIndexes = async models => {
  try {
    const results = await Promise.all(Object.values(models).map(model => model.createIndexes()));
    logger.info('Database indexes created successfully');
    return results;
  } catch (error) {
    logger.error('Failed to create database indexes:', error);
    throw error;
  }
};

/**
 * Clean up database connection
 */
async function cleanup() {
  try {
    if (connection) {
      await mongoose.connection.close();
      connection = null;
      logger.info('MongoDB connection closed through app termination');
    }
  } catch (error) {
    logger.error('Error during MongoDB cleanup:', error);
    process.exit(1);
  }
  process.exit(0);
}

/**
 * Create a session for transactions
 */
exports.createSession = async () => {
  if (!connection) {
    throw new Error('Database not connected');
  }
  return await mongoose.startSession();
};

/**
 * Execute operation within a transaction
 */
exports.withTransaction = async operation => {
  const session = await exports.createSession();

  try {
    session.startTransaction();
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Test setup file
 * Sets up the test environment
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

// Create in-memory MongoDB instance
let mongoServer;

/**
 * Connect to the in-memory database
 */
module.exports.connect = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

/**
 * Drop database, close the connection and stop mongod
 */
module.exports.closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

/**
 * Remove all data from all collections
 */
module.exports.clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

/**
 * Generate a valid JWT token for testing
 */
module.exports.generateTestToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

/**
 * Create a test user
 */
module.exports.createTestUser = async (role = 'user') => {
  const { Membership } = require('../models');
  const { hashPassword, generateToken } = require('../utils/helpers');

  const { hash, salt } = await hashPassword('password123');

  const user = await Membership.create({
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    passwordHash: hash,
    passwordSalt: salt,
    membershipKey: generateToken(16),
    permissions: [role],
    active: true,
    lastLogin: new Date()
  });

  return user;
};

/**
 * Create a test admin user
 */
module.exports.createTestAdmin = async () => {
  return module.exports.createTestUser('admin');
};

/**
 * Create a test module
 */
module.exports.createTestModule = async (userId) => {
  const { Module } = require('../models');

  const module = await Module.create({
    moduleId: `test-module-${Date.now()}`,
    name: 'Test Module',
    description: 'A test module',
    version: '1.0.0',
    capabilities: ['test'],
    active: true,
    createdBy: userId
  });

  return module;
};
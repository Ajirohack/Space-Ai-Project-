/**
 * User Model Tests
 * Tests the functionality of the User model
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

let mongoServer;

// Setup before tests
beforeAll(async () => {
  // Set up test environment variables
  process.env.JWT_SECRET = 'test-jwt-secret';
  
  // Set up in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clean up after tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Clear data between tests
afterEach(async () => {
  await User.deleteMany({});
});

describe('User Model', () => {
  // Test user data
  const userData = {
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed_password',
    passwordSalt: 'salt',
    membershipKey: 'test-membership-key',
    permissions: ['user']
  };
  
  it('should create a new user', async () => {
    const user = await User.create(userData);
    
    expect(user._id).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(user.name).toBe(userData.name);
    expect(user.membershipKey).toBe(userData.membershipKey);
    expect(user.permissions).toEqual(expect.arrayContaining(userData.permissions));
    expect(user.active).toBe(true); // default value
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  });
  
  it('should generate a membership key', () => {
    const key = User.generateMembershipKey();
    expect(key).toBeDefined();
    expect(key.length).toBe(32); // 16 bytes in hex = 32 characters
  });
  
  it('should find a user by email', async () => {
    await User.create(userData);
    
    const user = await User.findByEmail(userData.email);
    expect(user).toBeDefined();
    expect(user.email).toBe(userData.email);
  });
  
  it('should find a user by email case-insensitive', async () => {
    await User.create(userData);
    
    const user = await User.findByEmail('TEST@example.com');
    expect(user).toBeDefined();
    expect(user.email).toBe(userData.email);
  });
  
  it('should find a user by membership key', async () => {
    await User.create(userData);
    
    const user = await User.findByMembershipKey(userData.membershipKey);
    expect(user).toBeDefined();
    expect(user.membershipKey).toBe(userData.membershipKey);
  });
  
  it('should validate a correct password', async () => {
    // Create a password hash and salt
    const password = 'correct-password';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    // Create user with known password
    const user = await User.create({
      ...userData,
      passwordHash: hash,
      passwordSalt: salt
    });
    
    // Test password validation
    const isValid = await user.validatePassword(password);
    expect(isValid).toBe(true);
  });
  
  it('should reject an incorrect password', async () => {
    // Create a password hash and salt
    const password = 'correct-password';
    const wrongPassword = 'wrong-password';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    // Create user with known password
    const user = await User.create({
      ...userData,
      passwordHash: hash,
      passwordSalt: salt
    });
    
    // Test password validation
    const isValid = await user.validatePassword(wrongPassword);
    expect(isValid).toBe(false);
  });
  
  it('should set and validate a PIN', async () => {
    const user = await User.create(userData);
    const pin = '1234';
    
    await user.setPin(pin);
    
    // Reload the user
    const updatedUser = await User.findById(user._id);
    
    expect(updatedUser.pinEnabled).toBe(true);
    expect(updatedUser.pinHash).toBeDefined();
    
    const isValid = await updatedUser.validatePin(pin);
    expect(isValid).toBe(true);
    
    const isInvalid = await updatedUser.validatePin('4321');
    expect(isInvalid).toBe(false);
  });
  
  it('should disable PIN authentication', async () => {
    const user = await User.create(userData);
    const pin = '1234';
    
    await user.setPin(pin);
    await user.disablePin();
    
    // Reload the user
    const updatedUser = await User.findById(user._id);
    
    expect(updatedUser.pinEnabled).toBe(false);
    expect(updatedUser.pinHash).toBeNull();
    
    const isValid = await updatedUser.validatePin(pin);
    expect(isValid).toBe(false);
  });
  
  it('should generate an auth token', async () => {
    const user = await User.create(userData);
    
    const token = user.generateAuthToken();
    expect(token).toBeDefined();
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id.toString()).toBe(user._id.toString());
    expect(decoded.email).toBe(user.email);
  });
  
  it('should handle account locking after failed login attempts', async () => {
    const user = await User.create(userData);
    
    // Record 5 failed login attempts
    for (let i = 0; i < 5; i++) {
      await user.recordLoginAttempt();
    }
    
    // Reload the user
    const updatedUser = await User.findById(user._id);
    
    expect(updatedUser.loginAttempts).toBe(5);
    expect(updatedUser.lockedUntil).toBeDefined();
    expect(updatedUser.isAccountLocked()).toBe(true);
  });
  
  it('should reset login attempts', async () => {
    const user = await User.create({
      ...userData,
      loginAttempts: 3,
      lockedUntil: new Date(Date.now() + 1000 * 60) // 1 minute in the future
    });
    
    await user.resetLoginAttempts();
    
    // Reload the user
    const updatedUser = await User.findById(user._id);
    
    expect(updatedUser.loginAttempts).toBe(0);
    expect(updatedUser.lockedUntil).toBeUndefined();
    expect(updatedUser.lastLogin).toBeDefined();
    expect(updatedUser.isAccountLocked()).toBe(false);
  });
});
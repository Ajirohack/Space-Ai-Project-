/**
 * Authentication routes tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../gateway');
const { Membership } = require('../../models');
const testSetup = require('../setup');

describe('Authentication Routes', () => {
  beforeAll(async () => {
    await testSetup.connect();
  });

  afterEach(async () => {
    await testSetup.clearDatabase();
  });

  afterAll(async () => {
    await testSetup.closeDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', userData.email);
      expect(response.body.data.user).toHaveProperty('name', userData.name);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
      expect(response.body.data.user).not.toHaveProperty('passwordSalt');

      // Verify user was created in database
      const user = await Membership.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.active).toBe(true);
      expect(user.permissions).toContain('user');
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          name: 'Test User',
          password: 'Password123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error for duplicate email', async () => {
      // Create a user first
      await testSetup.createTestUser();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test-user@example.com',
          name: 'Another User',
          password: 'Password123!'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login a user with valid credentials', async () => {
      // Create a test user
      const user = await testSetup.createTestUser();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', user.email);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return error for invalid credentials', async () => {
      // Create a test user
      const user = await testSetup.createTestUser();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should generate reset token for existing user', async () => {
      // Create a test user
      const user = await testSetup.createTestUser();
      
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: user.email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify reset token was created
      const updatedUser = await Membership.findById(user._id);
      expect(updatedUser.resetToken).toBeTruthy();
      expect(updatedUser.resetTokenExpiry).toBeTruthy();
    });

    it('should return success even for non-existent email for security', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      // Create a test user with reset token
      const user = await testSetup.createTestUser();
      const resetToken = testSetup.generateTestToken(user._id);
      
      // Set reset token in database
      user.resetToken = resetToken;
      user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
      await user.save();
      
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify password was changed and token cleared
      const updatedUser = await Membership.findById(user._id);
      expect(updatedUser.resetToken).toBeFalsy();
      expect(updatedUser.resetTokenExpiry).toBeFalsy();
      
      // Try logging in with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'NewPassword123!'
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error for expired token', async () => {
      // Create a test user with expired reset token
      const user = await testSetup.createTestUser();
      const resetToken = testSetup.generateTestToken(user._id);
      
      // Set expired reset token in database
      user.resetToken = resetToken;
      user.resetTokenExpiry = new Date(Date.now() - 3600000); // 1 hour ago
      await user.save();
      
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
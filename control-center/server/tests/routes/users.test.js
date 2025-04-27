/**
 * User routes tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../gateway');
const { Membership } = require('../../models');
const testSetup = require('../setup');

describe('User Routes', () => {
  let testUser;
  let testAdmin;
  let testUserToken;
  let testAdminToken;

  beforeAll(async () => {
    await testSetup.connect();
  });

  beforeEach(async () => {
    // Create test users
    testUser = await testSetup.createTestUser();
    testAdmin = await testSetup.createTestAdmin();
    
    // Generate tokens
    testUserToken = testSetup.generateTestToken(testUser._id);
    testAdminToken = testSetup.generateTestToken(testAdmin._id);
  });

  afterEach(async () => {
    await testSetup.clearDatabase();
  });

  afterAll(async () => {
    await testSetup.closeDatabase();
  });

  describe('GET /api/users', () => {
    it('should return all users for admin users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBe(2);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user details for admin users', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.name).toBe(testUser.name);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return own user details for authenticated users', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should return 403 for accessing other user details as non-admin', async () => {
      const response = await request(app)
        .get(`/api/users/${testAdmin._id}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user details for admin users', async () => {
      const updateData = {
        name: 'Updated User Name',
        permissions: ['user', 'module_access']
      };

      const response = await request(app)
        .put(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(updateData.name);
      expect(response.body.data.user.permissions).toEqual(expect.arrayContaining(updateData.permissions));

      // Verify user was updated in database
      const user = await Membership.findById(testUser._id);
      expect(user.name).toBe(updateData.name);
    });

    it('should allow users to update their own basic details', async () => {
      const updateData = {
        name: 'Self Updated Name'
      };

      const response = await request(app)
        .put(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(updateData.name);

      // Verify user was updated in database
      const user = await Membership.findById(testUser._id);
      expect(user.name).toBe(updateData.name);
    });

    it('should not allow users to update their own permissions', async () => {
      const updateData = {
        permissions: ['user', 'admin']
      };

      const response = await request(app)
        .put(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify permissions were not updated
      const user = await Membership.findById(testUser._id);
      expect(user.permissions).not.toContain('admin');
    });

    it('should return 403 for updating other user details as non-admin', async () => {
      const updateData = { name: 'Unauthorized Update' };

      const response = await request(app)
        .put(`/api/users/${testAdmin._id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should deactivate a user for admin users', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user was deactivated in database
      const user = await Membership.findById(testUser._id);
      expect(user.active).toBe(false);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/:id/reset-password', () => {
    it('should allow admins to reset user password', async () => {
      const response = await request(app)
        .post(`/api/users/${testUser._id}/reset-password`)
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('resetToken');

      // Verify reset token was set in database
      const user = await Membership.findById(testUser._id);
      expect(user.resetToken).toBeTruthy();
      expect(user.resetTokenExpiry).toBeTruthy();
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`/api/users/${testAdmin._id}/reset-password`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
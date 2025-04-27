/**
 * Module routes tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../gateway');
const { Module, Membership } = require('../../models');
const testSetup = require('../setup');

describe('Module Routes', () => {
  let testUser;
  let testAdmin;
  let testUserToken;
  let testAdminToken;
  let testModule;

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
    
    // Create test module
    testModule = await testSetup.createTestModule(testAdmin._id);
  });

  afterEach(async () => {
    await testSetup.clearDatabase();
  });

  afterAll(async () => {
    await testSetup.closeDatabase();
  });

  describe('GET /api/modules', () => {
    it('should return all modules for admin users', async () => {
      const response = await request(app)
        .get('/api/modules')
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.modules)).toBe(true);
      expect(response.body.data.modules.length).toBe(1);
      expect(response.body.data.modules[0].moduleId).toBe(testModule.moduleId);
    });

    it('should return only accessible modules for regular users', async () => {
      // Add module access to test user
      testUser.modules.push({
        moduleId: testModule.moduleId,
        enabled: true
      });
      await testUser.save();

      const response = await request(app)
        .get('/api/modules')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.modules)).toBe(true);
      expect(response.body.data.modules.length).toBe(1);
      expect(response.body.data.modules[0].moduleId).toBe(testModule.moduleId);
    });

    it('should return empty array for users with no module access', async () => {
      const response = await request(app)
        .get('/api/modules')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.modules)).toBe(true);
      expect(response.body.data.modules.length).toBe(0);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).get('/api/modules');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/modules/:moduleId', () => {
    it('should return module details for admin users', async () => {
      const response = await request(app)
        .get(`/api/modules/${testModule.moduleId}`)
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.module.moduleId).toBe(testModule.moduleId);
      expect(response.body.data.module.name).toBe(testModule.name);
    });

    it('should return module details for users with access', async () => {
      // Add module access to test user
      testUser.modules.push({
        moduleId: testModule.moduleId,
        enabled: true
      });
      await testUser.save();

      const response = await request(app)
        .get(`/api/modules/${testModule.moduleId}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.module.moduleId).toBe(testModule.moduleId);
    });

    it('should return 403 for users without module access', async () => {
      const response = await request(app)
        .get(`/api/modules/${testModule.moduleId}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent module', async () => {
      const response = await request(app)
        .get('/api/modules/non-existent-module')
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/modules', () => {
    it('should create a new module for admin users', async () => {
      const moduleData = {
        moduleId: 'new-test-module',
        name: 'New Test Module',
        description: 'A new test module',
        version: '1.0.0',
        capabilities: ['test-capability']
      };

      const response = await request(app)
        .post('/api/modules')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send(moduleData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.module.moduleId).toBe(moduleData.moduleId);
      expect(response.body.data.module.name).toBe(moduleData.name);

      // Verify module was created in database
      const module = await Module.findOne({ moduleId: moduleData.moduleId });
      expect(module).toBeTruthy();
      expect(module.moduleId).toBe(moduleData.moduleId);
    });

    it('should return 403 for non-admin users', async () => {
      const moduleData = {
        moduleId: 'new-test-module',
        name: 'New Test Module',
        version: '1.0.0'
      };

      const response = await request(app)
        .post('/api/modules')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(moduleData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid module data', async () => {
      const response = await request(app)
        .post('/api/modules')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({ name: 'Invalid Module' }); // Missing required fields

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/modules/:moduleId', () => {
    it('should update a module for admin users', async () => {
      const updateData = {
        name: 'Updated Module Name',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/modules/${testModule.moduleId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.module.name).toBe(updateData.name);
      expect(response.body.data.module.description).toBe(updateData.description);

      // Verify module was updated in database
      const module = await Module.findOne({ moduleId: testModule.moduleId });
      expect(module.name).toBe(updateData.name);
    });

    it('should return 403 for non-admin users', async () => {
      const updateData = { name: 'Updated Module Name' };

      const response = await request(app)
        .put(`/api/modules/${testModule.moduleId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent module', async () => {
      const response = await request(app)
        .put('/api/modules/non-existent-module')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/modules/:moduleId', () => {
    it('should delete a module for admin users', async () => {
      const response = await request(app)
        .delete(`/api/modules/${testModule.moduleId}`)
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify module was deleted from database
      const module = await Module.findOne({ moduleId: testModule.moduleId });
      expect(module).toBeNull();
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .delete(`/api/modules/${testModule.moduleId}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent module', async () => {
      const response = await request(app)
        .delete('/api/modules/non-existent-module')
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
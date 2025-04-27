/**
 * Content routes tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../gateway');
const testSetup = require('../setup');

describe('Content Routes', () => {
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

  describe('POST /api/content/process', () => {
    it('should process content for authenticated users', async () => {
      const contentData = {
        type: 'text',
        content: 'This is a test content',
        options: {
          format: 'plain'
        }
      };

      const response = await request(app)
        .post('/api/content/process')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(contentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('result');
      expect(response.body.data.result).toHaveProperty('processed');
    });

    it('should return 400 for invalid content type', async () => {
      const contentData = {
        type: 'invalid-type',
        content: 'This is a test content'
      };

      const response = await request(app)
        .post('/api/content/process')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(contentData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const contentData = {
        type: 'text',
        content: 'This is a test content'
      };

      const response = await request(app)
        .post('/api/content/process')
        .send(contentData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/content/types', () => {
    it('should return available content types for authenticated users', async () => {
      const response = await request(app)
        .get('/api/content/types')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.types)).toBe(true);
      expect(response.body.data.types.length).toBeGreaterThan(0);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).get('/api/content/types');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
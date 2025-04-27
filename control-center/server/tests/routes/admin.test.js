/**
 * Admin routes tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../gateway');
const { Membership, Invitation, AuditLog } = require('../../models');
const testSetup = require('../setup');

describe('Admin Routes', () => {
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

  describe('POST /api/admin/invite', () => {
    it('should create a new invitation for admin users', async () => {
      const inviteData = {
        email: 'newinvite@example.com',
        permissions: ['user']
      };

      const response = await request(app)
        .post('/api/admin/invite')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send(inviteData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('invitation');
      expect(response.body.data.invitation.email).toBe(inviteData.email);
      expect(response.body.data).toHaveProperty('pin');

      // Verify invitation was created in database
      const invitation = await Invitation.findOne({ email: inviteData.email });
      expect(invitation).toBeTruthy();
      expect(invitation.email).toBe(inviteData.email);
      expect(invitation.used).toBe(false);
    });

    it('should return 403 for non-admin users', async () => {
      const inviteData = {
        email: 'newinvite@example.com',
        permissions: ['user']
      };

      const response = await request(app)
        .post('/api/admin/invite')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(inviteData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid email', async () => {
      const inviteData = {
        email: 'invalid-email',
        permissions: ['user']
      };

      const response = await request(app)
        .post('/api/admin/invite')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send(inviteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/invitations', () => {
    it('should return all invitations for admin users', async () => {
      // Create a test invitation
      const invitation = await Invitation.create({
        email: 'test-invite@example.com',
        invitationCode: 'test-code',
        hashedPin: 'test-pin-hash',
        permissions: ['user'],
        createdBy: testAdmin._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      });

      const response = await request(app)
        .get('/api/admin/invitations')
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.invitations)).toBe(true);
      expect(response.body.data.invitations.length).toBe(1);
      expect(response.body.data.invitations[0].email).toBe(invitation.email);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/invitations')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/audit-logs', () => {
    it('should return audit logs for admin users', async () => {
      // Create a test audit log
      const auditLog = await AuditLog.create({
        userId: testAdmin._id,
        action: 'test_action',
        resourceType: 'Test',
        resourceId: 'test-id',
        details: { test: true },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      });

      const response = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.logs)).toBe(true);
      expect(response.body.data.logs.length).toBe(1);
      expect(response.body.data.logs[0].action).toBe(auditLog.action);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should filter audit logs by user ID', async () => {
      // Create test audit logs for different users
      await AuditLog.create({
        userId: testAdmin._id,
        action: 'admin_action',
        resourceType: 'Test',
        resourceId: 'test-id-1'
      });

      await AuditLog.create({
        userId: testUser._id,
        action: 'user_action',
        resourceType: 'Test',
        resourceId: 'test-id-2'
      });

      const response = await request(app)
        .get(`/api/admin/audit-logs?userId=${testUser._id}`)
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.logs)).toBe(true);
      expect(response.body.data.logs.length).toBe(1);
      expect(response.body.data.logs[0].action).toBe('user_action');
    });
  });

  describe('GET /api/admin/system-info', () => {
    it('should return system information for admin users', async () => {
      const response = await request(app)
        .get('/api/admin/system-info')
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Check system info
      expect(response.body.data).toHaveProperty('system');
      expect(response.body.data.system).toHaveProperty('version');
      expect(response.body.data.system).toHaveProperty('environment');
      expect(response.body.data.system).toHaveProperty('uptime');
      expect(response.body.data.system).toHaveProperty('node');
      expect(response.body.data.system).toHaveProperty('os');
      
      // Check database info
      expect(response.body.data).toHaveProperty('database');
      expect(response.body.data.database).toHaveProperty('state');
      expect(response.body.data.database).toHaveProperty('connectionState');
      expect(response.body.data.database).toHaveProperty('models');
      
      // Check stats
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats).toHaveProperty('users');
      expect(response.body.data.stats).toHaveProperty('invitations');
      expect(response.body.data.stats).toHaveProperty('auditLogs');
      
      // Check API stats
      expect(response.body.data).toHaveProperty('api');
      
      // Check content types
      expect(response.body.data).toHaveProperty('content');
      expect(response.body.data.content).toHaveProperty('types');
      
      // Check cache stats
      expect(response.body.data).toHaveProperty('cache');
      
      // Check connections
      expect(response.body.data).toHaveProperty('connections');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/system-info')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/system-metrics', () => {
    it('should return real-time system metrics for admin users', async () => {
      const response = await request(app)
        .get('/api/admin/system-metrics')
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Check timestamp
      expect(response.body.data).toHaveProperty('timestamp');
      
      // Check CPU metrics
      expect(response.body.data).toHaveProperty('cpu');
      expect(response.body.data.cpu).toHaveProperty('usage');
      expect(response.body.data.cpu).toHaveProperty('loadAvg');
      expect(response.body.data.cpu).toHaveProperty('cores');
      
      // Check memory metrics
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data.memory).toHaveProperty('total');
      expect(response.body.data.memory).toHaveProperty('free');
      expect(response.body.data.memory).toHaveProperty('used');
      expect(response.body.data.memory).toHaveProperty('percentage');
      expect(response.body.data.memory).toHaveProperty('heap');
      expect(response.body.data.memory.heap).toHaveProperty('total');
      expect(response.body.data.memory.heap).toHaveProperty('used');
      expect(response.body.data.memory.heap).toHaveProperty('percentage');
      
      // Check process metrics
      expect(response.body.data).toHaveProperty('process');
      expect(response.body.data.process).toHaveProperty('uptime');
      expect(response.body.data.process).toHaveProperty('activeHandles');
      expect(response.body.data.process).toHaveProperty('activeRequests');
      expect(response.body.data.process).toHaveProperty('pid');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/system-metrics')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
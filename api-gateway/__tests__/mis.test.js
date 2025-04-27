/**
 * MIS Integration Tests
 * Tests the Membership Initiation System routes and middleware
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const nock = require('nock');
const app = require('../index');
const Redis = require('ioredis-mock');

// Mock Redis client
jest.mock('ioredis', () => require('ioredis-mock'));

describe('MIS Integration', () => {
  const mockMisUrl = 'http://mis-backend';
  const mockApiKey = 'test-api-key';

  beforeAll(() => {
    process.env.MIS_API_URL = mockMisUrl;
    process.env.MIS_API_KEY = mockApiKey;
    process.env.JWT_SECRET = 'test-secret';
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  describe('POST /api/mis/invitations/validate', () => {
    it('should validate a valid invitation code', async () => {
      const invitationCode = 'VALID123';

      nock(mockMisUrl)
        .post('/invitations/validate', { invitationCode })
        .reply(200, {
          success: true,
          invitation: {
            code: invitationCode,
            email: 'test@example.com',
            role: 'user',
          },
        });

      const response = await request(app)
        .post('/api/mis/invitations/validate')
        .send({ invitationCode });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.invitation.code).toBe(invitationCode);
    });

    it('should reject an invalid invitation code', async () => {
      const invitationCode = 'INVALID';

      nock(mockMisUrl).post('/invitations/validate', { invitationCode }).reply(403, {
        success: false,
        message: 'Invalid invitation code',
      });

      const response = await request(app)
        .post('/api/mis/invitations/validate')
        .send({ invitationCode });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/mis/memberships/validate', () => {
    it('should validate a valid membership key', async () => {
      const membershipKey = 'valid-membership-key-123';

      nock(mockMisUrl)
        .post('/memberships/validate', { membershipKey })
        .reply(200, {
          success: true,
          membership: {
            key: membershipKey,
            status: 'active',
          },
        });

      const response = await request(app)
        .post('/api/mis/memberships/validate')
        .send({ membershipKey });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.membership.status).toBe('active');
    });

    it('should reject an invalid membership key', async () => {
      const membershipKey = 'invalid-key';

      nock(mockMisUrl).post('/memberships/validate', { membershipKey }).reply(403, {
        success: false,
        message: 'Invalid membership key',
      });

      const response = await request(app)
        .post('/api/mis/memberships/validate')
        .send({ membershipKey });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/mis/invitations/create', () => {
    it('should create invitation when authorized', async () => {
      const adminToken = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET);
      const inviteData = {
        email: 'new@example.com',
        role: 'user',
      };

      nock(mockMisUrl)
        .post('/invitations')
        .reply(201, {
          success: true,
          invitation: {
            ...inviteData,
            code: 'NEW123',
          },
        });

      const response = await request(app)
        .post('/api/mis/invitations/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.invitation.email).toBe(inviteData.email);
    });

    it('should reject invitation creation without auth', async () => {
      const response = await request(app).post('/api/mis/invitations/create').send({
        email: 'new@example.com',
        role: 'user',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/mis/memberships/:membershipKey', () => {
    it('should get membership status with valid key', async () => {
      const membershipKey = 'valid-key-123';

      // Mock header validation
      nock(mockMisUrl)
        .post('/memberships/validate', { membershipKey })
        .reply(200, { success: true });

      // Mock status request
      nock(mockMisUrl)
        .get(`/memberships/${membershipKey}`)
        .reply(200, {
          success: true,
          membership: {
            key: membershipKey,
            status: 'active',
            created: new Date().toISOString(),
          },
        });

      const response = await request(app)
        .get(`/api/mis/memberships/${membershipKey}`)
        .set('x-membership-key', membershipKey);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.membership.status).toBe('active');
    });

    it('should reject request without membership key header', async () => {
      const response = await request(app).get('/api/mis/memberships/any-key');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

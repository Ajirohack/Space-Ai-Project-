const request = require('supertest');
const express = require('express');

let app;
beforeAll(() => {
  app = require('../index');
});

describe('API Gateway Health Check', () => {
  it('should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('api-gateway');
  });
});
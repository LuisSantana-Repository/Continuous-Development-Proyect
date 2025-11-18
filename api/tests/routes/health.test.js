// tests/routes/health.test.js
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock dependencies
const mockExecute = jest.fn();
const mockSend = jest.fn();

jest.unstable_mockModule('../../src/config/database.js', () => ({
  getPrimaryPool: jest.fn().mockResolvedValue({ execute: mockExecute }),
  getSecondaryPool: jest.fn().mockResolvedValue({ execute: mockExecute })
}));

jest.unstable_mockModule('../../src/config/aws.js', () => ({
  s3Client: { send: mockSend },
  dynamoDBClient: { send: mockSend }
}));

// Import after mocking
const { router: healthRoutes } = await import('../../src/routes/health.js');

// Create test app
const app = express();
app.use(express.json());
app.use('/health', healthRoutes);

describe('Health Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    test('should return healthy status when all services are ok', async () => {
      mockExecute.mockResolvedValue([[{ ping: 1 }]]);
      mockSend.mockResolvedValue({});

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.checks.database_primary.status).toBe('ok');
      expect(response.body.checks.database_secondary.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should return unhealthy status when database fails', async () => {
      mockExecute.mockRejectedValue(new Error('Connection failed'));
      mockSend.mockResolvedValue({});

      const response = await request(app)
        .get('/health')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.checks.database_primary.status).toBe('error');
    });

    test('should handle S3 NoSuchKey error as ok', async () => {
      mockExecute.mockResolvedValue([[{ ping: 1 }]]);
      const s3Error = new Error('NoSuchKey');
      s3Error.name = 'NoSuchKey';
      mockSend.mockRejectedValueOnce(s3Error).mockResolvedValue({});

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.checks.s3.status).toBe('ok');
    });

    test('should handle S3 other errors as warning', async () => {
      mockExecute.mockResolvedValue([[{ ping: 1 }]]);
      mockSend.mockRejectedValueOnce(new Error('Access denied')).mockResolvedValue({});

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.checks.s3.status).toBe('warning');
    });

    test('should handle DynamoDB errors as warning', async () => {
      mockExecute.mockResolvedValue([[{ ping: 1 }]]);
      mockSend.mockResolvedValueOnce({}).mockRejectedValue(new Error('DynamoDB error'));

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.checks.dynamodb.status).toBe('warning');
    });
  });
});
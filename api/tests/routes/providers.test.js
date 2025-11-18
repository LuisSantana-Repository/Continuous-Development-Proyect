// tests/routes/providers.test.js
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Mock functions
const mockGetProviderByUserId = jest.fn();
const mockGetProviderCalendar = jest.fn();

jest.unstable_mockModule('../../src/services/provider.js', () => ({
  getProviderByUserId: mockGetProviderByUserId
}));

jest.unstable_mockModule('../../src/services/providerCalendar.js', () => ({
  getProviderCalendar: mockGetProviderCalendar
}));

// Import after mocking
const { router: providerRoutes } = await import('../../src/routes/providers.js');

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/providers', providerRoutes);

const userId = 'test-user-123';
const providerId = 456;

const createToken = (id = userId) => {
  return jwt.sign({ sub: id }, process.env.JWT_SECRET, { 
    algorithm: 'HS256', expiresIn: '24h' 
  });
};

const mockProviders = [
  {
    provider_id: providerId,
    user_id: userId,
    workname: 'Plumber Pro',
    description: 'Professional plumbing services',
    base_price: 500,
    Service_Type: 1,
    service_type_name: 'Plumbing'
  }
];

const mockCalendar = {
  providerId,
  month: '2025-11',
  timeAvailable: { monday: { start: '09:00', end: '17:00' } },
  events: [
    {
      id: 'req-1',
      type: 'service_request',
      date: '2025-11-20',
      startTime: '10:00',
      endTime: '12:00',
      status: 'accepted'
    }
  ],
  summary: {
    totalRequests: 1,
    pendingRequests: 0,
    acceptedRequests: 1,
    inProgressRequests: 0
  }
};

describe('Provider Routes', () => {
  let authToken;

  beforeEach(() => {
    jest.clearAllMocks();
    authToken = createToken();
  });

  describe('GET /providers/user/:userId', () => {
    test('should get providers for authenticated user', async () => {
      mockGetProviderByUserId.mockResolvedValue(mockProviders);

      const response = await request(app)
        .get(`/providers/user/${userId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.providers).toEqual(mockProviders);
    });

    test('should return 403 if accessing other user providers', async () => {
      const response = await request(app)
        .get('/providers/user/other-user-id')
        .set('Cookie', [`token=${authToken}`])
        .expect(403);

      expect(response.body.error).toBe('forbidden');
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get(`/providers/user/${userId}`)
        .expect(401);
    });

    test('should return 500 for server errors', async () => {
      mockGetProviderByUserId.mockRejectedValue(new Error('Database error'));

      await request(app)
        .get(`/providers/user/${userId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(500);
    });
  });

  describe('GET /providers/:providerId/calendar', () => {
    test('should get provider calendar with default month', async () => {
      mockGetProviderCalendar.mockResolvedValue(mockCalendar);

      const response = await request(app)
        .get(`/providers/${providerId}/calendar`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCalendar);
    });

    test('should get provider calendar with specified month', async () => {
      mockGetProviderCalendar.mockResolvedValue(mockCalendar);

      await request(app)
        .get(`/providers/${providerId}/calendar`)
        .set('Cookie', [`token=${authToken}`])
        .query({ month: '2025-11' })
        .expect(200);

      expect(mockGetProviderCalendar).toHaveBeenCalledWith(providerId, '2025-11');
    });

    test('should return 400 for invalid month format', async () => {
      const response = await request(app)
        .get(`/providers/${providerId}/calendar`)
        .set('Cookie', [`token=${authToken}`])
        .query({ month: 'invalid' })
        .expect(400);

      expect(response.body.error).toBe('invalid month format');
    });

    test('should return 404 if provider not found', async () => {
      mockGetProviderCalendar.mockRejectedValue(new Error('Proveedor no encontrado'));

      const response = await request(app)
        .get(`/providers/${providerId}/calendar`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);

      expect(response.body.error).toBe('provider not found');
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get(`/providers/${providerId}/calendar`)
        .expect(401);
    });
  });
});
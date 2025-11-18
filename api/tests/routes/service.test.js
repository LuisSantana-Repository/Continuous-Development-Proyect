// tests/routes/service.test.js
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock functions
const mockGetServices = jest.fn();
const mockGetProviderServices = jest.fn();
const mockGetServiceById = jest.fn();

jest.unstable_mockModule('../../src/services/services.js', () => ({
  getServices: mockGetServices,
  getProviderServices: mockGetProviderServices,
  getServiceById: mockGetServiceById
}));

// Import after mocking
const { router: serviceRoutes } = await import('../../src/routes/service.js');

// Create test app
const app = express();
app.use(express.json());
app.use('/services', serviceRoutes);

const mockServiceTypes = {
  data: [
    { id: 1, type_name: 'Plumbing' },
    { id: 2, type_name: 'Electrical' }
  ],
  pagination: {
    page: 1,
    pageSize: 10,
    total: 2,
    totalPages: 1
  }
};

const mockProviders = {
  data: [
    {
      provider_id: 123,
      workname: 'Plumber Pro',
      description: 'Professional plumbing',
      base_price: 500,
      service_type: 'Plumbing'
    }
  ],
  pagination: {
    page: 1,
    pageSize: 10,
    total: 1,
    totalPages: 1
  }
};

const mockService = {
  provider_id: 123,
  workname: 'Plumber Pro',
  description: 'Professional plumbing services',
  base_price: 500,
  service_type: 'Plumbing',
  Time_Available: {
    monday: { start: '09:00', end: '17:00' }
  }
};

describe('Service Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /services', () => {
    test('should get service types with pagination', async () => {
      mockGetServices.mockResolvedValue(mockServiceTypes);

      const response = await request(app)
        .get('/services')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    test('should support custom pagination', async () => {
      mockGetServices.mockResolvedValue(mockServiceTypes);

      await request(app)
        .get('/services')
        .query({ page: 2, pageSize: 5 })
        .expect(200);

      expect(mockGetServices).toHaveBeenCalledWith(2, 5);
    });

    test('should return 500 for server errors', async () => {
      mockGetServices.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/services')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch services');
    });
  });

  describe('GET /services/providers', () => {
    test('should get provider services with pagination', async () => {
      mockGetProviderServices.mockResolvedValue(mockProviders);

      const response = await request(app)
        .get('/services/providers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test('should support custom pagination', async () => {
      mockGetProviderServices.mockResolvedValue(mockProviders);

      await request(app)
        .get('/services/providers')
        .query({ page: 1, pageSize: 20 })
        .expect(200);

      expect(mockGetProviderServices).toHaveBeenCalledWith(1, 20);
    });

    test('should return 500 for server errors', async () => {
      mockGetProviderServices.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/services/providers')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /services/:serviceId', () => {
    test('should get service by id', async () => {
      mockGetServiceById.mockResolvedValue(mockService);

      const response = await request(app)
        .get('/services/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockService);
    });

    test('should return 500 if service id is missing', async () => {
      const response = await request(app)
        .get('/services/')
        .expect(500);
    });

    test('should return 404 if service not found', async () => {
      mockGetServiceById.mockResolvedValue(null);

      const response = await request(app)
        .get('/services/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Service not found');
    });

    test('should return 500 for server errors', async () => {
      mockGetServiceById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/services/123')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});
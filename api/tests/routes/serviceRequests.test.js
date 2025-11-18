// tests/routes/serviceRequests.test.js
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Test data
const userId = 'test-user-123';
const providerId = 789;
const requestId = 'req-abc-123';

const createToken = (id = userId, isProvider = false) => {
  return jwt.sign({ sub: id, provider: isProvider }, process.env.JWT_SECRET, { 
    algorithm: 'HS256', expiresIn: '24h' 
  });
};

const validRequest = {
  providerId,
  description: 'Need plumbing service for kitchen sink repair',
  preferredDate: '2025-11-25T10:00:00.000Z',
  address: '123 Main Street, Guadalajara',
  contactPhone: '3312345678',
  amount: 500
};

const mockServiceRequest = {
  request_id: requestId,
  user_id: userId,
  provider_id: providerId,
  status: 'pending',
  description: 'Test request',
  amount: 500
};

// Mock the service and validator functions
const mockValidateServiceRequest = jest.fn();
const mockValidateServiceRequestUpdate = jest.fn();
const mockCreateServiceRequest = jest.fn();
const mockGetServiceRequestById = jest.fn();
const mockGetUserServiceRequests = jest.fn();
const mockGetProviderServiceRequests = jest.fn();
const mockUpdateServiceRequestStatus = jest.fn();
const mockCancelServiceRequest = jest.fn();

// Mock the modules
jest.unstable_mockModule('../../src/services/serviceRequest.js', () => ({
  createServiceRequest: mockCreateServiceRequest,
  getServiceRequestById: mockGetServiceRequestById,
  getUserServiceRequests: mockGetUserServiceRequests,
  getProviderServiceRequests: mockGetProviderServiceRequests,
  updateServiceRequestStatus: mockUpdateServiceRequestStatus,
  cancelServiceRequest: mockCancelServiceRequest
}));

jest.unstable_mockModule('../../src/utils/validators.js', () => ({
  validateServiceRequest: mockValidateServiceRequest,
  validateServiceRequestUpdate: mockValidateServiceRequestUpdate
}));

// Import after mocking
const { router: serviceRequestRoutes } = await import('../../src/routes/serviceRequests.js');

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/service-requests', serviceRequestRoutes);

describe('Service Request Routes', () => {
  let authToken, providerToken;

  beforeEach(() => {
    jest.clearAllMocks();
    authToken = createToken();
    providerToken = createToken('provider-id', true);
  });

  // ==================== POST /service-requests ====================
  describe('POST /service-requests', () => {
    test('should create service request successfully', async () => {
      mockValidateServiceRequest.mockResolvedValue(null);
      mockCreateServiceRequest.mockResolvedValue({
        requestId: 'req-123',
        chatId: 'chat-456'
      });

      const response = await request(app)
        .post('/service-requests')
        .set('Cookie', [`token=${authToken}`])
        .send(validRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.requestId).toBe('req-123');
    });

    test('should return 400 for validation errors', async () => {
      mockValidateServiceRequest.mockResolvedValue('all required fields must be provided');

      await request(app)
        .post('/service-requests')
        .set('Cookie', [`token=${authToken}`])
        .send({ providerId })
        .expect(400);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .post('/service-requests')
        .send(validRequest)
        .expect(401);
    });

    test('should return 404 if provider not found', async () => {
      mockValidateServiceRequest.mockResolvedValue(null);
      mockCreateServiceRequest.mockRejectedValue(new Error('PROVIDER_NOT_FOUND'));

      await request(app)
        .post('/service-requests')
        .set('Cookie', [`token=${authToken}`])
        .send(validRequest)
        .expect(404);
    });
  });

  // ==================== GET /service-requests/:requestId ====================
  describe('GET /service-requests/:requestId', () => {
    test('should get service request as owner', async () => {
      mockGetServiceRequestById.mockResolvedValue(mockServiceRequest);

      const response = await request(app)
        .get(`/service-requests/${requestId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.request_id).toBe(requestId);
    });

    test('should return 403 if not owner or provider', async () => {
      mockGetServiceRequestById.mockResolvedValue({
        ...mockServiceRequest,
        user_id: 'other-user'
      });

      await request(app)
        .get(`/service-requests/${requestId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(403);
    });

    test('should return 404 if request not found', async () => {
      mockGetServiceRequestById.mockRejectedValue(new Error('REQUEST_NOT_FOUND'));

      await request(app)
        .get(`/service-requests/${requestId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);
    });
  });

  // ==================== GET /service-requests/user/:userId ====================
  describe('GET /service-requests/user/:userId', () => {
    const mockData = {
      data: [mockServiceRequest, { ...mockServiceRequest, request_id: 'req-2' }],
      pagination: { page: 1, pageSize: 10, total: 2, totalPages: 1 }
    };

    test('should get user requests with pagination', async () => {
      mockGetUserServiceRequests.mockResolvedValue(mockData);

      const response = await request(app)
        .get(`/service-requests/user/${userId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    test('should support status filter', async () => {
      mockGetUserServiceRequests.mockResolvedValue(mockData);

      await request(app)
        .get(`/service-requests/user/${userId}`)
        .set('Cookie', [`token=${authToken}`])
        .query({ status: 'pending' })
        .expect(200);

      expect(mockGetUserServiceRequests).toHaveBeenCalledWith(
        userId, 1, 10, 'pending'
      );
    });

    test('should return 403 if accessing other user requests', async () => {
      await request(app)
        .get('/service-requests/user/other-user')
        .set('Cookie', [`token=${authToken}`])
        .expect(403);
    });
  });

  // ==================== GET /service-requests/provider/:providerId ====================
  describe('GET /service-requests/provider/:providerId', () => {
    test('should get provider requests', async () => {
      const mockData = {
        data: [mockServiceRequest],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 }
      };
      mockGetProviderServiceRequests.mockResolvedValue(mockData);

      const response = await request(app)
        .get(`/service-requests/provider/${providerId}`)
        .set('Cookie', [`token=${providerToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return 403 if not a provider', async () => {
      await request(app)
        .get(`/service-requests/provider/${providerId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(403);
    });
  });

  // ==================== PATCH /service-requests/:requestId ====================
  describe('PATCH /service-requests/:requestId', () => {
    test('should update status as provider', async () => {
      mockValidateServiceRequestUpdate.mockReturnValue(null);
      mockGetServiceRequestById.mockResolvedValue(mockServiceRequest);
      mockUpdateServiceRequestStatus.mockResolvedValue({
        ...mockServiceRequest,
        status: 'accepted'
      });

      const response = await request(app)
        .patch(`/service-requests/${requestId}`)
        .set('Cookie', [`token=${providerToken}`])
        .send({ status: 'accepted' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should allow client to cancel', async () => {
      mockValidateServiceRequestUpdate.mockReturnValue(null);
      mockGetServiceRequestById.mockResolvedValue(mockServiceRequest);
      mockUpdateServiceRequestStatus.mockResolvedValue({
        ...mockServiceRequest,
        status: 'cancelled'
      });

      await request(app)
        .patch(`/service-requests/${requestId}`)
        .set('Cookie', [`token=${authToken}`])
        .send({ status: 'cancelled' })
        .expect(200);
    });

    test('should return 403 if non-provider tries to accept', async () => {
      mockValidateServiceRequestUpdate.mockReturnValue(null);
      mockGetServiceRequestById.mockResolvedValue(mockServiceRequest);

      await request(app)
        .patch(`/service-requests/${requestId}`)
        .set('Cookie', [`token=${authToken}`])
        .send({ status: 'accepted' })
        .expect(403);
    });

    test('should return 400 for validation errors', async () => {
      mockValidateServiceRequestUpdate.mockReturnValue('invalid status value');

      await request(app)
        .patch(`/service-requests/${requestId}`)
        .set('Cookie', [`token=${authToken}`])
        .send({ status: 'invalid' })
        .expect(400);
    });
  });

  // ==================== DELETE /service-requests/:requestId ====================
  describe('DELETE /service-requests/:requestId', () => {
    test('should cancel request as owner', async () => {
      mockGetServiceRequestById.mockResolvedValue(mockServiceRequest);
      mockCancelServiceRequest.mockResolvedValue({ success: true });

      const response = await request(app)
        .delete(`/service-requests/${requestId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Service request cancelled successfully');
    });

    test('should return 403 if not owner', async () => {
      mockGetServiceRequestById.mockResolvedValue({
        ...mockServiceRequest,
        user_id: 'other-user'
      });

      await request(app)
        .delete(`/service-requests/${requestId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(403);
    });

    test('should return 404 if request not found', async () => {
      mockGetServiceRequestById.mockRejectedValue(new Error('REQUEST_NOT_FOUND'));

      await request(app)
        .delete(`/service-requests/${requestId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);
    });
  });
});
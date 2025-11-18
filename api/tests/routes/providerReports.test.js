// tests/routes/providerReports.test.js
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Mock functions
const mockCreateProviderReport = jest.fn();
const mockGetProviderReportById = jest.fn();
const mockGetProviderReports = jest.fn();
const mockGetClientReports = jest.fn();
const mockUpdateProviderReportStatus = jest.fn();
const mockDeleteProviderReport = jest.fn();
const mockGetClientReportStats = jest.fn();
const mockValidateProviderReport = jest.fn();
const mockValidateReportUpdate = jest.fn();

jest.unstable_mockModule('../../src/services/providerReport.js', () => ({
  createProviderReport: mockCreateProviderReport,
  getProviderReportById: mockGetProviderReportById,
  getProviderReports: mockGetProviderReports,
  getClientReports: mockGetClientReports,
  updateProviderReportStatus: mockUpdateProviderReportStatus,
  deleteProviderReport: mockDeleteProviderReport,
  getClientReportStats: mockGetClientReportStats
}));

jest.unstable_mockModule('../../src/utils/validators.js', () => ({
  validateProviderReport: mockValidateProviderReport,
  validateReportUpdate: mockValidateReportUpdate
}));

// Import after mocking
const { router: providerReportRoutes } = await import('../../src/routes/providerReportRoutes.js');

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/provider-reports-service', providerReportRoutes);

const userId = 'test-user-123';
const reportId = 'report-abc-123';
const providerId = 456;

const createToken = (id = userId) => {
  return jwt.sign({ sub: id }, process.env.JWT_SECRET, { 
    algorithm: 'HS256', expiresIn: '24h' 
  });
};

const validReport = {
  providerId,
  serviceRequestId: 'req-123',
  reportMessage: 'Client was disrespectful and did not pay the agreed amount'
};

const mockReport = {
  report_id: reportId,
  provider_id: providerId,
  service_request_id: 'req-123',
  report_message: 'Client issue',
  status: 'pending',
  created_at: '2025-11-15T10:00:00.000Z'
};

describe('Provider Report Routes', () => {
  let authToken;

  beforeEach(() => {
    jest.clearAllMocks();
    authToken = createToken();
  });

  describe('POST /provider-reports-service', () => {
    test('should create provider report successfully', async () => {
      mockValidateProviderReport.mockReturnValue(null);
      mockCreateProviderReport.mockResolvedValue({ reportId });

      const response = await request(app)
        .post('/provider-reports-service')
        .set('Cookie', [`token=${authToken}`])
        .send(validReport)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reportId).toBe(reportId);
    });

    test('should return 400 if provider id missing', async () => {
      const response = await request(app)
        .post('/provider-reports-service')
        .set('Cookie', [`token=${authToken}`])
        .send({ ...validReport, providerId: undefined })
        .expect(400);

      expect(response.body.error).toBe('provider id is required');
    });

    test('should return 400 for validation errors', async () => {
      mockValidateProviderReport.mockReturnValue('report message must be at least 20 characters');

      await request(app)
        .post('/provider-reports-service')
        .set('Cookie', [`token=${authToken}`])
        .send({ ...validReport, reportMessage: 'short' })
        .expect(400);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .post('/provider-reports-service')
        .send(validReport)
        .expect(401);
    });

    test('should return 404 if service request not found', async () => {
      mockValidateProviderReport.mockReturnValue(null);
      mockCreateProviderReport.mockRejectedValue(new Error('SERVICE_REQUEST_NOT_FOUND_OR_NOT_YOURS'));

      await request(app)
        .post('/provider-reports-service')
        .set('Cookie', [`token=${authToken}`])
        .send(validReport)
        .expect(404);
    });

    test('should return 409 for duplicate report', async () => {
      mockValidateProviderReport.mockReturnValue(null);
      const error = new Error();
      error.code = 'ER_DUP_ENTRY';
      mockCreateProviderReport.mockRejectedValue(error);

      await request(app)
        .post('/provider-reports-service')
        .set('Cookie', [`token=${authToken}`])
        .send(validReport)
        .expect(409);
    });
  });

  describe('GET /provider-reports-service/:reportId', () => {
    test('should get provider report by id', async () => {
      mockGetProviderReportById.mockResolvedValue(mockReport);

      const response = await request(app)
        .get(`/provider-reports-service/${reportId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.report_id).toBe(reportId);
    });

    test('should return 404 if report not found', async () => {
      mockGetProviderReportById.mockRejectedValue(new Error('REPORT_NOT_FOUND'));

      await request(app)
        .get(`/provider-reports-service/${reportId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get(`/provider-reports-service/${reportId}`)
        .expect(401);
    });
  });

  describe('GET /provider-reports-service/provider/:providerId', () => {
    test('should get provider reports with pagination', async () => {
      const mockData = {
        reports: [mockReport],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 }
      };
      mockGetProviderReports.mockResolvedValue(mockData);

      const response = await request(app)
        .get(`/provider-reports-service/provider/${providerId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test('should support status filter', async () => {
      mockGetProviderReports.mockResolvedValue({
        reports: [],
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 }
      });

      await request(app)
        .get(`/provider-reports-service/provider/${providerId}`)
        .set('Cookie', [`token=${authToken}`])
        .query({ status: 'pending' })
        .expect(200);

      expect(mockGetProviderReports).toHaveBeenCalledWith(providerId, 1, 10, 'pending');
    });

    test('should return 400 for invalid provider id', async () => {
      await request(app)
        .get('/provider-reports-service/provider/invalid')
        .set('Cookie', [`token=${authToken}`])
        .expect(400);
    });
  });

  describe('GET /provider-reports-service/client/:userId', () => {
    test('should get client reports', async () => {
      const mockData = {
        reports: [mockReport],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 }
      };
      mockGetClientReports.mockResolvedValue(mockData);

      const response = await request(app)
        .get(`/provider-reports-service/client/${userId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test('should return 403 if accessing other client reports', async () => {
      await request(app)
        .get('/provider-reports-service/client/other-user')
        .set('Cookie', [`token=${authToken}`])
        .expect(403);
    });
  });

  describe('GET /provider-reports-service/client/:userId/stats', () => {
    test('should get client report stats', async () => {
      mockGetClientReportStats.mockResolvedValue({
        userId,
        totalReports: 3,
        pendingReports: 1,
        reviewingReports: 1,
        resolvedReports: 1,
        rejectedReports: 0
      });

      const response = await request(app)
        .get(`/provider-reports-service/client/${userId}/stats`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalReports).toBe(3);
    });

    test('should return 403 if accessing other user stats', async () => {
      await request(app)
        .get('/provider-reports-service/client/other-user/stats')
        .set('Cookie', [`token=${authToken}`])
        .expect(403);
    });
  });

  describe('PATCH /provider-reports-service/:reportId', () => {
    test('should update report status', async () => {
      mockValidateReportUpdate.mockReturnValue(null);
      mockGetProviderReportById.mockResolvedValue(mockReport);
      mockUpdateProviderReportStatus.mockResolvedValue({ success: true });

      const response = await request(app)
        .patch(`/provider-reports-service/${reportId}`)
        .set('Cookie', [`token=${authToken}`])
        .send({ status: 'reviewing' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return 400 for validation errors', async () => {
      mockValidateReportUpdate.mockReturnValue('invalid status');

      await request(app)
        .patch(`/provider-reports-service/${reportId}`)
        .set('Cookie', [`token=${authToken}`])
        .send({ status: 'invalid' })
        .expect(400);
    });

    test('should return 404 if report not found', async () => {
      mockValidateReportUpdate.mockReturnValue(null);
      mockGetProviderReportById.mockRejectedValue(new Error('REPORT_NOT_FOUND'));

      await request(app)
        .patch(`/provider-reports-service/${reportId}`)
        .set('Cookie', [`token=${authToken}`])
        .send({ status: 'reviewing' })
        .expect(404);
    });
  });

  describe('DELETE /provider-reports-service/:reportId', () => {
    test('should delete provider report', async () => {
      mockGetProviderReportById.mockResolvedValue(mockReport);
      mockDeleteProviderReport.mockResolvedValue({ success: true });

      const response = await request(app)
        .delete(`/provider-reports-service/${reportId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return 404 if report not found', async () => {
      mockGetProviderReportById.mockRejectedValue(new Error('REPORT_NOT_FOUND'));

      await request(app)
        .delete(`/provider-reports-service/${reportId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);
    });
  });
});
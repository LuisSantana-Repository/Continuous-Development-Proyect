// tests/routes/userReports.test.js
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Mock functions
const mockCreateUserReport = jest.fn();
const mockGetUserReportById = jest.fn();
const mockGetUserReports = jest.fn();
const mockGetProviderReports = jest.fn();
const mockUpdateUserReportStatus = jest.fn();
const mockDeleteUserReport = jest.fn();
const mockGetProviderReportStats = jest.fn();
const mockValidateUserReport = jest.fn();
const mockValidateReportUpdate = jest.fn();

jest.unstable_mockModule('../../src/services/userReport.js', () => ({
  createUserReport: mockCreateUserReport,
  getUserReportById: mockGetUserReportById,
  getUserReports: mockGetUserReports,
  getProviderReports: mockGetProviderReports,
  updateUserReportStatus: mockUpdateUserReportStatus,
  deleteUserReport: mockDeleteUserReport,
  getProviderReportStats: mockGetProviderReportStats
}));

jest.unstable_mockModule('../../src/utils/validators.js', () => ({
  validateUserReport: mockValidateUserReport,
  validateReportUpdate: mockValidateReportUpdate
}));

// Import after mocking
const { router: userReportRoutes } = await import('../../src/routes/userReports.js');

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/user-reports', userReportRoutes);

const userId = 'test-user-123';
const reportId = 'report-abc-123';
const providerId = 456;

const createToken = (id = userId) => {
  return jwt.sign({ sub: id }, process.env.JWT_SECRET, { 
    algorithm: 'HS256', expiresIn: '24h' 
  });
};

const validReport = {
  serviceRequestId: 'req-123',
  reportMessage: 'Provider did not show up for the scheduled service appointment'
};

const mockReport = {
  report_id: reportId,
  user_id: userId,
  service_request_id: 'req-123',
  report_message: 'Provider issue',
  status: 'pending',
  created_at: '2025-11-15T10:00:00.000Z'
};

describe('User Report Routes', () => {
  let authToken;

  beforeEach(() => {
    jest.clearAllMocks();
    authToken = createToken();
  });

  describe('POST /user-reports', () => {
    test('should create user report successfully', async () => {
      mockValidateUserReport.mockReturnValue(null);
      mockCreateUserReport.mockResolvedValue({ reportId });

      const response = await request(app)
        .post('/user-reports')
        .set('Cookie', [`token=${authToken}`])
        .send(validReport)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reportId).toBe(reportId);
    });

    test('should return 400 for validation errors', async () => {
      mockValidateUserReport.mockReturnValue('report message must be at least 20 characters');

      await request(app)
        .post('/user-reports')
        .set('Cookie', [`token=${authToken}`])
        .send({ ...validReport, reportMessage: 'short' })
        .expect(400);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .post('/user-reports')
        .send(validReport)
        .expect(401);
    });

    test('should return 404 if service request not found', async () => {
      mockValidateUserReport.mockReturnValue(null);
      mockCreateUserReport.mockRejectedValue(new Error('SERVICE_REQUEST_NOT_FOUND_OR_NOT_YOURS'));

      await request(app)
        .post('/user-reports')
        .set('Cookie', [`token=${authToken}`])
        .send(validReport)
        .expect(404);
    });

    test('should return 409 for duplicate report', async () => {
      mockValidateUserReport.mockReturnValue(null);
      const error = new Error();
      error.code = 'ER_DUP_ENTRY';
      mockCreateUserReport.mockRejectedValue(error);

      await request(app)
        .post('/user-reports')
        .set('Cookie', [`token=${authToken}`])
        .send(validReport)
        .expect(409);
    });
  });

  describe('GET /user-reports/:reportId', () => {
    test('should get user report by id', async () => {
      mockGetUserReportById.mockResolvedValue(mockReport);

      const response = await request(app)
        .get(`/user-reports/${reportId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.report_id).toBe(reportId);
    });

    test('should return 404 if report not found', async () => {
      mockGetUserReportById.mockRejectedValue(new Error('REPORT_NOT_FOUND'));

      await request(app)
        .get(`/user-reports/${reportId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get(`/user-reports/${reportId}`)
        .expect(401);
    });
  });

  describe('GET /user-reports/user/:userId', () => {
    test('should get user reports with pagination', async () => {
      const mockData = {
        reports: [mockReport],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 }
      };
      mockGetUserReports.mockResolvedValue(mockData);

      const response = await request(app)
        .get(`/user-reports/user/${userId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test('should support status filter', async () => {
      mockGetUserReports.mockResolvedValue({
        reports: [],
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 }
      });

      await request(app)
        .get(`/user-reports/user/${userId}`)
        .set('Cookie', [`token=${authToken}`])
        .query({ status: 'pending' })
        .expect(200);

      expect(mockGetUserReports).toHaveBeenCalledWith(userId, 1, 10, 'pending');
    });

    test('should return 403 if accessing other user reports', async () => {
      await request(app)
        .get('/user-reports/user/other-user')
        .set('Cookie', [`token=${authToken}`])
        .expect(403);
    });
  });

  describe('GET /user-reports/provider/:providerId', () => {
    test('should get provider reports', async () => {
      const mockData = {
        reports: [mockReport],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 }
      };
      mockGetProviderReports.mockResolvedValue(mockData);

      const response = await request(app)
        .get(`/user-reports/provider/${providerId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test('should return 400 for invalid provider id', async () => {
      await request(app)
        .get('/user-reports/provider/invalid')
        .set('Cookie', [`token=${authToken}`])
        .expect(400);
    });
  });

  describe('GET /user-reports/provider/:providerId/stats', () => {
    test('should get provider report stats', async () => {
      mockGetProviderReportStats.mockResolvedValue({
        providerId,
        totalReports: 5,
        pendingReports: 2,
        reviewingReports: 1,
        resolvedReports: 2,
        rejectedReports: 0
      });

      const response = await request(app)
        .get(`/user-reports/provider/${providerId}/stats`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalReports).toBe(5);
    });

    test('should return 400 for invalid provider id', async () => {
      await request(app)
        .get('/user-reports/provider/invalid/stats')
        .set('Cookie', [`token=${authToken}`])
        .expect(400);
    });
  });

  describe('PATCH /user-reports/:reportId', () => {
    test('should update report status', async () => {
      mockValidateReportUpdate.mockReturnValue(null);
      mockGetUserReportById.mockResolvedValue(mockReport);
      mockUpdateUserReportStatus.mockResolvedValue({ success: true });

      const response = await request(app)
        .patch(`/user-reports/${reportId}`)
        .set('Cookie', [`token=${authToken}`])
        .send({ status: 'reviewing' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return 400 for validation errors', async () => {
      mockValidateReportUpdate.mockReturnValue('invalid status');

      await request(app)
        .patch(`/user-reports/${reportId}`)
        .set('Cookie', [`token=${authToken}`])
        .send({ status: 'invalid' })
        .expect(400);
    });

    test('should return 404 if report not found', async () => {
      mockValidateReportUpdate.mockReturnValue(null);
      mockGetUserReportById.mockRejectedValue(new Error('REPORT_NOT_FOUND'));

      await request(app)
        .patch(`/user-reports/${reportId}`)
        .set('Cookie', [`token=${authToken}`])
        .send({ status: 'reviewing' })
        .expect(404);
    });
  });

  describe('DELETE /user-reports/:reportId', () => {
    test('should delete user report', async () => {
      mockGetUserReportById.mockResolvedValue(mockReport);
      mockDeleteUserReport.mockResolvedValue({ success: true });

      const response = await request(app)
        .delete(`/user-reports/${reportId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return 403 if not report owner', async () => {
      mockGetUserReportById.mockResolvedValue({ ...mockReport, user_id: 'other-user' });

      await request(app)
        .delete(`/user-reports/${reportId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(403);
    });

    test('should return 404 if report not found', async () => {
      mockGetUserReportById.mockRejectedValue(new Error('REPORT_NOT_FOUND'));

      await request(app)
        .delete(`/user-reports/${reportId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);
    });
  });
});
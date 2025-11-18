// tests/routes/providerReviews.test.js
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Mock functions
const mockCreateProviderReview = jest.fn();
const mockGetProviderReviewById = jest.fn();
const mockGetUserReceivedReviews = jest.fn();
const mockGetProviderCreatedReviews = jest.fn();
const mockUpdateProviderReview = jest.fn();
const mockDeleteProviderReview = jest.fn();
const mockGetUserRating = jest.fn();
const mockValidateProviderReview = jest.fn();
const mockValidateReviewUpdate = jest.fn();

jest.unstable_mockModule('../../src/services/providerReview.js', () => ({
  createProviderReview: mockCreateProviderReview,
  getProviderReviewById: mockGetProviderReviewById,
  getUserReceivedReviews: mockGetUserReceivedReviews,
  getProviderCreatedReviews: mockGetProviderCreatedReviews,
  updateProviderReview: mockUpdateProviderReview,
  deleteProviderReview: mockDeleteProviderReview,
  getUserRating: mockGetUserRating
}));

jest.unstable_mockModule('../../src/utils/validators.js', () => ({
  validateProviderReview: mockValidateProviderReview,
  validateReviewUpdate: mockValidateReviewUpdate
}));

// Import after mocking
const { router: providerReviewRoutes } = await import('../../src/routes/providerReviews.js');

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/provider-reviews', providerReviewRoutes);

const userId = 'test-user-123';
const providerId = 456;
const reviewId = 'review-abc-123';

const createToken = (id = userId) => {
  return jwt.sign({ sub: id }, process.env.JWT_SECRET, { 
    algorithm: 'HS256', expiresIn: '24h' 
  });
};

const validReview = {
  providerId,
  userId,
  serviceRequestId: 'req-123',
  rating: 5,
  comment: 'Excellent client, very respectful!'
};

const mockReview = {
  review_id: reviewId,
  provider_id: providerId,
  user_id: userId,
  rating: 5,
  comment: 'Great client',
  created_at: '2025-11-15T10:00:00.000Z'
};

describe('Provider Review Routes', () => {
  let authToken;

  beforeEach(() => {
    jest.clearAllMocks();
    authToken = createToken();
  });

  describe('POST /provider-reviews', () => {
    test('should create provider review successfully', async () => {
      mockValidateProviderReview.mockReturnValue(null);
      mockCreateProviderReview.mockResolvedValue({ reviewId });

      const response = await request(app)
        .post('/provider-reviews')
        .set('Cookie', [`token=${authToken}`])
        .send(validReview)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviewId).toBe(reviewId);
    });

    test('should return 400 if provider id missing', async () => {
      const response = await request(app)
        .post('/provider-reviews')
        .set('Cookie', [`token=${authToken}`])
        .send({ ...validReview, providerId: undefined })
        .expect(400);

      expect(response.body.error).toBe('provider id is required');
    });

    test('should return 400 for validation errors', async () => {
      mockValidateProviderReview.mockReturnValue('rating must be a number between 1 and 5');

      await request(app)
        .post('/provider-reviews')
        .set('Cookie', [`token=${authToken}`])
        .send({ ...validReview, rating: 6 })
        .expect(400);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .post('/provider-reviews')
        .send(validReview)
        .expect(401);
    });

    test('should return 404 if user not found', async () => {
      mockValidateProviderReview.mockReturnValue(null);
      mockCreateProviderReview.mockRejectedValue(new Error('USER_NOT_FOUND'));

      await request(app)
        .post('/provider-reviews')
        .set('Cookie', [`token=${authToken}`])
        .send(validReview)
        .expect(404);
    });

    test('should return 409 for duplicate review', async () => {
      mockValidateProviderReview.mockReturnValue(null);
      const error = new Error();
      error.code = 'ER_DUP_ENTRY';
      mockCreateProviderReview.mockRejectedValue(error);

      await request(app)
        .post('/provider-reviews')
        .set('Cookie', [`token=${authToken}`])
        .send(validReview)
        .expect(409);
    });
  });

  describe('GET /provider-reviews/:reviewId', () => {
    test('should get provider review by id', async () => {
      mockGetProviderReviewById.mockResolvedValue(mockReview);

      const response = await request(app)
        .get(`/provider-reviews/${reviewId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.review_id).toBe(reviewId);
    });

    test('should return 404 if review not found', async () => {
      mockGetProviderReviewById.mockRejectedValue(new Error('REVIEW_NOT_FOUND'));

      await request(app)
        .get(`/provider-reviews/${reviewId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get(`/provider-reviews/${reviewId}`)
        .expect(401);
    });
  });

  describe('GET /provider-reviews/user/:userId', () => {
    test('should get user received reviews', async () => {
      const mockData = {
        reviews: [mockReview],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 }
      };
      mockGetUserReceivedReviews.mockResolvedValue(mockData);

      const response = await request(app)
        .get(`/provider-reviews/user/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test('should support pagination and filters', async () => {
      mockGetUserReceivedReviews.mockResolvedValue({
        reviews: [],
        pagination: { page: 2, pageSize: 5, total: 0, totalPages: 0 }
      });

      await request(app)
        .get(`/provider-reviews/user/${userId}`)
        .query({ page: 2, pageSize: 5, minRating: 4 })
        .expect(200);

      expect(mockGetUserReceivedReviews).toHaveBeenCalledWith(userId, 2, 5, 4);
    });
  });

  describe('GET /provider-reviews/provider/:providerId', () => {
    test('should get provider created reviews', async () => {
      const mockData = {
        reviews: [mockReview],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 }
      };
      mockGetProviderCreatedReviews.mockResolvedValue(mockData);

      const response = await request(app)
        .get(`/provider-reviews/provider/${providerId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test('should return 400 for invalid provider id', async () => {
      await request(app)
        .get('/provider-reviews/provider/invalid')
        .set('Cookie', [`token=${authToken}`])
        .expect(400);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get(`/provider-reviews/provider/${providerId}`)
        .expect(401);
    });
  });

  describe('GET /provider-reviews/user/:userId/rating', () => {
    test('should get user rating', async () => {
      mockGetUserRating.mockResolvedValue({
        userId,
        averageRating: 4.8,
        totalReviews: 15
      });

      const response = await request(app)
        .get(`/provider-reviews/user/${userId}/rating`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.averageRating).toBe(4.8);
    });
  });

  describe('PATCH /provider-reviews/:reviewId', () => {
    test('should update provider review', async () => {
      mockValidateReviewUpdate.mockReturnValue(null);
      mockGetProviderReviewById.mockResolvedValue(mockReview);
      mockUpdateProviderReview.mockResolvedValue({ success: true });

      const response = await request(app)
        .patch(`/provider-reviews/${reviewId}`)
        .set('Cookie', [`token=${authToken}`])
        .send({ rating: 4 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return 400 for validation errors', async () => {
      mockValidateReviewUpdate.mockReturnValue('invalid rating');

      await request(app)
        .patch(`/provider-reviews/${reviewId}`)
        .set('Cookie', [`token=${authToken}`])
        .send({ rating: 0 })
        .expect(400);
    });

    test('should return 404 if review not found', async () => {
      mockValidateReviewUpdate.mockReturnValue(null);
      mockGetProviderReviewById.mockRejectedValue(new Error('REVIEW_NOT_FOUND'));

      await request(app)
        .patch(`/provider-reviews/${reviewId}`)
        .set('Cookie', [`token=${authToken}`])
        .send({ rating: 4 })
        .expect(404);
    });
  });

  describe('DELETE /provider-reviews/:reviewId', () => {
    test('should delete provider review', async () => {
      mockGetProviderReviewById.mockResolvedValue(mockReview);
      mockDeleteProviderReview.mockResolvedValue({ success: true });

      const response = await request(app)
        .delete(`/provider-reviews/${reviewId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return 404 if review not found', async () => {
      mockGetProviderReviewById.mockRejectedValue(new Error('REVIEW_NOT_FOUND'));

      await request(app)
        .delete(`/provider-reviews/${reviewId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);
    });
  });
});
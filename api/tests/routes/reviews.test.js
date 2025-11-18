// tests/routes/reviews.test.js
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Mock functions
const mockCreateReview = jest.fn();
const mockGetReviewById = jest.fn();
const mockGetProviderReviews = jest.fn();
const mockGetUserReviews = jest.fn();
const mockUpdateReview = jest.fn();
const mockDeleteReview = jest.fn();
const mockGetProviderRating = jest.fn();
const mockValidateReview = jest.fn();
const mockValidateReviewUpdate = jest.fn();

jest.unstable_mockModule('../../src/services/review.js', () => ({
  createReview: mockCreateReview,
  getReviewById: mockGetReviewById,
  getProviderReviews: mockGetProviderReviews,
  getUserReviews: mockGetUserReviews,
  updateReview: mockUpdateReview,
  deleteReview: mockDeleteReview,
  getProviderRating: mockGetProviderRating
}));

jest.unstable_mockModule('../../src/utils/validators.js', () => ({
  validateReview: mockValidateReview,
  validateReviewUpdate: mockValidateReviewUpdate
}));

// Import after mocking
const { router: reviewRoutes } = await import('../../src/routes/reviews.js');

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/reviews', reviewRoutes);

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
  serviceRequestId: 'req-123',
  rating: 5,
  comment: 'Excellent service, very professional!'
};

const mockReview = {
  review_id: reviewId,
  user_id: userId,
  provider_id: providerId,
  rating: 5,
  comment: 'Great service',
  created_at: '2025-11-15T10:00:00.000Z'
};

describe('Review Routes', () => {
  let authToken;

  beforeEach(() => {
    jest.clearAllMocks();
    authToken = createToken();
  });

  describe('POST /reviews', () => {
    test('should create review successfully', async () => {
      mockValidateReview.mockReturnValue(null);
      mockCreateReview.mockResolvedValue({ reviewId });

      const response = await request(app)
        .post('/reviews')
        .set('Cookie', [`token=${authToken}`])
        .send(validReview)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviewId).toBe(reviewId);
    });

    test('should return 400 for validation errors', async () => {
      mockValidateReview.mockReturnValue('rating must be a number between 1 and 5');

      await request(app)
        .post('/reviews')
        .set('Cookie', [`token=${authToken}`])
        .send({ ...validReview, rating: 6 })
        .expect(400);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .post('/reviews')
        .send(validReview)
        .expect(401);
    });

    test('should return 404 if provider not found', async () => {
      mockValidateReview.mockReturnValue(null);
      mockCreateReview.mockRejectedValue(new Error('PROVIDER_NOT_FOUND'));

      await request(app)
        .post('/reviews')
        .set('Cookie', [`token=${authToken}`])
        .send(validReview)
        .expect(404);
    });

    test('should return 409 for duplicate review', async () => {
      mockValidateReview.mockReturnValue(null);
      const error = new Error();
      error.code = 'ER_DUP_ENTRY';
      mockCreateReview.mockRejectedValue(error);

      await request(app)
        .post('/reviews')
        .set('Cookie', [`token=${authToken}`])
        .send(validReview)
        .expect(409);
    });
  });

  describe('GET /reviews/:reviewId', () => {
    test('should get review by id', async () => {
      mockGetReviewById.mockResolvedValue(mockReview);

      const response = await request(app)
        .get(`/reviews/${reviewId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.review_id).toBe(reviewId);
    });

    test('should return 404 if review not found', async () => {
      mockGetReviewById.mockRejectedValue(new Error('REVIEW_NOT_FOUND'));

      await request(app)
        .get(`/reviews/${reviewId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get(`/reviews/${reviewId}`)
        .expect(401);
    });
  });

  describe('GET /reviews/provider/:providerId', () => {
    test('should get provider reviews', async () => {
      const mockData = {
        reviews: [mockReview],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 }
      };
      mockGetProviderReviews.mockResolvedValue(mockData);

      const response = await request(app)
        .get(`/reviews/provider/${providerId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test('should filter by minimum rating', async () => {
      mockGetProviderReviews.mockResolvedValue({
        reviews: [],
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 }
      });

      await request(app)
        .get(`/reviews/provider/${providerId}`)
        .query({ minRating: 4 })
        .expect(200);

      expect(mockGetProviderReviews).toHaveBeenCalledWith(providerId, 1, 10, 4);
    });

    test('should return 400 for invalid provider id', async () => {
      await request(app)
        .get('/reviews/provider/invalid')
        .expect(400);
    });
  });

  describe('GET /reviews/provider/:providerId/rating', () => {
    test('should get provider rating', async () => {
      mockGetProviderRating.mockResolvedValue({
        providerId,
        averageRating: 4.5,
        totalReviews: 10
      });

      const response = await request(app)
        .get(`/reviews/provider/${providerId}/rating`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.averageRating).toBe(4.5);
    });

    test('should return 400 for invalid provider id', async () => {
      await request(app)
        .get('/reviews/provider/invalid/rating')
        .expect(400);
    });
  });

  describe('PATCH /reviews/:reviewId', () => {
    test('should update review', async () => {
      mockValidateReviewUpdate.mockReturnValue(null);
      mockGetReviewById.mockResolvedValue(mockReview);
      mockUpdateReview.mockResolvedValue({ success: true });

      const response = await request(app)
        .patch(`/reviews/${reviewId}`)
        .set('Cookie', [`token=${authToken}`])
        .send({ rating: 4 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return 403 if not review owner', async () => {
      mockValidateReviewUpdate.mockReturnValue(null);
      mockGetReviewById.mockResolvedValue({ ...mockReview, user_id: 'other-user' });

      await request(app)
        .patch(`/reviews/${reviewId}`)
        .set('Cookie', [`token=${authToken}`])
        .send({ rating: 4 })
        .expect(403);
    });

    test('should return 400 for validation errors', async () => {
      mockValidateReviewUpdate.mockReturnValue('invalid rating');

      await request(app)
        .patch(`/reviews/${reviewId}`)
        .set('Cookie', [`token=${authToken}`])
        .send({ rating: 0 })
        .expect(400);
    });
  });

  describe('DELETE /reviews/:reviewId', () => {
    test('should delete review', async () => {
      mockGetReviewById.mockResolvedValue(mockReview);
      mockDeleteReview.mockResolvedValue({ success: true });

      const response = await request(app)
        .delete(`/reviews/${reviewId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return 403 if not review owner', async () => {
      mockGetReviewById.mockResolvedValue({ ...mockReview, user_id: 'other-user' });

      await request(app)
        .delete(`/reviews/${reviewId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(403);
    });

    test('should return 404 if review not found', async () => {
      mockGetReviewById.mockRejectedValue(new Error('REVIEW_NOT_FOUND'));

      await request(app)
        .delete(`/reviews/${reviewId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);
    });
  });
});
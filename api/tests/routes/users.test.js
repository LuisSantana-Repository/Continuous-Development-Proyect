// tests/routes/users.test.js
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Mock functions
const mockGetUserProfile = jest.fn();

jest.unstable_mockModule('../../src/services/user.js', () => ({
  getUserProfile: mockGetUserProfile
}));

// Import after mocking
const { router: userRoutes } = await import('../../src/routes/users.js');

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/users', userRoutes);

const userId = 'test-user-123';

const createToken = (id = userId) => {
  return jwt.sign({ sub: id }, process.env.JWT_SECRET, { 
    algorithm: 'HS256', expiresIn: '24h' 
  });
};

const mockUser = {
  user_id: userId,
  email: 'test@example.com',
  username: 'testuser',
  provider: false,
  Foto: 'data:image/jpeg;base64,/9j/4AAQ...',
  Latitude: 20.6597,
  Longitude: -103.3496,
  created_at: '2025-11-15T10:00:00.000Z'
};

describe('User Routes', () => {
  let authToken;

  beforeEach(() => {
    jest.clearAllMocks();
    authToken = createToken();
  });

  describe('GET /users/me', () => {
    test('should get user profile successfully', async () => {
      mockGetUserProfile.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/users/me')
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.user).toEqual(mockUser);
      expect(mockGetUserProfile).toHaveBeenCalledWith(userId);
    });

    test('should return 404 if user not found', async () => {
      mockGetUserProfile.mockRejectedValue(new Error('USER_NOT_FOUND'));

      const response = await request(app)
        .get('/users/me')
        .set('Cookie', [`token=${authToken}`])
        .expect(404);

      expect(response.body.error).toBe('user not found');
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get('/users/me')
        .expect(401);
    });

    test('should return 500 for server errors', async () => {
      mockGetUserProfile.mockRejectedValue(new Error('Database error'));

      await request(app)
        .get('/users/me')
        .set('Cookie', [`token=${authToken}`])
        .expect(500);
    });
  });
});
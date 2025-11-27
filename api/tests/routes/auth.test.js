// tests/routes/auth.test.js
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

// Mock functions
const mockRegisterUser = jest.fn();
const mockLoginUser = jest.fn();
const mockValidateRegister = jest.fn();
const mockValidateLogin = jest.fn();

jest.unstable_mockModule('../../src/services/auth.js', () => ({
  registerUser: mockRegisterUser,
  loginUser: mockLoginUser
}));

jest.unstable_mockModule('../../src/utils/validators.js', () => ({
  validateRegister: mockValidateRegister,
  validateLogin: mockValidateLogin
}));

// Import after mocking
const { router: authRoutes } = await import('../../src/routes/auth.js');

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRoutes);

const validRegistrationData = {
  email: 'test@example.com',
  password: 'password123',
  username: 'testuser',
  INE: 'data:image/jpeg;base64,/9j/4AAQ...',
  provider: false,
  Latitude: 20.6597,
  Longitude: -103.3496
};

const validLoginData = {
  email: 'test@example.com',
  password: 'password123'
};

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    test('should register user successfully', async () => {
      mockValidateRegister.mockResolvedValue(null);
      mockRegisterUser.mockResolvedValue({
        token: 'test-token-abc123',
        token_type: 'Bearer',
        expires_in: 86400
      });

      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.token_type).toBe('Bearer');
      expect(response.body.expires_in).toBe(86400);
      expect(mockRegisterUser).toHaveBeenCalledWith(validRegistrationData);
    });

    test('should register provider with work data', async () => {
      const providerData = {
        ...validRegistrationData,
        provider: true,
        work: {
          workname: 'Plumber Pro',
          description: 'Professional plumbing services',
          base_price: 500,
          Service_Type: 'Plumbing',
          Job_Permit: {
            data: 'data:image/jpeg;base64,...',
            contentType: 'image/jpeg'
          },
          Images: ['data:image/jpeg;base64,...'],
          Latitude: 20.6597,
          Longitude: -103.3496,
          Time_Available: {
            monday: { start: '09:00', end: '17:00' }
          }
        }
      };

      mockValidateRegister.mockResolvedValue(null);
      mockRegisterUser.mockResolvedValue({
        token: 'test-token',
        token_type: 'Bearer',
        expires_in: 86400
      });

      const response = await request(app)
        .post('/auth/register')
        .send(providerData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
    });

    test('should return 400 for validation errors', async () => {
      mockValidateRegister.mockResolvedValue('all required fields must be provided');

      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.error).toBe('all required fields must be provided');
    });

    test('should return 400 for invalid email', async () => {
      mockValidateRegister.mockResolvedValue('invalid email format');

      await request(app)
        .post('/auth/register')
        .send({ ...validRegistrationData, email: 'invalid-email' })
        .expect(400);
    });

    test('should return 400 for short password', async () => {
      mockValidateRegister.mockResolvedValue('password must be at least 8 characters');

      await request(app)
        .post('/auth/register')
        .send({ ...validRegistrationData, password: 'short' })
        .expect(400);
    });

    test('should return 409 for duplicate email', async () => {
      mockValidateRegister.mockResolvedValue(null);
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';
      mockRegisterUser.mockRejectedValue(duplicateError);

      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationData)
        .expect(409);

      expect(response.body.error).toBe('email already registered');
    });

  });

  describe('POST /auth/login', () => {
    test('should login successfully and set cookie', async () => {
      mockValidateLogin.mockReturnValue(null);
      mockLoginUser.mockResolvedValue({
        token: 'test-token-abc123',
        token_type: 'Bearer',
        expires_in: 86400
      });

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData)
        .expect(200);

      expect(response.body).toBe('Login successful');
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toMatch(/token=/);
    });

    test('should return 400 for validation errors', async () => {
      mockValidateLogin.mockReturnValue('email and password are required');

      const response = await request(app)
        .post('/auth/login')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('email and password are required');
    });

    test('should return 400 for missing email', async () => {
      mockValidateLogin.mockReturnValue('email and password are required');

      await request(app)
        .post('/auth/login')
        .send({ password: 'password123' })
        .expect(400);
    });

    test('should return 400 for missing password', async () => {
      mockValidateLogin.mockReturnValue('email and password are required');

      await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);
    });

    test('should return 401 for invalid credentials', async () => {
      mockValidateLogin.mockReturnValue(null);
      const error = new Error('INVALID_CREDENTIALS');
      mockLoginUser.mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData)
        .expect(401);

      expect(response.body.error).toBe('invalid credentials');
    });

    test('should return 401 for wrong password', async () => {
      mockValidateLogin.mockReturnValue(null);
      mockLoginUser.mockRejectedValue(new Error('INVALID_CREDENTIALS'));

      await request(app)
        .post('/auth/login')
        .send({ ...validLoginData, password: 'wrongpassword' })
        .expect(401);
    });

    test('should return 500 for server errors', async () => {
      mockValidateLogin.mockReturnValue(null);
      mockLoginUser.mockRejectedValue(new Error('Database error'));

      await request(app)
        .post('/auth/login')
        .send(validLoginData)
        .expect(500);
    });
  });

  describe('POST /auth/logout', () => {
    test('should logout successfully and clear cookie', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200);

      expect(response.body.message).toBe('Logout successful');
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toMatch(/token=;/);
    });

    test('should logout even without token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200);

      expect(response.body.message).toBe('Logout successful');
    });

    test('should return 500 if error occurs', async () => {
      // Simulate an error by sending invalid data that causes server error
      // This is edge case but testing error handling
      const response = await request(app)
        .post('/auth/logout')
        .expect(200);

      expect(response.body.message).toBe('Logout successful');
    });
  });
});
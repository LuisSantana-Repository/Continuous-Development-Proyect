// tests/routes/payment.test.js
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Mock functions
const mockCreatePayment = jest.fn();
const mockGetPaymentById = jest.fn();
const mockUpdatePaymentStatus = jest.fn();

jest.unstable_mockModule('../../src/services/payment.js', () => ({
  createPayment: mockCreatePayment,
  getPaymentById: mockGetPaymentById
}));

jest.unstable_mockModule('../../src/services/serviceRequest.js', () => ({
  updatePaymentStatus: mockUpdatePaymentStatus
}));

// Import after mocking
const { router: paymentRoutes } = await import('../../src/routes/payment.js');

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/payments', paymentRoutes);

const userId = 'test-user-123';
const requestId = 'req-abc-123';
const paymentId = 'pay-xyz-789';

const createToken = (id = userId) => {
  return jwt.sign({ sub: id }, process.env.JWT_SECRET, { 
    algorithm: 'HS256', expiresIn: '24h' 
  });
};

const validPaymentData = {
  requestId,
  cardDetails: {
    number: '4242424242424242',
    exp_month: 12,
    exp_year: 2025,
    cvc: '123'
  },
  paymentStatus: 'paid'
};

const mockPayment = {
  payment_id: paymentId,
  request_id: requestId,
  date: new Date(),
  amount: 500,
  cardDetails: '****4242'
};

describe('Payment Routes', () => {
  let authToken;

  beforeEach(() => {
    jest.clearAllMocks();
    authToken = createToken();
  });

  describe('POST /payments', () => {
    test('should create payment successfully', async () => {
      mockCreatePayment.mockResolvedValue({ paymentId });
      mockUpdatePaymentStatus.mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/payments')
        .set('Cookie', [`token=${authToken}`])
        .send(validPaymentData)
        .expect(201);

      expect(response.body.payment).toHaveProperty('paymentId');
      expect(response.body.payment_status).toHaveProperty('success');
      expect(mockCreatePayment).toHaveBeenCalledWith(validPaymentData);
      expect(mockUpdatePaymentStatus).toHaveBeenCalledWith(validPaymentData);
    });

    test('should create payment with full card details', async () => {
      mockCreatePayment.mockResolvedValue({ paymentId });
      mockUpdatePaymentStatus.mockResolvedValue({ success: true });

      const paymentWithFullCard = {
        requestId,
        cardDetails: {
          number: '4242424242424242',
          exp_month: 12,
          exp_year: 2025,
          cvc: '123',
          name: 'John Doe'
        },
        paymentStatus: 'paid'
      };

      const response = await request(app)
        .post('/payments')
        .set('Cookie', [`token=${authToken}`])
        .send(paymentWithFullCard)
        .expect(201);

      expect(response.body.payment.paymentId).toBe(paymentId);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .post('/payments')
        .send(validPaymentData)
        .expect(401);
    });

    test('should return 500 if service request not found', async () => {
      mockCreatePayment.mockRejectedValue(new Error('SERVICE_REQUEST_NOT_FOUND'));

      await request(app)
        .post('/payments')
        .set('Cookie', [`token=${authToken}`])
        .send(validPaymentData)
        .expect(500);
    });

    test('should return 500 for payment processing errors', async () => {
      mockCreatePayment.mockRejectedValue(new Error('Payment gateway error'));

      await request(app)
        .post('/payments')
        .set('Cookie', [`token=${authToken}`])
        .send(validPaymentData)
        .expect(500);
    });

    test('should return 500 if update status fails', async () => {
      mockCreatePayment.mockResolvedValue({ paymentId });
      mockUpdatePaymentStatus.mockRejectedValue(new Error('Database error'));

      await request(app)
        .post('/payments')
        .set('Cookie', [`token=${authToken}`])
        .send(validPaymentData)
        .expect(500);
    });
  });

  describe('GET /payments/:requestId', () => {
    test('should get payment by request id', async () => {
      mockGetPaymentById.mockResolvedValue(mockPayment);

      const response = await request(app)
        .get(`/payments/${requestId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.payment_id).toBe(paymentId);
      expect(response.body.request_id).toBe(requestId);
      expect(mockGetPaymentById).toHaveBeenCalledWith(requestId);
    });

    test('should return payment with amount', async () => {
      mockGetPaymentById.mockResolvedValue(mockPayment);

      const response = await request(app)
        .get(`/payments/${requestId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.amount).toBe(500);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get(`/payments/${requestId}`)
        .expect(401);
    });

    test('should return 500 if payment not found', async () => {
      mockGetPaymentById.mockRejectedValue(new Error('PAYMENT_NOT_FOUND'));

      await request(app)
        .get(`/payments/${requestId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(500);
    });

    test('should return 500 for database errors', async () => {
      mockGetPaymentById.mockRejectedValue(new Error('Database connection failed'));

      await request(app)
        .get(`/payments/${requestId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(500);
    });

    test('should not expose full card details', async () => {
      mockGetPaymentById.mockResolvedValue(mockPayment);

      const response = await request(app)
        .get(`/payments/${requestId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      // Card details should be masked
      expect(response.body.cardDetails).toBe('****4242');
      expect(response.body.cardDetails).not.toMatch(/4242424242424242/);
    });

    test('should return payment date', async () => {
      mockGetPaymentById.mockResolvedValue(mockPayment);

      const response = await request(app)
        .get(`/payments/${requestId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body).toHaveProperty('date');
    });
  });
});
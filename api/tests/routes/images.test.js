// tests/routes/images.test.js
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock function
const mockGetS3Object = jest.fn();

jest.unstable_mockModule('../../src/services/storage.js', () => ({
  getS3Object: mockGetS3Object
}));

// Import after mocking
const { router: imageRoutes } = await import('../../src/routes/images.js');

// Create test app
const app = express();
app.use(express.json());
app.use('/images', imageRoutes);

const mockImageData = {
  Body: Buffer.from('fake-image-data'),
  ContentType: 'image/jpeg',
  ContentLength: 1024
};

describe('Image Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /images/*', () => {
    test('should get image from S3', async () => {
      mockGetS3Object.mockResolvedValue(mockImageData);

      const response = await request(app)
        .get('/images/profile/test-image.jpg')
        .expect(200);

      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.headers['cache-control']).toMatch(/max-age/);
      expect(mockGetS3Object).toHaveBeenCalledWith('profile/test-image.jpg');
    });

    test('should get image with subdirectories', async () => {
      mockGetS3Object.mockResolvedValue(mockImageData);

      await request(app)
        .get('/images/INE/user123/front.jpg')
        .expect(200);

      expect(mockGetS3Object).toHaveBeenCalledWith('INE/user123/front.jpg');
    });

    test('should handle PNG images', async () => {
      mockGetS3Object.mockResolvedValue({
        ...mockImageData,
        ContentType: 'image/png'
      });

      const response = await request(app)
        .get('/images/profile/avatar.png')
        .expect(200);

      expect(response.headers['content-type']).toBe('image/png');
    });

    test('should handle WebP images', async () => {
      mockGetS3Object.mockResolvedValue({
        ...mockImageData,
        ContentType: 'image/webp'
      });

      const response = await request(app)
        .get('/images/service_images/service.webp')
        .expect(200);

      expect(response.headers['content-type']).toBe('image/webp');
    });

    test('should return 400 if key is missing', async () => {
      const response = await request(app)
        .get('/images/')
        .expect(400); // Express returns 404 for empty path

      // Or if you want to test the actual empty key scenario:
      // This would require modifying the route to handle this case
    });

    test('should return 404 if image not found', async () => {
      const notFoundError = new Error('not found');
      notFoundError.name = 'NoSuchKey';
      mockGetS3Object.mockRejectedValue(notFoundError);

      const response = await request(app)
        .get('/images/profile/nonexistent.jpg')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Image not found');
    });

    test('should return 404 for NoSuchKey error', async () => {
      const error = new Error('Key not found');
      error.name = 'NoSuchKey';
      mockGetS3Object.mockRejectedValue(error);

      await request(app)
        .get('/images/missing/image.jpg')
        .expect(404);
    });

    test('should return 500 for S3 errors', async () => {
      mockGetS3Object.mockRejectedValue(new Error('S3 connection failed'));

      const response = await request(app)
        .get('/images/profile/test.jpg')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch image');
    });

    test('should set cache control header', async () => {
      mockGetS3Object.mockResolvedValue(mockImageData);

      const response = await request(app)
        .get('/images/profile/test.jpg')
        .expect(200);

      expect(response.headers['cache-control']).toBe('public, max-age=31536000');
    });

    test('should use default content type if not provided', async () => {
      mockGetS3Object.mockResolvedValue({
        Body: Buffer.from('fake-image-data'),
        ContentType: null,
        ContentLength: 1024
      });

      const response = await request(app)
        .get('/images/profile/test.jpg')
        .expect(200);

      expect(response.headers['content-type']).toBe('image/jpeg');
    });

    test('should handle deep nested paths', async () => {
      mockGetS3Object.mockResolvedValue(mockImageData);

      await request(app)
        .get('/images/Work_permit/providers/123/permit.jpg')
        .expect(200);

      expect(mockGetS3Object).toHaveBeenCalledWith('Work_permit/providers/123/permit.jpg');
    });

    test('should handle special characters in filenames', async () => {
      mockGetS3Object.mockResolvedValue(mockImageData);

      await request(app)
        .get('/images/profile/test-image_2023.jpg')
        .expect(200);

      expect(mockGetS3Object).toHaveBeenCalledWith('profile/test-image_2023.jpg');
    });
  });
});
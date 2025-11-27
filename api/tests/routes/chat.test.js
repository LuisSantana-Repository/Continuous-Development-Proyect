// tests/routes/chat.test.js
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Mock functions
const mockGetOrCreateChat = jest.fn();
const mockGetChatById = jest.fn();
const mockGetUserChats = jest.fn();
const mockGetChatMessages = jest.fn();
const mockSendMessage = jest.fn();
const mockMarkMessagesAsRead = jest.fn();
const mockGetProviderChat = jest.fn();
const mockGetProviderName = jest.fn();
const mockGetUserName = jest.fn();
const mockGetProviderIdUsingUserId = jest.fn();

jest.unstable_mockModule('../../src/services/chat.js', () => ({
  getOrCreateChat: mockGetOrCreateChat,
  getChatById: mockGetChatById,
  getUserChats: mockGetUserChats,
  getChatMessages: mockGetChatMessages,
  sendMessage: mockSendMessage,
  markMessagesAsRead: mockMarkMessagesAsRead,
  getProviderChat: mockGetProviderChat,
  getProviderName: mockGetProviderName,
  getUserName: mockGetUserName,
  getProviderIdUsingUserId: mockGetProviderIdUsingUserId
}));

// Import after mocking
const { router: chatRoutes } = await import('../../src/routes/chat.js');

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/chats', chatRoutes);

const userId = 'test-user-123';
const providerId = 456;
const chatId = 'chat-abc-123';

const createToken = (id = userId, isProvider = false) => {
  return jwt.sign({ sub: id, provider: isProvider }, process.env.JWT_SECRET, { 
    algorithm: 'HS256', expiresIn: '24h' 
  });
};

const mockChat = {
  chat_id: chatId,
  user_id: userId,
  provider_id: providerId,
  created_at: Date.now(),
  last_message: 'Hello',
  unread_count_user: 0,
  unread_count_provider: 0
};

const mockMessage = {
  message_id: 'msg-123',
  chat_id: chatId,
  sender_id: userId,
  content: 'Hello there',
  timestamp: Date.now(),
  is_provider: false,
  read_by_user: true,
  read_by_provider: false
};

describe('Chat Routes', () => {
  let authToken, providerToken;

  beforeEach(() => {
    jest.clearAllMocks();
    authToken = createToken();
    providerToken = createToken('provider-id', true);
  });

  describe('POST /chats', () => {
    test('should create or get existing chat', async () => {
      mockGetOrCreateChat.mockResolvedValue(mockChat);

      const response = await request(app)
        .post('/chats')
        .set('Cookie', [`token=${authToken}`])
        .send({ providerId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chat_id).toBe(chatId);
      expect(mockGetOrCreateChat).toHaveBeenCalledWith(userId, providerId);
    });

    test('should return 400 without provider id', async () => {
      const response = await request(app)
        .post('/chats')
        .set('Cookie', [`token=${authToken}`])
        .send({})
        .expect(400);

      expect(response.body.error).toBe('provider id is required');
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .post('/chats')
        .send({ providerId })
        .expect(401);
    });

    test('should return 500 for server errors', async () => {
      mockGetOrCreateChat.mockRejectedValue(new Error('Database error'));

      await request(app)
        .post('/chats')
        .set('Cookie', [`token=${authToken}`])
        .send({ providerId })
        .expect(500);
    });
  });

  describe('GET /chats', () => {
    test('should get user chats', async () => {
      const mockChats = [
        { chat_id: 'chat-1', provider_id: 123 },
        { chat_id: 'chat-2', provider_id: 456 }
      ];
      mockGetUserChats.mockResolvedValue(mockChats);
      mockGetProviderName.mockResolvedValue('Provider Name');
      mockGetProviderIdUsingUserId.mockResolvedValue(null);

      const response = await request(app)
        .get('/chats')
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    test('should include provider chats if user is provider', async () => {
      const userChats = [{ chat_id: 'chat-1', provider_id: 123 }];
      const providerChats = [{ chat_id: 'chat-2', user_id: 'user-456' }];

      mockGetUserChats.mockResolvedValue(userChats);
      mockGetProviderIdUsingUserId.mockResolvedValue(789);
      mockGetProviderChat.mockResolvedValue(providerChats);
      mockGetProviderName.mockResolvedValue('Provider Name');
      mockGetUserName.mockResolvedValue('User Name');

      const response = await request(app)
        .get('/chats')
        .set('Cookie', [`token=${providerToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get('/chats')
        .expect(401);
    });

    test('should return 500 for server errors', async () => {
      mockGetUserChats.mockRejectedValue(new Error('Database error'));

      await request(app)
        .get('/chats')
        .set('Cookie', [`token=${authToken}`])
        .expect(500);
    });
  });

  describe('GET /chats/:chatId', () => {
    test('should get chat by id', async () => {
      mockGetChatById.mockResolvedValue(mockChat);

      const response = await request(app)
        .get(`/chats/${chatId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chat_id).toBe(chatId);
    });

    test('should allow provider access', async () => {
      mockGetChatById.mockResolvedValue(mockChat);

      const response = await request(app)
        .get(`/chats/${chatId}`)
        .set('Cookie', [`token=${providerToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return 403 if user does not have access', async () => {
      mockGetChatById.mockResolvedValue({
        ...mockChat,
        user_id: 'other-user'
      });

      await request(app)
        .get(`/chats/${chatId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(403);
    });

    test('should return 404 if chat not found', async () => {
      mockGetChatById.mockRejectedValue(new Error('CHAT_NOT_FOUND'));

      const response = await request(app)
        .get(`/chats/${chatId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);

      expect(response.body.error).toBe('chat not found');
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get(`/chats/${chatId}`)
        .expect(401);
    });
  });

  describe('GET /chats/:chatId/messages', () => {
    test('should get chat messages with pagination', async () => {
      const mockMessages = {
        messages: [mockMessage, { ...mockMessage, message_id: 'msg-2' }],
        lastTimestamp: Date.now()
      };
      mockGetChatById.mockResolvedValue(mockChat);
      mockGetChatMessages.mockResolvedValue(mockMessages);

      const response = await request(app)
        .get(`/chats/${chatId}/messages`)
        .set('Cookie', [`token=${authToken}`])
        .query({ limit: 50 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.limit).toBe(50);
    });

    test('should support pagination with lastTimestamp', async () => {
      mockGetChatById.mockResolvedValue(mockChat);
      mockGetChatMessages.mockResolvedValue({ messages: [], lastTimestamp: null });

      await request(app)
        .get(`/chats/${chatId}/messages`)
        .set('Cookie', [`token=${authToken}`])
        .query({ lastTimestamp: 1000 })
        .expect(200);

      expect(mockGetChatMessages).toHaveBeenCalledWith(chatId, 50, 1000);
    });

    test('should return 403 if user does not have access', async () => {
      mockGetChatById.mockResolvedValue({
        ...mockChat,
        user_id: 'other-user'
      });

      await request(app)
        .get(`/chats/${chatId}/messages`)
        .set('Cookie', [`token=${authToken}`])
        .expect(403);
    });

    test('should return 404 if chat not found', async () => {
      mockGetChatById.mockRejectedValue(new Error('CHAT_NOT_FOUND'));

      await request(app)
        .get(`/chats/${chatId}/messages`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);
    });
  });

  describe('POST /chats/:chatId/messages', () => {
    test('should send message successfully', async () => {
      mockGetChatById.mockResolvedValue(mockChat);
      mockSendMessage.mockResolvedValue(mockMessage);

      const response = await request(app)
        .post(`/chats/${chatId}/messages`)
        .set('Cookie', [`token=${authToken}`])
        .send({ content: 'Hello there' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Hello there');
      expect(mockSendMessage).toHaveBeenCalledWith(chatId, userId, 'Hello there', false);
    });

    test('should send message as provider', async () => {
      mockGetChatById.mockResolvedValue(mockChat);
      mockSendMessage.mockResolvedValue({ ...mockMessage, is_provider: true });

      await request(app)
        .post(`/chats/${chatId}/messages`)
        .set('Cookie', [`token=${providerToken}`])
        .send({ content: 'Hello' })
        .expect(201);

      expect(mockSendMessage).toHaveBeenCalledWith(chatId, 'provider-id', 'Hello', true);
    });

    test('should return 400 for empty message', async () => {
      const response = await request(app)
        .post(`/chats/${chatId}/messages`)
        .set('Cookie', [`token=${authToken}`])
        .send({ content: '   ' })
        .expect(400);

      expect(response.body.error).toBe('message content is required');
    });

    test('should return 400 for message too long', async () => {
      const longMessage = 'a'.repeat(5001);

      const response = await request(app)
        .post(`/chats/${chatId}/messages`)
        .set('Cookie', [`token=${authToken}`])
        .send({ content: longMessage })
        .expect(400);

      expect(response.body.error).toBe('message is too long (max 5000 characters)');
    });

    test('should return 403 if user does not have access', async () => {
      mockGetChatById.mockResolvedValue({
        ...mockChat,
        user_id: 'other-user'
      });

      await request(app)
        .post(`/chats/${chatId}/messages`)
        .set('Cookie', [`token=${authToken}`])
        .send({ content: 'Hello' })
        .expect(403);
    });

    test('should return 404 if chat not found', async () => {
      mockGetChatById.mockRejectedValue(new Error('CHAT_NOT_FOUND'));

      await request(app)
        .post(`/chats/${chatId}/messages`)
        .set('Cookie', [`token=${authToken}`])
        .send({ content: 'Hello' })
        .expect(404);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .post(`/chats/${chatId}/messages`)
        .send({ content: 'Hello' })
        .expect(401);
    });
  });

  describe('PATCH /chats/:chatId/read', () => {
    test('should mark messages as read', async () => {
      mockGetChatById.mockResolvedValue(mockChat);
      mockMarkMessagesAsRead.mockResolvedValue({ success: true });

      const response = await request(app)
        .patch(`/chats/${chatId}/read`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('messages marked as read');
      expect(mockMarkMessagesAsRead).toHaveBeenCalledWith(chatId, false);
    });

    test('should work for providers', async () => {
      mockGetChatById.mockResolvedValue(mockChat);
      mockMarkMessagesAsRead.mockResolvedValue({ success: true });

      await request(app)
        .patch(`/chats/${chatId}/read`)
        .set('Cookie', [`token=${providerToken}`])
        .expect(200);

      expect(mockMarkMessagesAsRead).toHaveBeenCalledWith(chatId, true);
    });

    test('should return 403 if user does not have access', async () => {
      mockGetChatById.mockResolvedValue({
        ...mockChat,
        user_id: 'other-user'
      });

      await request(app)
        .patch(`/chats/${chatId}/read`)
        .set('Cookie', [`token=${authToken}`])
        .expect(403);
    });

    test('should return 404 if chat not found', async () => {
      mockGetChatById.mockRejectedValue(new Error('CHAT_NOT_FOUND'));

      await request(app)
        .patch(`/chats/${chatId}/read`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .patch(`/chats/${chatId}/read`)
        .expect(401);
    });
  });
});
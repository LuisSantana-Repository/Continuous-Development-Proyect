// lib/api/chat.js - COOKIE VERSION
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Fetch with authentication (uses cookies automatically)
 */
async function fetchWithAuth(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // ← IMPORTANT: Include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Unauthorized - redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Chat API endpoints
 */
export const chatApi = {
  /**
   * Get all chats for current user
   */
  async getChats() {
    return fetchWithAuth('/chats');
  },

  /**
   * Get a specific chat by ID
   */
  async getChat(chatId) {
    return fetchWithAuth(`/chats/${chatId}`);
  },

  /**
   * Get messages for a chat (with pagination)
   */
  async getMessages(chatId, limit = 50, lastTimestamp = null) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (lastTimestamp) {
      params.append('lastTimestamp', lastTimestamp.toString());
    }
    return fetchWithAuth(`/chats/${chatId}/messages?${params}`);
  },

  /**
   * Send a message (REST API - use WebSocket for real-time)
   */
  async sendMessage(chatId, content) {
    return fetchWithAuth(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  /**
   * Mark messages as read
   */
  async markAsRead(chatId) {
    return fetchWithAuth(`/chats/${chatId}/read`, {
      method: 'PATCH',
    });
  },

  /**
   * Create or get chat with provider (usually done automatically)
   */
  async createChat(providerId) {
    return fetchWithAuth('/chats', {
      method: 'POST',
      body: JSON.stringify({ providerId }),
    });
  },
};

/**
 * Service Request API endpoints (related to chat)
 */
export const serviceRequestApi = {
  /**
   * Create a service request (auto-creates chat)
   */
  async create(data) {
    return fetchWithAuth('/service-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get service requests for user
   */
  async getUserRequests(page = 1, pageSize = 10, status = null) {
    const params = new URLSearchParams({ 
      page: page.toString(), 
      pageSize: pageSize.toString() 
    });
    if (status) params.append('status', status);
    return fetchWithAuth(`/service-requests?${params}`);
  },

  /**
   * Get specific service request
   */
  async getRequest(requestId) {
    return fetchWithAuth(`/service-requests/${requestId}`);
  },
};

/**
 * Hook for using chat API in React components
 */
import { useState, useCallback } from 'react';

export function useChatApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error };
}

/**
 * Helper to get cookie value (client-side only)
 */
export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

/**
 * Example usage:
 * 
 * import { chatApi, useChatApi } from '@/lib/api/chat';
 * 
 * function MyComponent() {
 *   const { execute, loading, error } = useChatApi();
 *   
 *   const loadChats = async () => {
 *     try {
 *       const data = await execute(() => chatApi.getChats());
 *       console.log(data);
 *     } catch (err) {
 *       console.error('Failed to load chats:', err);
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       {loading && <p>Loading...</p>}
 *       {error && <p>Error: {error}</p>}
 *       <button onClick={loadChats}>Load Chats</button>
 *     </div>
 *   );
 * }
 */
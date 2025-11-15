// app/chat/[chatId]/page.jsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId;

  const { user } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const previousMessagesLengthRef = useRef(0);

  const {
    socket,
    messages,
    sendMessage,
    openChat,
    isConnected,
    isTyping,
    startTyping,
    stopTyping,
    currentChatId,
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');

  // Check auth on mount
  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const res = await fetch('http://localhost:3000/users/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Not authenticated');
        }

        setAuthChecked(true);
      } catch (err) {
        console.error('Auth check failed, redirecting to /', err);
        if (!cancelled) {
          router.push('/');
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Open chat when connected and chatId available
  useEffect(() => {
    if (authChecked && chatId && isConnected) {
      console.log('📥 Opening chat:', chatId);
      openChat(chatId);
    }
  }, [authChecked, chatId, isConnected, openChat]);

  // Auto-scroll inteligente: solo cuando el usuario está cerca del final
  useEffect(() => {
    if (!messagesContainerRef.current || !messagesEndRef.current) return;
    
    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    const isFirstLoad = previousMessagesLengthRef.current === 0 && messages.length > 0;
    
    // Solo hacer scroll si:
    // 1. Es la primera carga de mensajes
    // 2. El usuario está cerca del final (viendo los últimos mensajes)
    if (isFirstLoad || isNearBottom) {
      // Usar scrollTop en lugar de scrollIntoView para evitar scroll de página
      container.scrollTop = container.scrollHeight;
    }
    
    previousMessagesLengthRef.current = messages.length;
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    console.log('📤 Sending message from UI:', inputMessage);
    sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setInputMessage(value);
    if (value) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  // While auth is being checked, show a simple loader
  if (!authChecked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  // Main chat UI
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Chat</h1>
            <p className="text-xs text-gray-500">
              {currentChatId ? `ID: ${currentChatId.slice(0, 8)}...` : 'Not connected'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* Messages */}
      <main 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              className="w-16 h-16 mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        )}

        {messages.map((message, index) => {
          // Determinar si el mensaje es del usuario actual
          const isOwnMessage = user && message.sender_id === user.user_id;
          const showAvatar =
            index === 0 || messages[index - 1]?.sender_id !== message.sender_id;

          return (
            <div
              key={message.message_id || message.tempId || index}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex gap-2 max-w-[70%] ${
                  isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                {showAvatar ? (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${
                      isOwnMessage ? 'bg-blue-500' : 'bg-gray-400'
                    }`}
                  >
                    {isOwnMessage ? 'Y' : 'O'}
                  </div>
                ) : (
                  <div className="w-8" />
                )}

                {/* Bubble */}
                <div>
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwnMessage
                        ? message.error
                          ? 'bg-red-500 text-white'
                          : 'bg-blue-500 text-white rounded-tr-sm'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
                    } ${message.sending ? 'opacity-60' : ''}`}
                  >
                    <p className="break-words whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  <p
                    className={`text-xs mt-1 px-1 ${
                      isOwnMessage ? 'text-right' : 'text-left'
                    } ${message.error ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {message.timestamp &&
                      new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    {message.sending && ' • Sending...'}
                    {message.error && ' • Failed to send'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[70%]">
              <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium">
                P
              </div>
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer className="bg-white border-t border-gray-200 px-4 py-3">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={handleTyping}
            onBlur={stopTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!isConnected || !inputMessage.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
        
        {/* Debug Button */}
        <button
          onClick={() => {
            console.log("🧪 Test - Socket:", socket);
            console.log("🧪 Test - Connected:", isConnected);
            console.log("🧪 Test - Current Chat:", currentChatId);
            console.log("🧪 Test - Messages:", messages);
          }}
          className="mt-2 px-4 py-2 bg-gray-200 rounded text-sm"
        >
          Debug Info
        </button>
      </footer>
    </div>
  );
}
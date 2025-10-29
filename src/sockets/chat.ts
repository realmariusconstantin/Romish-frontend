/**
 * Chat Socket Module - Client-side Socket.IO for chat events
 * @module sockets/chat
 */

import { io } from 'socket.io-client';
import { useChatStore } from '../stores/chat';
import { useAuthStore } from '../stores/auth';

let socket = null;

/**
 * Connect to /chat namespace
 * @param {string} userId - Current user ID
 * @param {string} username - Current username
 * @returns {Object} Socket instance
 */
export function connectChatSocket(userId, username) {
  if (socket) {
    return socket;
  }

  // Get access token from auth store
  const authStore = useAuthStore();
  const token = authStore.accessToken;

  // Determine API URL based on environment
  const protocol = window.location.protocol;
  const host = window.location.host.replace(':5173', ':5000');
  const apiUrl = `${protocol}//${host}`;

  socket = io(`${apiUrl}/chat`, {
    auth: {
      userId,
      username,
      token, // Include JWT token for authentication
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  setupListeners();

  return socket;
}

/**
 * Setup socket event listeners
 */
function setupListeners() {
  const chatStore = useChatStore();

  // Server events
  socket.on('chat:recent', (messages) => {
    chatStore.setMessages(messages);
  });

  socket.on('chat:new', (message) => {
    chatStore.addMessage(message);
  });

  socket.on('chat:online', (data) => {
    chatStore.setOnlineCount(data.count);
  });

  socket.on('chat:deleted', (data) => {
    chatStore.removeMessage(data.messageId);
  });

  socket.on('chat:rate_limited', () => {
    chatStore.setRateLimited(true);
  });

  socket.on('chat:error', (error) => {
    console.error('[Chat Socket Error]', error);
  });

  socket.on('disconnect', () => {
    console.log('[Chat Socket] Disconnected');
  });

  socket.on('reconnect', () => {
    console.log('[Chat Socket] Reconnected');
  });
}

/**
 * Send a chat message
 * @param {string} text - Message text
 */
export function sendMessage(text) {
  if (socket && socket.connected && text.trim()) {
    socket.emit('chat:send', { text: text.trim() });
  }
}

/**
 * Delete a message (admin)
 * @param {string} messageId - Message ID
 */
export function deleteMessage(messageId) {
  if (socket && socket.connected) {
    socket.emit('chat:delete', { messageId });
  }
}

/**
 * Disconnect from chat socket
 */
export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get chat socket instance
 * @returns {Object|null} Socket instance
 */
export function getChatSocket() {
  return socket;
}

/**
 * Check if connected
 * @returns {boolean} Connection status
 */
export function isChatSocketConnected() {
  return socket && socket.connected;
}

/**
 * Match Socket Module - Client-side Socket.IO for match events
 * @module sockets/match
 */

import { io } from 'socket.io-client';
import { useReadyStore } from '../stores/ready';
import { useAuthStore } from '../stores/auth';

let socket = null;

/**
 * Connect to /match namespace
 * @param {string} userId - Current user ID
 * @param {string} username - Current username
 * @returns {Object} Socket instance
 */
export function connectMatchSocket(userId, username) {
  if (socket) {
    return socket;
  }

  // Get access token from auth store
  const authStore = useAuthStore();
  const token = authStore.accessToken;

  // Determine API URL based on environment
  const protocol = window.location.protocol;
  const host = window.location.host.replace(':5173', ':5000'); // Adjust port if needed
  const apiUrl = `${protocol}//${host}`;

  socket = io(`${apiUrl}/match`, {
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

  setupListeners(userId);

  return socket;
}

/**
 * Setup socket event listeners
 * @param {string} userId - Current user ID
 */
function setupListeners(userId) {
  const readyStore = useReadyStore();

  // Server events
  socket.on('match:ready:init', (data) => {
    readyStore.init(data);
  });

  socket.on('match:ready:update', (data) => {
    readyStore.update(data);
  });

  socket.on('match:ready:complete', (data) => {
    readyStore.complete();
    // Route to draft page if needed
    if (data.nextPhase === 'draft') {
      window.location.hash = '#/draft';
    }
  });

  socket.on('match:ready:timeout', (data) => {
    readyStore.timeout(data.nonAcceptors);
    // Optional: Show toast about dodge
  });

  socket.on('error', (error) => {
    console.error('[Match Socket Error]', error);
  });

  socket.on('disconnect', () => {
    console.log('[Match Socket] Disconnected');
  });

  socket.on('reconnect', () => {
    console.log('[Match Socket] Reconnected');
    // Re-emit join if needed
    const { matchId } = readyStore;
    if (matchId) {
      joinMatchRoom(matchId);
    }
  });
}

/**
 * Join a match room
 * @param {string} matchId - Match ID
 */
export function joinMatchRoom(matchId) {
  if (socket && socket.connected) {
    socket.emit('join:matchRoom', { matchId });
    console.log(`[Match Socket] Joined room: ${matchId}`);
  }
}

/**
 * Emit ready acceptance
 * @param {string} matchId - Match ID
 */
export function acceptReady(matchId) {
  if (socket && socket.connected) {
    socket.emit('match:ready:accept', { matchId });
    console.log(`[Match Socket] Sent accept for match: ${matchId}`);
  }
}

/**
 * Disconnect from match socket
 */
export function disconnectMatchSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get match socket instance
 * @returns {Object|null} Socket instance
 */
export function getMatchSocket() {
  return socket;
}

/**
 * Check if connected
 * @returns {boolean} Connection status
 */
export function isMatchSocketConnected() {
  return socket && socket.connected;
}

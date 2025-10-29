import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000';

let sharedSocket = null;
let matchNamespaceSocket = null;

/**
 * Get or create the shared Socket.IO connection
 * All stores use this single connection to communicate with the backend
 */
export const getSharedSocket = () => {
  if (!sharedSocket) {
    console.log('🔌 Creating shared socket connection to:', API_URL);
    sharedSocket = io(API_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    sharedSocket.on('connect', () => {
      console.log('✅ Shared socket connected:', sharedSocket.id);
    });

    sharedSocket.on('disconnect', () => {
      console.log('❌ Shared socket disconnected');
    });

    sharedSocket.on('connect_error', (error) => {
      console.error('🚨 Socket connection error:', error);
    });
  }

  return sharedSocket;
};

/**
 * Disconnect the shared socket
 */
export const disconnectSocket = () => {
  if (sharedSocket) {
    console.log('🔌 Disconnecting shared socket');
    sharedSocket.disconnect();
    sharedSocket = null;
  }
  if (matchNamespaceSocket) {
    console.log('🔌 Disconnecting match namespace socket');
    matchNamespaceSocket.disconnect();
    matchNamespaceSocket = null;
  }
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = () => {
  return sharedSocket?.connected || false;
};

/**
 * Get or create an authenticated socket connected to the /match namespace.
 * This uses the provided JWT token (accessToken) for handshake auth.
 * If accessToken changes, an existing socket will be re-created.
 */
export const getMatchNamespaceSocket = (accessToken) => {
  // If there's already a cached socket and token matches, reuse it
  if (matchNamespaceSocket && matchNamespaceSocket.connected) {
    return matchNamespaceSocket;
  }

  try {
    const namespaceUrl = `${API_URL}/match`;
    console.log('🔌 Creating match-namespace socket to:', namespaceUrl);
    matchNamespaceSocket = io(namespaceUrl, {
      withCredentials: true,
      auth: {
        token: accessToken || null,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    matchNamespaceSocket.on('connect', () => {
      console.log('✅ Match namespace socket connected:', matchNamespaceSocket.id);
    });

    matchNamespaceSocket.on('connect_error', (err) => {
      console.error('🚨 Match namespace connect_error:', err);
    });

    matchNamespaceSocket.on('disconnect', () => {
      console.log('❌ Match namespace socket disconnected');
    });
  } catch (err) {
    console.error('Failed to create match namespace socket:', err);
    matchNamespaceSocket = null;
  }

  return matchNamespaceSocket;
};

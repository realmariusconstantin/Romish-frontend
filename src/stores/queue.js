import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { getSharedSocket } from '@/utils/socket';
import { useUserStore } from './user';
import { useMatchStore } from './match';
import { useAuthStore } from './auth';
import { useReadyStore } from './ready';

const API_URL = 'http://localhost:5000';

export const useQueueStore = defineStore('queue', () => {
  const userStore = useUserStore();
  const authStore = useAuthStore();
  
  // Helper to get auth headers
  const getAuthHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (authStore.accessToken) {
      headers['Authorization'] = `Bearer ${authStore.accessToken}`;
    }
    
    return headers;
  };
  
  // State
  const players = ref([]);
  const status = ref('waiting'); // 'waiting', 'accept_phase', 'full', 'processing', 'completed'
  const requiredPlayers = ref(10);
  const isInQueue = ref(false);
  const queueStartTime = ref(null);
  // Public socket ref (Pinia will proxy/unwrap this for callers).
  // Tests set `queueStore.socket = mockSocket` and Pinia will update
  // the ref's value. We watch it synchronously and attach handlers
  // immediately so tests can inspect mockSocket.on.mock.calls.
  const socket = ref(null);
  const matchRedirectId = ref(null); // Store match ID when queue is full
  
  // Accept Phase State
  const acceptPhase = ref({
    active: false,
    expiresAt: null,
    timeout: 20000,
    acceptedPlayers: [],
    players: [],
    totalRequired: 10,
  });

  // Computed
  const playerCount = computed(() => players.value.length);
  const isFull = computed(() => playerCount.value >= requiredPlayers.value);
  const queueProgress = computed(() => (playerCount.value / requiredPlayers.value) * 100);

  // Initialize Socket.IO connection
  const connectSocket = () => {
    socket.value = getSharedSocket();
    console.log('📡 [QUEUE STORE] Using shared socket:', socket.value?.id);
    // Attach handlers to the socket instance
    attachSocketHandlers(socket.value);
  };

  // Helper: attach handlers to a socket-like object
  const attachSocketHandlers = (sock) => {
    // Debug/log to ensure tests that inject mock sockets trigger handler attachment
    console.log('📡 [QUEUE STORE] attachSocketHandlers called. sock present?', !!sock, 'sock.on type:', typeof (sock && sock.on));
    if (!sock || typeof sock.on !== 'function') return;

    // Ensure we're joined to queue room
    if (typeof sock.emit === 'function') {
      sock.emit('join-queue', () => {
        console.log('✅ [QUEUE STORE] Joined queue room');
      });
    }

    sock.on('queue:updated', (data) => {
      players.value = data.players || [];
      status.value = data.status || 'waiting';
      
      // Check if current user is still in queue
      if (isInQueue.value && userStore.user) {
        const stillInQueue = data.players?.some(p => p.steamId === userStore.user.steamId);
        if (!stillInQueue) {
          // We were removed from queue (timeout, kicked, etc.)
          console.log('⚠️ Removed from queue');
          isInQueue.value = false;
          acceptPhase.value.active = false;
        }
      }
      
      if (data.players?.length > 0 && !queueStartTime.value) {
        queueStartTime.value = new Date(data.players[0].joinedAt);
      } else if (data.players?.length === 0) {
        queueStartTime.value = null;
      }
    });

    sock.on('queue:player-joined', (data) => {
      if (!players.value.find(p => p.steamId === data.player.steamId)) {
        players.value.push(data.player);
      }
      if (players.value.length > 0 && !queueStartTime.value) {
        queueStartTime.value = new Date();
      }
    });

    sock.on('queue:player-left', (data) => {
      players.value = players.value.filter(p => p.steamId !== data.steamId);
      if (players.value.length === 0) {
        queueStartTime.value = null;
      }
      
      // If we were removed (by timeout or other reason), update our status
      // Note: We can't directly compare steamId here, but the queue:updated event will handle it
    });

    sock.on('queue:full', (data) => {
      status.value = 'full';
      console.log('Queue is full! Match ID:', data.matchId);
      
      // Store match ID for redirect
      if (data.matchId) {
        matchRedirectId.value = data.matchId;
      }
    });

    // Match Ready Event - This triggers the accept popup!
    // Support both legacy 'match-ready' and new namespaced 'match:ready:init' emitted by backend
    const handleReadyInit = (data) => {
      console.log('🎯 MATCH READY INIT RECEIVED:', data);
        const matchStore = useMatchStore();
        // Obtain the ready store via the imported helper so Vitest's mocking
        // (vi.doMock('@/stores/ready')) resolves to the mocked object.
        let readyStore = null;
        try {
          readyStore = useReadyStore();
          console.log('📡 [QUEUE STORE] readyStore obtained via imported useReadyStore, visible:', !!readyStore);
        } catch (e) {
          console.warn('📡 [QUEUE STORE] Failed to obtain readyStore via useReadyStore()', e);
        }

        // Update match store's accept phase
        matchStore.acceptPhase = {
        active: true,
        matchId: data.matchId,
        expiresAt: data.expiresAt,
        timeout: data.timeout,
        acceptedPlayers: [],
        requiredPlayers: data.requiredPlayers || [],
        totalRequired: data.requiredPlayers?.length || 10,
      };
      
      // Initialize ready store to show the accept modal
      if (readyStore && typeof readyStore.init === 'function') {
        console.log('📡 [QUEUE STORE] Calling readyStore.init with', {
          matchId: data.matchId,
          players: data.requiredPlayers || [],
          secondsRemaining: Math.floor(data.timeout / 1000),
        });
        readyStore.init({
          matchId: data.matchId,
          players: data.requiredPlayers || [],
          secondsRemaining: Math.floor(data.timeout / 1000),
        });
      }
      
      // Make sure the match socket is connected and joins the match room
      if (!matchStore.socket) {
        matchStore.connectSocket();
      }
      
      // Join the match room to receive player-accepted, match-starting, match-cancelled events
      if (matchStore.socket) {
        console.log(`📡 Joining match room: match-${data.matchId}`);
        matchStore.socket.emit('join-match', data.matchId);
      }
      
      console.log('✅ Accept phase activated in match store and ready modal shown');
    };

    sock.on('match-ready', handleReadyInit);
    sock.on('match:ready:init', handleReadyInit);

    // Also listen for match:ready:update for live accept updates
    sock.on('match:ready:update', (stats) => {
      try {
        console.log('📡 match:ready:update received (queue store):', stats);
        // Update local acceptPhase and matchStore
        acceptPhase.value.active = true;
        acceptPhase.value.expiresAt = stats.expiresAt || acceptPhase.value.expiresAt;
        acceptPhase.value.timeout = stats.timeout || acceptPhase.value.timeout;
        acceptPhase.value.acceptedPlayers = (stats.players || []).filter(p => p.accepted).map(p => p.userId || p.steamId);
        acceptPhase.value.players = stats.players || acceptPhase.value.players;

        const matchStore = useMatchStore();
        matchStore.acceptPhase.acceptedPlayers = [...acceptPhase.value.acceptedPlayers];
        matchStore.acceptPhase.expiresAt = acceptPhase.value.expiresAt;
        matchStore.acceptPhase.matchId = stats.matchId || matchStore.acceptPhase.matchId;
      } catch (e) {
        console.error('Error handling match:ready:update in queue store:', e);
      }
    });

    sock.on('match:ready:complete', (data) => {
      console.log('🎉 match:ready:complete received (queue store):', data);
      acceptPhase.value.active = false;
      status.value = 'processing';
      if (data.matchId) matchRedirectId.value = data.matchId;
      const matchStore = useMatchStore();
      matchStore.acceptPhase.active = false;
      matchStore.acceptPhase.matchId = data.matchId || matchStore.acceptPhase.matchId;
    });

    // Accept Phase Events
    sock.on('accept-phase-started', (data) => {
      console.log('🎯 Accept phase started!', data);
      status.value = 'accept_phase';
      acceptPhase.value = {
        active: true,
        expiresAt: data.expiresAt,
        timeout: data.timeout,
        acceptedPlayers: [],
        players: data.players || [],
        totalRequired: data.players?.length || 10,
      };
    });

    sock.on('player-accepted', (data) => {
      console.log('✅ Player accepted:', data.name);
      if (!acceptPhase.value.acceptedPlayers.includes(data.steamId)) {
        acceptPhase.value.acceptedPlayers.push(data.steamId);
      }
      
      // Also update match store
      const matchStore = useMatchStore();
      if (matchStore.acceptPhase.active && !matchStore.acceptPhase.acceptedPlayers.includes(data.steamId)) {
        matchStore.acceptPhase.acceptedPlayers.push(data.steamId);
      }
      
      // Update ready store
      const readyStore = useReadyStore();
      if (readyStore.visible) {
        // Find the player and mark as accepted
        const playerIndex = readyStore.players.findIndex(p => p.steamId === data.steamId);
        if (playerIndex !== -1) {
          readyStore.players[playerIndex].accepted = true;
        }
      }
    });

    sock.on('player-declined', (data) => {
      console.log('❌ Player declined:', data.name);
    });

    sock.on('match-cancelled', (data) => {
      console.log('❌ Match cancelled:', data);
      acceptPhase.value.active = false;
      status.value = 'waiting';
      
      // Also update match store
      const matchStore = useMatchStore();
      matchStore.acceptPhase.active = false;
      matchStore.acceptPhase = {
        active: false,
        matchId: null,
        expiresAt: null,
        timeout: 20000,
        acceptedPlayers: [],
        requiredPlayers: [],
        totalRequired: 10,
      };
      
      // Timeout ready store
      const readyStore = useReadyStore();
      if (readyStore.visible) {
        readyStore.timeout([]);
      }
    });

    sock.on('match-starting', (data) => {
      console.log('🎮 [QUEUE STORE] Match starting event received:', data);
      acceptPhase.value.active = false;
      status.value = 'processing';
      
      // Store match ID for redirect
      if (data.matchId) {
        matchRedirectId.value = data.matchId;
        console.log('📍 [QUEUE STORE] Match redirect ID set:', data.matchId);
      }
      
      // Also update match store
      const matchStore = useMatchStore();
      console.log('📍 [QUEUE STORE] Updating match store acceptPhase.active to false');
      matchStore.acceptPhase.active = false;
      matchStore.acceptPhase.matchId = data.matchId; // Ensure matchId is preserved
      
      // Complete ready store
      const readyStore = useReadyStore();
      if (readyStore.visible) {
        readyStore.complete();
      }
    });

    sock.on('accept-phase-ended', (data) => {
      console.log('⏰ Accept phase ended', data);
      acceptPhase.value.active = false;
      
      // The queue:updated event that follows will handle checking if we're still in queue
      
      if (!data.needMorePlayers) {
        // Match will be created
        status.value = 'processing';
      } else {
        // Need more players
        status.value = 'waiting';
      }
    });

    sock.on('disconnect', () => {
      console.log('Queue socket disconnected');
    });
  };

  // Disconnect socket
  const disconnectSocket = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
    }
  };

  // Watch for external replacements of the socket (tests assign queueStore.socket = mockSocket)
  // Use a synchronous watch so assignments like `queueStore.socket = mockSocket` in tests
  // cause handlers to be attached immediately (tests inspect mockSocket.on.mock.calls).
  watch(socket, (newSock) => {
    if (newSock && typeof newSock.on === 'function') {
      attachSocketHandlers(newSock);
    }
  }, { flush: 'sync' });

  // Fetch queue status
  const fetchQueueStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/queue/status`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.queue) {
          players.value = data.queue.players || [];
          status.value = data.queue.status || 'waiting';
          requiredPlayers.value = data.queue.required || 10;
          
          // Set queue start time from first player
          if (data.queue.players?.length > 0) {
            queueStartTime.value = new Date(data.queue.players[0].joinedAt);
          } else {
            queueStartTime.value = null;
          }
        }
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
    }
    return null;
  };

  // Join queue
  const joinQueue = async () => {
    try {
      const response = await fetch(`${API_URL}/api/queue/join`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          isInQueue.value = true;
          
          // Check if queue is full and match created
          if (data.redirectTo) {
            return {
              success: true,
              matchCreated: true,
              matchId: data.match?.matchId,
              redirectTo: data.redirectTo,
            };
          }
          
          // Update queue state
          if (data.queue) {
            players.value = data.queue.players || [];
            status.value = data.queue.status || 'waiting';
            
            if (data.queue.players?.length > 0 && !queueStartTime.value) {
              queueStartTime.value = new Date(data.queue.players[0].joinedAt);
            }
          }
          
          return { success: true, matchCreated: false };
        }
        
        return { success: false, error: data.error };
      }

      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to join queue' };
    } catch (error) {
      console.error('Join queue error:', error);
      return { success: false, error: error.message };
    }
  };

  // Leave queue
  const leaveQueue = async () => {
    try {
      const response = await fetch(`${API_URL}/api/queue/leave`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          isInQueue.value = false;
          
          if (data.queue) {
            players.value = data.queue.players || [];
            status.value = data.queue.status || 'waiting';
            
            if (players.value.length === 0) {
              queueStartTime.value = null;
            }
          }
          
          return { success: true };
        }
      }

      return { success: false };
    } catch (error) {
      console.error('Leave queue error:', error);
      return { success: false, error: error.message };
    }
  };

  // Accept match
  const acceptMatch = async () => {
    try {
      const response = await fetch(`${API_URL}/api/queue/accept`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include', // Send JWT cookie for authentication
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      }

      // Handle error responses with helpful messages
      const errorData = await response.json();
      let userFriendlyError = errorData.error || 'Failed to accept match';
      
      // Provide helpful context for common errors
      if (response.status === 401 || response.status === 403) {
        userFriendlyError = 'You must be logged in to accept matches. Please login with Steam.';
      } else if (errorData.error === 'Player not in queue') {
        userFriendlyError = 'You are not in the queue. Please join the queue first.';
      } else if (errorData.error === 'Accept phase is not active') {
        userFriendlyError = 'Accept phase has expired. Please try again.';
      }
      
      return { success: false, error: userFriendlyError };
    } catch (error) {
      console.error('Accept match error:', error);
      return { success: false, error: error.message };
    }
  };

  // Decline match
  const declineMatch = async () => {
    try {
      const response = await fetch(`${API_URL}/api/queue/decline`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        isInQueue.value = false;
        return { success: true, data };
      }

      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to decline match' };
    } catch (error) {
      console.error('Decline match error:', error);
      return { success: false, error: error.message };
    }
  };

  // Reset queue state
  const resetQueue = () => {
    players.value = [];
    status.value = 'waiting';
    isInQueue.value = false;
    queueStartTime.value = null;
    acceptPhase.value = {
      active: false,
      expiresAt: null,
      timeout: 20000,
      acceptedPlayers: [],
      players: [],
      totalRequired: 10,
    };
  };

  return {
    // State
    players,
    status,
    requiredPlayers,
    isInQueue,
    queueStartTime,
  matchRedirectId,
  socket,
    acceptPhase,
    
    // Computed
    playerCount,
    isFull,
    queueProgress,
    
    // Actions
    connectSocket,
    disconnectSocket,
    fetchQueueStatus,
    joinQueue,
    leaveQueue,
    acceptMatch,
    declineMatch,
    resetQueue,
  };
});

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getSharedSocket, getMatchNamespaceSocket } from '@/utils/socket';
import { useUserStore } from './user';
import { useAuthStore } from './auth';

const API_URL = 'http://localhost:5000';

export const useMatchStore = defineStore('match', () => {
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
  const match = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const socket = ref(null);
  const matchNamespaceAttached = ref(false);
  const matchNamespaceSocketRef = ref(null);
  
  // Accept Phase State
  const acceptPhase = ref({
    active: false,
    matchId: null,
    expiresAt: null,
    timeout: 20000,
    acceptedPlayers: [],
    requiredPlayers: [],
    totalRequired: 10,
  });

  // Computed
  const matchId = computed(() => match.value?.matchId);
  const phase = computed(() => match.value?.phase);
  const isInMatch = computed(() => !!match.value);
  
  const captainAlpha = computed(() => {
    if (!match.value) return null;
    return match.value.players.find(p => p.steamId === match.value.captains.alpha);
  });
  
  const captainBeta = computed(() => {
    if (!match.value) return null;
    return match.value.players.find(p => p.steamId === match.value.captains.beta);
  });
  
  const teamAlphaPlayers = computed(() => {
    if (!match.value) return [];
    return match.value.players.filter(p => p.team === 'alpha');
  });
  
  const teamBetaPlayers = computed(() => {
    if (!match.value) return [];
    return match.value.players.filter(p => p.team === 'beta');
  });
  
  const undraftedPlayers = computed(() => {
    if (!match.value) return [];
    return match.value.players.filter(p => p.team === 'undrafted');
  });
  
  const currentPicker = computed(() => match.value?.currentPicker);
  const currentVeto = computed(() => match.value?.currentVeto);
  
  const teamAlphaName = computed(() => captainAlpha.value?.name ? `Team ${captainAlpha.value.name}` : 'Team Alpha');
  const teamBetaName = computed(() => captainBeta.value?.name ? `Team ${captainBeta.value.name}` : 'Team Beta');

  // Initialize Socket.IO connection
  const connectSocket = (matchIdParam) => {
    socket.value = getSharedSocket();
    console.log('🔌 [MATCH STORE] Using shared socket:', socket.value?.id);

    // Register all match-related event listeners (only once)
    if (!socket.value._matchListenersRegistered) {
      console.log('📡 [MATCH STORE] Registering event listeners...');
      socket.value._matchListenersRegistered = true;
    // New standardized ready events (server emits with colon-separated names)
    socket.value.on('match:ready:init', (data) => {
      try {
        console.log('🎯 match:ready:init received - Accept phase started:', data);
        acceptPhase.value = {
          active: true,
          matchId: data.matchId,
          expiresAt: data.expiresAt,
          timeout: data.timeout || acceptPhase.value.timeout,
          acceptedPlayers: (data.players || []).filter(p => p.accepted).map(p => p.userId),
          requiredPlayers: data.requiredPlayers || (data.players || []).map(p => ({ steamId: p.userId })),
          totalRequired: data.totalPlayers || (data.requiredPlayers?.length) || (data.players || []).length || 10,
        };

        // Attach match namespace handlers to receive match:ready:update events
        try {
          attachMatchNamespaceHandlers(data.matchId);
        } catch (e) {
          console.warn('Could not attach match namespace handlers on ready:init:', e);
        }

        // Also try to join the match room on the shared socket (backwards compatibility)
        try {
          socket.value.emit('join-match', data.matchId);
          console.log('✅ Emitted join-match event for:', data.matchId);
        } catch (e) {
          console.warn('Could not emit join-match on shared socket:', e);
        }
      } catch (e) {
        console.error('Error handling match:ready:init:', e);
      }
    });

    socket.value.on('match:ready:update', (data) => {
      try {
        if (!data) return;
        console.log('📡 match:ready:update received:', data);
        // Update only if this update is for the active provisional match
        if (acceptPhase.value && acceptPhase.value.active && acceptPhase.value.matchId === data.matchId) {
          acceptPhase.value.acceptedPlayers = (data.players || []).filter(p => p.accepted).map(p => p.userId);
          acceptPhase.value.expiresAt = data.expiresAt || acceptPhase.value.expiresAt;
          acceptPhase.value.totalRequired = data.totalPlayers || acceptPhase.value.totalRequired;
          acceptPhase.value.active = true;
          console.log('📡 Accept phase updated - accepted:', acceptPhase.value.acceptedPlayers.length);
        }
      } catch (e) {
        console.error('Error handling match:ready:update on shared socket:', e);
      }
    });

    socket.value.on('match:ready:complete', async (data) => {
      try {
        console.log('🎉 match:ready:complete received:', data);
        // Keep matchId for redirect, clear active flag
        const matchIdForRedirect = acceptPhase.value.matchId || data.matchId;
        acceptPhase.value.active = false;
        acceptPhase.value.matchId = matchIdForRedirect;

        // If server provided a real matchId (not provisional), fetch it
        const realMatchId = data.matchId && !String(data.matchId).startsWith('PEND-') ? data.matchId : null;
        if (realMatchId) {
          // load the persisted match state
          await fetchMatchById(realMatchId);
        } else {
          // Try to fetch current match (server may have created it)
          await fetchCurrentMatch();
        }
      } catch (e) {
        console.error('Error handling match:ready:complete:', e);
      }
    });

    socket.value.on('match-starting', (data) => {
      console.log('🎮 [MATCH STORE] Match starting event received:', data);
      // Store the matchId before clearing active flag
      const matchIdForRedirect = acceptPhase.value.matchId || data.matchId;
      console.log('📍 [MATCH STORE] Setting acceptPhase.active to false, preserving matchId:', matchIdForRedirect);
      acceptPhase.value.active = false;
      acceptPhase.value.matchId = matchIdForRedirect; // Keep matchId for redirect
      // Match will transition to draft phase
    });

    socket.value.on('match-cancelled', (data) => {
      console.log('❌ Match cancelled:', data);
      acceptPhase.value.active = false;
      acceptPhase.value = {
        active: false,
        matchId: null,
        expiresAt: null,
        timeout: 20000,
        acceptedPlayers: [],
        requiredPlayers: [],
        totalRequired: 10,
      };
    });

    socket.value.on('draft-update', (data) => {
      console.log('Draft update received:', data);
      if (match.value && data.matchId === match.value.matchId) {
        // Update match with new draft data
        match.value.phase = data.phase;
        match.value.currentPicker = data.currentPicker;
        match.value.pickIndex = data.pickIndex;
        match.value.pickHistory = data.pickHistory;
        
        // Update player teams
        if (data.teams) {
          match.value.teams = data.teams;
          // Update players' team property
          // Note: data.teams.alpha/beta are arrays of steamId strings, not player objects
          match.value.players = match.value.players.map(player => {
            if (data.teams.alpha.includes(player.steamId)) {
              return { ...player, team: 'alpha' };
            } else if (data.teams.beta.includes(player.steamId)) {
              return { ...player, team: 'beta' };
            }
            return { ...player, team: 'undrafted' };
          });
        }
        
        console.log('✅ Match state updated from draft-update event');
      }
    });

    socket.value.on('veto-update', (data) => {
      console.log('Veto update received:', data);
      if (match.value && data.matchId === match.value.matchId) {
        match.value.phase = data.phase;
        match.value.availableMaps = data.availableMaps;
        match.value.bannedMaps = data.bannedMaps;
        match.value.currentVeto = data.currentVeto;
        match.value.vetoIndex = data.vetoIndex;
        match.value.vetoOrder = data.vetoOrder;
        match.value.selectedMap = data.selectedMap;
        
        console.log('✅ Match state updated from veto-update event');
      }
    });

    socket.value.on('phase-change', (data) => {
      console.log('Phase change received:', data);
      if (match.value && data.matchId === match.value.matchId) {
        match.value.phase = data.phase;
        if (data.phase === 'veto') {
          match.value.vetoOrder = data.vetoOrder;
          match.value.currentVeto = data.currentVeto;
          match.value.vetoIndex = data.vetoIndex;
          match.value.availableMaps = data.availableMaps;
        }
      }
    });

    socket.value.on('server-ready', (data) => {
      console.log('Server ready received:', data);
      if (match.value && data.matchId === match.value.matchId) {
        match.value.serverInfo = data.serverInfo;
        match.value.phase = 'live'; // Set to live, not ready
      }
    });

    socket.value.on('disconnect', () => {
      console.log('Match socket disconnected');
    });
    }
  };

  const attachMatchNamespaceHandlers = (matchIdParam) => {
    try {
      const authStoreLocal = useAuthStore();
      const matchNs = getMatchNamespaceSocket(authStoreLocal.accessToken);
      matchNamespaceSocketRef.value = matchNs;
      if (!matchNs || matchNamespaceAttached.value) return;

      console.log('📡 [MATCH STORE] Attaching match-namespace handlers for', matchIdParam);

      matchNs.on('match:ready:update', (stats) => {
        try {
          if (stats && stats.matchId === (matchIdParam || acceptPhase.value.matchId)) {
            acceptPhase.value.acceptedPlayers = (stats.players || []).filter(p => p.accepted).map(p => p.userId);
            acceptPhase.value.expiresAt = stats.expiresAt || acceptPhase.value.expiresAt;
            acceptPhase.value.totalRequired = stats.totalPlayers || acceptPhase.value.totalRequired;
            acceptPhase.value.active = true;
            console.log('📡 [MATCH STORE] match:ready:update - updated acceptedPlayers:', acceptPhase.value.acceptedPlayers.length);
          }
        } catch (e) {
          console.error('Error handling match:ready:update:', e);
        }
      });

      // Join match room on match namespace for the current matchIdParam
      try {
        if (matchIdParam) matchNs.emit('join:matchRoom', { matchId: matchIdParam });
      } catch (e) {
        console.warn('Could not join match room on match namespace during attach:', e);
      }

      matchNs.on('match:ready:error', (err) => {
        console.warn('📡 [MATCH STORE] match:ready:error', err);
      });

      matchNamespaceAttached.value = true;
    } catch (err) {
      console.error('Failed to attach match namespace handlers:', err);
    }
  };

  // Disconnect socket
  const disconnectSocket = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
    }
  };

  // Fetch current match
  const fetchCurrentMatch = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_URL}/api/match/current`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.match) {
          match.value = data.match;
          return data.match;
        }
      } else if (response.status === 404) {
        match.value = null;
        return null;
      }
    } catch (err) {
      console.error('Failed to fetch current match:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
    return null;
  };

  // Fetch match by ID
  const fetchMatchById = async (matchIdParam) => {
    loading.value = true;
    error.value = null;

    console.log(`[matchStore] Fetching match by ID: ${matchIdParam}`);

    try {
      const response = await fetch(`${API_URL}/api/match/${matchIdParam}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      console.log(`[matchStore] Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('[matchStore] Match data received:', data);
        if (data.success && data.match) {
          match.value = data.match;
          return data.match;
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('[matchStore] Failed to fetch match:', response.status, errorData);
        error.value = errorData.message || `HTTP ${response.status}`;
      }
    } catch (err) {
      console.error('[matchStore] Network error fetching match:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
    return null;
  };

  // Pick a player during draft
  const pickPlayer = async (steamId) => {
    try {
      console.log('[matchStore] Picking player:', steamId);
      const response = await fetch(`${API_URL}/api/match/${match.value.matchId}/pick`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ steamId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[matchStore] Pick response:', data);
        if (data.success && data.match) {
          // Update local state with response data
          match.value.phase = data.match.phase;
          match.value.teams = data.match.teams;
          match.value.currentPicker = data.match.currentPicker;
          match.value.pickIndex = data.match.pickIndex;
          match.value.pickHistory = data.match.pickHistory;
          
          // Update player teams if full match data available
          if (data.match.players) {
            match.value.players = data.match.players;
          } else if (data.match.teams) {
            // Update players based on teams data
            match.value.players = match.value.players.map(player => {
              if (data.match.teams.alpha.some(p => p.steamId === player.steamId)) {
                return { ...player, team: 'alpha' };
              } else if (data.match.teams.beta.some(p => p.steamId === player.steamId)) {
                return { ...player, team: 'beta' };
              }
              return { ...player, team: 'undrafted' };
            });
          }
          
          console.log('✅ Player picked, local state updated');
          return { success: true };
        }
      }

      const errorData = await response.json();
      console.error('[matchStore] Pick failed:', errorData);
      return { success: false, error: errorData.error };
    } catch (err) {
      console.error('[matchStore] Pick player error:', err);
      return { success: false, error: err.message };
    }
  };

  // Ban a map during veto
  const banMap = async (mapName) => {
    try {
      console.log('[matchStore] Banning map:', mapName);
      const response = await fetch(`${API_URL}/api/match/${match.value.matchId}/ban`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ mapName }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[matchStore] Ban response:', data);
        if (data.success && data.match) {
          // Update local state with response data
          match.value.phase = data.match.phase;
          match.value.availableMaps = data.match.availableMaps;
          match.value.bannedMaps = data.match.bannedMaps;
          match.value.currentVeto = data.match.currentVeto;
          match.value.vetoIndex = data.match.vetoIndex;
          match.value.selectedMap = data.match.selectedMap;
          
          console.log('✅ Map banned, local state updated');
          return { success: true, phaseComplete: data.match.phase === 'ready' || data.match.phase === 'live' };
        }
      }

      const errorData = await response.json();
      console.error('[matchStore] Ban failed:', errorData);
      return { success: false, error: errorData.error };
    } catch (err) {
      console.error('[matchStore] Ban map error:', err);
      return { success: false, error: err.message };
    }
  };

  // Check for active match on page load (restore accept state after refresh)
  const checkCurrentMatch = async () => {
    try {
      console.log('🔍 Checking for active match...');
      const response = await fetch(`${API_URL}/api/match/current`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.match) {
          const currentMatch = data.match;
          console.log('📋 Found active match:', currentMatch.matchId, 'Phase:', currentMatch.phase);
          
          // If match is in accept phase, restore the accept popup state
          if (currentMatch.phase === 'accept' && currentMatch.acceptPhase?.active) {
            console.log('🎯 Restoring accept phase state...');
            
            // Check if current user already accepted
            const userSteamId = userStore.user?.steamId;
            const hasAccepted = currentMatch.acceptPhase.acceptedPlayers?.some(
              p => p.steamId === userSteamId
            );
            
            acceptPhase.value = {
              active: true,
              matchId: currentMatch.matchId,
              expiresAt: currentMatch.acceptPhase.expiresAt,
              timeout: currentMatch.acceptPhase.timeout,
              acceptedPlayers: currentMatch.acceptPhase.acceptedPlayers?.map(p => p.steamId) || [],
              requiredPlayers: currentMatch.acceptPhase.requiredPlayers || [],
              totalRequired: currentMatch.acceptPhase.requiredPlayers?.length || 10,
            };
            
            // Join the match room
            if (socket.value) {
              socket.value.emit('join-match', currentMatch.matchId);
            }
            
            console.log(`✅ Accept phase restored - User ${hasAccepted ? 'HAS' : 'HAS NOT'} accepted`);
            console.log(`   Accepted: ${acceptPhase.value.acceptedPlayers.length}/${acceptPhase.value.totalRequired}`);
          }
          // If match is in draft/veto phase, redirect
          else if (currentMatch.phase === 'draft' || currentMatch.phase === 'veto') {
            console.log('🎮 Match in progress, loading match data...');
            match.value = currentMatch;
          }
        }
      } else if (response.status === 404) {
        console.log('ℹ️ No active match found - checking for active ready session (provisional)');
        // Check if there's an active ready session that includes this user
        try {
          const resp2 = await fetch(`${API_URL}/api/queue/ready/mine`, {
            headers: getAuthHeaders(),
            credentials: 'include',
          });

          if (resp2.ok) {
            const data2 = await resp2.json();
            if (data2.success && data2.session) {
              const currentReady = data2.session;
              console.log('🔁 Restoring provisional ready session from server:', currentReady.matchId);
              acceptPhase.value = {
                active: true,
                matchId: currentReady.matchId,
                expiresAt: currentReady.expiresAt,
                timeout: (currentReady.expiresAt && new Date(currentReady.expiresAt) - Date.now()) || 20000,
                acceptedPlayers: (currentReady.players || []).filter(p => p.accepted).map(p => p.userId),
                requiredPlayers: (currentReady.players || []).map(p => ({ steamId: p.userId })),
                totalRequired: (currentReady.players || []).length || 10,
              };

              // Join match room via shared socket so we receive updates
              if (socket.value) {
                try {
                  socket.value.emit('join-match', currentReady.matchId);
                } catch (e) {
                  console.warn('Could not join match room on shared socket:', e);
                }
              }
              // Attach match-namespace handlers so we receive 'match:ready:update' updates
              attachMatchNamespaceHandlers(currentReady.matchId);
            }
          }
        } catch (err) {
          console.error('Error fetching my ready session:', err);
        }
      }
    } catch (error) {
      console.error('❌ Error checking current match:', error);
    }
  };

  // Accept match during accept phase
  const acceptMatch = async () => {
    if (!acceptPhase.value.active || !acceptPhase.value.matchId) {
      console.error('❌ No active accept phase');
      return { success: false, error: 'No active accept phase' };
    }

    // If this accept phase is for a provisional (ready) session, the backend
    // expects the client to call the queue accept endpoint (which uses ReadySession)
    // rather than the match accept endpoint (which expects a persisted Match doc).
    // Provisional match IDs are prefixed with 'PEND-'.
    try {
      const matchId = acceptPhase.value.matchId;
      if (typeof matchId === 'string' && matchId.startsWith('PEND-')) {
        console.log(`🎯 Detected provisional match (${matchId}) - attempting HTTP ready accept`);
        // Try HTTP accept endpoint first (new backend endpoint)
        try {
          const resp = await fetch(`${API_URL}/api/queue/ready/${matchId}/accept`, {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
          });

          if (resp.ok) {
            const data = await resp.json();
            console.log('✅ HTTP ready accept successful:', data);
            // Update local acceptPhase from returned stats so UI reflects ready-up immediately
            const stats = data.stats || data;
            if (stats && stats.players) {
              acceptPhase.value.acceptedPlayers = (stats.players || []).filter(p => p.accepted).map(p => p.userId);
              acceptPhase.value.active = true;
              acceptPhase.value.matchId = stats.matchId || matchId;
              acceptPhase.value.expiresAt = stats.expiresAt || acceptPhase.value.expiresAt;
              acceptPhase.value.totalRequired = stats.totalPlayers || acceptPhase.value.totalRequired;
            }
            // Ensure we are listening to match-namespace updates
            attachMatchNamespaceHandlers(acceptPhase.value.matchId);
            return { success: true, data };
          }

          const errData = await resp.json().catch(() => ({}));
          const message = errData.error || `HTTP ${resp.status}`;
          console.warn('⚠️ HTTP ready accept failed:', message);

          // If HTTP says user not in session or bad request, return that error
          if (resp.status === 400 || resp.status === 404) {
            return { success: false, error: message };
          }
          // Otherwise fall back to socket path below
        } catch (httpErr) {
          console.warn('⚠️ HTTP ready accept error, falling back to socket:', httpErr);
        }

        console.log(`🎯 Falling back to match namespace socket accept for ${matchId}`);
        console.log(`🎯 Detected provisional match (${matchId}) - routing accept via match namespace socket`);
        const authStoreLocal = useAuthStore();
        const userStoreLocal = useUserStore();

        // Need an authenticated socket to /match to record ready-up via readyService
        const matchSocket = getMatchNamespaceSocket(authStoreLocal.accessToken);
        if (!matchSocket) {
          console.error('❌ No match namespace socket available (not authenticated)');
          return { success: false, error: 'Not authenticated for ready-up (socket connection failed)' };
        }

        // Emit accept event to match namespace. The server will broadcast 'match:ready:update'.
        try {
          // Listen once for the update event for this matchId to confirm acceptance
          const awaited = new Promise((resolve) => {
            const onUpdate = (stats) => {
              if (stats && stats.matchId === matchId) {
                const userId = userStoreLocal.user?.userId || userStoreLocal.user?.steamId;
                const player = (stats.players || []).find(p => p.userId === userId);
                matchSocket.off('match:ready:update', onUpdate);
                matchSocket.off('match:ready:error', onError);
                resolve({ success: true, stats });
              }
            };

            const onError = (err) => {
              // Server responded with an error (e.g. user not in session)
              matchSocket.off('match:ready:update', onUpdate);
              matchSocket.off('match:ready:error', onError);
              resolve({ success: false, error: err?.error || err?.message || 'Server reported ready error' });
            };

            matchSocket.on('match:ready:update', onUpdate);
            matchSocket.on('match:ready:error', onError);

            // Timeout fallback after 4s
            const to = setTimeout(() => {
              matchSocket.off('match:ready:update', onUpdate);
              matchSocket.off('match:ready:error', onError);
              resolve({ success: false, error: 'Timeout waiting for ready update' });
            }, 4000);
          });

          // Join the match room on match namespace so we receive the update broadcast
          try {
            matchSocket.emit('join:matchRoom', { matchId });
          } catch (e) {
            console.warn('Could not join match room on match namespace:', e);
          }

          // Emit the accept event (server will use socket auth to identify the user)
          matchSocket.emit('match:ready:accept', { matchId });

          const res = await awaited;
          if (res.success) {
            console.log('✅ Match namespace accept recorded (provisional)');
            return { success: true, data: res.stats };
          }

          console.error('❌ Match accept timeout or failed:', res.error);
          return { success: false, error: res.error || 'Failed to accept provisional match' };
        } catch (err) {
          console.error('❌ Emit match:ready:accept error:', err);
          return { success: false, error: err.message || String(err) };
        }
      }

      // Otherwise call the standard match accept endpoint
      console.log(`🎯 Accepting match: ${acceptPhase.value.matchId}`);
      const response = await fetch(`${API_URL}/api/match/${acceptPhase.value.matchId}/accept`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Accept response:', data);
        return { success: true, data };
      }

      // Handle error responses
      const errorData = await response.json();
      let userFriendlyError = errorData.error || 'Failed to accept match';
      
      if (response.status === 401 || response.status === 403) {
        userFriendlyError = 'You must be logged in to accept matches. Please login with Steam.';
      } else if (errorData.error?.includes('not found')) {
        userFriendlyError = 'Match not found or has expired.';
      } else if (errorData.error?.includes('not active')) {
        userFriendlyError = 'Accept phase has expired. Please try again.';
      } else if (errorData.error?.includes('not in match')) {
        userFriendlyError = 'You are not in this match.';
      }
      
      console.error('❌ Accept failed:', userFriendlyError);
      return { success: false, error: userFriendlyError };
    } catch (error) {
      console.error('❌ Accept match error:', error);
      return { success: false, error: error.message };
    }
  };

  // Reset match state
  const resetMatch = () => {
    match.value = null;
    error.value = null;
    acceptPhase.value = {
      active: false,
      matchId: null,
      expiresAt: null,
      timeout: 20000,
      acceptedPlayers: [],
      requiredPlayers: [],
      totalRequired: 10,
    };
  };

  return {
    // State
    match,
    loading,
    error,
    acceptPhase,
    
    // Computed
    matchId,
    phase,
    isInMatch,
    captainAlpha,
    captainBeta,
    teamAlphaPlayers,
    teamBetaPlayers,
    undraftedPlayers,
    currentPicker,
    currentVeto,
    teamAlphaName,
    teamBetaName,
    
    // Actions
    connectSocket,
    disconnectSocket,
    fetchCurrentMatch,
    fetchMatchById,
    pickPlayer,
    banMap,
    checkCurrentMatch,
    acceptMatch,
    resetMatch,
  };
});

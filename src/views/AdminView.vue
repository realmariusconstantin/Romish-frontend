<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Navbar from '@/components/Navbar.vue';
import { getSharedSocket } from '@/utils/socket';

const router = useRouter();
const authStore = useAuthStore();

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = authStore.accessToken;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Active tab state
const activeTab = ref('controls'); // 'controls', 'matches', 'users', 'activity'

// Admin Controls State
const clearUserSteamId = ref('');
const clearUserLoading = ref(false);
const allMatches = ref([]);
const allMatchesLoading = ref(false);
const selectedMatch = ref(null);
const removePlayerSteamId = ref('');
const removePlayerLoading = ref(false);

// State
const stats = ref({
  totalUsers: 0,
  activeMatches: 0,
  queuedPlayers: 0,
  onlineUsers: 0
});

// Live matches state
const liveMatches = ref([]);
const liveMatchesLoading = ref(false);

const users = ref([]);
const activities = ref([]);
const loading = ref(true);
const usersLoading = ref(false);
const selectedUser = ref(null);
const showBanModal = ref(false);
const banForm = ref({
  reason: '',
  duration: null // null = permanent, number = hours
});

// Filters
const searchQuery = ref('');
const statusFilter = ref('all');
const currentPage = ref(1);
const usersPerPage = ref(20);
const totalPages = ref(1);

// Socket reference for admin events
let adminSocket = null;

// Computed
const filteredUsersCount = computed(() => users.value.length);

// Status badge config
const statusConfig = {
  'online': { label: 'Online', color: 'var(--star-cyan)', icon: '🟢' },
  'offline': { label: 'Offline', color: 'rgba(248, 250, 252, 0.4)', icon: '⚪' },
  'inqueue': { label: 'In Queue', color: 'var(--aurora-pink)', icon: '⏱️' },
  'in-match': { label: 'In Match', color: 'var(--nebula-purple)', icon: '🎮' }
};

// Fetch admin statistics
const fetchStats = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/admin/stats', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      stats.value = data.stats;
    }
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
  }
};

// Fetch all users with filters
const fetchUsers = async () => {
  usersLoading.value = true;
  try {
    const params = new URLSearchParams({
      search: searchQuery.value,
      status: statusFilter.value,
      page: currentPage.value,
      limit: usersPerPage.value
    });

    const response = await fetch(`http://localhost:5000/api/admin/users?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      users.value = data.users;
      totalPages.value = data.pagination.totalPages;
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
  } finally {
    usersLoading.value = false;
  }
};

// Fetch recent activity log
const fetchActivity = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/admin/activity?limit=10', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      activities.value = data.activities;
    }
  } catch (error) {
    console.error('Failed to fetch activity log:', error);
  }
};

// Ban user
const openBanModal = (user) => {
  selectedUser.value = user;
  banForm.value = { reason: '', duration: null };
  showBanModal.value = true;
};

const confirmBan = async () => {
  if (!selectedUser.value) return;

  try {
    const response = await fetch(`http://localhost:5000/api/admin/users/${selectedUser.value.steamId}/ban`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      credentials: 'include',
      body: JSON.stringify(banForm.value)
    });

    if (response.ok) {
      alert(`${selectedUser.value.name} has been banned`);
      showBanModal.value = false;
      selectedUser.value = null;
      await fetchUsers();
      await fetchActivity();
    } else {
      const data = await response.json();
      alert(`Failed to ban user: ${data.message}`);
    }
  } catch (error) {
    console.error('Ban error:', error);
    alert('Failed to ban user');
  }
};

const cancelBan = () => {
  showBanModal.value = false;
  selectedUser.value = null;
};

// Unban user
const unbanUser = async (user) => {
  if (!confirm(`Unban ${user.name}?`)) return;

  try {
    const response = await fetch(`http://localhost:5000/api/admin/users/${user.steamId}/unban`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (response.ok) {
      alert(`${user.name} has been unbanned`);
      await fetchUsers();
      await fetchActivity();
    } else {
      const data = await response.json();
      alert(`Failed to unban user: ${data.message}`);
    }
  } catch (error) {
    console.error('Unban error:', error);
    alert('Failed to unban user');
  }
};

// Delete user (admin action)
const deleteUser = async (user) => {
  if (!user) return;
  if (!confirm(`⚠️ Delete user ${user.name} (${user.steamId})? This will permanently remove the user and clean up references.`)) return;

  try {
    const response = await fetch(`http://localhost:5000/api/admin/users/${user.steamId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok) {
      alert(`✅ ${data.message}`);
      // Refresh lists
      await fetchUsers();
      await fetchActivity();
      await fetchStats();
    } else {
      alert(`Failed to delete user: ${data.message || data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Delete user error:', error);
    alert('Failed to delete user');
  }
};

// View user profile
const viewProfile = (user) => {
  router.push(`/profile?steamId=${user.steamId}`);
};

// Pagination
const changePage = (page) => {
  currentPage.value = page;
  fetchUsers();
};

// Filter handlers
const handleSearch = () => {
  currentPage.value = 1;
  fetchUsers();
};

const handleStatusFilter = (status) => {
  statusFilter.value = status;
  currentPage.value = 1;
  fetchUsers();
};

// Format date helper
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
};

// ========== LIVE MATCHES FUNCTIONS ==========

// Fetch all live matches
const fetchLiveMatches = async () => {
  liveMatchesLoading.value = true;
  try {
    const response = await fetch('http://localhost:5000/api/admin/matches/live', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      liveMatches.value = data.matches || [];
    }
  } catch (error) {
    console.error('Failed to fetch live matches:', error);
  } finally {
    liveMatchesLoading.value = false;
  }
};

// Stop a live match
const stopMatch = async (matchId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/admin/matches/${matchId}/stop`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (response.ok) {
      toast.value?.addToast('Match stopped successfully', 'success');
      await fetchLiveMatches();
      await fetchStats();
    } else {
      const data = await response.json();
      toast.value?.addToast(`Failed to stop match: ${data.message}`, 'error');
    }
  } catch (error) {
    console.error('Stop match error:', error);
    toast.value?.addToast('Failed to stop match', 'error');
  }
};

// View match details (navigate to appropriate phase)
const viewMatch = (match) => {
  if (match.phase === 'draft') {
    router.push(`/draft/${match.matchId}`);
  } else if (match.phase === 'veto') {
    router.push(`/veto/${match.matchId}`);
  } else {
    // For other phases, could add more specific views
    router.push(`/veto/${match.matchId}`);
  }
};

// ========== ADMIN CONTROL FUNCTIONS ==========

// Fetch all matches
const fetchAllMatches = async () => {
  allMatchesLoading.value = true;
  try {
    const response = await fetch('http://localhost:5000/api/match/admin/all?limit=20', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      allMatches.value = data.matches || [];
    }
  } catch (error) {
    console.error('Failed to fetch all matches:', error);
    alert('Failed to fetch matches');
  } finally {
    allMatchesLoading.value = false;
  }
};

// Clear user match/queue state
const clearUserState = async () => {
  if (!clearUserSteamId.value.trim()) {
    alert('Please enter a Steam ID');
    return;
  }

  if (!confirm(`Clear match/queue state for Steam ID: ${clearUserSteamId.value}?`)) {
    return;
  }

  clearUserLoading.value = true;
  try {
    const response = await fetch('http://localhost:5000/api/match/admin/clear-user-state', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      credentials: 'include',
      body: JSON.stringify({ steamId: clearUserSteamId.value.trim() })
    });

    const data = await response.json();

    if (response.ok) {
      alert(`✅ ${data.message}\n\nOld state:\n- In Queue: ${data.oldState.inQueue}\n- Current Match: ${data.oldState.currentMatch || 'None'}\n\nNew state:\n- In Queue: false\n- Current Match: None`);
      clearUserSteamId.value = '';
    } else {
      alert(`❌ Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Failed to clear user state:', error);
    alert('Failed to clear user state');
  } finally {
    clearUserLoading.value = false;
  }
};

// Remove player from match
const removePlayerFromMatch = async () => {
  if (!selectedMatch.value) {
    alert('Please select a match first');
    return;
  }

  if (!removePlayerSteamId.value.trim()) {
    alert('Please enter a Steam ID');
    return;
  }

  if (!confirm(`Remove player ${removePlayerSteamId.value} from match ${selectedMatch.value.matchId}?`)) {
    return;
  }

  removePlayerLoading.value = true;
  try {
    const response = await fetch(`http://localhost:5000/api/match/admin/${selectedMatch.value.matchId}/remove-player`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      credentials: 'include',
      body: JSON.stringify({ steamId: removePlayerSteamId.value.trim() })
    });

    const data = await response.json();

    if (response.ok) {
      alert(`✅ ${data.message}`);
      removePlayerSteamId.value = '';
      await fetchAllMatches();
    } else {
      alert(`❌ Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Failed to remove player:', error);
    alert('Failed to remove player from match');
  } finally {
    removePlayerLoading.value = false;
  }
};

// Force complete match
const forceCompleteMatch = async (matchId, winner = null) => {
  if (!confirm(`Force complete match ${matchId}?${winner ? ` Winner: ${winner}` : ''}`)) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:5000/api/match/admin/${matchId}/force-complete`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      credentials: 'include',
      body: JSON.stringify({ winner })
    });

    const data = await response.json();

    if (response.ok) {
      alert(`✅ ${data.message}`);
      await fetchAllMatches();
    } else {
      alert(`❌ Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Failed to force complete match:', error);
    alert('Failed to force complete match');
  }
};

// Delete single match
const deleteMatch = async (matchId) => {
  if (!confirm(`⚠️ DELETE match ${matchId}?\n\nThis will:\n- Delete the match permanently\n- Clear all player references\n- Cannot be undone`)) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:5000/api/match/admin/${matchId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok) {
      alert(`✅ ${data.message}`);
      await fetchAllMatches();
      if (selectedMatch.value?.matchId === matchId) {
        selectedMatch.value = null;
      }
    } else {
      alert(`❌ Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Failed to delete match:', error);
    alert('Failed to delete match');
  }
};

// Mass delete all matches
const deleteAllMatches = async () => {
  if (!confirm(`⚠️⚠️⚠️ DELETE ALL MATCHES? ⚠️⚠️⚠️\n\nThis will:\n- Delete ALL matches in the database\n- Clear ALL player references\n- Cannot be undone\n\nAre you ABSOLUTELY sure?`)) {
    return;
  }

  if (!confirm(`Final confirmation: Type YES in the next prompt to delete all matches`)) {
    return;
  }

  const confirmation = prompt('Type YES to confirm mass deletion:');
  if (confirmation !== 'YES') {
    alert('Mass deletion cancelled');
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/match/admin/all', {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok) {
      alert(`✅ ${data.message}\n\nDeleted: ${data.deletedCount} matches`);
      await fetchAllMatches();
      selectedMatch.value = null;
    } else {
      alert(`❌ Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Failed to delete all matches:', error);
    alert('Failed to delete all matches');
  }
};

// Initialize
onMounted(async () => {
  loading.value = true;
  await Promise.all([
    fetchStats(),
    fetchUsers(),
    fetchActivity(),
    fetchLiveMatches(),
    fetchAllMatches()
  ]);
  loading.value = false;

  // Auto-refresh stats every 30 seconds
  setInterval(fetchStats, 30000);
  // Auto-refresh activity every 15 seconds
  setInterval(fetchActivity, 15000);
  // Auto-refresh live matches every 10 seconds
  setInterval(fetchLiveMatches, 10000);

  // Attach admin socket listener for user-deleted events
  try {
    adminSocket = getSharedSocket();
    const onUserDeleted = (data) => {
      console.log('admin:user-deleted received', data);
      // Refresh users and activity when a user is deleted elsewhere
      fetchUsers();
      fetchActivity();
      fetchStats();
    };

    if (adminSocket && adminSocket.on) {
      adminSocket.on('admin:user-deleted', onUserDeleted);
    }
    // Store handler for removal on unmount
    adminSocket._onUserDeletedHandler = onUserDeleted;
  } catch (err) {
    console.warn('Failed to attach admin socket listener', err);
  }
});

onBeforeUnmount(() => {
  try {
    if (adminSocket && adminSocket.off && adminSocket._onUserDeletedHandler) {
      adminSocket.off('admin:user-deleted', adminSocket._onUserDeletedHandler);
    }
  } catch (err) {
    console.warn('Failed to detach admin socket listener', err);
  }
});

// ======= Dev / Simulation Controls =======
</script>

<template>
  <div class="admin-wrapper">
    <Navbar />
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading admin panel...</p>
    </div>

    <div v-else class="admin-container">
      <!-- Admin Header -->
      <div class="admin-header">
        <h1 class="admin-title">ADMIN PANEL</h1>
        <p class="admin-subtitle">Platform Management & Moderation</p>
      </div>

      <!-- Stats Overview -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalUsers }}</span>
            <span class="stat-label">Total Users</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎮</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.activeMatches }}</span>
            <span class="stat-label">Active Matches</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.queuedPlayers }}</span>
            <span class="stat-label">Queued Players</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🌐</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.onlineUsers }}</span>
            <span class="stat-label">Online Users</span>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tabs-container">
        <div class="tabs-nav">
          <button 
            :class="['tab-btn', { active: activeTab === 'controls' }]"
            @click="activeTab = 'controls'"
          >
            🛠️ Admin Controls
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'matches' }]"
            @click="activeTab = 'matches'"
          >
            🎮 Match Control
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'users' }]"
            @click="activeTab = 'users'"
          >
            👥 User Management
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'activity' }]"
            @click="activeTab = 'activity'"
          >
            📊 Recent Activity
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Admin Controls Tab -->
          <div v-if="activeTab === 'controls'" class="tab-panel">
            <div class="controls-grid">
              <!-- Clear User State -->
              <div class="control-card">
                <h3 class="control-title">🔓 Clear User State</h3>
                <p class="control-desc">Remove stuck match/queue state from a user</p>
                <div class="control-form">
                  <input 
                    v-model="clearUserSteamId"
                    type="text"
                    placeholder="Enter Steam ID"
                    class="control-input"
                  />
                  <button 
                    @click="clearUserState"
                    :disabled="clearUserLoading"
                    class="control-btn"
                  >
                    {{ clearUserLoading ? 'Clearing...' : 'Clear State' }}
                  </button>
                </div>
              </div>

              <!-- All Matches List -->
              <div class="control-card full-width">
                <div class="control-header">
                  <h3 class="control-title">📋 All Matches</h3>
                  <div style="display: flex; gap: 1rem;">
                    <button @click="deleteAllMatches" class="control-btn danger" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                      🗑️ Delete All Matches
                    </button>
                    <button @click="fetchAllMatches" class="refresh-btn">
                      🔄 Refresh
                    </button>
                  </div>
                </div>
                
                <div v-if="allMatchesLoading" class="loading-container">
                  <div class="loading-spinner"></div>
                </div>

                <div v-else class="matches-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Match ID</th>
                        <th>Phase</th>
                        <th>Players</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="match in allMatches" :key="match._id">
                        <td class="match-id-cell">{{ match.matchId.slice(-8) }}</td>
                        <td>
                          <span class="phase-badge" :class="`phase-${match.phase}`">
                            {{ match.phase }}
                          </span>
                        </td>
                        <td>{{ match.players.length }}/10</td>
                        <td class="date-cell">{{ formatDate(match.createdAt) }}</td>
                        <td class="actions-cell">
                          <button 
                            @click="selectedMatch = match"
                            class="action-btn select-btn"
                            :class="{ selected: selectedMatch?._id === match._id }"
                          >
                            {{ selectedMatch?._id === match._id ? '✓ Selected' : 'Select' }}
                          </button>
                          <button 
                            @click="forceCompleteMatch(match.matchId)"
                            class="action-btn complete-btn"
                            v-if="match.phase !== 'completed'"
                          >
                            ✓ Complete
                          </button>
                          <button 
                            @click="deleteMatch(match.matchId)"
                            class="action-btn delete-btn"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Remove Player from Match -->
              <div class="control-card" v-if="selectedMatch">
                <h3 class="control-title">👤 Remove Player from Match</h3>
                <p class="control-desc">
                  Selected Match: <strong>{{ selectedMatch.matchId.slice(-8) }}</strong>
                  ({{ selectedMatch.phase }})
                </p>
                <div class="control-form">
                  <input 
                    v-model="removePlayerSteamId"
                    type="text"
                    placeholder="Enter Steam ID to remove"
                    class="control-input"
                  />
                  <button 
                    @click="removePlayerFromMatch"
                    :disabled="removePlayerLoading"
                    class="control-btn danger"
                  >
                    {{ removePlayerLoading ? 'Removing...' : 'Remove Player' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Match Control Tab -->
          <div v-if="activeTab === 'matches'" class="tab-panel">
            <div v-if="liveMatchesLoading" class="loading-container">
              <div class="loading-spinner"></div>
              <p>Loading matches...</p>
            </div>

            <div v-else-if="liveMatches.length === 0" class="empty-state">
              <div class="empty-icon">🎮</div>
              <p class="empty-text">No active matches</p>
              <p class="empty-subtext">Matches will appear here when games are in progress</p>
            </div>

            <div v-else class="matches-grid">
          <div v-for="match in liveMatches" :key="match._id" class="match-card">
            <div class="match-header">
              <span class="match-id">Match #{{ match.matchId.slice(-6).toUpperCase() }}</span>
              <span class="match-phase" :class="`phase-${match.phase}`">
                {{ match.phase.toUpperCase() }}
              </span>
            </div>

            <div class="match-teams">
              <div class="team alpha">
                <div class="team-name">Team {{ match.captains?.alpha?.name || 'Alpha' }}</div>
                <div class="team-players">
                  {{ match.teams?.alpha?.length || 0 }}/5 players
                </div>
              </div>
              <div class="vs">VS</div>
              <div class="team beta">
                <div class="team-name">Team {{ match.captains?.beta?.name || 'Beta' }}</div>
                <div class="team-players">
                  {{ match.teams?.beta?.length || 0 }}/5 players
                </div>
              </div>
            </div>

            <div class="match-info">
              <div class="info-row">
                <span class="info-label">Map:</span>
                <span class="info-value">{{ match.selectedMap || 'Not selected' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Started:</span>
                <span class="info-value">{{ formatDate(match.createdAt) }}</span>
              </div>
            </div>

            <div class="match-actions">
              <button @click="viewMatch(match)" class="action-btn view-btn">
                �️ View
              </button>
              <button @click="stopMatch(match.matchId)" class="action-btn stop-btn">
                🛑 Stop Match
              </button>
            </div>
          </div>
        </div>
          </div>

          <!-- User Management Tab -->
          <div v-if="activeTab === 'users'" class="tab-panel">
            <!-- Filters -->
        <div class="filters-bar">
          <div class="search-box">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search by name or Steam ID..."
              @keyup.enter="handleSearch"
              class="search-input"
            />
            <button @click="handleSearch" class="search-btn">🔍</button>
          </div>

          <div class="filter-buttons">
            <button 
              :class="['filter-btn', { active: statusFilter === 'all' }]"
              @click="handleStatusFilter('all')"
            >
              All
            </button>
            <button 
              :class="['filter-btn', { active: statusFilter === 'online' }]"
              @click="handleStatusFilter('online')"
            >
              Online
            </button>
            <button 
              :class="['filter-btn', { active: statusFilter === 'inqueue' }]"
              @click="handleStatusFilter('inqueue')"
            >
              In Queue
            </button>
            <button 
              :class="['filter-btn', { active: statusFilter === 'banned' }]"
              @click="handleStatusFilter('banned')"
            >
              Banned
            </button>
          </div>
        </div>

        <!-- Users Table -->
        <div class="users-table-container">
          <div v-if="usersLoading" class="table-loading">
            <div class="loading-spinner small"></div>
          </div>

          <div v-else-if="users.length === 0" class="no-users">
            <p>No users found</p>
          </div>

          <table v-else class="users-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Name</th>
                <th>Steam ID</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Matches</th>
                <th>Win Rate</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.steamId" class="user-row">
                <td>
                  <img :src="user.avatar" :alt="user.name" class="user-avatar" />
                </td>
                <td class="user-name">
                  {{ user.name }}
                  <span v-if="user.isAdmin" class="admin-badge">ADMIN</span>
                </td>
                <td class="steam-id">{{ user.steamId }}</td>
                <td>
                  <span 
                    class="status-badge" 
                    :style="{ color: statusConfig[user.onlineStatus]?.color }"
                  >
                    {{ statusConfig[user.onlineStatus]?.icon }} 
                    {{ statusConfig[user.onlineStatus]?.label }}
                  </span>
                </td>
                <td class="rating">{{ user.stats?.rating || 1000 }}</td>
                <td>{{ user.stats?.matchesPlayed || 0 }}</td>
                <td class="win-rate">
                  {{ (user.stats?.matchesPlayed || 0) > 0 
                    ? Math.round(((user.stats?.wins || 0) / user.stats.matchesPlayed) * 100) 
                    : 0 }}%
                </td>
                <td class="join-date">{{ formatDate(user.createdAt) }}</td>
                <td class="actions-cell">
                  <button 
                    @click="viewProfile(user)" 
                    class="action-icon-btn"
                    title="View Profile"
                  >
                    👤
                  </button>
                  <button
                    v-if="!user.isAdmin"
                    @click="deleteUser(user)"
                    class="action-icon-btn delete"
                    title="Delete User"
                  >
                    🗑️
                  </button>
                  <button 
                    v-if="!user.isBanned && !user.isAdmin"
                    @click="openBanModal(user)" 
                    class="action-icon-btn ban"
                    title="Ban User"
                  >
                    🚫
                  </button>
                  <button 
                    v-if="user.isBanned"
                    @click="unbanUser(user)" 
                    class="action-icon-btn unban"
                    title="Unban User"
                  >
                    ✅
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            @click="changePage(currentPage - 1)" 
            :disabled="currentPage === 1"
            class="page-btn"
          >
            ← Prev
          </button>
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button 
            @click="changePage(currentPage + 1)" 
            :disabled="currentPage === totalPages"
            class="page-btn"
          >
            Next →
          </button>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="actions-section">
        <h2 class="section-title">QUICK ACTIONS</h2>
        <div class="actions-grid">
          <button class="action-btn wip" disabled>
            <span class="action-icon">⚙️</span>
            <span class="action-text">Server Management</span>
            <span class="wip-badge">W.I.P</span>
          </button>

          <button class="action-btn wip" disabled>
            <span class="action-icon">🎯</span>
            <span class="action-text">Match Control</span>
            <span class="wip-badge">W.I.P</span>
          </button>

          <button class="action-btn wip" disabled>
            <span class="action-icon">📊</span>
            <span class="action-text">View Reports</span>
            <span class="wip-badge">W.I.P</span>
          </button>

          <button class="action-btn wip" disabled>
            <span class="action-icon">💬</span>
            <span class="action-text">Announcements</span>
            <span class="wip-badge">W.I.P</span>
          </button>

          <button class="action-btn wip" disabled>
            <span class="action-icon">🔧</span>
            <span class="action-text">System Settings</span>
            <span class="wip-badge">W.I.P</span>
          </button>

          <button class="action-btn wip" disabled>
            <span class="action-icon">📈</span>
            <span class="action-text">Analytics</span>
            <span class="wip-badge">W.I.P</span>
          </button>
        </div>
          </div>

          <!-- Recent Activity Tab -->
          <div v-if="activeTab === 'activity'" class="tab-panel">
            <div v-if="activities.length === 0" class="empty-state">
              <div class="empty-icon">📊</div>
              <p class="empty-text">No recent activity</p>
              <p class="empty-subtext">Activity will appear here as actions are performed</p>
            </div>
            <div v-else class="activity-list">
              <div v-for="(activity, index) in activities" :key="index" class="activity-item">
                <span class="activity-icon">
                  {{ activity.type === 'queue_join' ? '⏱️' : 
                     activity.type === 'match_created' ? '🎮' : '👤' }}
                </span>
                <div class="activity-content">
                  <p class="activity-description">{{ activity.description }}</p>
                  <span class="activity-time">{{ formatDate(activity.timestamp) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ban Modal -->
    <div v-if="showBanModal" class="modal-overlay" @click="cancelBan">
      <div class="modal-content" @click.stop>
        <h2 class="modal-title">Ban User: {{ selectedUser?.name }}</h2>
        
        <div class="modal-form">
          <div class="form-group">
            <label>Reason</label>
            <textarea 
              v-model="banForm.reason" 
              placeholder="Enter ban reason..."
              rows="3"
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Duration</label>
            <select v-model="banForm.duration" class="form-select">
              <option :value="null">Permanent</option>
              <option :value="1">1 Hour</option>
              <option :value="24">24 Hours</option>
              <option :value="168">1 Week</option>
              <option :value="720">1 Month</option>
            </select>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="cancelBan" class="modal-btn cancel">Cancel</button>
          <button @click="confirmBan" class="modal-btn confirm">Ban User</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-wrapper {
  min-height: 100vh;
  background: var(--cosmic-black);
}

.admin-container {
  max-width: 1800px;
  margin: 0 auto;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  gap: 1.5rem;
  color: var(--star-cyan);
  font-family: 'Orbitron', sans-serif;
  font-size: 1.2rem;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(75, 207, 250, 0.2);
  border-top-color: var(--star-cyan);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 30px;
  height: 30px;
  border-width: 3px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Header */
.admin-header {
  text-align: center;
}

.admin-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  background: linear-gradient(135deg, var(--aurora-pink), var(--nebula-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.admin-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 1.1rem;
  color: rgba(248, 250, 252, 0.6);
  letter-spacing: 0.05em;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: rgba(11, 15, 26, 0.8);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 2px solid var(--aurora-pink);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(255, 102, 196, 0.3);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0 30px rgba(255, 102, 196, 0.5);
  border-color: var(--white-nova);
}

.stat-icon {
  font-size: 3rem;
  filter: drop-shadow(0 0 15px var(--aurora-pink));
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-family: 'Orbitron', sans-serif;
  font-size: 2rem;
  font-weight: 900;
  color: var(--white-nova);
  letter-spacing: 0.05em;
}

.stat-label {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(248, 250, 252, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Tabs Navigation */
.tabs-container {
  background: rgba(11, 15, 26, 0.6);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(75, 207, 250, 0.3);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(75, 207, 250, 0.2);
}

.tabs-nav {
  display: flex;
  background: rgba(17, 24, 39, 0.8);
  border-bottom: 2px solid rgba(75, 207, 250, 0.2);
}

.tab-btn {
  flex: 1;
  padding: 1.25rem 2rem;
  background: transparent;
  border: none;
  border-right: 1px solid rgba(75, 207, 250, 0.1);
  color: rgba(248, 250, 252, 0.6);
  font-family: 'Orbitron', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab-btn:last-child {
  border-right: none;
}

.tab-btn:hover {
  background: rgba(75, 207, 250, 0.05);
  color: var(--star-cyan);
}

.tab-btn.active {
  background: rgba(75, 207, 250, 0.1);
  color: var(--star-cyan);
  text-shadow: 0 0 10px var(--star-cyan);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--star-cyan), transparent);
  box-shadow: 0 0 10px var(--star-cyan);
}

.tab-content {
  padding: 2rem;
}

.tab-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Match Grid */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.3;
}

.empty-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.2rem;
  color: rgba(248, 250, 252, 0.6);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.empty-subtext {
  color: rgba(248, 250, 252, 0.4);
  font-size: 0.9rem;
}

.matches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.match-card {
  background: rgba(17, 24, 39, 0.6);
  border: 1px solid rgba(75, 207, 250, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.match-card:hover {
  border-color: var(--star-cyan);
  box-shadow: 0 0 20px rgba(75, 207, 250, 0.3);
  transform: translateY(-4px);
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(75, 207, 250, 0.2);
}

.match-id {
  font-family: 'Orbitron', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--star-cyan);
  letter-spacing: 0.1em;
}

.match-phase {
  padding: 0.35rem 0.8rem;
  border-radius: 6px;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.phase-draft {
  background: rgba(138, 43, 226, 0.2);
  border: 1px solid var(--nebula-purple);
  color: var(--nebula-purple);
}

.phase-veto {
  background: rgba(255, 102, 196, 0.2);
  border: 1px solid var(--aurora-pink);
  color: var(--aurora-pink);
}

.phase-ready,
.phase-live,
.phase-warmup {
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid #10b981;
  color: #10b981;
}

.match-teams {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}

.team {
  flex: 1;
  text-align: center;
}

.team-name {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--white-nova);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.team-players {
  color: rgba(248, 250, 252, 0.6);
  font-size: 0.85rem;
}

.vs {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--magenta-glow);
  text-shadow: 0 0 10px var(--magenta-glow);
}

.match-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 0;
  border-top: 1px solid rgba(75, 207, 250, 0.2);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  color: rgba(248, 250, 252, 0.6);
  font-size: 0.85rem;
}

.info-value {
  color: var(--white-nova);
  font-weight: 600;
  font-size: 0.9rem;
}

.match-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.action-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid;
  border-radius: 8px;
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.view-btn {
  background: rgba(75, 207, 250, 0.1);
  border-color: var(--star-cyan);
  color: var(--star-cyan);
}

.view-btn:hover {
  background: rgba(75, 207, 250, 0.2);
  box-shadow: 0 0 15px rgba(75, 207, 250, 0.4);
  transform: translateY(-2px);
}

.stop-btn {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
}

.stop-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
  transform: translateY(-2px);
}

/* User Management Tab */
/* Filters */
.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  flex: 1;
  min-width: 300px;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(75, 207, 250, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: var(--white-nova);
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--star-cyan);
  box-shadow: 0 0 15px rgba(75, 207, 250, 0.3);
}

.search-btn {
  background: var(--star-cyan);
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(75, 207, 250, 0.5);
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(75, 207, 250, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: rgba(248, 250, 252, 0.7);
  font-family: 'Orbitron', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: var(--star-cyan);
  color: var(--white-nova);
}

.filter-btn.active {
  background: var(--star-cyan);
  border-color: var(--star-cyan);
  color: var(--cosmic-black);
  box-shadow: 0 0 20px rgba(75, 207, 250, 0.4);
}

/* Users Table */
.users-table-container {
  min-height: 400px;
  position: relative;
}

.table-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.no-users {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-family: 'Inter', sans-serif;
  color: rgba(248, 250, 252, 0.4);
  font-size: 1.1rem;
}

.users-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 0.5rem;
}

.users-table thead {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--star-cyan);
}

.users-table th {
  text-align: left;
  padding: 0.75rem;
  background: rgba(17, 24, 39, 0.6);
  border-bottom: 2px solid var(--star-cyan);
}

.users-table th:first-child {
  border-radius: 8px 0 0 8px;
}

.users-table th:last-child {
  border-radius: 0 8px 8px 0;
}

.user-row {
  background: rgba(17, 24, 39, 0.4);
  transition: all 0.3s ease;
}

.user-row:hover {
  background: rgba(17, 24, 39, 0.8);
  box-shadow: 0 0 15px rgba(75, 207, 250, 0.2);
}

.user-row td {
  padding: 1rem 0.75rem;
  font-family: 'Inter', sans-serif;
  color: var(--white-nova);
  border-top: 1px solid rgba(75, 207, 250, 0.1);
  border-bottom: 1px solid rgba(75, 207, 250, 0.1);
}

.user-row td:first-child {
  border-left: 1px solid rgba(75, 207, 250, 0.1);
  border-radius: 8px 0 0 8px;
}

.user-row td:last-child {
  border-right: 1px solid rgba(75, 207, 250, 0.1);
  border-radius: 0 8px 8px 0;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--star-cyan);
  box-shadow: 0 0 10px rgba(75, 207, 250, 0.3);
}

.user-name {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.admin-badge {
  background: var(--nebula-purple);
  color: var(--white-nova);
  font-family: 'Orbitron', sans-serif;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.steam-id {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: rgba(248, 250, 252, 0.6);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid currentColor;
}

.rating {
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
  color: var(--aurora-pink);
}

.win-rate {
  font-weight: 600;
}

.join-date {
  color: rgba(248, 250, 252, 0.5);
  font-size: 0.9rem;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.action-icon-btn {
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(75, 207, 250, 0.3);
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-icon-btn:hover {
  transform: scale(1.1);
  border-color: var(--star-cyan);
  box-shadow: 0 0 15px rgba(75, 207, 250, 0.3);
}

.action-icon-btn.ban:hover {
  border-color: #ef4444;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
}

.action-icon-btn.unban:hover {
  border-color: #10b981;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-top: 2rem;
}

.page-btn {
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid var(--star-cyan);
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: var(--white-nova);
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: var(--star-cyan);
  color: var(--cosmic-black);
  box-shadow: 0 0 20px rgba(75, 207, 250, 0.4);
  transform: translateY(-2px);
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  font-family: 'Orbitron', sans-serif;
  color: rgba(248, 250, 252, 0.7);
  font-size: 0.95rem;
}

/* Actions Section */
.actions-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-btn {
  position: relative;
  background: rgba(11, 15, 26, 0.8);
  border: 2px solid var(--star-cyan);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Orbitron', sans-serif;
  color: var(--white-nova);
  box-shadow: 0 0 15px rgba(75, 207, 250, 0.2);
}

.action-btn:hover:not(.wip) {
  transform: translateY(-4px);
  box-shadow: 0 0 25px rgba(75, 207, 250, 0.4);
  border-color: var(--white-nova);
}

.action-btn.wip {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: rgba(75, 207, 250, 0.3);
}

.action-icon {
  font-size: 2rem;
  filter: drop-shadow(0 0 10px var(--star-cyan));
}

.action-text {
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.wip-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: var(--magenta-glow);
  color: var(--white-nova);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

/* Activity Tab */

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(17, 24, 39, 0.4);
  border: 1px solid rgba(75, 207, 250, 0.2);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.activity-item:hover {
  background: rgba(17, 24, 39, 0.6);
  border-color: var(--star-cyan);
  box-shadow: 0 0 15px rgba(75, 207, 250, 0.2);
}

.activity-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 0 10px var(--star-cyan));
}

.activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.activity-description {
  font-family: 'Inter', sans-serif;
  color: var(--white-nova);
  font-size: 0.95rem;
  margin: 0;
}

.activity-time {
  font-family: 'Inter', sans-serif;
  color: rgba(248, 250, 252, 0.5);
  font-size: 0.85rem;
}

/* Ban Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(11, 15, 26, 0.95);
  border: 2px solid var(--star-cyan);
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 0 40px rgba(75, 207, 250, 0.4);
}

.modal-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--star-cyan);
  margin-bottom: 1.5rem;
  text-align: center;
  letter-spacing: 0.05em;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(248, 250, 252, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-textarea,
.form-select {
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(75, 207, 250, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  color: var(--white-nova);
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--star-cyan);
  box-shadow: 0 0 15px rgba(75, 207, 250, 0.3);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.modal-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-btn.cancel {
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(75, 207, 250, 0.3);
  color: var(--white-nova);
}

.modal-btn.cancel:hover {
  border-color: var(--star-cyan);
  box-shadow: 0 0 15px rgba(75, 207, 250, 0.3);
}

.modal-btn.confirm {
  background: #ef4444;
  color: var(--white-nova);
}

.modal-btn.confirm:hover {
  background: #dc2626;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filters-bar {
    flex-direction: column;
  }
  
  .search-box {
    min-width: 100%;
  }
}

@media (max-width: 768px) {
  .admin-title {
    font-size: 2rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .users-table {
    font-size: 0.85rem;
  }
  
  .user-avatar {
    width: 30px;
    height: 30px;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .tabs-nav {
    flex-direction: column;
  }
  
  .tab-btn {
    border-right: none;
    border-bottom: 1px solid rgba(75, 207, 250, 0.1);
  }
  
  .tab-btn:last-child {
    border-bottom: none;
  }
  
  .tab-content {
    padding: 1rem;
  }
  
  .matches-grid {
    grid-template-columns: 1fr;
  }
}

/* Admin Controls Styles */
.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.control-card {
  background: rgba(17, 24, 39, 0.6);
  border: 1px solid rgba(75, 207, 250, 0.2);
  border-radius: 12px;
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.control-card.full-width {
  grid-column: 1 / -1;
}

.control-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.2rem;
  color: var(--star-cyan);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.control-desc {
  color: rgba(248, 250, 252, 0.6);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.control-form {
  display: flex;
  gap: 1rem;
  flex-direction: column;
}

.control-input {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(75, 207, 250, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: var(--white-nova);
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.control-input:focus {
  outline: none;
  border-color: var(--star-cyan);
  box-shadow: 0 0 15px rgba(75, 207, 250, 0.3);
}

.control-btn {
  background: linear-gradient(135deg, var(--star-cyan), var(--nebula-purple));
  border: 1px solid var(--star-cyan);
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: var(--white-nova);
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(75, 207, 250, 0.5);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border-color: #ef4444;
}

.control-btn.danger:hover:not(:disabled) {
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.refresh-btn {
  background: rgba(75, 207, 250, 0.1);
  border: 1px solid rgba(75, 207, 250, 0.3);
  border-radius: 6px;
  padding: 0.5rem 1rem;
  color: var(--star-cyan);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  background: rgba(75, 207, 250, 0.2);
  box-shadow: 0 0 15px rgba(75, 207, 250, 0.3);
}

.matches-table {
  overflow-x: auto;
}

.matches-table table {
  width: 100%;
  border-collapse: collapse;
}

.matches-table th {
  background: rgba(75, 207, 250, 0.1);
  color: var(--star-cyan);
  font-family: 'Orbitron', sans-serif;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(75, 207, 250, 0.3);
}

.matches-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(75, 207, 250, 0.1);
  color: rgba(248, 250, 252, 0.8);
}

.match-id-cell {
  font-family: 'Courier New', monospace;
  color: var(--star-cyan);
}

.phase-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.phase-accept {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  border: 1px solid #fbbf24;
}

.phase-draft {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  border: 1px solid #8b5cf6;
}

.phase-veto {
  background: rgba(236, 72, 153, 0.2);
  color: #ec4899;
  border: 1px solid #ec4899;
}

.phase-live {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid #22c55e;
}

.phase-completed {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
  border: 1px solid #9ca3af;
}

.phase-cancelled {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid #ef4444;
}

.date-cell {
  font-size: 0.85rem;
  color: rgba(248, 250, 252, 0.6);
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: rgba(75, 207, 250, 0.1);
  border: 1px solid rgba(75, 207, 250, 0.3);
  border-radius: 6px;
  padding: 0.4rem 0.8rem;
  color: var(--star-cyan);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn:hover {
  background: rgba(75, 207, 250, 0.2);
  box-shadow: 0 0 10px rgba(75, 207, 250, 0.3);
}

.action-btn.select-btn.selected {
  background: rgba(75, 207, 250, 0.3);
  border-color: var(--star-cyan);
}

.action-btn.complete-btn {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.action-btn.complete-btn:hover {
  background: rgba(34, 197, 94, 0.2);
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
}

.action-btn.delete-btn {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.action-btn.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
}
</style>


<script setup>
import { ref } from 'vue';
import Navbar from '@/components/Navbar.vue';

// TODO: Add backend integration for admin functions
const stats = ref({
  totalUsers: 1247,
  activeMatches: 12,
  queuedPlayers: 34,
  serversOnline: 8
});

const recentActions = ref([
  { id: 1, type: 'User Ban', user: 'Player123', reason: 'Cheating', timestamp: '2 minutes ago' },
  { id: 2, type: 'Match Cancel', matchId: 'M-4567', reason: 'Server crash', timestamp: '15 minutes ago' },
  { id: 3, type: 'Server Restart', server: 'EU-Server-3', timestamp: '1 hour ago' }
]);

const handleBanUser = () => {
  console.log('Ban user interface - TODO: Implement');
};

const handleServerManagement = () => {
  console.log('Server management - TODO: Implement');
};

const handleMatchControl = () => {
  console.log('Match control - TODO: Implement');
};
</script>

<template>
  <div class="admin-wrapper">
    <Navbar />
    
    <div class="admin-container">
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
          <div class="stat-icon">🖥️</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.serversOnline }}</span>
            <span class="stat-label">Servers Online</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="actions-section">
        <h2 class="section-title">QUICK ACTIONS</h2>
        <div class="actions-grid">
          <button class="action-btn" @click="handleBanUser">
            <span class="action-icon">🚫</span>
            <span class="action-text">Ban User</span>
          </button>

          <button class="action-btn" @click="handleServerManagement">
            <span class="action-icon">⚙️</span>
            <span class="action-text">Server Management</span>
          </button>

          <button class="action-btn" @click="handleMatchControl">
            <span class="action-icon">🎯</span>
            <span class="action-text">Match Control</span>
          </button>

          <button class="action-btn">
            <span class="action-icon">📊</span>
            <span class="action-text">View Reports</span>
          </button>

          <button class="action-btn">
            <span class="action-icon">💬</span>
            <span class="action-text">Announcements</span>
          </button>

          <button class="action-btn">
            <span class="action-icon">🔧</span>
            <span class="action-text">System Settings</span>
          </button>
        </div>
      </div>

      <!-- Recent Actions Log -->
      <div class="log-section">
        <h2 class="section-title">RECENT ACTIONS</h2>
        <div class="log-table">
          <div class="log-header">
            <span class="log-col">Type</span>
            <span class="log-col">Target</span>
            <span class="log-col">Reason</span>
            <span class="log-col">Time</span>
          </div>
          <div v-for="action in recentActions" :key="action.id" class="log-row">
            <span class="log-col log-type">{{ action.type }}</span>
            <span class="log-col">{{ action.user || action.matchId || action.server }}</span>
            <span class="log-col">{{ action.reason }}</span>
            <span class="log-col log-time">{{ action.timestamp }}</span>
          </div>
        </div>
      </div>

      <!-- Under Construction Notice -->
      <div class="wip-notice">
        <span class="wip-icon">🚧</span>
        <p class="wip-text">Full admin functionality coming soon. Backend integration required.</p>
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
  max-width: 1600px;
  margin: 0 auto;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 3rem;
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

/* Actions Section */
.actions-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--star-cyan);
  text-transform: uppercase;
  text-shadow: 0 0 20px var(--star-cyan);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: rgba(17, 24, 39, 0.6);
  border: 2px solid rgba(75, 207, 250, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  border-color: var(--star-cyan);
  box-shadow: 0 0 25px rgba(75, 207, 250, 0.4);
  transform: translateY(-4px);
  background: rgba(17, 24, 39, 0.8);
}

.action-icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 0 10px var(--star-cyan));
}

.action-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--white-nova);
  letter-spacing: 0.05em;
  text-align: center;
}

/* Log Section */
.log-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.log-table {
  background: rgba(11, 15, 26, 0.8);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(75, 207, 250, 0.3);
  border-radius: 12px;
  overflow: hidden;
}

.log-header,
.log-row {
  display: grid;
  grid-template-columns: 1.5fr 1.5fr 2fr 1fr;
  padding: 1rem 1.5rem;
  gap: 1rem;
  align-items: center;
}

.log-header {
  background: rgba(75, 207, 250, 0.1);
  border-bottom: 1px solid rgba(75, 207, 250, 0.3);
}

.log-row {
  border-bottom: 1px solid rgba(75, 207, 250, 0.1);
  transition: all 0.2s ease;
}

.log-row:last-child {
  border-bottom: none;
}

.log-row:hover {
  background: rgba(75, 207, 250, 0.05);
}

.log-col {
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: rgba(248, 250, 252, 0.8);
}

.log-header .log-col {
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--star-cyan);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.log-type {
  font-weight: 600;
  color: var(--aurora-pink);
}

.log-time {
  color: rgba(248, 250, 252, 0.5);
  font-size: 0.85rem;
}

/* WIP Notice */
.wip-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 102, 196, 0.1);
  border: 2px solid var(--aurora-pink);
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(255, 102, 196, 0.2);
}

.wip-icon {
  font-size: 2rem;
}

.wip-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--white-nova);
  letter-spacing: 0.05em;
}

/* Responsive */
@media (max-width: 1024px) {
  .admin-title {
    font-size: 2.5rem;
  }

  .log-header,
  .log-row {
    grid-template-columns: 1fr 1fr 1.5fr 0.8fr;
    padding: 0.875rem 1rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 768px) {
  .admin-title {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .log-header,
  .log-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .log-col {
    display: flex;
    align-items: center;
  }

  .log-header .log-col::before,
  .log-row .log-col::before {
    content: attr(data-label);
    font-weight: 700;
    margin-right: 0.5rem;
  }
}

@media (max-width: 480px) {
  .stats-grid,
  .actions-grid {
    grid-template-columns: 1fr;
  }

  .wip-notice {
    flex-direction: column;
    text-align: center;
  }
}
</style>

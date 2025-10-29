<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMatchStore } from '@/stores/match';
import { useUserStore } from '@/stores/user';
import Navbar from '@/components/Navbar.vue';
import PlayerList from '@/components/PlayerList.vue';
import ToastNotification from '@/components/ToastNotification.vue';
import LoadingScreen from '@/components/LoadingScreen.vue';
import userAvatar from '@/images/user.png';

// Map images
import dust2Img from '@/images/maps/dust2_normal.jpg';
import mirageImg from '@/images/maps/de_mirage.jpg';
import infernoImg from '@/images/maps/inferno_normal.jpg';
import nukeImg from '@/images/maps/de_nuke.jpg';
import overpassImg from '@/images/maps/de_overpass.jpg';
import vertigoImg from '@/images/maps/de_vertigo.jpg';
import ancientImg from '@/images/maps/de_ancient.jpg';
import cacheImg from '@/images/maps/de_cache.jpg';
import cobblestoneImg from '@/images/maps/cobblestone_normal.jpg';
import anubisImg from '@/images/maps/de_anubis.jpg';
import trainImg from '@/images/maps/de_train.jpg';
import aztecImg from '@/images/maps/aztec.png';

const router = useRouter();
const route = useRoute();
const matchStore = useMatchStore();
const userStore = useUserStore();

const banning = ref(false);
const showPassword = ref(false);
const toast = ref(null);
const ipInput = ref(null);
const passwordInput = ref(null);
const connectInput = ref(null);

// Map image lookup
const mapImages = {
  'Dust II': dust2Img,
  'Mirage': mirageImg,
  'Inferno': infernoImg,
  'Nuke': nukeImg,
  'Overpass': overpassImg,
  'Vertigo': vertigoImg,
  'Ancient': ancientImg,
  'Cache': cacheImg,
  'Cobblestone': cobblestoneImg,
  'Anubis': anubisImg,
  'Train': trainImg,
  'Aztec': aztecImg,
};

onMounted(async () => {
  // Fetch user if not already loaded
  if (!userStore.user) {
    const success = await userStore.fetchUser();
    if (!success) {
      router.push('/login');
      return;
    }
  }

  // Get match ID from route or fetch current match
  const matchId = route.params.matchId;
  
  console.log('VetoView mounted - matchId:', matchId);
  
  if (matchId) {
    console.log('Fetching match by ID:', matchId);
    await matchStore.fetchMatchById(matchId);
  } else {
    console.log('Fetching current match');
    await matchStore.fetchCurrentMatch();
  }

  // Check if match exists
  if (!matchStore.match) {
    console.error('No active match found - redirecting to home');
    toast.value?.addToast('No active match found', 'error');
    router.push('/');
    return;
  }

  console.log('Match loaded:', matchStore.match.matchId, 'Phase:', matchStore.match.phase);

  // Check if in wrong phase
  if (matchStore.match.phase === 'draft') {
    router.push(`/draft/${matchStore.match.matchId}`);
    return;
  }

  // Connect socket for real-time updates
  matchStore.connectSocket(matchStore.match.matchId);
});

onBeforeUnmount(() => {
  matchStore.disconnectSocket();
});

// Computed
const currentTeamName = computed(() => {
  if (!matchStore.match) return '';
  
  if (matchStore.currentVeto === 'alpha') {
    return matchStore.teamAlphaName;
  } else {
    return matchStore.teamBetaName;
  }
});

const isUserCaptain = computed(() => {
  if (!userStore.user || !matchStore.match) return false;
  
  return userStore.user.steamId === matchStore.match.captains.alpha ||
         userStore.user.steamId === matchStore.match.captains.beta;
});

const isUserTurn = computed(() => {
  if (!isUserCaptain.value || !userStore.user || !matchStore.match) return false;
  
  if (matchStore.currentVeto === 'alpha') {
    return userStore.user.steamId === matchStore.match.captains.alpha;
  } else {
    return userStore.user.steamId === matchStore.match.captains.beta;
  }
});

const vetoInfo = computed(() => {
  if (!matchStore.match) return { current: 0, total: 0, mapsRemaining: 0 };
  
  // Calculate based on maps remaining instead of vetoOrder
  const totalMaps = (matchStore.match.availableMaps?.length || 0) + (matchStore.match.bannedMaps?.length || 0);
  const bannedCount = matchStore.match.bannedMaps?.length || 0;
  const mapsRemaining = matchStore.match.availableMaps?.length || 0;
  
  return {
    current: bannedCount,
    total: totalMaps - 1, // Total bans needed (leave 1 map)
    mapsRemaining,
  };
});

// Build map list with ban status
const maps = computed(() => {
  if (!matchStore.match) return [];
  
  const allMaps = [...matchStore.match.availableMaps];
  const bannedMaps = matchStore.match.bannedMaps || [];
  
  return Object.keys(mapImages).map(mapName => {
    const bannedInfo = bannedMaps.find(b => b.map === mapName);
    
    return {
      name: mapName,
      image: mapImages[mapName],
      banned: !!bannedInfo,
      bannedBy: bannedInfo?.bannedBy || null,
      available: matchStore.match.availableMaps.includes(mapName),
    };
  });
});

const availableMaps = computed(() => {
  return maps.value.filter(m => m.available);
});

const finalMap = computed(() => {
  if (matchStore.match?.selectedMap) {
    return maps.value.find(m => m.name === matchStore.match.selectedMap);
  }
  return null;
});

// Display connect command (blurred or visible)
const displayConnectCommand = computed(() => {
  if (!matchStore.match?.serverInfo) return 'Loading...';
  const ip = matchStore.match.serverInfo.ip;
  const port = matchStore.match.serverInfo.port || '25904';
  return `connect ${ip}:${port}`;
});

// Full connect command with password for copying
const fullConnectCommand = computed(() => {
  if (!matchStore.match?.serverInfo) return 'Loading...';
  return `connect ${matchStore.match.serverInfo.ip}; password ${matchStore.match.serverInfo.password}`;
});

// Methods
const copyToClipboard = async (text, label = 'Text') => {
  try {
    await navigator.clipboard.writeText(text);
    toast.value?.addToast(`${label} copied to clipboard!`, 'success');
  } catch (err) {
    toast.value?.addToast('Failed to copy to clipboard', 'error');
  }
};

const launchCS2 = () => {
  if (matchStore.match?.serverInfo?.connectString) {
    // Try to launch Steam URL
    window.location.href = `steam://connect/${matchStore.match.serverInfo.ip}`;
    toast.value?.addToast('Launching CS2...', 'info');
  } else {
    toast.value?.addToast('Server info not available yet', 'warning');
  }
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const goToQueue = () => {
  router.push('/');
};

const banMap = async (map) => {
  if (banning.value) {
    toast.value?.addToast('Please wait for the current ban to complete', 'warning');
    return;
  }
  
  if (!map.available) {
    toast.value?.addToast('This map has already been banned!', 'error');
    return;
  }
  
  if (matchStore.phase === 'live' || matchStore.phase === 'ready') {
    toast.value?.addToast('Map veto is complete!', 'info');
    return;
  }
  
  if (!isUserTurn.value) {
    toast.value?.addToast("It's not your turn to ban!", 'warning');
    return;
  }

  banning.value = true;

  const result = await matchStore.banMap(map.name);

  if (result.success) {
    toast.value?.addToast(`Banned ${map.name}!`, 'success');
    
    if (result.phaseComplete) {
      // Veto complete, match is live
      toast.value?.addToast('Map veto complete! Server starting...', 'success', 4000);
      setTimeout(() => {
        showServerInfo.value = true;
      }, 2000);
    }
  } else {
    toast.value?.addToast(result.error || 'Failed to ban map', 'error');
  }

  banning.value = false;
};

const goBack = () => {
  router.push(`/draft/${matchStore.matchId}`);
};
</script>

<template>
  <div class="veto-wrapper">
    <Navbar />
    <PlayerList />
    <ToastNotification ref="toast" />
    
    <!-- Loading State -->
    <div v-if="!matchStore.match" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading map veto...</p>
    </div>

    <!-- Server Provisioning Loading Screen -->
    <LoadingScreen v-else-if="matchStore.phase === 'ready'" phase="provisioning" />

    <!-- Veto Phase View -->
    <div v-else-if="matchStore.phase === 'veto'" class="veto-container">
      <!-- Header -->
      <div class="veto-header">
        <h1 class="veto-title">MAP VETO</h1>
        <p class="veto-subtitle" v-if="matchStore.phase === 'veto'">
          {{ currentTeamName }} is banning... ({{ vetoInfo.mapsRemaining }} maps remaining)
          <span v-if="isUserTurn" class="your-turn">🎯 YOUR TURN</span>
        </p>
        <p class="veto-subtitle complete" v-else>
          Final Map: <span class="final-map-name">{{ finalMap?.name }}</span>
        </p>
      </div>

      <!-- Map Grid -->
      <div class="map-veto-grid">
        <div 
          v-for="map in maps" 
          :key="map.name"
          class="map-card"
          :class="{ 
            banned: map.banned,
            'banned-team-alpha': map.banned && map.bannedBy === 'alpha',
            'banned-team-beta': map.banned && map.bannedBy === 'beta',
            final: matchStore.phase === 'live' && map.name === finalMap?.name,
            hoverable: map.available && matchStore.phase === 'veto' && isUserTurn,
            disabled: !isUserTurn && map.available && matchStore.phase === 'veto'
          }"
          @click="banMap(map)"
        >
          <img :src="map.image" :alt="map.name" class="map-card-image" />
          <div class="map-content">
            <div class="map-name">{{ map.name }}</div>
            <div v-if="map.banned" class="ban-overlay">
              <span class="ban-x">✕</span>
              <span class="banned-by">
                {{ map.bannedBy === 'alpha' ? matchStore.teamAlphaName : matchStore.teamBetaName }}
              </span>
            </div>
            <div v-if="matchStore.phase === 'live' && map.name === finalMap?.name" class="final-overlay">
              <span class="final-text">SELECTED</span>
            </div>
          </div>
        </div>
      </div>

      <!-- No action buttons during veto phase -->
    </div>

    <!-- Match Ready View (after server provisioning) -->
    <transition name="fadeIn">
      <div v-if="matchStore.phase === 'live' && matchStore.match" class="server-connection-view">
        <div class="connection-container">
          <h1 class="connection-title">MATCH READY</h1>
          
          <div class="match-layout">
            <!-- Team Alpha (Left) -->
            <div class="team-section team-alpha">
              <div class="team-header-small">
                <h3 class="team-title-small">{{ matchStore.teamAlphaName.toUpperCase() }}</h3>
              </div>
              <div class="team-players-list">
                <div v-for="player in matchStore.teamAlphaPlayers" :key="player.steamId" class="player-item-small">
                  <img :src="player.avatar || userAvatar" alt="Avatar" class="player-avatar-small" />
                  <span class="player-name-small">{{ player.name }}</span>
                </div>
              </div>
            </div>

            <!-- Map Display (Center) -->
            <div class="map-display-center">
              <div class="map-image-wrapper-center">
                <img :src="finalMap?.image" :alt="finalMap?.name" class="map-image" />
                <div class="map-name-overlay-center">{{ finalMap?.name }}</div>
              </div>

              <!-- Connect Command -->
              <div class="connect-command-section-center">
                <div class="command-box-horizontal">
                  <code class="connect-command-compact" :class="{ blurred: !showPassword }">{{ displayConnectCommand }}</code>
                  <div class="action-buttons-group">
                    <button 
                      v-if="matchStore.match.serverInfo?.ip"
                      class="action-btn eye-btn" 
                      @click="togglePasswordVisibility"
                      :title="showPassword ? 'Hide connection' : 'Show connection'"
                    >
                      <span class="icon">{{ showPassword ? '🙈' : '👁️' }}</span>
                    </button>
                    <button 
                      v-if="matchStore.match.serverInfo?.ip"
                      class="action-btn copy-btn" 
                      @click="copyToClipboard(fullConnectCommand, 'Connect command')" 
                      title="Copy Command"
                    >
                      <span class="icon">📋</span>
                    </button>
                    <button 
                      v-if="matchStore.match.serverInfo?.ip"
                      class="action-btn connect-btn" 
                      @click="launchCS2"
                      title="Connect to Match"
                    >
                      <span class="icon">�</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Team Beta (Right) -->
            <div class="team-section team-beta">
              <div class="team-header-small">
                <h3 class="team-title-small">{{ matchStore.teamBetaName.toUpperCase() }}</h3>
              </div>
              <div class="team-players-list">
                <div v-for="player in matchStore.teamBetaPlayers" :key="player.steamId" class="player-item-small">
                  <img :src="player.avatar || userAvatar" alt="Avatar" class="player-avatar-small" />
                  <span class="player-name-small">{{ player.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@import '@/styles/serverInfo.css';

.veto-wrapper {
  min-height: 100vh;
  position: relative;
}

.veto-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.veto-header {
  text-align: center;
  margin-bottom: 3rem;
}

.veto-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  background: var(--starlight-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

.veto-subtitle {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem;
  color: var(--star-cyan);
  letter-spacing: 0.1em;
  text-shadow: 0 0 20px rgba(75, 207, 250, 0.6);
}

.veto-subtitle.complete {
  font-size: 1.3rem;
  color: var(--nebula-purple);
  text-shadow: 0 0 20px var(--nebula-purple);
}

.your-turn {
  display: inline-block;
  margin-left: 1rem;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 51, 153, 0.2);
  border: 1px solid var(--aurora-pink);
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--aurora-pink);
  animation: pulse-glow-pink 2s ease-in-out infinite;
}

@keyframes pulse-glow-pink {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 51, 153, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 51, 153, 0.8);
  }
}

.final-map-name {
  color: var(--star-cyan);
  font-weight: 700;
  text-shadow: 0 0 30px var(--star-cyan);
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  gap: 2rem;
}

.loading-spinner {
  width: 80px;
  height: 80px;
  border: 4px solid rgba(75, 207, 250, 0.1);
  border-top-color: var(--star-cyan);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.25rem;
  color: var(--star-cyan);
  letter-spacing: 0.1em;
}

/* Map Grid */
.map-veto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.map-card {
  position: relative;
  aspect-ratio: 16 / 10;
  background: rgba(17, 24, 39, 0.6);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(75, 207, 250, 0.3);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.map-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.map-card-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

.map-card.hoverable {
  cursor: pointer;
}

.map-card.hoverable:hover {
  border-color: var(--aurora-pink);
  box-shadow: 0 0 30px rgba(255, 102, 196, 0.4);
  transform: translateY(-8px);
}

.map-card.hoverable:hover .map-card-image {
  filter: brightness(1.2);
}

.map-card.hoverable:hover .map-name {
  color: var(--aurora-pink);
  text-shadow: 0 0 20px var(--aurora-pink);
}

.map-card.banned {
  opacity: 0.5;
  border-color: rgba(248, 250, 252, 0.2);
  background: rgba(44, 47, 58, 0.6);
  transform: scale(0.95);
}

.map-card.final {
  border-color: var(--nebula-purple);
  box-shadow: 0 0 40px var(--nebula-purple);
  transform: scale(1.05);
  animation: finalPulse 2s ease-in-out infinite;
}

@keyframes finalPulse {
  0%, 100% {
    box-shadow: 0 0 40px var(--nebula-purple);
  }
  50% {
    box-shadow: 0 0 60px var(--nebula-purple), 0 0 80px rgba(147, 51, 234, 0.4);
  }
}

.map-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent 50%);
  z-index: 1;
}

.map-name {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--white-nova);
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.9), 0 2px 4px rgba(0, 0, 0, 0.8);
  transition: all 0.3s ease;
  z-index: 1;
  position: absolute;
  bottom: 1rem;
}

/* Ban Overlay */
.ban-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2;
}

.ban-x {
  font-size: 4rem;
  font-weight: 700;
  color: var(--aurora-pink);
  text-shadow: 0 0 20px var(--aurora-pink);
  animation: banAppear 0.5s ease-out;
}

@keyframes banAppear {
  from {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  to {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}

.banned-by {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: rgba(248, 250, 252, 0.7);
  text-transform: uppercase;
}

/* Final Overlay */
.final-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(75, 207, 250, 0.3));
  z-index: 3;
}

.final-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  color: var(--white-nova);
  text-shadow: 0 0 30px var(--nebula-purple);
  animation: finalTextPulse 1.5s ease-in-out infinite;
}

@keyframes finalTextPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Action Buttons */
.veto-actions {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

.action-btn {
  padding: 1rem 2.5rem;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid;
}

.action-btn.primary {
  background: rgba(75, 207, 250, 0.15);
  border-color: var(--star-cyan);
  color: var(--star-cyan);
}

.action-btn.primary:hover {
  background: rgba(75, 207, 250, 0.25);
  box-shadow: var(--cyan-glow);
  transform: translateY(-2px);
}

.action-btn.secondary {
  background: rgba(248, 250, 252, 0.05);
  border-color: rgba(248, 250, 252, 0.3);
  color: rgba(248, 250, 252, 0.7);
}

.action-btn.secondary:hover {
  border-color: rgba(248, 250, 252, 0.5);
  color: var(--white-nova);
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 1024px) {
  .map-veto-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .map-veto-grid {
    grid-template-columns: 1fr;
  }

  .veto-title {
    font-size: 2rem;
  }

  .map-name {
    font-size: 1.2rem;
  }

  .veto-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}

/* Server Connection View (Full Screen After Veto) */
.server-connection-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  animation: fadeIn 1s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.connection-container {
  max-width: 1600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
}

.connection-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  background: var(--starlight-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  animation: pulse 2s ease-in-out infinite;
}

/* Three Column Layout */
.match-layout {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: 2rem;
  width: 100%;
  align-items: start;
}

/* Team Sections (Left & Right) */
.team-section {
  background: rgba(11, 15, 26, 0.8);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 2px solid;
}

.team-alpha {
  border-color: var(--star-cyan);
  box-shadow: 0 0 30px rgba(75, 207, 250, 0.3);
}

.team-beta {
  border-color: var(--aurora-pink);
  box-shadow: 0 0 30px rgba(255, 102, 196, 0.3);
}

.team-header-small {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(75, 207, 250, 0.3);
}

.team-beta .team-header-small {
  border-bottom-color: rgba(255, 102, 196, 0.3);
}

.team-title-small {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: var(--white-nova);
  text-transform: uppercase;
}

.team-alpha .team-title-small {
  text-shadow: 0 0 20px var(--star-cyan);
  color: var(--star-cyan);
}

.team-beta .team-title-small {
  text-shadow: 0 0 20px var(--aurora-pink);
  color: var(--aurora-pink);
}

.team-players-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.player-item-small {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(17, 24, 39, 0.6);
  border: 1px solid rgba(75, 207, 250, 0.2);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.team-beta .player-item-small {
  border-color: rgba(255, 102, 196, 0.2);
}

.player-item-small:hover {
  transform: translateX(4px);
  border-color: var(--star-cyan);
  box-shadow: 0 0 15px rgba(75, 207, 250, 0.3);
}

.team-beta .player-item-small:hover {
  border-color: var(--aurora-pink);
  box-shadow: 0 0 15px rgba(255, 102, 196, 0.3);
}

.player-avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--star-cyan);
  object-fit: cover;
}

.team-beta .player-avatar-small {
  border-color: var(--aurora-pink);
}

.player-name-small {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--white-nova);
  letter-spacing: 0.05em;
}

/* Map Display (Center) */
.map-display-center {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.map-image-wrapper-center {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: rgba(11, 15, 26, 0.95);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 3px solid var(--nebula-purple);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 0 60px rgba(147, 51, 234, 0.6), 0 20px 50px rgba(0, 0, 0, 0.7);
  animation: mapPulse 3s ease-in-out infinite;
}

@keyframes mapPulse {
  0%, 100% {
    box-shadow: 0 0 60px rgba(147, 51, 234, 0.6), 0 20px 50px rgba(0, 0, 0, 0.7);
    border-color: var(--nebula-purple);
  }
  50% {
    box-shadow: 0 0 90px rgba(147, 51, 234, 0.8), 0 20px 60px rgba(0, 0, 0, 0.8);
    border-color: var(--star-cyan);
  }
}

.map-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.map-name-overlay-center {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem;
  background: linear-gradient(to top, rgba(11, 15, 26, 0.98), transparent);
  font-family: 'Orbitron', sans-serif;
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  color: var(--white-nova);
  text-transform: uppercase;
  text-align: center;
  text-shadow: 0 0 40px var(--star-cyan);
}

/* Connect Command Section */
.connect-command-section-center {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.command-label {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--star-cyan);
  text-transform: uppercase;
  text-align: center;
  text-shadow: 0 0 20px var(--star-cyan);
}

.command-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(11, 15, 26, 0.95);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 2px solid var(--star-cyan);
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 0 40px rgba(75, 207, 250, 0.4), inset 0 0 20px rgba(75, 207, 250, 0.1);
  transition: all 0.3s ease;
}

.command-box:hover {
  box-shadow: 0 0 60px rgba(75, 207, 250, 0.6), inset 0 0 30px rgba(75, 207, 250, 0.15);
  border-color: var(--white-nova);
}

.connect-command {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--white-nova);
  background: transparent;
  letter-spacing: 0.02em;
  text-shadow: 0 0 10px rgba(75, 207, 250, 0.5);
  word-break: break-all;
}

.copy-btn-large {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, var(--star-cyan), var(--nebula-purple));
  border: 2px solid var(--star-cyan);
  border-radius: 8px;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--white-nova);
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  box-shadow: 0 0 20px rgba(75, 207, 250, 0.4);
}

.copy-btn-large:hover {
  transform: scale(1.05);
  box-shadow: 0 0 40px rgba(75, 207, 250, 0.7);
  background: linear-gradient(135deg, var(--white-nova), var(--star-cyan));
}

.copy-btn-large:active {
  transform: scale(0.98);
}

.copy-icon {
  font-size: 1.1rem;
}

/* New Horizontal Command Box Layout */
.command-box-horizontal {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(11, 15, 26, 0.95);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 2px solid var(--star-cyan);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  box-shadow: 0 0 40px rgba(75, 207, 250, 0.4), inset 0 0 20px rgba(75, 207, 250, 0.1);
  transition: all 0.3s ease;
}

.command-box-horizontal:hover {
  box-shadow: 0 0 60px rgba(75, 207, 250, 0.6), inset 0 0 30px rgba(75, 207, 250, 0.15);
  border-color: var(--white-nova);
}

.connect-command-compact {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  font-weight: 700;
  color: var(--white-nova);
  background: transparent;
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px rgba(75, 207, 250, 0.5);
  transition: all 0.3s ease;
}

.connect-command-compact.blurred {
  filter: blur(5px);
  user-select: none;
}

.connect-command-compact:not(.blurred) {
  filter: blur(0);
}

.action-buttons-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  padding: 0;
  background: linear-gradient(135deg, var(--star-cyan), var(--nebula-purple));
  border: 2px solid var(--star-cyan);
  border-radius: 8px;
  font-size: 1.2rem;
  color: var(--white-nova);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(75, 207, 250, 0.4);
}

.action-btn:hover {
  transform: scale(1.1) translateY(-2px);
  box-shadow: 0 0 40px rgba(75, 207, 250, 0.7);
  background: linear-gradient(135deg, var(--white-nova), var(--star-cyan));
}

.action-btn:active {
  transform: scale(0.95);
}

.action-btn .icon {
  font-size: 1.3rem;
  line-height: 1;
}

/* Specific button variants */
.eye-btn {
  border-color: var(--aurora-pink);
  background: linear-gradient(135deg, var(--aurora-pink), var(--magenta-glow));
}

.eye-btn:hover {
  background: linear-gradient(135deg, var(--white-nova), var(--aurora-pink));
  box-shadow: 0 0 40px rgba(255, 51, 153, 0.7);
}

.connect-btn {
  border-color: var(--nebula-purple);
  background: linear-gradient(135deg, var(--nebula-purple), var(--magenta-glow));
}

.connect-btn:hover {
  background: linear-gradient(135deg, var(--white-nova), var(--nebula-purple));
  box-shadow: 0 0 40px var(--purple-glow);
}

/* Connection Actions */
.connection-actions {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1rem;
  width: 100%;
}

/* Responsive for Server Connection View */
@media (max-width: 1200px) {
  .match-layout {
    grid-template-columns: 240px 1fr 240px;
    gap: 1.5rem;
  }

  .team-section {
    padding: 1.25rem;
  }

  .player-item-small {
    padding: 0.6rem;
  }

  .player-avatar-small {
    width: 35px;
    height: 35px;
  }

  .player-name-small {
    font-size: 0.8rem;
  }

  .map-name-overlay-center {
    font-size: 1.75rem;
    padding: 1.25rem;
  }
}

@media (max-width: 1024px) {
  .match-layout {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .team-section {
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
  }

  .team-players-list {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .player-item-small {
    flex: 1;
    min-width: 140px;
  }
}

@media (max-width: 768px) {
  .connection-title {
    font-size: 2rem;
  }

  .map-name-overlay-center {
    font-size: 1.5rem;
    padding: 1rem;
  }

  .command-box {
    flex-direction: column;
    padding: 1rem;
  }

  .command-box-horizontal {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
  }

  .connect-command {
    font-size: 0.85rem;
    text-align: center;
  }

  .connect-command-compact {
    font-size: 0.9rem;
    text-align: center;
  }

  .action-buttons-group {
    width: 100%;
    justify-content: center;
  }

  .copy-btn-large {
    width: 100%;
    justify-content: center;
  }

  .connection-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .connection-title {
    font-size: 1.5rem;
  }

  .map-name-overlay-center {
    font-size: 1.25rem;
    padding: 0.75rem;
  }

  .connect-command {
    font-size: 0.75rem;
  }

  .connect-command-compact {
    font-size: 0.8rem;
  }

  .player-item-small {
    min-width: 100%;
  }

  .action-btn {
    width: 50px;
    height: 50px;
  }

  .action-btn .icon {
    font-size: 1.5rem;
  }
}

/* Launch CS2 Button */
.launch-cs2-btn {
  margin-top: 2rem;
  padding: 1.2rem 3rem;
  background: linear-gradient(135deg, var(--nebula-purple), var(--magenta-glow));
  border: 3px solid var(--aurora-pink);
  border-radius: 12px;
  font-family: 'Orbitron', sans-serif;
  font-size: 1.3rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: var(--white-nova);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 30px rgba(255, 51, 153, 0.5),
              0 4px 15px rgba(0, 0, 0, 0.3);
  text-transform: uppercase;
  width: fit-content;
  align-self: center;
}

.launch-cs2-btn:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 0 50px rgba(255, 51, 153, 0.8),
              0 6px 25px rgba(0, 0, 0, 0.4);
  background: linear-gradient(135deg, var(--magenta-glow), var(--aurora-pink));
  border-color: var(--white-nova);
}

.launch-cs2-btn:active {
  transform: translateY(-2px) scale(1.02);
}
</style>
/* Server Info Styles */
.server-info-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 2rem;
}


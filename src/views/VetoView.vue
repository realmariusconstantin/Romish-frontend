<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '@/components/Navbar.vue';
import PlayerList from '@/components/PlayerList.vue';
import userAvatar from '@/images/user.png';

// Map images
import dust2Img from '@/images/dust2_normal.jpg';
import mirageImg from '@/images/de_mirage.jpg';
import infernoImg from '@/images/inferno_normal.jpg';
import nukeImg from '@/images/de_nuke.jpg';
import overpassImg from '@/images/de_overpass.jpg';
import vertigoImg from '@/images/de_vertigo.jpg';
import ancientImg from '@/images/de_ancient.jpg';
import cacheImg from '@/images/de_cache.jpg';
import cobblestoneImg from '@/images/cobblestone_normal.jpg';
import anubisImg from '@/images/de_anubis.jpg';
import trainImg from '@/images/de_train.jpg';

const router = useRouter();

// Mock map data (11 maps for CS2)
const maps = ref([
  { id: 1, name: 'Dust II', banned: false, bannedBy: null, image: dust2Img },
  { id: 2, name: 'Mirage', banned: false, bannedBy: null, image: mirageImg },
  { id: 3, name: 'Inferno', banned: false, bannedBy: null, image: infernoImg },
  { id: 4, name: 'Nuke', banned: false, bannedBy: null, image: nukeImg },
  { id: 5, name: 'Overpass', banned: false, bannedBy: null, image: overpassImg },
  { id: 6, name: 'Vertigo', banned: false, bannedBy: null, image: vertigoImg },
  { id: 7, name: 'Ancient', banned: false, bannedBy: null, image: ancientImg },
  { id: 8, name: 'Cache', banned: false, bannedBy: null, image: cacheImg },
  { id: 9, name: 'Cobblestone', banned: false, bannedBy: null, image: cobblestoneImg },
  { id: 10, name: 'Anubis', banned: false, bannedBy: null, image: anubisImg },
  { id: 11, name: 'Train', banned: false, bannedBy: null, image: trainImg }
]);

const currentTurn = ref(1); // 1 for Team Alpha, 2 for Team Beta
const vetoComplete = ref(false);
const finalMap = ref(null);
const showServerInfo = ref(false);

// Mock server connection info (TODO: Replace with actual backend data)
const serverInfo = ref({
  ip: '192.168.1.100:27015',
  password: 'romish_match_2025'
});

// Mock team data (TODO: Get from draft results)
const team1 = ref([
  { id: 1, name: 'Captain Alpha', avatar: userAvatar },
  { id: 3, name: 'Player 3', avatar: userAvatar },
  { id: 5, name: 'Player 5', avatar: userAvatar },
  { id: 7, name: 'Player 7', avatar: userAvatar },
  { id: 9, name: 'Player 9', avatar: userAvatar }
]);

const team2 = ref([
  { id: 2, name: 'Captain Beta', avatar: userAvatar },
  { id: 4, name: 'Player 4', avatar: userAvatar },
  { id: 6, name: 'Player 6', avatar: userAvatar },
  { id: 8, name: 'Player 8', avatar: userAvatar },
  { id: 10, name: 'Player 10', avatar: userAvatar }
]);

const availableMaps = computed(() => {
  return maps.value.filter(m => !m.banned);
});

const currentTeamName = computed(() => {
  return currentTurn.value === 1 ? 'Team Alpha' : 'Team Beta';
});

const banMap = (map) => {
  if (map.banned || vetoComplete.value) return;
  
  map.banned = true;
  map.bannedBy = currentTurn.value;
  
  // Check if only one map remains
  if (availableMaps.value.length === 1) {
    finalMap.value = availableMaps.value[0];
    vetoComplete.value = true;
    
    // Show server info bar after 2 seconds
    setTimeout(() => {
      showServerInfo.value = true;
    }, 2000);
    return;
  }
  
  // Switch turn
  currentTurn.value = currentTurn.value === 1 ? 2 : 1;
};

const goBack = () => {
  router.push('/draft');
};

const goToQueue = () => {
  router.push('/');
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  // TODO: Add toast notification for copy feedback
};
</script>

<template>
  <div class="veto-wrapper">
    <Navbar />
    <PlayerList />
    
    <!-- Veto Phase View -->
    <div class="veto-container" v-if="!showServerInfo">
      <!-- Header -->
      <div class="veto-header">
        <h1 class="veto-title">MAP VETO</h1>
        <p class="veto-subtitle" v-if="!vetoComplete">
          {{ currentTeamName }} is banning...
        </p>
        <p class="veto-subtitle complete" v-else>
          Final Map: <span class="final-map-name">{{ finalMap.name }}</span>
        </p>
      </div>

      <!-- Map Grid -->
      <div class="map-veto-grid">
        <div 
          v-for="map in maps" 
          :key="map.id"
          class="map-card"
          :class="{ 
            banned: map.banned,
            'banned-team-1': map.banned && map.bannedBy === 1,
            'banned-team-2': map.banned && map.bannedBy === 2,
            final: vetoComplete && map.id === finalMap?.id,
            hoverable: !map.banned && !vetoComplete
          }"
          @click="banMap(map)"
        >
          <img :src="map.image" :alt="map.name" class="map-card-image" />
          <div class="map-content">
            <div class="map-name">{{ map.name }}</div>
            <div v-if="map.banned" class="ban-overlay">
              <span class="ban-x">✕</span>
              <span class="banned-by">
                {{ map.bannedBy === 1 ? 'Team Alpha' : 'Team Beta' }}
              </span>
            </div>
            <div v-if="vetoComplete && map.id === finalMap?.id" class="final-overlay">
              <span class="final-text">SELECTED</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="veto-actions">
        <button class="action-btn secondary" @click="goBack">
          ← Back to Draft
        </button>
        <button class="action-btn primary" @click="goToQueue">
          Return to Queue
        </button>
      </div>
    </div>

    <!-- Server Connection View (replaces everything after veto complete) -->
    <transition name="fadeIn">
      <div v-if="showServerInfo" class="server-connection-view">
        <div class="connection-container">
          <h1 class="connection-title">MATCH READY</h1>
          
          <div class="match-layout">
            <!-- Team Alpha (Left) -->
            <div class="team-section team-alpha">
              <div class="team-header-small">
                <h3 class="team-title-small">TEAM ALPHA</h3>
              </div>
              <div class="team-players-list">
                <div v-for="player in team1" :key="player.id" class="player-item-small">
                  <img :src="player.avatar" alt="Avatar" class="player-avatar-small" />
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
                <span class="command-label">CONNECT TO SERVER</span>
                <div class="command-box">
                  <code class="connect-command">connect {{ serverInfo.ip }}; password {{ serverInfo.password }};</code>
                  <button class="copy-btn-large" @click="copyToClipboard(`connect ${serverInfo.ip}; password ${serverInfo.password};`)" title="Copy Command">
                    <span class="copy-icon">📋</span>
                    <span>COPY</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Team Beta (Right) -->
            <div class="team-section team-beta">
              <div class="team-header-small">
                <h3 class="team-title-small">TEAM BETA</h3>
              </div>
              <div class="team-players-list">
                <div v-for="player in team2" :key="player.id" class="player-item-small">
                  <img :src="player.avatar" alt="Avatar" class="player-avatar-small" />
                  <span class="player-name-small">{{ player.name }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="connection-actions">
            <button class="action-btn secondary" @click="goBack">
              ← Back to Draft
            </button>
            <button class="action-btn primary" @click="goToQueue">
              Return to Queue
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
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

.final-map-name {
  color: var(--star-cyan);
  font-weight: 700;
  text-shadow: 0 0 30px var(--star-cyan);
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

  .connect-command {
    font-size: 0.85rem;
    text-align: center;
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

  .player-item-small {
    min-width: 100%;
  }
}
</style>

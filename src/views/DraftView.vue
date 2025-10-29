<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMatchStore } from '@/stores/match';
import { useUserStore } from '@/stores/user';
import Navbar from '@/components/Navbar.vue';
import PlayerList from '@/components/PlayerList.vue';
import ToastNotification from '@/components/ToastNotification.vue';
import userAvatar from '@/images/user.png';

const router = useRouter();
const route = useRoute();
const matchStore = useMatchStore();
const userStore = useUserStore();

const picking = ref(false);
const toast = ref(null);

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
  
  if (matchId) {
    await matchStore.fetchMatchById(matchId);
  } else {
    await matchStore.fetchCurrentMatch();
  }

  // Check if match exists
  if (!matchStore.match) {
    console.error('No active match found');
    router.push('/');
    return;
  }

  // Check if already past draft phase
  if (matchStore.match.phase === 'veto') {
    router.push(`/veto/${matchStore.match.matchId}`);
    return;
  } else if (matchStore.match.phase === 'live') {
    router.push(`/match/${matchStore.match.matchId}`);
    return;
  }

  // Connect socket for real-time updates
  matchStore.connectSocket(matchStore.match.matchId);
});

onBeforeUnmount(() => {
  matchStore.disconnectSocket();
});

// Watch for phase changes
watch(() => matchStore.phase, (newPhase, oldPhase) => {
  console.log(`🔄 Phase changed from ${oldPhase} to ${newPhase}`);
  if (newPhase === 'veto') {
    console.log('✅ Redirecting to veto view...');
    // Draft complete, move to veto
    setTimeout(() => {
      router.push(`/veto/${matchStore.matchId}`);
    }, 1500);
  }
});

// Computed
const currentCaptainName = computed(() => {
  if (!matchStore.match) return '';
  
  if (matchStore.currentPicker === 'alpha') {
    return matchStore.captainAlpha?.name || 'Team Alpha';
  } else {
    return matchStore.captainBeta?.name || 'Team Beta';
  }
});

const isUserCaptain = computed(() => {
  if (!userStore.user || !matchStore.match) return false;
  
  return userStore.user.steamId === matchStore.match.captains.alpha ||
         userStore.user.steamId === matchStore.match.captains.beta;
});

const isUserTurn = computed(() => {
  if (!isUserCaptain.value || !userStore.user || !matchStore.match) return false;
  
  if (matchStore.currentPicker === 'alpha') {
    return userStore.user.steamId === matchStore.match.captains.alpha;
  } else {
    return userStore.user.steamId === matchStore.match.captains.beta;
  }
});

const pickInfo = computed(() => {
  if (!matchStore.match) return { current: 0, total: 0 };
  
  return {
    current: matchStore.match.pickIndex + 1,
    total: matchStore.match.pickOrder?.length || 8,
  };
});

// Methods
const pickPlayer = async (player) => {
  if (picking.value) {
    toast.value?.addToast('Please wait for the current pick to complete', 'warning');
    return;
  }
  
  if (player.team !== 'undrafted') {
    toast.value?.addToast('This player has already been picked!', 'error');
    return;
  }
  
  if (!isUserTurn.value) {
    toast.value?.addToast("It's not your turn to pick!", 'warning');
    return;
  }

  picking.value = true;

  const result = await matchStore.pickPlayer(player.steamId);

  if (result.success) {
    toast.value?.addToast(`Picked ${player.name}!`, 'success');
  } else {
    toast.value?.addToast(result.error || 'Failed to pick player', 'error');
  }

  picking.value = false;
};

const goToVeto = () => {
  router.push(`/veto/${matchStore.matchId}`);
};
</script>

<template>
  <div class="draft-wrapper">
    <Navbar />
    <PlayerList />
    <ToastNotification ref="toast" />
    
    <div v-if="matchStore.match" class="draft-container">
      <!-- Header -->
      <div class="draft-header">
        <h1 class="draft-title">CAPTAIN DRAFT</h1>
        <p class="draft-subtitle" v-if="matchStore.phase === 'draft'">
          {{ currentCaptainName }}'s turn to pick ({{ pickInfo.current }}/{{ pickInfo.total }})
          <span v-if="isUserTurn" class="your-turn">🎯 YOUR TURN</span>
        </p>
        <p class="draft-subtitle complete" v-else>
          Teams Complete! Proceeding to Map Veto...
        </p>
      </div>

      <div class="draft-content">
        <!-- Team Alpha (Left) -->
        <div class="team-section team-1">
          <div class="team-header">
            <h2 class="team-title">{{ matchStore.teamAlphaName.toUpperCase() }}</h2>
            <div class="team-indicator" :class="{ active: matchStore.currentPicker === 'alpha' && matchStore.phase === 'draft' }">
              <span class="crown-icon">👑</span>
            </div>
          </div>
          
          <div class="team-players">
            <div 
              v-for="player in matchStore.teamAlphaPlayers" 
              :key="player.steamId"
              class="player-card team-1-card"
              :class="{ captain: player.steamId === matchStore.match.captains.alpha }"
            >
              <img :src="player.avatar || userAvatar" alt="Player" class="player-avatar" />
              <div class="player-info">
                <div class="player-name">{{ player.name }}</div>
                <div class="player-meta">
                  <span class="player-role">{{ player.steamId === matchStore.match.captains.alpha ? 'Captain' : 'Player' }}</span>
                  <span v-if="player.faceitLevel" class="faceit-badge">LVL {{ player.faceitLevel }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Draft Pool (Center) -->
        <div class="draft-pool">
          <div class="pool-header">
            <h3 class="pool-title">AVAILABLE PLAYERS</h3>
            <div class="pool-count">{{ matchStore.undraftedPlayers.length }} / 8</div>
          </div>
          
          <div class="pool-grid">
            <div 
              v-for="player in matchStore.match.players" 
              :key="player.steamId"
              class="pool-player"
              :class="{ 
                picked: player.team !== 'undrafted',
                hoverable: player.team === 'undrafted' && matchStore.phase === 'draft' && isUserTurn,
                disabled: !isUserTurn && player.team === 'undrafted'
              }"
              @click="pickPlayer(player)"
            >
              <img :src="player.avatar || userAvatar" alt="Player" class="pool-avatar" />
              <div class="pool-player-info">
                <div class="pool-player-name">{{ player.name }}</div>
                <div v-if="player.faceitLevel" class="pool-faceit-badge">LVL {{ player.faceitLevel }}</div>
              </div>
              <div v-if="player.team !== 'undrafted'" class="picked-overlay">
                <span class="picked-team">
                  {{ player.team === 'alpha' ? matchStore.teamAlphaName : matchStore.teamBetaName }}
                </span>
              </div>
            </div>
          </div>

          <!-- Skip Button (for testing) -->
          <button v-if="matchStore.phase === 'veto'" class="skip-btn" @click="goToVeto">
            Proceed to Veto →
          </button>
        </div>

        <!-- Team Beta (Right) -->
        <div class="team-section team-2">
          <div class="team-header">
            <h2 class="team-title">{{ matchStore.teamBetaName.toUpperCase() }}</h2>
            <div class="team-indicator" :class="{ active: matchStore.currentPicker === 'beta' && matchStore.phase === 'draft' }">
              <span class="crown-icon">👑</span>
            </div>
          </div>
          
          <div class="team-players">
            <div 
              v-for="player in matchStore.teamBetaPlayers" 
              :key="player.steamId"
              class="player-card team-2-card"
              :class="{ captain: player.steamId === matchStore.match.captains.beta }"
            >
              <img :src="player.avatar || userAvatar" alt="Player" class="player-avatar" />
              <div class="player-info">
                <div class="player-name">{{ player.name }}</div>
                <div class="player-meta">
                  <span class="player-role">{{ player.steamId === matchStore.match.captains.beta ? 'Captain' : 'Player' }}</span>
                  <span v-if="player.faceitLevel" class="faceit-badge">LVL {{ player.faceitLevel }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading draft...</p>
    </div>
  </div>
</template>

<style scoped>
.draft-wrapper {
  min-height: 100vh;
  position: relative;
}

.draft-container {
  padding: 2rem;
  max-width: 1800px;
  margin: 0 auto;
}

/* Header */
.draft-header {
  text-align: center;
  margin-bottom: 3rem;
}

.draft-title {
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

.draft-subtitle {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem;
  color: var(--star-cyan);
  letter-spacing: 0.1em;
  text-shadow: 0 0 20px rgba(75, 207, 250, 0.6);
}

.draft-subtitle.complete {
  color: var(--nebula-purple);
  text-shadow: 0 0 20px var(--nebula-purple);
  animation: pulse 1.5s ease-in-out infinite;
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

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Content Layout */
.draft-content {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

/* Team Sections */
.team-section {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-header {
  background: rgba(17, 24, 39, 0.6);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  position: relative;
  border: 2px solid rgba(75, 207, 250, 0.3);
}

.team-1 .team-header {
  border-color: rgba(75, 207, 250, 0.4);
}

.team-2 .team-header {
  border-color: rgba(248, 113, 113, 0.4);
}

.team-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--white-nova);
}

.team-indicator {
  margin-top: 0.5rem;
  opacity: 0.3;
  transition: all 0.3s ease;
}

.team-indicator.active {
  opacity: 1;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.crown-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
}

/* Team Players */
.team-players {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.player-card {
  background: rgba(17, 24, 39, 0.6);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  animation: slideIn 0.4s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.team-1-card {
  border: 2px solid rgba(75, 207, 250, 0.4);
  box-shadow: 0 0 15px rgba(75, 207, 250, 0.2);
}

.team-2-card {
  border: 2px solid rgba(248, 113, 113, 0.4);
  box-shadow: 0 0 15px rgba(248, 113, 113, 0.2);
  animation-name: slideInRight;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.player-card.captain {
  border-width: 3px;
  box-shadow: 0 0 25px rgba(255, 102, 196, 0.4);
}

.player-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-name {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--white-nova);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.player-role {
  color: rgba(248, 250, 252, 0.5);
  letter-spacing: 0.05em;
}

.faceit-badge {
  padding: 0.125rem 0.5rem;
  background: linear-gradient(135deg, #FF5500, #FF8A00);
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Draft Pool */
.draft-pool {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(17, 24, 39, 0.6);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(75, 207, 250, 0.3);
  border-radius: 12px;
}

.pool-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--white-nova);
}

.pool-count {
  font-family: 'Orbitron', sans-serif;
  font-size: 1rem;
  color: var(--star-cyan);
  font-weight: 600;
}

/* Pool Grid */
.pool-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.pool-player {
  position: relative;
  background: rgba(17, 24, 39, 0.6);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(75, 207, 250, 0.3);
  border-radius: 12px;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  cursor: not-allowed;
}

.pool-player.hoverable {
  cursor: pointer;
}

.pool-player.hoverable:hover {
  border-color: var(--star-cyan);
  box-shadow: var(--cyan-glow);
  transform: translateY(-4px);
}

.pool-player.picked {
  opacity: 0.4;
  border-color: rgba(248, 250, 252, 0.2);
  background: rgba(44, 47, 58, 0.6);
}

.pool-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.pool-player-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.pool-player-name {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--white-nova);
  text-align: center;
  letter-spacing: 0.05em;
}

.pool-faceit-badge {
  padding: 0.125rem 0.5rem;
  background: linear-gradient(135deg, #FF5500, #FF8A00);
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.picked-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 12px;
}

.picked-team {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--star-cyan);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* Skip Button */
.skip-btn {
  margin-top: 1.5rem;
  padding: 0.875rem 2rem;
  background: rgba(17, 24, 39, 0.8);
  border: 2px solid var(--nebula-purple);
  border-radius: 50px;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--nebula-purple);
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.skip-btn:hover {
  background: var(--nebula-purple);
  color: var(--cosmic-black);
  box-shadow: 0 0 30px var(--nebula-purple);
  transform: translateY(-2px);
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

/* Responsive */
.skip-btn {
  align-self: center;
  padding: 0.75rem 2rem;
  background: rgba(75, 207, 250, 0.1);
  border: 2px solid rgba(75, 207, 250, 0.3);
  border-radius: 8px;
  color: rgba(248, 250, 252, 0.6);
  font-family: 'Orbitron', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
}

.skip-btn:hover {
  border-color: var(--star-cyan);
  color: var(--star-cyan);
  box-shadow: 0 0 15px rgba(75, 207, 250, 0.3);
}

/* Responsive */
@media (max-width: 1400px) {
  .draft-content {
    flex-direction: column;
    align-items: center;
  }

  .team-section {
    width: 100%;
    max-width: 600px;
  }

  .team-players {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .player-card {
    flex: 0 0 calc(50% - 0.5rem);
  }

  .pool-grid {
    grid-template-columns: repeat(4, 1fr);
    max-width: 800px;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .pool-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .player-card {
    flex: 0 0 100%;
  }
}
</style>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '@/components/Navbar.vue';
import PlayerList from '@/components/PlayerList.vue';
import userAvatar from '@/images/user.png';

const router = useRouter();

// Mock data for captains and players
const captain1 = ref({ id: 1, name: 'Captain Alpha', avatar: userAvatar });
const captain2 = ref({ id: 2, name: 'Captain Beta', avatar: userAvatar });

const draftPool = ref([
  { id: 3, name: 'Player 3', avatar: userAvatar, picked: false, team: null },
  { id: 4, name: 'Player 4', avatar: userAvatar, picked: false, team: null },
  { id: 5, name: 'Player 5', avatar: userAvatar, picked: false, team: null },
  { id: 6, name: 'Player 6', avatar: userAvatar, picked: false, team: null },
  { id: 7, name: 'Player 7', avatar: userAvatar, picked: false, team: null },
  { id: 8, name: 'Player 8', avatar: userAvatar, picked: false, team: null },
  { id: 9, name: 'Player 9', avatar: userAvatar, picked: false, team: null },
  { id: 10, name: 'Player 10', avatar: userAvatar, picked: false, team: null }
]);

const team1 = ref([captain1.value]);
const team2 = ref([captain2.value]);

const currentTurn = ref(1); // 1 for team1, 2 for team2
const draftComplete = ref(false);

const availablePlayers = computed(() => {
  return draftPool.value.filter(p => !p.picked);
});

const pickPlayer = (player) => {
  if (player.picked || draftComplete.value) return;
  
  player.picked = true;
  player.team = currentTurn.value;
  
  if (currentTurn.value === 1) {
    team1.value.push(player);
  } else {
    team2.value.push(player);
  }
  
  // Check if only one player left - auto-assign
  if (availablePlayers.value.length === 1) {
    const lastPlayer = availablePlayers.value[0];
    lastPlayer.picked = true;
    const assignToTeam = team1.value.length < team2.value.length ? 1 : 2;
    lastPlayer.team = assignToTeam;
    
    if (assignToTeam === 1) {
      team1.value.push(lastPlayer);
    } else {
      team2.value.push(lastPlayer);
    }
    
    draftComplete.value = true;
    
    // Auto-transition to veto after 2 seconds
    setTimeout(() => {
      router.push('/veto');
    }, 2000);
    
    return;
  }
  
  // Switch turn
  currentTurn.value = currentTurn.value === 1 ? 2 : 1;
};

const skipToVeto = () => {
  router.push('/veto');
};
</script>

<template>
  <div class="draft-wrapper">
    <Navbar />
    <PlayerList />
    
    <div class="draft-container">
      <!-- Header -->
      <div class="draft-header">
        <h1 class="draft-title">CAPTAIN DRAFT</h1>
        <p class="draft-subtitle" v-if="!draftComplete">
          {{ currentTurn === 1 ? captain1.name : captain2.name }}'s turn to pick
        </p>
        <p class="draft-subtitle complete" v-else>
          Teams Complete! Proceeding to Map Veto...
        </p>
      </div>

      <div class="draft-content">
        <!-- Team 1 (Left) -->
        <div class="team-section team-1">
          <div class="team-header">
            <h2 class="team-title">TEAM ALPHA</h2>
            <div class="team-indicator" :class="{ active: currentTurn === 1 && !draftComplete }">
              <span class="crown-icon">👑</span>
            </div>
          </div>
          
          <div class="team-players">
            <div 
              v-for="player in team1" 
              :key="player.id"
              class="player-card team-1-card"
              :class="{ captain: player.id === captain1.id }"
            >
              <img :src="player.avatar" alt="Player" class="player-avatar" />
              <div class="player-info">
                <div class="player-name">{{ player.name }}</div>
                <div class="player-role">{{ player.id === captain1.id ? 'Captain' : 'Player' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Draft Pool (Center) -->
        <div class="draft-pool">
          <div class="pool-header">
            <h3 class="pool-title">AVAILABLE PLAYERS</h3>
            <div class="pool-count">{{ availablePlayers.length }} / 8</div>
          </div>
          
          <div class="pool-grid">
            <div 
              v-for="player in draftPool" 
              :key="player.id"
              class="pool-player"
              :class="{ 
                picked: player.picked,
                hoverable: !player.picked && !draftComplete
              }"
              @click="pickPlayer(player)"
            >
              <img :src="player.avatar" alt="Player" class="pool-avatar" />
              <div class="pool-player-name">{{ player.name }}</div>
              <div v-if="player.picked" class="picked-overlay">
                <span class="picked-team">{{ player.team === 1 ? 'Team Alpha' : 'Team Beta' }}</span>
              </div>
            </div>
          </div>

          <!-- Skip Button (for testing) -->
          <button class="skip-btn" @click="skipToVeto">
            Skip to Veto (Testing)
          </button>
        </div>

        <!-- Team 2 (Right) -->
        <div class="team-section team-2">
          <div class="team-header">
            <h2 class="team-title">TEAM BETA</h2>
            <div class="team-indicator" :class="{ active: currentTurn === 2 && !draftComplete }">
              <span class="crown-icon">👑</span>
            </div>
          </div>
          
          <div class="team-players">
            <div 
              v-for="player in team2" 
              :key="player.id"
              class="player-card team-2-card"
              :class="{ captain: player.id === captain2.id }"
            >
              <img :src="player.avatar" alt="Player" class="player-avatar" />
              <div class="player-info">
                <div class="player-name">{{ player.name }}</div>
                <div class="player-role">{{ player.id === captain2.id ? 'Captain' : 'Player' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
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

.player-role {
  font-size: 0.75rem;
  color: rgba(248, 250, 252, 0.5);
  letter-spacing: 0.05em;
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

.pool-player-name {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--white-nova);
  text-align: center;
  letter-spacing: 0.05em;
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

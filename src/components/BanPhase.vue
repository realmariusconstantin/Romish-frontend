<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import userAvatarImg from '@/images/user.png';
import PlayerList from '@/components/PlayerList.vue';

const userAvatar = userAvatarImg;

// Timer state
const timerSeconds = ref(90); // 1:30
let timerInterval = null;

const formattedTimer = computed(() => {
  const minutes = Math.floor(timerSeconds.value / 60);
  const seconds = timerSeconds.value % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

onMounted(() => {
  timerInterval = setInterval(() => {
    if (timerSeconds.value > 0) {
      timerSeconds.value--;
    }
  }, 1000);
});

onBeforeUnmount(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});
</script>

<template>
  <div class="ban-phase-wrapper">
    <!-- PlayerList Sidebar -->
    <PlayerList />
    
    <div class="ban-phase-container">
      <!-- Team 1 Section (Left) -->
      <div class="team-section team-1">
      <div class="ban-phase-header">
        <h3 class="ban-phase-title team-1-color">TEAM 1</h3>
      </div>
      <div class="player-cards-column">
        <div 
          v-for="i in 5" 
          :key="`team1-${i}`" 
          class="player-card team-1-border"
        >
          <div v-if="i === 3" class="captain-crown">👑</div>
          <img :src="userAvatar" alt="Player" class="player-avatar" />
          <div class="player-info">
            <div class="player-name">Player {{ i }}</div>
            <div class="player-rank">Diamond II</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ban Phase Section (Center) -->
    <div class="ban-phase-section">
      <div class="ban-phase-header">
        <h2 class="ban-phase-title">BAN PHASE</h2>
        <div class="ban-phase-timer">{{ formattedTimer }}</div>
      </div>
      
      <div class="map-ban-grid">
        <div 
          v-for="i in 10" 
          :key="i" 
          class="map-ban-slot"
        >
          <span class="map-number">MAP {{ i }}</span>
          <div class="map-ban-x">✕</div>
        </div>
      </div>
      
      <p class="ban-phase-instructions">
        Teams alternate banning maps until only one remains
      </p>
    </div>

    <!-- Team 2 Section (Right) -->
    <div class="team-section team-2">
      <div class="ban-phase-header">
        <h3 class="ban-phase-title team-2-color">TEAM 2</h3>
      </div>
      <div class="player-cards-column">
        <div 
          v-for="i in 5" 
          :key="`team2-${i}`" 
          class="player-card team-2-border"
        >
          <div v-if="i === 3" class="captain-crown">👑</div>
          <img :src="userAvatar" alt="Player" class="player-avatar" />
          <div class="player-info">
            <div class="player-name">Player {{ i }}</div>
            <div class="player-rank">Diamond II</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<style scoped>
/* Wrapper */
.ban-phase-wrapper {
  position: relative;
  width: 100%;
}

/* Container */
.ban-phase-container {
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  justify-content: center;
  max-width: 1800px;
  margin: 0 auto;
}

/* Team Sections */
.team-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  max-width: 400px;
}

.player-cards-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Player Cards */
.player-card {
  position: relative;
  width: 100%;
  height: 100px;
  background: rgba(17, 24, 39, 0.6);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s ease;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.player-card:hover {
  transform: translateX(8px);
}

.team-1 .player-card:hover {
  transform: translateX(-8px);
}

.team-1-border {
  border: 2px solid rgba(75, 207, 250, 0.4);
  box-shadow: 0 0 20px rgba(75, 207, 250, 0.3);
}

.team-1-border:hover {
  box-shadow: 0 0 30px rgba(75, 207, 250, 0.5);
}

.team-2-border {
  border: 2px solid rgba(248, 113, 113, 0.4);
  box-shadow: 0 0 20px rgba(248, 113, 113, 0.3);
}

.team-2-border:hover {
  box-shadow: 0 0 30px rgba(248, 113, 113, 0.5);
}

.player-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.player-name {
  color: var(--white-nova);
  font-family: 'Orbitron', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-rank {
  color: rgba(248, 250, 252, 0.6);
  font-size: 0.85rem;
  letter-spacing: 0.05em;
}

.captain-crown {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.75rem;
  filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
  z-index: 10;
}

/* Ban Phase Section */
.ban-phase-section {
  flex: 0 0 450px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.ban-phase-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(17, 24, 39, 0.6);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(75, 207, 250, 0.3);
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(75, 207, 250, 0.2);
}

.ban-phase-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  background: var(--starlight-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.team-1-color {
  background: linear-gradient(135deg, var(--star-cyan), rgba(75, 207, 250, 0.6));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.team-2-color {
  background: linear-gradient(135deg, var(--aurora-pink), rgba(248, 113, 113, 0.6));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ban-phase-timer {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--star-cyan);
  letter-spacing: 0.1em;
  text-shadow: 0 0 20px rgba(75, 207, 250, 0.8);
}

/* Map Ban Grid */
.map-ban-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.map-ban-slot {
  width: 100%;
  height: 60px;
  background: rgba(17, 24, 39, 0.6);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(75, 207, 250, 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.map-ban-slot:hover {
  border-color: var(--star-cyan);
  box-shadow: var(--cyan-glow);
  transform: translateX(4px);
}

.map-number {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.95rem;
  color: var(--white-nova);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 600;
}

.map-ban-x {
  font-size: 1.5rem;
  color: rgba(248, 113, 113, 0.7);
  font-weight: 700;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.map-ban-slot:hover .map-ban-x {
  opacity: 1;
}

/* Instructions */
.ban-phase-instructions {
  text-align: center;
  color: rgba(248, 250, 252, 0.7);
  font-size: 0.75rem;
  font-style: italic;
}

/* Responsive Design */
@media (max-width: 1400px) {
  .ban-phase-container {
    gap: 1.5rem;
  }

  .team-section {
    max-width: 350px;
  }

  .ban-phase-section {
    flex: 0 0 400px;
  }
}

@media (max-width: 1200px) {
  .ban-phase-container {
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  .team-section {
    max-width: 500px;
    width: 100%;
  }

  .ban-phase-section {
    flex: 1;
    max-width: 600px;
    width: 100%;
  }

  .player-card {
    height: 90px;
  }

  .player-avatar {
    width: 60px;
    height: 60px;
  }
}

@media (max-width: 768px) {
  .ban-phase-container {
    padding: 1rem;
    gap: 1.5rem;
  }

  .player-card {
    height: 80px;
    padding: 0.75rem;
  }

  .player-avatar {
    width: 50px;
    height: 50px;
  }

  .player-name {
    font-size: 0.85rem;
  }

  .player-rank {
    font-size: 0.75rem;
  }

  .map-ban-slot {
    height: 50px;
    padding-left: 1rem;
  }

  .ban-phase-title {
    font-size: 1.1rem;
  }

  .ban-phase-timer {
    font-size: 1.5rem;
  }

  .captain-crown {
    font-size: 1.5rem;
    top: -12px;
  }
}

@media (max-width: 480px) {
  .player-card {
    height: 70px;
    padding: 0.5rem;
    gap: 0.75rem;
  }

  .player-avatar {
    width: 45px;
    height: 45px;
  }

  .player-name {
    font-size: 0.75rem;
  }

  .player-rank {
    font-size: 0.7rem;
  }

  .map-ban-slot {
    height: 45px;
    padding-left: 0.75rem;
  }

  .map-number {
    font-size: 0.85rem;
  }
}
</style>

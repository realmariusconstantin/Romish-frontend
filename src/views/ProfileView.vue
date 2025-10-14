<script setup>
import Navbar from '@/components/Navbar.vue';
import PlayerList from '@/components/PlayerList.vue';
</script>

<template>
  <div class="page-wrapper">
    <Navbar />
    <PlayerList />
    
    <div class="page-container">
      <div class="wip-overlay">
        <div class="wip-content">
          <div class="wip-icon">👤</div>
          <h1 class="wip-title">PROFILE</h1>
          <p class="wip-message">Coming Soon</p>
          <div class="wip-description">
            Customize your player profile, manage settings, and view your achievements
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  position: relative;
}

.page-container {
  min-height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.wip-overlay {
  position: relative;
  padding: 4rem;
  background: rgba(17, 24, 39, 0.4);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(75, 207, 250, 0.3);
  border-radius: 24px;
  text-align: center;
  max-width: 600px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.wip-overlay::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, var(--star-cyan), var(--nebula-purple));
  border-radius: 24px;
  opacity: 0.1;
  animation: pulse 2s ease-in-out infinite;
  z-index: -1;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.1;
  }
  50% {
    opacity: 0.2;
  }
}

.wip-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.wip-icon {
  font-size: 5rem;
  filter: drop-shadow(0 0 20px rgba(75, 207, 250, 0.6));
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

.wip-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  background: var(--starlight-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.wip-message {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--star-cyan);
  text-transform: uppercase;
  text-shadow: 0 0 20px rgba(75, 207, 250, 0.6);
}

.wip-description {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: rgba(248, 250, 252, 0.6);
  line-height: 1.6;
  max-width: 400px;
}
</style>

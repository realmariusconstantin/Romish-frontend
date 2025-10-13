<script setup>
import { ref } from 'vue'
import Navbar from '@/components/Navbar.vue'
import QueueSection from '@/components/QueueSection.vue'
import MapGrid from '@/components/MapGrid.vue'
import PlayerList from '@/components/PlayerList.vue'
import BanPhase from '@/components/BanPhase.vue'

const showBanPhase = ref(false)

const handleShowBanPhase = () => {
  showBanPhase.value = true
}

const handleBackToQueue = () => {
  showBanPhase.value = false
}
</script>

<template>
  <div class="home">
    <Navbar />
    
    <!-- Main Queue View -->
    <main v-if="!showBanPhase" class="main-content">
      <div class="left-section">
        <QueueSection @show-ban-phase="handleShowBanPhase" />
        <MapGrid />
      </div>
      
      <PlayerList />
    </main>

    <!-- Ban Phase View -->
    <div v-else class="ban-phase-wrapper">
      <button class="back-button" @click="handleBackToQueue">
        ← Back to Queue
      </button>
      <BanPhase />
    </div>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  padding: 2rem;
  gap: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.left-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Ban Phase Wrapper */
.ban-phase-wrapper {
  position: relative;
  flex: 1;
}

.back-button {
  position: fixed;
  top: 100px;
  left: 2rem;
  background: rgba(17, 24, 39, 0.95);
  border: 2px solid var(--star-cyan);
  border-radius: 12px;
  padding: 0.875rem 1.5rem;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--star-cyan);
  cursor: pointer;
  box-shadow: var(--cyan-glow);
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  z-index: 1000;
}

.back-button:hover {
  background: var(--star-cyan);
  color: var(--cosmic-black);
  box-shadow: var(--cyan-glow-hover);
  transform: translateX(-4px);
}

/* Responsive */
@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
    padding: 1rem;
  }

  .left-section {
    margin-right: 0;
  }

  .back-button {
    top: 80px;
    left: 1rem;
    padding: 0.75rem 1.25rem;
    font-size: 0.75rem;
  }
}
</style>

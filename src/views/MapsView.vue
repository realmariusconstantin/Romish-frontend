<script setup>
import Navbar from '@/components/Navbar.vue';
import MapGrid from '@/components/MapGrid.vue';
import PlayerList from '@/components/PlayerList.vue';
</script>

<template>
  <div class="maps-wrapper">
    <Navbar />
    <PlayerList />
    
    <div class="maps-container">
      <div class="maps-header">
        <h1 class="maps-title">MAP POOL</h1>
        <p class="maps-subtitle">Browse available competitive maps</p>
      </div>

      <MapGrid />
    </div>
  </div>
</template>

<style scoped>
.maps-wrapper {
  min-height: 100vh;
  position: relative;
}

.maps-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.maps-header {
  text-align: center;
  margin-bottom: 3rem;
}

.maps-title {
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

.maps-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: rgba(248, 250, 252, 0.6);
  letter-spacing: 0.05em;
}
</style>

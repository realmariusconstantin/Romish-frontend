<script setup>
import Navbar from '@/components/Navbar.vue'
import QueueSection from '@/components/QueueSection.vue'
import MapGrid from '@/components/MapGrid.vue'
import PlayerList from '@/components/PlayerList.vue'
</script>

<template>
  <div class="home">
    <Navbar />
    
    <main class="main-content">
      <div class="left-section">
        <QueueSection />
        <MapGrid />
      </div>
      
      <PlayerList />
    </main>
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

/* Responsive */
@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
    padding: 1rem;
  }

  .left-section {
    margin-right: 0;
  }
}
</style>

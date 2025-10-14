<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '@/components/Navbar.vue';
import QueueSection from '@/components/QueueSection.vue';
import PlayerList from '@/components/PlayerList.vue';

const router = useRouter();

const handleStartQueue = () => {
  // TODO: connect backend later - for now just navigate to draft
  router.push('/draft');
};
</script>

<template>
  <div class="home">
    <Navbar />
    <PlayerList />
    
    <!-- Main Queue View -->
    <main class="main-content">
      <QueueSection @start-queue="handleStartQueue" />
    </main>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

/* Responsive */
@media (max-width: 1024px) {
  .main-content {
    padding: 1rem;
  }
}
</style>

<script setup>
import Navbar from '@/components/Navbar.vue';
</script>

<template>
  <div class="profile-view">
    <Navbar />
    <div class="wip-container">
      <h1 class="wip-title">PROFILE PAGE</h1>
      <p class="wip-message">Under Construction</p>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
  min-height: 100vh;
  background: var(--cosmic-black);
}

.wip-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  text-align: center;
}

.wip-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  background: var(--starlight-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

.wip-message {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  color: var(--white-nova);
}
</style>

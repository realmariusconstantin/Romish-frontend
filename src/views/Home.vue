<script setup>
import { onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useQueueStore } from '@/stores/queue';
import { useMatchStore } from '@/stores/match';
import Navbar from '@/components/Navbar.vue';
import QueueSection from '@/components/QueueSection.vue';
import PlayerList from '@/components/PlayerList.vue';
import AcceptMatchPopup from '@/components/AcceptMatchPopup.vue';

const router = useRouter();
const userStore = useUserStore();
const queueStore = useQueueStore();
const matchStore = useMatchStore();

onMounted(async () => {
  // Fetch user if not already loaded
  if (!userStore.user) {
    const success = await userStore.fetchUser();
    if (!success) {
      // DEV MODE: Still connect socket for testing even without auth
      console.warn('⚠️ Not authenticated, but connecting socket for dev testing');
      queueStore.connectSocket();
      matchStore.connectSocket();
      // Uncomment below to require login:
      // router.push('/login');
      // return;
    }
  }

  // Connect queue socket for real-time updates
  queueStore.connectSocket();
  
  // Connect match socket for accept phase events
  matchStore.connectSocket();
  
  // Fetch current queue status
  await queueStore.fetchQueueStatus();
  
  // Check if user has an active match in accept phase (page refresh recovery)
  await matchStore.checkCurrentMatch();
});

onBeforeUnmount(() => {
  // Disconnect sockets when leaving page
  queueStore.disconnectSocket();
  matchStore.disconnectSocket();
});

// Watch for match creation via Socket.IO (when someone else fills the queue)
watch(() => queueStore.matchRedirectId, (matchId) => {
  if (matchId) {
    console.log('Match created! Redirecting to draft:', matchId);
    router.push(`/draft/${matchId}`);
  }
});

// Watch for match-starting event (when all players accept)
watch(() => matchStore.acceptPhase.active, (isActive, wasActive) => {
  console.log('👀 Accept phase active changed:', { wasActive, isActive });
  // If accept phase just ended and we're not showing it anymore
  if (wasActive && !isActive) {
    // Check if match was created successfully
    const matchId = matchStore.acceptPhase.matchId;
    console.log('🎯 Accept phase ended, matchId:', matchId);
    if (matchId) {
      console.log('✅ All players accepted! Redirecting to draft:', matchId);
      // Small delay to let backend finish setup
      setTimeout(() => {
        router.push(`/draft/${matchId}`);
      }, 1000);
    } else {
      console.warn('⚠️ Accept phase ended but no matchId found');
    }
  }
});

// Computed - Show popup if accept phase active
const showAcceptPopup = computed(() => {
  return matchStore.acceptPhase.active;
});

const handleQueueAction = async (action) => {
  if (action === 'join') {
    const result = await queueStore.joinQueue();
    
    if (result.success) {
      if (result.matchCreated) {
        // Queue is full, match created, redirect to draft
        router.push(`/draft/${result.matchId}`);
      }
      // Otherwise, stay on page and show queue timer
    } else {
      console.error('Failed to join queue:', result.error);
      alert(result.error || 'Failed to join queue');
    }
  } else if (action === 'leave') {
    const result = await queueStore.leaveQueue();
    
    if (!result.success) {
      console.error('Failed to leave queue:', result.error);
    }
  }
};
</script>

<template>
  <div class="home">
    <Navbar />
    <PlayerList />
    
    <!-- Main Queue View -->
    <main class="main-content">
      <QueueSection @queue-action="handleQueueAction" />
    </main>
    
    <!-- Accept Match Popup -->
    <AcceptMatchPopup v-if="showAcceptPopup" />
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

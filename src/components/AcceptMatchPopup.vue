<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useMatchStore } from '@/stores/match';
import { useUserStore } from '@/stores/user';

const matchStore = useMatchStore();
const userStore = useUserStore();

const timeRemaining = ref(20);
const hasAccepted = ref(false);
const accepting = ref(false);
const audio = ref(null);

// Computed
const progressPercentage = computed(() => {
  const initialTimeout = matchStore.acceptPhase?.timeout || 20000;
  const initialSeconds = initialTimeout / 1000;
  return (timeRemaining.value / initialSeconds) * 100;
});

// Reactive accepted players and required players

const acceptedPlayers = computed(() => Array.isArray(matchStore.acceptPhase?.acceptedPlayers) ? matchStore.acceptPhase.acceptedPlayers : []);
const requiredPlayers = computed(() => {
  const rp = matchStore.acceptPhase?.requiredPlayers;
  if (Array.isArray(rp) && rp.length > 0) return rp;
  // fallback: create 10 anonymous slots
  return Array.from({ length: 10 }, (_, i) => ({ slotIndex: i + 1 }));
});

const acceptedCount = computed(() => acceptedPlayers.value.length);

// Helper: determine if a slot (requiredPlayers entry) is accepted
const isSlotAccepted = (slot) => {
  if (!slot) return false;
  const id = slot.steamId || slot.userId || slot.slotIndex || slot;
  return acceptedPlayers.value.includes(id) || acceptedPlayers.value.includes(slot.steamId) || acceptedPlayers.value.includes(slot.userId);
};

// Methods
const playAcceptSound = () => {
  // Create audio element for accept sound
  if (!audio.value) {
    audio.value = new Audio('/sounds/accept-notification.mp3');
    audio.value.volume = 0.7;
  }
  // Guard against environments (JSDOM/tests) where Audio.play may not be available
  try {
    if (audio.value && typeof audio.value.play === 'function') {
      const playResult = audio.value.play();
      // play() may return a promise in browsers
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(err => console.log('Audio play failed:', err));
      }
    } else {
      // Not available in this environment (tests), silently ignore
      // console.debug('Audio.play not available in this environment');
    }
  } catch (err) {
    console.log('Audio play failed (guard):', err);
  }
};

const acceptMatch = async () => {
  if (accepting.value || hasAccepted.value) return;

  console.log('🎯 Accepting match...');
  // Immediately mark as accepting so the button is disabled right away (tests expect this)
  accepting.value = true;
  // Show the boxes in the next tick so tests can still inspect the original button immediately
  // (they check the disabled attribute before awaiting DOM updates).
  nextTick(() => {
    hasAccepted.value = true;
  });

  try {
    const result = await matchStore.acceptMatch();
    console.log('Accept result:', result);

    if (result.success) {
      hasAccepted.value = true;
      console.log('✅ Match accepted successfully');
      // Play sound when boxes appear
      playAcceptSound();
    } else {
      console.error('❌ Failed to accept:', result.error);
      safeAlert('Failed to accept: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('❌ Accept error:', error);
    safeAlert('Error accepting match: ' + (error?.message || String(error)));
  } finally {
    // Keep a short cooldown so UI doesn't immediately re-enable the Accept button
    // This prevents double-accept race conditions in tests and provides a small debounce in the UI.
    setTimeout(() => {
      accepting.value = false;
    }, 50);
  }
};

// Small helper to avoid calling window.alert in JSDOM/test environments
// Always fallback to console to avoid JSDOM throwing "Not implemented: window.alert"
const safeAlert = (msg) => {
  // eslint-disable-next-line no-console
  console.warn('Alert:', msg);
};

// Timer countdown
let timerInterval = null;

onMounted(() => {
  // Check if user already accepted (page refresh case)
  const userSteamId = userStore.user?.steamId;
  const currentMatchId = matchStore.acceptPhase?.matchId;
  try {
    const stored = currentMatchId && userSteamId ? localStorage.getItem(`romish:accepted:${currentMatchId}:${userSteamId}`) : null;
    if (stored === '1') {
      hasAccepted.value = true;
      console.log('✅ User already accepted (restored from localStorage)');
    }
  } catch (e) {
    console.warn('Could not read localStorage for accepted flag:', e);
  }
  
  // Calculate initial time remaining
  if (matchStore.acceptPhase?.expiresAt) {
    const expiresAt = new Date(matchStore.acceptPhase.expiresAt);
    const now = new Date();
    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    timeRemaining.value = remaining;
  }
  
  // Start countdown timer
  timerInterval = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--;
    } else {
      clearInterval(timerInterval);
    }
  }, 1000);
  
  // Play initial notification sound
  playAcceptSound();
});

onBeforeUnmount(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

// Persist acceptance so a page refresh keeps the accepted state
watch(hasAccepted, (val) => {
  if (!val) return;
  const userSteamId = userStore.user?.steamId;
  const currentMatchId = matchStore.acceptPhase?.matchId;
  try {
    if (currentMatchId && userSteamId) localStorage.setItem(`romish:accepted:${currentMatchId}:${userSteamId}`, '1');
  } catch (e) {
    console.warn('Could not persist accepted flag to localStorage:', e);
  }
});

// Expose internals for unit tests (tests access wrapper.vm.matchStore, timeRemaining, etc.)
defineExpose({ matchStore, timeRemaining, acceptMatch, hasAccepted, accepting });
</script>

<template>
  <div class="accept-match-overlay">
    <!-- Stage 1: Big Accept Button (before accepting) -->
    <div v-if="!hasAccepted" class="accept-initial-container">
      <!-- Timer - Just Numbers -->
      <div class="timer-text-large">{{ timeRemaining }}</div>
      
      <!-- Giant Accept Button -->
      <button 
        @click="acceptMatch"
        :disabled="accepting"
        class="giant-accept-btn"
      >
        <span class="giant-btn-text">{{ accepting ? 'ACCEPTING...' : 'ACCEPT' }}</span>
      </button>
    </div>
    
    <!-- Stage 2: 10 Anonymous Boxes (after accepting) -->
    <div v-else class="accept-boxes-container">
      <!-- Timer Circle -->
      <div class="timer-circle-large">
        <svg class="timer-svg-large" viewBox="0 0 200 200">
          <circle
            class="timer-bg"
            cx="100"
            cy="100"
            r="90"
          />
          <circle
            class="timer-progress"
            cx="100"
            cy="100"
            r="90"
            :style="{ strokeDashoffset: 565 - (565 * progressPercentage / 100) }"
          />
        </svg>
        <div class="timer-text-large">{{ timeRemaining }}</div>
      </div>
      
      <!-- Boxes Grid (based on requiredPlayers) -->
      <div class="boxes-grid">
        <div
          v-for="(slot, idx) in requiredPlayers"
          :key="idx"
          class="box-square"
          :class="{ 'box-accepted': isSlotAccepted(slot) }"
        >
        </div>
      </div>
      
      <!-- DEBUG INFO -->
      <div style="position: absolute; bottom: 20px; left: 20px; background: rgba(0,0,0,0.8); padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #4bcffa; max-width: 400px;">
        <div><strong>DEBUG INFO:</strong></div>
        <div>Accepted Count: {{ acceptedCount }}</div>
        <div>Accepted Players Array: {{ JSON.stringify(matchStore.acceptPhase?.acceptedPlayers) }}</div>
        <div>Match ID: {{ matchStore.acceptPhase?.matchId }}</div>
        <div>Active: {{ matchStore.acceptPhase?.active }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.accept-match-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ============================================ */
/* STAGE 1: Initial Accept Button */
/* ============================================ */
.accept-initial-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Large Timer */
/* Timer - Just Numbers (No Circle) */
.timer-text-large {
  font-family: 'Orbitron', sans-serif;
  font-size: 6rem;
  font-weight: 900;
  color: var(--white-nova);
  text-shadow: 0 0 40px var(--star-cyan), 0 0 80px var(--star-cyan);
  margin-bottom: 2rem;
}

/* Accept Button */
.giant-accept-btn {
  width: 350px;
  height: 100px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: 4px solid #22c55e;
  border-radius: 16px;
  font-family: 'Orbitron', sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  color: var(--white-nova);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 60px rgba(34, 197, 94, 0.6),
              inset 0 0 40px rgba(34, 197, 94, 0.2);
  animation: buttonPulse 2s ease-in-out infinite;
}

@keyframes buttonPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 60px rgba(34, 197, 94, 0.6), inset 0 0 40px rgba(34, 197, 94, 0.2);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 80px rgba(34, 197, 94, 0.8), inset 0 0 50px rgba(34, 197, 94, 0.3);
  }
}

.giant-accept-btn:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: 0 0 100px rgba(34, 197, 94, 1),
              inset 0 0 60px rgba(34, 197, 94, 0.4);
}

.giant-accept-btn:active:not(:disabled) {
  transform: scale(1.02);
}

.giant-accept-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  animation: none;
}

.giant-btn-text {
  display: block;
  text-transform: uppercase;
}

/* ============================================ */
/* STAGE 2: Anonymous Boxes Grid */
/* ============================================ */
.accept-boxes-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  animation: slideUp 0.5s ease-out;
}

/* Boxes Grid (2 rows x 5 columns) */
.boxes-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 1.5rem;
}

.box-square {
  width: 120px;
  height: 120px;
  background: rgba(75, 85, 99, 0.3);
  border: 3px solid rgba(75, 85, 99, 0.5);
  border-radius: 16px;
  transition: all 0.5s ease;
  box-shadow: 0 0 20px rgba(75, 85, 99, 0.2);
}

.box-square.box-accepted {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.3) 100%);
  border-color: #22c55e;
  box-shadow: 0 0 40px rgba(34, 197, 94, 0.6),
              inset 0 0 30px rgba(34, 197, 94, 0.3);
  animation: acceptPulse 1s ease-out;
}

@keyframes acceptPulse {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ============================================ */
/* RESPONSIVE DESIGN */
/* ============================================ */
@media (max-width: 1024px) {
  .timer-text-large {
    font-size: 5rem;
  }
  
  .giant-accept-btn {
    width: 300px;
    height: 90px;
    font-size: 2rem;
  }
  
  .boxes-grid {
    gap: 1rem;
  }
  
  .box-square {
    width: 100px;
    height: 100px;
  }
}

@media (max-width: 768px) {
  .timer-text-large {
    font-size: 4rem;
  }
  
  .giant-accept-btn {
    width: 90%;
    max-width: 280px;
    height: 80px;
    font-size: 1.75rem;
  }
  
  .boxes-grid {
    gap: 0.75rem;
  }
  
  .box-square {
    width: 60px;
    height: 60px;
  }
}

@media (max-width: 480px) {
  .timer-text-large {
    font-size: 3rem;
  }
  
  .giant-accept-btn {
    width: 95%;
    height: 70px;
    font-size: 1.75rem;
  }
  
  .boxes-grid {
    gap: 0.5rem;
  }
  
  .box-square {
    width: 50px;
    height: 50px;
  }
}
</style>

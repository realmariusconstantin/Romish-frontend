<template>
  <teleport to="body">
    <transition name="modal-fade" v-if="readyStore.visible">
      <!-- Glass backdrop -->
      <div class="ready-modal-backdrop" @click.self="handleBackdropClick">
        <!-- Modal container -->
        <div class="ready-modal">
          <!-- Header with timer -->
          <div class="modal-header">
            <h2>{{ readyStore.matchId ? `Match ${readyStore.matchId.slice(-6)}` : 'Ready Up' }}</h2>
            <div class="timer" :class="{ critical: readyStore.secondsRemaining <= 10 }">
              <span class="timer-icon">⏱️</span>
              <span class="timer-value">{{ String(readyStore.secondsRemaining).padStart(2, '0') }}s</span>
            </div>
          </div>

          <!-- Player grid -->
          <div class="players-grid">
            <div
              v-for="player in readyStore.players"
              :key="player.userId || player.steamId || player.id || player.name"
              class="player-card"
              :class="{ accepted: player.accepted }"
            >
              <div class="player-avatar">
                <span class="avatar-letter">{{ getInitial(player) }}</span>
              </div>
              <div class="player-status" v-if="player.accepted">
                <span class="checkmark">✓</span>
              </div>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="progress-section">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: readyStore.progressPercentage + '%' }"></div>
            </div>
            <p class="progress-text">
              {{ readyStore.acceptedCount }} of {{ readyStore.players.length }} accepted
            </p>
          </div>

          <!-- Accept button -->
          <div class="button-section">
            <button
              v-if="!readyStore.currentUserAccepted"
              @click="handleAccept"
              class="btn-accept"
              :disabled="isProcessing"
            >
              <span v-if="!isProcessing">ACCEPT</span>
              <span v-else>ACCEPTING...</span>
            </button>
            <div v-else class="accepted-badge">
              <span class="checkmark-large">✓</span>
              <p>You accepted the match</p>
            </div>
          </div>

          <!-- Info text -->
          <p class="info-text" v-if="!readyStore.allAccepted">
            Accept within {{ readyStore.secondsRemaining }}s or you'll be removed from queue
          </p>
          <p class="info-text success" v-else>
            All players accepted! Proceeding to draft...
          </p>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref } from 'vue';
import { useReadyStore } from '../stores/ready';
import { acceptReady } from '../sockets/match';

const readyStore = useReadyStore();
const isProcessing = ref(false);

function getInitial(userOrId) {
  try {
    // Accept either a string id or a player object
    let val = null;
    if (!userOrId) return '?';
    if (typeof userOrId === 'string') val = userOrId;
    else if (typeof userOrId === 'object') {
      val = userOrId.userId || userOrId.steamId || userOrId.id || userOrId.name || userOrId.username;
    }

    if (!val || typeof val !== 'string' || val.length === 0) return '?';
    return val.charAt(0).toUpperCase();
  } catch (err) {
    console.warn('getInitial error', err, userOrId);
    return '?';
  }
}

function handleAccept() {
  isProcessing.value = true;
  readyStore.accept();
  acceptReady(readyStore.matchId);

  // Disable button immediately (server will confirm)
  setTimeout(() => {
    isProcessing.value = false;
  }, 500);
}

function handleBackdropClick() {
  // Prevent closing by clicking outside
}
</script>

<style scoped>
.ready-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: backdropFadeIn 0.3s ease-out;
}

@keyframes backdropFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.ready-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
  border: 2px solid rgba(100, 200, 255, 0.3);
  border-radius: 20px;
  padding: 40px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 8px 32px rgba(100, 200, 255, 0.2), 0 0 20px rgba(139, 92, 246, 0.1);
  animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalSlideIn {
  from {
    transform: scale(0.9) translateY(20px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(100, 200, 255, 0.2);
}

.modal-header h2 {
  margin: 0;
  color: #00d4ff;
  font-size: 24px;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 212, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: #00d4ff;
  font-size: 18px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.timer.critical {
  background: rgba(255, 100, 100, 0.2);
  border-color: rgba(255, 100, 100, 0.5);
  color: #ff6464;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.timer-icon {
  font-size: 20px;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 12px;
  margin-bottom: 30px;
}

.player-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: rgba(50, 50, 100, 0.3);
  border: 2px solid rgba(100, 200, 255, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.player-card.accepted {
  background: rgba(100, 200, 100, 0.2);
  border-color: rgba(100, 200, 100, 0.5);
  box-shadow: 0 0 15px rgba(100, 200, 100, 0.3);
}

.player-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 18px;
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.5);
}

.player-status {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 32px;
  height: 32px;
  background: #4ade80;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 0 10px rgba(74, 222, 128, 0.6);
}

.progress-section {
  margin-bottom: 30px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(100, 200, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
  border: 1px solid rgba(100, 200, 255, 0.2);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff 0%, #8b5cf6 100%);
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.progress-text {
  color: rgba(200, 200, 200, 0.8);
  font-size: 12px;
  margin: 0;
  text-align: center;
}

.button-section {
  margin-bottom: 20px;
}

.btn-accept {
  width: 100%;
  padding: 16px 32px;
  background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-accept:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.6);
}

.btn-accept:active:not(:disabled) {
  transform: translateY(0);
}

.btn-accept:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.accepted-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(100, 200, 100, 0.1);
  border: 2px dashed rgba(100, 200, 100, 0.5);
  border-radius: 12px;
}

.checkmark-large {
  font-size: 36px;
  color: #4ade80;
  margin-bottom: 8px;
}

.accepted-badge p {
  margin: 0;
  color: #4ade80;
  font-weight: bold;
}

.info-text {
  text-align: center;
  color: rgba(200, 200, 200, 0.7);
  font-size: 13px;
  margin: 0;
}

.info-text.success {
  color: #4ade80;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>

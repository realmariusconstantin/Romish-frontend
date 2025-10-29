<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useQueueStore } from '@/stores/queue';
import { useUserStore } from '@/stores/user';
import userAvatar from '@/images/user.png';

const queueStore = useQueueStore();
const userStore = useUserStore();

const emit = defineEmits(['queue-action']);

// Timer for displaying elapsed time
const elapsedSeconds = ref(0);
let timerInterval = null;

// Start timer when queue has players
const startTimer = () => {
  if (timerInterval) return;
  
  timerInterval = setInterval(() => {
    if (queueStore.queueStartTime) {
      const now = new Date();
      const start = new Date(queueStore.queueStartTime);
      elapsedSeconds.value = Math.floor((now - start) / 1000);
    } else {
      elapsedSeconds.value = 0;
    }
  }, 1000);
};

// Stop timer
const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  elapsedSeconds.value = 0;
};

onMounted(() => {
  startTimer();
});

onBeforeUnmount(() => {
  stopTimer();
});

// Computed
const formattedTime = computed(() => {
  const minutes = Math.floor(elapsedSeconds.value / 60);
  const seconds = elapsedSeconds.value % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

const queueStatusText = computed(() => {
  const playerText = queueStore.playerCount === 1 ? 'player' : 'players';
  if (queueStore.isInQueue) {
    return `In queue - ${queueStore.playerCount} ${playerText}`;
  }
  return `In queue - ${queueStore.playerCount} ${playerText}`;
});

// Generate player cards (5 slots: 1 user + 4 teammates)
const playerCards = computed(() => {
  const cards = [];
  
  // Center card (index 2) is the user with magenta glow
  for (let i = 0; i < 5; i++) {
    const isUser = i === 2; // 3rd card (index 2) is the user
    
    if (isUser) {
      // User card (magenta glow)
      cards.push({
        isUser: true,
        glowClass: 'magenta-glow',
        avatar: userStore.user?.avatar || userAvatar,
        name: userStore.user?.username || 'Player',
        isWIP: false,
      });
    } else {
      // Teammate cards (cyan glow, greyed out, W.I.P)
      cards.push({
        isUser: false,
        glowClass: 'cyan-glow',
        avatar: userAvatar,
        name: '',
        isWIP: true,
      });
    }
  }
  
  return cards;
});

// Methods
const handleQueueClick = () => {
  if (queueStore.isInQueue) {
    // Leave queue
    emit('queue-action', 'leave');
  } else {
    // Join queue
    emit('queue-action', 'join');
  }
};
</script>

<template>
    <section class="queue-section">
        <!-- Player Cards -->
        <div class="player-cards">
            <div 
                v-for="(card, index) in playerCards" 
                :key="index" 
                class="player-card" 
                :class="[card.glowClass, { 'wip-card': card.isWIP }]"
            >
                <div class="player-avatar">
                    <img :src="card.avatar" alt="Player Avatar" class="avatar-image" />
                </div>
                <span v-if="card.isUser" class="player-name">{{ card.name }}</span>
                <span v-else class="player-name-wip">W.I.P</span>
                <div class="player-info">
                    <span class="rank-text">No rank</span>
                </div>
            </div>
        </div>

        <!-- Settings Row -->
        <div class="settings-row">
            <div class="setting-item">
                <span class="setting-label">Region</span>
                <span class="setting-value">Europe</span>
            </div>

            <div class="setting-item">
                <span class="setting-label">Game Mode</span>
                <span class="setting-value">5v5</span>
            </div>

            <div class="setting-item">
                <span class="setting-label">Settings</span>
                <span class="setting-value">
                    <span class="info-icon-wrapper">
                        <span class="info-icon">ⓘ</span>
                        <div class="info-tooltip">
                            <div class="tooltip-row">
                                <span class="tooltip-label">Friendly fire</span>
                                <span class="tooltip-value">Enabled</span>
                            </div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">OT</span>
                                <span class="tooltip-value">MR6 ∞</span>
                            </div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">OT Start $</span>
                                <span class="tooltip-value">$12,500</span>
                            </div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">Timeouts (tac)</span>
                                <span class="tooltip-value">3 × 30 sec</span>
                            </div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">Timeouts (tech)</span>
                                <span class="tooltip-value">2 × 90 sec</span>
                            </div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">Snap Tap / SOCD</span>
                                <span class="tooltip-value">Not allowed</span>
                            </div>
                        </div>
                    </span>
                    Romish Customs
                </span>
            </div>
        </div>

        <!-- Queue Button / Timer Container -->
        <div class="queue-button-container">
            <!-- Queue Timer (shown when in queue) -->
            <div v-if="queueStore.isInQueue && queueStore.playerCount > 0" class="queue-timer-container">
                <div class="queue-timer">
                    <div class="timer-content">
                        <div class="timer-display">{{ formattedTime }}</div>
                    </div>
                    <button class="cancel-queue-btn" @click="handleQueueClick" title="Leave Queue">
                        <span class="cancel-icon">✕</span>
                    </button>
                </div>
            </div>

            <!-- Queue Button (shown when not in queue) -->
            <button 
                v-else
                class="glow-button queue-button" 
                @click="handleQueueClick"
            >
                {{ queueStore.isInQueue ? 'LEAVE' : 'JOIN' }}
            </button>

                        <!-- Queue Status -->
                        <p class="queue-status">{{ queueStatusText }}</p>

                        <!-- Queue Progress (tests expect an element with .progress or .queue-progress) -->
                                    <div class="queue-progress" aria-hidden="true">
                                        <div
                                            class="queue-progress-bar"
                                            :style="{ width: Math.min(100, Math.round((queueStore.playerCount / queueStore.requiredPlayers) * 100)) + '%' }"
                                        ></div>
                                    </div>
        </div>
    </section>
</template>

<style scoped>
.queue-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    padding: 2rem;
    width: 100%;
    max-width: 1400px;
}

/* Player Cards */
.player-cards {
    display: flex;
    gap: 2rem;
    justify-content: center;
    flex-wrap: wrap;
    width: 100%;
}

.player-card {
    width: 240px;
    height: 400px;
    background: rgba(17, 24, 39, 0.6);
    backdrop-filter: blur(10px);
    border: 2px solid;
    border-radius: 16px;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    transition: all 0.3s ease;
    cursor: pointer;
}

.player-card.cyan-glow {
    border-color: var(--star-cyan);
    box-shadow: var(--cyan-glow);
}

.player-card.magenta-glow {
    border-color: var(--aurora-pink);
    box-shadow: var(--magenta-glow-shadow);
}

.player-card:hover {
    transform: translateY(-8px) scale(1.03);
}

.player-card.cyan-glow:hover {
    box-shadow: var(--cyan-glow-hover);
}

.player-card.magenta-glow:hover {
    box-shadow: var(--magenta-glow-hover);
}

/* W.I.P Cards - Greyed out */
.player-card.wip-card {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
}

.player-card.wip-card .player-avatar {
    filter: grayscale(100%);
}

.player-card.wip-card:hover {
    transform: none;
    box-shadow: var(--cyan-glow);
}

.player-avatar {
    width: 160px;
    height: 160px;
    background: rgba(248, 250, 252, 0.1);
    border-radius: 50%;
    flex-shrink: 0;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.player-name {
    color: var(--white-nova);
    font-weight: 600;
    font-size: 1rem;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    text-align: center;
    width: 100%;
}

.player-name-wip {
    color: var(--void-gray);
    font-weight: 700;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-family: 'Orbitron', sans-serif;
}

.player-info {
    width: 100%;
    height: 50px;
    background: rgba(248, 250, 252, 0.9);
    border-radius: 50px;
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 1rem;
}

.rank-text {
    color: var(--cosmic-black);
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.wip-text {
    color: var(--void-gray);
    font-weight: 700;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-family: 'Orbitron', sans-serif;
}

.player-card:not(.has-player) .player-avatar {
    opacity: 0.3;
}

/* Settings Row */
.settings-row {
    display: flex;
    gap: 3rem;
    align-items: center;
    padding: 1rem 2rem;
    background: rgba(11, 15, 26, 0.4);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(75, 207, 250, 0.15);
    border-radius: 12px;
}

.setting-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: center;
}

.setting-label {
    font-size: 0.75rem;
    color: var(--star-cyan);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
}

.setting-value {
    font-size: 1rem;
    color: var(--white-nova);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.info-icon-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
}

.info-icon {
    color: var(--white-nova);
    font-weight: bold;
    font-size: 1.1rem;
    transition: all 0.3s ease;
}

.info-icon-wrapper:hover .info-icon {
    color: var(--star-cyan);
    transform: scale(1.1);
}

/* Tooltip */
.info-tooltip {
    position: absolute;
    bottom: calc(100% + 0.75rem);
    left: 50%;
    transform: translateX(-50%);
    min-width: 280px;
    background: rgba(17, 24, 39, 0.98);
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(75, 207, 250, 0.5);
    border-radius: 12px;
    padding: 1rem;
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s ease;
    z-index: 1000;
    box-shadow: 0 0 20px rgba(75, 207, 250, 0.3), 0 10px 40px rgba(0, 0, 0, 0.8);
}

.info-icon-wrapper:hover .info-tooltip {
    opacity: 1;
    pointer-events: all;
}

/* Tooltip Arrow */
.info-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 8px solid transparent;
    border-top-color: rgba(75, 207, 250, 0.5);
}

.tooltip-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    gap: 1rem;
}

.tooltip-row:not(:last-child) {
    border-bottom: 1px solid rgba(75, 207, 250, 0.15);
}

.tooltip-label {
    font-size: 0.875rem;
    color: rgba(248, 250, 252, 0.7);
    font-weight: 500;
}

.tooltip-value {
    font-size: 0.875rem;
    color: var(--white-nova);
    font-weight: 600;
    text-align: right;
}

/* Queue Button */
.queue-button-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0;
}

/* Button Group */
.button-group {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.queue-button {
    min-width: 200px;
}

/* Test Button */
.test-button {
    background: rgba(17, 24, 39, 0.8);
    border: 2px solid var(--star-cyan);
    border-radius: 50px;
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
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.test-button:hover {
    background: var(--star-cyan);
    color: var(--cosmic-black);
    box-shadow: var(--cyan-glow-hover);
    transform: translateY(-2px) scale(1.05);
}

.test-icon {
    font-size: 1.25rem;
}

/* Queue Timer */
.queue-timer-container {
    width: 100%;
    max-width: 400px;
}

.queue-timer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.5rem 2rem;
    background: rgba(17, 24, 39, 0.8);
    border: 2px solid var(--star-cyan);
    border-radius: 16px;
    box-shadow: var(--cyan-glow);
    animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
    0%, 100% {
        box-shadow: var(--cyan-glow);
    }
    50% {
        box-shadow: var(--cyan-glow-hover);
    }
}

.timer-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
}

.timer-label {
    font-size: 0.75rem;
    color: var(--star-cyan);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
}

.timer-display {
    font-family: 'Orbitron', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--white-nova);
    letter-spacing: 0.05em;
}

.timer-sublabel {
    font-size: 0.875rem;
    color: rgba(248, 250, 252, 0.7);
    font-weight: 500;
}

.cancel-queue-btn {
    width: 48px;
    height: 48px;
    background: transparent;
    border: 2px solid var(--aurora-pink);
    border-radius: 12px;
    color: var(--aurora-pink);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.cancel-queue-btn:hover {
    background: var(--aurora-pink);
    color: var(--cosmic-black);
    box-shadow: var(--magenta-glow-shadow);
    transform: scale(1.1) rotate(90deg);
}

.cancel-icon {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
}

.queue-status {
    font-size: 0.875rem;
    color: var(--white-nova);
    opacity: 0.7;
    border-top: 1px dotted rgba(75, 207, 250, 0.3);
    padding-top: 1rem;
    width: 100%;
    text-align: center;
}

/* Responsive */
@media (max-width: 1200px) {
    .player-cards {
        gap: 1.5rem;
    }

    .player-card {
        width: 180px;
        height: 330px;
    }

    .player-avatar {
        width: 120px;
        height: 120px;
    }
}

@media (max-width: 768px) {
    .player-cards {
        gap: 1rem;
    }

    .player-card {
        width: 150px;
        height: 280px;
    }

    .player-avatar {
        width: 100px;
        height: 100px;
    }

    .settings-row {
        flex-direction: column;
        gap: 1rem;
    }

    .queue-timer {
        padding: 1.25rem 1.5rem;
    }

    .timer-display {
        font-size: 1.75rem;
    }

    .cancel-queue-btn {
        width: 40px;
        height: 40px;
    }
}
</style>

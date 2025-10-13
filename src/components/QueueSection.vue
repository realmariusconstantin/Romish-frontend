<script setup>
import userAvatar from '@/images/user.png'
</script>

<template>
    <section class="queue-section">
        <!-- Player Cards -->
        <div class="player-cards">
            <div v-for="(card, index) in playerCards" :key="index" class="player-card" :class="card.glowClass">
                <div class="player-avatar">
                    <img :src="userAvatar" alt="Player Avatar" class="avatar-image" />
                </div>
                <div class="player-info"></div>
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

        <!-- Queue Button / Timer -->
        <div class="queue-button-container">
            <!-- Queue Button (shown when not in queue) -->
            <div v-if="!queueState.isQueuing" class="button-group">
                <button 
                    class="glow-button queue-button" 
                    @click="startQueue"
                >
                    Queue
                </button>
                <button 
                    class="test-button" 
                    @click="goToBanPhase"
                    title="Test Ban Phase"
                >
                    <span class="test-icon">🧪</span>
                    Ban Phase
                </button>
            </div>

            <!-- Queue Timer (shown when in queue) -->
            <div v-else class="queue-timer-container">
                <div class="queue-timer">
                    <div class="timer-content">
                        <span class="timer-label">In Queue</span>
                        <span class="timer-display">{{ formattedTime }}</span>
                        <span class="timer-sublabel">{{ queueState.playersInQueue }} players searching</span>
                    </div>
                    <button class="cancel-queue-btn" @click="cancelQueue" title="Leave Queue">
                        <span class="cancel-icon">✕</span>
                    </button>
                </div>
            </div>

            <!-- Queue Status -->
            <p class="queue-status">{{ queueStatusText }}</p>
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
}

/* Player Cards */
.player-cards {
    display: flex;
    gap: 2rem;
    justify-content: center;
    flex-wrap: wrap;
}

.player-card {
    width: 200px;
    height: 360px;
    background: rgba(17, 24, 39, 0.6);
    backdrop-filter: blur(10px);
    border: 2px solid;
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
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

.player-avatar {
    width: 140px;
    height: 140px;
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

.player-info {
    width: 100%;
    height: 50px;
    background: rgba(248, 250, 252, 0.9);
    border-radius: 50px;
    margin-top: auto;
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

<script>
export default {
    data() {
        return {
            playerCards: [
                { glowClass: 'cyan-glow' },
                { glowClass: 'cyan-glow' },
                { glowClass: 'magenta-glow' },
                { glowClass: 'cyan-glow' },
                { glowClass: 'cyan-glow' }
            ],
            // Queue State - easily expandable for future features
            queueState: {
                isQueuing: false,
                startTime: null,
                elapsedSeconds: 0,
                playersInQueue: 0,
                estimatedWaitTime: null, // For future: estimated match time
                queueId: null, // For future: server queue ID
                region: 'Europe',
                gameMode: '5v5',
                customSettings: 'Romish Customs'
            },
            queueTimer: null
        }
    },
    computed: {
        // Format elapsed time as MM:SS
        formattedTime() {
            const minutes = Math.floor(this.queueState.elapsedSeconds / 60)
            const seconds = this.queueState.elapsedSeconds % 60
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        },
        // Dynamic queue status text
        queueStatusText() {
            if (this.queueState.isQueuing) {
                return `Searching for match... ${this.queueState.playersInQueue} players in queue`
            }
            return `${this.queueState.playersInQueue} players in queue`
        }
    },
    methods: {
        // Start queueing - can be expanded to send API request
        startQueue() {
            console.log('Starting queue with settings:', {
                region: this.queueState.region,
                gameMode: this.queueState.gameMode,
                settings: this.queueState.customSettings
            })

            this.queueState.isQueuing = true
            this.queueState.startTime = Date.now()
            this.queueState.elapsedSeconds = 0
            this.queueState.playersInQueue = Math.floor(Math.random() * 20) + 5 // Mock data

            // Start timer
            this.queueTimer = setInterval(() => {
                this.queueState.elapsedSeconds++
                
                // Mock: randomly update players in queue
                if (this.queueState.elapsedSeconds % 5 === 0) {
                    this.queueState.playersInQueue = Math.floor(Math.random() * 30) + 5
                }

                // TODO: For future - check for match found via WebSocket/API
                // if (matchFound) { this.onMatchFound() }
            }, 1000)

            // TODO: For future - send queue request to backend
            // this.sendQueueRequest()
        },

        // Cancel queue - can be expanded to send API cancellation
        cancelQueue() {
            console.log('Cancelling queue after', this.formattedTime)

            this.queueState.isQueuing = false
            this.queueState.startTime = null
            this.queueState.elapsedSeconds = 0

            // Clear timer
            if (this.queueTimer) {
                clearInterval(this.queueTimer)
                this.queueTimer = null
            }

            // TODO: For future - send cancel request to backend
            // this.sendCancelRequest(this.queueState.queueId)
        },

        // Navigate to Ban Phase (for testing)
        goToBanPhase() {
            console.log('Navigating to Ban Phase...')
            // Emit event to parent to show ban phase
            this.$emit('show-ban-phase')
            // For future with router: this.$router.push({ name: 'BanPhase' })
        },

        // For future: Handle match found
        onMatchFound(matchData) {
            clearInterval(this.queueTimer)
            console.log('Match found!', matchData)
            // Navigate to match acceptance screen
            // this.$router.push({ name: 'MatchAccept', params: { matchId: matchData.id } })
        },

        // For future: Send queue request to backend
        async sendQueueRequest() {
            // const response = await fetch('/api/queue/join', {
            //     method: 'POST',
            //     body: JSON.stringify({
            //         region: this.queueState.region,
            //         gameMode: this.queueState.gameMode,
            //         settings: this.queueState.customSettings
            //     })
            // })
            // this.queueState.queueId = response.data.queueId
        }
    },
    beforeUnmount() {
        // Clean up timer when component is destroyed
        if (this.queueTimer) {
            clearInterval(this.queueTimer)
        }
    }
}
</script>

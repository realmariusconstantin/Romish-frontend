<script setup></script>

<template>
    <section class="queue-section">
        <!-- Player Cards -->
        <div class="player-cards">
            <div v-for="(card, index) in playerCards" :key="index" class="player-card" :class="card.glowClass">
                <div class="player-avatar"></div>
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
                    <span class="info-icon">ⓘ</span> Romish Customs
                </span>
            </div>
        </div>

        <!-- Queue Button -->
        <div class="queue-button-container">
            <button class="glow-button queue-button">Queue</button>
            <p class="queue-status">0 players in queue</p>
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
    background: rgba(248, 250, 252, 0.9);
    border-radius: 50%;
    flex-shrink: 0;
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

.info-icon {
    color: var(--star-cyan);
    font-weight: bold;
}

/* Queue Button */
.queue-button-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0;
}

.queue-button {
    min-width: 200px;
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
            ]
        }
    }
}
</script>

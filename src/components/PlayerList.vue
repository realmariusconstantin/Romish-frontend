<script setup></script>

<template>
    <!-- Toggle Button -->
    <button class="player-list-toggle" @click="togglePanel" :class="{ active: isOpen }">
        <span class="toggle-icon">{{ isOpen ? '→' : '←' }}</span>
        <span class="toggle-text">Players</span>
        <span class="player-count">{{ players.length }}</span>
    </button>

    <!-- Sliding Panel -->
    <aside class="player-list" :class="{ open: isOpen }">
        <div class="player-list-header">
            <h3 class="player-list-title">Online Players</h3>
            <button class="close-button" @click="togglePanel">✕</button>
        </div>

        <div class="player-list-content">
            <div v-for="(player, index) in players" :key="index" class="player-item">
                <div class="player-avatar-small"></div>
                <div class="player-details">
                    <span class="player-name">Player {{ index + 1 }}</span>
                    <span class="player-status">Online</span>
                </div>
                <button class="add-friend-btn" @click="addFriend(index)">
                    <span class="add-icon">+</span>
                </button>
            </div>
        </div>

        <div class="player-list-footer">
            <button class="invite-all-btn glow-button">Invite All</button>
        </div>
    </aside>

    <!-- Overlay -->
    <div class="overlay" :class="{ visible: isOpen }" @click="togglePanel"></div>
</template>

<style scoped>
/* Toggle Button */
.player-list-toggle {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(17, 24, 39, 0.95);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    border: 2px solid var(--star-cyan);
    border-right: none;
    border-radius: 12px 0 0 12px;
    padding: 1rem 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    box-shadow: var(--cyan-glow);
    transition: all 0.3s ease;
    z-index: 1000;
    writing-mode: vertical-rl;
}

.player-list-toggle:hover {
    background: rgba(17, 24, 39, 1);
    box-shadow: var(--cyan-glow-hover);
    transform: translateY(-50%) translateX(-4px);
}

.player-list-toggle.active {
    opacity: 0;
    pointer-events: none;
}

.toggle-icon {
    font-size: 1.5rem;
    color: var(--star-cyan);
    writing-mode: horizontal-tb;
    transform: rotate(90deg);
}

.toggle-text {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.875rem;
    color: var(--white-nova);
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.player-count {
    background: var(--star-cyan);
    color: var(--cosmic-black);
    font-weight: 700;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 50%;
    min-width: 24px;
    text-align: center;
    writing-mode: horizontal-tb;
}

/* Overlay */
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(11, 15, 26, 0.7);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
    z-index: 999;
}

.overlay.visible {
    opacity: 1;
    pointer-events: all;
}

/* Sliding Panel */
.player-list {
    position: fixed;
    right: -400px;
    top: 0;
    height: 100vh;
    width: 380px;
    display: flex;
    flex-direction: column;
    background: rgba(17, 24, 39, 0.95);
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    border-left: 2px solid var(--star-cyan);
    box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5), var(--cyan-glow);
    transition: right 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    z-index: 1001;
    overflow: hidden;
}

.player-list.open {
    right: 0;
}

/* Panel Header */
.player-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 1.5rem 1rem;
    border-bottom: 1px solid rgba(75, 207, 250, 0.3);
}

.player-list-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.25rem;
    color: var(--star-cyan);
    text-transform: uppercase;
    letter-spacing: 0.1em;
}

.close-button {
    background: transparent;
    border: 1px solid rgba(75, 207, 250, 0.3);
    color: var(--white-nova);
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.close-button:hover {
    background: rgba(75, 207, 250, 0.2);
    border-color: var(--star-cyan);
    box-shadow: var(--cyan-glow);
}

/* Panel Content */
.player-list-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.player-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(11, 15, 26, 0.8);
    border: 1px solid rgba(75, 207, 250, 0.2);
    border-radius: 12px;
    transition: all 0.3s ease;
}

.player-item:hover {
    background: rgba(11, 15, 26, 1);
    border-color: var(--star-cyan);
    box-shadow: var(--subtle-glow);
    transform: translateX(-4px);
}

.player-avatar-small {
    width: 50px;
    height: 50px;
    background: rgba(248, 250, 252, 0.9);
    border-radius: 50%;
    flex-shrink: 0;
    border: 2px solid var(--star-cyan);
}

.player-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex-grow: 1;
}

.player-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--white-nova);
}

.player-status {
    font-size: 0.875rem;
    color: #10b981;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.player-status::before {
    content: '';
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 10px #10b981;
}

/* Add Friend Button */
.add-friend-btn {
    width: 36px;
    height: 36px;
    background: transparent;
    border: 2px solid var(--star-cyan);
    border-radius: 8px;
    color: var(--star-cyan);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.add-friend-btn:hover {
    background: var(--star-cyan);
    color: var(--cosmic-black);
    box-shadow: var(--cyan-glow);
    transform: scale(1.1);
}

.add-icon {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
}

/* Panel Footer */
.player-list-footer {
    padding: 1.5rem;
    border-top: 1px solid rgba(75, 207, 250, 0.3);
}

.invite-all-btn {
    width: 100%;
    padding: 0.875rem;
    font-size: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
    .player-list {
        width: 100%;
        right: -100%;
    }

    .player-list-toggle {
        right: 0;
    }
}

@media (max-width: 480px) {
    .player-list-header {
        padding: 1.5rem 1rem;
    }

    .player-list-content {
        padding: 1rem;
    }

    .player-item {
        padding: 0.75rem;
    }

    .player-avatar-small {
        width: 45px;
        height: 45px;
    }
}
</style>

<script>
export default {
    data() {
        return {
            isOpen: false,
            players: Array(6).fill({ name: 'Player', status: 'Online' })
        }
    },
    methods: {
        togglePanel() {
            this.isOpen = !this.isOpen
        },
        addFriend(index) {
            console.log(`Adding Player ${index + 1} as friend`)
            // Add friend logic here
        }
    }
}
</script>

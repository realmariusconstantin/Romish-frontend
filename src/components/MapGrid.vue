<script setup></script>

<template>
    <section class="map-grid-section">
        <div class="map-grid-header">
            <h2 class="section-title">Maps</h2>
        </div>
        <div class="map-grid">
            <div v-for="(map, index) in maps" :key="index" class="map-card">
                <div class="map-placeholder"></div>
            </div>
        </div>
        <div class="map-counter">532 < 3/8</div>
    </section>
</template>

<style scoped>
.map-grid-section {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.map-grid-header {
    display: flex;
    justify-content: flex-start;
    padding-left: 1rem;
}

.section-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--star-cyan);
    text-transform: uppercase;
    letter-spacing: 0.1em;
}

.map-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
    padding: 1.5rem;
    background: rgba(17, 24, 39, 0.4);
    backdrop-filter: blur(10px);
    border: 2px solid var(--star-cyan);
    border-radius: 16px;
    box-shadow: var(--cyan-glow);
}

.map-card {
    aspect-ratio: 3/4;
    background: rgba(11, 15, 26, 0.8);
    border: 2px solid rgba(75, 207, 250, 0.3);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    cursor: pointer;
    overflow: hidden;
}

.map-card:hover {
    border-color: var(--star-cyan);
    box-shadow: var(--cyan-glow);
    transform: translateY(-4px) scale(1.02);
}

.map-placeholder {
    width: 100%;
    height: 100%;
    background: rgba(127, 90, 240, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
}

.map-counter {
    align-self: flex-end;
    background: var(--star-cyan);
    color: var(--cosmic-black);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 700;
    font-family: 'Orbitron', sans-serif;
    box-shadow: var(--cyan-glow);
}

/* Responsive */
@media (max-width: 1024px) {
    .map-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
    }
}

@media (max-width: 768px) {
    .map-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        padding: 1rem;
    }
}

@media (max-width: 480px) {
    .map-grid {
        grid-template-columns: 1fr;
    }
}
</style>

<script>
export default {
    data() {
        return {
            maps: Array(8).fill(null)
        }
    }
}
</script>

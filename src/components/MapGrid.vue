<script setup>
import { ref } from 'vue';
import dust2Img from '@/images/dust2_normal.jpg';
import mirageImg from '@/images/de_mirage.jpg';
import infernoImg from '@/images/inferno_normal.jpg';
import nukeImg from '@/images/de_nuke.jpg';
import overpassImg from '@/images/de_overpass.jpg';
import vertigoImg from '@/images/de_vertigo.jpg';
import ancientImg from '@/images/de_ancient.jpg';
import cacheImg from '@/images/de_cache.jpg';
import cobblestoneImg from '@/images/cobblestone_normal.jpg';
import anubisImg from '@/images/de_anubis.jpg';
import trainImg from '@/images/de_train.jpg';

const maps = ref([
  { id: 1, name: 'Dust II', image: dust2Img },
  { id: 2, name: 'Mirage', image: mirageImg },
  { id: 3, name: 'Inferno', image: infernoImg },
  { id: 4, name: 'Nuke', image: nukeImg },
  { id: 5, name: 'Overpass', image: overpassImg },
  { id: 6, name: 'Vertigo', image: vertigoImg },
  { id: 7, name: 'Ancient', image: ancientImg },
  { id: 8, name: 'Cache', image: cacheImg },
  { id: 9, name: 'Cobblestone', image: cobblestoneImg },
  { id: 10, name: 'Anubis', image: anubisImg },
  { id: 11, name: 'Train', image: trainImg }
]);
</script>

<template>
    <section class="map-grid-section">
        <div class="map-grid-header">
            <h2 class="section-title">Map Pool</h2>
        </div>
        <div class="map-grid">
            <div v-for="map in maps" :key="map.id" class="map-card">
                <img :src="map.image" :alt="map.name" class="map-image" />
                <div class="map-overlay">
                    <span class="map-name">{{ map.name }}</span>
                </div>
            </div>
        </div>
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
    position: relative;
}

.map-card:hover {
    border-color: var(--star-cyan);
    box-shadow: var(--cyan-glow);
    transform: translateY(-4px) scale(1.02);
}

.map-card:hover .map-image {
    transform: scale(1.1);
    filter: brightness(1.2);
}

.map-card:hover .map-overlay {
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent 50%);
}

.map-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: all 0.4s ease;
    display: block;
}

.map-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 1.5rem;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent 50%);
    transition: all 0.3s ease;
}

.map-name {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--white-nova);
    text-shadow: 0 0 20px rgba(0, 0, 0, 0.9), 0 2px 4px rgba(0, 0, 0, 0.8);
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

    .map-name {
        font-size: 1rem;
    }
}
</style>

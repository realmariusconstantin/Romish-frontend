<script setup>
import { ref, onMounted } from 'vue';

defineProps({
  phase: {
    type: String,
    default: 'provisioning'
  }
});

const progress = ref(0);
const statusText = ref('Preparing your server...');

const progressSteps = [
  { percent: 25, text: 'Preparing Match...' },
  { percent: 50, text: 'Uploading Configuration...' },
  { percent: 75, text: 'Server Starting...' },
  { percent: 100, text: 'Match Ready!' }
];

onMounted(() => {
  let currentStep = 0;
  
  const interval = setInterval(() => {
    if (currentStep < progressSteps.length) {
      progress.value = progressSteps[currentStep].percent;
      statusText.value = progressSteps[currentStep].text;
      currentStep++;
    } else {
      clearInterval(interval);
    }
  }, 1750); // 1.75 seconds per step = 7 seconds total
});
</script>

<template>
  <div class="loading-overlay">
    <div class="loading-container">
      <!-- Animated Logo/Icon -->
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="server-icon">🖥️</div>
      </div>

      <!-- Title -->
      <h2 class="loading-title">PREPARING MATCH</h2>

      <!-- Progress Bar -->
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="progress-percentage">{{ progress }}%</div>
      </div>

      <!-- Status Text -->
      <p class="status-text">{{ statusText }}</p>

      <!-- Sub-text -->
      <p class="sub-text">
        Your match is being prepared...
      </p>
    </div>
  </div>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: linear-gradient(135deg, rgba(10, 15, 25, 0.98), rgba(17, 24, 39, 0.98));
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  max-width: 600px;
  padding: 3rem;
}

/* Animated Spinner */
.loading-spinner {
  position: relative;
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-ring {
  position: absolute;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 2s linear infinite;
}

.spinner-ring:nth-child(1) {
  width: 150px;
  height: 150px;
  border-top-color: var(--star-cyan);
  animation-duration: 2s;
}

.spinner-ring:nth-child(2) {
  width: 120px;
  height: 120px;
  border-right-color: var(--nebula-purple);
  animation-duration: 3s;
  animation-direction: reverse;
}

.spinner-ring:nth-child(3) {
  width: 90px;
  height: 90px;
  border-bottom-color: var(--magenta-glow);
  animation-duration: 4s;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.server-icon {
  font-size: 3rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Title */
.loading-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  background: linear-gradient(135deg, var(--star-cyan), var(--nebula-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

/* Progress Bar */
.progress-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: rgba(17, 24, 39, 0.8);
  border: 2px solid rgba(75, 207, 250, 0.3);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--star-cyan), var(--nebula-purple));
  transition: width 0.5s ease-out;
  box-shadow: 0 0 20px var(--star-cyan);
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-percentage {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--star-cyan);
  text-align: center;
  text-shadow: 0 0 10px var(--star-cyan);
}

/* Status Text */
.status-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--white-nova);
  letter-spacing: 0.05em;
  text-align: center;
  min-height: 2em;
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sub-text {
  font-size: 0.95rem;
  color: rgba(248, 250, 252, 0.6);
  text-align: center;
  line-height: 1.6;
  max-width: 400px;
}

/* Responsive */
@media (max-width: 768px) {
  .loading-container {
    padding: 2rem 1.5rem;
  }

  .loading-spinner {
    width: 120px;
    height: 120px;
  }

  .spinner-ring:nth-child(1) {
    width: 120px;
    height: 120px;
  }

  .spinner-ring:nth-child(2) {
    width: 95px;
    height: 95px;
  }

  .spinner-ring:nth-child(3) {
    width: 70px;
    height: 70px;
  }

  .server-icon {
    font-size: 2.5rem;
  }

  .loading-title {
    font-size: 1.5rem;
  }

  .status-text {
    font-size: 1rem;
  }
}
</style>

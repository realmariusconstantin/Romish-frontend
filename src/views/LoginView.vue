<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

// TODO: Replace with actual Steam OAuth login
const handleSteamLogin = () => {
  console.log('Steam login initiated');
  // Temporary: Skip to home for now
  // router.push('/');
};

const features = [
  {
    icon: '🎮',
    title: '10-Man Matches',
    description: 'Competitive 5v5 CS2 matches with captain draft system'
  },
  {
    icon: '👥',
    title: 'Team Draft',
    description: 'Captains pick their dream team from the player pool'
  },
  {
    icon: '🗺️',
    title: 'Map Veto',
    description: 'Strategic map banning phase for competitive gameplay'
  },
  {
    icon: '📊',
    title: 'Match Stats',
    description: 'Track your performance and climb the leaderboard'
  },
  {
    icon: '⚡',
    title: 'Quick Queue',
    description: 'Fast matchmaking with skill-based player matching'
  },
  {
    icon: '🏆',
    title: 'Competitive Rankings',
    description: 'Prove your skills and earn your place at the top'
  }
];
</script>

<template>
  <div class="login-wrapper">
    <!-- Minimal Navbar -->
    <nav class="login-navbar">
      <div class="navbar-content">
        <h1 class="navbar-title">ROMISH</h1>
        <button class="steam-login-btn" @click="handleSteamLogin">
          <span class="steam-icon">🎮</span>
          <span>SIGN IN WITH STEAM</span>
        </button>
      </div>
    </nav>

    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">COMPETITIVE CS2 MATCHMAKING</h1>
        <p class="hero-subtitle">
          Experience premium 10-man matches with captain draft, map veto, and skill-based rankings
        </p>
        <button class="cta-button" @click="handleSteamLogin">
          <span class="steam-icon-large">🎮</span>
          <span>GET STARTED WITH STEAM</span>
        </button>
      </div>
      
      <!-- Animated Background Elements -->
      <div class="hero-background">
        <div class="glow-orb glow-orb-1"></div>
        <div class="glow-orb glow-orb-2"></div>
        <div class="glow-orb glow-orb-3"></div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="features-section">
      <h2 class="features-title">FEATURES</h2>
      <div class="features-grid">
        <div v-for="(feature, index) in features" :key="index" class="feature-card">
          <div class="feature-icon">{{ feature.icon }}</div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
        </div>
      </div>
    </div>

    <!-- How It Works Section -->
    <div class="how-it-works-section">
      <h2 class="section-title">HOW IT WORKS</h2>
      <div class="steps-container">
        <div class="step">
          <div class="step-number">1</div>
          <h3 class="step-title">SIGN IN</h3>
          <p class="step-description">Connect your Steam account to get started</p>
        </div>
        <div class="step-arrow">→</div>
        <div class="step">
          <div class="step-number">2</div>
          <h3 class="step-title">QUEUE UP</h3>
          <p class="step-description">Join the matchmaking queue and wait for players</p>
        </div>
        <div class="step-arrow">→</div>
        <div class="step">
          <div class="step-number">3</div>
          <h3 class="step-title">DRAFT & VETO</h3>
          <p class="step-description">Captains pick teams and ban maps</p>
        </div>
        <div class="step-arrow">→</div>
        <div class="step">
          <div class="step-number">4</div>
          <h3 class="step-title">COMPETE</h3>
          <p class="step-description">Connect to server and play competitive CS2</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="login-footer">
      <p class="footer-text">ROMISH © 2025 | Competitive CS2 Matchmaking Platform</p>
      <p class="footer-subtext">Not affiliated with Valve Corporation</p>
    </footer>
  </div>
</template>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  background: var(--cosmic-black);
  position: relative;
  overflow-x: hidden;
}

/* Minimal Navbar */
.login-navbar {
  padding: 1.5rem 0;
  background: rgba(11, 15, 26, 0.8);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(75, 207, 250, 0.2);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  background: var(--starlight-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(75, 207, 250, 0.5);
}

.steam-login-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.75rem;
  background: linear-gradient(135deg, var(--star-cyan), var(--nebula-purple));
  border: 2px solid var(--star-cyan);
  border-radius: 10px;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--white-nova);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(75, 207, 250, 0.4);
}

.steam-login-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 0 40px rgba(75, 207, 250, 0.7), 0 5px 20px rgba(0, 0, 0, 0.5);
}

.steam-icon {
  font-size: 1.25rem;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.8));
}

/* Hero Section */
.hero-section {
  position: relative;
  min-height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 900px;
  text-align: center;
}

.hero-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 4rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  background: var(--starlight-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
  animation: fadeInUp 1s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  color: rgba(248, 250, 252, 0.8);
  line-height: 1.8;
  margin-bottom: 3rem;
  animation: fadeInUp 1s ease-out 0.2s backwards;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 3rem;
  background: linear-gradient(135deg, var(--nebula-purple), var(--magenta-glow));
  border: 3px solid var(--nebula-purple);
  border-radius: 12px;
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: var(--white-nova);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 30px rgba(147, 51, 234, 0.5);
  animation: fadeInUp 1s ease-out 0.4s backwards, pulse 2s ease-in-out 2s infinite;
}

.cta-button:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 0 60px rgba(147, 51, 234, 0.8), 0 10px 30px rgba(0, 0, 0, 0.6);
}

.steam-icon-large {
  font-size: 1.75rem;
  filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.9));
}

/* Animated Background */
.hero-background {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: float 8s ease-in-out infinite;
}

.glow-orb-1 {
  width: 400px;
  height: 400px;
  background: var(--star-cyan);
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.glow-orb-2 {
  width: 500px;
  height: 500px;
  background: var(--nebula-purple);
  bottom: 10%;
  right: 10%;
  animation-delay: 2s;
  animation-duration: 10s;
}

.glow-orb-3 {
  width: 300px;
  height: 300px;
  background: var(--magenta-glow);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 4s;
  animation-duration: 12s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  25% {
    transform: translateY(-30px) translateX(20px);
  }
  50% {
    transform: translateY(-60px) translateX(-20px);
  }
  75% {
    transform: translateY(-30px) translateX(20px);
  }
}

/* Features Section */
.features-section {
  padding: 6rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.features-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-align: center;
  background: var(--starlight-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: rgba(11, 15, 26, 0.8);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(75, 207, 250, 0.3);
  border-radius: 16px;
  padding: 2.5rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: default;
}

.feature-card:hover {
  border-color: var(--star-cyan);
  box-shadow: 0 0 30px rgba(75, 207, 250, 0.4);
  transform: translateY(-8px);
}

.feature-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 0 20px var(--star-cyan));
}

.feature-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--star-cyan);
  margin-bottom: 1rem;
  text-transform: uppercase;
}

.feature-description {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: rgba(248, 250, 252, 0.7);
  line-height: 1.6;
}

/* How It Works Section */
.how-it-works-section {
  padding: 6rem 2rem;
  background: rgba(17, 24, 39, 0.4);
  border-top: 1px solid rgba(75, 207, 250, 0.2);
  border-bottom: 1px solid rgba(75, 207, 250, 0.2);
}

.section-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-align: center;
  background: var(--starlight-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4rem;
}

.steps-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.step {
  flex: 1;
  min-width: 200px;
  max-width: 250px;
  text-align: center;
}

.step-number {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--star-cyan), var(--nebula-purple));
  border: 3px solid var(--star-cyan);
  border-radius: 50%;
  font-family: 'Orbitron', sans-serif;
  font-size: 2rem;
  font-weight: 900;
  color: var(--white-nova);
  box-shadow: 0 0 30px rgba(75, 207, 250, 0.5);
}

.step-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--star-cyan);
  margin-bottom: 0.75rem;
}

.step-description {
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: rgba(248, 250, 252, 0.7);
  line-height: 1.5;
}

.step-arrow {
  font-size: 3rem;
  color: var(--star-cyan);
  font-weight: 300;
  flex-shrink: 0;
}

/* Footer */
.login-footer {
  padding: 3rem 2rem;
  text-align: center;
  background: rgba(11, 15, 26, 0.6);
  border-top: 1px solid rgba(75, 207, 250, 0.2);
}

.footer-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--star-cyan);
  margin-bottom: 0.5rem;
}

.footer-subtext {
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: rgba(248, 250, 252, 0.5);
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-title {
    font-size: 3rem;
  }

  .hero-subtitle {
    font-size: 1.25rem;
  }

  .steps-container {
    flex-direction: column;
  }

  .step-arrow {
    transform: rotate(90deg);
  }
}

@media (max-width: 768px) {
  .navbar-title {
    font-size: 1.5rem;
  }

  .steam-login-btn {
    padding: 0.75rem 1.25rem;
    font-size: 0.8rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .cta-button {
    padding: 1.25rem 2rem;
    font-size: 0.95rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .navbar-title {
    font-size: 1.25rem;
  }

  .steam-login-btn span:not(.steam-icon) {
    display: none;
  }

  .hero-title {
    font-size: 1.5rem;
  }

  .cta-button span:not(.steam-icon-large) {
    font-size: 0.85rem;
  }
}
</style>

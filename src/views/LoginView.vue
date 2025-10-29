<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const error = ref(null);
const loading = ref(false);

const handleSteamLogin = () => {
  loading.value = true;
  error.value = null;
  const steamAuthUrl = 'http://localhost:5000/api/auth/steam';
  window.location.href = steamAuthUrl;
};

onMounted(async () => {
  const errorParam = route.query.error;
  const successParam = route.query.login;
  const tokenParam = route.query.token;
  
  console.log('LoginView mounted with query params:', { errorParam, successParam, tokenParam });
  
  if (errorParam) {
    switch(errorParam) {
      case 'steam_auth_failed':
        error.value = 'Steam authentication failed. Please try again.';
        break;
      case 'invalid_steam_id':
        error.value = 'Could not retrieve your Steam ID. Please try again.';
        break;
      case 'steam_api_failed':
        error.value = 'Failed to fetch Steam profile. Please try again.';
        break;
      case 'server_error':
        error.value = 'Server error during login. Please try again.';
        break;
      default:
        error.value = 'An error occurred during login. Please try again.';
    }
    console.log('Error detected:', error.value);
  }
  
  if (successParam === 'success' && tokenParam) {
    console.log('Success param detected with token, setting auth...');
    // Store the token from Steam OAuth redirect
    authStore.setAccessToken(tokenParam);
    
    // Verify token and get user info
    try {
      console.log('Calling verify()...');
      const result = await authStore.verify();
      console.log('Verify result:', result);
      if (result.success) {
        // Successfully logged in - redirect to home
        console.log('Redirecting to home...');
        router.push('/');
      } else {
        error.value = 'Failed to verify login. Please try again.';
        console.log('Verify failed:', result);
      }
    } catch (err) {
      error.value = 'Error verifying login. Please try again.';
      console.error('Verify error:', err);
    }
  } else if (successParam === 'success') {
    console.log('Success param detected but NO token - might be legacy redirect');
  }
});
</script>

<template>
  <div class="login-wrapper">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="main-title">ROMISH</h1>
        <p class="subtitle">COMPETITIVE CS2 MATCHMAKING</p>
        
        <div v-if="error" class="error-message">
          <span class="error-icon">⚠️</span>
          <span>{{ error }}</span>
        </div>
        
        <button class="steam-button" @click="handleSteamLogin" :disabled="loading">
          <img 
            v-if="!loading"
            src="https://community.akamai.steamstatic.com/public/images/signinthroughsteam/sits_01.png" 
            alt="Sign in through Steam"
            class="steam-signin-img"
          />
          <span v-else class="loading-text">CONNECTING TO STEAM...</span>
        </button>
        
        <p class="steam-info">
          Sign in with your Steam account to access competitive matchmaking
        </p>
      </div>
      
      <div class="hero-background">
        <div class="glow-orb glow-orb-1"></div>
        <div class="glow-orb glow-orb-2"></div>
        <div class="glow-orb glow-orb-3"></div>
      </div>
    </div>

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
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.hero-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  position: relative;
  z-index: 10;
}

.hero-content {
  text-align: center;
  z-index: 10;
  max-width: 800px;
  animation: fadeInUp 1s ease-out;
}

.main-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 8rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  background: var(--starlight-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 80px rgba(75, 207, 250, 0.6);
  margin-bottom: 1rem;
  animation: fadeInUp 1s ease-out, glow 3s ease-in-out infinite;
}

.subtitle {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: rgba(248, 250, 252, 0.8);
  margin-bottom: 3rem;
  animation: fadeInUp 1s ease-out 0.2s backwards;
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.5);
  border-radius: 10px;
  color: #fca5a5;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  margin-bottom: 2rem;
  animation: shake 0.5s ease-in-out;
}

.error-icon {
  font-size: 1.25rem;
}

.steam-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeInUp 1s ease-out 0.4s backwards;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 0 20px rgba(147, 51, 234, 0.4));
}

.steam-button:hover:not(:disabled) {
  transform: translateY(-5px) scale(1.05);
  filter: drop-shadow(0 0 40px rgba(147, 51, 234, 0.8));
}

.steam-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(50%);
}

.steam-signin-img {
  height: 70px;
  width: auto;
  transition: all 0.3s ease;
}

.loading-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: var(--star-cyan);
  padding: 1.5rem 3rem;
  background: rgba(11, 15, 26, 0.8);
  border: 2px solid var(--star-cyan);
  border-radius: 10px;
  box-shadow: 0 0 30px rgba(75, 207, 250, 0.5);
  animation: pulse 1.5s ease-in-out infinite;
}

.steam-info {
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: rgba(248, 250, 252, 0.6);
  animation: fadeInUp 1s ease-out 0.6s backwards;
}

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

.login-footer {
  padding: 2rem;
  text-align: center;
  background: rgba(11, 15, 26, 0.8);
  border-top: 1px solid rgba(75, 207, 250, 0.2);
  z-index: 10;
}

.footer-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  color: rgba(248, 250, 252, 0.8);
  margin-bottom: 0.5rem;
}

.footer-subtext {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: rgba(248, 250, 252, 0.5);
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes glow {
  0%, 100% { text-shadow: 0 0 80px rgba(75, 207, 250, 0.6); }
  50% { text-shadow: 0 0 120px rgba(75, 207, 250, 0.9); }
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 30px rgba(147, 51, 234, 0.5); }
  50% { box-shadow: 0 0 50px rgba(147, 51, 234, 0.8); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

@keyframes float {
  0%, 100% { transform: translateY(0) translateX(0); }
  25% { transform: translateY(-30px) translateX(20px); }
  50% { transform: translateY(-60px) translateX(-20px); }
  75% { transform: translateY(-30px) translateX(20px); }
}

@media (max-width: 1024px) {
  .main-title { font-size: 6rem; }
}

@media (max-width: 768px) {
  .main-title { font-size: 4rem; letter-spacing: 0.15em; }
  .subtitle { font-size: 1.2rem; }
  .steam-button { padding: 1.25rem 2.5rem; font-size: 1rem; }
}

@media (max-width: 480px) {
  .main-title { font-size: 3rem; }
  .subtitle { font-size: 1rem; }
  .steam-button { padding: 1rem 2rem; font-size: 0.9rem; gap: 0.75rem; }
  .steam-icon { font-size: 1.5rem; }
}
</style>

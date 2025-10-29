<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import Navbar from '@/components/Navbar.vue';

const userStore = useUserStore();
const authStore = useAuthStore();

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = authStore.accessToken;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};
const isEditing = ref(false);
const editedName = ref('');
const selectedFile = ref(null);
const previewUrl = ref('');
const saving = ref(false);
const saveMessage = ref('');

const user = computed(() => userStore.user);

onMounted(() => {
  if (user.value) {
    editedName.value = user.value.name;
  }
});

const startEditing = () => {
  editedName.value = user.value.name;
  selectedFile.value = null;
  previewUrl.value = '';
  isEditing.value = true;
  saveMessage.value = '';
};

const cancelEditing = () => {
  isEditing.value = false;
  editedName.value = user.value.name;
  selectedFile.value = null;
  previewUrl.value = '';
  saveMessage.value = '';
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      saveMessage.value = 'Please select a valid image file (JPEG, PNG, GIF, or WebP)';
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      saveMessage.value = 'File size must be less than 5MB';
      return;
    }
    
    selectedFile.value = file;
    saveMessage.value = '';
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const saveProfile = async () => {
  saving.value = true;
  saveMessage.value = '';
  
  try {
    // Update name first if changed
    if (editedName.value !== user.value.name) {
      const nameSuccess = await userStore.updateProfile({
        name: editedName.value,
      });
      
      if (!nameSuccess) {
        saveMessage.value = 'Failed to update name';
        saving.value = false;
        return;
      }
    }
    
    // Upload avatar if file selected
    if (selectedFile.value) {
      const formData = new FormData();
      formData.append('avatar', selectedFile.value);
      
      const response = await fetch('http://localhost:5000/api/auth/upload-avatar', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        saveMessage.value = error.error || 'Failed to upload avatar';
        saving.value = false;
        return;
      }
      
      const data = await response.json();
      // Update user store with new avatar
      userStore.user.avatar = data.avatar;
    }
    
    isEditing.value = false;
    saveMessage.value = 'Profile updated successfully!';
    setTimeout(() => {
      saveMessage.value = '';
    }, 3000);
  } catch (error) {
    console.error('Save profile error:', error);
    saveMessage.value = 'Failed to update profile. Please try again.';
  }
  
  saving.value = false;
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const winRate = computed(() => {
  if (!user.value?.stats) return 0;
  const total = user.value.stats.matchesPlayed;
  if (total === 0) return 0;
  return ((user.value.stats.wins / total) * 100).toFixed(1);
});
</script>

<template>
  <div class="profile-view">
    <Navbar />
    
    <div class="profile-container">
      <div class="profile-header">
        <h1 class="page-title">PLAYER PROFILE</h1>
      </div>
      
      <div class="profile-content" v-if="user">
        <!-- Profile Card -->
        <div class="profile-card">
          <div class="profile-avatar-large">
            <img :src="user.avatar" alt="Profile Avatar" class="avatar-img" />
          </div>
          
          <div class="profile-info">
            <div class="info-row" v-if="!isEditing">
              <h2 class="profile-name-large">{{ user.name }}</h2>
              <button class="edit-btn" @click="startEditing">✏️ Edit Profile</button>
            </div>
            
            <!-- Success/Error Message -->
            <div v-if="saveMessage" :class="['save-message', saveMessage.includes('success') ? 'success' : 'error']">
              {{ saveMessage }}
            </div>
            
            <!-- Edit Mode -->
            <div class="edit-form" v-if="isEditing">
              <div class="form-group">
                <label>Display Name</label>
                <input 
                  v-model="editedName" 
                  type="text" 
                  class="form-input"
                  placeholder="Enter your name"
                  maxlength="32"
                />
              </div>
              
              <div class="form-group">
                <label>Avatar Image</label>
                <div class="file-upload-container">
                  <input 
                    type="file" 
                    id="avatar-upload"
                    class="file-input"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    @change="handleFileSelect"
                  />
                  <label for="avatar-upload" class="file-upload-label">
                    <span class="upload-icon">📁</span>
                    <span class="upload-text">
                      {{ selectedFile ? selectedFile.name : 'Choose an image file' }}
                    </span>
                  </label>
                  <p class="file-hint">Max 5MB • JPEG, PNG, GIF, or WebP</p>
                </div>
                <div class="avatar-preview" v-if="previewUrl">
                  <img :src="previewUrl" alt="Preview" />
                  <p class="preview-label">Preview</p>
                </div>
              </div>
              
              <div class="form-actions">
                <button class="save-btn" @click="saveProfile" :disabled="saving">
                  {{ saving ? 'Saving...' : 'Save Changes' }}
                </button>
                <button class="cancel-btn" @click="cancelEditing">Cancel</button>
              </div>
            </div>
            
            <div class="profile-meta">
              <div class="meta-item">
                <span class="meta-label">Steam ID</span>
                <span class="meta-value">{{ user.steamId }}</span>
              </div>
              
              <div class="meta-item">
                <span class="meta-label">Profile URL</span>
                <a :href="user.profileUrl" target="_blank" class="meta-link">
                  View Steam Profile →
                </a>
              </div>
              
              <div class="meta-item">
                <span class="meta-label">Member Since</span>
                <span class="meta-value">{{ formatDate(user.createdAt) }}</span>
              </div>
              
              <div class="meta-item">
                <span class="meta-label">Discord Verified</span>
                <span :class="['verification-badge', user.isDiscordVerified ? 'verified' : 'unverified']">
                  {{ user.isDiscordVerified ? '✓ Verified' : '✗ Not Verified' }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🎮</div>
            <div class="stat-value">{{ user.stats?.matchesPlayed || 0 }}</div>
            <div class="stat-label">Matches Played</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-value">{{ user.stats?.wins || 0 }}</div>
            <div class="stat-label">Wins</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">💔</div>
            <div class="stat-value">{{ user.stats?.losses || 0 }}</div>
            <div class="stat-label">Losses</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-value">{{ winRate }}%</div>
            <div class="stat-label">Win Rate</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-value">{{ user.stats?.rating || 1000 }}</div>
            <div class="stat-label">Rating</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">{{ user.trustScore || 100 }}</div>
            <div class="stat-label">Trust Score</div>
          </div>
        </div>
        
        <!-- CS2 Stats Section -->
        <div class="cs2-stats-section">
          <h3 class="section-title">CS2 STATISTICS</h3>
          <div class="coming-soon">
            <span class="coming-soon-icon">🚧</span>
            <p>CS2 Rank and Hours tracking coming soon!</p>
            <p class="coming-soon-desc">We're working on integrating live CS2 stats from your Steam profile.</p>
          </div>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-else class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
  min-height: 100vh;
  background: var(--cosmic-black);
}

.profile-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.profile-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  background: var(--starlight-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 60px rgba(75, 207, 250, 0.6);
  animation: glow 3s ease-in-out infinite;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Profile Card */
.profile-card {
  background: rgba(17, 24, 39, 0.6);
  border: 2px solid rgba(75, 207, 250, 0.3);
  border-radius: 20px;
  padding: 3rem;
  display: flex;
  gap: 3rem;
  align-items: flex-start;
  box-shadow: var(--cyan-glow);
  transition: all 0.3s ease;
}

.profile-card:hover {
  border-color: var(--star-cyan);
  box-shadow: var(--cyan-glow-hover);
}

.profile-avatar-large {
  width: 200px;
  height: 200px;
  border-radius: 20px;
  overflow: hidden;
  border: 4px solid var(--star-cyan);
  box-shadow: 0 0 30px rgba(75, 207, 250, 0.5);
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info {
  flex: 1;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.profile-name-large {
  font-family: 'Orbitron', sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: var(--white-nova);
  text-shadow: 0 0 20px rgba(75, 207, 250, 0.5);
}

.edit-btn {
  padding: 0.75rem 1.5rem;
  background: var(--nebula-purple);
  border: 2px solid var(--nebula-purple);
  border-radius: 10px;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--white-nova);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(147, 51, 234, 0.4);
}

.edit-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 30px rgba(147, 51, 234, 0.7);
}

/* Save Message */
.save-message {
  padding: 1rem;
  border-radius: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  margin-bottom: 1rem;
  animation: slideIn 0.3s ease-out;
}

.save-message.success {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 2px solid #22c55e;
}

.save-message.error {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 2px solid #ef4444;
}

/* Edit Form */
.edit-form {
  background: rgba(11, 15, 26, 0.8);
  padding: 2rem;
  border-radius: 15px;
  border: 1px solid rgba(75, 207, 250, 0.2);
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  color: var(--star-cyan);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(17, 24, 39, 0.8);
  border: 2px solid rgba(75, 207, 250, 0.3);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: var(--white-nova);
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--star-cyan);
  box-shadow: 0 0 20px rgba(75, 207, 250, 0.3);
}

/* File Upload */
.file-upload-container {
  width: 100%;
}

.file-input {
  display: none;
}

.file-upload-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(17, 24, 39, 0.8);
  border: 2px dashed rgba(75, 207, 250, 0.4);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-upload-label:hover {
  border-color: var(--star-cyan);
  background: rgba(17, 24, 39, 1);
  box-shadow: 0 0 20px rgba(75, 207, 250, 0.2);
}

.upload-icon {
  font-size: 2rem;
  filter: drop-shadow(0 0 10px var(--star-cyan));
}

.upload-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: var(--white-nova);
  flex: 1;
}

.file-hint {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: rgba(248, 250, 252, 0.5);
  margin-top: 0.5rem;
  margin-bottom: 0;
}

.avatar-preview {
  margin-top: 1rem;
  width: 120px;
  height: 120px;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid var(--star-cyan);
  box-shadow: 0 0 20px rgba(75, 207, 250, 0.3);
  position: relative;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  color: var(--star-cyan);
  text-align: center;
  padding: 0.25rem;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.save-btn, .cancel-btn {
  padding: 0.75rem 2rem;
  border-radius: 10px;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn {
  background: var(--star-cyan);
  border: 2px solid var(--star-cyan);
  color: var(--cosmic-black);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 0 30px rgba(75, 207, 250, 0.7);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: transparent;
  border: 2px solid rgba(248, 250, 252, 0.3);
  color: var(--white-nova);
}

.cancel-btn:hover {
  border-color: rgba(248, 250, 252, 0.6);
}

/* Profile Meta */
.profile-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-label {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  color: rgba(248, 250, 252, 0.6);
  text-transform: uppercase;
}

.meta-value {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: var(--white-nova);
  word-break: break-all;
}

.meta-link {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: var(--star-cyan);
  text-decoration: none;
  transition: all 0.3s ease;
}

.meta-link:hover {
  color: var(--white-nova);
  text-shadow: 0 0 10px var(--star-cyan);
}

.verification-badge {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  display: inline-block;
}

.verification-badge.verified {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 2px solid #22c55e;
}

.verification-badge.unverified {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 2px solid #ef4444;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: rgba(17, 24, 39, 0.6);
  border: 2px solid rgba(75, 207, 250, 0.3);
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: var(--star-cyan);
  transform: translateY(-5px);
  box-shadow: var(--cyan-glow);
}

.stat-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.stat-value {
  font-family: 'Orbitron', sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--star-cyan);
  margin-bottom: 0.5rem;
  text-shadow: 0 0 20px rgba(75, 207, 250, 0.5);
}

.stat-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: rgba(248, 250, 252, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* CS2 Stats Section */
.cs2-stats-section {
  background: rgba(17, 24, 39, 0.6);
  border: 2px solid rgba(75, 207, 250, 0.3);
  border-radius: 20px;
  padding: 3rem;
}

.section-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  color: var(--star-cyan);
  margin-bottom: 2rem;
  text-align: center;
}

.coming-soon {
  text-align: center;
  padding: 3rem;
}

.coming-soon-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.coming-soon p {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.2rem;
  color: var(--white-nova);
  margin-bottom: 0.5rem;
}

.coming-soon-desc {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: rgba(248, 250, 252, 0.6);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 2rem;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(75, 207, 250, 0.2);
  border-top: 4px solid var(--star-cyan);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-state p {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.2rem;
  color: var(--star-cyan);
  letter-spacing: 0.1em;
}

/* Animations */
@keyframes glow {
  0%, 100% { text-shadow: 0 0 60px rgba(75, 207, 250, 0.6); }
  50% { text-shadow: 0 0 100px rgba(75, 207, 250, 0.9); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .profile-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .info-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .profile-meta {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .profile-name-large {
    font-size: 1.8rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .profile-card {
    padding: 2rem 1.5rem;
  }
  
  .profile-avatar-large {
    width: 150px;
    height: 150px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>

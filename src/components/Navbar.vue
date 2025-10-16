<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const isDropdownOpen = ref(false);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (!event.target.closest('.profile-dropdown')) {
    isDropdownOpen.value = false;
  }
};

// Add event listener when component mounts
if (typeof window !== 'undefined') {
  window.addEventListener('click', handleClickOutside);
}

const navItems = [
  { name: 'Maps', path: '/maps' },
  { name: 'Leaderboard', path: '/leaderboard' },
];

const handleLogout = () => {
  userStore.logout();
};

const goToProfile = () => {
  router.push('/profile');
  isDropdownOpen.value = false;
};
</script>

<template>
    <nav class="navbar">
        <div class="navbar-content">
            <!-- Clickable ROMISH logo/title -->
            <router-link to="/" class="navbar-title-link">
                <h1 class="navbar-title">ROMISH</h1>
            </router-link>
            
            <!-- Navigation Tabs -->
            <div class="nav-tabs">
                <router-link
                    v-for="item in navItems"
                    :key="item.path"
                    :to="item.path"
                    class="nav-tab"
                    :class="{ active: route.path === item.path }"
                >
                    {{ item.name }}
                </router-link>
            </div>
            
            <!-- Profile Section -->
            <div class="profile-section">
                <!-- Profile Dropdown -->
                <div class="profile-dropdown" @click="toggleDropdown">
                    <div class="profile-avatar">
                        <img 
                            :src="userStore.user?.avatar || '/default-avatar.png'" 
                            alt="Profile Avatar" 
                            class="profile-avatar-image" 
                        />
                    </div>
                    <span class="profile-name">{{ userStore.user?.name || 'User' }}</span>
                    <span class="dropdown-arrow">▼</span>
                    
                    <!-- Dropdown Menu -->
                    <div class="dropdown-menu" :class="{ open: isDropdownOpen }">
                        <div class="dropdown-item" @click="goToProfile">
                            <span class="dropdown-icon">👤</span>
                            <span>Profile</span>
                        </div>
                        <div class="dropdown-item">
                            <span class="dropdown-icon">⚙️</span>
                            <span>Settings (W.I.P)</span>
                        </div>
                        <div class="dropdown-item">
                            <span class="dropdown-icon">🎮</span>
                            <span>Game Stats (W.I.P)</span>
                        </div>
                        
                        <!-- Admin Panel - Only visible to admins -->
                        <div v-if="userStore.user?.isAdmin" class="dropdown-item admin-item" @click="router.push('/admin')">
                            <span class="dropdown-icon">🛡️</span>
                            <span>Admin Panel</span>
                        </div>
                        
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-item logout" @click="handleLogout">
                            <span class="dropdown-icon">🚪</span>
                            <span>Logout</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </nav>
</template>

<style scoped>
.navbar {
    padding: 1.5rem 0;
    background: rgba(11, 15, 26, 0.8);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(75, 207, 250, 0.2);
    position: sticky;
    top: 0;
    z-index: 1000;
}

.navbar-content {
    max-width: 100%;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 3rem;
}

.navbar-title-link {
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.navbar-title-link:hover {
    transform: scale(1.05);
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
    flex-shrink: 0;
    margin: 0;
}

/* Navigation Tabs */
.nav-tabs {
    display: flex;
    gap: 0.5rem;
    flex: 1;
    justify-content: center;
}

.nav-tab {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(248, 250, 252, 0.6);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.3s ease;
    position: relative;
    border: 2px solid transparent;
}

.nav-tab:hover {
    color: var(--star-cyan);
    background: rgba(75, 207, 250, 0.1);
    border-color: rgba(75, 207, 250, 0.3);
}

.nav-tab.active {
    color: var(--white-nova);
    background: rgba(75, 207, 250, 0.15);
    border-color: var(--star-cyan);
    box-shadow: 0 0 20px rgba(75, 207, 250, 0.3);
}

.nav-tab.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--star-cyan);
    box-shadow: 0 0 10px var(--star-cyan);
}

/* Profile Section */
.profile-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    position: relative;
    z-index: 1001;
}

/* Profile Dropdown */
.profile-dropdown {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    background: rgba(17, 24, 39, 0.6);
    border: 2px solid rgba(75, 207, 250, 0.3);
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 1002;
}

.profile-dropdown:hover {
    border-color: var(--star-cyan);
    box-shadow: var(--cyan-glow);
}

.profile-avatar {
    width: 40px;
    height: 40px;
    background: rgba(127, 90, 240, 0.1);
    border-radius: 50%;
    border: 2px solid var(--star-cyan);
    flex-shrink: 0;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.profile-avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.profile-name {
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--white-nova);
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dropdown-arrow {
    font-size: 0.75rem;
    color: var(--star-cyan);
    transition: transform 0.3s ease;
}

.profile-dropdown:hover .dropdown-arrow {
    transform: translateY(2px);
}

/* Dropdown Menu */
.dropdown-menu {
    position: absolute;
    top: calc(100% + 1rem);
    right: 0;
    min-width: 250px;
    background: rgba(11, 15, 26, 0.98);
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    border: 2px solid var(--star-cyan);
    border-radius: 12px;
    box-shadow: var(--cyan-glow), 0 10px 40px rgba(0, 0, 0, 0.8);
    padding: 0.5rem;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-10px);
    transition: all 0.3s ease;
    z-index: 10000;
}

.dropdown-menu.open {
    opacity: 1;
    pointer-events: all;
    transform: translateY(0);
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    color: var(--white-nova);
    background: transparent;
    border-radius: 8px;
    transition: all 0.3s ease;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    z-index:9999;
}

.dropdown-item:hover {
    background: rgba(75, 207, 250, 0.15);
    border: 1px solid rgba(75, 207, 250, 0.3);
    transform: translateX(4px);
}

.dropdown-item.logout {
    color: var(--aurora-pink);
    font-weight: 600;
}

.dropdown-item.logout:hover {
    background: rgba(255, 102, 196, 0.15);
    border: 1px solid rgba(255, 102, 196, 0.3);
}

.dropdown-icon {
    font-size: 1.25rem;
    width: 24px;
    text-align: center;
}

.dropdown-divider {
    height: 1px;
    background: rgba(75, 207, 250, 0.2);
    margin: 0.5rem 0;
}

.admin-item {
    background: rgba(255, 102, 196, 0.05);
    border-left: 3px solid var(--aurora-pink);
}

.admin-item:hover {
    background: rgba(255, 102, 196, 0.15);
    box-shadow: 0 0 15px rgba(255, 102, 196, 0.3);
}

@media (max-width: 768px) {
    .navbar-title {
        font-size: 1.5rem;
    }

    .profile-section {
        gap: 1rem;
    }

    .profile-avatar {
        width: 35px;
        height: 35px;
    }

    .dropdown-menu {
        min-width: 220px;
    }
}

@media (max-width: 480px) {
    .navbar-title {
        font-size: 1.25rem;
    }

    .profile-section {
        gap: 0.75rem;
    }

    .dropdown-arrow {
        display: none;
    }
}
</style>

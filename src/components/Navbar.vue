<script setup>
import userAvatar from '@/images/user.png'
</script>

<template>
    <nav class="navbar">
        <div class="navbar-content">
            <h1 class="navbar-title">ROMISH</h1>
            
            <!-- Profile Section -->
            <div class="profile-section">
                <!-- Notification Bell -->
                <div class="notification-wrapper">
                    <button class="notification-btn">
                        <span class="bell-icon">🔔</span>
                        <span class="notification-badge">3</span>
                    </button>
                </div>

                <!-- Profile Dropdown -->
                <div class="profile-dropdown" @click="toggleDropdown">
                    <div class="profile-avatar">
                        <img :src="userAvatar" alt="Profile Avatar" class="profile-avatar-image" />
                    </div>
                    <span class="dropdown-arrow">▼</span>
                    
                    <!-- Dropdown Menu -->
                    <div class="dropdown-menu" :class="{ open: isDropdownOpen }">
                        <div class="dropdown-item">
                            <span class="dropdown-icon">👤</span>
                            <span>Profile (W.I.P)</span>
                        </div>
                        <div class="dropdown-item">
                            <span class="dropdown-icon">⚙️</span>
                            <span>Settings (W.I.P)</span>
                        </div>
                        <div class="dropdown-item">
                            <span class="dropdown-icon">🎮</span>
                            <span>Game Stats (W.I.P)</span>
                        </div>
                        <div class="dropdown-item">
                            <span class="dropdown-icon">👥</span>
                            <span>Friends (W.I.P)</span>
                        </div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-item logout">
                            <span class="dropdown-icon">🚪</span>
                            <span>Logout (W.I.P)</span>
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
}

.navbar-content {
    max-width: 100%;
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

/* Profile Section */
.profile-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

/* Notification Bell */
.notification-wrapper {
    position: relative;
}

.notification-btn {
    background: rgba(17, 24, 39, 0.6);
    border: 2px solid rgba(75, 207, 250, 0.3);
    border-radius: 50%;
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.notification-btn:hover {
    border-color: var(--star-cyan);
    box-shadow: var(--cyan-glow);
    transform: scale(1.05);
}

.bell-icon {
    font-size: 1.25rem;
}

.notification-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--aurora-pink);
    color: var(--white-nova);
    font-size: 0.7rem;
    font-weight: 700;
    font-family: 'Orbitron', sans-serif;
    padding: 0.15rem 0.4rem;
    border-radius: 50%;
    min-width: 20px;
    text-align: center;
    box-shadow: 0 0 10px var(--aurora-pink);
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
    z-index: 9999;
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

@media (max-width: 768px) {
    .navbar-title {
        font-size: 1.5rem;
    }

    .profile-section {
        gap: 1rem;
    }

    .notification-btn {
        width: 40px;
        height: 40px;
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

<script>
export default {
    data() {
        return {
            isDropdownOpen: false
        }
    },
    methods: {
        toggleDropdown() {
            this.isDropdownOpen = !this.isDropdownOpen
        }
    },
    mounted() {
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.profile-dropdown')) {
                this.isDropdownOpen = false
            }
        })
    }
}
</script>

<script setup></script>

<template>
    <nav class="navbar">
        <div class="navbar-content">
            <h1 class="navbar-title">ROMISH</h1>
            <div class="navbar-placeholder"></div>
        </div>
    </nav>
</template>

<style scoped>
.navbar {
    padding: 1.5rem 2rem;
    background: rgba(11, 15, 26, 0.8);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(75, 207, 250, 0.2);
}

.navbar-content {
    max-width: 1440px;
    margin: 0 auto;
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

.navbar-placeholder {
    width: 150px;
    height: 40px;
    background: rgba(127, 90, 240, 0.1);
    border: 1px solid rgba(127, 90, 240, 0.3);
    border-radius: 8px;
}

@media (max-width: 768px) {
    .navbar-title {
        font-size: 1.5rem;
    }

    .navbar-placeholder {
        width: 100px;
        height: 35px;
    }
}
</style>

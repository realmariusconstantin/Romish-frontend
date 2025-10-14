import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import Home from '@/views/Home.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/draft',
    name: 'Draft',
    component: () => import('@/views/DraftView.vue')
  },
  {
    path: '/veto',
    name: 'Veto',
    component: () => import('@/views/VetoView.vue')
  },
  {
    path: '/maps',
    name: 'Maps',
    component: () => import('@/views/MapsView.vue')
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: () => import('@/views/LeaderboardView.vue')
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('@/views/StatsView.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/AdminView.vue')
    // TODO: Add route guard to check if user is admin
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;

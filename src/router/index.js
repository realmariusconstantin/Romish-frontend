import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';
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
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/draft',
    name: 'Draft',
    component: () => import('@/views/DraftView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/veto',
    name: 'Veto',
    component: () => import('@/views/VetoView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/maps',
    name: 'Maps',
    component: () => import('@/views/MapsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: () => import('@/views/LeaderboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('@/views/StatsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard to check authentication
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  if (requiresAuth) {
    // Fetch user if not already loaded
    if (!userStore.user) {
      const isAuthenticated = await userStore.fetchUser();
      
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        next({ name: 'Login' });
        return;
      }
    }
    
    // Check admin access
    if (to.meta.requiresAdmin && !userStore.user.isAdmin) {
      next({ name: 'Home' });
      return;
    }
    
    next();
  } else {
    // Non-protected route, allow access
    next();
  }
});

export default router;

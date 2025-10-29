import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useMatchStore } from '@/stores/match';
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
    path: '/draft/:matchId',
    name: 'Draft',
    component: () => import('@/views/DraftView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/veto/:matchId',
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

// Navigation guard to check authentication and match locks
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  const matchStore = useMatchStore();
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
    
    // ============================================
    // MATCH LOCK: Prevent navigation away from active matches
    // EXCEPTION: Admins can access admin panel anytime
    // ============================================
    
    // Fetch current match if we don't have one loaded
    if (!matchStore.match && userStore.user.currentMatch) {
      await matchStore.fetchCurrentMatch();
    }
    
    // Check if user has an active match
    if (matchStore.match && userStore.user.currentMatch) {
      const activeMatchId = matchStore.match.matchId;
      const matchPhase = matchStore.match.phase;
      
      // Phases that lock the user: draft, veto, ready, live
      const lockingPhases = ['draft', 'veto', 'ready', 'live'];
      
      if (lockingPhases.includes(matchPhase)) {
        // ADMIN EXCEPTION: Admins can always access admin panel
        if (userStore.user.isAdmin && to.name === 'Admin') {
          console.log('🔓 Admin override - allowing access to admin panel');
          next();
          return;
        }
        
        // User is in an active match - only allow match-related pages
        const allowedMatchRoutes = ['Draft', 'Veto'];
        
        // If trying to go to a non-match page, redirect to correct match phase
        if (!allowedMatchRoutes.includes(to.name)) {
          console.log(`🔒 Match lock active - Redirecting to ${matchPhase} phase`);
          
          if (matchPhase === 'draft') {
            next({ name: 'Draft', params: { matchId: activeMatchId } });
          } else if (matchPhase === 'veto' || matchPhase === 'ready' || matchPhase === 'live') {
            next({ name: 'Veto', params: { matchId: activeMatchId } });
          } else {
            next();
          }
          return;
        }
        
        // If trying to access a different match, redirect to their own match
        if (to.params.matchId && to.params.matchId !== activeMatchId) {
          console.log(`🔒 Redirecting to your active match: ${activeMatchId}`);
          
          if (matchPhase === 'draft') {
            next({ name: 'Draft', params: { matchId: activeMatchId } });
          } else {
            next({ name: 'Veto', params: { matchId: activeMatchId } });
          }
          return;
        }
      }
    }
    
    // ============================================
    // AUTO-REDIRECT: Send users to their active match
    // ============================================
    
    // If user tries to go to Home but has an active match, redirect to match
    if (to.name === 'Home' && matchStore.match) {
      const matchPhase = matchStore.match.phase;
      const activeMatchId = matchStore.match.matchId;
      
      if (matchPhase === 'draft') {
        console.log('📍 Auto-redirecting to draft phase');
        next({ name: 'Draft', params: { matchId: activeMatchId } });
        return;
      } else if (matchPhase === 'veto' || matchPhase === 'ready' || matchPhase === 'live') {
        console.log('📍 Auto-redirecting to veto/server phase');
        next({ name: 'Veto', params: { matchId: activeMatchId } });
        return;
      }
    }
    
    next();
  } else {
    // Non-protected route, allow access
    next();
  }
});

export default router;

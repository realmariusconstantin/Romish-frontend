import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';
import api from '@/config/axios.interceptor';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Fetch current user from backend
  const fetchUser = async () => {
    // Prevent concurrent fetches
    if (fetchUser._inFlight) {
      console.log('fetchUser: request already in flight - reusing promise');
      return fetchUser._inFlight;
    }

    loading.value = true;
    error.value = null;
    
    // Declare these in outer scope so catch/finally can access them
    let resolveFn, rejectFn;
    try {
      // Mark in-flight
      const p = new Promise((resolve, reject) => { resolveFn = resolve; rejectFn = reject; });
      fetchUser._inFlight = p;

      const authStore = useAuthStore();
      const headers = {
        'Content-Type': 'application/json',
      };

      // Include access token in Authorization header if available
      if (authStore.accessToken) {
        headers['Authorization'] = `Bearer ${authStore.accessToken}`;
        console.log('fetchUser: Using Bearer token from authStore');
      } else {
        console.warn('fetchUser: No access token in authStore!');
      }

  console.log('fetchUser: Calling /api/auth/me with headers:', headers);

      // Use configured axios instance which handles baseURL and credentials
      try {
        // Try the 'me' endpoint first (newer route)
        let resp = await api.get('/api/auth/me');
        console.log('fetchUser: axios /me response data:', resp.data);
        let data = resp.data;
        if (data && (data.success === true || data.user)) {
          user.value = data.user || data;
          console.log('fetchUser: User stored successfully (me):', user.value && user.value.username);
          fetchUser._inFlight = null;
          resolveFn(true);
          return true;
        }

        // If /me didn't return a user, try legacy /user endpoint
        resp = await api.get('/api/auth/user');
        console.log('fetchUser: axios /user response data:', resp.data);
        data = resp.data;
        if (data && (data.success === true || data.user)) {
          user.value = data.user || data;
          console.log('fetchUser: User stored successfully (user):', user.value && user.value.username);
          fetchUser._inFlight = null;
          resolveFn(true);
          return true;
        }

        // Neither endpoint returned a valid user
        fetchUser._inFlight = null;
        user.value = null;
        resolveFn(false);
        return false;
      } catch (axiosErr) {
        console.warn('fetchUser: axios calls failed, falling back to fetch. Error:', axiosErr && axiosErr.message);

        // Try fetch fallback against /me then /user
        try {
          let response = await fetch('http://localhost:5000/api/auth/me', {
            method: 'GET',
            headers,
            credentials: 'include', // Include cookies (for refresh token)
          });

          if (response.ok) {
            const data = await response.json();
            if (data && data.success) {
              user.value = data.user;
              fetchUser._inFlight = null;
              resolveFn(true);
              return true;
            }
          }

          // Try legacy /user
          response = await fetch('http://localhost:5000/api/auth/user', {
            method: 'GET',
            headers,
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            if (data && (data.success === true || data.user)) {
              user.value = data.user || data;
              fetchUser._inFlight = null;
              resolveFn(true);
              return true;
            }
          }
        } catch (err2) {
          console.error('fetchUser fallback fetch failed:', err2);
        }

        fetchUser._inFlight = null;
        user.value = null;
        resolveFn(false);
        return false;
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      error.value = err.message;
      user.value = null;
      if (fetchUser._inFlight) {
        fetchUser._inFlight = null;
        if (typeof rejectFn === 'function') rejectFn(err);
      }
      return false;
    } finally {
      loading.value = false;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Use axios instance to ensure cookies and baseURL are handled
      try {
        await api.post('/api/auth/logout');
      } catch (e) {
        // fallback to fetch
        await fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      }
      
      // Clear auth store state
      const authStore = useAuthStore();
      authStore.reset();
      
      user.value = null;
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      try {
        const resp = await api.put('/api/auth/update-profile', updates);
        user.value = resp.data;
        return true;
      } catch (e) {
        // fallback to fetch
        const response = await fetch('http://localhost:5000/api/auth/update-profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updates),
        });

        if (response.ok) {
          const updatedUser = await response.json();
          user.value = updatedUser;
          return true;
        }
        return false;
      }
    } catch (err) {
      console.error('Update profile failed:', err);
      return false;
    }
  };

  return {
    user,
    loading,
    error,
    fetchUser,
    logout,
    updateProfile,
  };
});

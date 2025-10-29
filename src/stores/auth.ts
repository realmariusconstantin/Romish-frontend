/**
 * Auth Store - Manages authentication state
 * @module stores/auth
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import api from '@/config/axios.interceptor';
import { useUserStore } from './user';

export const useAuthStore = defineStore('auth', () => {
  // State - initialize from localStorage if available
  const accessToken = ref(localStorage.getItem('accessToken') || null);
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
  // isAuthenticated derives from accessToken + user
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);
  const loading = ref(false);
  const error = ref(null);

  // Computed
  const isLoggedIn = computed(() => !!accessToken.value && !!user.value);

  const userId = computed(() => user.value?.userId || null);

  const username = computed(() => user.value?.username || 'Anonymous');

  // Actions
  // Simple sleep helper for retries
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // Retry helper: retries fn() up to attempts on 429 or network errors with exponential backoff
  async function withRetry(fn, attempts = 3, baseDelay = 300) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const status = err?.response?.status;
        // Retry only on 429 (rate limit) or on network errors (no response)
        if (status === 429 || !err.response) {
          const delayMs = baseDelay * Math.pow(2, i);
          console.warn(`Request failed (attempt ${i + 1}/${attempts}). Retrying in ${delayMs}ms...`, err?.message || err);
          await sleep(delayMs);
          continue;
        }
        // Non-retriable error, rethrow
        throw err;
      }
    }
    throw lastErr;
  }
  function setAccessToken(token) {
    accessToken.value = token;
    
    // Persist to localStorage
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  // Backwards-compatible alias expected by some tests
  function setToken(token) {
    return setAccessToken(token);
  }

  function setUser(userData) {
    user.value = userData;
    
    // Persist to localStorage
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  }

  function setLoading(state) {
    loading.value = state;
  }

  function setError(errorMsg) {
    error.value = errorMsg;
  }

  function clearError() {
    error.value = null;
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result
   */
  async function login(email, password) {
    setLoading(true);
    clearError();
    try {
      const attemptFn = async () => {
        const resp = await (api as any).post('/api/auth/login', { email, password }, { withCredentials: true });
        return resp;
      };

      const resp = await withRetry(attemptFn, 3, 400);
      const data = resp?.data;

      if (data && data.success) {
        setAccessToken(data.accessToken);
        setUser(data.user);
        return { success: true, user: data.user };
      }

      const msg = (data && data.error) || 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    } catch (err) {
      const status = err?.response?.status;
      if (status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
        return { success: false, error: 'Rate limited (429)' };
      }

      setError(err?.message || String(err));
      return { success: false, error: err?.message || String(err) };
    } finally {
      setLoading(false);
    }
  }

  /**
   * Refresh access token
   * @returns {Promise<Object>} Refresh result
   */
  async function refreshToken() {
    try {
      const attemptFn = async () => (api as any).post('/api/auth/refresh', {}, { withCredentials: true });
      const resp = await withRetry(attemptFn, 2, 300);
      const data = resp?.data;
      if (data && data.success) {
        setAccessToken(data.accessToken);
        return { success: true };
      }
      throw new Error((data && data.error) || 'Token refresh failed');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 429) {
        // transient rate limit - don't clear auth here; let caller handle retry or graceful fallback
        setError('Rate limited by server (429)');
        return { success: false, error: 'Rate limited (429)' };
      }
      setError(err.message || String(err));
      return { success: false, error: err.message || String(err) };
    }
  }

  /**
   * Verify current auth state
   * Called on app load to refresh cookie window and restore state
   * @returns {Promise<Object>} Verification result
   */
  async function verify() {
    // Prevent concurrent verifies by storing a shared in-flight promise
    if ((verify as any)._inFlight) {
      return (verify as any)._inFlight;
    }

    setLoading(true);

    // Create and store the in-flight promise so concurrent callers reuse it
    (verify as any)._inFlight = (async () => {
      try {
        // If we don't have an access token, try cookie-based refresh first
        if (!accessToken.value) {
          const refreshResult = await refreshToken();
          if (refreshResult.success) {
            // Refresh provided a new token, continue to verify using /auth/me
            // (no-op here; accessToken was set by refreshToken)
          } else {
            // Refresh failed. Do not bail out yet — still attempt /auth/me
            // since the backend may accept cookie-based session verification.
            console.log('Auth verify: refresh failed, attempting /auth/me anyway');
          }
        }

        // Attempt verification with current accessToken or cookie-based session.
        // Tests expect the GET to call '/auth/me' with only withCredentials: true (no extra headers),
        // so call it that way and rely on the server/cookie or access token on the backend.
        const getOptions = {
          withCredentials: true,
        };

        // Prefer using configured axios instance which sets baseURL and interceptors
        // The backend exposes the current user at /api/auth/me
        const resp = await (api as any).get('/api/auth/me', { withCredentials: true });

        const data = resp?.data;
        if (data && data.success) {
          setUser(data.user);
          return { success: true, user: data.user };
        }

        // If verify failed despite refresh, clear auth
        reset();
        return { success: false };
      } catch (err) {
        // Handle throttling (429) and other errors gracefully
        const status = err?.response?.status;
        if (status === 429) {
          // Rate limited - retry a few times before giving up
          console.warn('Verify: server responded with 429 - will retry a couple times before failing');
          // Try a small retry loop
          for (let attempt = 1; attempt <= 2; attempt++) {
            await sleep(200 * attempt);
            try {
              const resp2 = await (api as any).get('/api/auth/me', { withCredentials: true });
              const data2 = resp2?.data;
              if (data2 && data2.success) {
                setUser(data2.user);
                return { success: true, user: data2.user };
              }
            } catch (e2) {
              // continue
            }
          }
          setError('Rate limited by server (429)');
          return undefined;
        }

        setError(err?.message || String(err));
        reset();
        return { success: false, error: err?.message || String(err) };
      }
    })();

    try {
      const result = await (verify as any)._inFlight;
      return result;
    } finally {
      (verify as any)._inFlight = null;
      setLoading(false);
    }
  }

  /**
   * Logout user
   * @returns {Promise<Object>} Logout result
   */
  async function logout() {
    // Clear client state immediately so UI reflects logged-out state
    reset();
    try {
      // Fire-and-forget server logout (clear refresh cookie)
        await (api as any).post('/api/auth/logout', {}, { withCredentials: true });
      return { success: true };
    } catch (err) {
      // Already reset client state; just log the error
      setError(err.message || String(err));
      return { success: false, error: err.message || String(err) };
    }
  }

  function reset() {
    setAccessToken(null);
    setUser(null);
    clearError();
  }

  /**
   * Initialize auth on app mount
   * Restores state and refreshes token if needed
   */
  async function init() {
    console.log('Auth init - accessToken:', accessToken.value ? 'exists' : 'null');
    console.log('Auth init - user:', user.value);
    
    // Check if we have a stored access token
    if (accessToken.value) {
      // Verify token is still valid
      const result = await verify();

      // If verify returned undefined, the server rate-limited us (429). Do not clear auth in this case.
      if (result === undefined) {
        console.log('Auth init - verification rate-limited. Keeping existing token and retrying later.');
        return;
      }

      if (result && result.success) {
        console.log('Auth init - token verified, user:', result.user);

        // Fetch full user profile from user store
        const userStore = useUserStore();
        await userStore.fetchUser();
      } else {
        console.log('Auth init - token verification failed, clearing auth');
        reset();
      }
    }
  }

  return {
    // State
    accessToken,
    user,
    isAuthenticated,
    loading,
    error,

    // Computed
    isLoggedIn,
    userId,
    username,

    // Actions
  setAccessToken,
  setToken,
    setUser,
    setLoading,
    setError,
    clearError,
    login,
    refreshToken,
    verify,
    logout,
    reset,
    init,
  };
});

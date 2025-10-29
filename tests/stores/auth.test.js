import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock the socket utility
vi.mock('@/utils/socket', () => ({
  getSharedSocket: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

describe('Auth Store', () => {
  let authStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('State Management', () => {
    it('should initialize with correct default state', () => {
      expect(authStore.accessToken).toBeNull();
      expect(authStore.user).toBeNull();
      expect(authStore.isAuthenticated).toBe(false);
    });

    it('should determine authentication status correctly', () => {
      expect(authStore.isAuthenticated).toBe(false);

      authStore.accessToken = 'test-token';
      authStore.user = { steamId: '123' };

      expect(authStore.isAuthenticated).toBe(true);
    });
  });

  describe('Token Persistence', () => {
    it('should store access token', () => {
      const token = 'test-jwt-token';
      authStore.setToken(token);

      expect(authStore.accessToken).toBe(token);
    });

    it('should clear tokens on logout', () => {
      authStore.accessToken = 'test-token';
      authStore.user = { steamId: '123' };

      authStore.logout();

      expect(authStore.accessToken).toBeNull();
      expect(authStore.user).toBeNull();
      expect(authStore.isAuthenticated).toBe(false);
    });
  });

  describe('Verify Function', () => {
    it('should prevent concurrent verify calls', async () => {
      const mockAxios = await import('axios');
      mockAxios.default.get.mockResolvedValue({
        data: { success: true, user: { steamId: '123' } },
      });

      // Start multiple verify calls simultaneously
      const promises = [
        authStore.verify(),
        authStore.verify(),
        authStore.verify(),
      ];

      await Promise.all(promises);

      // Should only make one actual API call due to debouncing
      expect(mockAxios.default.get).toHaveBeenCalledTimes(1);
    });

    it('should attempt refresh when no access token', async () => {
      const mockAxios = await import('axios');
      mockAxios.default.post.mockResolvedValue({
        data: { success: true, accessToken: 'new-token' },
      });
      mockAxios.default.get.mockResolvedValue({
        data: { success: true, user: { steamId: '123' } },
      });

      authStore.accessToken = null;

      await authStore.verify();

      // Should attempt refresh first
      expect(mockAxios.default.post).toHaveBeenCalledWith('/auth/refresh', {}, {
        withCredentials: true,
      });

      // Then fetch user profile
      expect(mockAxios.default.get).toHaveBeenCalledWith('/auth/me', {
        withCredentials: true,
      });
    });

    it('should handle 429 errors gracefully', async () => {
      const mockAxios = await import('axios');
      mockAxios.default.get.mockRejectedValue({
        response: { status: 429, data: { error: 'Too many requests' } },
      });

      const result = await authStore.verify();

      // Should not throw, should handle gracefully
      expect(result).toBeUndefined();
      expect(authStore.user).toBeNull();
    });
  });

  describe('Reload Persistence', () => {
    it('should restore session on page reload', async () => {
      // Simulate having a valid refresh token in cookies
      const mockAxios = await import('axios');
      mockAxios.default.post.mockResolvedValue({
        data: { success: true, accessToken: 'refreshed-token' },
      });
      mockAxios.default.get.mockResolvedValue({
        data: {
          success: true,
          user: { steamId: '123', name: 'Test User' }
        },
      });

      await authStore.verify();

      expect(authStore.accessToken).toBe('refreshed-token');
      expect(authStore.user.steamId).toBe('123');
      expect(authStore.isAuthenticated).toBe(true);
    });

    it('should not log out user on reload if refresh succeeds', async () => {
      const mockAxios = await import('axios');
      mockAxios.default.post.mockResolvedValue({
        data: { success: true, accessToken: 'refreshed-token' },
      });
      mockAxios.default.get.mockResolvedValue({
        data: {
          success: true,
          user: { steamId: '123', name: 'Test User' }
        },
      });

      // Simulate page reload scenario
      authStore.accessToken = null;
      authStore.user = null;

      await authStore.verify();

      // Should restore authentication
      expect(authStore.isAuthenticated).toBe(true);
      expect(authStore.user.name).toBe('Test User');
    });
  });
});
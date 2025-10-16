import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Fetch current user from backend
  const fetchUser = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/user', {
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        user.value = await response.json();
        return true;
      } else {
        user.value = null;
        return false;
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      error.value = err.message;
      user.value = null;
      return false;
    } finally {
      loading.value = false;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      user.value = null;
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
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

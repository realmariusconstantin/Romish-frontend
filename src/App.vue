<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import { useMatchStore } from '@/stores/match';
import ReadyModal from '@/components/ReadyModal.vue';
import ChatDrawer from '@/components/ChatDrawer.vue';
import { connectChatSocket } from '@/sockets/chat';
import { connectMatchSocket } from '@/sockets/match';

const authStore = useAuthStore();
const chatStore = useChatStore();
const matchStore = useMatchStore();

onMounted(async () => {
  // Initialize auth store on app mount
  try {
    await authStore.init();
    
    // If user is authenticated, connect sockets
    if (authStore.isLoggedIn) {
      const userId = authStore.user?.userId || authStore.user?.id;
      const username = authStore.user?.username || authStore.user?.name || 'Anonymous';
      
      // Connect to both socket namespaces
      await connectMatchSocket(userId, username);
      await connectChatSocket(userId, username);
    }
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
});
</script>

<template>
  <!-- Global Ready Modal -->
  <ReadyModal />
  
  <!-- Global Chat Drawer -->
  <ChatDrawer />
  
  <!-- Router views -->
  <router-view />
</template>


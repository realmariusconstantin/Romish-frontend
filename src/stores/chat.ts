/**
 * Chat Store - Manages global chat state
 * @module stores/chat
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useChatStore = defineStore('chat', () => {
  // State
  const messages = ref([]);
  const onlineCount = ref(0);
  // Unread messages counter (badge)
  const unreadCount = ref(0);
  const sending = ref(false);
  const rateLimited = ref(false);
  const rateLimitResetIn = ref(0);

  // Computed
  const messageCount = computed(() => messages.value.length);
  const hasNewMessages = computed(() => unreadCount.value > 0);

  // Actions
  function addMessage(message) {
    // Avoid duplicates
    if (!messages.value.find((m) => m.messageId === message.messageId)) {
      messages.value.push({
        messageId: message.messageId,
        userId: message.userId,
        username: message.username,
        text: message.text,
        createdAt: message.createdAt,
      });
      // Increase unread counter for new incoming messages. UI may call clearUnread()
      // when the chat drawer is opened to mark messages as read.
      unreadCount.value = Math.min(unreadCount.value + 1, 999);
    }
  }

  function setMessages(newMessages) {
    messages.value = Array.isArray(newMessages) ? newMessages : [];
  }

  function removeMessage(messageId) {
    const index = messages.value.findIndex((m) => m.messageId === messageId);
    if (index > -1) {
      messages.value.splice(index, 1);
    }
  }

  function setOnlineCount(count) {
    onlineCount.value = Math.max(0, count);
  }

  function setSending(state) {
    sending.value = state;
  }

  function setRateLimited(limited) {
    rateLimited.value = limited;
    if (limited) {
      rateLimitResetIn.value = 10; // 10 seconds
      startRateLimitCountdown();
    }
  }

  function startRateLimitCountdown() {
    const interval = setInterval(() => {
      rateLimitResetIn.value--;
      if (rateLimitResetIn.value <= 0) {
        clearInterval(interval);
        rateLimited.value = false;
        rateLimitResetIn.value = 0;
      }
    }, 1000);
  }

  function clear() {
    messages.value = [];
    onlineCount.value = 0;
    sending.value = false;
    rateLimited.value = false;
    unreadCount.value = 0;
  }

  function clearUnread() {
    unreadCount.value = 0;
  }

  function setUnread(count) {
    unreadCount.value = Math.max(0, Number(count) || 0);
  }

  return {
    // State
    messages,
    onlineCount,
    sending,
    rateLimited,
    rateLimitResetIn,

    // Computed
    messageCount,
    hasNewMessages,
  unreadCount,

    // Actions
    addMessage,
    setMessages,
    removeMessage,
    setOnlineCount,
    setSending,
    setRateLimited,
    clear,
    clearUnread,
    setUnread,
  };
});

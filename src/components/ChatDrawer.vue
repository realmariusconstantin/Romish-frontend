<template>
  <div class="chat-wrapper">
    <!-- Chat toggle button (hidden while drawer is open) -->
    <button
      v-if="!isOpen"
      class="chat-toggle"
      @click="toggleDrawer"
      aria-label="Open chat"
    >
      <span class="chat-icon">💬</span>
      <span v-if="chatStore.unreadCount > 0" class="message-badge">
        {{ chatStore.unreadCount }}
      </span>
    </button>

    <!-- Chat drawer -->
    <transition name="drawer-slide">
      <div v-if="isOpen" class="chat-drawer">
        <!-- Header -->
        <div class="chat-header">
          <h3>Global Chat</h3>
          <button
            @click="toggleDrawer"
            class="close-btn"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        <!-- Online count -->
        <div class="online-status">
          <span class="online-badge">●</span>
          <span>{{ chatStore.onlineCount }} online</span>
        </div>

        <!-- Messages container -->
        <div class="messages-container" ref="messagesContainer">
          <div v-if="!authStore.isLoggedIn" class="empty-state">
            <p>🔒 Sign in with Steam to chat</p>
          </div>
          <div v-else-if="chatStore.messages.length === 0" class="empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>

          <div
            v-for="message in chatStore.messages"
            :key="message.messageId"
            class="message-item"
          >
            <div class="message-header">
              <span class="username">{{ message.username }}</span>
              <span class="timestamp">{{ formatTime(message.createdAt) }}</span>
            </div>
            <div class="message-text">{{ message.text }}</div>
          </div>
        </div>

        <!-- Input section -->
        <div class="chat-input-section">
          <div v-if="!authStore.isLoggedIn" class="login-prompt">
            <p>Please <a href="/login">sign in with Steam</a> to send messages</p>
          </div>
          <div v-else-if="chatStore.rateLimited" class="rate-limit-warning">
            ⚠️ Too many messages. Wait {{ chatStore.rateLimitResetIn }}s
          </div>

          <div class="input-wrapper">
            <input
              v-model="messageText"
              type="text"
              placeholder="Type a message..."
              class="message-input"
              @keydown.enter="sendMessage"
              :disabled="!authStore.isLoggedIn || chatStore.rateLimited || chatStore.sending"
              maxlength="500"
            />
            <button
              @click="sendMessage"
              class="send-btn"
              :disabled="!authStore.isLoggedIn || !messageText.trim() || chatStore.rateLimited || chatStore.sending"
              aria-label="Send message"
            >
              <span v-if="!chatStore.sending">→</span>
              <span v-else>...</span>
            </button>
          </div>

          <p class="char-count">{{ messageText.length }}/500</p>
        </div>
      </div>
    </transition>

    <!-- Drawer backdrop (mobile) -->
    <transition name="backdrop-fade">
      <div
        v-if="isOpen && isMobile"
        class="drawer-backdrop"
        @click="toggleDrawer"
      ></div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue';
import { useChatStore } from '../stores/chat';
import { sendMessage as emitSendMessage, connectChatSocket, isChatSocketConnected } from '../sockets/chat';
import { useAuthStore } from '../stores/auth';

const chatStore = useChatStore();
const authStore = useAuthStore();

const isOpen = ref(false);
const messageText = ref('');
const messagesContainer = ref(null);
const isMobile = computed(() => window.innerWidth < 768);

// Initialize socket on mount
function initChat() {
  if (!isChatSocketConnected() && authStore.isLoggedIn) {
    connectChatSocket(authStore.userId, authStore.username);
  }
}

function toggleDrawer() {
  const opening = !isOpen.value;
  isOpen.value = opening ? true : false;
  if (opening) {
    // Clear unread badge when opening the chat and initialize socket
    chatStore.clearUnread?.();
    initChat();
  }
}

function sendMessage() {
  if (!messageText.value.trim() || chatStore.rateLimited) {
    return;
  }

  chatStore.setSending(true);
  emitSendMessage(messageText.value);
  messageText.value = '';
  chatStore.setSending(false);
}

function formatTime(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'now';
  }
}

// Auto-scroll to bottom when new messages arrive
watch(
  () => chatStore.messages.length,
  async () => {
    await nextTick();
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  }
);

// Initialize chat when drawer opens
watch(isOpen, (newVal) => {
  if (newVal) {
    initChat();
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    });
  }
});
</script>

<style scoped>
.chat-wrapper {
  position: relative;
  z-index: 1000;
}

.chat-toggle {
  position: fixed;
  left: 20px;
  bottom: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(100, 200, 255, 0.1);
  border: 2px solid rgba(100, 200, 255, 0.3);
  color: #00d4ff;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1002;
}

.chat-toggle:hover {
  background: rgba(100, 200, 255, 0.2);
  box-shadow: 0 0 15px rgba(100, 200, 255, 0.4);
}

.chat-toggle.active {
  background: rgba(100, 200, 255, 0.3);
  border-color: rgba(100, 200, 255, 0.6);
}

.message-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff6b6b;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 0 8px rgba(255, 107, 107, 0.5);
}

.chat-drawer {
  position: fixed;
  left: 20px;
  bottom: 20px;
  width: 320px;
  height: 500px;
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
  border: 2px solid rgba(100, 200, 255, 0.3);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(100, 200, 255, 0.2);
  animation: drawerSlideIn 0.3s ease-out;
  z-index: 1001;
}

@keyframes drawerSlideIn {
  from {
    transform: translateX(-380px) translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateX(0) translateY(0);
    opacity: 1;
  }
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(100, 200, 255, 0.2);
  flex-shrink: 0;
}

.chat-header h3 {
  margin: 0;
  color: #00d4ff;
  font-size: 16px;
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
}

.close-btn {
  background: none;
  border: none;
  color: rgba(200, 200, 200, 0.7);
  font-size: 20px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #00d4ff;
}

.online-status {
  padding: 8px 16px;
  background: rgba(100, 200, 100, 0.1);
  color: rgba(100, 200, 100, 0.8);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid rgba(100, 200, 255, 0.2);
  flex-shrink: 0;
}

.online-badge {
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  display: inline-block;
  animation: blink 2s infinite;
}

@keyframes blink {
  0%,
  49%,
  100% {
    opacity: 1;
  }
  50%,
  99% {
    opacity: 0.5;
  }
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: rgba(100, 200, 255, 0.1);
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(100, 200, 255, 0.3);
  border-radius: 3px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(200, 200, 200, 0.5);
  font-size: 13px;
  text-align: center;
}

.message-item {
  padding: 8px 12px;
  background: rgba(50, 50, 100, 0.2);
  border-left: 3px solid rgba(100, 200, 255, 0.3);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.message-item:hover {
  background: rgba(50, 50, 100, 0.4);
  border-left-color: rgba(100, 200, 255, 0.6);
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.username {
  color: #00d4ff;
  font-weight: bold;
  font-size: 12px;
}

.timestamp {
  color: rgba(200, 200, 200, 0.5);
  font-size: 11px;
}

.message-text {
  color: rgba(200, 200, 200, 0.9);
  font-size: 13px;
  word-break: break-word;
  line-height: 1.4;
}

.chat-input-section {
  padding: 12px;
  border-top: 1px solid rgba(100, 200, 255, 0.2);
  flex-shrink: 0;
}

.rate-limit-warning {
  padding: 8px 12px;
  background: rgba(255, 150, 100, 0.15);
  border: 1px solid rgba(255, 150, 100, 0.3);
  border-radius: 4px;
  color: #ffb366;
  font-size: 12px;
  margin-bottom: 8px;
  text-align: center;
}

.input-wrapper {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
}

.message-input {
  flex: 1;
  padding: 8px 12px;
  background: rgba(50, 50, 100, 0.3);
  border: 1px solid rgba(100, 200, 255, 0.3);
  border-radius: 6px;
  color: rgba(200, 200, 200, 0.9);
  font-size: 13px;
  outline: none;
  transition: all 0.3s ease;
}

.message-input:focus {
  background: rgba(50, 50, 100, 0.5);
  border-color: rgba(100, 200, 255, 0.6);
  box-shadow: 0 0 10px rgba(100, 200, 255, 0.2);
}

.message-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  padding: 8px 12px;
  background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%);
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
}

.send-btn:hover:not(:disabled) {
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.5);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-prompt {
  padding: 12px;
  background: rgba(255, 107, 107, 0.1);
  border-left: 3px solid #ff6b6b;
  border-radius: 4px;
  margin-bottom: 10px;
}

.login-prompt p {
  margin: 0;
  font-size: 13px;
  color: #ff9999;
}

.login-prompt a {
  color: #00d4ff;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.2s ease;
}

.login-prompt a:hover {
  color: #00ffff;
  text-decoration: underline;
}

.char-count {
  text-align: right;
  color: rgba(200, 200, 200, 0.4);
  font-size: 11px;
  margin: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: all 0.3s ease;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(380px) translateY(100px);
  opacity: 0;
}

.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  animation: backdropFadeIn 0.3s ease-out;
}

@keyframes backdropFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.3s ease;
}

.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .chat-drawer {
    position: fixed;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 60%;
    border-radius: 16px 16px 0 0;
    border: none;
    border-top: 2px solid rgba(100, 200, 255, 0.3);
  }

  @keyframes drawerSlideIn {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
}
</style>

<script setup>
import { ref, watch } from 'vue';

const toasts = ref([]);
let toastId = 0;

const addToast = (message, type = 'info', duration = 3000) => {
  const id = toastId++;
  const toast = {
    id,
    message,
    type, // 'success', 'error', 'warning', 'info'
    visible: false,
  };
  
  toasts.value.push(toast);
  
  // Trigger animation
  setTimeout(() => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.value[index].visible = true;
    }
  }, 10);
  
  // Auto remove
  setTimeout(() => {
    removeToast(id);
  }, duration);
};

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index !== -1) {
    toasts.value[index].visible = false;
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id);
    }, 300);
  }
};

// Expose to parent
defineExpose({
  addToast,
});
</script>

<template>
  <div class="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="['toast', `toast-${toast.type}`, { 'toast-visible': toast.visible }]"
      @click="removeToast(toast.id)"
    >
      <div class="toast-icon">
        <span v-if="toast.type === 'success'">✓</span>
        <span v-else-if="toast.type === 'error'">✕</span>
        <span v-else-if="toast.type === 'warning'">⚠</span>
        <span v-else>ⓘ</span>
      </div>
      <div class="toast-message">{{ toast.message }}</div>
    </div>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 6rem;
  right: 2rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  background: rgba(17, 24, 39, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  min-width: 300px;
  max-width: 400px;
  opacity: 0;
  transform: translateX(100px);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  pointer-events: auto;
  cursor: pointer;
}

.toast-visible {
  opacity: 1;
  transform: translateX(0);
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.25rem;
  font-weight: bold;
  flex-shrink: 0;
}

.toast-message {
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: var(--white-nova);
  line-height: 1.4;
  flex: 1;
}

/* Success */
.toast-success {
  border-color: #10b981;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4);
}

.toast-success .toast-icon {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

/* Error */
.toast-error {
  border-color: #ef4444;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4);
}

.toast-error .toast-icon {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* Warning */
.toast-warning {
  border-color: #f59e0b;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4);
}

.toast-warning .toast-icon {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

/* Info */
.toast-info {
  border-color: var(--star-cyan);
  box-shadow: 0 0 20px rgba(75, 207, 250, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4);
}

.toast-info .toast-icon {
  background: rgba(75, 207, 250, 0.2);
  color: var(--star-cyan);
}

.toast:hover {
  transform: translateX(-5px);
  box-shadow: 0 0 30px rgba(75, 207, 250, 0.4), 0 12px 40px rgba(0, 0, 0, 0.5);
}

/* Mobile */
@media (max-width: 768px) {
  .toast-container {
    right: 1rem;
    left: 1rem;
    top: 5rem;
  }

  .toast {
    min-width: unset;
    max-width: unset;
  }
}
</style>

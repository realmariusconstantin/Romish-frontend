/**
 * Ready-Up Store - Manages ready phase state
 * @module stores/ready
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useReadyStore = defineStore('ready', () => {
  // State
  const visible = ref(false);
  const matchId = ref(null);
  const players = ref([]);
  const secondsRemaining = ref(0);
  const currentUserAccepted = ref(false);
  const countdownInterval = ref(null);

  // Computed
  const acceptedCount = computed(() =>
    players.value.filter((p) => p.accepted).length
  );

  const pendingCount = computed(() =>
    players.value.filter((p) => !p.accepted).length
  );

  const allAccepted = computed(() => pendingCount.value === 0 && acceptedCount.value === 10);

  const progressPercentage = computed(
    () => (acceptedCount.value / Math.max(1, players.value.length)) * 100
  );

  // Actions
  function init(payload) {
    const { matchId: mId, players: playerList, secondsRemaining: remaining } = payload;

    matchId.value = mId;
    players.value = playerList;
    secondsRemaining.value = remaining;
    currentUserAccepted.value = false;
    visible.value = true;

    // Start countdown
    startCountdown();
  }

  function update(payload) {
    const { players: playerList, secondsRemaining: remaining } = payload;
    players.value = playerList;
    secondsRemaining.value = remaining;
  }

  function accept() {
    currentUserAccepted.value = true;
    // The actual socket emit happens in the component
  }

  function complete() {
    stopCountdown();
    visible.value = false;
    reset();
  }

  function timeout(nonAcceptors) {
    stopCountdown();
    visible.value = false;
    reset();
    
    // Emit timeout data if needed for UI feedback
    return nonAcceptors;
  }

  function reset() {
    matchId.value = null;
    players.value = [];
    secondsRemaining.value = 0;
    currentUserAccepted.value = false;
  }

  function startCountdown() {
    stopCountdown();

    countdownInterval.value = setInterval(() => {
      if (secondsRemaining.value > 0) {
        secondsRemaining.value--;
      } else {
        stopCountdown();
      }
    }, 1000);
  }

  function stopCountdown() {
    if (countdownInterval.value) {
      clearInterval(countdownInterval.value);
      countdownInterval.value = null;
    }
  }

  return {
    // State
    visible,
    matchId,
    players,
    secondsRemaining,
    currentUserAccepted,

    // Computed
    acceptedCount,
    pendingCount,
    allAccepted,
    progressPercentage,

    // Actions
    init,
    update,
    accept,
    complete,
    timeout,
    reset,
  };
});

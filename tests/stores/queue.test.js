import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// Provide a top-level mock for the ready store so that when the queue store
// imports it at module evaluation time, Vitest's mock is already in place.
const mockReadyStore = {
  init: vi.fn(),
  visible: false,
};
vi.doMock('@/stores/ready', () => ({
  useReadyStore: () => mockReadyStore,
}));

// Import queue store dynamically in beforeEach so that the above vi.doMock
// is in effect. Static ESM imports are hoisted and would otherwise load
// the real module before the mock is applied.
import { io } from 'socket.io-client';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
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

describe('Queue Store', () => {
  let queueStore;

  beforeEach(async () => {
    setActivePinia(createPinia());
    // Dynamic import so mocks are applied
    const mod = await import('@/stores/queue');
    queueStore = mod.useQueueStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('State Management', () => {
    it('should initialize with correct default state', () => {
      expect(queueStore.players).toEqual([]);
      expect(queueStore.status).toBe('waiting');
      expect(queueStore.requiredPlayers).toBe(10);
      expect(queueStore.isInQueue).toBe(false);
    });

    it('should calculate player count correctly', () => {
      queueStore.players = [
        { steamId: '1', name: 'Player1' },
        { steamId: '2', name: 'Player2' },
      ];
      expect(queueStore.playerCount).toBe(2);
    });

    it('should determine if queue is full', () => {
      queueStore.players = Array(10).fill({ steamId: 'test' });
      expect(queueStore.isFull).toBe(true);

      queueStore.players = Array(9).fill({ steamId: 'test' });
      expect(queueStore.isFull).toBe(false);
    });
  });

  describe('Socket Event Handling', () => {
    it('should update players when queue:player-joined event received', () => {
      const mockSocket = { on: vi.fn() };
      queueStore.socket = mockSocket;

      // Simulate socket event
      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'queue:player-joined')[1];
      eventHandler({
        player: { steamId: 'new-player', name: 'New Player' },
      });

      expect(queueStore.players).toContainEqual({
        steamId: 'new-player',
        name: 'New Player',
      });
    });

    it('should remove player when queue:player-left event received', () => {
      queueStore.players = [
        { steamId: '1', name: 'Player1' },
        { steamId: '2', name: 'Player2' },
      ];

      const mockSocket = { on: vi.fn() };
      queueStore.socket = mockSocket;

      // Simulate socket event
      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'queue:player-left')[1];
      eventHandler({ steamId: '1' });

      expect(queueStore.players).toHaveLength(1);
      expect(queueStore.players[0].steamId).toBe('2');
    });

    it('should update queue status when queue:updated event received', () => {
      const mockSocket = { on: vi.fn() };
      queueStore.socket = mockSocket;

      // Simulate socket event
      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'queue:updated')[1];
      eventHandler({
        players: [{ steamId: '1', name: 'Player1' }],
        status: 'processing',
      });

      expect(queueStore.players).toHaveLength(1);
      expect(queueStore.status).toBe('processing');
    });

    it('should handle match-ready event and initialize ready store', () => {
      const mockSocket = { on: vi.fn() };
      queueStore.socket = mockSocket;

      // Simulate socket event
      const eventHandler = mockSocket.on.mock.calls.find(call => call[0] === 'match-ready')[1];
      eventHandler({
        matchId: 'test-match',
        expiresAt: new Date(Date.now() + 20000),
        timeout: 20000,
        requiredPlayers: [{ steamId: '1' }],
      });

      expect(mockReadyStore.init).toHaveBeenCalledWith({
        matchId: 'test-match',
        players: [{ steamId: '1' }],
        secondsRemaining: 20,
      });
    });
  });

  describe('Queue Counter Updates', () => {
    it('should update counter live when players join', () => {
      expect(queueStore.playerCount).toBe(0);

      queueStore.players = [{ steamId: '1' }];
      expect(queueStore.playerCount).toBe(1);

      queueStore.players = [{ steamId: '1' }, { steamId: '2' }];
      expect(queueStore.playerCount).toBe(2);
    });

    it('should reset counter when queue is cleared', () => {
      queueStore.players = Array(5).fill({ steamId: 'test' });
      expect(queueStore.playerCount).toBe(5);

      queueStore.players = [];
      expect(queueStore.playerCount).toBe(0);
    });
  });
});
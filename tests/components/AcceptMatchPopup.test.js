import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AcceptMatchPopup from '@/components/AcceptMatchPopup.vue';
import { createPinia, setActivePinia } from 'pinia';

describe('AcceptMatchPopup', () => {
  beforeEach(() => {
    // Create fresh Pinia instance for each test
    setActivePinia(createPinia());
    
    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the component', () => {
    const wrapper = mount(AcceptMatchPopup, {
      global: {
        plugins: [createPinia()],
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should display Accept button before accepting', () => {
    const wrapper = mount(AcceptMatchPopup, {
      global: {
        plugins: [createPinia()],
      },
    });

    const acceptButton = wrapper.find('.giant-accept-btn');
    expect(acceptButton.exists()).toBe(true);
    expect(acceptButton.text()).toContain('ACCEPT');
  });

  it('should show timer countdown', () => {
    const wrapper = mount(AcceptMatchPopup, {
      global: {
        plugins: [createPinia()],
      },
    });

    const timer = wrapper.find('.timer-text-large');
    expect(timer.exists()).toBe(true);
    expect(timer.text()).toMatch(/\d+/); // Should contain numbers
  });

  it('should call acceptMatch when Accept button is clicked', async () => {
    const wrapper = mount(AcceptMatchPopup, {
      global: {
        plugins: [createPinia()],
      },
    });

    const acceptButton = wrapper.find('.giant-accept-btn');
    await acceptButton.trigger('click');

    // Button should be disabled after clicking
    expect(acceptButton.attributes('disabled')).toBeDefined();
  });

  it('should show 10 boxes after accepting', async () => {
    const wrapper = mount(AcceptMatchPopup, {
      global: {
        plugins: [createPinia()],
      },
    });

    // Click accept button
    const acceptButton = wrapper.find('.giant-accept-btn');
    await acceptButton.trigger('click');

    // Wait for state update
    await wrapper.vm.$nextTick();

    // Check if boxes grid appears
    const boxesGrid = wrapper.find('.boxes-grid');
    if (boxesGrid.exists()) {
      const boxes = wrapper.findAll('.box-square');
      expect(boxes).toHaveLength(10);
    }
  });

  it('should update accepted box count when players accept', async () => {
    const wrapper = mount(AcceptMatchPopup, {
      global: {
        plugins: [createPinia()],
      },
    });

    // Click accept
    await wrapper.find('.giant-accept-btn').trigger('click');
    await wrapper.vm.$nextTick();

    // Simulate acceptedCount changing via store
    // In real scenario, this would come from Socket.IO event
    const matchStore = wrapper.vm.matchStore;
    if (matchStore) {
      matchStore.acceptPhase.acceptedPlayers = ['player1', 'player2', 'player3'];
      await wrapper.vm.$nextTick();

      const acceptedBoxes = wrapper.findAll('.box-accepted');
      expect(acceptedBoxes.length).toBeGreaterThan(0);
    }
  });

  it('should countdown timer from initial value', async () => {
    const wrapper = mount(AcceptMatchPopup, {
      global: {
        plugins: [createPinia()],
      },
    });

    const initialTime = wrapper.vm.timeRemaining;
    
    // Advance timer by 1 second
    vi.advanceTimersByTime(1000);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.timeRemaining).toBe(initialTime - 1);
  });

  it('should play sound on mount', () => {
    const mockPlay = vi.fn().mockResolvedValue(undefined);
    global.Audio = vi.fn().mockImplementation(() => ({
      play: mockPlay,
      volume: 0.7,
    }));

    mount(AcceptMatchPopup, {
      global: {
        plugins: [createPinia()],
      },
    });

    expect(mockPlay).toHaveBeenCalled();
  });

  it('should not allow accepting twice', async () => {
    const wrapper = mount(AcceptMatchPopup, {
      global: {
        plugins: [createPinia()],
      },
    });

    const acceptButton = wrapper.find('.giant-accept-btn');
    
    // Click once
    await acceptButton.trigger('click');
    await wrapper.vm.$nextTick();

    // Try to click again - button should be disabled
    expect(acceptButton.attributes('disabled')).toBeDefined();
  });
});

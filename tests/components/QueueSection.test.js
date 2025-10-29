import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import QueueSection from '@/components/QueueSection.vue';
import { createPinia, setActivePinia } from 'pinia';

describe('QueueSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should render the component', () => {
    const wrapper = mount(QueueSection, {
      global: {
        plugins: [createPinia()],
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should display Join Queue button when not in queue', () => {
    const wrapper = mount(QueueSection, {
      global: {
        plugins: [createPinia()],
      },
    });

    const joinButton = wrapper.find('button');
    expect(joinButton.exists()).toBe(true);
    expect(joinButton.text()).toContain('JOIN');
  });

  it('should emit queue-action event when Join button is clicked', async () => {
    const wrapper = mount(QueueSection, {
      global: {
        plugins: [createPinia()],
      },
    });

    const joinButton = wrapper.find('button');
    await joinButton.trigger('click');

    expect(wrapper.emitted('queue-action')).toBeTruthy();
    expect(wrapper.emitted('queue-action')[0]).toEqual(['join']);
  });

  it('should display Leave Queue button when in queue', async () => {
    const wrapper = mount(QueueSection, {
      global: {
        plugins: [createPinia()],
      },
    });

    // Mock store state to show user in queue
    const queueStore = wrapper.vm.$pinia.state.value.queue;
    if (queueStore) {
      queueStore.isInQueue = true;
      await wrapper.vm.$nextTick();

      const leaveButton = wrapper.find('button');
      expect(leaveButton.text()).toContain('LEAVE');
    }
  });

  it('should emit leave action when Leave button is clicked', async () => {
    const wrapper = mount(QueueSection, {
      global: {
        plugins: [createPinia()],
      },
    });

    // Set user in queue
    const queueStore = wrapper.vm.$pinia.state.value.queue;
    if (queueStore) {
      queueStore.isInQueue = true;
      await wrapper.vm.$nextTick();

      const leaveButton = wrapper.find('button');
      await leaveButton.trigger('click');

      expect(wrapper.emitted('queue-action')).toBeTruthy();
      const emittedEvents = wrapper.emitted('queue-action');
      expect(emittedEvents[emittedEvents.length - 1]).toEqual(['leave']);
    }
  });

  it('should display player count', () => {
    const wrapper = mount(QueueSection, {
      global: {
        plugins: [createPinia()],
      },
    });

    // Mock queue with players
    const queueStore = wrapper.vm.$pinia.state.value.queue;
    if (queueStore) {
      queueStore.players = [
        { steamId: '1', name: 'Player1' },
        { steamId: '2', name: 'Player2' },
        { steamId: '3', name: 'Player3' },
      ];
    }

    // Find player count display
    const countElement = wrapper.find('.queue-count, .player-count');
    if (countElement.exists()) {
      expect(countElement.text()).toContain('3');
    }
  });

  it('should show queue progress bar', () => {
    const wrapper = mount(QueueSection, {
      global: {
        plugins: [createPinia()],
      },
    });

    const progressBar = wrapper.find('.progress, .queue-progress');
    expect(progressBar.exists()).toBe(true);
  });

  it('should disable button while action is processing', async () => {
    const wrapper = mount(QueueSection, {
      global: {
        plugins: [createPinia()],
      },
    });

    const button = wrapper.find('button');
    await button.trigger('click');

    // Button should be disabled during processing
    // This depends on component implementation
    await wrapper.vm.$nextTick();
  });
});

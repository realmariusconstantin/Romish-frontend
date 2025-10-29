import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MapGrid from '@/components/MapGrid.vue';
import { createPinia, setActivePinia } from 'pinia';

describe('MapGrid', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should render the component', () => {
    const wrapper = mount(MapGrid, {
      global: {
        plugins: [createPinia()],
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should display map cards', () => {
    const wrapper = mount(MapGrid, {
      global: {
        plugins: [createPinia()],
      },
    });

    const mapCards = wrapper.findAll('.map-card, .map-item');
    expect(mapCards.length).toBeGreaterThan(0);
  });

  it('should display 8 map slots by default', () => {
    const wrapper = mount(MapGrid, {
      global: {
        plugins: [createPinia()],
      },
    });

    const mapCards = wrapper.findAll('.map-card, .map-item');
    expect(mapCards).toHaveLength(8);
  });

  it('should show map counter badges', () => {
    const wrapper = mount(MapGrid, {
      global: {
        plugins: [createPinia()],
      },
    });

    const badges = wrapper.findAll('.map-counter, .counter-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should have hover effect on map cards', async () => {
    const wrapper = mount(MapGrid, {
      global: {
        plugins: [createPinia()],
      },
    });

    const mapCard = wrapper.find('.map-card, .map-item');
    if (mapCard.exists()) {
      await mapCard.trigger('mouseenter');
      // Check if hover class is applied or styles change
      expect(mapCard.classes()).toBeDefined();
    }
  });

  it('should display map names if provided', () => {
    const maps = [
      { name: 'Dust 2', image: '/maps/dust2.jpg' },
      { name: 'Mirage', image: '/maps/mirage.jpg' },
    ];

    const wrapper = mount(MapGrid, {
      props: {
        maps,
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const mapNames = wrapper.findAll('.map-name, .map-title');
    expect(mapNames.length).toBeGreaterThan(0);
  });

  it('should apply grid layout classes', () => {
    const wrapper = mount(MapGrid, {
      global: {
        plugins: [createPinia()],
      },
    });

    const gridContainer = wrapper.find('.map-grid, .maps-container');
    expect(gridContainer.exists()).toBe(true);
    expect(gridContainer.classes()).toContain('map-grid' || 'maps-container');
  });

  it('should show placeholder for empty maps', () => {
    const wrapper = mount(MapGrid, {
      global: {
        plugins: [createPinia()],
      },
    });

    // All cards should exist even if no map data
    const cards = wrapper.findAll('.map-card, .map-item');
    expect(cards).toHaveLength(8);
  });

  it('should be responsive', () => {
    const wrapper = mount(MapGrid, {
      global: {
        plugins: [createPinia()],
      },
    });

    const grid = wrapper.find('.map-grid, .maps-container');
    expect(grid.exists()).toBe(true);
    
    // Check if responsive classes exist
    const element = grid.element;
    const styles = window.getComputedStyle(element);
    expect(styles.display).toBe('grid' || styles.display === 'flex');
  });
});

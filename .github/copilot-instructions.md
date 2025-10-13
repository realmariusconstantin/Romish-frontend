# Romish Frontend - AI Coding Agent Instructions# Romish Frontend - AI Coding Agent Instructions



## Project Overview## Project Overview

**Romish** is a galaxy-themed multiplayer queue and matchmaking UI built with Vue 3 + Vite. The design features a cosmic/cyberpunk aesthetic with glowing cards, nebula gradients, and futuristic panels. This is the frontend for a competitive 5v5 game mode system.This is a minimal Vue 3 + Vite SPA (Single Page Application) in early development stage. The project uses Vue 3's Composition API with `<script setup>` syntax and is configured for modern ESNext development.



## Tech Stack## Tech Stack

- **Framework**: Vue 3.5+ with Composition API (`<script setup>` syntax)- **Framework**: Vue 3.5+ with Composition API (`<script setup>` syntax)

- **Build Tool**: Vite 7.x with HMR and Vue DevTools integration- **Build Tool**: Vite 7.x with Hot Module Replacement (HMR)

- **Styling**: Pure CSS with CSS variables (no framework)- **JavaScript**: ES modules, no TypeScript (uses JSDoc for type hints if needed)

- **Fonts**: Orbitron (headings), Inter (body text)- **Node Version**: Requires Node.js 20.19.0+ or 22.12.0+

- **Node Version**: 20.19.0+ or 22.12.0+

## Project Structure

## Architecture & Structure```

src/

```  ├── App.vue         # Root component

src/  ├── main.js         # Application entry point

├── components/          # Reusable UI componentspublic/               # Static assets (favicon, etc.)

│   ├── Navbar.vue      # Top navigation with gradient titleindex.html            # HTML entry point with <div id="app">

│   ├── QueueSection.vue # Player cards + settings + queue button```

│   ├── MapGrid.vue     # 4x2 grid of map selection cards

│   └── PlayerList.vue  # Right sidebar with online players## Key Conventions

├── views/

│   └── Home.vue        # Main page layout composition### Vue Component Structure

├── styles/- **Always use `<script setup>`** syntax for new components (Composition API)

│   ├── colors.css      # Galaxy theme color variables & glows- Component structure order: `<script setup>` → `<template>` → `<style scoped>`

│   └── main.css        # Global styles, typography, utilities- Example from `src/App.vue`:

└── main.js             # App entry point with CSS imports  ```vue

```  <script setup></script>

  <template>

## Design System - Galaxy Theme    <h1>Content here</h1>

  </template>

### Color Palette (defined in `src/styles/colors.css`)  <style scoped></style>

All colors use CSS variables with the `--` prefix:  ```



- **Backgrounds**: `--cosmic-black`, `--deep-space-blue`, `--void-gray`### Import Paths

- **Accent Colors**: `--nebula-purple`, `--magenta-glow`, `--star-cyan`, `--aurora-pink`- Use `@/` alias for imports from `src/` directory (configured in `vite.config.js` and `jsconfig.json`)

- **Text**: `--white-nova`- Example: `import Component from '@/components/MyComponent.vue'`

- **Gradients**: `--galactic-gradient`, `--nebula-gradient`, `--starlight-gradient`

### Styling

### Glow Effects- Use `<style scoped>` by default to prevent CSS leakage between components

Every interactive element uses glowing box-shadows:- No CSS framework is currently configured - use vanilla CSS or add one if needed

- `--cyan-glow` / `--cyan-glow-hover` (player cards, map grid)

- `--purple-glow` / `--purple-glow-hover` (queue button)## Development Workflow

- `--magenta-glow-shadow` / `--magenta-glow-hover` (center player card)

### Starting Development Server

**Pattern**: Apply glow on base state, enhanced glow on `:hover` with `transform: scale(1.05)`.```bash

npm run dev

### Typography```

- **Headings/Titles**: `font-family: 'Orbitron'` with `letter-spacing: 0.1em`- Runs on `http://localhost:5173` by default (Vite's default port)

- **Body Text**: `font-family: 'Inter'`- HMR (Hot Module Replacement) is enabled for instant updates

- **ALL CAPS** for titles and labels

### Building for Production

## Component Patterns```bash

npm run build

### 1. **QueueSection.vue** - Player Cards Layout```

- **5 vertical cards** in a horizontal flexbox (`flex-wrap: wrap`)- Outputs to `dist/` directory

- Each card: 200x360px with rounded corners, glowing border- Preview production build: `npm run preview`

- **Center card** (index 2) has magenta glow; others have cyan glow

- Cards contain: circular avatar (140px) + info bar (50px height, pill-shaped)### Installing Dependencies

- Hover: `translateY(-8px) scale(1.03)` with enhanced glow```bash

npm install

**Settings Row**: Three columns (Region / Game Mode / Settings) with label above value.```

- Check Node version before installing: `node --version` (must be 20.19.0+ or 22.12.0+)

**Queue Button**: Uses `.glow-button` class from `main.css`, centered below settings.

## Development Tools

### 2. **MapGrid.vue** - Map Selection

- **4-column grid** (responsive: 3 → 2 → 1 columns on smaller screens)### IDE Setup

- Container has cyan border with glow effect- **Primary**: VS Code with Vue (Official) extension (`Vue.volar`)

- Individual cards: `aspect-ratio: 3/4`, subtle border, hover glow- **Important**: Disable Vetur if installed (conflicts with Vue Official extension)

- **Counter badge** (bottom-right): cyan background with `font-family: 'Orbitron'`- Vue DevTools plugin installed: `vite-plugin-vue-devtools` (enabled in dev mode)



### 3. **PlayerList.vue** - Right Sidebar### Browser DevTools

- **Fixed positioning** (`right: 2rem; top: 50%`) with vertical centering- Install Vue.js devtools browser extension for debugging Vue components

- Each player item: avatar (40px circle) + name + "Online" status (green) + info bar- Enable Custom Object Formatters in browser DevTools for better Vue reactivity inspection

- Hover: `translateX(-4px)` slide effect with subtle glow

- Responsive: becomes static block below 1024px## Common Patterns & Best Practices



### 4. **Navbar.vue**### Adding New Components

- **Gradient text title**: Uses `background-clip: text` with `--starlight-gradient`1. Create `.vue` file in `src/` (or subdirectory like `src/components/`)

- Semi-transparent background with `backdrop-filter: blur(10px)`2. Use `<script setup>` with Composition API

- Placeholder element on right (for future user menu)3. Import into parent component: `import MyComponent from '@/components/MyComponent.vue'`

4. Register by using in template directly (auto-registration with `<script setup>`)

## Key CSS Techniques

### State Management

### Glassmorphism Panels- No state management library (Pinia/Vuex) is currently configured

```css- For simple state: use `ref()` or `reactive()` from Vue

background: rgba(17, 24, 39, 0.6);- Add Pinia if complex state management is needed: `npm install pinia`

-webkit-backdrop-filter: blur(10px);

backdrop-filter: blur(10px);### Routing

border: 1px solid rgba(75, 207, 250, 0.2);- No Vue Router is configured yet

```- Add if multi-page navigation needed: `npm install vue-router@4`

**Always include `-webkit-` prefix for Safari support.**

## Important Notes

### Responsive Breakpoints- This is a **fresh/minimal project** - most architectural decisions haven't been made yet

- **1400px**: Tighter spacing for player list- No testing framework, linting (ESLint), or formatting (Prettier) is configured

- **1200px**: Smaller player cards (200px → 180px)- No UI component library is installed - choose based on project needs (Vuetify, Element Plus, etc.)

- **1024px**: Player list moves from fixed sidebar to static block- The project name "Romish" suggests Roman-themed content, but implementation details are not yet established

- **768px**: Mobile adjustments, single-column settings
- **480px**: MapGrid becomes single column

### Hover Interactions
Standard pattern for interactive elements:
```css
transition: all 0.3s ease;

.element:hover {
  box-shadow: var(--enhanced-glow);
  transform: translateY(-4px) scale(1.02);
}
```

## Development Workflow

### Commands
```bash
npm run dev      # Start dev server on localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

### Adding New Components
1. Create `.vue` file in `src/components/`
2. Use `<script setup>` syntax
3. Import in parent: `import Component from '@/components/Component.vue'`
4. **Use `@/` alias** for all src imports (configured in `vite.config.js`)

### Styling Guidelines
- **Always use scoped styles**: `<style scoped>`
- **Reference color variables**: `color: var(--star-cyan)`
- **Include hover states** with glow + transform
- **Mobile-first responsive**: add `@media` queries for larger screens

## Important Conventions

### Vue 3 Composition API
- Use `<script setup>` for all new components (not Options API)
- Data properties defined with `data() { return { ... } }` in `<script>` block below setup
- No `ref()` or `reactive()` needed yet (static UI for now)

### File Naming
- Components: PascalCase (e.g., `PlayerList.vue`)
- Views: PascalCase (e.g., `Home.vue`)
- Styles: kebab-case (e.g., `main.css`, `colors.css`)

### Import Paths
- **Always use `@/`** instead of relative paths: `import Home from '@/views/Home.vue'`
- CSS imports in `main.js`: `import '@/styles/main.css'`

## Future Integration Points (Not Yet Implemented)

### State Management
- No Pinia/Vuex yet - add when real player/queue data needed
- Current data is hardcoded in component `data()` functions

### Routing
- No Vue Router - single page only
- Add when multiple views needed (lobby, in-game, settings)

### API Integration
- No HTTP client (Axios/Fetch) configured
- Will need endpoints for:
  - Queue status updates
  - Player list (WebSocket for real-time)
  - Map data fetching
  - Matchmaking logic

### Animations
- Currently only CSS transitions (hover, transform)
- Consider adding Vue transition groups for enter/leave animations

## Testing & Quality
- **No linting**: ESLint not configured (add if code quality checks needed)
- **No testing**: Vitest/Jest not set up
- **No Prettier**: Manual formatting (add for team consistency)

## Common Tasks

### Update Color Scheme
Edit `src/styles/colors.css` - all components use CSS variables.

### Add New Player Card
Edit `playerCards` array in `QueueSection.vue` `data()`:
```javascript
playerCards: [
  { glowClass: 'cyan-glow' },
  { glowClass: 'magenta-glow' }, // new card
]
```

### Change Map Grid Size
Modify `maps: Array(8)` in `MapGrid.vue` and adjust grid columns in CSS.

### Adjust Glow Intensity
Edit glow variables in `colors.css`:
```css
--cyan-glow: 0 0 30px rgba(75, 207, 250, 0.7); /* increase opacity */
```

---

**Last Updated**: Project initialized with static UI matching galaxy theme design. Ready for backend integration and interactivity layer.

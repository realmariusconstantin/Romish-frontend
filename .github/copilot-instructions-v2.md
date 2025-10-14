# Romish Frontend - AI Coding Agent Instructions

## Project Overview

**Romish** is a galaxy-themed CS2 10-man competitive matchmaking platform built with Vue 3 + Vite. The design features a cosmic/cyberpunk aesthetic with glowing cards, nebula gradients, and futuristic panels. This frontend implements the complete matchmaking flow: Queue → Captain Draft → Map Veto.

## Tech Stack

- **Framework**: Vue 3.5+ with Composition API (`<script setup>` syntax)
- **Build Tool**: Vite 7.x with HMR and Vue DevTools integration
- **Router**: Vue Router 4 for client-side navigation  
- **Styling**: Pure CSS with CSS variables (no framework)
- **Fonts**: Orbitron (headings), Inter (body text)
- **Node Version**: Requires Node.js 20.19.0+ or 22.12.0+

## Project Structure

```
src/
├── router/
│   └── index.js            # Vue Router configuration
├── components/
│   ├── Navbar.vue          # Top navigation with tabs
│   ├── QueueSection.vue    # Player cards + settings + queue button
│   ├── MapGrid.vue         # 4x2 grid of map selection cards
│   └── PlayerList.vue      # Sliding sidebar with online players
├── views/
│   ├── Home.vue            # Main queue page
│   ├── DraftView.vue       # Captain draft system
│   ├── VetoView.vue        # Map veto phase
│   ├── MapsView.vue        # Map pool browser
│   ├── LeaderboardView.vue # WIP placeholder
│   ├── StatsView.vue       # WIP placeholder
│   └── ProfileView.vue     # WIP placeholder
├── images/
│   └── user.png            # Default user avatar
├── styles/
│   ├── colors.css          # Galaxy theme color variables & glows
│   └── main.css            # Global styles, typography, utilities
└── main.js                 # App entry point with router
```

## User Flow

```
HOME (/) → DRAFT (/draft) → VETO (/veto)
   ↓            ↓               ↓
 Queue    Captain Picks    Map Banning
```

1. User clicks "Queue" button on Home page
2. Navigates to Draft page where 2 captains pick teams
3. Auto-navigates to Veto when teams are full
4. Teams alternate banning maps until one remains

## Design System - Galaxy Theme

### Color Palette (defined in `src/styles/colors.css`)

All colors use CSS variables with the `--` prefix:

- **Backgrounds**: `--cosmic-black`, `--deep-space-blue`, `--void-gray`
- **Accent Colors**: `--nebula-purple`, `--magenta-glow`, `--star-cyan`, `--aurora-pink`
- **Text**: `--white-nova`
- **Gradients**: `--galactic-gradient`, `--nebula-gradient`, `--starlight-gradient`

### Glow Effects

Every interactive element uses glowing box-shadows:

- `--cyan-glow` / `--cyan-glow-hover` (Team Alpha, navigation, primary actions)
- `--purple-glow` / `--purple-glow-hover` (final selections, highlights)
- `--magenta-glow-shadow` / `--magenta-glow-hover` (captains, special cards)
- Aurora pink (Team Beta, ban hover states)

**Pattern**: Apply glow on base state, enhanced glow on `:hover` with `transform: scale(1.05)` or `translateY(-4px)`.

### Typography

- **Headings/Titles**: `font-family: 'Orbitron'` with `letter-spacing: 0.1em`
- **Body Text**: `font-family: 'Inter'`
- **ALL CAPS** for titles, labels, and team names

## Key Page Patterns

### 1. **Home.vue** - Queue Page

- Single QueueSection component centered
- PlayerList sidebar accessible from all pages
- Queue button emits 'start-queue' event → navigates to `/draft`
- MapGrid removed (moved to `/maps` page)

### 2. **DraftView.vue** - Captain Draft

- **Three-column layout**: Team Alpha (left) | 8 Players (center) | Team Beta (right)
- **Turn-based picking**: Click player → slides to current team's section
- **Visual indicators**: Animated crown for active captain, greyed-out picked players
- **Auto-assign**: Last player automatically assigned to team with 4 players
- **Auto-transition**: Navigates to `/veto` after 2-second delay when complete

**Mock Data**:
```javascript
captain1: { id: 1, name: 'Captain Alpha' }
captain2: { id: 2, name: 'Captain Beta' }
draftPool: [{ id: 3-10, name: 'Player X', picked: false, team: null }]
```

### 3. **VetoView.vue** - Map Veto

- **7 CS2 map cards** in responsive grid (Dust II, Mirage, Inferno, Nuke, Overpass, Vertigo, Ancient)
- **Hover state**: Red (`--aurora-pink`) border with glow
- **Click to ban**: Greyed out with red X overlay + "Banned by Team X" text
- **Turn alternating**: Header shows "Team Alpha is banning..." / "Team Beta is banning..."
- **Final map**: Last remaining map highlighted with purple pulse animation
- **Navigation**: "← Back to Draft" and "Return to Queue" buttons

### 4. **MapsView.vue** - Map Pool Browser

- Uses `MapGrid.vue` component (4x2 grid)
- Header: "MAP POOL" with subtitle
- Keeps original MapGrid styling

### 5. **Placeholder Pages** - Leaderboard / Stats / Profile

- Semi-transparent glassmorphism overlay
- Large animated icon (🏆 / 📊 / 👤)
- "Coming Soon" message with cyan glow
- Floating animation (3s ease-in-out infinite)
- Pulsing gradient border

## Component Patterns

### Navbar.vue - Navigation

- **Centered tabs**: Home, Maps, Leaderboard, Stats, Profile
- **Active state**: Cyan border, glow, and bottom highlight bar
- **Profile dropdown**: User avatar, notification bell (badge: 3), menu items
- Uses `router-link` with `active` class binding
- z-index: 9999 for dropdown

### QueueSection.vue - Queue Interface

- **5 player cards** (200x360px) with cyan/magenta glows
- **Settings row**: Region / Game Mode / Romish Customs (with info tooltip)
- **Queue button**: Emits `start-queue` event to parent
- Player avatars use `user.png` image
- Info tooltip shows 6 game settings on hover

### PlayerList.vue - Friend Sidebar

- **Fixed right-side panel** (380px width)
- **Toggle button** to show/hide
- **6 player rows** with avatars, names, "Online" status
- **Add friend buttons** ("+") for each player
- **Overlay backdrop** when open
- Slide animation with `cubic-bezier` easing

### MapGrid.vue - Map Display

- **4x2 grid layout** (responsive: 3 → 2 → 1 columns on smaller screens)
- Container has cyan border with glow effect
- Individual cards: `aspect-ratio: 3/4`, hover glow
- **Counter badge** (bottom-right): cyan background with Orbitron font

## Key CSS Techniques

### Glassmorphism Panels

```css
background: rgba(17, 24, 39, 0.6);
-webkit-backdrop-filter: blur(10px);
backdrop-filter: blur(10px);
border: 1px solid rgba(75, 207, 250, 0.2);
```

**Always include `-webkit-` prefix for Safari support.**

### Responsive Breakpoints

- **1400px**: Tighter spacing, adjusted flex values
- **1200px**: Stack columns vertically, full-width components
- **768px**: Mobile adjustments, single-column layouts
- **480px**: Smallest screens, compact padding/font sizes

### Hover Interactions

Standard pattern for interactive elements:

```css
transition: all 0.3s ease;

.element:hover {
  box-shadow: var(--enhanced-glow);
  transform: translateY(-4px) scale(1.02);
}
```

### Animations

Common animations used:

- **slideIn**: Player cards entering teams (0.4s ease-out)
- **float**: WIP overlays (3s ease-in-out infinite)
- **pulse**: Active states, final selections (1.5-2s infinite)
- **bounce**: Turn indicators, icons (2s ease-in-out infinite)
- **banAppear**: X overlay on banned maps (0.5s ease-out, rotate)

## Development Workflow

### Commands

```bash
npm run dev      # Start dev server on localhost:5174
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

### Adding New Components

1. Create `.vue` file in `src/components/` or `src/views/`
2. Use `<script setup>` syntax (Composition API)
3. Import in parent: `import Component from '@/components/Component.vue'`
4. **Use `@/` alias** for all src imports (configured in `vite.config.js`)

### Styling Guidelines

- **Always use scoped styles**: `<style scoped>`
- **Reference color variables**: `color: var(--star-cyan)`
- **Include hover states** with glow + transform
- **Mobile-first responsive**: add `@media` queries for larger screens

### Router Navigation

```javascript
import { useRouter } from 'vue-router';
const router = useRouter();

// Navigate programmatically
router.push('/draft');
router.push({ name: 'Veto' });
```

```vue
<!-- Navigate with links -->
<router-link to="/" class="nav-tab">Home</router-link>
<router-link :to="{ name: 'Maps' }">Maps</router-link>
```

## Important Conventions

### Vue 3 Composition API

- Use `<script setup>` for all new components (not Options API)
- Import reactive utilities: `import { ref, computed, onMounted } from 'vue'`
- Define reactive data with `ref()` or `reactive()`
- Use `computed()` for derived values
- Lifecycle hooks: `onMounted()`, `onBeforeUnmount()`, etc.

### File Naming

- Components: PascalCase (e.g., `PlayerList.vue`, `MapGrid.vue`)
- Views: PascalCase with "View" suffix (e.g., `DraftView.vue`, `VetoView.vue`)
- Styles: kebab-case (e.g., `main.css`, `colors.css`)

### Import Paths

- **Always use `@/`** instead of relative paths: `import Home from '@/views/Home.vue'`
- CSS imports in `main.js`: `import '@/styles/main.css'`
- Image imports: `import userAvatar from '@/images/user.png'`

## Future Integration Points (Not Yet Implemented)

### State Management

- No Pinia/Vuex yet - component-level state only
- Add when real player/queue data needed
- Consider for global user state, matchmaking status

### API Integration

- No HTTP client (Axios/Fetch) configured
- Will need endpoints for:
  - Queue status updates (WebSocket recommended)
  - Player list (WebSocket for real-time)
  - Draft picks validation
  - Map ban submissions
  - Match data persistence

### Backend TODO Comments

Look for `// TODO: connect backend later` comments in:

- `DraftView.vue` - Pick validation, WebSocket updates
- `VetoView.vue` - Ban validation, final map confirmation
- `QueueSection.vue` - Matchmaking API, real-time queue updates

## Common Tasks

### Update Color Scheme

Edit `src/styles/colors.css` - all components use CSS variables.

### Add New Route

1. Create view in `src/views/`
2. Add route to `src/router/index.js`:
   ```javascript
   {
     path: '/newpage',
     name: 'NewPage',
     component: () => import('@/views/NewPageView.vue')
   }
   ```
3. Add navigation tab to `Navbar.vue` if needed

### Change Draft Logic

Edit `DraftView.vue`:

- Modify `pickPlayer()` method for pick order
- Update `draftPool` array for more/fewer players
- Adjust `currentTurn` logic for different pick patterns

### Update Map Pool

Edit `VetoView.vue` `maps` array:

```javascript
const maps = ref([
  { id: 1, name: 'New Map', banned: false, bannedBy: null },
  // Add/remove maps here
]);
```

### Adjust Glow Intensity

Edit glow variables in `colors.css`:

```css
--cyan-glow: 0 0 30px rgba(75, 207, 250, 0.7); /* increase opacity */
```

## Testing & Quality

- **No linting**: ESLint not configured (add if code quality checks needed)
- **No testing**: Vitest/Jest not set up
- **No Prettier**: Manual formatting (add for team consistency)
- **Browser DevTools**: Install Vue.js devtools extension for debugging

## Navigation Routes

| Path            | View                | Description                      |
| --------------- | ------------------- | -------------------------------- |
| `/`             | Home.vue            | Queue page with player cards     |
| `/draft`        | DraftView.vue       | Captain draft system             |
| `/veto`         | VetoView.vue        | Map veto phase                   |
| `/maps`         | MapsView.vue        | Map pool browser                 |
| `/leaderboard`  | LeaderboardView.vue | WIP placeholder                  |
| `/stats`        | StatsView.vue       | WIP placeholder                  |
| `/profile`      | ProfileView.vue     | WIP placeholder                  |

---

**Last Updated**: Full expansion phase with navigation, draft system, and veto phase completed. Ready for backend integration.

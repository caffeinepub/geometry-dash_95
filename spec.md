# Geometry Dash

## Overview

Geometry Dash is a rhythm-based platformer built on the Internet Computer. Players control a cube that automatically scrolls forward, tapping to jump over spikes and obstacles timed to music. The game features three difficulty-tiered levels plus a sample level, multiple game modes (cube, ship, ball), a practice mode with checkpoints, and a player customization system with unlockable icons and colors. Authentication is handled via Internet Identity, with all progress stored on-chain.

## Authentication

- Requires Internet Identity authentication to play
- Anonymous access is not permitted for any game functionality
- All player data (progress, customization) is isolated by principal
- No profile/display name system — authentication is used solely for progress persistence

## Core Features

### Gameplay Mechanics

- Player cube automatically scrolls right at a constant speed
- Tap/click/press to interact (mode-specific behavior)
- Instant death on spike collision or falling into a pit
- Instant restart after 600ms death animation
- Full-screen HTML5 canvas rendering at any resolution
- Frame-rate-independent physics normalized to 120fps

### Game Modes

Three distinct player modes with different physics:

| Mode | Input                              | Physics                                    | Visual                              |
| ---- | ---------------------------------- | ------------------------------------------ | ----------------------------------- |
| Cube | Tap to jump (ground only)          | Standard gravity, single jump              | Rotating square with icon           |
| Ship | Hold to fly up, release to descend | Upward thrust + gravity, velocity clamped  | Wedge/rocket shape with flame trail |
| Ball | Tap to reverse gravity             | Toggles between falling down and rising up | Circle with cross pattern           |

Mode transitions happen via portals placed at specific positions. Levels 2 and 3 use portals to switch between modes; Levels 0 and 1 remain in their start mode throughout.

### Levels

4 levels (1 sample + 3 main) with increasing difficulty:

| Level | Name           | Difficulty | BPM   | Start Mode | Music File         | Length (tiles) |
| ----- | -------------- | ---------- | ----- | ---------- | ------------------ | -------------- |
| 0     | Test Drive     | sample     | 112.3 | cube       | newer-wave.opus    | 110            |
| 1     | Stereo Madness | easy       | 112.3 | cube       | newer-wave.opus    | 1,581          |
| 2     | Back On Track  | medium     | 136.0 | ship       | raving-energy.opus | 2,203          |
| 3     | Polargeist     | hard       | 143.6 | ball       | bleeping-demo.opus | 1,934          |

Each level defines:

- Obstacle layout (spikes and blocks positioned on a tile grid)
- Ground segments (with gaps that act as pits)
- Portal positions for mode transitions
- Unique background and accent colors

### Obstacle Types

| Type     | Behavior                                             | Collision                                                   |
| -------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| Spike    | Kills on contact                                     | Hitbox shrunk by 35% on each side for fairness              |
| Block    | Kills on side collision; can be landed on from above | Full AABB; top-landing detected via previous-frame position |
| Platform | Pass-through from sides; can be landed on from above | Top-landing only                                            |

### Level Progression

- Sample level (Test Drive) is always unlocked
- Level 1 is always unlocked
- Subsequent levels unlock by completing the previous level
- In practice mode, all levels are unlocked regardless of completion

### Practice Mode

- Toggle on/off from the level select screen
- 3 auto-computed checkpoints per level, placed at safe positions away from obstacles
- On death, respawn from the last activated checkpoint instead of the start
- Completions in practice mode do not count toward progression
- Checkpoints rendered as glowing diamond markers with vertical light beams

### Progress Tracking

- Level attempts counted per level
- Best progress percentage tracked (0-100%)
- Levels marked as completed when the player reaches the end
- Progress updates throttled to every 6 frames for React state efficiency

## Backend Data Storage

### Player Data

```
PlayerData {
  progress: PlayerProgress
  customization: PlayerCustomization
}
```

### Player Progress

- `levelsCompleted`: [Nat] — IDs of completed levels
- `levelAttempts`: [(Nat, Nat)] — (levelId, attemptCount) pairs
- `bestProgress`: [(Nat, Nat)] — (levelId, bestPercent) pairs

### Player Customization

- `unlockedIcons`: [Text] — icon IDs the player has unlocked
- `unlockedColors`: [Text] — color hex codes the player has unlocked
- `selectedIcon`: Text — currently equipped icon
- `selectedColor`: Text — currently equipped color

### Default State

New players start with:

- No levels completed, no attempts, no progress
- Icon: "cube" (unlocked), Color: "#00ff00" (green, unlocked)

## Backend Operations

### Authentication

- All endpoints require authenticated principal (non-anonymous)
- `Runtime.trap("Not authenticated")` on anonymous access

### Player Initialization

- `getPlayerData()`: Returns player data or null
- `initializePlayer()`: Creates default player data if not already initialized (idempotent)

### Progress Operations

- `recordLevelAttempt(levelId)`: Increments attempt count for a level
- `updateBestProgress(levelId, percent)`: Updates best progress if new percent exceeds current (percent must be 0-100)
- `completeLevel(levelId)`: Marks level as completed, sets best to 100%, unlocks reward icon and color

### Customization Operations

- `selectIcon(icon)`: Equips an icon (must be unlocked, traps otherwise)
- `selectColor(color)`: Equips a color (must be unlocked, traps otherwise)

### Unlockable Rewards

Each main level completion unlocks one icon and one color:

| Level | Icon Reward | Color Reward      |
| ----- | ----------- | ----------------- |
| 1     | Diamond     | Cyan (#00bfff)    |
| 2     | Star        | Orange (#ff6600)  |
| 3     | Triangle    | Magenta (#ff00ff) |

## User Interface

### Screens

1. **Login Screen** — Pre-authentication with floating geometric shapes, animated cube, and Internet Identity sign-in button
2. **Main Menu** — Play button, Customize button, Sign Out; displays player cube preview with pulse ring animation, star field, and floating shapes background
3. **Level Select** — Vertical list of all levels with difficulty badges, attempt counts, best progress bars, lock states, and practice mode toggle
4. **Game Canvas** — Full-screen canvas with HUD overlay showing level name, progress percentage, attempt count, and pause button
5. **Level Complete** — Trophy display, attempt count, unlocked rewards, and navigation to next level/replay/menu

### Dialogs

- **Customize Dialog** — Grid of unlockable icons and colors with lock states, live preview, and selection persistence
- **Pause Overlay** — Resume, music toggle, SFX toggle, and exit level buttons

### HUD Elements (During Gameplay)

- Progress bar (thin gradient bar at top of canvas)
- Progress percentage (large centered number)
- Level name (small label above percentage)
- Attempt counter (top-right)
- Practice mode badge (when active)
- Pause button (top-left)

## Audio System

Uses the Web Audio API directly (no external audio libraries). Three audio channels routed through a master gain node:

### Music

- Pre-loaded `.opus` files from `/assets/` directory
- Beat-synced pulse effect (visual background pulse on each beat interval)
- Music pauses/resumes with game pause, restarts on death
- Volume: 0.5 (when enabled)
- Music offset calculated from checkpoint position on practice mode restart

### Sound Effects

| Effect   | Waveform           | Frequency                | Trigger               |
| -------- | ------------------ | ------------------------ | --------------------- |
| Jump     | Sine sweep         | 400 → 800 Hz             | Tap in cube/ball mode |
| Death    | White noise + sine | Noise decay + 80 → 30 Hz | Player death          |
| Complete | Sine arpeggio      | C5 → E5 → G5 → C6        | Level completion      |

### Settings

- Music and SFX independently toggleable
- Settings persisted in Zustand store with localStorage

## Physics Constants

| Constant            | Value | Description                            |
| ------------------- | ----- | -------------------------------------- |
| TARGET_FPS          | 120   | Reference frame rate for physics       |
| GRAVITY             | 0.8   | Cube mode gravity                      |
| JUMP_VELOCITY       | -12   | Cube jump impulse                      |
| PLAYER_SPEED        | 6     | Horizontal scroll speed (pixels/frame) |
| TILE_SIZE           | 40    | Grid tile size in pixels               |
| PLAYER_SIZE         | 36    | Player hitbox size                     |
| SHIP_FLY_FORCE      | -0.7  | Ship upward thrust                     |
| SHIP_GRAVITY        | 0.4   | Ship downward pull                     |
| SHIP_MAX_VY         | 8     | Ship/ball max vertical velocity        |
| BALL_GRAVITY        | 0.7   | Ball mode gravity                      |
| BALL_CEILING_HEIGHT | 240   | Ceiling distance from ground (6 tiles) |
| SPIKE_HITBOX_SHRINK | 0.35  | Spike hitbox reduction factor          |
| GROUND_Y_OFFSET     | 100   | Ground distance from canvas bottom     |

## Rendering

### Canvas Renderer

Full-screen HTML5 Canvas 2D rendering with layered draw order:

1. **Background** — Gradient fill, parallax star field (120 stars), city skyline silhouettes, geometric shapes (3 parallax layers), retro scan lines
2. **Ground segments** — Gradient fill with grid lines and glowing top edge
3. **Ceiling** — Rendered during ship/ball modes with gradient and grid
4. **Obstacles** — Spikes (triangles with glow + highlight), blocks (rectangles with cross pattern + gradient), platforms (flat with hash marks)
5. **Portals** — Vertical light bars with mode-specific icon (square/wedge/circle), shimmer animation
6. **Checkpoints** — Diamond markers with vertical light beams (practice mode only)
7. **Player** — Mode-specific shape (cube with icon/ship with flame/ball with cross), glow effect
8. **Particles** — Death explosion particles (35 particles, gravity-affected, shrinking)
9. **Death flash** — White overlay fading out
10. **Progress bar** — Gradient bar with glowing tip

### Visual Effects

- Screen shake on death (5px intensity, 10 frames)
- White flash overlay on death (15 frames fade)
- Beat-synced background pulse (stars brighten, shapes scale)
- Death particle explosion (35 particles with varied sizes, colors, rotation)
- Parallax scrolling at 4 different speeds (0.03x, 0.05x, 0.1x, 0.2x)

## Design System

### Visual Approach

- Dark space-themed backgrounds with neon accent colors
- Each level has unique background/accent color pairing
- Glow effects on interactive elements and obstacles
- Retro scan lines and geometric shape overlays
- Grid patterns on ground/ceiling surfaces

### Theme

- Background: #06060f (near-black)
- Primary: #00ff88 (neon green)
- Accent: #00bfff (neon cyan)
- Display font: Orbitron (geometric/futuristic)
- Body font: Geist
- Mono font: Geist Mono

### Animations (Tailwind)

| Animation     | Duration                | Use                         |
| ------------- | ----------------------- | --------------------------- |
| cube-spin     | 2s linear infinite      | Login screen cube           |
| title-glow    | 3s ease-in-out infinite | Title neon glow             |
| float-drift   | 12s linear infinite     | Background geometric shapes |
| pulse-ring    | 2s ease-out infinite    | Player preview pulse        |
| slide-up-fade | 0.5s ease-out forwards  | Staggered content entrance  |
| ground-scroll | 4s linear infinite      | Menu ground spike scroll    |
| twinkle       | 3s ease-in-out infinite | Star field twinkle          |

### Neon Shadows

Custom box shadows for neon glow effects:

- `neon-green`: Triple-layer green glow (10px/40px/80px)
- `neon-cyan`: Triple-layer cyan glow
- `neon-magenta`: Triple-layer magenta glow

## State Management

### Zustand Store (gameStore)

- `screen`: Current screen (login/menu/levelSelect/playing/complete)
- `selectedLevel`: Currently selected level ID
- `practiceMode`: Whether practice mode is active
- `musicEnabled`: Music toggle (persisted to localStorage)
- `sfxEnabled`: SFX toggle (persisted to localStorage)

### TanStack Query

All backend interactions via query hooks in `useQueries.ts`:

- `usePlayerData()` — Fetches player data
- `useInitPlayer()` — Initializes new player
- `useRecordAttempt()` — Records level attempt
- `useUpdateProgress()` — Updates best progress percentage
- `useCompleteLevel()` — Marks level complete + invalidates player data
- `useSelectIcon()` — Changes equipped icon
- `useSelectColor()` — Changes equipped color

## Error Handling

### Authentication Errors

- "Not authenticated" — Attempting any operation without Internet Identity

### Validation Errors

- "Player not initialized" — Operations before `initializePlayer()` is called
- "Percent must be 0-100" — Invalid progress percentage
- "Icon not unlocked" — Selecting a locked icon
- "Color not unlocked" — Selecting a locked color

## Input Handling

### Controls

| Input                   | Action                  |
| ----------------------- | ----------------------- |
| Space / Arrow Up / W    | Tap (jump/gravity flip) |
| Mouse click / Touch     | Tap (jump/gravity flip) |
| Mouse hold / Touch hold | Hold (ship fly)         |
| Escape                  | Toggle pause            |

### Input Processing

- Tap vs hold distinction: tap consumed once per press, hold state tracked continuously
- Input processed before physics update each frame
- All input disabled when paused

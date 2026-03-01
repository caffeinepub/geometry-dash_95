// Frame-rate independence: all physics tuned for 120fps
export const TARGET_FPS = 120;
export const TARGET_FRAME_TIME = 1000 / TARGET_FPS;

// Physics
export const GRAVITY = 0.8;
export const JUMP_VELOCITY = -12;
export const PLAYER_SPEED = 6;
export const TILE_SIZE = 40;
export const PLAYER_SIZE = 36;

// Ship mode physics
export const SHIP_FLY_FORCE = -0.7;
export const SHIP_GRAVITY = 0.4;
export const SHIP_MAX_VY = 8;

// Ball mode physics
export const BALL_GRAVITY = 0.7;
export const BALL_CEILING_HEIGHT = TILE_SIZE * 6;

// Player position (stays fixed on screen)
export const PLAYER_SCREEN_X = 0.2; // 20% from left

// Ground
export const GROUND_Y_OFFSET = 100; // pixels from bottom of canvas

// Collision
export const SPIKE_HITBOX_SHRINK = 0.35; // shrink spike hitbox by this fraction on each side

// Effects
export const SCREEN_SHAKE_DURATION = 10; // frames
export const SCREEN_SHAKE_INTENSITY = 5; // pixels
export const DEATH_FLASH_DURATION = 15; // frames

// Number of practice checkpoints per level
export const PRACTICE_CHECKPOINT_COUNT = 3;

// Minimum distance (in pixels) a checkpoint must be from any obstacle
export const CHECKPOINT_SAFE_RADIUS = TILE_SIZE * 3;

// Unlockable definitions
export interface Unlockable {
  id: string;
  name: string;
  unlockedBy: string;
}

export const ICON_UNLOCKABLES: Unlockable[] = [
  { id: "cube", name: "Cube", unlockedBy: "default" },
  { id: "diamond", name: "Diamond", unlockedBy: "Level 1" },
  { id: "star", name: "Star", unlockedBy: "Level 2" },
  { id: "triangle", name: "Triangle", unlockedBy: "Level 3" },
];

export const COLOR_UNLOCKABLES: Unlockable[] = [
  { id: "#00ff00", name: "Green", unlockedBy: "default" },
  { id: "#00bfff", name: "Cyan", unlockedBy: "Level 1" },
  { id: "#ff6600", name: "Orange", unlockedBy: "Level 2" },
  { id: "#ff00ff", name: "Magenta", unlockedBy: "Level 3" },
];

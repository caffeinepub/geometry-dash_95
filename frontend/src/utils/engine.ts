import { type LevelData, type GameMode } from "./levels";
import {
  GRAVITY,
  JUMP_VELOCITY,
  PLAYER_SPEED,
  PLAYER_SIZE,
  GROUND_Y_OFFSET,
  TILE_SIZE,
  SPIKE_HITBOX_SHRINK,
  SHIP_FLY_FORCE,
  SHIP_GRAVITY,
  SHIP_MAX_VY,
  BALL_GRAVITY,
  BALL_CEILING_HEIGHT,
} from "./constants";

export interface PlayerState {
  x: number; // world x
  y: number; // screen y (top of player)
  vy: number;
  onGround: boolean;
  rotation: number;
  alive: boolean;
  mode: GameMode;
  gravityDirection: 1 | -1; // 1=down, -1=up (ball mode)
}

export interface EngineState {
  player: PlayerState;
  cameraX: number;
  progress: number; // 0-100
  completed: boolean;
}

export function createInitialState(
  canvasHeight: number,
  startX = 0,
  startMode: GameMode = "cube",
): EngineState {
  const groundY = canvasHeight - GROUND_Y_OFFSET;
  return {
    player: {
      x: startX,
      y: groundY - PLAYER_SIZE,
      vy: 0,
      onGround: true,
      rotation: 0,
      alive: true,
      mode: startMode,
      gravityDirection: 1,
    },
    cameraX: Math.max(0, startX - 100),
    progress: 0,
    completed: false,
  };
}

export function updateEngine(
  state: EngineState,
  level: LevelData,
  canvasWidth: number,
  canvasHeight: number,
  inputTap: boolean,
  inputHeld: boolean,
  dt: number,
): EngineState {
  if (!state.player.alive || state.completed) return state;

  const groundY = canvasHeight - GROUND_Y_OFFSET;
  const player = { ...state.player };

  // Horizontal movement
  player.x += PLAYER_SPEED * dt;

  // Portal collision - check if player crossed any portal
  for (const portal of level.portals) {
    const prevX = player.x - PLAYER_SPEED * dt;
    if (prevX < portal.x && player.x >= portal.x) {
      player.mode = portal.targetMode;
      player.vy = 0;
      if (portal.targetMode === "ball") {
        player.gravityDirection = 1;
      }
    }
  }

  // Mode-specific physics
  const { mode } = player;

  if (mode === "cube") {
    // Cube: tap to jump when on ground
    if (inputTap && player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
    }
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;

    // Rotation (spins when airborne)
    if (!player.onGround) {
      player.rotation += 0.12 * dt;
    } else {
      player.rotation =
        Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
    }
  } else if (mode === "ship") {
    // Ship: hold to fly up, release to descend
    if (inputHeld) {
      player.vy += SHIP_FLY_FORCE * dt;
    }
    player.vy += SHIP_GRAVITY * dt;
    player.vy = Math.max(-SHIP_MAX_VY, Math.min(SHIP_MAX_VY, player.vy));
    player.y += player.vy * dt;

    // Tilt angle based on vy
    player.rotation = player.vy * 0.04;

    // Ceiling clamp (don't fly off screen top)
    const ceilingY = groundY - BALL_CEILING_HEIGHT;
    if (player.y < ceilingY) {
      player.y = ceilingY;
      player.vy = 0;
    }
  } else if (mode === "ball") {
    // Ball: tap to reverse gravity
    if (inputTap) {
      player.gravityDirection = player.gravityDirection === 1 ? -1 : 1;
    }
    player.vy += BALL_GRAVITY * player.gravityDirection * dt;
    player.vy = Math.max(-SHIP_MAX_VY, Math.min(SHIP_MAX_VY, player.vy));
    player.y += player.vy * dt;

    // Continuous rotation proportional to speed
    player.rotation += 0.1 * player.gravityDirection * dt;
  }

  // Ground & ceiling collision
  player.onGround = false;
  const playerLeft = player.x;
  const playerRight = player.x + PLAYER_SIZE;
  const playerBottom = player.y + PLAYER_SIZE;
  const ceilingY = groundY - BALL_CEILING_HEIGHT;

  // Check ground segments
  let overGround = false;
  for (const seg of level.groundSegments) {
    if (playerRight > seg.start && playerLeft < seg.end) {
      overGround = true;

      // Floor collision
      if (playerBottom >= groundY && player.vy >= 0) {
        player.y = groundY - PLAYER_SIZE;
        player.vy = 0;
        player.onGround = true;
        if (mode === "ball") {
          player.gravityDirection = 1;
        }
      }

      // Ceiling collision (ship and ball modes)
      if (
        (mode === "ship" || mode === "ball") &&
        player.y <= ceilingY &&
        player.vy <= 0
      ) {
        player.y = ceilingY;
        player.vy = 0;
        if (mode === "ball") {
          player.onGround = true;
          player.gravityDirection = -1;
        }
      }
      break;
    }
  }

  // Pit death: if player is over a gap and has fallen halfway below ground, kill them
  if (!overGround && playerBottom > groundY + PLAYER_SIZE * 0.5) {
    player.alive = false;
  }

  // Check obstacle collisions
  for (const obs of level.obstacles) {
    const obsScreenY = groundY - obs.y - obs.height;

    if (obs.type === "spike") {
      const shrinkX = obs.width * SPIKE_HITBOX_SHRINK;
      const shrinkY = obs.height * SPIKE_HITBOX_SHRINK;
      if (
        aabbOverlap(
          playerLeft,
          player.y,
          PLAYER_SIZE,
          PLAYER_SIZE,
          obs.x + shrinkX,
          obsScreenY + shrinkY,
          obs.width - shrinkX * 2,
          obs.height - shrinkY,
        )
      ) {
        player.alive = false;
        break;
      }
    } else if (obs.type === "block") {
      if (
        aabbOverlap(
          playerLeft,
          player.y,
          PLAYER_SIZE,
          PLAYER_SIZE,
          obs.x,
          obsScreenY,
          obs.width,
          obs.height,
        )
      ) {
        const prevBottom = player.y - player.vy * dt + PLAYER_SIZE;
        if (prevBottom <= obsScreenY + 4 && player.vy >= 0) {
          player.y = obsScreenY - PLAYER_SIZE;
          player.vy = 0;
          player.onGround = true;
        } else {
          player.alive = false;
          break;
        }
      }
    } else if (obs.type === "platform") {
      if (
        aabbOverlap(
          playerLeft,
          player.y,
          PLAYER_SIZE,
          PLAYER_SIZE,
          obs.x,
          obsScreenY,
          obs.width,
          obs.height,
        )
      ) {
        const prevBottom = player.y - player.vy * dt + PLAYER_SIZE;
        if (prevBottom <= obsScreenY + 4 && player.vy >= 0) {
          player.y = obsScreenY - PLAYER_SIZE;
          player.vy = 0;
          player.onGround = true;
        }
      }
    }
  }

  // Fall off screen = death
  if (player.y > canvasHeight + 50) {
    player.alive = false;
  }

  // Camera follows player
  const targetCameraX = player.x - canvasWidth * 0.2;
  const cameraX = Math.max(0, targetCameraX);

  // Progress
  const progress = Math.min(100, (player.x / level.totalLength) * 100);

  // Level completion
  const completed = player.x >= level.totalLength;

  return {
    player,
    cameraX,
    progress,
    completed,
  };
}

function aabbOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

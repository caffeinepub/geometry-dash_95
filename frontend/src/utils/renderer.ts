import { type LevelData, type GameMode } from "./levels";
import {
  TILE_SIZE,
  PLAYER_SIZE,
  GROUND_Y_OFFSET,
  BALL_CEILING_HEIGHT,
} from "./constants";
import { type Particle, drawParticles } from "./particles";
import { lightenColor, darkenColor } from "./color";

export interface CheckpointRender {
  worldX: number;
  activated: boolean;
}

export interface RenderState {
  playerX: number; // world x
  playerY: number; // screen y
  playerRotation: number;
  playerColor: string;
  playerIcon: string;
  gameMode: GameMode;
  cameraX: number;
  canvasWidth: number;
  canvasHeight: number;
  groundY: number; // screen y of ground top
  particles: Particle[];
  shakeOffsetX: number;
  shakeOffsetY: number;
  flashAlpha: number;
  beatPulse: number; // 0-1, decays from 1 on beat
  progress: number; // 0-100
  isDead: boolean;
  checkpoints: CheckpointRender[];
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  level: LevelData,
  state: RenderState,
) {
  const { canvasWidth, canvasHeight, cameraX, groundY } = state;

  ctx.save();
  ctx.translate(state.shakeOffsetX, state.shakeOffsetY);

  // Background
  drawBackground(ctx, level, state);

  // Ground segments
  drawGround(ctx, level, state);

  // Ceiling (ship/ball modes)
  if (state.gameMode === "ship" || state.gameMode === "ball") {
    drawCeiling(ctx, level, state);
  }

  // Obstacles
  drawObstacles(ctx, level, state);

  // Portals
  if (level.portals.length > 0) {
    drawPortals(ctx, level, state);
  }

  // Checkpoints
  if (state.checkpoints.length > 0) {
    drawCheckpoints(ctx, state);
  }

  // Player
  if (!state.isDead) {
    drawPlayer(ctx, state);
  }

  // Particles
  drawParticles(ctx, state.particles, cameraX);

  ctx.restore();

  // Death flash overlay
  if (state.flashAlpha > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${state.flashAlpha})`;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // Progress bar (drawn on top)
  drawProgressBar(ctx, state);
}

// Generate deterministic star positions
function getStarField(
  count: number,
): { x: number; y: number; size: number; brightness: number }[] {
  const stars: { x: number; y: number; size: number; brightness: number }[] =
    [];
  let seed = 12345;
  const rng = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rng() * 4000,
      y: rng() * 1000,
      size: 0.5 + rng() * 2,
      brightness: 0.3 + rng() * 0.7,
    });
  }
  return stars;
}

const starField = getStarField(120);

function drawBackground(
  ctx: CanvasRenderingContext2D,
  level: LevelData,
  state: RenderState,
) {
  const { canvasWidth, canvasHeight, cameraX, beatPulse } = state;

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  grad.addColorStop(0, level.backgroundColor);
  grad.addColorStop(0.6, darkenColor(level.backgroundColor, 0.7));
  grad.addColorStop(1, darkenColor(level.backgroundColor, 0.4));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Layer 0: Stars (slowest parallax)
  const starOffset = cameraX * 0.03;
  ctx.save();
  for (const star of starField) {
    const sx = ((star.x - starOffset) % (canvasWidth + 200)) - 100;
    const sy = (star.y % canvasHeight) * 0.7;
    const twinkle = star.brightness + Math.sin(cameraX * 0.005 + star.x) * 0.2;
    ctx.globalAlpha = Math.max(0.1, Math.min(1, twinkle + beatPulse * 0.15));
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Layer 1: Far geometric silhouettes (city/mountain skyline)
  const skylineOffset = cameraX * 0.05;
  ctx.save();
  ctx.globalAlpha = 0.06 + beatPulse * 0.02;
  ctx.fillStyle = level.accentColor;
  const skylineY = canvasHeight * 0.65;
  for (let i = 0; i < 20; i++) {
    const bx = ((i * 180 - skylineOffset) % (canvasWidth + 400)) - 200;
    const bw = 30 + (i % 5) * 20;
    const bh = 40 + (i % 7) * 30;
    ctx.fillRect(bx, skylineY - bh, bw, bh);
  }
  ctx.restore();

  // Layer 2: Parallax geometric shapes
  const parallaxFactor = 0.1;
  const offset = cameraX * parallaxFactor;
  const pulseScale = 1 + beatPulse * 0.03;

  ctx.save();
  ctx.globalAlpha = 0.08 + beatPulse * 0.04;
  ctx.strokeStyle = level.accentColor;
  ctx.lineWidth = 1;

  for (let i = 0; i < 10; i++) {
    const bx = ((i * 200 - offset) % (canvasWidth + 200)) - 100;
    const by = 40 + (i % 4) * 100;
    const size = (25 + i * 8) * pulseScale;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate((i * Math.PI) / 4 + cameraX * 0.001);

    if (i % 4 === 0) {
      ctx.strokeRect(-size / 2, -size / 2, size, size);
    } else if (i % 4 === 1) {
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(size / 2, size / 2);
      ctx.lineTo(-size / 2, size / 2);
      ctx.closePath();
      ctx.stroke();
    } else if (i % 4 === 2) {
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Diamond
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(size / 2, 0);
      ctx.lineTo(0, size / 2);
      ctx.lineTo(-size / 2, 0);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  // Layer 3: Mid-speed smaller shapes
  const offset2 = cameraX * 0.2;
  ctx.globalAlpha = 0.04 + beatPulse * 0.02;
  for (let i = 0; i < 14; i++) {
    const bx = ((i * 140 - offset2) % (canvasWidth + 300)) - 150;
    const by = 80 + (i % 5) * 70;
    const size = 12 + (i % 5) * 5;
    ctx.beginPath();
    ctx.arc(bx, by, size * pulseScale, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();

  // Layer 4: Horizontal scan lines for retro feel
  ctx.save();
  ctx.globalAlpha = 0.02;
  ctx.strokeStyle = level.accentColor;
  ctx.lineWidth = 1;
  const scanOffset = (cameraX * 0.15) % 8;
  for (let y = scanOffset; y < canvasHeight; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  level: LevelData,
  state: RenderState,
) {
  const { cameraX, canvasWidth, groundY, canvasHeight } = state;

  for (const seg of level.groundSegments) {
    const screenStart = seg.start - cameraX;
    const screenEnd = seg.end - cameraX;

    if (screenEnd < 0 || screenStart > canvasWidth) continue;

    // Ground fill
    const grad = ctx.createLinearGradient(0, groundY, 0, canvasHeight);
    grad.addColorStop(0, level.accentColor);
    grad.addColorStop(0.1, darkenColor(level.accentColor, 0.6));
    grad.addColorStop(1, darkenColor(level.accentColor, 0.2));
    ctx.fillStyle = grad;
    ctx.fillRect(
      screenStart,
      groundY,
      screenEnd - screenStart,
      canvasHeight - groundY,
    );

    // Ground top line with glow
    ctx.save();
    ctx.shadowColor = level.accentColor;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = level.accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenStart, groundY);
    ctx.lineTo(screenEnd, groundY);
    ctx.stroke();
    ctx.restore();

    // Grid lines on ground
    ctx.strokeStyle = level.accentColor;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    const gridStart = Math.floor(seg.start / TILE_SIZE) * TILE_SIZE;
    for (let gx = gridStart; gx <= seg.end; gx += TILE_SIZE) {
      const sx = gx - cameraX;
      if (sx >= screenStart && sx <= screenEnd) {
        ctx.beginPath();
        ctx.moveTo(sx, groundY);
        ctx.lineTo(sx, canvasHeight);
        ctx.stroke();
      }
    }
    // Horizontal grid lines
    for (let gy = groundY + TILE_SIZE; gy < canvasHeight; gy += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(screenStart, gy);
      ctx.lineTo(screenEnd, gy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function drawObstacles(
  ctx: CanvasRenderingContext2D,
  level: LevelData,
  state: RenderState,
) {
  const { cameraX, canvasWidth, groundY } = state;

  for (const obs of level.obstacles) {
    const screenX = obs.x - cameraX;

    // Cull offscreen
    if (screenX + obs.width < -50 || screenX > canvasWidth + 50) continue;

    const obsScreenY = groundY - obs.y - obs.height;

    if (obs.type === "spike") {
      drawSpike(
        ctx,
        screenX,
        obsScreenY,
        obs.width,
        obs.height,
        level.accentColor,
      );
    } else if (obs.type === "block") {
      drawBlock(
        ctx,
        screenX,
        obsScreenY,
        obs.width,
        obs.height,
        level.accentColor,
      );
    } else if (obs.type === "platform") {
      drawPlatform(
        ctx,
        screenX,
        obsScreenY,
        obs.width,
        obs.height,
        level.accentColor,
      );
    }
  }
}

function drawSpike(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  // Glow layer
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Solid fill on top
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();

  // Inner lighter highlight
  ctx.fillStyle = lightenColor(color, 0.25);
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h * 0.2);
  ctx.lineTo(x + w * 0.7, y + h);
  ctx.lineTo(x + w * 0.3, y + h);
  ctx.closePath();
  ctx.fill();

  // Outline
  ctx.strokeStyle = lightenColor(color, 0.4);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.stroke();
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  // Glow layer
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.fillStyle = darkenColor(color, 0.5);
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  // Solid fill
  ctx.fillStyle = darkenColor(color, 0.5);
  ctx.fillRect(x, y, w, h);

  // Gradient overlay for depth
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, lightenColor(color, 0.15));
  grad.addColorStop(0.5, "transparent");
  grad.addColorStop(1, darkenColor(color, 0.3));
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.4;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;

  // Inner highlight
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

  // Inner cross pattern for visual interest
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.15;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 3);
  ctx.lineTo(x + w - 3, y + h - 3);
  ctx.moveTo(x + w - 3, y + 3);
  ctx.lineTo(x + 3, y + h - 3);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Outer edge glow
  ctx.strokeStyle = lightenColor(color, 0.3);
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}

function drawPlatform(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = darkenColor(color, 0.6);
  ctx.fillRect(x, y, w, h);

  // Top line with glow
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.restore();

  // Subtle hash marks
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 1;
  for (let hx = x + 8; hx < x + w; hx += 12) {
    ctx.beginPath();
    ctx.moveTo(hx, y);
    ctx.lineTo(hx, y + h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawCheckpoints(ctx: CanvasRenderingContext2D, state: RenderState) {
  const { cameraX, canvasWidth, groundY } = state;
  const time = Date.now() / 1000;

  for (let i = 0; i < state.checkpoints.length; i++) {
    const cp = state.checkpoints[i];
    const screenX = cp.worldX - cameraX;

    // Cull offscreen
    if (screenX < -60 || screenX > canvasWidth + 60) continue;

    const baseColor = cp.activated ? "#00ff88" : "#ffcc00";
    const pulseAlpha = 0.5 + Math.sin(time * 3 + i) * 0.2;
    const beamHeight = 120;
    const beamTop = groundY - beamHeight;

    // Vertical beam of light
    ctx.save();
    const beamGrad = ctx.createLinearGradient(
      screenX,
      beamTop,
      screenX,
      groundY,
    );
    beamGrad.addColorStop(0, "transparent");
    beamGrad.addColorStop(0.3, baseColor);
    beamGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = beamGrad;
    ctx.lineWidth = 3;
    ctx.globalAlpha = pulseAlpha * 0.6;
    ctx.beginPath();
    ctx.moveTo(screenX, beamTop);
    ctx.lineTo(screenX, groundY);
    ctx.stroke();

    // Outer glow beam
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 12;
    ctx.globalAlpha = pulseAlpha * 0.1;
    ctx.beginPath();
    ctx.moveTo(screenX, beamTop + 20);
    ctx.lineTo(screenX, groundY);
    ctx.stroke();
    ctx.restore();

    // Diamond marker at top of beam
    const diamondY = beamTop + 15;
    const diamondSize = 12 + Math.sin(time * 2 + i) * 2;

    ctx.save();
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = cp.activated ? 20 : 12;
    ctx.fillStyle = baseColor;
    ctx.globalAlpha = cp.activated ? 0.9 : 0.7;
    ctx.beginPath();
    ctx.moveTo(screenX, diamondY - diamondSize);
    ctx.lineTo(screenX + diamondSize * 0.7, diamondY);
    ctx.lineTo(screenX, diamondY + diamondSize);
    ctx.lineTo(screenX - diamondSize * 0.7, diamondY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Inner highlight on diamond
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = cp.activated ? 0.5 : 0.25;
    const innerSize = diamondSize * 0.5;
    ctx.beginPath();
    ctx.moveTo(screenX, diamondY - innerSize);
    ctx.lineTo(screenX + innerSize * 0.7, diamondY);
    ctx.lineTo(screenX, diamondY + innerSize);
    ctx.lineTo(screenX - innerSize * 0.7, diamondY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Label
    ctx.save();
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = baseColor;
    ctx.globalAlpha = pulseAlpha * 0.8;
    ctx.fillText(cp.activated ? "✓" : `CP${i + 1}`, screenX, beamTop + 2);
    ctx.restore();

    // Ground ring effect
    ctx.save();
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = pulseAlpha * 0.3;
    ctx.beginPath();
    ctx.ellipse(screenX, groundY, 20, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCeiling(
  ctx: CanvasRenderingContext2D,
  level: LevelData,
  state: RenderState,
) {
  const { cameraX, canvasWidth, groundY } = state;
  const ceilingY = groundY - BALL_CEILING_HEIGHT;

  for (const seg of level.groundSegments) {
    const screenStart = seg.start - cameraX;
    const screenEnd = seg.end - cameraX;

    if (screenEnd < 0 || screenStart > canvasWidth) continue;

    // Ceiling fill
    const grad = ctx.createLinearGradient(0, 0, 0, ceilingY);
    grad.addColorStop(0, darkenColor(level.accentColor, 0.2));
    grad.addColorStop(0.9, darkenColor(level.accentColor, 0.6));
    grad.addColorStop(1, level.accentColor);
    ctx.fillStyle = grad;
    ctx.fillRect(screenStart, 0, screenEnd - screenStart, ceilingY);

    // Ceiling bottom line with glow
    ctx.save();
    ctx.shadowColor = level.accentColor;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = level.accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenStart, ceilingY);
    ctx.lineTo(screenEnd, ceilingY);
    ctx.stroke();
    ctx.restore();

    // Grid lines on ceiling
    ctx.strokeStyle = level.accentColor;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    const gridStart = Math.floor(seg.start / TILE_SIZE) * TILE_SIZE;
    for (let gx = gridStart; gx <= seg.end; gx += TILE_SIZE) {
      const sx = gx - cameraX;
      if (sx >= screenStart && sx <= screenEnd) {
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, ceilingY);
        ctx.stroke();
      }
    }
    for (let gy = ceilingY - TILE_SIZE; gy > 0; gy -= TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(screenStart, gy);
      ctx.lineTo(screenEnd, gy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function drawPortals(
  ctx: CanvasRenderingContext2D,
  level: LevelData,
  state: RenderState,
) {
  const { cameraX, canvasWidth, groundY } = state;
  const time = Date.now() / 1000;
  const ceilingY = groundY - BALL_CEILING_HEIGHT;

  for (const portal of level.portals) {
    const screenX = portal.x - cameraX;
    if (screenX < -60 || screenX > canvasWidth + 60) continue;

    // Color based on target mode
    let color: string;
    if (portal.targetMode === "ship") {
      color = "#00ddff";
    } else if (portal.targetMode === "ball") {
      color = "#cc44ff";
    } else {
      color = "#44ff44";
    }

    const portalHeight = groundY - ceilingY;
    const portalTop = ceilingY;
    const shimmer = Math.sin(time * 4) * 0.15 + 0.85;

    // Two vertical bars
    for (const offset of [-8, 8]) {
      const bx = screenX + offset;

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 20 * shimmer;
      ctx.globalAlpha = 0.8 * shimmer;

      const grad = ctx.createLinearGradient(bx, portalTop, bx, groundY);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.15, color);
      grad.addColorStop(0.5, lightenColor(color, 0.3));
      grad.addColorStop(0.85, color);
      grad.addColorStop(1, "transparent");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.moveTo(bx, portalTop);
      ctx.lineTo(bx, groundY);
      ctx.stroke();
      ctx.restore();
    }

    // Inner glow fill between bars
    ctx.save();
    ctx.globalAlpha = 0.1 * shimmer;
    ctx.fillStyle = color;
    ctx.fillRect(screenX - 8, portalTop, 16, portalHeight);
    ctx.restore();

    // Mode icon at center
    const iconY = portalTop + portalHeight / 2;
    ctx.save();
    ctx.globalAlpha = 0.9 * shimmer;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    if (portal.targetMode === "ship") {
      // Arrow/wedge icon
      ctx.beginPath();
      ctx.moveTo(screenX + 10, iconY);
      ctx.lineTo(screenX - 8, iconY - 8);
      ctx.lineTo(screenX - 4, iconY);
      ctx.lineTo(screenX - 8, iconY + 8);
      ctx.closePath();
      ctx.fill();
    } else if (portal.targetMode === "ball") {
      // Circle icon
      ctx.beginPath();
      ctx.arc(screenX, iconY, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Square icon (cube)
      ctx.fillRect(screenX - 7, iconY - 7, 14, 14);
    }
    ctx.restore();
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: RenderState) {
  const {
    playerX,
    playerY,
    playerRotation,
    playerColor,
    playerIcon,
    gameMode,
    cameraX,
  } = state;
  const screenX = playerX - cameraX;
  const size = PLAYER_SIZE;
  const centerX = screenX + size / 2;
  const centerY = playerY + size / 2;

  if (gameMode === "ship") {
    drawShipPlayer(ctx, centerX, centerY, size, playerRotation, playerColor);
  } else if (gameMode === "ball") {
    drawBallPlayer(ctx, centerX, centerY, size, playerRotation, playerColor);
  } else {
    drawCubePlayer(
      ctx,
      centerX,
      centerY,
      size,
      playerRotation,
      playerColor,
      playerIcon,
    );
  }

  // Multi-layer glow effect (same for all modes)
  ctx.save();
  ctx.shadowColor = playerColor;
  ctx.shadowBlur = 20;
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = playerColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, size / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCubePlayer(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  color: string,
  icon: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  // Main square
  ctx.fillStyle = color;
  ctx.fillRect(-size / 2, -size / 2, size, size);

  // Inner design based on icon
  ctx.fillStyle = darkenColor(color, 0.4);
  ctx.strokeStyle = lightenColor(color, 0.5);
  ctx.lineWidth = 2;

  const innerSize = size * 0.55;
  const half = innerSize / 2;

  switch (icon) {
    case "diamond":
      ctx.beginPath();
      ctx.moveTo(0, -half);
      ctx.lineTo(half, 0);
      ctx.lineTo(0, half);
      ctx.lineTo(-half, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "star": {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const outerR = half;
        const innerR = half * 0.4;
        ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
        const midAngle = angle + Math.PI / 5;
        ctx.lineTo(Math.cos(midAngle) * innerR, Math.sin(midAngle) * innerR);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "triangle":
      ctx.beginPath();
      ctx.moveTo(0, -half);
      ctx.lineTo(half, half);
      ctx.lineTo(-half, half);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    default:
      ctx.strokeRect(-half / 2, -half / 2, half, half);
      break;
  }

  // Outer border
  ctx.strokeStyle = lightenColor(color, 0.3);
  ctx.lineWidth = 2;
  ctx.strokeRect(-size / 2, -size / 2, size, size);

  ctx.restore();
}

function drawShipPlayer(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  color: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  const s = size * 0.6;

  // Main wedge/rocket shape
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(-s * 0.6, -s * 0.8);
  ctx.lineTo(-s * 0.3, 0);
  ctx.lineTo(-s * 0.6, s * 0.8);
  ctx.closePath();
  ctx.fill();

  // Inner highlight
  ctx.fillStyle = lightenColor(color, 0.3);
  ctx.beginPath();
  ctx.moveTo(s * 0.7, 0);
  ctx.lineTo(-s * 0.2, -s * 0.4);
  ctx.lineTo(-s * 0.05, 0);
  ctx.lineTo(-s * 0.2, s * 0.4);
  ctx.closePath();
  ctx.fill();

  // Outline
  ctx.strokeStyle = lightenColor(color, 0.5);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(-s * 0.6, -s * 0.8);
  ctx.lineTo(-s * 0.3, 0);
  ctx.lineTo(-s * 0.6, s * 0.8);
  ctx.closePath();
  ctx.stroke();

  // Engine glow
  ctx.fillStyle = lightenColor(color, 0.6);
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(-s * 0.3, 0, s * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();

  // Trailing flame effect
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = lightenColor(color, 0.5);
  const flameLen = 8 + Math.random() * 6;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.5, cy);
  ctx.lineTo(cx - size * 0.5 - flameLen, cy - 3);
  ctx.lineTo(cx - size * 0.5 - flameLen, cy + 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBallPlayer(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  color: string,
) {
  const r = size / 2 - 1;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  // Main circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Inner design - cross pattern
  ctx.strokeStyle = darkenColor(color, 0.4);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, 0);
  ctx.lineTo(r * 0.6, 0);
  ctx.moveTo(0, -r * 0.6);
  ctx.lineTo(0, r * 0.6);
  ctx.stroke();

  // Inner circle
  ctx.strokeStyle = lightenColor(color, 0.4);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
  ctx.stroke();

  // Outer ring
  ctx.strokeStyle = lightenColor(color, 0.3);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawProgressBar(ctx: CanvasRenderingContext2D, state: RenderState) {
  const { canvasWidth, progress } = state;
  const barHeight = 3;
  const barY = 0;
  const barWidth = canvasWidth * (progress / 100);

  // Background
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.fillRect(0, barY, canvasWidth, barHeight);

  // Progress with glow
  ctx.save();
  ctx.shadowColor = "#00ff88";
  ctx.shadowBlur = 6;
  const grad = ctx.createLinearGradient(0, 0, barWidth, 0);
  grad.addColorStop(0, "#00ff88");
  grad.addColorStop(1, "#00bfff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, barY, barWidth, barHeight);
  ctx.restore();

  // Bright tip
  if (barWidth > 2) {
    ctx.save();
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(barWidth - 2, barY, 2, barHeight);
    ctx.restore();
  }
}

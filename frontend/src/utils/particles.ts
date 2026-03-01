import { lightenColor } from "./color";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  initialSize: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
  glow: boolean;
}

export function spawnDeathParticles(
  x: number,
  y: number,
  color: string,
  count = 35,
): Particle[] {
  const particles: Particle[] = [];
  const colors = [
    color,
    color,
    color,
    lightenColor(color, 0.5),
    lightenColor(color, 0.8),
    "#ffffff",
  ];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
    const speed = 1.5 + Math.random() * 8;
    const size = 2 + Math.random() * 8;
    const life = 25 + Math.random() * 30;
    particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 2,
      size,
      initialSize: size,
      color: colors[i % colors.length],
      life,
      maxLife: life,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.4,
      glow: i < 8,
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[], dt: number): Particle[] {
  const alive: Particle[] = [];
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.12 * dt;
    p.vx *= Math.pow(0.97, dt);
    p.life -= dt;
    p.rotation += p.rotationSpeed * dt;
    // Shrink over lifetime
    const lifeRatio = p.life / p.maxLife;
    p.size = p.initialSize * Math.max(0.1, lifeRatio);
    if (p.life > 0) {
      alive.push(p);
    }
  }
  return alive;
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  cameraX: number,
) {
  for (const p of particles) {
    const alpha = (p.life / p.maxLife) ** 0.7;
    const screenX = p.x - cameraX;
    const screenY = p.y;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = alpha;

    // Glow layer for the first few particles
    if (p.glow && alpha > 0.3) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.size * 3;
    }

    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

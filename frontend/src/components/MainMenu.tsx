import { Play, Palette, LogOut } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { PlayerIcon } from "./shared/PlayerIcon";

interface MainMenuProps {
  onPlay: () => void;
  onCustomize: () => void;
  playerColor: string;
  playerIcon: string;
}

// Twinkling star field
function StarField({ color }: { color: string }) {
  const stars = useMemo(() => {
    const items: {
      x: number;
      y: number;
      size: number;
      delay: number;
      duration: number;
      brightness: number;
    }[] = [];
    for (let i = 0; i < 60; i++) {
      items.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        delay: Math.random() * 6,
        duration: 2 + Math.random() * 4,
        brightness: 0.15 + Math.random() * 0.45,
      });
    }
    return items;
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute animate-twinkle rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            backgroundColor: i % 3 === 0 ? color : "rgba(255,255,255,0.6)",
            opacity: s.brightness,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            boxShadow:
              i % 3 === 0 ? `0 0 ${s.size * 3}px ${color}40` : undefined,
          }}
        />
      ))}
    </div>
  );
}

// Floating background shapes for the animated game-world feel
function FloatingShapes({ color }: { color: string }) {
  const shapes = useMemo(() => {
    const items: {
      type: string;
      x: number;
      y: number;
      size: number;
      delay: number;
      duration: number;
      rotation: number;
    }[] = [];
    const types = ["spike", "square", "diamond", "circle", "triangle"];
    for (let i = 0; i < 22; i++) {
      items.push({
        type: types[i % types.length],
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 14 + Math.random() * 36,
        delay: Math.random() * 12,
        duration: 10 + Math.random() * 14,
        rotation: Math.random() * 360,
      });
    }
    return items;
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {shapes.map((s, i) => (
        <div
          key={i}
          className="absolute animate-float-drift"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        >
          <svg
            width={s.size}
            height={s.size}
            viewBox="0 0 40 40"
            style={{ transform: `rotate(${s.rotation}deg)` }}
          >
            {s.type === "spike" && (
              <polygon
                points="20,2 38,38 2,38"
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                opacity="0.18"
              />
            )}
            {s.type === "square" && (
              <rect
                x="4"
                y="4"
                width="32"
                height="32"
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                opacity="0.15"
              />
            )}
            {s.type === "diamond" && (
              <polygon
                points="20,2 38,20 20,38 2,20"
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                opacity="0.15"
              />
            )}
            {s.type === "circle" && (
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                opacity="0.12"
              />
            )}
            {s.type === "triangle" && (
              <polygon
                points="20,4 36,36 4,36"
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                opacity="0.15"
              />
            )}
          </svg>
        </div>
      ))}
    </div>
  );
}

// Horizontal grid lines for depth perspective
function GridOverlay({ color }: { color: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Horizontal lines fading toward top */}
      {[85, 78, 72, 67, 63, 60].map((y, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 h-px"
          style={{
            top: `${y}%`,
            backgroundColor: color,
            opacity: 0.04 + (i === 0 ? 0.04 : 0) - i * 0.005,
          }}
        />
      ))}
      {/* Vertical accent lines on sides */}
      <div
        className="absolute left-[8%] top-[55%] h-[35%] w-px"
        style={{
          background: `linear-gradient(to bottom, transparent, ${color}15, transparent)`,
        }}
      />
      <div
        className="absolute right-[8%] top-[55%] h-[35%] w-px"
        style={{
          background: `linear-gradient(to bottom, transparent, ${color}12, transparent)`,
        }}
      />
      <div
        className="absolute left-[22%] top-[60%] h-[28%] w-px"
        style={{
          background: `linear-gradient(to bottom, transparent, ${color}0a, transparent)`,
        }}
      />
      <div
        className="absolute right-[22%] top-[60%] h-[28%] w-px"
        style={{
          background: `linear-gradient(to bottom, transparent, ${color}0a, transparent)`,
        }}
      />
    </div>
  );
}

// Ambient glow behind content
function AmbientGlow({ color }: { color: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Central radial glow */}
      <div
        className="absolute left-1/2 top-[40%] h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: `radial-gradient(ellipse, ${color}0c 0%, transparent 70%)`,
        }}
      />
      {/* Lower accent glow */}
      <div
        className="absolute bottom-0 left-1/2 h-[300px] w-[90%] -translate-x-1/2 rounded-full"
        style={{
          background: `radial-gradient(ellipse at bottom, ${color}08 0%, transparent 70%)`,
        }}
      />
      {/* Subtle side accents */}
      <div
        className="absolute left-0 top-1/2 h-[400px] w-[200px] -translate-y-1/2 rounded-full"
        style={{
          background: `radial-gradient(ellipse at left, ${color}06 0%, transparent 80%)`,
        }}
      />
      <div
        className="absolute right-0 top-1/2 h-[400px] w-[200px] -translate-y-1/2 rounded-full"
        style={{
          background: `radial-gradient(ellipse at right, ${color}06 0%, transparent 80%)`,
        }}
      />
    </div>
  );
}

// Ground section with platforms, spikes, and pillars
function GroundLine({ color }: { color: string }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-28 overflow-hidden">
      {/* Ground gradient fade - taller and more visible */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to top, ${color}12 0%, ${color}06 40%, transparent 100%)`,
        }}
      />
      {/* Platform silhouettes */}
      <div
        className="absolute bottom-5 left-[5%] h-8 w-20 rounded-t-sm"
        style={{
          backgroundColor: `${color}0c`,
          borderTop: `1px solid ${color}18`,
        }}
      />
      <div
        className="absolute bottom-5 left-[30%] h-5 w-14 rounded-t-sm"
        style={{
          backgroundColor: `${color}09`,
          borderTop: `1px solid ${color}14`,
        }}
      />
      <div
        className="absolute bottom-5 right-[12%] h-10 w-16 rounded-t-sm"
        style={{
          backgroundColor: `${color}0b`,
          borderTop: `1px solid ${color}16`,
        }}
      />
      <div
        className="absolute bottom-5 right-[35%] h-6 w-12 rounded-t-sm"
        style={{
          backgroundColor: `${color}08`,
          borderTop: `1px solid ${color}12`,
        }}
      />
      {/* Pillar accents */}
      <div
        className="absolute bottom-5 left-[15%] h-16 w-1"
        style={{
          background: `linear-gradient(to top, ${color}18, transparent)`,
        }}
      />
      <div
        className="absolute bottom-5 right-[20%] h-12 w-1"
        style={{
          background: `linear-gradient(to top, ${color}14, transparent)`,
        }}
      />
      {/* Main grid line */}
      <div
        className="absolute bottom-5 left-0 right-0 h-px"
        style={{ backgroundColor: `${color}30` }}
      />
      {/* Scrolling spikes - bigger and more visible */}
      <div className="absolute bottom-5 left-0 flex animate-ground-scroll">
        {Array.from({ length: 50 }).map((_, i) => (
          <svg
            key={i}
            width="28"
            height="16"
            viewBox="0 0 28 16"
            className="flex-shrink-0"
          >
            <polygon points="14,0 28,16 0,16" fill={color} opacity="0.1" />
          </svg>
        ))}
      </div>
    </div>
  );
}

export function MainMenu({
  onPlay,
  onCustomize,
  playerColor,
  playerIcon,
}: MainMenuProps) {
  const { clear } = useInternetIdentity();

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center bg-background">
      <StarField color={playerColor} />
      <AmbientGlow color={playerColor} />
      <GridOverlay color={playerColor} />
      <FloatingShapes color={playerColor} />
      <GroundLine color={playerColor} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Title */}
        <div className="mb-3 animate-slide-up-fade">
          <h1 className="text-center font-display text-5xl font-black uppercase tracking-wider text-foreground sm:text-6xl">
            Geometry{" "}
            <span className="animate-title-glow" style={{ color: playerColor }}>
              Dash
            </span>
          </h1>
        </div>
        <p
          className="mb-12 animate-slide-up-fade text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground"
          style={{ animationDelay: "0.1s" }}
        >
          Rhythm-based platformer
        </p>

        {/* Player cube preview with pulse ring */}
        <div
          className="relative mb-12 animate-slide-up-fade"
          style={{ animationDelay: "0.2s" }}
        >
          {/* Pulse ring */}
          <div
            className="absolute inset-0 animate-pulse-ring rounded-lg"
            style={{
              border: `2px solid ${playerColor}`,
              opacity: 0.3,
            }}
          />
          <div
            className="flex h-24 w-24 items-center justify-center rounded-lg border-2"
            style={{
              borderColor: playerColor,
              backgroundColor: `${playerColor}12`,
              boxShadow: `0 0 30px ${playerColor}30, 0 0 60px ${playerColor}10, inset 0 0 20px ${playerColor}08`,
            }}
          >
            <PlayerIcon icon={playerIcon} color={playerColor} size={44} />
          </div>
        </div>

        {/* Action buttons */}
        <div
          className="flex animate-slide-up-fade flex-col gap-3"
          style={{ animationDelay: "0.3s" }}
        >
          {/* Play button - the hero */}
          <button
            onClick={onPlay}
            className="group relative flex w-64 items-center justify-center gap-2.5 rounded-lg px-8 py-3.5 font-display text-base font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              backgroundColor: playerColor,
              color: "var(--background)",
              boxShadow: `0 0 20px ${playerColor}40, 0 0 50px ${playerColor}15`,
            }}
          >
            <Play className="h-5 w-5" />
            Play
            {/* Hover glow intensify */}
            <div
              className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{
                boxShadow: `0 0 30px ${playerColor}60, 0 0 80px ${playerColor}25`,
              }}
            />
          </button>

          {/* Customize button */}
          <button
            onClick={onCustomize}
            className={cn(
              "group flex w-64 items-center justify-center gap-2.5 rounded-lg border px-8 py-3 font-display text-sm font-semibold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
              "border-white/15 text-white/80 hover:border-white/30 hover:text-white",
            )}
          >
            <Palette className="h-4 w-4" />
            Customize
          </button>

          {/* Sign out */}
          <button
            onClick={clear}
            className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

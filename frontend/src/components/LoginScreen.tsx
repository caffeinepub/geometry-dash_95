import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

export function LoginScreen() {
  const { login, isInitializing, isLoggingIn } = useInternetIdentity();

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center bg-background">
      <FloatingGeometry />

      <div className="relative z-10 flex flex-col items-center">
        {/* Title */}
        <div className="mb-3 animate-slide-up-fade">
          <h1 className="text-center font-display text-5xl font-black uppercase tracking-wider text-foreground sm:text-6xl">
            Geometry{" "}
            <span className="animate-title-glow text-primary">Dash</span>
          </h1>
        </div>
        <p
          className="mb-14 animate-slide-up-fade text-sm uppercase tracking-[0.3em] text-muted-foreground"
          style={{ animationDelay: "0.1s" }}
        >
          Tap. Jump. Don't die.
        </p>

        {/* Animated cube */}
        <div
          className="relative mb-14 animate-slide-up-fade"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="absolute inset-0 animate-pulse-ring rounded-md border-2 border-primary opacity-30" />
          <div className="h-16 w-16 animate-cube-spin rounded-md border-2 border-primary bg-primary/15 shadow-neon-green" />
        </div>

        {/* Sign in button */}
        <button
          onClick={login}
          disabled={isInitializing || isLoggingIn}
          className="group relative mb-5 animate-slide-up-fade rounded-lg bg-primary px-8 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-neon-green transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-60 sm:px-10 sm:text-base"
          style={{ animationDelay: "0.3s" }}
        >
          <span className="flex items-center gap-2">
            {(isInitializing || isLoggingIn) && (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}
            {isInitializing
              ? "Loading..."
              : isLoggingIn
                ? "Connecting..."
                : "Sign In with Internet Identity"}
          </span>
        </button>

        <p
          className="animate-slide-up-fade text-xs text-muted-foreground"
          style={{ animationDelay: "0.4s" }}
        >
          Powered by Internet Identity
        </p>
      </div>
    </div>
  );
}

function FloatingGeometry() {
  const shapes = useMemo(() => {
    const items: {
      x: number;
      y: number;
      size: number;
      delay: number;
      duration: number;
      rotation: number;
    }[] = [];
    for (let i = 0; i < 12; i++) {
      items.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 14 + Math.random() * 24,
        delay: Math.random() * 10,
        duration: 10 + Math.random() * 12,
        rotation: Math.random() * 360,
      });
    }
    return items;
  }, []);

  const types = ["spike", "square", "diamond", "circle"];

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
            {types[i % types.length] === "spike" && (
              <polygon
                points="20,2 38,38 2,38"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="1.5"
                opacity="0.1"
              />
            )}
            {types[i % types.length] === "square" && (
              <rect
                x="4"
                y="4"
                width="32"
                height="32"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.5"
                opacity="0.08"
              />
            )}
            {types[i % types.length] === "diamond" && (
              <polygon
                points="20,2 38,20 20,38 2,20"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="1.5"
                opacity="0.08"
              />
            )}
            {types[i % types.length] === "circle" && (
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.5"
                opacity="0.06"
              />
            )}
          </svg>
        </div>
      ))}
    </div>
  );
}

import { Pause, Play, ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { useGameStore } from "../stores/gameStore";

interface GameHUDProps {
  progress: number;
  attempts: number;
  practiceMode: boolean;
  paused: boolean;
  onPause: () => void;
  onExit: () => void;
  levelName: string;
}

export function GameHUD({
  progress,
  attempts,
  practiceMode,
  paused,
  onPause,
  onExit,
  levelName,
}: GameHUDProps) {
  const { musicEnabled, setMusicEnabled, sfxEnabled, setSfxEnabled } =
    useGameStore();

  return (
    <>
      {/* Top bar */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-start justify-between p-3 pt-4 sm:p-4 sm:pt-5">
        <div className="pointer-events-auto flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPause();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            {paused ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span className="font-display text-[10px] font-medium uppercase tracking-wider text-white/40">
            {levelName}
          </span>
          <span className="font-mono text-xl font-bold text-white">
            {progress}%
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {practiceMode && (
            <span className="rounded-md bg-yellow-500/15 px-2 py-1 font-display text-[9px] font-bold uppercase tracking-wider text-yellow-400 sm:px-2.5 sm:text-[10px]">
              Practice
            </span>
          )}
          <span className="font-mono text-xs text-white/40 sm:text-sm">
            Attempt {attempts}
          </span>
        </div>
      </div>

      {/* Pause overlay */}
      {paused && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <h2 className="mb-10 font-display text-3xl font-black uppercase tracking-wider text-foreground">
            Paused
          </h2>
          <div className="flex flex-col gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPause();
              }}
              className="flex w-48 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-neon-green transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              <Play className="h-4 w-4" />
              Resume
            </button>

            <div className="flex justify-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMusicEnabled(!musicEnabled);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white/70 transition-colors hover:border-white/25 hover:text-white"
              >
                {musicEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSfxEnabled(!sfxEnabled);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white/70 transition-colors hover:border-white/25 hover:text-white"
              >
                <span className="font-display text-[9px] font-bold uppercase">
                  {sfxEnabled ? "SFX" : "---"}
                </span>
              </button>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onExit();
              }}
              className="flex w-48 items-center justify-center gap-2 rounded-lg border border-white/15 px-6 py-3 font-display text-sm font-semibold uppercase tracking-wider text-white/70 transition-all hover:border-white/25 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Exit Level
            </button>
          </div>
        </div>
      )}
    </>
  );
}

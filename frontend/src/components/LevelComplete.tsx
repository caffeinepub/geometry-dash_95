import { Play, ArrowRight, Home, Trophy } from "lucide-react";
import { LEVELS } from "../utils/levels";
import { useGameStore } from "../stores/gameStore";
import { ICON_UNLOCKABLES, COLOR_UNLOCKABLES } from "../utils/constants";

interface LevelCompleteProps {
  levelId: number;
  attempts: number;
  playerData:
    | {
        progress: {
          levelsCompleted: bigint[];
          levelAttempts: [bigint, bigint][];
          bestProgress: [bigint, bigint][];
        };
        customization: {
          unlockedIcons: string[];
          unlockedColors: string[];
          selectedIcon: string;
          selectedColor: string;
        };
      }
    | null
    | undefined;
}

export function LevelComplete({
  levelId,
  attempts,
  playerData,
}: LevelCompleteProps) {
  const { setScreen, setSelectedLevel } = useGameStore();
  const level = LEVELS.find((l) => l.id === levelId)!;
  const nextLevel = LEVELS.find((l) => l.id === levelId + 1);

  const unlockedIcon = ICON_UNLOCKABLES.find(
    (u) => u.unlockedBy === `Level ${levelId}`,
  );
  const unlockedColor = COLOR_UNLOCKABLES.find(
    (u) => u.unlockedBy === `Level ${levelId}`,
  );

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
      {/* Trophy icon */}
      <div
        className="mb-8 animate-slide-up-fade flex h-24 w-24 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: `${level.accentColor}10`,
          boxShadow: `0 0 40px ${level.accentColor}20, 0 0 80px ${level.accentColor}08`,
        }}
      >
        <Trophy className="h-12 w-12" style={{ color: level.accentColor }} />
      </div>

      <h1
        className="mb-2 animate-slide-up-fade font-display text-3xl font-black uppercase tracking-wider text-foreground"
        style={{ animationDelay: "0.1s" }}
      >
        Level Complete
      </h1>
      <p
        className="mb-1 animate-slide-up-fade font-display text-lg font-bold uppercase tracking-wide"
        style={{ color: level.accentColor, animationDelay: "0.15s" }}
      >
        {level.name}
      </p>
      <p
        className="mb-10 animate-slide-up-fade text-sm text-muted-foreground"
        style={{ animationDelay: "0.2s" }}
      >
        Completed in {attempts} {attempts === 1 ? "attempt" : "attempts"}
      </p>

      {/* Rewards */}
      {(unlockedIcon || unlockedColor) && (
        <div
          className="mb-10 animate-slide-up-fade rounded-xl border border-white/8 bg-card p-5"
          style={{ animationDelay: "0.25s" }}
        >
          <p className="mb-4 text-center font-display text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Rewards Unlocked
          </p>
          <div className="flex gap-5">
            {unlockedIcon && (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-lg border"
                  style={{
                    borderColor: `${level.accentColor}30`,
                    backgroundColor: `${level.accentColor}08`,
                    boxShadow: `0 0 15px ${level.accentColor}15`,
                  }}
                >
                  <span
                    className="text-xl"
                    style={{ color: level.accentColor }}
                  >
                    {unlockedIcon.id === "diamond"
                      ? "\u25C7"
                      : unlockedIcon.id === "star"
                        ? "\u2605"
                        : "\u25B3"}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {unlockedIcon.name} Icon
                </span>
              </div>
            )}
            {unlockedColor && (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="h-14 w-14 rounded-lg border border-white/10"
                  style={{
                    backgroundColor: unlockedColor.id,
                    boxShadow: `0 0 15px ${unlockedColor.id}30`,
                  }}
                />
                <span className="text-[11px] text-muted-foreground">
                  {unlockedColor.name}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div
        className="flex animate-slide-up-fade flex-col gap-3"
        style={{ animationDelay: "0.3s" }}
      >
        {nextLevel && (
          <button
            onClick={() => {
              setSelectedLevel(nextLevel.id);
              setScreen("playing");
            }}
            className="flex w-56 items-center justify-center gap-2 rounded-lg px-6 py-3 font-display text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              backgroundColor: level.accentColor,
              color: "var(--background)",
              boxShadow: `0 0 20px ${level.accentColor}40`,
            }}
          >
            <ArrowRight className="h-4 w-4" />
            Next Level
          </button>
        )}

        <button
          onClick={() => setScreen("playing")}
          className="flex w-56 items-center justify-center gap-2 rounded-lg border border-white/15 px-6 py-3 font-display text-sm font-semibold uppercase tracking-wider text-white/80 transition-all duration-200 hover:border-white/25 hover:text-white"
        >
          <Play className="h-4 w-4" />
          Replay
        </button>

        <button
          onClick={() => setScreen("menu")}
          className="flex w-56 items-center justify-center gap-2 px-6 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Home className="h-3.5 w-3.5" />
          Main Menu
        </button>
      </div>
    </div>
  );
}

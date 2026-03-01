import { ArrowLeft, Lock, Play, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEVELS } from "../utils/levels";
import { useGameStore } from "../stores/gameStore";

interface LevelSelectProps {
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

export function LevelSelect({ playerData }: LevelSelectProps) {
  const { setScreen, setSelectedLevel, practiceMode, setPracticeMode } =
    useGameStore();

  const completedLevels =
    playerData?.progress?.levelsCompleted?.map((n) => Number(n)) ?? [];

  function getAttempts(levelId: number): number {
    const pair = playerData?.progress?.levelAttempts?.find(
      ([id]) => Number(id) === levelId,
    );
    return pair ? Number(pair[1]) : 0;
  }

  function getBestProgress(levelId: number): number {
    const pair = playerData?.progress?.bestProgress?.find(
      ([id]) => Number(id) === levelId,
    );
    return pair ? Number(pair[1]) : 0;
  }

  function isUnlocked(level: (typeof LEVELS)[number]): boolean {
    if (level.sample) return true;
    if (practiceMode) return true;
    if (level.id === 1) return true;
    return completedLevels.includes(level.id - 1);
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
        <button
          onClick={() => setScreen("menu")}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
          Select Level
        </h2>
        <div className="flex-1" />
        <button
          onClick={() => setPracticeMode(!practiceMode)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-display text-[10px] font-semibold uppercase tracking-wider transition-all",
            practiceMode
              ? "bg-yellow-500/15 text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.15)]"
              : "border border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground",
          )}
        >
          <RotateCcw className="h-3 w-3" />
          Practice {practiceMode ? "ON" : "OFF"}
        </button>
      </div>

      {/* Level cards */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-4 py-8">
        {LEVELS.map((level, index) => {
          const unlocked = isUnlocked(level);
          const completed = !level.sample && completedLevels.includes(level.id);
          const attempts = level.sample ? 0 : getAttempts(level.id);
          const best = level.sample ? 0 : getBestProgress(level.id);

          return (
            <button
              key={level.id}
              disabled={!unlocked}
              onClick={() => {
                setSelectedLevel(level.id);
                setScreen("playing");
              }}
              className={cn(
                "animate-slide-up-fade group relative w-full max-w-lg overflow-hidden rounded-lg border transition-all duration-200",
                unlocked
                  ? "cursor-pointer border-white/8 bg-card hover:border-white/15 hover:bg-white/[0.04]"
                  : "cursor-not-allowed border-white/4 bg-white/[0.01] opacity-40",
              )}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              {/* Color accent bar */}
              <div
                className="absolute left-0 top-0 h-full w-1 rounded-l"
                style={{
                  backgroundColor: unlocked ? level.accentColor : "transparent",
                }}
              />

              <div className="flex items-center justify-between p-5 pl-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display text-base font-bold uppercase tracking-wide text-foreground">
                      {level.name}
                    </h3>
                    {completed && (
                      <span
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: `${level.accentColor}15`,
                          color: level.accentColor,
                        }}
                      >
                        <Check className="h-2.5 w-2.5" />
                        Done
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span
                      className={cn(
                        "font-display text-[10px] font-bold uppercase tracking-wider",
                        level.difficulty === "sample" && "text-sky-400",
                        level.difficulty === "easy" && "text-green-400",
                        level.difficulty === "medium" && "text-yellow-400",
                        level.difficulty === "hard" && "text-red-400",
                      )}
                    >
                      {level.sample ? "~15 sec" : level.difficulty}
                    </span>
                    {unlocked && attempts > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {attempts} attempts
                      </span>
                    )}
                    {unlocked && best > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Best: {best}%
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {unlocked && best > 0 && (
                    <div className="mt-3 h-1 w-full max-w-48 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${best}%`,
                          backgroundColor: level.accentColor,
                          boxShadow: `0 0 8px ${level.accentColor}40`,
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  {unlocked ? (
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: `${level.accentColor}15`,
                        boxShadow: `0 0 15px ${level.accentColor}15`,
                      }}
                    >
                      <Play
                        className="h-5 w-5"
                        style={{ color: level.accentColor }}
                      />
                    </div>
                  ) : (
                    <Lock className="h-5 w-5 text-white/20" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {practiceMode && (
        <div className="border-t border-white/5 p-3 text-center font-display text-[10px] uppercase tracking-wider text-yellow-500/50">
          Practice mode: checkpoints enabled, completions don't count
        </div>
      )}
    </div>
  );
}

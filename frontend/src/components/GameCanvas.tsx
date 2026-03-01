import { useRef, useEffect, useCallback, useState } from "react";
import { LEVELS, getModeAtPosition } from "../utils/levels";
import {
  createInitialState,
  updateEngine,
  type EngineState,
} from "../utils/engine";
import {
  renderFrame,
  type RenderState,
  type CheckpointRender,
} from "../utils/renderer";
import {
  spawnDeathParticles,
  updateParticles,
  type Particle,
} from "../utils/particles";
import {
  startMusic,
  stopMusic,
  playJumpSfx,
  playDeathSfx,
  playCompleteSfx,
  initAudio,
  setMusicVolume,
  setSfxVolume,
  preloadMusic,
} from "../utils/audio";
import {
  PLAYER_SIZE,
  PLAYER_SPEED,
  SCREEN_SHAKE_DURATION,
  SCREEN_SHAKE_INTENSITY,
  DEATH_FLASH_DURATION,
  GROUND_Y_OFFSET,
  TARGET_FPS,
  TARGET_FRAME_TIME,
} from "../utils/constants";
import { LEVEL_CHECKPOINTS } from "../utils/levels";
import { useGameStore } from "../stores/gameStore";
import {
  useRecordAttempt,
  useUpdateProgress,
  useCompleteLevel,
} from "../hooks/useQueries";
import { GameHUD } from "./GameHUD";

interface GameCanvasProps {
  levelId: number;
  practiceMode: boolean;
  playerColor: string;
  playerIcon: string;
  onComplete: (attempts: number) => void;
  onExit: () => void;
}

export function GameCanvas({
  levelId,
  practiceMode,
  playerColor,
  playerIcon,
  onComplete,
  onExit,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<EngineState | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const jumpPressedRef = useRef(false);
  const jumpConsumedRef = useRef(false);
  const animFrameRef = useRef<number>(0);
  const shakeFramesRef = useRef(0);
  const flashFramesRef = useRef(0);
  const beatPulseRef = useRef(0);
  const attemptsRef = useRef(1);
  const lastCheckpointRef = useRef(0);
  const pausedRef = useRef(false);
  const speedModifierRef = useRef(1);
  const deathTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bestProgressRef = useRef(0);
  const progressThrottleRef = useRef(0);
  const initialAttemptRecordedRef = useRef(false);

  // Refs for callbacks used inside the game loop to avoid effect re-runs
  const handleDeathRef = useRef<(canvasHeight: number) => void>(() => {});
  const handleCompleteRef = useRef<() => void>(() => {});

  const [attempts, setAttempts] = useState(1);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const { musicEnabled, sfxEnabled } = useGameStore();
  const { mutate: recordAttempt } = useRecordAttempt();
  const { mutate: updateBestProgress } = useUpdateProgress();
  const { mutate: completeLevel } = useCompleteLevel();

  const level = LEVELS.find((l) => l.id === levelId)!;
  const isSample = !!level.sample;

  const levelSpeed: Record<number, number> = { 1: 0.5, 2: 0.75, 3: 1 };
  speedModifierRef.current = levelSpeed[levelId] ?? 0.5;

  const resetLevel = useCallback(
    (canvasHeight: number, fromCheckpoint = false) => {
      const startX =
        fromCheckpoint && practiceMode ? lastCheckpointRef.current : 0;
      const startMode =
        startX > 0 ? getModeAtPosition(level, startX) : level.startMode;
      engineRef.current = createInitialState(canvasHeight, startX, startMode);
      particlesRef.current = [];
      shakeFramesRef.current = 0;
      flashFramesRef.current = 0;
      jumpPressedRef.current = false;
      jumpConsumedRef.current = false;

      if (!fromCheckpoint) {
        attemptsRef.current += 1;
        setAttempts(attemptsRef.current);
        if (!isSample) recordAttempt(levelId);
      }

      if (musicEnabled) {
        const musicOffset = startX > 0 ? startX / PLAYER_SPEED / TARGET_FPS : 0;
        startMusic(
          level.musicFile,
          level.bpm,
          () => {
            beatPulseRef.current = 1;
          },
          musicOffset,
        );
      }
    },
    [
      level,
      level.musicFile,
      level.bpm,
      levelId,
      musicEnabled,
      practiceMode,
      recordAttempt,
      isSample,
    ],
  );

  const handleDeath = useCallback(
    (canvasHeight: number) => {
      if (sfxEnabled) playDeathSfx();
      stopMusic();

      const engine = engineRef.current;
      if (engine) {
        const px = engine.player.x;
        const py = engine.player.y + PLAYER_SIZE / 2;
        particlesRef.current = spawnDeathParticles(px, py, playerColor);
      }

      shakeFramesRef.current = SCREEN_SHAKE_DURATION;
      flashFramesRef.current = DEATH_FLASH_DURATION;

      // Update best progress (skip for sample levels)
      const currentProgress = Math.floor(engineRef.current?.progress ?? 0);
      if (currentProgress > bestProgressRef.current) {
        bestProgressRef.current = currentProgress;
        if (!isSample)
          updateBestProgress({ levelId, percent: currentProgress });
      }

      deathTimeoutRef.current = setTimeout(() => {
        resetLevel(canvasHeight, practiceMode);
      }, 600);
    },
    [
      sfxEnabled,
      playerColor,
      levelId,
      isSample,
      updateBestProgress,
      resetLevel,
      practiceMode,
    ],
  );

  const handleComplete = useCallback(() => {
    if (sfxEnabled) playCompleteSfx();
    stopMusic();

    if (!practiceMode && !isSample) {
      completeLevel(levelId);
    }

    onComplete(attemptsRef.current);
  }, [sfxEnabled, practiceMode, isSample, completeLevel, levelId, onComplete]);

  // Keep refs in sync with latest callbacks
  handleDeathRef.current = handleDeath;
  handleCompleteRef.current = handleComplete;

  // Input handlers (stable - no reactive deps)
  const handleInputDown = useCallback(() => {
    if (pausedRef.current) return;
    initAudio();
    jumpPressedRef.current = true;
    jumpConsumedRef.current = false;
  }, []);

  const handleInputUp = useCallback(() => {
    jumpPressedRef.current = false;
    jumpConsumedRef.current = false;
  }, []);

  // Game loop - uses refs for callbacks to avoid teardown/recreation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let running = true;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize
    engineRef.current = createInitialState(canvas.height, 0, level.startMode);
    attemptsRef.current = 1;
    setAttempts(1);
    lastCheckpointRef.current = 0;
    bestProgressRef.current = 0;

    // Guard against duplicate attempt recording
    if (!initialAttemptRecordedRef.current && !isSample) {
      recordAttempt(levelId);
      initialAttemptRecordedRef.current = true;
    }

    if (musicEnabled) {
      initAudio();
      preloadMusic(level.musicFile).then(() => {
        if (!running) return;
        startMusic(level.musicFile, level.bpm, () => {
          beatPulseRef.current = 1;
        });
      });
    }

    let lastTime = performance.now();

    const gameLoop = () => {
      if (!running) return;
      animFrameRef.current = requestAnimationFrame(gameLoop);

      if (pausedRef.current) {
        lastTime = performance.now();
        return;
      }

      // Compute delta time as a ratio of the target frame time (1.0 = 120fps)
      const now = performance.now();
      const elapsed = now - lastTime;
      lastTime = now;
      const dt =
        Math.min(elapsed / TARGET_FRAME_TIME, 3) * speedModifierRef.current;

      const engine = engineRef.current;
      if (!engine) return;

      // Check if we should consume the tap
      let inputTap = false;
      if (jumpPressedRef.current && !jumpConsumedRef.current) {
        inputTap = true;
        jumpConsumedRef.current = true;

        // Mode-aware SFX
        if (sfxEnabled) {
          const { mode } = engine.player;
          if (mode === "cube" && engine.player.onGround) {
            playJumpSfx();
          } else if (mode === "ball") {
            playJumpSfx();
          }
        }
      }

      const inputHeld = jumpPressedRef.current;

      // Update engine
      const newState = updateEngine(
        engine,
        level,
        canvas.width,
        canvas.height,
        inputTap,
        inputHeld,
        dt,
      );

      // Update practice mode checkpoints
      if (practiceMode && newState.player.alive) {
        const cpPositions = LEVEL_CHECKPOINTS.get(levelId) ?? [];
        for (const cpX of cpPositions) {
          if (newState.player.x >= cpX && cpX > lastCheckpointRef.current) {
            lastCheckpointRef.current = cpX;
          }
        }
      }

      // Handle death - use ref to avoid effect dependency
      if (engine.player.alive && !newState.player.alive) {
        engineRef.current = newState;
        handleDeathRef.current(canvas.height);
      } else if (newState.completed && !engine.completed) {
        engineRef.current = newState;
        handleCompleteRef.current();
        return;
      } else {
        engineRef.current = newState;
      }

      // Throttle React state updates
      progressThrottleRef.current += 1;
      if (progressThrottleRef.current % 6 === 0) {
        setProgress(Math.floor(newState.progress));
      }

      // Update particles
      particlesRef.current = updateParticles(particlesRef.current, dt);

      // Update effects
      if (shakeFramesRef.current > 0) shakeFramesRef.current -= dt;
      if (flashFramesRef.current > 0) flashFramesRef.current -= dt;
      beatPulseRef.current *= Math.pow(0.9, dt);

      // Render
      const shakeX =
        shakeFramesRef.current > 0
          ? (Math.random() - 0.5) * SCREEN_SHAKE_INTENSITY * 2
          : 0;
      const shakeY =
        shakeFramesRef.current > 0
          ? (Math.random() - 0.5) * SCREEN_SHAKE_INTENSITY * 2
          : 0;
      const flashAlpha =
        flashFramesRef.current > 0
          ? (flashFramesRef.current / DEATH_FLASH_DURATION) * 0.6
          : 0;

      const groundY = canvas.height - GROUND_Y_OFFSET;

      // Build checkpoint render data
      const cpPositions = practiceMode
        ? (LEVEL_CHECKPOINTS.get(levelId) ?? [])
        : [];
      const checkpoints: CheckpointRender[] = cpPositions.map((worldX) => ({
        worldX,
        activated: newState.player.x >= worldX,
      }));

      const renderState: RenderState = {
        playerX: newState.player.x,
        playerY: newState.player.y,
        playerRotation: newState.player.rotation,
        playerColor,
        playerIcon,
        gameMode: newState.player.mode,
        cameraX: newState.cameraX,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        groundY,
        particles: particlesRef.current,
        shakeOffsetX: shakeX,
        shakeOffsetY: shakeY,
        flashAlpha,
        beatPulse: beatPulseRef.current,
        progress: newState.progress,
        isDead: !newState.player.alive,
        checkpoints,
      };

      renderFrame(ctx, level, renderState);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    // Input event listeners
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        handleInputDown();
      }
      if (e.code === "Escape") {
        pausedRef.current = !pausedRef.current;
        setPaused(pausedRef.current);
        if (pausedRef.current) {
          stopMusic();
        } else if (musicEnabled) {
          startMusic(level.musicFile, level.bpm, () => {
            beatPulseRef.current = 1;
          });
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.key === "w") {
        handleInputUp();
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handleInputDown();
    };
    const onMouseUp = () => handleInputUp();
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleInputDown();
    };
    const onTouchEnd = () => handleInputUp();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    setMusicVolume(musicEnabled ? 0.5 : 0);
    setSfxVolume(sfxEnabled ? 1 : 0);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
      stopMusic();
      if (deathTimeoutRef.current) clearTimeout(deathTimeoutRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
    // Only re-run when the level/visual props change, not on callback identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    level,
    levelId,
    playerColor,
    playerIcon,
    practiceMode,
    musicEnabled,
    sfxEnabled,
  ]);

  // Volume sync
  useEffect(() => {
    setMusicVolume(musicEnabled ? 0.5 : 0);
  }, [musicEnabled]);

  useEffect(() => {
    setSfxVolume(sfxEnabled ? 1 : 0);
  }, [sfxEnabled]);

  const handlePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (pausedRef.current) {
      stopMusic();
    } else if (musicEnabled) {
      startMusic(level.musicFile, level.bpm, () => {
        beatPulseRef.current = 1;
      });
    }
  }, [musicEnabled, level.musicFile, level.bpm]);

  return (
    <div className="relative h-screen w-screen">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
      <GameHUD
        progress={progress}
        attempts={attempts}
        practiceMode={practiceMode}
        paused={paused}
        onPause={handlePause}
        onExit={onExit}
        levelName={level.name}
      />
    </div>
  );
}

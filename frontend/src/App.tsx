import { useEffect, useCallback, useState } from "react";
import { Toaster, toast } from "sonner";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { usePlayerData, useInitPlayer } from "./hooks/useQueries";
import { useGameStore } from "./stores/gameStore";
import { stopMusic } from "./utils/audio";
import { LEVELS } from "./utils/levels";
import { LoginScreen } from "./components/LoginScreen";
import { MainMenu } from "./components/MainMenu";
import { LevelSelect } from "./components/LevelSelect";
import { GameCanvas } from "./components/GameCanvas";
import { LevelComplete } from "./components/LevelComplete";
import { CustomizeDialog } from "./components/CustomizeDialog";

function App() {
  const { identity } = useInternetIdentity();
  const { screen, setScreen, selectedLevel, practiceMode } = useGameStore();
  const { data: playerData, isLoading, isError } = usePlayerData();
  const { mutate: initPlayer } = useInitPlayer();
  const [completedAttempts, setCompletedAttempts] = useState(0);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  // Auto-redirect based on auth state
  useEffect(() => {
    if (identity && screen === "login") {
      setScreen("menu");
    }
    if (!identity && screen !== "login") {
      setScreen("login");
      stopMusic();
    }
  }, [identity, screen, setScreen]);

  // Auto-initialize player
  useEffect(() => {
    if (identity && playerData === null && !isLoading) {
      initPlayer();
    }
  }, [identity, playerData, isLoading, initPlayer]);

  const handleGameComplete = useCallback(
    (attempts: number) => {
      setCompletedAttempts(attempts);
      if (!practiceMode || LEVELS.find((l) => l.id === selectedLevel)?.sample) {
        setScreen("complete");
      } else {
        toast.success("Practice run complete! Try the real thing!");
        setScreen("levelSelect");
      }
    },
    [practiceMode, selectedLevel, setScreen],
  );

  const handleExitGame = useCallback(() => {
    stopMusic();
    setScreen("levelSelect");
  }, [setScreen]);

  if (!identity) {
    return (
      <>
        <LoginScreen />
        <Toaster position="bottom-right" />
      </>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
        <p className="text-destructive">Failed to load player data.</p>
        <Toaster position="bottom-right" />
      </div>
    );
  }

  // Resolve player customization
  const playerColor = playerData?.customization?.selectedColor ?? "#00ff00";
  const playerIcon = playerData?.customization?.selectedIcon ?? "cube";

  return (
    <>
      {screen === "menu" && (
        <MainMenu
          onPlay={() => setScreen("levelSelect")}
          onCustomize={() => setCustomizeOpen(true)}
          playerColor={playerColor}
          playerIcon={playerIcon}
        />
      )}

      {screen === "levelSelect" && <LevelSelect playerData={playerData} />}

      {screen === "playing" && (
        <GameCanvas
          levelId={selectedLevel}
          practiceMode={practiceMode}
          playerColor={playerColor}
          playerIcon={playerIcon}
          onComplete={handleGameComplete}
          onExit={handleExitGame}
        />
      )}

      {screen === "complete" && (
        <LevelComplete
          levelId={selectedLevel}
          attempts={completedAttempts}
          playerData={playerData}
        />
      )}

      <CustomizeDialog
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        playerData={playerData}
      />

      <Toaster position="bottom-right" />
    </>
  );
}

export default App;

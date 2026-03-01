import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Screen = "login" | "menu" | "levelSelect" | "playing" | "complete";

interface GameStoreState {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  selectedLevel: number;
  setSelectedLevel: (level: number) => void;
  practiceMode: boolean;
  setPracticeMode: (practice: boolean) => void;
  musicEnabled: boolean;
  setMusicEnabled: (enabled: boolean) => void;
  sfxEnabled: boolean;
  setSfxEnabled: (enabled: boolean) => void;
}

export const useGameStore = create<GameStoreState>()(
  persist(
    (set) => ({
      screen: "login",
      setScreen: (screen) => set({ screen }),
      selectedLevel: 1,
      setSelectedLevel: (level) => set({ selectedLevel: level }),
      practiceMode: false,
      setPracticeMode: (practice) => set({ practiceMode: practice }),
      musicEnabled: true,
      setMusicEnabled: (enabled) => set({ musicEnabled: enabled }),
      sfxEnabled: true,
      setSfxEnabled: (enabled) => set({ sfxEnabled: enabled }),
    }),
    {
      name: "geometry-dash-settings",
      partialize: (state) => ({
        musicEnabled: state.musicEnabled,
        sfxEnabled: state.sfxEnabled,
      }),
    },
  ),
);

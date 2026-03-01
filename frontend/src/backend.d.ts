import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PlayerData {
    progress: PlayerProgress;
    customization: PlayerCustomization;
}
export interface PlayerCustomization {
    unlockedIcons: Array<string>;
    selectedColor: string;
    selectedIcon: string;
    unlockedColors: Array<string>;
}
export interface PlayerProgress {
    bestProgress: Array<[bigint, bigint]>;
    levelsCompleted: Array<bigint>;
    levelAttempts: Array<[bigint, bigint]>;
}
export interface backendInterface {
    completeLevel(levelId: bigint): Promise<void>;
    getPlayerData(): Promise<PlayerData | null>;
    initializePlayer(): Promise<void>;
    recordLevelAttempt(levelId: bigint): Promise<void>;
    selectColor(color: string): Promise<void>;
    selectIcon(icon: string): Promise<void>;
    updateBestProgress(levelId: bigint, percent: bigint): Promise<void>;
}

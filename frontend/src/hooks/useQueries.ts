import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function usePlayerData() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["playerData"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPlayerData();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useInitPlayer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.initializePlayer();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playerData"] });
    },
  });
}

export function useRecordAttempt() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (levelId: number) => {
      if (!actor) throw new Error("Actor not available");
      return actor.recordLevelAttempt(BigInt(levelId));
    },
    onError: (error) => {
      console.warn("Failed to record attempt:", error);
    },
  });
}

export function useUpdateProgress() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      levelId,
      percent,
    }: {
      levelId: number;
      percent: number;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateBestProgress(BigInt(levelId), BigInt(percent));
    },
    onError: (error) => {
      console.warn("Failed to update progress:", error);
    },
  });
}

export function useCompleteLevel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (levelId: number) => {
      if (!actor) throw new Error("Actor not available");
      return actor.completeLevel(BigInt(levelId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playerData"] });
    },
  });
}

export function useSelectIcon() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (icon: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.selectIcon(icon);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playerData"] });
    },
  });
}

export function useSelectColor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (color: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.selectColor(color);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playerData"] });
    },
  });
}

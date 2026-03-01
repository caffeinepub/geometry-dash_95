import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";
import { ICON_UNLOCKABLES, COLOR_UNLOCKABLES } from "../utils/constants";
import { useSelectIcon, useSelectColor } from "../hooks/useQueries";
import { toast } from "sonner";
import { PlayerIcon } from "./shared/PlayerIcon";

interface CustomizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function CustomizeDialog({
  open,
  onOpenChange,
  playerData,
}: CustomizeDialogProps) {
  const { mutate: selectIcon, isPending: isSelectingIcon } = useSelectIcon();
  const { mutate: selectColor, isPending: isSelectingColor } = useSelectColor();

  const unlockedIcons = playerData?.customization?.unlockedIcons ?? ["cube"];
  const unlockedColors = playerData?.customization?.unlockedColors ?? [
    "#00ff00",
  ];
  const selectedIcon = playerData?.customization?.selectedIcon ?? "cube";
  const selectedColor = playerData?.customization?.selectedColor ?? "#00ff00";

  const handleSelectIcon = (iconId: string) => {
    if (!unlockedIcons.includes(iconId)) return;
    if (iconId === selectedIcon) return;
    selectIcon(iconId, {
      onSuccess: () => toast.success("Icon updated!"),
      onError: () => toast.error("Failed to update icon"),
    });
  };

  const handleSelectColor = (colorId: string) => {
    if (!unlockedColors.includes(colorId)) return;
    if (colorId === selectedColor) return;
    selectColor(colorId, {
      onSuccess: () => toast.success("Color updated!"),
      onError: () => toast.error("Failed to update color"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/8 bg-card text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-base font-bold uppercase tracking-wider">
            Customize
          </DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div className="flex justify-center py-4">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-lg border-2"
            style={{
              borderColor: selectedColor,
              backgroundColor: `${selectedColor}12`,
              boxShadow: `0 0 25px ${selectedColor}25, inset 0 0 15px ${selectedColor}08`,
            }}
          >
            <PlayerIcon icon={selectedIcon} color={selectedColor} size={32} />
          </div>
        </div>

        {/* Icons */}
        <div>
          <p className="mb-2.5 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Icon
          </p>
          <div className="flex flex-wrap gap-2">
            {ICON_UNLOCKABLES.map((item) => {
              const isUnlocked = unlockedIcons.includes(item.id);
              const isSelected = selectedIcon === item.id;
              return (
                <button
                  key={item.id}
                  disabled={!isUnlocked || isSelectingIcon}
                  onClick={() => handleSelectIcon(item.id)}
                  className={cn(
                    "relative flex h-14 w-14 flex-col items-center justify-center rounded-lg border transition-all duration-150",
                    isUnlocked
                      ? isSelected
                        ? "border-primary/50 bg-primary/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                      : "cursor-not-allowed border-white/10 bg-white/[0.02]",
                  )}
                  style={
                    isSelected
                      ? { boxShadow: `0 0 12px ${selectedColor}20` }
                      : undefined
                  }
                >
                  {isUnlocked ? (
                    <>
                      <PlayerIcon
                        icon={item.id}
                        color={isSelected ? selectedColor : "#777"}
                        size={20}
                      />
                      <span className="mt-1 text-[9px] text-muted-foreground">
                        {item.name}
                      </span>
                      {isSelected && (
                        <Check className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-primary p-0.5 text-primary-foreground" />
                      )}
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-white/50" />
                      <span className="mt-1 text-[8px] text-white/50">
                        {item.unlockedBy}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Colors */}
        <div>
          <p className="mb-2.5 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Color
          </p>
          <div className="flex flex-wrap gap-2">
            {COLOR_UNLOCKABLES.map((item) => {
              const isUnlocked = unlockedColors.includes(item.id);
              const isSelected = selectedColor === item.id;
              return (
                <button
                  key={item.id}
                  disabled={!isUnlocked || isSelectingColor}
                  onClick={() => handleSelectColor(item.id)}
                  className={cn(
                    "relative flex h-14 w-14 flex-col items-center justify-center rounded-lg border transition-all duration-150",
                    isUnlocked
                      ? isSelected
                        ? "border-white/40"
                        : "border-white/10 hover:border-white/25"
                      : "cursor-not-allowed border-white/10 bg-white/[0.02]",
                  )}
                  style={
                    isSelected
                      ? { boxShadow: `0 0 12px ${item.id}30` }
                      : undefined
                  }
                >
                  {isUnlocked ? (
                    <>
                      <div
                        className="h-7 w-7 rounded-md"
                        style={{
                          backgroundColor: item.id,
                          boxShadow: isSelected
                            ? `0 0 10px ${item.id}40`
                            : undefined,
                        }}
                      />
                      <span className="mt-1 text-[9px] text-muted-foreground">
                        {item.name}
                      </span>
                      {isSelected && (
                        <Check className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-white p-0.5 text-background" />
                      )}
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-white/50" />
                      <span className="mt-1 text-[8px] text-white/50">
                        {item.unlockedBy}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

/**
 * A pill-shaped yes/no choice used across RSVP steps (attendance,
 * after-party). Selected "positive" chips take a bouquet accent via inline
 * style (runtime colors can't be Tailwind classes); "muted" chips use the
 * standby treatment.
 */
import { cn } from "@/lib/utils";

export function ChoiceChip({
  selected,
  onSelect,
  icon,
  label,
  muted = false,
  accentColor,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
  muted?: boolean;
  /** Bouquet token for the selected state. */
  accentColor?: string;
}) {
  const accentStyle =
    selected && accentColor && !muted
      ? {
          backgroundColor: `hsl(var(--${accentColor}) / 0.22)`,
          borderColor: `hsl(var(--${accentColor}))`,
        }
      : undefined;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      style={accentStyle}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-pill border px-3 py-2.5",
        "font-sans text-sm transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? muted
            ? "bg-standby/30 border-standby font-semibold"
            : accentColor
              ? "font-semibold" // colors come from accentStyle
              : "bg-arrived/15 border-arrived font-semibold"
          : "bg-surface border-input text-muted-foreground hover:bg-muted"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

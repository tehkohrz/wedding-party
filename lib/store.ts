/**
 * In-flight check-in state — shared across the wizard screens.
 *
 * Zustand: a minimal global-state library. `create()` returns a React
 * hook. Inside components, call it like `const guest = useWizardStore(s => s.currentGuest)`
 * to subscribe to a slice of the state.
 *
 * What lives here:
 *   - currentGuest: the guest matched on screen 1 (Welcome). Used by
 *     Group + the two map screens.
 *   - direction: which way the wizard is moving (forward/back), so the
 *     slide-transition layer knows which direction to animate.
 *   - sessionStartedAt: a tick the idle-timer reads. Bumped on every
 *     touch via WizardShell so 15s of no activity resets to home.
 *
 * What does NOT live here:
 *   - Persisted attendance — that's IndexedDB via lib/attendance.ts.
 *   - The guest list itself — that's lib/data.ts (build-time constant).
 */
import { create } from "zustand";
import type { Guest } from "@/lib/schema";

type Direction = "forward" | "back";

interface WizardState {
  currentGuest: Guest | null;
  direction: Direction;
  sessionStartedAt: number;

  // Actions — bundled with state in Zustand, called like methods.
  setCurrentGuest: (guest: Guest | null) => void;
  setDirection: (direction: Direction) => void;
  bumpActivity: () => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>((set) => ({
  currentGuest: null,
  direction: "forward",
  sessionStartedAt: Date.now(),

  setCurrentGuest: (guest) => set({ currentGuest: guest }),
  setDirection: (direction) => set({ direction }),
  bumpActivity: () => set({ sessionStartedAt: Date.now() }),
  reset: () =>
    set({
      currentGuest: null,
      direction: "forward",
      sessionStartedAt: Date.now(),
    }),
}));

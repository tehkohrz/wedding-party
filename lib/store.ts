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
  /**
   * Guest IDs marked arrived in the *current* check-in round.
   *
   * Different from the attendance DB (which is the lifetime record): this
   * field is the lens through which /lunch decides who gets colored and
   * who pulses. A groupmate who was checked in last round is in attendance
   * but NOT in this round → still in the group panel but rendered greyed.
   *
   * Cleared on reset() and at the start of each new search.
   */
  checkedInThisRound: number[];

  // Actions — bundled with state in Zustand, called like methods.
  setCurrentGuest: (guest: Guest | null) => void;
  setDirection: (direction: Direction) => void;
  setCheckedInThisRound: (ids: number[]) => void;
  bumpActivity: () => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>((set) => ({
  currentGuest: null,
  direction: "forward",
  sessionStartedAt: Date.now(),
  checkedInThisRound: [],

  setCurrentGuest: (guest) => set({ currentGuest: guest }),
  setDirection: (direction) => set({ direction }),
  setCheckedInThisRound: (ids) => set({ checkedInThisRound: ids }),
  bumpActivity: () => set({ sessionStartedAt: Date.now() }),
  reset: () =>
    set({
      currentGuest: null,
      direction: "forward",
      sessionStartedAt: Date.now(),
      checkedInThisRound: [],
    }),
}));

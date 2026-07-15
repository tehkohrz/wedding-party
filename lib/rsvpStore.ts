"use client";

/**
 * RSVP stepper state — the guest's in-progress (draft) response.
 *
 * Nothing here touches the database: the draft accumulates across steps and
 * is written in ONE atomic POST at the confirm step (Stage 4). This is the
 * "single atomic submit" decision from the plan — no half-responses can
 * ever poison the food totals.
 *
 * Shape mirrors the wizard store used by check-in, but the RSVP flow is a
 * single route, so `step` lives here instead of in URLs. `direction` feeds
 * the internal slide transition (1 = forward, -1 = back).
 *
 * Steps:
 *   attendance → menu → afterparty → confirm → thanks
 *        └→ decline-confirm → declined-thanks   (when everyone said no)
 *
 * (sessionStorage draft persistence arrives with Stage 4, alongside submit.)
 */
import { create } from "zustand";

export type RsvpStep =
  | "attendance"
  | "menu"
  | "afterparty"
  | "confirm"
  | "thanks"
  | "decline-confirm"
  | "declined-thanks";

export interface MemberAnswer {
  attending: boolean | null; // null = not answered yet
  food: "A" | "B" | null; // Stage 3
  comment: string; // Stage 3 (dietary)
  afterParty: boolean | null; // Stage 4
}

export const EMPTY_ANSWER: MemberAnswer = {
  attending: null,
  food: null,
  comment: "",
  afterParty: null,
};

interface RsvpState {
  /** Which group this draft belongs to — guards against stale state when a
   *  different /r/[slug] page mounts (e.g. someone lost their phone and a
   *  second guest uses the same browser). */
  groupId: string | null;
  step: RsvpStep;
  direction: 1 | -1;
  answers: Record<number, MemberAnswer>;

  /** (Re)initialize for a group. No-op if already initialized for it, so
   *  back/forward navigation doesn't wipe a draft in progress. */
  init: (groupId: string, memberIds: number[]) => void;
  setAttending: (guestId: number, attending: boolean) => void;
  setFood: (guestId: number, food: "A" | "B") => void;
  setComment: (guestId: number, comment: string) => void;
  goTo: (step: RsvpStep, direction?: 1 | -1) => void;
  reset: () => void;
}

export const useRsvpStore = create<RsvpState>((set, get) => ({
  groupId: null,
  step: "attendance",
  direction: 1,
  answers: {},

  init: (groupId, memberIds) => {
    if (get().groupId === groupId) return;
    const answers: Record<number, MemberAnswer> = {};
    for (const id of memberIds) answers[id] = { ...EMPTY_ANSWER };
    set({ groupId, step: "attendance", direction: 1, answers });
  },

  setAttending: (guestId, attending) =>
    set((s) => ({
      answers: {
        ...s.answers,
        [guestId]: { ...(s.answers[guestId] ?? EMPTY_ANSWER), attending },
      },
    })),

  setFood: (guestId, food) =>
    set((s) => ({
      answers: {
        ...s.answers,
        [guestId]: { ...(s.answers[guestId] ?? EMPTY_ANSWER), food },
      },
    })),

  setComment: (guestId, comment) =>
    set((s) => ({
      answers: {
        ...s.answers,
        [guestId]: { ...(s.answers[guestId] ?? EMPTY_ANSWER), comment },
      },
    })),

  goTo: (step, direction = 1) => set({ step, direction }),

  reset: () =>
    set({ groupId: null, step: "attendance", direction: 1, answers: {} }),
}));

"use client";

/**
 * RSVP stepper state — the guest's in-progress (draft) response.
 *
 * Nothing here touches the database: the draft accumulates across steps and
 * is written in ONE atomic POST at the confirm step. This is the "single
 * atomic submit" decision from the plan — no half-responses can ever poison
 * the food totals.
 *
 * PERSISTENCE: the draft lives in sessionStorage (zustand persist), so an
 * accidental tab-close / phone-lock resumes in place. sessionStorage clears
 * when the tab closes for good — drafts don't haunt shared devices forever.
 *
 * PREFILL: init() seeds answers from the members' existing database values,
 * so revisiting a responded link enters edit mode with everything filled in.
 * If the group has already responded, the flow opens on the "thanks"
 * (summary) view rather than step 1.
 *
 * Steps:
 *   attendance → menu → afterparty → confirm → thanks
 *        └→ decline-confirm → declined-thanks   (when everyone said no)
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  food: "A" | "B" | null;
  comment: string;
  afterParty: boolean | null;
}

export const EMPTY_ANSWER: MemberAnswer = {
  attending: null,
  food: null,
  comment: "",
  afterParty: null,
};

/** The subset of member fields init() needs (RsvpMember satisfies this). */
export interface InitMember {
  id: number;
  attending: boolean | null;
  food_choice: "A" | "B" | null;
  dietary_comment: string | null;
  after_party: boolean | null;
  responded_at: string | null;
}

interface RsvpState {
  /** Guards against stale drafts when a different /r/[slug] page mounts. */
  groupId: string | null;
  step: RsvpStep;
  direction: 1 | -1;
  answers: Record<number, MemberAnswer>;
  /** True once this browser submitted (or the DB already had a response). */
  submitted: boolean;

  init: (groupId: string, members: InitMember[]) => void;
  setAttending: (guestId: number, attending: boolean) => void;
  setFood: (guestId: number, food: "A" | "B") => void;
  setComment: (guestId: number, comment: string) => void;
  setAfterParty: (guestId: number, going: boolean) => void;
  markSubmitted: () => void;
  goTo: (step: RsvpStep, direction?: 1 | -1) => void;
  reset: () => void;
}

function updateAnswer(
  s: RsvpState,
  guestId: number,
  patch: Partial<MemberAnswer>
) {
  return {
    answers: {
      ...s.answers,
      [guestId]: { ...(s.answers[guestId] ?? EMPTY_ANSWER), ...patch },
    },
  };
}

export const useRsvpStore = create<RsvpState>()(
  persist(
    (set, get) => ({
      groupId: null,
      step: "attendance",
      direction: 1,
      answers: {},
      submitted: false,

      init: (groupId, members) => {
        // Same group → a draft (possibly rehydrated from sessionStorage)
        // is in progress; leave it alone.
        if (get().groupId === groupId) return;

        const answers: Record<number, MemberAnswer> = {};
        for (const m of members) {
          answers[m.id] = {
            attending: m.attending,
            food: m.food_choice,
            comment: m.dietary_comment ?? "",
            afterParty: m.after_party,
          };
        }
        const responded = members.some((m) => m.responded_at !== null);
        const allDeclined =
          responded && members.every((m) => m.attending === false);
        set({
          groupId,
          answers,
          submitted: responded,
          direction: 1,
          // Responded groups open on their summary (or decline note),
          // not back at step 1.
          step: responded
            ? allDeclined
              ? "declined-thanks"
              : "thanks"
            : "attendance",
        });
      },

      setAttending: (id, attending) =>
        set((s) => updateAnswer(s, id, { attending })),
      setFood: (id, food) => set((s) => updateAnswer(s, id, { food })),
      setComment: (id, comment) => set((s) => updateAnswer(s, id, { comment })),
      setAfterParty: (id, going) =>
        set((s) => updateAnswer(s, id, { afterParty: going })),

      markSubmitted: () => set({ submitted: true }),
      goTo: (step, direction = 1) => set({ step, direction }),
      reset: () =>
        set({
          groupId: null,
          step: "attendance",
          direction: 1,
          answers: {},
          submitted: false,
        }),
    }),
    {
      name: "swa-rsvp-draft",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

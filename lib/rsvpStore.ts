"use client";

/**
 * RSVP stepper state — the guest's in-progress (draft) response.
 *
 * Nothing here touches the database: the draft accumulates across steps and
 * is written in ONE atomic POST at the confirm step. This is the "single
 * atomic submit" decision from the plan — no half-responses can ever poison
 * the food totals.
 *
 * PERSISTENCE: the draft ANSWERS live in sessionStorage (zustand persist),
 * so an accidental reload / phone-lock keeps what was typed — but the STEP
 * is deliberately NOT persisted: every page load starts back on the intro
 * (cleaner than dropping a guest into the middle of the flow), with their
 * answers prefilled once they tap RSVP. sessionStorage clears when the tab
 * closes for good — drafts don't haunt shared devices forever.
 *
 * PREFILL: init() seeds answers from the members' existing database values,
 * so revisiting a responded link enters edit mode with everything filled in.
 * If the group has already responded, the flow opens on the "thanks"
 * (summary) view rather than step 1.
 *
 * Steps:
 *   intro → attendance → menu → afterparty → confirm → thanks
 *              └→ decline-confirm → declined-thanks  (when everyone said no)
 *
 * Food values: "A"/"B" adult mains · "K" kids' meal · "NO_MEAL" the explicit
 * "kid needs no meal" answer (maps to null at submit) · null = unanswered.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type RsvpStep =
  | "intro"
  | "attendance"
  | "menu"
  | "afterparty"
  | "confirm"
  | "thanks"
  | "decline-confirm"
  | "declined-thanks";

export type FoodAnswer = "A" | "B" | "K" | "NO_MEAL" | null;

export interface MemberAnswer {
  attending: boolean | null; // null = not answered yet
  food: FoodAnswer;
  comment: string;
  afterParty: boolean | null;
  /** Kids only: baby seat / high chair needed? null = unanswered. */
  babySeat: boolean | null;
  /** Display name — editable only for plus-ones ("Peter's Plus One" → the
      real name); everyone else keeps their guest-list name. */
  name: string;
}

export const EMPTY_ANSWER: MemberAnswer = {
  attending: null,
  food: null,
  comment: "",
  afterParty: null,
  babySeat: null,
  name: "",
};

/** The subset of member fields init() needs (RsvpMember satisfies this). */
export interface InitMember {
  id: number;
  name: string;
  is_kid: boolean;
  attending: boolean | null;
  food_choice: "A" | "B" | "K" | null;
  dietary_comment: string | null;
  after_party: boolean | null;
  baby_seat?: boolean | null;
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
  setFood: (guestId: number, food: FoodAnswer) => void;
  setComment: (guestId: number, comment: string) => void;
  setName: (guestId: number, name: string) => void;
  setAfterParty: (guestId: number, going: boolean) => void;
  setBabySeat: (guestId: number, needed: boolean) => void;
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
      step: "intro",
      direction: 1,
      answers: {},
      submitted: false,

      init: (groupId, members) => {
        // Same group → a draft (possibly rehydrated from sessionStorage)
        // is in progress; leave it alone.
        if (get().groupId === groupId) return;

        const answers: Record<number, MemberAnswer> = {};
        for (const m of members) {
          // A responded, attending kid with no food_choice answered
          // "no meal needed" — restore that explicit state for edit mode.
          const food: MemberAnswer["food"] =
            m.responded_at !== null &&
            m.is_kid &&
            m.attending === true &&
            m.food_choice === null
              ? "NO_MEAL"
              : m.food_choice;
          answers[m.id] = {
            attending: m.attending,
            food,
            comment: m.dietary_comment ?? "",
            afterParty: m.after_party,
            babySeat: m.baby_seat ?? null,
            name: m.name,
          };
        }
        const responded = members.some((m) => m.responded_at !== null);
        set({
          groupId,
          answers,
          submitted: responded,
          direction: 1,
          // EVERY visit starts on the intro (the main-page look) — the
          // RSVP button routes responded groups to their summary from
          // there (see RsvpFlow/StepIntro).
          step: "intro",
        });
      },

      setAttending: (id, attending) =>
        set((s) => updateAnswer(s, id, { attending })),
      setFood: (id, food) => set((s) => updateAnswer(s, id, { food })),
      setComment: (id, comment) => set((s) => updateAnswer(s, id, { comment })),
      setName: (id, name) => set((s) => updateAnswer(s, id, { name })),
      setAfterParty: (id, going) =>
        set((s) => updateAnswer(s, id, { afterParty: going })),
      setBabySeat: (id, needed) =>
        set((s) => updateAnswer(s, id, { babySeat: needed })),

      markSubmitted: () => set({ submitted: true }),
      goTo: (step, direction = 1) => set({ step, direction }),
      reset: () =>
        set({
          groupId: null,
          step: "intro",
          direction: 1,
          answers: {},
          submitted: false,
        }),
    }),
    {
      name: "swa-rsvp-draft",
      storage: createJSONStorage(() => sessionStorage),
      // Persist the draft, not the position: step/direction stay out, so
      // a revisit always opens on the intro page.
      partialize: (s) => ({
        groupId: s.groupId,
        answers: s.answers,
        submitted: s.submitted,
      }),
    }
  )
);

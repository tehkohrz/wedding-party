/**
 * User-editable content — names, dates, prompts, microcopy.
 *
 * Every field is marked [input] so you can find them with:
 *   grep -rn "\[input\]" lib/content.ts
 * or your editor's "find in files" for the literal text [input].
 *
 * Change a value, save, watch it update in dev.
 */

export const COUPLE = {
  // [input] Bride's full display name on the welcome screen.
  brideName: "Jermaine Yeo",

  // [input] Groom's full display name on the welcome screen.
  groomName: "Koh Dong Kun",

  // [input] Wedding date, free-form text. e.g. "31 Oct 2026" or "Saturday, 31st October 2026".
  weddingDate: "31 Oct 2026",

  // [input] Optional venue line, shown under the date. Set to "" to hide.
  venue: "",

  // [input] The result of "Bride + Groom = ?" on the welcome screen.
  //         Try: "Happiness", "Forever", "Us", "Family", "Always", "Bliss",
  //         "One", "Home", "Adventure", "Love", "❤".
  unionWord: "Happiness",
};

export const WELCOME_COPY = {
  // [input] Greeting headline above the input box.
  greeting: "Welcome!",

  // [input] Short instruction line under the greeting.
  instruction: "Please enter your name to check-in and find your seat.",

  // [input] Placeholder text inside the input box.
  inputPlaceholder: "Your name...",
};

export const LUNCH_COPY = {
  // [input] Heading on the lunch screen when only the guest is checking in.
  headingSolo: "Your lunch seat",

  // [input] Heading on the lunch screen when checking in with companions.
  headingGroup: "Your lunch seats",

  // [input] Friendly note under the name boxes, shown for grouped guests.
  //         Hint that any group member can take any of their party's seats.
  groupSeatingNote: "Feel free to sit how you like among your group.",

  // [input] Label on the final button that returns to the welcome screen.
  doneLabel: "Done",
};

export const LOOKUP_COPY = {
  // [input] Heading on the seating-plan lookup page.
  heading: "Seating plan",

  // [input] Sub-instruction under the heading.
  subheading: "Search a name to see where they're seated. No check-in.",

  // [input] Placeholder text inside the lookup search input.
  searchPlaceholder: "Search by name...",

  // [input] Shown when no guests match the typed query.
  noMatches: "No matches found.",

  // [input] Hint shown before anything is searched.
  initialHint: "Type a name above to find their seat.",

  // [input] Subtle "Seating plan" link in the bottom-right of the welcome screen.
  welcomeLinkLabel: "Seating plan →",
};

export const GROUP_COPY = {
  // [input] Heading on the group check-in screen.
  heading: "Are these guests with you?",

  // [input] Sub-instruction under the heading.
  subheading: "Toggle off anyone who hasn't arrived yet.",

  // [input] Label on the row for the guest who is checking in.
  youLabel: "You",

  // [input] Confirm button label on the group screen.
  confirmLabel: "Check-in",
};

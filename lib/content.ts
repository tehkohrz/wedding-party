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

// ─── RSVP (v2) ────────────────────────────────────────────────────────────────

export const EVENT_DETAILS = {
  // [input] Event date as shown on the RSVP pages.
  date: "Saturday, 31 October 2026",

  // [input] Exact event start for the countdown (ISO 8601 with timezone).
  //         +08:00 = Singapore time. Should match the schedule's first entry.
  eventStartISO: "2026-10-31T10:30:00+08:00",

  // [input] Shown in place of the countdown once the moment arrives.
  countdownDoneLabel: "It's wedding day! 🎉",

  // [input] Venue name.
  venueName: "The Garden Pavilion",

  // [input] Venue address line (shown under the venue name; also used for
  //         the maps link text). Set to "" to hide.
  venueAddress: "123 Orchard Boulevard, Singapore",

  // [input] Google Maps share URL for the venue. Set to "" to hide the link.
  mapsUrl: "",

  // [input] Day-of schedule shown on the RSVP details step. Add/remove rows.
  schedule: [
    { time: "10:30", item: "Guests arrive" },
    { time: "11:00", item: "Solemnization" },
    { time: "12:00", item: "Lunch" },
  ],

  // [input] RSVP deadline (ISO date). After this day, submitted responses
  //         become view-only and the flow shows the deadline notice.
  rsvpDeadline: "2026-09-30",
};

export const RSVP_COPY = {
  // [input] Small line above the couple names on the RSVP landing.
  eyebrow: "You're invited to the wedding of",

  // [input] Heading above the landing name search.
  searchHeading: "Find your invitation",

  // [input] Instruction under the search heading.
  searchInstruction:
    "Enter your name to find your invitation and RSVP for your party.",

  // [input] Placeholder in the landing search input.
  searchPlaceholder: "Your name...",

  // [input] Shown when the search matches nobody.
  noMatches: "We can't find that name — try another spelling, or contact us.",

  // [input] Photo slideshow images, in order. Drop files into public/photos/
  //         and list them here. Empty list = soft gradient placeholder.
  photos: ["/photos/one.jpg", "/photos/two.jpg", "/photos/three.jpg", "/photos/four.jpg", "/photos/five.jpg"] as string[],

  // [input] Seconds each slideshow photo is shown before crossfading.
  slideshowIntervalSeconds: 6,

  // [input] Width of the photo panel in landscape/desktop, as a percentage
  //         of the page (the content side gets the rest). 60–70 recommended;
  //         has no effect on portrait phones (photo becomes a top banner).
  photoPanelWidthPercent: 65,

  // [input] Height of the photo banner on portrait phones (vh = % of the
  //         screen height).
  photoBannerHeightVh: 28,
};

export const MENU = {
  // [input] Heading on the menu step.
  heading: "The wedding menu",

  // [input] Instruction under the heading.
  instruction: "Choose a main course for each attending guest.",

  // [input] The two mains. id must stay "A"/"B" (stored in the database);
  //         name/description/image are free. image: drop a file in
  //         public/menu/ and reference it ("/menu/chicken.jpg"), or "" for none.
  mains: [
    {
      id: "A" as const,
      name: "Roasted Spring Chicken",
      description:
        "With rosemary jus, garlic mash and seasonal greens.",
      image: "",
    },
    {
      id: "B" as const,
      name: "Pan-seared Barramundi",
      description:
        "With lemon beurre blanc, herbed potatoes and asparagus.",
      image: "",
    },
  ],

  // [input] Placeholder for the per-person comment box.
  dietaryPlaceholder: "Allergies or dietary needs? (optional)",

  // [input] Small note shown next to kids' selectors. Set "" to hide.
  kidsNote: "Kids' portions are prepared smaller — still pick their preference.",

  // [input] Continue button on the menu step.
  continueLabel: "Continue",

  // [input] Back button on the menu step.
  backLabel: "Back",
};

export const RSVP_STEPS_COPY = {
  // [input] Labels for the progress dots across the top of the RSVP flow.
  stepLabels: ["Your party", "Menu", "After-party", "Confirm"],

  // ── Step: attendance ──
  // [input] Heading on the attendance step.
  attendanceHeading: "Will you be joining us?",

  // [input] Instruction under the heading.
  attendanceInstruction:
    "Let us know for each person — tap an answer for everyone below.",

  // [input] The "yes" choice on each member row.
  attendingLabel: "Joyfully attending",

  // [input] The "no" choice on each member row.
  decliningLabel: "Regretfully, decline",

  // [input] Continue button (enabled once everyone has an answer).
  continueLabel: "Continue",

  // ── Decline path (everyone said no) ──
  // [input] Heading on the decline confirmation.
  declineHeading: "We'll miss you!",

  // [input] Body of the decline confirmation.
  declineBody:
    "Just to confirm — no one from your party can make it? We completely understand, and we'd love to catch up another time.",

  // [input] Button that confirms the whole-party decline.
  declineConfirmLabel: "Confirm — we can't make it",

  // [input] Button that returns to the attendance step.
  declineBackLabel: "Go back",

  // [input] Thank-you shown after a confirmed decline.
  declinedThanksHeading: "Thank you for letting us know",
  declinedThanksBody:
    "We'll miss celebrating with you — hope to see you soon after the big day! 💛",
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

export const ADMIN_COPY = {
  // [input] Heading on the PIN gate.
  pinHeading: "Admin access",

  // [input] Instruction under the PIN heading.
  pinPrompt: "Enter the 4-digit PIN.",

  // [input] Error shown after a wrong PIN.
  pinError: "Incorrect PIN. Try again.",

  // [input] Heading on the admin dashboard.
  dashboardHeading: "Attendance",

  // [input] Placeholder in the admin guest-filter input.
  filterPlaceholder: "Filter by name...",

  // [input] Labels for the filter tabs.
  filterAll: "All",
  filterArrived: "Arrived",
  filterPending: "Pending",

  // [input] Shown when the filter matches no guests.
  noMatches: "No guests match.",

  // [input] Label for the admin entry link (bottom-left of the welcome screen).
  entryLabel: "Attendance",

  // [input] Label on the button that leaves admin and returns to the welcome screen.
  homeLabel: "Home",

  // [input] Data-control button labels in the admin header.
  exportLabel: "Export",
  restoreLabel: "Restore",
  resetLabel: "Reset all",

  // [input] Reset confirmation dialog.
  resetConfirmTitle: "Reset all attendance?",
  resetConfirmBody:
    "This clears every check-in and cannot be undone. Export a backup first if you might need the data.",
  resetConfirmCancel: "Cancel",
  resetConfirmAction: "Reset everything",

  // [input] Restore confirmation dialog. {n} is replaced with the record count.
  restoreConfirmTitle: "Restore {n} check-ins?",
  restoreConfirmBody:
    "This replaces all current attendance with the backup file.",
  restoreConfirmCancel: "Cancel",
  restoreConfirmAction: "Restore",

  // [input] Message when a restore file can't be read/validated.
  restoreError: "Couldn't read that file — is it a SitWhereAh backup?",
};

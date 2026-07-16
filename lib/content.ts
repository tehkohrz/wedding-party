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
  venueName: "Sol & Ora @ The Outpost Hotel",

  // [input] Venue address line (shown under the venue name and in the
  //         Location details card). Set to "" to hide.
  venueAddress: "10 Artillery Ave, #07-01 Sentosa Island, 099951",

  // [input] The place searched on Google Maps — powers BOTH the embedded
  //         map window and the "Get directions" link. Keep it specific
  //         enough that Maps finds the right pin.
  mapQuery: "Sol & Ora, The Outpost Hotel, 10 Artillery Ave, Sentosa, Singapore 099951",

  // [input] Google Maps share URL for the venue. Set to "" to hide the
  //         "Open in Maps" link on the RSVP attendance step.
  mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=Sol+%26+Ora+The+Outpost+Hotel+Sentosa",

  // [input] Day-of schedule (PLACEHOLDER — update with the real programme).
  //         Shown in the landing Details section and on the RSVP flow.
  schedule: [
    { time: "11:30", item: "Tea Ceremony" },
    { time: "12:00", item: "Solemnization" },
    { time: "12:30", item: "Lunch" },
    { time: "15:00", item: "Send-off" },
    { time: "15:30", item: "Afterparty!" },
  ],

  // [input] Attire line in the landing Details section.
  attire: "The solemnisation is outdoors dress for the weather! Beachwear, underwear or birthday suit - Anything you like!",

  // [input] Title of the details section on the landing page.
  detailsHeading: "Details",

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

  // [input] Courses served to everyone BEFORE the mains, in order.
  coursesBeforeMains: [
    {
      course: "Starter",
      name: "Seared Hokkaido Scallop and Tiger Prawn",
      description:
        "Parsnip Puree | Pickled Shimeji Mushrooms | Allium Crumbs | Truffle Caviar",
    },
    {
      course: "Soup",
      name: "Cream of Truffle Mushroom Soup",
      description: "Shimeji Mushrooms | White Truffle Oil | Herb Croutons",
    },
  ],

  // [input] Label above the two main choices in the menu preview.
  mainsChoiceLabel: "Mains — choose one",

  // [input] The two mains. id must stay "A"/"B" (stored in the database);
  //         name/description/image are free. image: drop a file in
  //         public/menu/ and reference it ("/menu/ribeye.jpg"), or "" for none.
  mains: [
    {
      id: "A" as const,
      name: "Roasted USDA Prime Ribeye",
      description:
        "Celeriac Puree | Ratatouille | Broccolini | Pistachio Crumbs | Bordelaise Sauce",
      image: "",
    },
    {
      id: "B" as const,
      name: "Roasted Chicken Roulade",
      description:
        "Garlic Mashed Potato | Shallot | Haricot Beans | Red Wine Sauce",
      image: "",
    },
  ],

  // [input] Courses served to everyone AFTER the mains, in order.
  coursesAfterMains: [
    {
      course: "Dessert",
      name: "Yuzu Apricot Mousse",
      description:
        "Yuzu Mousse | Apricot Compote | White Sponge | Sable | Yuzu Coulis | Crème Anglaise",
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

export const AFTER_PARTY = {
  // [input] Heading on the after-party step.
  heading: "The after-party",

  // [input] Details paragraph — when/where/what. Edit freely.
  description:
    "Once lunch winds down, we're keeping the celebration going — drinks, music and dancing from 7pm at the hotel bar. Casual, come as you are!",

  // [input] The question above the per-person toggles.
  question: "Who's coming along?",

  // [input] The yes / no choice labels.
  yesLabel: "Count me in",
  noLabel: "Sitting this one out",

  // [input] Continue / back buttons.
  continueLabel: "Continue",
  backLabel: "Back",
};

export const RSVP_CONFIRM = {
  // [input] Heading on the summary/confirm step.
  heading: "One last look",

  // [input] Instruction under the heading.
  instruction: "Check everything's right, then send it our way.",

  // [input] The submit button.
  submitLabel: "Confirm RSVP",

  // [input] Back button.
  backLabel: "Back",

  // [input] Shown if submission fails (network/server error).
  submitError: "Something went wrong sending your RSVP — please try again.",

  // [input] Labels used in the summary rows.
  attendingBadge: "Attending",
  decliningBadge: "Not attending",
  afterPartyBadge: "After-party",

  // ── Thank-you / responded view ──
  // [input] Heading right after submitting.
  thanksHeading: "Thank you! See you there 🎉",

  // [input] Heading when revisiting a link that already has a response.
  respondedHeading: "Your RSVP",

  // [input] Note under the summary while editing is still open.
  //         {deadline} is replaced with the RSVP deadline date.
  editUntilNote: "You can update your response until {deadline}.",

  // [input] The edit button on the responded view.
  editLabel: "Edit response",

  // [input] Shown instead of the edit button once the deadline has passed.
  deadlinePassedNote:
    "The RSVP period has closed — contact us directly if anything changes.",

  // [input] Shown when someone opens an un-responded link after the deadline.
  tooLateHeading: "The RSVP period has closed",
  tooLateBody:
    "We've had to lock in numbers with the venue — but do reach out to us directly and we'll see what we can do!",
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
  attendingLabel: "Joyfully attending!",

  // [input] The "no" choice on each member row.
  decliningLabel: "Regretfully decline :(",

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

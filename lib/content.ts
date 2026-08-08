/**
 * User-editable content — names, dates, prompts, microcopy.
 *
 * Every field is marked [input] so you can find them with:
 *   grep -rn "\[input\]" lib/content.ts
 * or your editor's "find in files" for the literal text [input].
 *
 * Change a value, save, watch it update in dev.
 */

export const SITE = {
  // [input] Browser-tab title, shown on every page. Emoji welcome.
  //         (The PWA install name lives in public/manifest.webmanifest.)
  tabTitle: "J ❤️ DK",

  // [input] One-line description (search engines / link previews).
  tabDescription: "Jermaine & Dong Kun are getting married — 31 October 2026",
};

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
  unionWord: "Party 🎉",
};

// ─── RSVP (v2) ────────────────────────────────────────────────────────────────

export const EVENT_DETAILS = {
  // [input] Event date as shown on the RSVP pages.
  date: "31 October 2026, Saturday",

  // [input] Exact event start for the countdown (ISO 8601 with timezone).
  //         +08:00 = Singapore time. Must match the schedule's first entry
  //         AND calendarStart below — three fields, one moment. That moment
  //         is GUEST ARRIVAL, not the ceremony: the calendar block is what
  //         gets people there in time, and the solemnization starts sharp.
  eventStartISO: "2026-10-31T11:50:00+08:00",

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

  // [input] Day-of schedule — this IS the real programme. The 5 minutes
  //         between arrival and solemnization is deliberate: the venue has
  //         nowhere for guests to wait and the booking is short, so the
  //         ceremony starts promptly at 12:05. Don't "fix" it.
  //         Shown in the landing Details section and on the RSVP flow.
  schedule: [
    { time: "11:50", item: "Guest Arrival" },
    { time: "12:00", item: "Solemnization" },
    { time: "12:30", item: "Lunch" },
  ],

  // [input] Attire line in the landing Details section. The joke is
  //         intentional — the solemnization is outdoors at midday and it
  //         will be brutally hot, so the laugh is doing real work: it gets
  //         people to actually dress for the sun. Leave it.
  attire: "Outdoor solemnisation, dress for the sun and breeze. Beachwear, underwear or naked - anything you like!",

  // [input] Title of the details section on the landing page.
  detailsHeading: "Details",

  // [input] FAQ shown at the BOTTOM of the details section. Add, remove or
  //         reorder freely — the list renders in this order and the section
  //         hides itself entirely when the array is empty.
  faqHeading: "Good to know",
  // Ordered getting there → timing → weather → your party, so a guest
  // reading top to bottom answers their questions in the order they'd
  // actually think of them.
  faq: [
    {
      question: "Is there an entry fee to Sentosa?",
      answer:
        "Yes, but there are complimentary entry QR codes which we'll send out closer to the date.",
    },
    {
      question: "Where should I park?",
      answer: "You can park right below the venue at the Outpost Hotel.",
    },
    {
      question: "Can I arrive late?",
      answer:
        "No! We have a tight schedule to keep to — the solemnisation will start on time.",
    },
    {
      question: "What time will it end?",
      answer: "The celebration wraps up at 3 pm.",
    },
    {
      question: "What if it rains?",
      answer:
        "We move the solemnisation indoors to the dining hall — it goes ahead rain or shine.",
    },
    {
      question: "Can I bring my kids or a plus one?",
      answer:
        "We've reserved seats for the names on your RSVP — do let us know if anything changes.",
    },
    {
      question: "What about dietary restrictions?",
      answer:
        "You can note any restrictions when you choose your meal in the RSVP. If you need anything else arranged, just tell us.",
    },
  ] as { question: string; answer: string }[],

  // [input] RSVP deadline (ISO date). After this day, submitted responses
  //         become view-only and the flow shows the deadline notice.
  rsvpDeadline: "2026-09-01",

  // ── "Add to Google Calendar" (offered after RSVP confirmation) ──
  // [input] Event title as it appears in the guest's calendar.
  calendarTitle: "Jermaine & Dong Kun's Wedding 💍",

  // [input] Event start/end in the venue's LOCAL time, format YYYYMMDDTHHMMSS.
  //         Start must match eventStartISO / schedule[0] above.
  calendarStart: "20261031T115000",
  calendarEnd: "20261031T150000",

  // [input] IANA timezone the times above are in.
  calendarTimezone: "Asia/Singapore",

  // [input] Description inside the calendar event. Keep it short.
  calendarDetails: "We can't wait to celebrate with you!",

  // [input] The button label on the thank-you screen.
  calendarButtonLabel: "Add to Google Calendar",
};

export const RSVP_COPY = {
  // [input] The hero title: the name lines render in the pink script, one
  //         per line ("&" lines render smaller), then the flourish line in
  //         olive small caps.
  heroTitleLines: ["Jermaine", "&", "Dong Kun"] as string[],
  heroTitleFlourish: "are getting married!",

  // [input] Shown on the public landing page — guests RSVP only via their
  //         personal link (no public search; protects responses).
  linkOnlyHeading: "RSVP by personal invite",

  // [input] Instruction under the heading.
  linkOnlyNote:
    "Please use the personal RSVP link we sent you — it opens your party's invitation directly. Can't find it? Just message us!",

  // [input] Photo slideshow images, in order. Drop files into public/photos/
  //         and list them here. Empty list = soft gradient placeholder.
  photos: ["/photos/one.jpg", "/photos/two.jpg", "/photos/three.jpg", "/photos/four.jpg", "/photos/five.jpg"] as string[],

  // [input] Seconds each slideshow photo is shown before crossfading.
  slideshowIntervalSeconds: 6,

  // [input] Width of the photo panel in landscape/desktop, as a percentage
  //         of the page (the content side gets the rest). Has no effect on
  //         portrait phones (photo becomes a top banner).
  photoPanelWidthPercent: 50,

  // [input] Height of the photo banner on portrait phones (vh = % of the
  //         screen height).
  photoBannerHeightVh: 28,
};

export const MENU = {
  // [input] Heading on the menu step.
  heading: "Menu",

  // [input] Instruction under the heading.
  instruction: "Choose a main course for each attending guest.",

  // [input] Courses served to everyone BEFORE the mains, in order.
  coursesBeforeMains: [
    {
      course: "Starter",
      name: "Seared Hokkaido Scallop and Tiger Prawn",
      description:
        "Parsnip Puree | Grilled Shimeji Mushrooms | Allium Crumbs | Truffle Caviar",
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
      // [input] One-word label used in the admin (stats, table, totals).
      shortName: "Beef",
      name: "Roasted USDA Prime Ribeye",
      description:
        "Celeriac Puree | Confit Tomatoes | Broccolini | Pistachio Crumbs | Bordelaise Sauce",
      image: "",
    },
    {
      id: "B" as const,
      // [input] One-word label used in the admin (stats, table, totals).
      shortName: "Chicken",
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

  // [input] The kids' meal (children don't pick a main — they toggle this
  //         instead). One line per course.
  kidsMeal: {
    // [input] One-word label used in the admin (stats, table, totals).
    shortName: "Kids",
    name: "Kids' Meal",
    courses: [
      "Nuggets | Fries | Mesclun | Tartar Sauce",
      "Cream of Mushroom Soup",
      "Spaghetti Seafood Tomato Sauce",
      "Fried Churros | Chocolate Sauce",
    ],
  },

  // [input] The kids' meal question + choices on the menu step.
  kidsMealQuestion: "Kids' meal required?",
  kidsMealYes: "Yes please",
  kidsMealNo: "Not needed",

  // [input] The baby-seat question + choices (asked per kid, menu step).
  babySeatQuestion: "Baby seat needed?",
  babySeatYes: "Yes please",
  babySeatNo: "Not needed",

  // [input] Placeholder for the per-person comment box.
  dietaryPlaceholder: "Allergies or dietary needs? (optional)",

  // [input] Continue button on the menu step.
  continueLabel: "Continue",

  // [input] Back button on the menu step.
  backLabel: "Back",
};

export const AFTER_PARTY = {
  // [input] Heading on the after-party step (screen-reader / fallback only —
  //         the card below is the visible title).
  heading: "The after-party",

  // ── The after-party card: styled as a SECOND invitation ──
  // [input] Small-caps line above the script title.
  eyebrow: "And you're invited to",

  // [input] The script title on the card.
  scriptTitle: "The After-Party",

  // [input] Time and place lines inside the card (small caps).
  timeLine: "From 3:30 pm",
  venueLine: "Tanjong Beach Club",

  // [input] Details paragraph — when/where/what. Edit freely.
  // Deliberately does NOT invite again (the eyebrow above and the question
  // below both do) and does not name the venue again (the line above does).
  // "It's our treat" states who's paying as a fact rather than an offer —
  // an offer invites a polite refusal.
  description:
    "Sun, sand and sea to see out the day. It's our treat — just bring yourselves.",

  // [input] The question above the per-person toggles.
  question: "Who's coming along?",

  // [input] The yes / no choice labels. The joke lives on the yes button —
  // guests declining for real reasons (a flight, small kids) shouldn't have
  // to click something that calls them a spoilsport.
  yesLabel: "Count me in",
  noLabel: "Can't make this one",

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
  afterPartyBadge: "Joining the after-party!",
  afterPartyNoBadge: "Skipping the after-party",
  // [input] Badge on a plus-one row when no plus-one is coming.
  noPlusOneBadge: "No plus one",
  // [input] Badge on a kid's summary row when a baby seat was requested.
  babySeatBadge: "Baby seat requested",

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
  // [input] Labels for the progress pills across the top of the RSVP flow.
  //         afterPartyStepLabel must match its entry in stepLabels — it's
  //         hidden for groups with nobody invited to the after-party.
  stepLabels: ["Your party", "Menu", "After-party", "Confirm"],
  afterPartyStepLabel: "After-party",

  // ── Step: intro (the personal link's landing view) ──
  // [input] Greeting above the RSVP button. {name} = the invited guest.
  introGreeting: "You are invited {name}!",

  // [input] The big button that starts the RSVP.
  respondLabel: "RSVP",

  // [input] Small-caps label above the deadline date, under the RSVP
  //         button. The date itself comes from EVENT_DETAILS.rsvpDeadline.
  rsvpByLabel: "RSVP by",

  // ── Step: attendance ──
  // [input] Heading on the attendance step.
  attendanceHeading: "Will you be joining us?",

  // [input] Instruction under the heading.
  attendanceInstruction:
    "Let us know for each person — tap an answer for everyone below.",

  // [input] The "yes" choice on each member row.
  attendingLabel: "Joyfully attending!",

  // [input] The "no" choice on each member row.
  decliningLabel: "Regretfully declining :(",

  // [input] Continue button (enabled once everyone has an answer).
  continueLabel: "Continue",

  // [input] Back link on the first form step — returns to the invitation.
  attendanceBackLabel: "Back to the invitation",

  // ── Plus-ones (guest rows marked is_plus_one in the CSV / database) ──
  // [input] The question on a plus-one row (replaces the placeholder name).
  plusOneQuestion: "Bringing a plus one?",

  // [input] The yes/no choices on a plus-one row.
  plusOneYesLabel: "Yes, bringing someone",
  plusOneNoLabel: "Not this time",

  // [input] Shown wherever an unnamed plus one needs a label (menu step,
  //         summary) — the database placeholder name is never displayed.
  plusOneFallbackName: "Plus one",

  // [input] Label + placeholder for the (optional) plus-one name field,
  //         shown once "yes" is picked. Leaving it unchanged keeps the
  //         placeholder name from the guest list.
  plusOneNameLabel: "Their name, so we can greet them properly:",
  plusOneNamePlaceholder: "Name (optional)",

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

export const SEARCH_CONFIG = {
  // [input] Minimum letters typed before the day-of searches (check-in,
  //         seating lookup) show results. 2 keeps two-letter guests (DK,
  //         QY, CY) findable while stopping single-letter noise.
  minQueryLength: 2,

  // [input] Guest ids hidden from the day-of searches (e.g. the couple —
  //         you don't check yourselves in at the kiosk).
  hiddenGuestIds: [1, 2] as number[],

  // [input] Seating-group ids hidden entirely from the day-of searches.
  hiddenSeatingGroupIds: [] as string[],
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

  // ── Links tab (the send-out list) ──
  // [input] Hint shown above the grouped link list.
  linksHint:
    "Any member's link opens their whole invitation, so you can message one person per household — or send everyone their own. Plus-ones have no link; their host answers for them.",

  // ── Chase tab (following up on non-responders) ──
  // [input] Hint above the chase list.
  chaseHint:
    "Invitations with nobody in the party responded yet. Send the reminder to any one member — their link opens the whole party's RSVP.",

  // [input] The nudge message copied by the Remind button.
  //         Placeholders: {name} {link} {date} {deadline} {days}.
  reminderMessageTemplate:
    "Hi {name}! Just a gentle nudge — we haven't caught your RSVP for {date} yet, and we need to give the venue our numbers by {deadline}. Here's your invitation again: {link}\n\nThank you! 🤍",

  // [input] The WhatsApp message copied by the Message button.
  //         Placeholders: {name} {link} {date} {deadline}.
  linkMessageTemplate:
    "Hi {name}! We're getting married on {date} 🎉 Here's your personal invitation — it has all the details and your RSVP: {link}\n\nDo let us know by {deadline}. Can't wait to celebrate with you!",
};

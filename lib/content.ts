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
  instruction: "Please enter your name to find your seat.",

  // [input] Placeholder text inside the input box.
  inputPlaceholder: "Your name...",
};

"use client";

/**
 * The numbers that sit above the guest table — the counts the couple
 * quotes to the venue: headcount, after-party uptake, main-course split
 * and high chairs.
 *
 * Food and baby-seat figures count ATTENDING guests only (a decliner's
 * leftover answers are meaningless to the caterer).
 */
interface StatGuest {
  is_kid: boolean;
  attending: boolean | null;
  food_choice: "A" | "B" | "K" | null;
  after_party: boolean | null;
  after_party_invited: boolean;
  baby_seat: boolean | null;
}

export function GuestsStats({ guests }: { guests: StatGuest[] }) {
  const attending = guests.filter((g) => g.attending === true);
  const food = (c: "A" | "B" | "K") =>
    attending.filter((g) => g.food_choice === c).length;

  const tiles = [
    {
      label: "Guests",
      value: String(guests.length),
      sub: `${guests.filter((g) => g.is_kid).length} kids · ${attending.length} attending`,
    },
    {
      label: "After-party",
      value: `${attending.filter((g) => g.after_party === true).length} / ${
        guests.filter((g) => g.after_party_invited).length
      }`,
      sub: "accepted / invited",
    },
    {
      label: "Mains",
      value: `A ${food("A")} · B ${food("B")}`,
      sub: `${food("K")} kids' meals`,
    },
    {
      label: "Baby seats",
      value: String(attending.filter((g) => g.baby_seat === true).length),
      sub: "high chairs needed",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-card bg-muted/50 px-3 py-2">
          <p className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
            {t.label}
          </p>
          <p className="font-display text-xl leading-tight">{t.value}</p>
          <p className="font-sans text-[10px] text-muted-foreground">{t.sub}</p>
        </div>
      ))}
    </div>
  );
}

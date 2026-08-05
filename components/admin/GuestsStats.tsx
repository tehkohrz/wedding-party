"use client";

/**
 * The numbers that sit above the guest table — the counts the couple
 * quotes to the venue: headcount, after-party uptake, main-course split
 * and high chairs.
 *
 * Food and baby-seat figures count ATTENDING guests only (a decliner's
 * leftover answers are meaningless to the caterer).
 */
import { MENU } from "@/lib/content";

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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <Tile
        label="Guests"
        value={String(guests.length)}
        sub={`${guests.filter((g) => g.is_kid).length} kids · ${attending.length} attending`}
      />
      <Tile
        label="After-party"
        value={`${attending.filter((g) => g.after_party === true).length} / ${
          guests.filter((g) => g.after_party_invited).length
        }`}
        sub="accepted / invited"
      />

      {/* Meals by their real names — the caterer's numbers. Kids' meals
          count alongside the two mains rather than as a footnote. */}
      <div className="rounded-card bg-muted/50 px-3 py-2">
        <p className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
          Meals
        </p>
        <div className="mt-0.5 space-y-0.5">
          {[
            ...MENU.mains.map((m) => ({
              name: m.shortName,
              n: food(m.id),
            })),
            { name: MENU.kidsMeal.shortName, n: food("K") },
          ].map((row) => (
            <div
              key={row.name}
              className="flex items-baseline justify-between gap-2"
            >
              <span className="font-sans text-xs text-muted-foreground">
                {row.name}
              </span>
              <span className="font-display text-base leading-none">
                {row.n}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Tile
        label="Baby seats"
        value={String(attending.filter((g) => g.baby_seat === true).length)}
        sub="high chairs needed"
      />
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-card bg-muted/50 px-3 py-2">
      <p className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-xl leading-tight">{value}</p>
      <p className="font-sans text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

/**
 * SeatingMap — renders the venue purely from layout.csv (Path A).
 *
 * Structure: rows stacked vertically; within a row, sections sit side by
 * side with a gap; within a section, seats are circles numbered by their
 * actual seat number (continuous across sections in the same row).
 *
 * `highlights` is an array of seats to mark, each with a bouquet color.
 * Used by the lunch screen to show the current guest plus every group
 * member in their assigned bouquet color (matching their name box).
 *
 * Session 13 will layer attendance coloring on the rest. Session 14 adds
 * pinch-zoom. Path B (Figma SVG background) is deferred — see PROGRESS.md.
 */
import { cn } from "@/lib/utils";
import { layout } from "@/lib/data";
import type { LayoutSection } from "@/lib/schema";

export interface SeatHighlight {
  row: number;
  section: string | null;
  seat: number;
  /** Bouquet color name — must map to a CSS variable in the active theme. */
  color: string;
  /**
   * - "arrived": guest is checked in — solid color fill with a ring
   * - "pending": guest is in your group but not yet checked in — colored
   *   outline + light tint so the seat is identifiable but visually
   *   distinct from arrived seats
   */
  state: "arrived" | "pending";
}

function seatKey(row: number, section: string | null, seat: number): string {
  return `${row}|${section ?? ""}|${seat}`;
}

export function SeatingMap({
  highlights = [],
}: {
  highlights?: SeatHighlight[];
}) {
  // Fast O(1) lookup for "is this seat highlighted, and in what color?"
  const highlightMap = new Map<string, SeatHighlight>();
  for (const h of highlights) {
    highlightMap.set(seatKey(h.row, h.section, h.seat), h);
  }

  // Group layout sections by row number.
  const byRow = new Map<number, LayoutSection[]>();
  for (const section of layout) {
    const list = byRow.get(section.row) ?? [];
    list.push(section);
    byRow.set(section.row, list);
  }
  const rows = [...byRow.entries()].sort(([a], [b]) => a - b);

  return (
    <div className="flex flex-col gap-10 items-center">
      {rows.map(([rowNum, sections]) => (
        <div key={rowNum} className="flex flex-col items-center gap-2">
          <div className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Row {rowNum}
          </div>
          {/* Sections within the row, left to right by seat number */}
          <div className="flex items-start gap-6">
            {sections
              .slice()
              .sort((a, b) => a.start_seat - b.start_seat)
              .map((section) => (
                <SectionBlock
                  key={`${rowNum}-${section.section ?? "_"}`}
                  section={section}
                  highlightMap={highlightMap}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionBlock({
  section,
  highlightMap,
}: {
  section: LayoutSection;
  highlightMap: Map<string, SeatHighlight>;
}) {
  const seats: number[] = [];
  for (let n = section.start_seat; n <= section.end_seat; n++) seats.push(n);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex gap-1.5">
        {seats.map((n) => {
          const h = highlightMap.get(seatKey(section.row, section.section, n));
          return <Seat key={n} number={n} highlight={h} />;
        })}
      </div>
      {section.section && (
        <div className="font-sans text-[10px] text-muted-foreground">
          {section.label}
        </div>
      )}
    </div>
  );
}

function Seat({
  number,
  highlight,
}: {
  number: number;
  highlight: SeatHighlight | undefined;
}) {
  // Unhighlighted: muted disc + muted text.
  if (!highlight) {
    return (
      <div
        className={cn(
          "size-9 rounded-full grid place-items-center",
          "font-sans text-xs transition-colors",
          "bg-muted text-muted-foreground"
        )}
      >
        {number}
      </div>
    );
  }

  // Arrived: solid color fill, white bold number, soft same-color ring.
  if (highlight.state === "arrived") {
    return (
      <div
        className="size-9 rounded-full grid place-items-center font-sans text-xs font-bold text-white transition-colors"
        style={{
          backgroundColor: `hsl(var(--${highlight.color}))`,
          boxShadow: `0 0 0 4px hsl(var(--${highlight.color}) / 0.3)`,
        }}
      >
        {number}
      </div>
    );
  }

  // Pending (in your group but not yet checked in): colored outline,
  // light tint fill, colored bold number. Identifiable as "theirs" but
  // visually distinct from arrived (no solid fill, no ring).
  return (
    <div
      className="size-9 rounded-full grid place-items-center font-sans text-xs font-bold border-2 transition-colors"
      style={{
        borderColor: `hsl(var(--${highlight.color}))`,
        backgroundColor: `hsl(var(--${highlight.color}) / 0.18)`,
        color: `hsl(var(--${highlight.color}))`,
      }}
    >
      {number}
    </div>
  );
}

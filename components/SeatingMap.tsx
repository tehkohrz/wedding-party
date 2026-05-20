/**
 * SeatingMap — renders the venue purely from layout.csv (Path A).
 *
 * Structure: rows stacked vertically; within a row, sections sit side by
 * side with a gap; within a section, seats are circles numbered by their
 * actual seat number (continuous across sections in the same row).
 *
 * `highlight` marks one seat as the current guest's — it's filled in the
 * primary color with a ring. Session 13 adds attendance coloring + the
 * floating SeatCallout; Session 14 adds pinch-zoom.
 *
 * Path B (a Figma SVG venue background) is deferred — see PROGRESS.md.
 */
import { cn } from "@/lib/utils";
import { layout } from "@/lib/data";
import type { LayoutSection } from "@/lib/schema";

export interface SeatRef {
  row: number;
  section: string | null;
  seat: number;
}

export function SeatingMap({ highlight }: { highlight?: SeatRef }) {
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
                  highlight={highlight}
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
  highlight,
}: {
  section: LayoutSection;
  highlight?: SeatRef;
}) {
  // Seat numbers in this section: start_seat..end_seat inclusive.
  const seats: number[] = [];
  for (let n = section.start_seat; n <= section.end_seat; n++) seats.push(n);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex gap-1.5">
        {seats.map((n) => {
          const isHighlighted =
            highlight !== undefined &&
            highlight.row === section.row &&
            highlight.section === section.section &&
            highlight.seat === n;
          return <Seat key={n} number={n} highlighted={isHighlighted} />;
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
  highlighted,
}: {
  number: number;
  highlighted: boolean;
}) {
  return (
    <div
      className={cn(
        "size-9 rounded-full grid place-items-center",
        "font-sans text-xs transition-colors",
        highlighted
          ? "bg-primary text-primary-foreground ring-4 ring-primary/30"
          : "bg-muted text-muted-foreground"
      )}
    >
      {number}
    </div>
  );
}

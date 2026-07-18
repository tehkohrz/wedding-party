/**
 * GET /api/admin/overview — the RSVP numbers the couple reports to the
 * event manager: response progress, attending totals by side, food counts
 * (adults vs kids' meals), after-party headcount, and a per-group table.
 */
import { db, type DbGuest } from "@/lib/db";
import { isAuthed, unauthorized } from "@/lib/adminAuth";

export async function GET(req: Request) {
  if (!isAuthed(req)) return unauthorized();

  const client = db();
  const [guestsRes, groupsRes] = await Promise.all([
    client.from("guests").select("*").order("id"),
    client.from("rsvp_groups").select("id, label").order("id"),
  ]);
  if (guestsRes.error || groupsRes.error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  const guests = (guestsRes.data ?? []) as DbGuest[];
  const groups = groupsRes.data ?? [];

  const responded = guests.filter((g) => g.responded_at !== null);
  const attending = responded.filter((g) => g.attending === true);
  const declined = responded.filter((g) => g.attending === false);

  const foodCount = (choice: "A" | "B" | "K") =>
    attending.filter((g) => g.food_choice === choice).length;

  const bySide = (side: "bride" | "groom") => ({
    total: guests.filter((g) => g.side === side).length,
    attending: attending.filter((g) => g.side === side).length,
  });

  const guestsByGroup = new Map<string, DbGuest[]>();
  for (const g of guests) {
    const key = g.rsvp_group_id ?? "";
    const list = guestsByGroup.get(key) ?? [];
    list.push(g);
    guestsByGroup.set(key, list);
  }

  return Response.json({
    guests: {
      total: guests.length,
      responded: responded.length,
      attending: attending.length,
      declined: declined.length,
      pending: guests.length - responded.length,
      kidsAttending: attending.filter((g) => g.is_kid).length,
    },
    side: { bride: bySide("bride"), groom: bySide("groom") },
    food: {
      A: foodCount("A"),
      B: foodCount("B"),
      kidsMeals: foodCount("K"),
      // Attending kids whose party said "no meal needed":
      kidsNoMeal: attending.filter((g) => g.is_kid && g.food_choice === null)
        .length,
      babySeats: attending.filter((g) => g.baby_seat === true).length,
    },
    afterParty: attending.filter((g) => g.after_party === true).length,
    groups: groups.map((grp) => {
      const members = guestsByGroup.get(grp.id) ?? [];
      return {
        id: grp.id,
        label: grp.label,
        responded: members.some((m) => m.responded_at !== null),
        members: members.map((m) => ({
          name: m.name,
          is_kid: m.is_kid,
          is_plus_one: m.is_plus_one,
          attending: m.attending,
          food_choice: m.food_choice,
          after_party: m.after_party,
          baby_seat: m.baby_seat,
          dietary_comment: m.dietary_comment,
        })),
      };
    }),
  });
}

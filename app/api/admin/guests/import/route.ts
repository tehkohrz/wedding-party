/**
 * POST /api/admin/guests/import — bulk guest import from a Google-Sheets
 * CSV (parsed client-side; this endpoint takes the parsed rows).
 *
 * Deliberate limits, agreed with the couple:
 *   - CONFIG ONLY. Name, side, groups, kid/plus-one/after-party flags,
 *     aliases and seats are applied; RSVP responses are never touched, so
 *     importing a stale sheet can't wipe what guests actually submitted.
 *   - NON-DESTRUCTIVE. Guests missing from the CSV are reported back, not
 *     deleted — removal stays a deliberate click in the admin table.
 *   - Rows with a blank id CREATE a guest (db-assigned id, groups
 *     auto-created, personal link generated unless they're a plus-one).
 *   - Renames keep existing links working (a slug resolves to the group);
 *     no new slug is minted here, unlike the single-guest PATCH.
 */
import { z } from "zod";
import { db } from "@/lib/db";
import { isAuthed, unauthorized } from "@/lib/adminAuth";
import { slugify } from "@/lib/slug";

const RowSchema = z.object({
  id: z.number().int().positive().nullable(),
  name: z.string().trim().min(1).max(80),
  side: z.enum(["bride", "groom"]),
  rsvp_group_id: z.string().trim().min(1).nullable(),
  seating_group_id: z.string().trim().min(1).nullable(),
  is_kid: z.boolean(),
  is_plus_one: z.boolean(),
  after_party_invited: z.boolean(),
  search_aliases: z.string(),
  row_num: z.number().int().positive().nullable(),
  section: z.string().trim().min(1).nullable(),
  seat: z.number().int().positive().nullable(),
});

const ImportSchema = z.object({
  rows: z.array(RowSchema).min(1).max(500),
});

export async function POST(req: Request) {
  if (!isAuthed(req)) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = ImportSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid rows — check the CSV columns and values." },
      { status: 400 }
    );
  }
  const rows = parsed.data.rows;
  const client = db();

  // Existing guests, for update-vs-create and the missing-rows report.
  const existingRes = await client.from("guests").select("id, name");
  if (existingRes.error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }
  const existingIds = new Set((existingRes.data ?? []).map((g) => g.id as number));

  // Auto-create every referenced group up front so no FK can reject a row.
  const rsvpGroups = new Map<string, string>();
  const seatingGroups = new Map<string, string>();
  for (const r of rows) {
    if (r.rsvp_group_id && !rsvpGroups.has(r.rsvp_group_id))
      rsvpGroups.set(r.rsvp_group_id, r.name);
    if (r.seating_group_id && !seatingGroups.has(r.seating_group_id))
      seatingGroups.set(r.seating_group_id, r.name);
  }
  if (rsvpGroups.size > 0) {
    const up = await client.from("rsvp_groups").upsert(
      [...rsvpGroups].map(([id, label]) => ({ id, label })),
      { onConflict: "id", ignoreDuplicates: true }
    );
    if (up.error) {
      return Response.json({ error: "Database error (groups)" }, { status: 500 });
    }
  }
  if (seatingGroups.size > 0) {
    const up = await client.from("seating_groups").upsert(
      [...seatingGroups].map(([id, label]) => ({ id, label })),
      { onConflict: "id", ignoreDuplicates: true }
    );
    if (up.error) {
      return Response.json({ error: "Database error (groups)" }, { status: 500 });
    }
  }

  const config = (r: z.infer<typeof RowSchema>) => ({
    name: r.name,
    side: r.side,
    rsvp_group_id: r.rsvp_group_id,
    seating_group_id: r.seating_group_id,
    is_kid: r.is_kid,
    is_plus_one: r.is_plus_one,
    after_party_invited: r.after_party_invited,
    search_aliases: r.search_aliases,
    row_num: r.row_num,
    section: r.section,
    seat: r.seat,
  });

  let updated = 0;
  const created: string[] = [];
  const failed: string[] = [];
  const seenIds = new Set<number>();

  for (const r of rows) {
    // ── Update an existing guest ──
    if (r.id !== null && existingIds.has(r.id)) {
      seenIds.add(r.id);
      const res = await client.from("guests").update(config(r)).eq("id", r.id);
      if (res.error) failed.push(`${r.name} (#${r.id})`);
      else updated += 1;
      continue;
    }

    // ── Create a new guest (blank id, or an id we don't know) ──
    const ins = await client
      .from("guests")
      .insert(config(r))
      .select()
      .single();
    if (ins.error || !ins.data) {
      failed.push(r.name);
      continue;
    }
    const newId = ins.data.id as number;
    seenIds.add(newId);

    // Solo guests get their own group so their link resolves.
    let groupId = r.rsvp_group_id;
    if (!groupId) {
      groupId = `SOLO_${newId}`;
      await client
        .from("rsvp_groups")
        .upsert(
          { id: groupId, label: r.name },
          { onConflict: "id", ignoreDuplicates: true }
        );
      await client
        .from("guests")
        .update({ rsvp_group_id: groupId })
        .eq("id", newId);
    }

    // Personal link (plus-ones never get one).
    if (!r.is_plus_one) {
      const base = slugify(r.name) || `guest-${newId}`;
      const taken = await client
        .from("rsvp_slugs")
        .select("slug")
        .like("slug", `${base}%`);
      const used = new Set((taken.data ?? []).map((s) => s.slug as string));
      let slug = base;
      for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
      await client
        .from("rsvp_slugs")
        .insert({ slug, group_id: groupId, guest_id: newId });
    }
    created.push(r.name);
  }

  // Reported, never deleted (the couple's choice).
  const missing = (existingRes.data ?? [])
    .filter((g) => !seenIds.has(g.id as number))
    .map((g) => `${g.name} (#${g.id})`);

  return Response.json({ updated, created, missing, failed });
}

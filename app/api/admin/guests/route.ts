/**
 * /api/admin/guests — the admin guest table.
 *
 * GET  → full guest list for the editor.
 * POST → create a guest: the id comes from the database (identity
 *        sequence — nobody types ids), groups auto-created (label = the
 *        guest's name; rename later), personal link generated unless the
 *        guest is a plus-one. Solo guests (no rsvp group given) get their
 *        own SOLO_<id> group so the link resolves.
 */
import { z } from "zod";
import { db } from "@/lib/db";
import { isAuthed, unauthorized } from "@/lib/adminAuth";
import { slugify } from "@/lib/slug";

export async function GET(req: Request) {
  if (!isAuthed(req)) return unauthorized();

  const { data, error } = await db().from("guests").select("*").order("id");
  if (error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }
  return Response.json({ guests: data ?? [] });
}

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  side: z.enum(["bride", "groom"]),
  rsvp_group_id: z.string().trim().min(1).nullable().optional(),
  seating_group_id: z.string().trim().min(1).nullable().optional(),
  is_kid: z.boolean().optional(),
  is_plus_one: z.boolean().optional(),
  after_party_invited: z.boolean().optional(),
  search_aliases: z.string().optional(),
  row_num: z.number().int().positive().nullable().optional(),
  section: z.string().trim().min(1).nullable().optional(),
  seat: z.number().int().positive().nullable().optional(),
});

export async function POST(req: Request) {
  if (!isAuthed(req)) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid guest" }, { status: 400 });
  }
  const g = parsed.data;
  const client = db();

  // Groups given explicitly are auto-created up front (labels default to
  // the guest's name; rename later). The SOLO group for guests WITHOUT a
  // group needs the id, which the DATABASE assigns (identity column) — so
  // that case inserts first and attaches the group after.
  if (g.rsvp_group_id) {
    const up = await client
      .from("rsvp_groups")
      .upsert(
        { id: g.rsvp_group_id, label: g.name },
        { onConflict: "id", ignoreDuplicates: true }
      );
    if (up.error) {
      return Response.json({ error: "Database error" }, { status: 500 });
    }
  }
  if (g.seating_group_id) {
    const up = await client
      .from("seating_groups")
      .upsert(
        { id: g.seating_group_id, label: g.name },
        { onConflict: "id", ignoreDuplicates: true }
      );
    if (up.error) {
      return Response.json({ error: "Database error" }, { status: 500 });
    }
  }

  const row = {
    name: g.name,
    search_aliases: g.search_aliases ?? "",
    side: g.side,
    rsvp_group_id: g.rsvp_group_id ?? null,
    seating_group_id: g.seating_group_id ?? null,
    is_kid: g.is_kid ?? false,
    is_plus_one: g.is_plus_one ?? false,
    after_party_invited: g.after_party_invited ?? false,
    row_num: g.row_num ?? null,
    section: g.section ?? null,
    seat: g.seat ?? null,
  };

  // The id comes from the guests.id identity sequence. Fallback for a
  // database that hasn't run the identity migration yet: max(id)+1.
  let ins = await client.from("guests").insert(row).select().single();
  if (ins.error) {
    const maxRes = await client
      .from("guests")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);
    if (maxRes.error) {
      return Response.json({ error: "Insert failed" }, { status: 500 });
    }
    const fallbackId = ((maxRes.data?.[0]?.id as number | undefined) ?? 0) + 1;
    ins = await client
      .from("guests")
      .insert({ id: fallbackId, ...row })
      .select()
      .single();
    if (ins.error) {
      return Response.json({ error: "Insert failed" }, { status: 500 });
    }
  }
  const id = ins.data.id as number;

  // Solo guest: now that the id exists, create their personal group and
  // attach it.
  let rsvpGroupId = g.rsvp_group_id ?? null;
  if (!rsvpGroupId) {
    rsvpGroupId = `SOLO_${id}`;
    const up = await client
      .from("rsvp_groups")
      .upsert(
        { id: rsvpGroupId, label: g.name },
        { onConflict: "id", ignoreDuplicates: true }
      );
    if (up.error) {
      return Response.json({ error: "Database error" }, { status: 500 });
    }
    const att = await client
      .from("guests")
      .update({ rsvp_group_id: rsvpGroupId })
      .eq("id", id)
      .select()
      .single();
    if (att.error) {
      return Response.json({ error: "Database error" }, { status: 500 });
    }
    ins = att;
  }

  // Personal link (plus-ones never get one).
  let slug: string | null = null;
  if (!(g.is_plus_one ?? false)) {
    const base = slugify(g.name) || `guest-${id}`;
    const existing = await client
      .from("rsvp_slugs")
      .select("slug")
      .like("slug", `${base}%`);
    const taken = new Set((existing.data ?? []).map((r) => r.slug as string));
    slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
    const slugIns = await client
      .from("rsvp_slugs")
      .insert({ slug, group_id: rsvpGroupId, guest_id: id });
    if (slugIns.error) {
      return Response.json(
        { error: "Guest created but link generation failed" },
        { status: 500 }
      );
    }
  }

  return Response.json({ guest: ins.data, slug });
}

/**
 * Dump every table to backups/<timestamp>-<project-ref>/ as CSV + JSON.
 *
 *   pnpm snapshot                 # project in SUPABASE_URL / SUPABASE_SECRET_KEY
 *   pnpm snapshot OLD_SUPABASE    # another project, via OLD_SUPABASE_URL/_SECRET_KEY
 *
 * Written after a multi-hour Supabase outage left the live guest list as the
 * only copy of data that had drifted well past data/guests.csv.
 *
 * backups/ is gitignored ON PURPOSE — this repository is PUBLIC and the dumps
 * contain guests' names and, once responses land, their dietary notes.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const TABLES: Record<string, string> = {
  guests: "id",
  rsvp_groups: "id",
  seating_groups: "id",
  rsvp_slugs: "slug",
  attendance: "guest_id",
};

async function main() {
  const prefix = process.argv[2] ?? "SUPABASE";      // SUPABASE | OLD_SUPABASE
  const stamp = process.argv[3] ?? new Date().toISOString().replace(/[:.]/g, "").replace(/-/g, "-");
  for (const line of readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  const url = process.env[`${prefix}_URL`];
  const key = process.env[`${prefix}_SECRET_KEY`];
  if (!url || !key) { console.error(`missing ${prefix}_URL / ${prefix}_SECRET_KEY in .env.local`); process.exit(1); }
  const ref = url.replace(/^https:\/\//, "").split(".")[0];
  const s = createClient(url, key, { auth: { persistSession: false } });

  const dir = resolve(process.cwd(), "backups", `${stamp}-${ref}`);
  mkdirSync(dir, { recursive: true });
  const all: Record<string, unknown[]> = {};

  for (const [table, order] of Object.entries(TABLES)) {
    const { data, error } = await s.from(table).select("*").order(order);
    if (error) { console.log(`  ${table.padEnd(15)} SKIPPED (${error.message})`); continue; }
    const rows = data ?? [];
    all[table] = rows;
    const cols = rows.length ? Object.keys(rows[0]) : [];
    const q = (v: unknown) =>
      v === null || v === undefined ? "" : `"${String(v).replace(/"/g, '""')}"`;
    const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => q((r as Record<string, unknown>)[c])).join(","))].join("\n");
    writeFileSync(resolve(dir, `${table}.csv`), "﻿" + csv, "utf8");
    console.log(`  ${table.padEnd(15)} ${String(rows.length).padStart(4)} rows`);
  }

  // Single-file JSON too: exact types, easy to restore from programmatically.
  writeFileSync(resolve(dir, "snapshot.json"), JSON.stringify({ project: ref, takenAt: stamp, tables: all }, null, 2));
  console.log(`\n  → ${dir}`);
}
main().catch((e) => { console.error(e); process.exit(1); });

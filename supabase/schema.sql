-- SitWhereAh v2 schema.
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- when creating the project. Idempotent: safe to re-run.
--
-- Access model: the app talks to the DB exclusively through Next.js route
-- handlers using the service-role key, so RLS is intentionally NOT used.
-- We still enable RLS with no policies as a safety net — it blocks the anon
-- key entirely should it ever leak into client code.

-- ─── Groups ──────────────────────────────────────────────────────────────────
create table if not exists groups (
  id    text primary key,          -- e.g. 'FAM_TAN' (from groups.csv)
  label text not null              -- e.g. 'Tan Family'
);

-- ─── RSVP slugs ──────────────────────────────────────────────────────────────
-- Name-based personal links: one slug per GUEST, resolving to their GROUP.
-- /r/john-tan and /r/jane-tan both open FAM_TAN's group RSVP.
-- Separate table so a group has many slugs and old links never break.
create table if not exists rsvp_slugs (
  slug     text primary key,       -- 'john-tan' (kebab-case, deduped by seed)
  group_id text not null references groups(id) on delete cascade
);

-- ─── Guests ──────────────────────────────────────────────────────────────────
create table if not exists guests (
  id              int primary key,
  name            text not null,
  search_aliases  text not null default '',  -- semicolon-separated (CSV parity)
  side            text not null check (side in ('bride','groom')),
  group_id        text references groups(id) on delete set null,

  -- Seating: nullable until assigned after the RSVP deadline.
  -- ("row" is a reserved-ish word; row_num avoids quoting headaches.)
  row_num         int,
  section         text,
  seat            int,

  -- RSVP response (all null = no response yet)
  attending       boolean,
  food_choice     text check (food_choice in ('A','B')),
  dietary_comment text,
  after_party     boolean,
  responded_at    timestamptz
);

create index if not exists guests_group_idx on guests(group_id);

-- ─── Day-of attendance ───────────────────────────────────────────────────────
create table if not exists attendance (
  guest_id   int primary key references guests(id) on delete cascade,
  arrived_at timestamptz not null default now()
);

-- ─── RLS safety net (no policies = anon key can do nothing) ─────────────────
alter table groups     enable row level security;
alter table rsvp_slugs enable row level security;
alter table guests     enable row level security;
alter table attendance enable row level security;

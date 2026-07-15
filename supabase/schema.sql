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
  id    text primary key,          -- from guests.csv group_id (or SOLO_<id>)
  label text not null              -- e.g. 'Tan Family'
);

-- ─── RSVP slugs ──────────────────────────────────────────────────────────────
-- Name-based personal links: one slug per GUEST, resolving to their GROUP.
-- /r/john-tan and /r/jane-tan both open FAM_TAN's group RSVP.
-- Separate table so a group has many slugs and old links never break.
-- guest_id records whose name the slug is (landing-search routing, greetings).
-- Note: guests is created below, so the FK is added at the end of this file.
create table if not exists rsvp_slugs (
  slug     text primary key,       -- 'john-tan' (kebab-case, deduped by seed)
  group_id text not null references groups(id) on delete cascade,
  guest_id int
);

-- Migration guard for databases created before guest_id existed:
alter table rsvp_slugs add column if not exists guest_id int;

-- ─── Guests ──────────────────────────────────────────────────────────────────
create table if not exists guests (
  id              int primary key,
  name            text not null,
  search_aliases  text not null default '',  -- semicolon-separated (CSV parity)
  side            text not null check (side in ('bride','groom')),
  group_id        text references groups(id) on delete set null,
  is_kid          boolean not null default false,  -- kids' meals counted separately

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

-- Migration guard for databases created before is_kid existed:
alter table guests add column if not exists is_kid boolean not null default false;

-- ─── Day-of attendance ───────────────────────────────────────────────────────
create table if not exists attendance (
  guest_id   int primary key references guests(id) on delete cascade,
  arrived_at timestamptz not null default now()
);

-- ─── Deferred FK: rsvp_slugs.guest_id → guests (guests created above) ───────
do $$ begin
  alter table rsvp_slugs
    add constraint rsvp_slugs_guest_fk
    foreign key (guest_id) references guests(id) on delete cascade;
exception when duplicate_object then null;  -- already added on a prior run
end $$;

-- ─── RLS safety net (no policies = anon key can do nothing) ─────────────────
alter table groups     enable row level security;
alter table rsvp_slugs enable row level security;
alter table guests     enable row level security;
alter table attendance enable row level security;

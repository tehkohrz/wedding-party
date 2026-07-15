-- SitWhereAh v2 schema.
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- ⚠️ MIGRATING from the earlier single-group schema (before rsvp/seating
-- groups were split)? Nothing precious exists pre-RSVP-launch, so the
-- simplest migration is a clean rebuild — run this first, then this whole
-- file, then `pnpm seed:db`:
--
--   drop table if exists attendance, rsvp_slugs, guests, groups cascade;
--
-- Access model: the app talks to the DB exclusively through Next.js route
-- handlers using the secret key, so RLS is intentionally NOT used. We still
-- enable RLS with no policies as a safety net — it blocks the publishable
-- key entirely should it ever leak into client code.

-- ─── RSVP groups: who RESPONDS together (couple / household) ────────────────
create table if not exists rsvp_groups (
  id    text primary key,          -- from guests.csv rsvp_group_id (or SOLO_<id>)
  label text not null              -- auto-derived from member names; editable
);

-- ─── Seating groups: who SITS + ARRIVES together (the table / circle) ───────
create table if not exists seating_groups (
  id    text primary key,          -- from guests.csv seating_group_id
  label text not null
);

-- ─── RSVP slugs ──────────────────────────────────────────────────────────────
-- Name-based personal links: one slug per GUEST, resolving to their RSVP
-- group. /r/justin and /r/kim both open that couple's RSVP.
-- guest_id records whose name the slug is (landing-search routing, greeting).
create table if not exists rsvp_slugs (
  slug     text primary key,       -- 'john-tan' (kebab-case, deduped by seed)
  group_id text not null references rsvp_groups(id) on delete cascade,
  guest_id int                     -- FK added at the end (guests created below)
);

-- ─── Guests ──────────────────────────────────────────────────────────────────
create table if not exists guests (
  id               int primary key,
  name             text not null,
  search_aliases   text not null default '',  -- semicolon-separated (CSV parity)
  side             text not null check (side in ('bride','groom')),
  rsvp_group_id    text references rsvp_groups(id) on delete set null,
  seating_group_id text references seating_groups(id) on delete set null,
  is_kid           boolean not null default false,  -- kids' meals counted separately

  -- Seating: nullable until assigned after the RSVP deadline.
  row_num          int,
  section          text,
  seat             int,

  -- RSVP response (all null = no response yet)
  attending        boolean,
  food_choice      text check (food_choice in ('A','B')),
  dietary_comment  text,
  after_party      boolean,
  responded_at     timestamptz
);

create index if not exists guests_rsvp_group_idx on guests(rsvp_group_id);
create index if not exists guests_seating_group_idx on guests(seating_group_id);

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

-- ─── RLS safety net (no policies = publishable/anon key can do nothing) ─────
alter table rsvp_groups    enable row level security;
alter table seating_groups enable row level security;
alter table rsvp_slugs     enable row level security;
alter table guests         enable row level security;
alter table attendance     enable row level security;

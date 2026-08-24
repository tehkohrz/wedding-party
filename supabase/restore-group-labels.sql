-- Restores the couple's hand-written RSVP group labels.
--
-- WHY THIS EXISTS: scripts/seed-db.ts auto-generates labels from the guest
-- names ("Sonya & Chris", "Justin, Kim & party"). On a fresh database that
-- loses every label edited by hand in the admin. This snapshot was taken
-- from /api/admin/overview on 2026-08-21, before the Supabase outage.
--
-- Run AFTER `pnpm seed:db` (the groups must exist first).
insert into rsvp_groups (id, label) values
  ('1',  'DK, Jermz & party'),
  ('2',  'Da Yi, Yi Ma & party'),
  ('3',  'Lee Party'),
  ('4',  'Teh Party'),
  ('5',  'Da Gu party'),
  ('6',  'Justin, Kim & party'),
  ('27', 'Guo Party'),
  ('28', 'Eric & Chanisa'),
  ('29', 'Law Party'),
  ('30', 'Lay Party'),
  ('31', 'Wei Xian & Salisa'),
  ('32', 'Justinn & Resa'),
  ('33', 'Ivan & +1'),
  ('34', 'Jia Rong & +1'),
  ('35', 'Png Chiang & +1'),
  ('36', 'Yeo Family'),
  ('38', 'Steven, Shirley & party'),
  ('39', 'QY, Xavier & party'),
  ('40', 'Keng, Si Yi & party'),
  ('41', 'Shu & Ahmad'),
  ('42', 'Wan Xin'),
  ('43', 'Sonya & Chris'),
  ('44', 'Pearlvinder & party'),
  ('45', 'Sarah, Nic & party'),
  ('46', 'Cheryl & Euroy'),
  ('47', 'Candy & Rodney'),
  ('48', 'Hui Ying & +1'),
  ('49', 'Denise & +1'),
  ('50', 'Marrisa & Gladys'),
  ('51', 'Eunice & +1'),
  ('52', 'CY & +1'),
  ('53', 'Wani & Greg'),
  ('54', 'Mitz'),
  ('55', 'Yan'),
  ('56', 'Benedict'),
  ('57', 'Jovelle')
on conflict (id) do update set label = excluded.label;

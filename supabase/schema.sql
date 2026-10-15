-- Resist! — schéma Supabase (v4 : une seule liste de signataires, sans distinction de type)
-- À coller dans SQL Editor. RLS activée + aucune policy : seule la clé
-- service_role (côté serveur, dans les routes /api) peut lire/écrire.
-- Si vous avez déjà passé une version antérieure, jouez les migrations dans l'ordre
-- (supabase/migration-002.sql, puis 003, puis 004).

create extension if not exists "pgcrypto";

-- ============ Module Signature ============

create table if not exists appeals (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  admin_key   text not null,
  title       text not null,
  body        text not null,
  intro       text,
  deadline    date,
  contact     text,
  version     int not null default 1,
  closed      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Chaque état publié du texte est conservé : on doit pouvoir dire
-- « cette organisation a signé la v2 », pas seulement « il a signé ».
create table if not exists appeal_versions (
  id          uuid primary key default gen_random_uuid(),
  appeal_id   uuid not null references appeals(id) on delete cascade,
  number      int not null,
  body        text not null,
  note        text,                     -- ce qui a changé, écrit par le pilote
  created_at  timestamptz not null default now(),
  unique (appeal_id, number)
);
create index if not exists appeal_versions_appeal_idx on appeal_versions(appeal_id);

create table if not exists suggestions (
  id          uuid primary key default gen_random_uuid(),
  appeal_id   uuid not null references appeals(id) on delete cascade,
  version     int not null default 1,   -- version visée par la suggestion
  author      text not null,
  quote       text,
  proposal    text not null,
  reason      text,
  status      text not null default 'open',  -- open | accepted | rejected
  created_at  timestamptz not null default now()
);
create index if not exists suggestions_appeal_idx on suggestions(appeal_id);

create table if not exists signatories (
  id          uuid primary key default gen_random_uuid(),
  appeal_id   uuid not null references appeals(id) on delete cascade,
  name        text not null,
  name_key    text not null,            -- nom normalisé : sert à détecter un doublon, jamais à écraser
  edit_token  text not null,            -- clé secrète de modification, remise au signataire
  role        text,
  city        text,
  email       text,                     -- privé, jamais renvoyé au public
  logo_path   text,                     -- chemin dans le bucket privé "logos"
  stance      text not null default 'oui', -- oui | oui_si_modifs | non | reflexion
  note        text,
  version     int not null default 1,   -- version du texte au moment de la réponse
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists signatories_appeal_idx on signatories(appeal_id);
create index if not exists signatories_name_idx on signatories(appeal_id, name_key);
create unique index if not exists signatories_token_idx on signatories(appeal_id, edit_token);

-- ============ Module Réunion ============

create table if not exists polls (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  admin_key   text not null,
  title       text not null,
  place       text,
  note        text,
  created_at  timestamptz not null default now()
);

create table if not exists poll_slots (
  id          uuid primary key default gen_random_uuid(),
  poll_id     uuid not null references polls(id) on delete cascade,
  starts_at   timestamptz not null,
  minutes     int not null default 60
);
create index if not exists poll_slots_poll_idx on poll_slots(poll_id);

create table if not exists poll_votes (
  id          uuid primary key default gen_random_uuid(),
  poll_id     uuid not null references polls(id) on delete cascade,
  name        text not null,
  answers     jsonb not null default '{}'::jsonb, -- { slot_id: "oui"|"si_besoin"|"non" }
  created_at  timestamptz not null default now()
);
create index if not exists poll_votes_poll_idx on poll_votes(poll_id);

alter table appeals         enable row level security;
alter table appeal_versions enable row level security;
alter table suggestions     enable row level security;
alter table signatories     enable row level security;
alter table polls           enable row level security;
alter table poll_slots      enable row level security;
alter table poll_votes      enable row level security;

-- Storage : bucket PRIVÉ "logos". Les fichiers ne sont servis que par URL
-- signée, générée à l'affichage et valable une heure.
insert into storage.buckets (id, name, public)
values ('logos', 'logos', false)
on conflict (id) do update set public = false;

-- v1 → v2 : versionnage du texte, revalidation, logos en bucket privé.

alter table appeals add column if not exists version int not null default 1;
alter table appeals add column if not exists updated_at timestamptz not null default now();

create table if not exists appeal_versions (
  id          uuid primary key default gen_random_uuid(),
  appeal_id   uuid not null references appeals(id) on delete cascade,
  number      int not null,
  body        text not null,
  note        text,
  created_at  timestamptz not null default now(),
  unique (appeal_id, number)
);
alter table appeal_versions enable row level security;

-- On fige l'existant comme version 1.
insert into appeal_versions (appeal_id, number, body, note, created_at)
select id, 1, body, 'Version initiale', created_at from appeals
on conflict do nothing;

alter table suggestions add column if not exists version int not null default 1;

alter table signatories add column if not exists version int not null default 1;
alter table signatories add column if not exists updated_at timestamptz not null default now();
alter table signatories add column if not exists name_key text;
update signatories set name_key = lower(trim(name)) where name_key is null;
alter table signatories alter column name_key set not null;
alter table signatories add column if not exists logo_path text;
-- Les logos déjà déposés restent accessibles par leur ancienne URL publique
-- le temps que le bucket redevienne privé ; à re-déposer si besoin.
alter table signatories drop column if exists logo_url;

-- Dédoublonnage avant la contrainte d'unicité : on garde la réponse la plus récente.
delete from signatories a using signatories b
where a.appeal_id = b.appeal_id and a.name_key = b.name_key and a.created_at < b.created_at;
alter table signatories add constraint signatories_appeal_name_key unique (appeal_id, name_key);

update storage.buckets set public = false where id = 'logos';

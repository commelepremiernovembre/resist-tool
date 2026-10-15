-- 005 — Réunion façon MeetingBrew : dates + plage horaire, grille de dispos par pseudo.
alter table polls add column if not exists dates     text[];          -- 'YYYY-MM-DD'
alter table polls add column if not exists earliest  int;             -- heure de début (0-23)
alter table polls add column if not exists latest    int;             -- heure de fin (1-24)
alter table polls add column if not exists timezone  text not null default 'Europe/Paris';
alter table polls add column if not exists event_url text;            -- lien de l'évènement (optionnel)

alter table poll_votes add column if not exists slots      text[] not null default '{}'; -- 'YYYY-MM-DD HH:mm'
alter table poll_votes add column if not exists prefs      text[] not null default '{}'; -- 'presentiel' | 'visio'
alter table poll_votes add column if not exists name_key   text;
alter table poll_votes add column if not exists updated_at timestamptz;
-- Index complet (pas partiel) : nécessaire pour l'upsert « même pseudo = même réponse ». Les NULL restent distincts.
create unique index if not exists poll_votes_pseudo_uidx on poll_votes(poll_id, name_key);

-- v2 → v3 : le nom n'est plus la clé technique.
-- Chaque réponse reçoit un jeton secret, seul moyen de la modifier.

alter table signatories add column if not exists edit_token text;
update signatories set edit_token = encode(gen_random_bytes(12), 'hex') where edit_token is null;
alter table signatories alter column edit_token set not null;

-- Le nom ne sert plus qu'à repérer un doublon probable : deux structures
-- peuvent légitimement porter des noms proches, on ne les fusionne plus.
alter table signatories drop constraint if exists signatories_appeal_name_key;

create index if not exists signatories_name_idx on signatories(appeal_id, name_key);
create unique index if not exists signatories_token_idx on signatories(appeal_id, edit_token);

-- 15/10/2026 : organisation(s) qui portent le texte (affichée sur la page et dans Paraphe à la place de « Resist ! »).
alter table appeals add column if not exists porteur text;

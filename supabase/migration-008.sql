-- 16/10/2026 : une modif proposée peut viser le titre (cible = 'titre') au lieu d'un passage du texte.
alter table suggestions add column if not exists cible text;

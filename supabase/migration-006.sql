-- 15/10/2026 : image choisie par qui pilote un texte (remplace l'icône R! bleue sur la page et dans Paraphe).
-- Fichier dans le bucket privé « logos », servi par /api/appeals/<slug>/image.
alter table appeals add column if not exists image_path text;

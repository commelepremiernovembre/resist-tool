-- v3 → v4 : plus de distinction organisation / personne.
-- Une seule liste de signataires, un seul compteur.
-- (Optionnel : le code ignore déjà la colonne. La supprimer efface
--  l'information pour les réponses déjà enregistrées.)

alter table signatories drop column if exists kind;

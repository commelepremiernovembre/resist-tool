# Resist !

> **Licence : [CC BY-NC 4.0](LICENSE)** — libre de réutiliser et modifier, à condition de citer **commelepremiernovembre** (avec un lien vers ce dépôt) et de ne pas en faire un usage commercial.

Outils simples et privés pour militer collectivement, sans compte et sans mouchard. En ligne : **resist-tool.vercel.app** (installable comme une appli).

- **Textes** (bleu) — un texte à signer entre organisations : chacun répond, propose des modifs sur un passage précis, et dépose son logo au même endroit. Fini les 40 mails et les logos en pièce jointe.
- **Réunion** (orange) — un sondage de dates façon Framadate / Crab Fit, en plus rapide.
- **Paraphe** (rose) — un carnet des pétitions reçues dans ses messageries, pour les signer quand on a un moment.
- **Mon espace** — vos textes, sondages et pétitions sur tous vos appareils, avec un simple code personnel.

Sur toutes les pages : version anglaise (bouton EN / FR), texte agrandi (A+) et lecture facilitée pour la dyslexie (Aa).

## Démarrer

```bash
npm install
cp .env.local.example .env.local   # puis remplir
npm run dev
```

## Supabase (5 minutes)

1. Créer un projet sur supabase.com.
2. SQL Editor → coller `supabase/schema.sql` → Run. Ça crée les tables, active RLS **sans aucune policy** et crée le bucket **privé** `logos`.
   (Si vous aviez déjà lancé une version antérieure, jouez les migrations dans l'ordre : `002` à `007`.)
3. Settings → API : copier `Project URL` et la clé `service_role`.
4. Les mettre dans `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Toutes les lectures/écritures passent par les routes `/api` côté serveur. La clé `service_role` ne part jamais au navigateur, et RLS sans policy bloque tout accès direct depuis l'extérieur.

## Déployer

`vercel` → ajouter les deux variables d'environnement dans le projet Vercel. Rien d'autre.

Le dépôt GitHub n'est pas relié à Vercel : la mise en ligne se fait à la main avec `vercel --prod`.

## Comment ça marche

Chaque texte a **deux liens** :

- le lien public `/signature/mon-texte-ab3d` : lire, suggérer, signer ;
- le lien de pilotage `/signature/mon-texte-ab3d/pilote?k=<clé>` : voir qui a répondu quoi, trier les modifs, exporter le CSV, clore les signatures.

La clé de pilotage est affichée **une seule fois**, à la création. Elle n'est stockée nulle part côté client.

Les emails des signataires ne sortent jamais côté public : la route publique ne sélectionne pas la colonne.

### Versions du texte

Un texte qui bouge invalide les accords déjà donnés. Donc :

- publier une modification depuis le pilotage crée une **version numérotée**, avec la note du pilote sur ce qui change ;
- chaque réponse enregistre la version sur laquelle elle porte ;
- les signataires restés sur une version antérieure basculent automatiquement en « à revalider », côté pilotage comme dans l'export CSV ;
- un bouton compose le mail de relance en copie cachée, adressé aux seuls signataires concernés ;
- la page publique compte les signataires **de la version en cours**, pas le total brut ;
- l'historique complet des versions est consultable depuis le pilotage.

### Identité des signataires

Pas de compte, mais pas non plus de nom comme mot de passe. À sa première réponse, un signataire reçoit un **lien personnel** `?s=<jeton>` :

- ce jeton, et lui seul, permet de modifier ou revalider la réponse ;
- il est mémorisé dans le navigateur, donc revenir depuis le même appareil suffit ;
- répondre avec un nom déjà pris **n'écrase rien** : l'interface annonce le doublon et laisse le choix entre retrouver son lien ou enregistrer une autre structure ;
- le pilote peut recopier le lien personnel de n'importe quel signataire, dans le tableau ou dans le bandeau de revalidation, pour le renvoyer à qui l'a perdu.

**Ce que ça implique** : le pilote peut donc modifier une réponse à la place de son auteur. Dans une petite organisation, c'est souvent le fonctionnement voulu — mais ce n'est pas une conséquence à découvrir après coup, alors c'est écrit aux deux endroits : dans le tableau de pilotage, et sur l'écran de confirmation du signataire. Si le test montre que c'est trop permissif, on séparera un lien de simple revalidation (revoter sans rien changer d'autre) du jeton de modification complet.

Le nom reste l'identité visible ; il ne sert plus qu'à repérer un doublon probable.

### Signataires

Une seule liste, sans distinction entre organisation et personne : c'est ce qui a été demandé, et ça évite un choix à faire au moment de signer. Le champ Fonction suffit à préciser « porte-parole de X » quand c'est utile.

### Logos

Le bucket est privé. Les fichiers ne sortent que par URL signée, générée à l'affichage et valable une heure (sept jours dans le CSV, le temps de faire le visuel). Le simple fait qu'une organisation ait déposé un logo n'est donc pas exposé.

## Ce qui reste à faire

- Le lien de don (`/soutenir`) — HelloAsso, Liberapay ou Stripe.
- Une planche de logos exportable en PNG/SVG pour le visuel final.
- Une relance par mail des organisations « en réflexion ».
- Un diff lisible entre deux versions publiées (les modifs suggérées montrent déjà ajouts en gras et retraits barrés ; les versions, elles, se lisent encore entières).
- Renvoyer le lien personnel par mail sans passer par le pilote (suppose un envoi de mail, donc un service en plus).
- Chiffrement bout-en-bout, **si** les organisations le jugent indispensable, et sur les contenus sensibles seulement : le texte avant publication, pas les logos ni les dispos. La clé vivrait dans le fragment de l'URL (`#clé`, jamais envoyé au serveur), le déchiffrement dans le navigateur — au prix de l'export CSV et de tout tri côté serveur. Rien ne le promet dans l'interface tant que ce n'est pas fait.

## Avant d'ajouter quoi que ce soit

Faire passer `PARCOURS-TEST.md` à quatre ou cinq personnes : créer → suggérer → signer → publier une v2 → revalider. Ce test dira plus sur l'interface que n'importe quelle fonction supplémentaire.

## Repères

- `src/app/api/**` — toute la logique serveur, une route par ressource.
- `src/lib/db.ts` — client Supabase serveur, génération de slugs et de clés.
- `src/lib/types.ts` — les libellés (« Oui, si les modifs suggérées sont intégrées », etc.) sont ici, pas en dur dans les pages.
- `tailwind.config.ts` — palette : violet `#4B2AEF`, mur `#F2F1F6`, vert `#1F7A5C`. Couleurs des outils : Textes `#1A7CF0`, Réunion `#FF7A00`, Paraphe `#DB1A74`.
- `public/paraphe/index.html` — Paraphe, page HTML autonome.
- `public/i18n.js` — traduction FR → EN et boutons Aa / A+ / EN, chargé sur toutes les pages.

## Journal

- **25/09/2026** — « collectif(s) » remplacé par « organisation(s) » partout (interface, messages d'erreur, doc) : l'outil vise aussi syndicats, associations, partis. Mention LOX retirée, y compris de l'adresse.
- **25/09/2026** — Carte et page Pétition retirées (hors du périmètre de Resist). Après création d'un texte, bouton « Signer ce texte maintenant » (ancre `#signer`).
- **09/10/2026** — Carte Pétition remise sur l'accueil (c'est le but de l'outil) : elle mène à Paraphe, https://paraphe-tool.vercel.app ; `/petitions` y redirige. Mot de passe sans identifiant devant tout le site (`src/middleware.js`, variable Vercel `PORTE_PASSWORD`, cookie `resist_acces` d'un an), y compris les liens de signature et de réunion.
- **09/10/2026** — Écran du mot de passe : « À faire une seule fois : cet appareil s'en souviendra. »
- **09/10/2026** — Champ identifiant caché (nom de l'app) sur l'écran de connexion, pour que le trousseau / Google enregistre et remplisse le mot de passe si l'appareil oublie la connexion.
- **09/10/2026** — Réunion refaite façon MeetingBrew (MIT, github.com/csaye/meetingbrew), d'après le cahier des charges de LOX (`~/Desktop/lox`) : calendrier + plage horaire, grille par demi-heure à peindre au doigt, meilleur(s) créneau(x) avec copie, préférence présentiel/visio, suppression d'un vote, modification du sondage (`/reunion/<slug>/modifier`), même pseudo = même réponse. Migration `supabase/migration-005.sql` appliquée. Code : `src/lib/reunion.ts`, `src/components/reunion/`. Les anciens sondages (créneaux fixes) affichent « créez-en un nouveau ».
- **09/10/2026** — Accueil : nouvelle icône Pétition (bulles de messages → feuille signée), « Signature » devient « Signatures par texte », phrase du bas : « Sans inscription ni création de compte… ».
- **09/10/2026** — Durée de vie d'un lien : 300 jours après la création, tout s'efface (texte, versions, modifs, signataires, logos du bucket ; sondage et votes). `src/lib/duree.ts` ; l'API répond « effacé » dès le jour J ; `/api/purge` supprime chaque nuit à 3 h (cron dans `vercel.json`, secret `CRON_SECRET`, route exemptée du mot de passe). La date d'effacement s'affiche sur chaque texte et sondage, et à la création.
- **09/10/2026** — Carte « Pétition » renommée « Paraphe ».
- **09/10/2026** — Carte Paraphe : texte et bouton adaptés (« Ouvrir Paraphe »), plus de promesse de « tout signer d'un coup ».
- **09/10/2026** — Carte « Signatures par texte » renommée « Textes ».
- **09/10/2026** — Barre du haut de Réunion : « Resist ! » à gauche (retour au menu, comme les autres pages), Inviter et « + Nouveau sondage » à droite.
- **10/10/2026** — **Une seule app.** Paraphe est intégré à Resist : page autonome `public/paraphe/index.html` servie à `/paraphe` (réécriture dans `next.config.mjs`), API `src/app/paraphe/api/meta` et `.../carnet` (carnets Supabase via `paraphe_lire` / `paraphe_ecrire`, droit donné au service_role). Un seul mot de passe : `Resist2026!`. Resist est installable (manifeste, icônes « R! », `public/sw.js`) ; le **Partager** d'Android envoie vers `/paraphe`. L'ancienne adresse paraphe-tool.vercel.app est une passerelle qui emporte le carnet et le lien partagé. Testé : ancienne appli avec pétition non synchronisée + partage → tout arrive dans Resist.
- **10/10/2026** — **Version punk (essai)**, invisible sans le lien secret `/punk-l30g9w` (pose le cookie `resist_theme=punk` ; `?off` pour revenir). Styles dans `src/app/punk.css` (tout préfixé `.punk`), polices Rubik Mono One + Space Mono, Paraphe suit le même cookie. Rien ne change pour les autres.
- **10/10/2026** — **Version « chili » (essai)**, ambiance affiche de concert rouge/noir/crème + coucher de soleil, lien secret `/chili-hi69x6` (cookie `resist_theme=chili`, `?off` pour revenir). Styles dans `src/app/chili.css`, police Anton ; aucun logo de groupe repris.

- 10/10/2026 — Accueil : sélecteur « Look : Normal · Punk · Chili » visible en bas de page (les liens cachés restent valables), pour que Lox puisse comparer.
- 10/10/2026 — Le bouton de look « Chili » s'appelle désormais « Fanzine » (même habillage rouge et soleil).
- 10/10/2026 — Look « Fanzine » (ex-Chili, classe .chili) refait en ambiance fanzine : photocopie noir et blanc, titres sur bandes noires, scotch, machine à écrire (Special Elite), feutre rouge. Paraphe aussi.
- 10/10/2026 — Fanzine retiré. 3e look = « Classe » (classe.css, cookie resist_theme=classe, lien /classe-q7r3 ; l'ancien /chili-hi69x6 y mène aussi) : blanc cassé, noir, titres Instrument Serif, angles droits partout. Paraphe aussi.
- 10/10/2026 — Look Classe : fond plus clair, coquille d'œuf (#FBF8EF), filets #E6E0D0.
- 11/10/2026 — 4e look « Grunge » (ambiance Nirvana) : nirvana.css, cookie resist_theme=nirvana, lien /grunge-n8v4k, titres Permanent Marker, boutons Special Elite ; bouton « Grunge » en bas de l'accueil. Paraphe aussi. Déployé.
- 11/10/2026 — **Mon espace** (`/espace`, bouton sur l'accueil) : textes pilotés, textes signés, sondages et nombre de pétitions, sur tous les appareils, sans compte. Code personnel = celui du carnet Paraphe (clé `paraphe.carnet` du navigateur) : relier un appareil (lien `/espace?code=…` ou saisie du code) relie aussi Paraphe. Stockage : mêmes fonctions Supabase que Paraphe (`paraphe_lire` / `paraphe_ecrire`), empreinte préfixée `espace:` — aucune migration. Logique commune dans `src/lib/carnet.ts` ; côté navigateur `src/lib/espace.ts` (`noter()` appelé à la création d'un texte ou d'un sondage, à l'ouverture du pilotage, d'un texte signé ou d'un sondage). Les textes signés avant cette version sur un appareil sont rapatriés à l'ouverture de Mon espace sur cet appareil. Déployé.
- 11/10/2026 — **Classe par défaut** (sans cookie) et en premier dans le sélecteur : Classe · Normal · Punk · Grunge. « Normal » pose désormais resist_theme=normal (au lieu d'effacer le cookie). Paraphe suit. Déployé.
- 11/10/2026 — Mon espace : « Retirer » tient. Les éléments retirés sont mémorisés (resist.espace.retires, d'après les suppressions du serveur) : ni le rapatriement des anciens textes signés ni la réouverture d'un texte ou d'un sondage ne les remettent ; seule une nouvelle création le fait. Déployé.
- 11/10/2026 — Textes : bouton « Suggérer une modif » toujours visible (avant : seulement au survol, donc invisible sur téléphone). Mon espace : bloc « autre appareil » plus petit, replié dès que 2 appareils sont reliés (chaque navigateur se note comme élément 'appareil'). Proposition sur « Tu m'embrasses ? » corrigée en base : « avec douceur ». Déployé.
- 11/10/2026 — Pilotage : encadré « Lien à envoyer aux signataires » (lien public + bouton Copier) sous le titre. Proposition sur « Tu m'embrasses ? » → « avec fougue et douceur ». Déployé.
- 12/10/2026 — Modifs proposées : retours à la ligne et espaces conservés à l'affichage (whitespace-pre-wrap), page publique et pilotage. Déployé.
- 12/10/2026 — Suggérer une modif : sans sélection, le passage visé = le paragraphe entier (avant : coupé à 90 caractères) ; fenêtre plus large, champs plus hauts, défilement si long. Déployé.
- 12/10/2026 — Texte public : retours à la ligne simples conservés dans les paragraphes (poèmes, listes), et dans les passages visés des modifs. Déployé.
- 12/10/2026 — Page publique d'un texte : seules les modifs en discussion s'affichent sous les paragraphes ; les intégrées (et refusées) ne coupent plus la lecture, elles restent dans le pilotage. Déployé.
- 12/10/2026 — Page publique : plus de bouton « Suggérer une modif » entre les strophes ; un crayon ✎ discret dans la marge droite de chaque paragraphe. Le texte se lit d'un bloc. Déployé.
- 12/10/2026 — Retour au look Normal par défaut (sans cookie) et en premier : Normal · Classe · Punk · Grunge. Paraphe suit. Déployé.
- 12/10/2026 — Mon espace : « Copier mon code » copie le code seul (le lien ne marchait pas collé dans l'app iPhone installée) ; le champ Relier accepte un code ou un lien collé. Déployé.
- 12/10/2026 — Durée de vie d'un lien : 180 jours au lieu de 300 (src/lib/duree.ts + textes de l'accueil, de la création d'un texte et d'un sondage, messages d'erreur). Aucun lien n'avait plus de 180 jours. Déployé.
- 12/10/2026 — Phrase du bas de l'accueil : « 100% gratuit et sans inscription. Chaque page vit sur un lien secret, non indexé. Tout est effacé au bout de 6 mois sans activité. » Déployé.
- 12/10/2026 — Accueil : sélecteur de look déplacé sous la phrase « 100 % gratuit… ». Déployé.
- 12/10/2026 — Un seul design : Normal. Sélecteur de look retiré de l'accueil, cookie resist_theme ignoré (layout + Paraphe). Les fichiers punk.css, classe.css, nirvana.css et les liens secrets restent mais n'ont plus d'effet. « 100% » sans espace. Déployé.
- 12/10/2026 — Accueil, d'après la maquette de LOX : images échangées — Textes = bulles → feuille signée (fond violet), Paraphe = signature tracée (fond rose). Réunion inchangée. Déployé.
- 12/10/2026 — Cartes de l'accueil, textes de LOX : « Signature Texte », « Sondage Réunion », « Espace Pétition » (bouton « Découvrir l'appli »), « sans que ce soit relou. » en gras. Déployé.
- 12/10/2026 — Phrase du bas sur deux lignes (retour après « sans inscription. »). Déployé.
- 12/10/2026 — Titre de l'accueil : « Outils simples et privés pour militer collectivement. » Déployé.
- 12/10/2026 — Paraphe : le bouton vert plein « ✓ J'ai signé » (lu comme un statut) devient « Marquer comme signée », bouton clair bordé de vert. Déployé.
- 12/10/2026 — Paraphe : un seul bouton « ↗ Ouvrir et signer » (vert) ; il ouvre la pétition et, au retour dans l'app, la fiche demande « Signée ? » (✓ Oui, signée / Pas encore). « Marquer comme signée » reste dans le menu ⋮. Fiches signées : « Ouvrir » + ✓. Déployé.
- 12/10/2026 — Paraphe : bouton « Coller un lien » retiré (doublon de « + Ajouter un lien », même fenêtre). Lien Resist ajouté à Paraphe : vrai titre lu dans la base (appeals/polls) au lieu de « Resist ! » (page derrière le mot de passe) ; les 2 fiches existantes corrigées en base (« Tu m'embrasses ? », « Titre de l'appel »). Déployé.
- 12/10/2026 — Carte « Paraphe : Espace Pétition ». Déployé.
- 12/10/2026 — Ambiances : Réunion en vert #16A34A (pages /reunion via src/app/reunion/layout.tsx + .amb-reunion dans globals.css ; grille et illustration de l'accueil aussi ; logo Resist ! reste violet). Paraphe en rose #F6D9E4 (boutons, nav, + ; texte foncé dessus ; rose profond #A8335F pour les textes d'accent). Déployé.
- 12/10/2026 — Paraphe : bouton « + Ajouter un lien » renommé « Coller un lien » ; logo en rose.
- 12/10/2026 — Paraphe : vignette = vraie image de la pétition (og:image / twitter:image, sinon icône du site, sinon favicon ; renvoyée par /paraphe/api/meta, champ image). L'emoji deviné reste dessous si l'image ne charge pas. Liens Resist : logo R!. Fiches existantes rattrapées une fois au chargement (rattraperImages). Déployé.
- 12/10/2026 — Paraphe : coche ✓ retirée des fiches signées (doublon avec « Signée le … »).
- 12/10/2026 — Paraphe : trois points ⋮ et bord du logo en rose.
- 12/10/2026 — Paraphe : liseré rose sur le bouton « Ouvrir » des fiches signées.
- 12/10/2026 — Paraphe : fenêtre d'aide = « Mode d'emploi » complet (ouvrir, installer, envoyer depuis Signal/Telegram/WhatsApp/Gmail/SMS/iPhone, signer avec Ouvrir et signer → Oui, signée → Historique, archiver, vérifier) ; adresse technique ?add= retirée.
- 12/10/2026 — Paraphe : étiquettes de thème (Société, Environnement…) et fonds de vignette en rose pour tous les thèmes.
- 12/10/2026 — **Règle des titres de pétition, pour tous les sites** (`src/app/paraphe/api/meta/route.ts`) : on essaie dans l'ordre og:title, twitter:title, `<title>`, `<h1>` ; chaque candidat est épuré (préfixe « Pétition · » retiré, fin « · Nom du site » / « | Nom du site » / « - France » retirée quand c'est le nom du site) ; un titre passe-partout (« Signez la pétition », « Sign the petition », « Pétition », « Accueil »…) ou qui n'est que le nom du site est écarté. Ex. Change.org : « Signez la pétition » → « Pas de volets, pas de loyer ! ». Les fiches déjà enregistrées avec un titre passe-partout sont relues à la prochaine ouverture de Paraphe (rattraperImages). Testé : Change.org ×2, Greenpeace, MesOpinions, Assemblée nationale, OnParticipe.
- 12/10/2026 — Paraphe, barre du haut : bouton loupe (bascule recherche) + champ « Collez ici le lien d'une pétition… » ; coller un lien dans le champ (ou Entrée, ou « Coller ») ouvre la fenêtre d'ajout avec le lien déjà rempli, une note et « Reçue par » (Signal, Telegram, WhatsApp, Gmail, SMS, Autre). Bouton + flottant : presse-papiers comme avant.
- 12/10/2026 — Paraphe : résumé de la pétition (og:description, 2 lignes) sous le titre, pour savoir ce qu'on signe ; fiches existantes rattrapées à l'ouverture. Voile rose léger sur les images de vignette (mix-blend color, 45 %). Couleurs par thème remises sur les étiquettes (vert Environnement, orange Animaux, indigo Société, bleu Local, gris Autre).
- 12/10/2026 — Paraphe : voile rose sur les images retiré, photos en couleurs d'origine.
- 12/10/2026 — Paraphe : boutons des fiches (Ouvrir et signer, Ouvrir, Oui/Pas encore) plus petits, alignés à droite.
- 12/10/2026 — Mode d'emploi Paraphe : étapes 1 et 2 valables aussi sur iPhone (Chrome ou Safari, Partager → Sur l'écran d'accueil ; sur iPhone pas de menu Partager → Paraphe, on colle le lien).
- 12/10/2026 — Encart « Comment ajouter une pétition ? » corrigé : Partager → Paraphe sur Android (Gmail, Signal, Telegram, SMS) ; WhatsApp ou iPhone : copier le lien puis Coller.
- 12/10/2026 — Paraphe : « Mon Espace Pétition » en petit gris sous le logo.
- 12/10/2026 — Mode d'emploi de Paraphe simplifié en 3 étapes (Installer / Ranger une pétition / Signer), Android et iPhone séparés, une ligne par geste.
- 12/10/2026 — Aide Paraphe : Telegram rejoint WhatsApp et iPhone (copier le lien puis Coller) : sur Android, l'appui long de Telegram n'offre que son propre transfert, pas Partager → Paraphe.
- 12/10/2026 — **Partage Android corrigé** : launch_handler passe de focus-existing à navigate-existing (avec focus-existing, si l'appli était déjà ouverte sur une autre page que /paraphe, le lien partagé se perdait). Aide : dans le menu Partager, l'appli s'appelle « Resist ! » (icône R!), pas « Paraphe » ; désinstaller l'ancienne appli Paraphe. Non testé sur un vrai Android.
- 12/10/2026 — Aide Paraphe : méthode principale = copier le lien puis Coller (marche partout ; Signal et Telegram n'offrent pas Partager vers une autre appli chez Lox) ; Partager → Resist ! devient un bonus Android.
- 12/10/2026 — Signal confirmé par Lox (Partager → Resist ! marche) : aide remise comme avant (Android Gmail/Signal/SMS = Partager ; Telegram/WhatsApp/iPhone = copier puis Coller). « En savoir plus » sur sa propre ligne (supprime l'espace en trop dans l'encart).
- 12/10/2026 — Aide Paraphe : Signal/WhatsApp/Telegram = appui long → Copier, puis ouvrir Paraphe et toucher le bandeau (Signal cache Partager derrière Infos) ; Gmail/SMS = Partager → Resist ! ; iPhone = Coller.
- 12/10/2026 — Aide Paraphe : Signal remis avec Partager → Resist ! (confirmé par Lox, via appui long → Infos → Partager) ; WhatsApp/Telegram = Copier + bandeau ; iPhone = Coller.
- 12/10/2026 — Réunion : plus de vert, noir (#0E0E12) et gris (#EDEDF0) à la place (boutons, titres, grille, image de la carte sur l'accueil). Logo Resist ! toujours violet.
- 12/10/2026 — Réunion en jaune orangé (#F59E0B, survol #D97706, fond pâle #FEF3C7, textes ambre #B45309, texte foncé sur les boutons) ; grille et icône de l'accueil aussi. Logo Resist ! toujours violet.
- 12/10/2026 — Réunion, retours de LOX : textes orange vif #EA580C au lieu de l'ambre #B45309 (« marron ») ; formulaire : placeholder du titre « Manifestation pour nos droits », champ « URL de l'évènement (optionnel) » avec placeholder « Ajouter un titre ici » (texte de LOX). Déployé.
- 12/10/2026 — Textes (pilotage et création) : la zone du texte prend d'emblée la hauteur du texte et grandit en tapant (src/components/AutoTextarea.tsx) — sur téléphone on ne pouvait pas l'agrandir. Déployé.
- 12/10/2026 — Réunion aux couleurs de la maquette de LOX : orange vif #FF7A00 (titres, boutons à texte blanc, dates choisies, curseur d'heures), panneaux crème #FDFBE6 ; grille et icône de l'accueil assorties. Déployé.
- 12/10/2026 — Textes : compteur de vues du lien public (colonne appeals.vues + fonction resist_vue, route POST /api/appeals/[slug]/vue). Une vue par onglet ; celles de qui pilote le texte depuis son appareil ne comptent pas. Affiché seulement au pilotage (« vues du lien »). Compte à partir d'aujourd'hui, rien d'avant. Déployé.
- 12/10/2026 — Réunion : compteur de vues aussi (colonne polls.vues + fonction resist_vue_sondage, route POST /api/polls/[slug]/vue). Pas de page de pilotage dans Réunion : « Lien vu N fois » s'affiche sous le titre, pour tous. Une vue par onglet ; l'appareil qui a créé le sondage n'est pas compté. Paraphe : pas de compteur (carnet perso, aucun lien envoyé à d'autres). Déployé.
- 12/10/2026 — Réunion, barre du haut comme la maquette de LOX : bouton pilule orange #FF7A00 « + Créer un nouveau sondage de date » (« + Nouveau sondage » sur téléphone) au lieu du bouton noir ; « Inviter » (page du sondage) en pilule à liseré orange. Déployé.
- 12/10/2026 — Réunion : le bouton dit partout « + Créer un nouveau sondage de date » comme la maquette (téléphone compris : les boutons passent sous le logo si la place manque). Déployé.
- 12/10/2026 — Réunion, retours de LOX : poignées du curseur d'heures en orange (restaient bleues), menus Début/Fin sur fond blanc, fond de page blanc sur les pages Réunion (gris ailleurs). Déployé.
- 13/10/2026 — Textes : bouton « Mettre hors ligne / Remettre en ligne » au pilotage (colonne appeals.hors_ligne). Hors ligne, le lien public répond « Ce texte n’est plus en ligne » (410), plus de signature ni de suggestion ; le pilotage, Mon espace et l'export CSV restent. L'effacement à 180 jours s'applique toujours.
- 13/10/2026 — Textes hors ligne = archivés sans limite : la purge nocturne les saute, le pilotage les ouvre même après 180 jours ; au-delà de 180 jours on ne peut plus les remettre en ligne (message au pilotage). Accueil : « …sans activité, sauf les textes que vous mettez hors ligne pour les archiver. » Déployé.
- 13/10/2026 — Texte « Tu m'embrasses ? » corrigé en base à la demande de Ste, sans nouvelle version (reste v77, appeals.body + appeal_versions n°77) : 2e ligne « ma bouche embrasse ta bouche » → « ta bouche embrasse ma bouche ». Ancien texte : sauvegarde_tu-m-embrasses_v77_20261013_214511.txt.
- 13/10/2026 — « Tu m'embrasses ? », toujours v77 sans nouvelle version : « Ma bouche attrape tes lèvres » et « Ma bouche embrasse tes lèvres » échangées (seules les lignes de tête, le reste des strophes en place). État d'avant : sauvegarde_tu-m-embrasses_v77_20261013_214659.txt.
- 13/10/2026 — « Tu m'embrasses ? » (v77, sans nouvelle version) : « Ta bouche » avec majuscule après « Par chance, ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261013_214716.txt.
- 13/10/2026 — « Tu m'embrasses ? » (v77, sans nouvelle version) : toutes les majuscules retirées sauf « Par chance, ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261013_214835.txt.
- 13/10/2026 — « Tu m'embrasses ? » (v77, sans nouvelle version) : début réordonné par Ste (« ma main qui touche ton sein », « une envie qui ressemble au manque » rejoint « mes yeux… », « le souffle qui s’étend » passe dans la strophe « ma bouche embrasse tes lèvres »). État d'avant : sauvegarde_tu-m-embrasses_v77_20261013_215547.txt.
- 13/10/2026 — « Tu m'embrasses ? » (v77) : « une envie » → « l’envie qui ressemble au manque ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261013_215753.txt.
- 13/10/2026 — « Tu m'embrasses ? » (v77) : « l’envie ressemble au manque ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261013_215806.txt.
- 13/10/2026 — « Tu m'embrasses ? » (v77) : « ma main qui touche ton sein » → « ma main qui frôle ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261013_215852.txt.
- 13/10/2026 — « Tu m'embrasses ? » (v77) : retour à « cette envie qui ressemble au manque ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261013_215907.txt.
- 13/10/2026 — « Tu m'embrasses ? » (v77) : « ma main qui frôle ton sein ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261013_215922.txt.
- 13/10/2026 — « Tu m'embrasses ? » (v77) : « ma langue qui s’y glisse » ; ligne vide ajoutée entre « …la peur de l’oublier » et « cette envie qui ressemble au manque ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261013_220058.txt.
- 13/10/2026 — « Tu m'embrasses ? » (v77) : « j’aime ta façon de m’embrasser » → « et aime ta façon de l’embrasser ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261013_220539.txt.
- 13/10/2026 — « Tu m'embrasses ? » (v77) : « cette envie qui ressemble à un manque ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261013_220820.txt.
- 13/10/2026 — « Tu m'embrasses ? » (v77) : retour à « j’aime ta façon de m’embrasser ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261013_220936.txt.
- 13/10/2026 — « Tu m'embrasses ? » (v77) : « j’aime ta façon de m’embrasser » → « j’aime ta façon de l’embrasser ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261013_232543.txt.
- 13/10/2026 — « Tu m'embrasses ? » (v77) : « ma main qui frôle ton sein » → « ma main frôle ton bassin ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261013_234814.txt.
- 13/10/2026 — « Tu m'embrasses ? » (v77) : « cette envie qui ressemble à un manque » → « …au manque ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261013_234838.txt.
- 14/10/2026 — « Tu m'embrasses ? » (v77) : « ma main frôle ton bassin » → « ma main frôle tes reins ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261014_000625.txt.
- 14/10/2026 — « Tu m'embrasses ? » (v77) : « ma main frôle tes reins » → « ma main qui frôle tes reins ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261014_000650.txt.
- 14/10/2026 — « Tu m'embrasses ? » (v77) : « ma main qui frôle tes reins » → « une main qui frôle ton bassin ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261014_000806.txt.
- 14/10/2026 — « Tu m'embrasses ? » (v77) : « une main qui frôle ton bassin » → « une main qui frôle tes reins ». État d'avant : sauvegarde_tu-m-embrasses_v77_20261014_000823.txt.
- **15/10/2026** — Mot de passe retiré : le site est ouvert à tous. La porte est gardée hors service dans `src/middleware.js.retire_20261015` (la renommer en `middleware.js` pour la remettre ; `PORTE_PASSWORD` reste sur Vercel). Réunion : champ « Fuseau horaire » et mention « Heures de … » retirés ; les sondages restent enregistrés en `Europe/Paris` par défaut.
- **15/10/2026** — « Tu m'embrasses ? » remis dans « Textes que je pilote » du Mon espace de Ste (retiré par erreur le 13/10) : carnet modifié en base, état d'avant dans `carnet_espace_ste.bak_20261015_151624.json`. Mon espace : le bouton « Retirer » (qui supprimait l'élément de la liste) devient « Historique » : l'élément passe dans une section repliable « Historique », avec « Remettre » pour le ressortir. Rien n'est plus supprimé de la liste (champ `historique` sur l'élément, `src/lib/espace.ts`, `src/app/espace/page.tsx`).
- **15/10/2026** — Accueil : dans le navigateur, chaque outil (Textes, Réunion, Paraphe, Mon espace) s'ouvre dans un nouvel onglet ; dans l'app installée (PWA, `display-mode: standalone`), il s'ouvre dans la même fenêtre. `src/components/LienOutil.tsx`.
- **15/10/2026** — Paraphe sur grand écran : la colonne « Historique » n'est plus affichée à côté de « À signer » ; elle s'ouvre seulement par « Historique » dans le menu de gauche. Téléphone inchangé (sélecteur À signer / Historique). `public/paraphe/index.html`.
- **15/10/2026** — Mon espace : le bouton « Historique » s'appelle « Archiver », et la section repliable « Archivés ».
- **15/10/2026** — « ceci est un test, » (créé le 09/10) ajouté aux archivés du Mon espace de Ste, avec sa clé de pilotage ; état d'avant dans `carnet_espace_ste.bak_20261015_153416.json`.
- **15/10/2026** — Noms d'onglet par outil : « Resist ! Textes » (`src/app/signature/layout.tsx`), « Resist ! Réunion » (`src/app/reunion/layout.tsx`), « Resist ! Mon espace » (`src/app/espace/layout.tsx`), « Resist ! Paraphe » (`public/paraphe/index.html`, qui reçoit aussi l'icône R! à la place du V par défaut).
- **15/10/2026** — Pilotage, tableau des signataires réécrit (Ste : « pas très clair ») : titre « Les signataires », phrase qui donne la version actuelle et explique « à revalider », colonne « Lien de modification » → « Son lien perso » avec bouton « Copier son lien », et l'avertissement sur ce lien déplacé sous le tableau en termes simples.
- **15/10/2026** — Un seul nom pour le lien qui permet à un signataire de changer sa réponse : « lien de signataire » (en miroir du « lien de pilotage »). Remplace « lien personnel », « lien de modification », « lien de revalidation », « lien perso » sur la page de signature, le pilotage, le mail de revalidation et les messages d'erreur de l'API.
- **15/10/2026** — Paraphe mis à l'air de Resist : logo « Resist ! » (Archivo italique violet + trait, lien vers l'accueil) à la place du logo PARAPHE et du bouton « ← Resist » ; fond et encre de Resist (#F2F1F6 / #0E0E12) ; l'accent rose de Paraphe reste (comme l'orange de Réunion). Nouveau bouton icônes / liste dans la barre du haut : mosaïque de fiches (image en grand, sans résumé), choix mémorisé sur l'appareil (`paraphe.grille`).
- **15/10/2026** — Mon espace : plus de section « Archivés » commune ; chaque catégorie (Textes que je pilote, Textes que j'ai signés, Sondages de date) a ses propres « Archivés (n) », repliés sous sa liste.
- **15/10/2026** — Paraphe : sur téléphone, la mosaïque ne déborde plus (`.colonnes` en `minmax(0,1fr)`), l'étiquette de catégorie est masquée en mosaïque.
- **15/10/2026** — Réunion, page d'un sondage : tant que personne n'a répondu, la grille vide n'est plus affichée ; elle arrive en deuxième, après « Je saisis mes disponibilités » + pseudo. Dès qu'il y a des réponses, la grille des résultats reste visible.
- **15/10/2026** — Mon espace : bouton « Supprimer les archives » sous les « Archivés » de chaque catégorie, avec confirmation sur la page (pas de fenêtre du navigateur). Les éléments quittent Mon espace sur tous les appareils (liste `supprimes` du carnet) ; le texte ou le sondage lui-même reste en ligne.
- **15/10/2026** — Réunion, page d'un sondage : le filet sous les participants et le contour des blocs « Meilleur résultat » / « Préférences » passent de l'orange au noir.
- **15/10/2026** — Mon espace : le bouton d'un élément archivé s'appelle « Restaurer » (au lieu de « Remettre »).
- **15/10/2026** — Mon espace : bouton « Supprimer les archives » retiré à la demande de Ste (les archives restent, « Restaurer » pour les ressortir).
- **15/10/2026** — Pilotage d'un texte : bouton « OK, intégrer (publie la vN) » sur une modif proposée encore ouverte, visée sur la version en ligne, dont le passage cité se trouve tel quel dans le texte : le passage est remplacé par la proposition, la nouvelle version est publiée aussitôt (note « Modification de X intégrée ») et la modif passe « Intégrée ». Sinon, une ligne dit de l'intégrer à la main.
- **15/10/2026** — Réunion : grille façon maquette LOX (MeetingBrew) — une heure sur deux sur fond gris, l'heure écrite en haut de sa ligne.
- **15/10/2026** — Textes, logo du signataire : un logo de plus de 2 Mo est réduit dans le navigateur (1600, 1200 puis 800 px ; PNG gardé en PNG) et un message le dit ; s'il ne passe toujours pas (SVG lourd…), message clair avec le poids du fichier. Explication réécrite sous le bouton (formats, 2 Mo, réduction auto, « inutile de l'envoyer en plus par mail »).
- **15/10/2026** — Modifs proposées (page publique et pilotage) : comparaison mot à mot entre le passage cité et la proposition ; les ajouts sont en gras, les mots retirés barrés dans la citation. `src/components/Ecart.tsx`.
- **15/10/2026** — Signature d'un texte : après « Valider ma réponse » / « Mettre à jour notre réponse », le bouton se grise et affiche « Réponse enregistrée ✓ » ; il se réactive dès qu'on change quelque chose dans le formulaire.
- **15/10/2026** — Pilotage, signataires allégés (Ste : « ça reste compliqué ») : « Personne n'a encore signé » quand c'est vide (plus de tableau vide), explication de « à revalider » seulement s'il y en a, encadré « lien de signataire » et note sur les logos retirés ; la dernière colonne n'a plus de titre, juste un petit lien « Renvoyer son lien » (explication au survol).
- **15/10/2026** — Piloter à plusieurs : sous le lien à envoyer aux signataires, « Vous pilotez à plusieurs ? » + bouton « Copier le lien de pilotage ». Page de signature : « les personnes qui pilotent le texte » au pluriel.
- **15/10/2026** — Publier une nouvelle version : choix obligatoire « Petite correction » (les signataires de la version en ligne passent à la nouvelle sans revalider ; note « Petite correction ») ou « Changement de fond » (ils passent « à revalider »). Même choix sur « OK, intégrer » d'une modif proposée (deux boutons). API : champ `fond` du PATCH.
- **15/10/2026** — Pilotage : le titre du texte est modifiable sur place (clic dedans, Entrée ou clic ailleurs pour enregistrer).
- **15/10/2026** — Paraphe : colonne « Historique » remise à droite de « À signer » sur grand écran, à la demande de Ste (retour sur le changement du matin).
- **15/10/2026** — Page de signature : consigne réécrite par Ste — « Une modification à suggérer ? Sélectionnez le texte à modifier et cliquez sur l'icône crayon ✎ à droite du paragraphe. »
- **15/10/2026** — Paraphe, grand écran : la colonne « Historique » est fermée par défaut (titre + nombre + « Afficher ») ; un clic sur son titre l'ouvre ou la referme, et l'appareil retient le dernier état (`paraphe.historique`).
- **15/10/2026** — Page publique d'un texte : si ce texte est dans « Textes que je pilote » du Mon espace de l'appareil, un bandeau « Vous pilotez ce texte. » donne les liens « Ouvrir le pilotage » et « Mon espace ».
- **15/10/2026** — « Lien effacé le … » devient « Expiration du lien : … » (page d'un texte et page d'un sondage).
- **15/10/2026** — Textes : bascule « Page pilotage » / « Page publique » à côté du logo (maquette de Ste), sur la page de pilotage et sur la page publique quand le texte est dans « Textes que je pilote » ; le bouton plein mène à l'autre page, celui de la page en cours reste en contour. Remplace le bandeau « Vous pilotez ce texte » et le bouton « Voir la page publique ». `src/components/BasculePages.tsx`.
- **15/10/2026** — Paraphe : accent violet de Resist à la place du rose ; flèche ▸/▾ à la place de « Afficher » sur l'Historique ; vue en icônes par défaut, la liste en option (bouton du haut, mémorisé).
- **15/10/2026** — Pilotage : « Lien à envoyer aux signataires » devient « Lien à envoyer aux futurs signataires ».
- **15/10/2026** — Paraphe : un sondage Réunion de Resist a sa vignette R! orange (`public/icon-reunion.png`, couleur de Réunion) au lieu de la violette ; aussi pour les fiches déjà rangées.
- **15/10/2026** — Paraphe repasse en rose, mais franc : accent #DB1A74 (survol #B8105F, fond pâle #FDE8F2) au lieu du violet ; le logo Resist reste violet.
- **15/10/2026** — Accueil, vignette de Paraphe : la signature passe au rose de Paraphe (#DB1A74) sur fond rose pâle (#FDE8F2), comme l'orange de Réunion.
- **15/10/2026** — Textes a sa couleur : bleu clair et franc #1A7CF0 (survol #1166D6, fond pâle #E5F1FF) sur toutes les pages /signature (classe `.amb-textes` dans `src/app/signature/layout.tsx`, règles dans globals.css, sur le modèle de Réunion) et sur sa vignette de l'accueil ; le logo Resist reste violet.
- **15/10/2026** — Paraphe : un texte à signer de Resist a sa vignette R! bleue (`public/icon-textes.png`, couleur de Textes), comme l'orange des sondages ; aussi pour les fiches déjà rangées.
- **15/10/2026** — Création d'un texte : même allure que la création d'un sondage — grand titre « Un texte à signer ? » en bleu Textes, formulaire dans un panneau bleu pâle.
- **15/10/2026** — Mon espace : ambiance gris très léger — grand titre « Mon espace » gris (#6B6B78), contenus dans des panneaux gris pâle (#F4F4F7) sur fond blanc. Pages Textes aussi sur fond blanc, comme Réunion.
- **15/10/2026** — Création d'un texte : le panneau du formulaire passe en beige (#FDFBE6, comme Réunion) sur fond blanc, au lieu du bleu pâle.
- **15/10/2026** — Création d'un texte : retour au panneau bleu pâle sur fond blanc (Ste : « c'est bien comme ça »), le beige est abandonné.
- **15/10/2026** — Mon espace : le grand titre alterne lettre par lettre le bleu de Textes, l'orange de Réunion et le rose de Paraphe.
- **15/10/2026** — Mon espace : titre par groupes de lettres — « Mo » bleu Textes, « nes » orange Réunion, « pace » rose Paraphe.
- **15/10/2026** — Version anglaise (essai) : `public/i18n.js`, chargé par toutes les pages (layout + Paraphe). Petit bouton EN / FR en bas à gauche, choix gardé dans le cookie `resist_lang`. Les pages restent en français dans le code ; en EN, le script remplace à l'affichage les textes d'interface par correspondance exacte avec un dictionnaire (+ règles pour dates, nombres), les textes des utilisateurs ne sont pas touchés. Ce qui manque au dictionnaire reste en français.
- **15/10/2026** — Paraphe façon Textes / Réunion : fond blanc, menu dans un bloc arrondi gris pâle à gauche, contenu dans un bloc arrondi rose pâle au milieu (aussi au téléphone).
- **15/10/2026** — Bouton EN / FR en bas à droite (au-dessus du + sur Paraphe au téléphone) ; sur les pages Next, la traduction attend la fin du chargement de React.
- **15/10/2026** — Mon espace : grand titre en noir (Ste préfère au multicolore) ; il se traduit aussi en anglais.
- **15/10/2026** — Mon espace inversé : fond gris de Resist à l'extérieur, panneaux blancs à l'intérieur (rappelle l'accueil).
- **15/10/2026** — Paraphe comme Mon espace : fond gris de Resist à l'extérieur, menu dans un bloc blanc, contenu dans le bloc rose pâle ; textes du menu en noir ; sous le logo, « Paraphe » en rose et « · mes pétitions » en noir.
- **15/10/2026** — Accessibilité, dans `public/i18n.js` (toutes les pages) : à côté de EN / FR, « 🔊 » lit la page à voix haute avec la voix de l'appareil (le passage sélectionné s'il y en a un, sinon le contenu ; ■ pour arrêter ; français ou anglais selon la langue) et « A+ » agrandit l'affichage (100 → 115 → 130 %, puis « A– » pour revenir ; cookie `resist_taille`).
- **15/10/2026** — Paraphe : retour au fond blanc ; colonne de gauche en rose pâle cernée du rose vif de Paraphe (celui du bouton « Coller ») ; textes du menu en noir, onglet en cours en gras noir sur blanc.
- **15/10/2026** — Bouton « 🔊 » (lecture à voix haute) retiré à la demande de Ste ; restent A+ et EN / FR.
- **15/10/2026** — Paraphe : intérieur de la colonne de gauche en blanc (contour rose vif gardé) ; l'onglet en cours sur fond rose pâle, en gras noir.
- **15/10/2026** — Icône R! de l'outil à côté du titre : bleue sur la page publique et le pilotage d'un texte, orange au-dessus du titre d'un sondage (les mêmes que sur les fiches de Paraphe) ; favicon par outil (bleu Textes, orange Réunion, rose Paraphe — `public/icon-paraphe.png`).
- **15/10/2026** — Paraphe : encadré « Comment ajouter une pétition ? » sur fond rose pâle ; titres de colonne « À SIGNER » / « HISTORIQUE » en noir.
- **15/10/2026** — Paraphe : colonne principale aussi en blanc cernée de rose vif, comme le menu.
- **15/10/2026** — Paraphe : fond de page rose pâle ; menu et colonne principale en blocs blancs à bordure grise légère (au lieu du rose vif).
- **15/10/2026** — Image d'un texte : au pilotage, clic sur l'icône R! à côté du titre pour choisir une image (PNG, JPEG, WebP, 2 Mo) ; « retirer » pour revenir au R! bleu. Elle s'affiche sur la page publique et sur la fiche du texte dans Paraphe. Colonne `appeals.image_path` (`supabase/migration-006.sql`, appliquée), fichier dans le bucket « logos », servi par `/api/appeals/<slug>/image` (redirige vers l'icône bleue sans image) ; effacé aussi par la purge.
- **15/10/2026** — Paraphe : retour au fond blanc avec des blocs rose pâle à bordure légère ; onglet en cours sur blanc.
- **15/10/2026** — Mon espace : chaque rubrique à la couleur de son outil, avec son icône R! (Textes en bleu, Sondages en orange, Pétitions en rose).
- **15/10/2026** — Paraphe : plus de liseré autour des blocs rose pâle.
- **15/10/2026** — A+ : les hauteurs « écran » (menu de Paraphe, fenêtre de suggestion) sont divisées par le zoom (variable CSS `--z` posée par i18n.js), la page tient dans l'écran au lieu de dépasser. Vérifié dans Chrome, Firefox et Safari (moteurs Playwright).
- **15/10/2026** — Bouton « Aa » (lecture facilitée, dyslexie), à côté de A+ et EN / FR : police Lexend (Google Fonts), plus d'espace entre lettres, mots et lignes ; le logo Resist garde sa police. Bouton foncé quand c'est actif ; choix gardé (cookie `resist_dys`). Marche en français et en anglais.
- **15/10/2026** — Paraphe, mosaïque : « Signée ? » passe sur sa ligne avec « Oui, signée » / « Pas encore » dessous (ça débordait sur la fiche voisine) ; fiches sans bordure grise.
- **15/10/2026** — « Porté par » : champ facultatif à la création d'un texte, modifiable au pilotage (sous le titre, enregistré en quittant le champ), affiché sur la page publique (« Porté par X ») et dans Paraphe à la place de « Resist ! » (les fiches des textes Resist relisent titre et porteur à chaque ouverture). Colonne `appeals.porteur` (`supabase/migration-007.sql`, appliquée).
- **15/10/2026** — Paraphe, en-tête comme Réunion : logo Resist en haut à gauche, grand titre rose « Paraphe : mes pétitions » centré (Archivo 800, droit), plus d'espace ; menu et contenu centrés (1280 px max) avec plus de marge.
- **15/10/2026** — Paraphe : grand titre « Paraphe » seul, « mes pétitions » en petit dessous.
- **15/10/2026** — Paraphe : « mes pétitions » en rose, serré sous le titre.
- **15/10/2026** — Paraphe : colonne de gauche plus étroite (204 px) et à la hauteur de son contenu (l'encadré d'aide suit le menu au lieu d'être en bas de l'écran).
- **15/10/2026** — Mon espace : phrase d'intro sur deux lignes (« Vos textes… appareils. » / « Sans compte : un code personnel suffit. »).
- **16/10/2026** — Code versé dans un dépôt GitHub **privé** `commelepremiernovembre/resist-tool` (branche main). Exclus par `.gitignore` : `.env*`, sauvegardes `*.bak_*`, `sauvegarde_*.txt`, `carnet_espace_*.json`. Le dépôt n'est **pas** relié à Vercel : la mise en ligne reste `vercel --prod`.
- **16/10/2026** — Dépôt GitHub `resist-tool` passé en **public**, sous licence CC BY-NC 4.0 (fichier LICENSE) : citer commelepremiernovembre, pas d'usage commercial.
- **16/10/2026** — Mis en ligne (vercel --prod) avec le lien discret « commelepremiernovembre » en bas à gauche de l'accueil (vers le profil GitHub).
- **16/10/2026** — Lien GitHub de l'accueil : essais en vertical (bord droit, puis bord gauche), finalement gardé horizontal en bas à gauche, comme au départ.
- **16/10/2026** — README remis à jour : trois outils + Mon espace, accessibilité, migrations jusqu'à 007, mise en ligne par `vercel --prod`, repères (couleurs, Paraphe, i18n.js).
- **16/10/2026** — Retours de Ste (WhatsApp) : lien GitHub « commelepremiernovembre » retiré de l'accueil pour l'instant (« pour la cause, pas d'ego ») ; boutons de l'accueil aux couleurs de la maquette (#402AE6, #FF7A00, #B0279B) ; vignettes recolorées (Textes en #402AE6, Réunion fond #FFF3E6 + cadre orange, Paraphe trait bordeaux #8E1450) et fond étendu sur toute la largeur (plus de bords blancs).
- **16/10/2026** — Mon espace : un panneau blanc à ombre par appli (Textes, Sondages, Pétitions). Textes : icône/logo du texte retiré (pilotage et page publique, composant `ImageTexte` gardé) ; chiffres du pilotage aux intitulés du vote (« Oui, je signe », « Oui, si les modifs suggérées sont intégrées », « Non », « En cours de réflexion ») ; « Lien du document à envoyer pour signature ». Réunion : panneaux #FFF3E6 au lieu du jaune.
- **16/10/2026** — Paraphe : retour au tableau de bord d'avant sur ordi (logo en petit dans la colonne de gauche, plus de grand titre), fond gris clair au lieu du rose, angles beaucoup moins arrondis (bloc en fin de style de `public/paraphe/index.html`).
- **16/10/2026** — Mon espace : icônes R! retirées devant les titres ; « Pétitions » devient « Espace Pétition ».

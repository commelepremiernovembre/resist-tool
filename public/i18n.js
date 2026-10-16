/* Version anglaise de Resist (essai, 15/10/2026).
   Les pages restent écrites en français ; quand on choisit EN, ce script remplace à l'affichage
   les textes de l'interface par leur traduction (dictionnaire ci-dessous, correspondance exacte,
   donc les textes des utilisateurs ne sont pas touchés). Petits boutons en bas à droite :
   Aa lecture facilitée pour la dyslexie (cookie resist_dys), A+ taille du texte (cookie resist_taille), EN / FR langue
   bascule ; le choix est gardé dans le cookie resist_lang (un an). Chargé par toutes les pages, Paraphe compris. */
(function () {
  // 16/10/2026 : bouton EN retiré à la demande de Ste ; tout le monde en français (même avec un ancien cookie resist_lang=en).
  var lang = 'fr';

  // ---------- petits boutons en bas à droite : écouter, taille du texte, langue ----------
  var EN = lang === 'en';
  var TAILLES = [1, 1.15, 1.3];
  var taille = +((document.cookie.match(/(?:^|;\s*)resist_taille=(\d)/) || [])[1] || 0);
  // Le zoom agrandit aussi les hauteurs « écran » (100vh) : on les divise par le zoom (variable --z) pour que la page tienne.
  function appliquerTaille() {
    var z = TAILLES[taille], h = document.documentElement;
    h.style.zoom = z === 1 ? '' : z;
    h.style.setProperty('--z', z);
    if (!document.getElementById('resist-zoom')) {
      var st = document.createElement('style');
      st.id = 'resist-zoom';
      st.textContent = '.max-h-\\[92vh\\]{max-height:calc(92vh / var(--z,1))!important}';
      (document.head || h).appendChild(st);
    }
  }
  appliquerTaille();

  // Lecture facilitée (dyslexie) : police Lexend, plus d'espace entre lettres, mots et lignes. Cookie resist_dys.
  var dys = /(?:^|;\s*)resist_dys=1/.test(document.cookie);
  function appliquerDys() {
    var h = document.documentElement;
    h.classList.toggle('resist-dys', dys);
    if (!dys || document.getElementById('resist-dys')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap';
    var st = document.createElement('style');
    st.id = 'resist-dys';
    st.textContent =
      'html.resist-dys body, html.resist-dys body *:not(a.group *):not(.resist):not(code):not(.font-mono){font-family:Lexend,system-ui,sans-serif!important;letter-spacing:.035em!important;word-spacing:.14em!important}' +
      'html.resist-dys p, html.resist-dys li, html.resist-dys label, html.resist-dys td, html.resist-dys pre{line-height:1.75!important}';
    (document.head || h).appendChild(l);
    (document.head || h).appendChild(st);
  }
  appliquerDys();

  // Lecture à voix haute avec la voix de l'appareil : le passage sélectionné, sinon le contenu de la page.
  var parle = false;
  function texteALire() {
    var sel = String(getSelection() || '').trim();
    if (sel) return sel;
    var zone = document.querySelector('main') || document.body;
    var copie = zone.cloneNode(true);
    copie.querySelectorAll('script,style,button,input,select,textarea,svg,nav,[aria-hidden="true"],#resist-outils').forEach(function (e) { e.remove(); });
    return (copie.innerText || copie.textContent || '').replace(/\s+\n/g, '\n').trim();
  }
  function ecouter(b) {
    var S = window.speechSynthesis;
    if (!S) return;
    if (parle) { S.cancel(); return; }
    // Phrase par phrase : certains navigateurs coupent les lectures trop longues.
    var morceaux = texteALire().match(/[^.!?…\n]+[.!?…]*\s*/g) || [];
    if (!morceaux.length) return;
    S.cancel();
    parle = true; b.textContent = '■'; b.title = EN ? 'Stop reading' : 'Arrêter la lecture';
    morceaux.forEach(function (m, k) {
      var u = new SpeechSynthesisUtterance(m.trim());
      u.lang = EN ? 'en-GB' : 'fr-FR';
      if (k === morceaux.length - 1) u.onend = fin;
      u.onerror = fin;
      S.speak(u);
    });
    function fin() { parle = false; b.textContent = '🔊'; b.title = EN ? 'Read aloud' : 'Écouter la page'; }
  }

  function bouton() {
    if (document.getElementById('resist-outils')) return;
    var g = document.createElement('div');
    g.id = 'resist-outils';
    g.setAttribute('data-i18n-skip', '');
    // En bas à droite ; sur Paraphe au téléphone, au-dessus du bouton + et de la barre du bas.
    var mobileParaphe = document.querySelector('.basse') && innerWidth < 900;
    var bas = mobileParaphe ? 'calc(146px + env(safe-area-inset-bottom))' : 'calc(12px + env(safe-area-inset-bottom))';
    g.style.cssText = 'position:fixed;right:12px;bottom:' + bas + ';z-index:60;display:flex;gap:6px';
    function petit(txt, titre, action) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = txt; b.title = titre; b.setAttribute('aria-label', titre);
      b.style.cssText = 'font:600 11.5px/1 -apple-system,system-ui,sans-serif;letter-spacing:.06em;min-width:30px;padding:7px 9px;border-radius:999px;' +
        'border:1px solid rgba(14,14,18,.14);background:rgba(255,255,255,.88);color:rgba(14,14,18,.6);cursor:pointer;backdrop-filter:blur(6px)';
      b.onclick = function () { action(b); };
      g.appendChild(b);
      return b;
    }
    // Lecture à voix haute (🔊) retirée le 15/10/2026 à la demande de Ste ; la fonction ecouter() reste ci-dessus.
    var bd = petit('Aa', '', function (b) {
      dys = !dys;
      document.cookie = 'resist_dys=' + (dys ? 1 : 0) + '; path=/; max-age=31536000; samesite=lax';
      appliquerDys();
      majDys(b);
    });
    function majDys(b) {
      b.style.background = dys ? 'rgba(14,14,18,.85)' : 'rgba(255,255,255,.88)';
      b.style.color = dys ? '#fff' : 'rgba(14,14,18,.6)';
      b.title = dys ? (EN ? 'Standard reading' : 'Lecture standard') : (EN ? 'Easier reading (dyslexia)' : 'Lecture facilitée (dyslexie)');
      b.setAttribute('aria-label', b.title);
      b.setAttribute('aria-pressed', dys);
    }
    majDys(bd);
    petit('A+', EN ? 'Larger text' : 'Texte plus grand', function (b) {
      taille = (taille + 1) % TAILLES.length;
      document.cookie = 'resist_taille=' + taille + '; path=/; max-age=31536000; samesite=lax';
      appliquerTaille();
      b.textContent = taille === TAILLES.length - 1 ? 'A–' : 'A+';
    }).textContent = taille === TAILLES.length - 1 ? 'A–' : 'A+';
    document.body.appendChild(g);
  }
  if (document.body) bouton(); else document.addEventListener('DOMContentLoaded', bouton);
  if (lang !== 'en') return;
  document.documentElement.lang = 'en';

  // ---------- dictionnaire ----------
  var D = {
    // Accueil
    'Outils simples et privés pour militer collectivement.': 'Simple, private tools for organising together.',
    'Outils simples et privés': 'Simple, private tools',
    'pour militer collectivement.': 'for organising together.',
    'Signature Texte': 'Sign a Text',
    'Partager votre texte, recevoir les modifs suggérées, les signatures et les logos signataires': 'Share your text, collect suggested edits, signatures and signatory logos',
    'sans que ce soit relou.': 'without the hassle.',
    'Créer un texte à signer': 'Create a text to sign',
    'Sondage Réunion': 'Meeting Poll',
    'Qui est dispo ? À quelles dates ? À quelle heure ? En Visio ou IRL ? Découvrez-le': 'Who’s free? Which days? What time? Video call or in person? Find out',
    'Créer un sondage de date': 'Create a date poll',
    'Paraphe : Espace Pétition': 'Paraphe: Petition Space',
    'J’ajoute les pétitions reçues dans mes messageries et je signe quand j’ai un moment de libre': 'I collect the petitions I receive in my messaging apps and sign them when I have a free moment',
    'Découvrir l’appli': 'Discover the app',
    'Mon espace': 'My space',
    'Vos textes, sondages et pétitions, sur tous vos appareils.': 'Your texts, polls and petitions, on all your devices.',
    '100% gratuit et sans inscription.': '100% free, no sign-up.',
    'Chaque page vit sur un lien secret, non indexé. Tout est effacé au bout de 6 mois sans activité, sauf les textes que vous mettez hors ligne pour les archiver.': 'Each page lives on a secret, unindexed link. Everything is deleted after 6 months of inactivity, except texts you take offline to archive them.',
    'Donner un peu d\'argent': 'Chip in',
    'Une grille de disponibilités': 'An availability grid',
    'Une signature tracée à la main': 'A handwritten signature',
    'Des pétitions reçues par message, signées d\'un coup': 'Petitions received by message, signed in one go',
    'Resist ! — outils pour militer sans que ce soit relou': 'Resist! — organising tools without the hassle',
    'Resist ! — revenir à l\'accueil': 'Resist! — back to home',
    'Resist ! Textes': 'Resist! Texts', 'Resist ! Réunion': 'Resist! Meeting', 'Resist ! Paraphe': 'Resist! Paraphe', 'Resist ! Mon espace': 'Resist! My space',
    'Les outils tournent sur un hébergement payé au mois. Branchez ici un lien HelloAsso, Liberapay ou Stripe : rien n\'est encore connecté.': 'These tools run on hosting paid monthly. Plug in a HelloAsso, Liberapay or Stripe link here: nothing is connected yet.',

    // Mon espace
    'Vos textes, sondages et pétitions, sur tous vos appareils. Sans compte : un code personnel suffit.': 'Your texts, polls and petitions, on all your devices. No account: a personal code is enough.',
    'Sans compte : un code personnel suffit.': 'No account: a personal code is enough.',
    'Textes que je pilote': 'Texts I manage',
    'Textes que j\'ai signés': 'Texts I signed',
    'Sondages de date': 'Date polls',
    'Aucun texte créé pour l\'instant.': 'No texts created yet.',
    'Aucun texte signé pour l\'instant.': 'No texts signed yet.',
    'Aucun sondage pour l\'instant.': 'No polls yet.',
    'pilotage': 'managing', 'signé': 'signed', 'sondage': 'poll',
    'Archiver': 'Archive', 'Restaurer': 'Restore',
    'Archiver (rien n\'est effacé)': 'Archive (nothing is deleted)',
    'Restaurer dans ma liste': 'Restore to my list',
    'Pétitions': 'Petitions',
    'Elles sont rangées dans Paraphe.': 'They are kept in Paraphe.',
    'Ouvrir Paraphe': 'Open Paraphe',
    'Retrouver tout ça sur un autre appareil': 'Get all this on another device',
    'Copiez ce code, puis collez-le dans « Relier » sur l\'autre appareil (ou dans l\'app installée). Il donne accès à vos textes : ne le partagez pas.': 'Copy this code, then paste it into “Link” on the other device (or in the installed app). It gives access to your texts: don’t share it.',
    'Copier mon code': 'Copy my code', 'Code copié': 'Code copied',
    'Code d\'un autre appareil': 'Code from another device',
    'Relier': 'Link',
    'Appareil relié : tout est réuni.': 'Device linked: everything is together.',
    'Relié, mais la synchronisation a échoué. Réessayez plus tard.': 'Linked, but syncing failed. Try again later.',
    'Hors ligne : affichage de ce que cet appareil connaît.': 'Offline: showing what this device knows.',
    'Ce code ne ressemble pas à un code personnel (xxxx-xxxx-xxxx).': 'This doesn’t look like a personal code (xxxx-xxxx-xxxx).',

    // Textes — création
    'Un texte à signer ?': 'A text to sign?',
    'Collez le texte, partagez le lien. Les organisations répondent, proposent des modifs et déposent leur logo au même endroit.': 'Paste the text, share the link. Organisations reply, suggest edits and upload their logo in one place.',
    'Titre de l\'appel': 'Title of the call',
    'Tribune contre…': 'Open letter against…',
    'Une phrase de contexte': 'A line of context',
    '(facultatif)': '(optional)', 'facultatif': 'optional',
    'Texte proposé par… à signer avant le…': 'Text proposed by… to sign before…',
    'Le texte': 'The text',
    'Un paragraphe par bloc. Laissez une ligne vide entre deux paragraphes.': 'One paragraph per block. Leave a blank line between paragraphs.',
    'Chaque paragraphe devient annotable : les organisations pourront viser un passage précis.': 'Each paragraph can be annotated: organisations can point to a specific passage.',
    'Date limite de signature': 'Signature deadline',
    'Contact affiché': 'Displayed contact',
    'mail ou compte Signal': 'email or Signal account',
    'Publier le texte': 'Publish the text',
    'Publication…': 'Publishing…',
    'Votre texte est en ligne.': 'Your text is online.',
    'Votre lien de pilotage (à garder)': 'Your management link (keep it)',
    'Lien à faire circuler': 'Link to share',
    'À faire circuler dans les organisations': 'To share with organisations',
    'Signer ce texte maintenant': 'Sign this text now',
    'Il faut au minimum un titre et un texte.': 'You need at least a title and a text.',
    'Création impossible.': 'Could not create it.',

    // Textes — page publique
    'Page pilotage': 'Management page', 'Page publique': 'Public page',
    'signataires de la version en cours': 'signatories of the current version',
    'modifs en discussion': 'edits under discussion',
    'À signer avant le': 'Sign before',
    'Contact :': 'Contact:', 'Porté par': 'Led by', 'Nom de l’organisation ou du collectif': 'Name of the organisation or group', 'Enregistré': 'Saved',
    'Dernière modification le': 'Last modified on',
    'Publié le': 'Published on',
    'Expiration du lien :': 'Link expires:',
    'Une modification à suggérer ? Sélectionnez le texte à modifier et cliquez sur l\'icône crayon ✎ à droite du paragraphe.': 'Want to suggest an edit? Select the text to change and click the pencil icon ✎ to the right of the paragraph.',
    'Suggérer une modif sur ce paragraphe': 'Suggest an edit to this paragraph',
    'en discussion sur ce paragraphe': 'under discussion on this paragraph',
    'Modifications proposées': 'Suggested edits',
    'intégrée': 'integrated', 'Intégrée': 'Integrated', 'En discussion': 'Under discussion', 'Écartée': 'Rejected',
    'Je signe': 'I sign',
    'Sans compte : à la fin, vous recevez un lien de signataire pour modifier ou revalider plus tard.': 'No account: at the end you get a signatory link to edit or re-confirm later.',
    'Oui': 'Yes', 'Non': 'No',
    'Oui, si les modifs suggérées sont intégrées': 'Yes, if the suggested edits are included',
    'En cours de réflexion': 'Still thinking',
    'Nom de l’organisation ou de la personne': 'Name of the organisation or person',
    'Nom de l\'organisation ou de la personne': 'Name of the organisation or person',
    'Fonction': 'Role', 'Ville': 'City',
    'Email de contact': 'Contact email', '(jamais publié)': '(never published)',
    'Un mot à ajouter': 'Anything to add',
    'Charger votre logo en JPEG ou PNG': 'Upload your logo (JPEG or PNG)',
    'Remplacer notre logo': 'Replace our logo',
    'Facultatif. PNG, JPEG, WebP ou SVG, 2 Mo maximum (un logo plus lourd est réduit automatiquement). Il apparaîtra avec votre signature sur le visuel final : inutile de l\'envoyer en plus par mail.': 'Optional. PNG, JPEG, WebP or SVG, 2 MB max (a heavier logo is shrunk automatically). It will appear with your signature on the final visual: no need to email it as well.',
    'Valider ma réponse': 'Submit my answer',
    'Mettre à jour notre réponse': 'Update our answer',
    'Réponse enregistrée ✓': 'Answer saved ✓',
    'Envoi…': 'Sending…',
    'Votre réponse porte sur la version': 'Your answer applies to version',
    'du texte. Si elle change, on vous redemandera de valider.': 'of the text. If it changes, you’ll be asked to confirm again.',
    'Votre lien de signataire (pour modifier ou revalider)': 'Your signatory link (to edit or re-confirm)',
    'Copier le lien': 'Copy link', 'Lien copié': 'Link copied',
    'Les signataires': 'Signatories',
    'Personne n\'a encore signé.': 'Nobody has signed yet.',
    'Votre organisation peut être la première signataire.': 'Your organisation can be the first to sign.',
    'Signé sous réserve': 'Signed with reservations',
    'En réflexion': 'Thinking', 'Ne signe pas': 'Not signing',
    'Les signatures sont closes pour ce texte.': 'Signatures are closed for this text.',
    'Ce texte n’est plus en ligne.': 'This text is no longer online.',
    'Ce texte n’existe pas ou a été effacé (un lien dure 180 jours).': 'This text doesn’t exist or has been deleted (a link lasts 180 days).',
    'Suggérer une modification': 'Suggest an edit',
    'Le passage visé est repris ci-dessous, vous pouvez l\'ajuster.': 'The selected passage is copied below; you can adjust it.',
    'Vous êtes': 'You are',
    'Organisation ou prénom': 'Organisation or first name',
    'Passage visé': 'Selected passage',
    'Votre proposition': 'Your suggestion',
    'Remplacer par…': 'Replace with…',
    'Pourquoi': 'Why',
    'Envoyer la modif': 'Send the edit',
    'Annuler': 'Cancel',
    'Il faut votre nom et la modification proposée.': 'We need your name and the suggested edit.',
    'Une réponse existe déjà à ce nom.': 'An answer already exists under this name.',
    'Nous n\'écrasons pas une réponse existante sur la foi d\'un nom. Deux cas :': 'We don’t overwrite an existing answer based on a name alone. Two cases:',
    'C\'est bien nous.': 'It’s us.',
    'Reprenez votre lien de signataire, affiché après votre première réponse, ou demandez-le aux personnes qui pilotent le texte.': 'Use your signatory link, shown after your first answer, or ask the people managing the text.',
    'C\'est une autre structure.': 'It’s a different organisation.',
    'Enregistrez quand même, les deux réponses coexisteront.': 'Save anyway; both answers will be kept.',
    'Enregistrer comme une autre structure': 'Save as a different organisation',
    'Corriger le nom': 'Fix the name',
    'Il faut le nom de l’organisation ou de la personne.': 'We need the name of the organisation or person.',
    'Logo trop lourd : 2 Mo maximum. Choisissez une version plus légère de votre logo.': 'Logo too large: 2 MB max. Choose a lighter version of your logo.',
    'Logo accepté en PNG, JPEG, WebP ou SVG.': 'Logo accepted as PNG, JPEG, WebP or SVG.',
    'Ce texte est clos, les suggestions sont fermées.': 'This text is closed; suggestions are off.',
    'Ce lien de signataire ne correspond à aucune réponse.': 'This signatory link doesn’t match any answer.',
    'Ce lien de signataire n’est plus valable.': 'This signatory link is no longer valid.',
    'Version signée': 'Signed version', 'À revalider': 'To re-confirm', 'à revalider': 'to re-confirm',

    // Textes — pilotage
    'Pilotage · version': 'Managing · version',
    'Cliquez sur le titre pour le modifier.': 'Click the title to edit it.',
    'Entrée pour enregistrer.': 'Press Enter to save.',
    'Titre enregistré': 'Title saved', 'Enregistrement…': 'Saving…',
    'Titre du texte': 'Text title',
    'Lien du document à envoyer pour signature': 'Document link to send for signature',
    'Copier': 'Copy', 'Copié': 'Copied', 'Copié !': 'Copied!',
    'Vous pilotez à plusieurs ? Partagez ce lien de pilotage avec les autres organisations.': 'Managing it together? Share this management link with the other organisations.',
    'Copier le lien de pilotage': 'Copy the management link',
    'Oui, je signe': 'Yes, I sign', 'Oui, si les modifs suggérées sont intégrées': 'Yes, if the suggested changes are made', 'En cours de réflexion': 'Still thinking',
    'logos reçus': 'logos received', 'vues du lien': 'link views',
    'Télécharger les signataires (CSV)': 'Download signatories (CSV)',
    'Clore les signatures': 'Close signatures', 'Rouvrir les signatures': 'Reopen signatures',
    'Mettre hors ligne': 'Take offline', 'Remettre en ligne': 'Put back online',
    'Ce texte a plus de 180 jours : il reste en archive, il ne peut plus être remis en ligne.': 'This text is over 180 days old: it stays archived and can’t be put back online.',
    'Le texte': 'The text',
    'Chaque publication crée une version numérotée. Petite correction : personne n\'a à revalider. Changement de fond : les signataires devront revalider.': 'Each publication creates a numbered version. Minor correction: nobody needs to re-confirm. Substantive change: signatories will have to re-confirm.',
    'Ce qui change dans cette version (ex. : reprise du 2e paragraphe suite aux modifs)': 'What changes in this version (e.g. reworked 2nd paragraph after edits)',
    'Petite correction': 'Minor correction', 'Changement de fond': 'Substantive change',
    '(personne n\'a à revalider)': '(nobody needs to re-confirm)',
    '(les signataires doivent revalider)': '(signatories must re-confirm)',
    'Modifiez le texte pour pouvoir publier.': 'Edit the text to be able to publish.',
    'Choisissez petite correction ou changement de fond.': 'Choose minor correction or substantive change.',
    'Historique du texte': 'Text history',
    'Lire': 'Read', 'Replier': 'Collapse', 'en ligne': 'online',
    'Aucune pour l\'instant.': 'None yet.',
    'OK, intégrer :': 'OK, apply:', 'Intégration…': 'Applying…',
    'petite correction': 'minor correction', 'changement de fond': 'substantive change',
    'Remplace le passage cité ; les signataires n\'ont pas à revalider': 'Replaces the quoted passage; signatories don’t need to re-confirm',
    'Remplace le passage cité ; les signataires devront revalider': 'Replaces the quoted passage; signatories will have to re-confirm',
    'Le passage cité ne se trouve plus tel quel dans le texte': 'The quoted passage is no longer in the text as is',
    'Pas de passage cité': 'No quoted passage',
    ': à intégrer à la main dans le texte ci-dessus.': ': apply it by hand in the text above.',
    '« OK, intégrer » remplace le passage cité par la proposition et publie aussitôt une nouvelle version : petite correction, personne n\'a à revalider ; changement de fond, les signataires doivent revalider.': '“OK, apply” replaces the quoted passage with the suggestion and publishes a new version right away: minor correction, nobody re-confirms; substantive change, signatories must re-confirm.',
    '« À revalider » : a signé une version plus ancienne du texte.': '“To re-confirm”: signed an older version of the text.',
    'Nom': 'Name', 'Réponse': 'Answer', 'Version': 'Version', 'Contact': 'Contact', 'Logo': 'Logo',
    'Ouvrir': 'Open', 'Renvoyer son lien': 'Resend their link',
    'Si cette personne a perdu son lien pour modifier sa réponse : copiez-le et envoyez-le-lui, à elle seule.': 'If this person lost their link to edit their answer: copy it and send it to them only.',
    'Lien de signataire': 'Signatory link',
    'Leur accord porte sur un texte qui n\'est plus celui en ligne. Tant qu\'ils n\'ont pas revalidé, ne les comptez pas parmi les signataires de la v': 'Their agreement is on a text that is no longer the one online. Until they re-confirm, don’t count them among the signatories of v',
    'Écrire aux': 'Email the', 'contacts': 'contacts',
    'Aucun de ces signataires n\'a laissé d\'email.': 'None of these signatories left an email.',
    'Copier son lien de signataire': 'Copy their signatory link',
    'Clé de pilotage manquante.': 'Management key missing.',
    'Clé de pilotage invalide.': 'Invalid management key.',
    'Le lien de pilotage se termine par': 'The management link ends with',
    '. Sans lui, cette page ne montre rien.': '. Without it, this page shows nothing.',
    'Voir la page publique': 'See the public page',
    'Chargement…': 'Loading…',
    'Action impossible.': 'Action not possible.',

    // Réunion
    'Quand se réunir ?': 'When to meet?',
    '+ Créer un nouveau sondage de date': '+ Create a new date poll',
    'Inviter': 'Invite',
    'Saisir les dates du sondage': 'Pick the poll dates',
    'Saisir les plages horaires du sondage': 'Pick the poll time range',
    'Touchez les jours, ou glissez pour en prendre plusieurs.': 'Tap days, or drag to pick several.',
    'Début': 'Start', 'Fin': 'End', 'Heure de début': 'Start time', 'Heure de fin': 'End time',
    'Mois précédent': 'Previous month', 'Mois suivant': 'Next month',
    'Lu': 'Mo', 'Ma': 'Tu', 'Me': 'We', 'Je': 'Th', 'Ve': 'Fr', 'Sa': 'Sa', 'Di': 'Su',
    'Titre de l\'évènement (optionnel)': 'Event title (optional)',
    'Manifestation pour nos droits': 'Rally for our rights',
    'URL de l\'évènement (optionnel)': 'Event URL (optional)',
    'Ajouter un titre ici': 'Add a link here',
    'Le sondage et ses réponses s\'effacent 180 jours après la création.': 'The poll and its answers are deleted 180 days after creation.',
    'Créer le sondage': 'Create the poll',
    'Un instant…': 'One moment…',
    'Choisissez au moins une date dans le calendrier.': 'Pick at least one date in the calendar.',
    'Choisissez au moins une date.': 'Pick at least one date.',
    'La plage horaire est incorrecte.': 'The time range is invalid.',
    'Lien vu': 'Link viewed', 'fois': 'times',
    'Modifier le sondage': 'Edit the poll',
    'Meilleur résultat actuel': 'Current best result',
    'Copier le résultat': 'Copy the result',
    'Préférences': 'Preferences', 'Préférences (optionnel)': 'Preferences (optional)',
    'Je préfère': 'I prefer', 'Présentiel': 'In person', 'Visio': 'Video call',
    'Présentiel ou visio, à égalité': 'In person or video, tied',
    'Pas encore de réponse.': 'No answers yet.',
    'Personne n\'a encore répondu. À vous de commencer.': 'Nobody has answered yet. You go first.',
    'Je saisis mes disponibilités': 'Enter my availability',
    'Votre pseudo': 'Your name', 'OK': 'OK', 'Valider': 'Submit',
    'Pour modifier, saisissez le même pseudo': 'To edit, enter the same name',
    'Vos disponibilités sont enregistrées.': 'Your availability is saved.',
    'Il faut un pseudo.': 'A name is needed.',
    'Dispo :': 'Available:', 'Pas dispo :': 'Not available:', 'personne': 'nobody',
    'Supprimer': 'Delete', 'Garder': 'Keep', 'Supprimer le vote de': 'Delete the vote of',
    '? C\'est définitif.': '? This is permanent.',
    'à égalité': 'tied',
    'Ce sondage n’existe pas ou a été effacé (un lien dure 180 jours).': 'This poll doesn’t exist or has been deleted (a link lasts 180 days).',
    'Ce sondage a été créé avec l’ancienne version de Réunion : créez-en un nouveau.': 'This poll was made with the old version of Meeting: create a new one.',
    'Enregistrer les modifications': 'Save changes',
    'Les dispos déjà saisies sont gardées. Celles qui tombent hors des nouvelles dates ou heures ne comptent plus, mais reviennent si on remet le créneau.': 'Availability already entered is kept. Slots outside the new dates or hours no longer count, but come back if the slot is restored.',
    'Dernière réponse': 'Latest answer',

    // Paraphe
    'Paraphe · mes pétitions': 'Paraphe · my petitions', 'Paraphe : mes pétitions': 'Paraphe: my petitions', 'mes pétitions': 'my petitions', '· mes pétitions': '· my petitions',
    '✎ À signer': '✎ To sign', 'À signer': 'To sign', 'À SIGNER': 'TO SIGN',
    '✓ Historique': '✓ History', 'Historique': 'History', 'HISTORIQUE': 'HISTORY',
    '⌫ Archivées': '⌫ Archived', 'Archivées': 'Archived',
    '★ Favoris': '★ Favourites', 'Favoris': 'Favourites', '⧉ Doublons': '⧉ Duplicates', 'Doublons': 'Duplicates',
    '⚙ Réglages': '⚙ Settings', 'Réglages': 'Settings', 'Accueil': 'Home', 'Plus': 'More',
    'Comment ajouter une pétition ?': 'How do I add a petition?',
    'Gmail, SMS, Signal :': 'Gmail, SMS, Signal:', 'Partager → Resist !': 'Share → Resist!',
    'WhatsApp, Telegram :': 'WhatsApp, Telegram:',
    'le message, puis ouvrir Paraphe et toucher le bandeau.': 'the message, then open Paraphe and tap the banner.',
    'iPhone : copier le lien, puis': 'iPhone: copy the link, then', 'en haut.': 'at the top.',
    'En savoir plus': 'Learn more', 'Coller': 'Paste',
    'Collez ici le lien d’une pétition…': 'Paste a petition link here…',
    'Lien d’une pétition': 'Petition link',
    'Rechercher une pétition': 'Search for a petition', 'Rechercher': 'Search',
    'Rechercher une pétition, une organisation…': 'Search for a petition, an organisation…',
    'Afficher en icônes': 'Show as icons', 'Afficher en liste': 'Show as list',
    'Pétitions que vous n’avez pas encore signées': 'Petitions you haven’t signed yet',
    'Pétitions que vous avez déjà signées, avec la date': 'Petitions you’ve already signed, with the date',
    'Afficher l’historique': 'Show history', 'Masquer l’historique': 'Hide history',
    '↗ Ouvrir et signer': '↗ Open and sign', 'Ouvrir et signer': 'Open and sign', '↗ Ouvrir': '↗ Open',
    'Signée ?': 'Signed?', '✓ Oui, signée': '✓ Yes, signed', 'Oui, signée': 'Yes, signed', 'Pas encore': 'Not yet',
    'Reçue aujourd\'hui': 'Received today', 'Reçue hier': 'Received yesterday',
    'Rien en attente. Partage un lien depuis Gmail ou Signal.': 'Nothing waiting. Share a link from Gmail or Signal.',
    'Quand vous avez signé une pétition, touchez « Ouvrir et signer », puis « Oui, signée » en revenant : elle arrive ici, avec la date.': 'Once you’ve signed a petition, tap “Open and sign”, then “Yes, signed” when you come back: it lands here, with the date.',
    'Reçues mais mises de côté — rien n’est perdu.': 'Received but set aside — nothing is lost.',
    'Les pétitions marquées d’une étoile.': 'Petitions marked with a star.',
    'Reçues plusieurs fois — une seule fiche.': 'Received several times — one card.',
    'Rien de mis de côté.': 'Nothing set aside.',
    'Aucun favori pour l’instant.': 'No favourites yet.',
    'Aucun doublon — chaque pétition n’est arrivée qu’une fois.': 'No duplicates — each petition arrived only once.',
    'Sauvegarde et fonctionnement.': 'Backup and how it works.',
    'Mon carnet': 'My notebook', 'Recevoir les liens': 'Receiving links', 'Sauvegarde': 'Backup', 'À propos': 'About',
    'Le geste à connaître depuis Gmail, Signal, WhatsApp ou Telegram.': 'The gesture to know from Gmail, Signal, WhatsApp or Telegram.',
    'Une copie de secours dans un fichier, au cas où.': 'A backup copy in a file, just in case.',
    'Voir la marche à suivre': 'See the steps',
    'Copier le code': 'Copy the code', 'J’ai déjà un code': 'I already have a code',
    'Envoyer mon lien personnel': 'Send my personal link',
    '✓ Synchronisé': '✓ Synced',
    'Pas de synchronisation pour l’instant (réseau ?). Rien n’est perdu, ça repartira tout seul.': 'Not syncing right now (network?). Nothing is lost; it will resume on its own.',
    'Ajouter une pétition': 'Add a petition', 'Ajouter un lien': 'Add a link', 'Lien ou message': 'Link or message',
    'Colle un lien ou tout le message reçu — les adresses sont repérées automatiquement et le titre est récupéré tout seul.': 'Paste a link or the whole message — addresses are detected and the title is fetched automatically.',
    'Pétition ajoutée': 'Petition added', 'Lien ajouté': 'Link added', 'Déjà dans la liste': 'Already in the list',
    'Déjà dans la liste — compteur mis à jour.': 'Already in the list — counter updated.',
    'Aucun lien trouvé dans ce texte.': 'No link found in this text.',
    'Rangée dans l’historique.': 'Moved to history.',
    '↩ Remettre à signer': '↩ Back to “to sign”', '⌫ Archiver sans signer': '⌫ Archive without signing',
    '⎘ Copier le lien': '⎘ Copy link', '☆ Retirer des favoris': '☆ Remove from favourites', '★ Ajouter aux favoris': '★ Add to favourites',
    '✓ Marquer comme signée': '✓ Mark as signed', '➕ Ranger dans À signer': '➕ Move to “to sign”',
    'Supprimer définitivement': 'Delete permanently',
    'Trois étapes, c’est tout.': 'Three steps, that’s all.',
    'Pas envie de la signer ? Menu ⋮ →': 'Don’t want to sign it? Menu ⋮ →',
    'Carnet relié. Les pétitions arrivent…': 'Notebook linked. Petitions are arriving…',
    'Ce code ne ressemble pas à un code de carnet.': 'This doesn’t look like a notebook code.',
    'Gardez ce code': 'Keep this code',
    'Société': 'Society', 'Autre': 'Other', 'Environnement': 'Environment', 'Santé': 'Health', 'Éducation': 'Education',
    'Droits humains': 'Human rights', 'Animaux': 'Animals', 'Travail': 'Work', 'Logement': 'Housing', 'Culture': 'Culture', 'Politique': 'Politics',
  };

  var MOIS = { janvier: 'January', 'février': 'February', mars: 'March', avril: 'April', mai: 'May', juin: 'June', juillet: 'July', 'août': 'August', septembre: 'September', octobre: 'October', novembre: 'November', 'décembre': 'December' };
  var JOURS = { lundi: 'Monday', mardi: 'Tuesday', mercredi: 'Wednesday', jeudi: 'Thursday', vendredi: 'Friday', samedi: 'Saturday', dimanche: 'Sunday' };
  var J3 = { lun: 'Mon', mar: 'Tue', mer: 'Wed', jeu: 'Thu', ven: 'Fri', sam: 'Sat', dim: 'Sun' };
  var M3 = { janv: 'Jan', 'févr': 'Feb', mars: 'Mar', avr: 'Apr', mai: 'May', juin: 'Jun', juil: 'Jul', 'août': 'Aug', sept: 'Sep', oct: 'Oct', nov: 'Nov', 'déc': 'Dec' };
  var RM = '(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)';

  // Textes avec une partie variable (nombres, dates, noms).
  var R = [
    [new RegExp('^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) (\\d{1,2}) ' + RM + ' (\\d{4}), de (\\d\\d:\\d\\d) à (\\d\\d:\\d\\d)$'), function (m) { return JOURS[m[1]] + ', ' + MOIS[m[3]] + ' ' + m[2] + ', ' + m[4] + ', ' + m[5] + '–' + m[6]; }],
    [new RegExp('^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) (\\d{1,2}) ' + RM + ' (\\d{4})(.*)$'), function (m) { return JOURS[m[1]] + ', ' + MOIS[m[3]] + ' ' + m[2] + ', ' + m[4] + m[5]; }],
    [new RegExp('^(\\d{1,2}) ' + RM + ' (\\d{4})$'), function (m) { return MOIS[m[2]] + ' ' + m[1] + ', ' + m[3]; }],
    [/^(lun|mar|mer|jeu|ven|sam|dim)\.?$/i, function (m) { return J3[m[1].toLowerCase()]; }],
    [/^(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\.?$/i, function (m) { return M3[m[1].toLowerCase()]; }],
    [/^(\d+) appareils reliés — en relier un autre$/, function (m) { return m[1] + ' devices linked — link another'; }],
    [/^(\d+) pétitions? dans Paraphe\.$/, function (m) { return m[1] + ' petition' + (m[1] === '1' ? '' : 's') + ' in Paraphe.'; }],
    [/^Archivés \((\d+)\)$/, function (m) { return 'Archived (' + m[1] + ')'; }],
    [/^Reçue il y a (\d+) jours?$/, function (m) { return 'Received ' + m[1] + ' day' + (m[1] === '1' ? '' : 's') + ' ago'; }],
    [/^Signée le (.+)$/, function (m) { return 'Signed on ' + tr(m[1]); }],
    [/^Signée (\d{1,2}) (\S+) (\d{4})$/, function (m) { return 'Signed ' + (MOIS[m[2]] || m[2]) + ' ' + m[1] + ', ' + m[3]; }],
    [/^reçue (\d+)×$/, function (m) { return 'received ' + m[1] + '×'; }],
    [/^et (\d+) autres? créneaux? à égalité$/, function (m) { return 'and ' + m[1] + ' other tied slot' + (m[1] === '1' ? '' : 's'); }],
    [/^Présentiel (\d+) · Visio (\d+)$/, function (m) { return 'In person ' + m[1] + ' · Video ' + m[2]; }],
    [/^Préférence : (.+)$/, function (m) { return 'Preference: ' + tr(m[1]); }],
    [/^Publier la version (\d+)$/, function (m) { return 'Publish version ' + m[1]; }],
    [/^Pilotage · version (\d+)$/i, function (m) { return 'Managing · version ' + m[1]; }],
    [/^Version (\d+)$/, function (m) { return 'Version ' + m[1]; }],
    [/^sur la v(\d+) · (.+)$/, function (m) { return 'on v' + m[1] + ' · ' + m[2]; }],
    [/^(\d+) signataires? a signé une version antérieure$/, function (m) { return m[1] + ' signatory signed an earlier version'; }],
    [/^(\d+) signataires ont signé une version antérieure$/, function (m) { return m[1] + ' signatories signed an earlier version'; }],
    [/^Écrire aux (\d+) contacts$/, function (m) { return 'Email the ' + m[1] + ' contacts'; }],
    [/^Le vote de (.+) est supprimé\.$/, function (m) { return m[1] + '’s vote was deleted.'; }],
    [/^Supprimer le vote de (.+)$/, function (m) { return 'Delete ' + m[1] + '’s vote'; }],
    [/^Votre logo pesait (.+) : il a été réduit à (.+) pour passer\.$/, function (m) { return 'Your logo weighed ' + m[1].replace('Mo', 'MB') + ': it was shrunk to ' + m[2].replace('Mo', 'MB') + ' to fit.'; }],
    [/^Ce fichier pèse (.+), c'est trop lourd \(2 Mo maximum\) et il n'a pas pu être réduit\. Choisissez une version plus légère de votre logo\.$/, function (m) { return 'This file weighs ' + m[1].replace('Mo', 'MB') + ', too large (2 MB max) and it couldn’t be shrunk. Choose a lighter version of your logo.'; }],
    [/^Votre réponse est à jour \(version (\d+)\)\.$/, function (m) { return 'Your answer is up to date (version ' + m[1] + ').'; }],
    [/^Vous aviez répondu sur la version (\d+)\. Le texte a changé : relisez-le et revalidez\.$/, function (m) { return 'You answered on version ' + m[1] + '. The text has changed: re-read it and re-confirm.'; }],
    [/^Une réponse existe déjà au nom de « (.+) »\.$/, function (m) { return 'An answer already exists under the name “' + m[1] + '”.'; }],
    [/^Signé en v(\d+), le texte est en v(\d+)$/, function (m) { return 'Signed on v' + m[1] + ', the text is on v' + m[2]; }],
    [/^(\d+)\/(\d+) dispo$/, function (m) { return m[1] + '/' + m[2] + ' available'; }],
    [/^(.+) : touchez ou glissez sur la grille pour cocher vos créneaux libres, puis Valider\.$/, function (m) { return m[1] + ': tap or drag on the grid to tick your free slots, then Submit.'; }],
  ];

  function norm(s) { return s.replace(/\u00a0|\u202f/g, ' ').replace(/\s+/g, ' ').trim(); }
  var N = {};
  for (var k in D) N[norm(k).replace(/’/g, "'")] = D[k];
  function tr(t) {
    var n = norm(t);
    if (!n) return null;
    var v = N[n.replace(/’/g, "'")];
    if (v != null) return v;
    for (var i = 0; i < R.length; i++) { var m = R[i][0].exec(n); if (m) return R[i][1](m); }
    return null;
  }

  var fait = new WeakMap(); // nœud → dernière valeur posée par ce script (évite de retraduire en boucle)
  function texte(node) {
    var v = node.nodeValue;
    if (fait.get(node) === v) return;
    var t = tr(v);
    if (t == null) return;
    var avant = v.match(/^\s*/)[0], apres = v.match(/\s*$/)[0];
    var nv = avant + t + apres;
    fait.set(node, nv);
    node.nodeValue = nv;
  }
  var ATTRS = ['placeholder', 'title', 'aria-label'];
  function attributs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = el.getAttribute && el.getAttribute(ATTRS[i]);
      if (!a) continue;
      var t = tr(a);
      if (t != null && t !== a) el.setAttribute(ATTRS[i], t);
    }
  }
  var SAUTER = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, PRE: 1, NOSCRIPT: 1 };
  function parcourir(root) {
    if (root.nodeType === 3) { if (!(root.parentNode && SAUTER[root.parentNode.nodeName])) texte(root); return; }
    if (root.nodeType !== 1 || SAUTER[root.nodeName] || root.hasAttribute('data-i18n-skip') || root.isContentEditable) return;
    attributs(root);
    for (var c = root.firstChild; c; c = c.nextSibling) parcourir(c);
  }
  function titre() { var t = tr(document.title); if (t && t !== document.title) document.title = t; }

  function demarrer() {
    parcourir(document.body); titre();
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === 'characterData') texte(m.target);
        else if (m.type === 'attributes') attributs(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) parcourir(m.addedNodes[j]);
      }
      titre();
    }).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  // Pages Next : attendre la fin de l'hydratation de React (sinon il signale un écart de texte et redessine tout).
  var next = !!document.querySelector('script[src*="/_next/"]');
  function lancer() { next ? setTimeout(demarrer, 150) : demarrer(); }
  if (next) { if (document.readyState === 'complete') lancer(); else addEventListener('load', lancer); }
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();

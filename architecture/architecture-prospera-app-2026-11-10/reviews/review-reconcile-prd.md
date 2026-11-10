# Relecture de réconciliation — spine `prospera-app` contre le PRD du moteur d'installation

Périmètre : ce que la source exige de la coque et qui manque ou est contredit dans `ARCHITECTURE-SPINE.md`. Sources lues : PRD §0, §3, §3.1, FR-9, FR-10, FR-14 à FR-18, FR-22, FR-23, FR-27, FR-32 à FR-43, NFR, §6, §8, UJ-1 à UJ-5 ; addendum §A-2, §A-5, §A-7, §A-8 ; `controle-cible.md` §4.

**Verdict.** Le noyau (état publié unique, garde unique, neuf états, intersection lue, FR-43) est fidèle. Il manque des exigences discrètes : bandeau du gel, droit de consentir réservé au DG, exemption de la lecture seule pour l'export et les états réglementaires, liste des écrans d'Administration, texte et titre d'onglet du bandeau d'essai. Une contradiction sur le temps (compte à rebours) et une sur l'export en `NON_INSTALLE` sont à corriger.

Note préalable : le PRD n'énonce aucune exigence transverse propre au front (accessibilité, performance, langue). Seules s'y rattachent FR-34 « moins d'une minute » (tenue par AD-5, 30 s), la langue de l'accueil (D1, AD-13) et le web adaptatif de UJ-3 (360 px, déjà dans les conventions). NFR-5 (installation en moins de 15 minutes) et NFR-9 (interruption de 15 minutes « annoncées ») sont côté moteur, sauf l'annonce, voir E-09.

---

## Écarts

### E-01 — Bandeau du gel (orange, administrateurs seulement) absent. Gravité : haute
- **Source :** FR-15 « un bandeau orange s'affiche **pour les administrateurs seulement** (FR-35) » à J+30 sans contact ; A-2 : la lecture rend `instance.etat` (`NORMAL` | `GEL`) et `VERSION_FIGEE`.
- **Spine :** AD-7 énumère « compte à rebours, préavis, lecture seule, santé `DEGRADE`, bilan d'installation » ; le gel n'y est pas. Rien non plus sur `VERSION_FIGEE` (FR-32 : un module neuf exige la version courante).
- **Correction :** ajouter à AD-7 et à la table de §3.1 le bandeau `GEL` (orange, détenteurs de `instance:bilan:consulter` seuls) ; dire que la coque lit `instance.etat` et `VERSION_FIGEE`, et que « Installer » et « Mettre à jour » s'y désactivent avec la raison.

### E-02 — Droit de consentir réservé au DG et `CONSENTEMENT_RESERVE_AU_DG` mal classé. Gravité : haute
- **Source :** FR-35 « `instance:consentement:donner` ne s'attribue que par le DG, à lui-même ou à une personne qu'il désigne par écrit ; la référence de l'écrit est rangée au registre » ; un administrateur reçoit `CONSENTEMENT_RESERVE_AU_DG` (403) ; FR-27 (journal des dons et retraits consultable par le client) ; FR-36 « donner ou retirer un consentement (DG) ».
- **Spine :** AD-9 range `CONSENTEMENT_RESERVE_AU_DG` parmi les refus qui « relisent l'état » puis laissent la garde ou `<Ecriture>` afficher l'écran. Ce refus n'est pas un changement d'état : relire ne change rien, et aucun mécanisme n'affiche le message. AD-6 ne dit rien de l'écran des rôles pour ce droit ni de l'écran de consentement.
- **Correction :** retirer ce code d'AD-9 et le traiter comme erreur locale de l'écran des rôles (message traduit « seul le DG peut attribuer ce droit », champ de référence de l'écrit) ; ajouter l'écran « Consentements » (DG ou désigné ; journal) à l'inventaire d'AD-14.

### E-03 — `<Ecriture>` masque l'export et les états réglementaires, et AD-14 contredit FR-43 sur `NON_INSTALLE`. Gravité : haute
- **Source :** FR-43 : en `LECTURE_SEULE` et en `SUSPENDU`, « export et production des états réglementaires (BCEAO, SYSCOHADA) » restent ouverts, déclarés au manifeste (C13) ; l'export est « réservé au détenteur de `instance:donnees:exporter` » ; tableau : `NON_INSTALLE` → export **refusé** (403 `<MODULE>_NOT_ENTITLED`) ; `EN_INSTALLATION`, `DESINSTALLE`, `ESSAI_TERMINE` → ouvert.
- **Spine :** AD-7 enveloppe « toute action d'écriture » dans `<Ecriture>`, qui la masque hors écriture. Les actions d'état réglementaire (souvent des `POST`) seraient donc cachées exactement quand le PRD les veut ouvertes. En `SUSPENDU` le module est caché et l'URL mène à l'écran d'état de la coque (AD-4) : aucun chemin vers les états réglementaires. AD-14 : « l'export de chaque module est atteignable d'ici, **quel que soit l'état** », ce qui contredit `NON_INSTALLE` (refusé). Le droit `instance:donnees:exporter` n'est pas nommé.
- **Correction :** `ecran.ts` déclare ses actions « autorisées en lecture seule » (états réglementaires), que `<Ecriture>` laisse passer ; l'écran d'état `SUSPENDU` (et `LECTURE_SEULE`) offre un accès à ces états ; AD-14 liste les modules exportables selon la colonne « Export » de FR-43 (tous sauf `NON_INSTALLE`) et nomme `instance:donnees:exporter`.

### E-04 — Les écrans d'Administration ne sont pas inventoriés. Gravité : haute
- **Source :** FR-36 : « voir les mises à jour, essayer, choisir la date, revenir en arrière ; mettre à jour depuis un fichier ; ouvrir le tunnel de support ; donner ou retirer un consentement (DG) ; exporter ses données ; consulter le bilan de son installation ; rôles et droits ; pour le prospect, l'import en autonomie, le compte à rebours de l'essai et l'export pendant `ESSAI_TERMINE` ». S'y ajoutent : FR-22 (dépôt de licence ou de paquet, UJ-5), FR-23 (journal des sessions de support et des comptes Money Vibes consultable par le client), FR-27 (journal de consentement), FR-17 (interrupteurs sur la plateforme), §8.4 « PRD Reprise : C8, écrans dans `prospera-app` **dès février** (libre-service du prospect) ».
- **Spine :** AD-14 ne nomme que les droits `instance:*` et l'export ; il cite seulement « planifier, revenir, fichier, support » comme absents sur la plateforme. L'import en autonomie du prospect, le dépôt de licence, le bilan, le consentement, le journal de support et l'écran des interrupteurs n'ont ni écran ni lieu dans `modules/instance/`. Le prospect (FR-33, février) n'a donc pas de parcours.
- **Correction :** ajouter à AD-14 un tableau écran → droit (`mise-a-jour:consulter|planifier|revenir`, `fichier:deposer`, `support:ouvrir`, `consentement:donner`, `donnees:exporter`, `bilan:consulter`) et préciser quel module porte l'import du prospect (Reprise ou `instance`) ; en tirer les stories `PRA-1xx`.

### E-05 — Marque de l'espace d'essai : texte, couleur et titre d'onglet. Gravité : moyenne
- **Source :** FR-9 « un **bandeau jaune** (« ESPACE D'ESSAI : rien de ce que vous faites ici n'est réel »), une couleur différente et un **titre d'onglet différent** » ; FR-42 : le lien vers l'autre espace n'existe que pour « un membre présent dans les deux espaces » ; FR-33 : le prospect n'a **aucun accès** à l'espace réel.
- **Spine :** AD-12 dit « bandeau et couleur de bordure » ; ni le texte, ni le jaune, ni le **titre d'onglet** ne sont fixés. Le lien vers l'autre espace « vient de la configuration » sans condition, alors qu'un prospect n'a pas d'espace réel.
- **Correction :** AD-12 fixe le texte i18n du bandeau, sa couleur (jeton `essai` hors surcharge de marque) et un préfixe de `<title>` ; le lien n'est rendu que si la configuration donne une adresse **et** que l'utilisateur est membre du réel (absent pour le prospect).

### E-06 — Compte à rebours : conflit apparent avec « jamais comparé à `Date.now()` ». Gravité : moyenne
- **Source :** §3.1 `ESSAI_PROSPECT{finLe}` → bandeau « compte à rebours » pour **tous** ; FR-34 : aucun écran ne recalcule un état à partir de dates ni ne lit l'horloge de son conteneur.
- **Spine :** AD-5 « les dates ne servent qu'à l'affichage » ; Conventions « jamais comparées à `Date.now()` pour décider ». Le compte à rebours exige un « maintenant » ; avec l'horloge du navigateur il est faux sur un poste mal réglé.
- **Correction :** AD-5 précise que le décompte se calcule contre `instance.heureDeReference` de la lecture (A-2), pas contre l'horloge du poste, et que l'état vient toujours de l'état publié (jamais de la fin du décompte).

### E-07 — Destinataire et contenu des bandeaux non transcrits ; source de « DG » et d'« administrateur » non nommée. Gravité : moyenne
- **Source :** §3.1 : `EN_INSTALLATION` → administrateurs, lien vers le bilan ; `ESSAI_PROSPECT` et `ESSAI_TERMINE` → tous (« Votre essai est terminé ; vos données seront effacées le … ») ; `PREAVIS` et `SUSPENDU` → administrateurs **et DG** (`SUSPENDU` : la raison et l'action) ; `LECTURE_SEULE` → tous (« pour qu'on ne croie pas à une panne ») ; santé `DEGRADE` → administrateurs ; A-2 : la lecture rend « s'il est **DG** ou **administrateur** » ; `controle-cible` §4(a).
- **Spine :** AD-7 résume « tous, administrateurs (`instance:bilan:consulter`) ou DG » sans dire d'où vient « DG » ; ne dit pas que santé et droits déclarés ne sont rendus qu'aux administrateurs (pour un autre, santé absente, à lire comme `OK`, pas `DEGRADE`) ; ne dit pas si N modules en `PREAVIS` donnent N bandeaux ou un.
- **Correction :** AD-5 et AD-7 citent `utilisateur.estDG` et `utilisateur.estAdministrateur` de la lecture, fixent « santé absente = pas de bandeau » et regroupent les bandeaux par état (un bandeau par état, avec la liste des modules).

### E-08 — Interrupteurs de changement (FR-17, plateforme) : aucun écran, interface trop étroite. Gravité : moyenne
- **Source :** FR-17 « l'administrateur d'une organisation l'essaie dans l'espace d'essai et l'allume quand il est prêt ; à sa **date limite** (30 jours), il s'allume seul » ; A-2 : la lecture rend `{ code, allume, dateLimite }` par module.
- **Spine :** `useModule(code)` ne rend que `interrupteur(nom)` ; la `dateLimite` et la liste ne sont pas exposées, et aucun écran de l'Administration ne les affiche ni ne les bascule.
- **Correction :** exposer la liste et la `dateLimite` dans `useModule`, et ajouter l'écran « Changements à venir » à AD-14 (droit à nommer ; absent sur site, où tout passe à la position finale).

### E-09 — Exigences d'écran de FR-17, FR-18, FR-22, FR-40 non retenues. Gravité : moyenne
- **Source :** FR-18 « Le DSI voit un **bandeau rouge** qui le dit [`AVEC_PERTE`] **avant** de choisir sa date » ; « Avant le clic, l'écran affiche la **durée prévue** du retour arrière » ; FR-40 « son avancement est visible dans la supervision et dans `prospera-app` » ; FR-22 « la signature est vérifiée sous les yeux du DSI », écran ouvert **même en lecture seule, en suspension ou en gel** ; FR-17 « message en langage simple : ce qui change, ce qu'il faut essayer, la date proposée » ; NFR-9 interruption « annoncée » et « annonce » 7 jours avant la fenêtre de la plateforme.
- **Spine :** rien de tout cela. Le bandeau rouge `AVEC_PERTE` est absent d'AD-7 ; l'ouverture du dépôt de fichier en gel n'est pas affirmée (AD-14 dit « hors intersection » pour les droits, pas pour le gel) ; l'annonce de fenêtre n'a ni lieu ni destinataire.
- **Correction :** compléter AD-7 (bandeau rouge `AVEC_PERTE`, avancement d'un retour arrière, annonce de fenêtre) et AD-14 (dépôt de fichier ouvert en `GEL`, durée prévue, ton « langage simple »).

### E-10 — Fraîcheur d'une synchronisation entrante : source non définie. Gravité : moyenne
- **Source :** FR-43 « Une synchronisation **entrante** […] continue, et l'écran **dit sa fraîcheur** » (UJ-3).
- **Spine :** AD-7 : « la coque lui fournit » la fraîcheur, mais la lecture de l'état publié (A-2) n'en porte aucune.
- **Correction :** dire d'où vient la fraîcheur (champ du module concerné, ou nouveau champ de la lecture à demander au moteur) et l'inscrire dans « Champs manquants » de Deferred.

### E-11 — Droits d'un module désinstallé et noms d'erreur des écrans d'Administration. Gravité : basse
- **Source :** FR-35 « un droit attribué pour un module désinstallé reste enregistré, n'ouvre rien, et revient tel quel à la réinstallation (C9) » ; codes nommés `LICENCE_AUTRE_INSTANCE`, `LICENCE_ANTERIEURE`, `MODULE_HORS_LICENCE`.
- **Spine :** AD-6 « ne propose que » les droits des modules ouverts : si l'écran enregistre le rôle entier, il effacerait les droits dormants. Les codes de refus du dépôt de licence (UJ-5) ne sont pas listés ; la convention « message traduit » est générique.
- **Correction :** AD-6 : l'écran des rôles conserve les droits dormants à l'enregistrement ; Conventions : lister les codes que l'écran de dépôt traduit.

### E-12 — Absence de canal d'événement (non-écart, noté). Gravité : basse
- **Source :** FR-34 « deux canaux, un seul contenu » (lecture et événement `etat-publie.changed`).
- **Spine :** la coque sonde toutes les 30 s et reporte le canal poussé à Deferred : cela tient « moins d'une minute ».
- **Correction :** aucune ; garder la ligne Deferred.

---

## Points conformes

Valeur d'état inconnue → `NON_INSTALLE` (AD-4, AD-5) ; menu et garde concordants par test en matrice (AD-15) ; menu construit par code et libellé du module commercial (AD-3) ; intersection lue et non calculée, avec l'amendement de A-5 signalé en AD-6 ; module `instance` toujours `EN_SERVICE` et hors intersection (AD-14) ; habillage et langue par `accueil` (AD-13) ; la santé ne ferme rien (AD-7) ; deux espaces à deux déploiements, jamais fusionnés (AD-12).

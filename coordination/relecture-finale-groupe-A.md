# Relecture finale du lot : tout ce qui a été fusionné depuis le 14/11 au soir

> **Date :** 2026-11-15 · **Par :** groupe A · **Cadre :** `PLAN-4-SESSIONS-2026-11-14.md` §3.4
> **Périmètre :** les PR fusionnées depuis l'ouverture du plan (PR #476, le 2026-11-14 à 22 h 18 UTC), relevées par
> l'API GitHub dans **16 dépôts**.
> **Verdict :** **aucun trou bloquant.**
> - Un trou de tracker est **corrigé dans cette PR** (S30).
> - Les recettes croisées sont **vertes à froid** sur des images reconstruites depuis `dev`.
> - Les demandes adressées à B et à D restent **ouvertes**, faute de session pour les prendre.

## B, C et D : rien de fusionné

| Groupe | Dépôts tenus | PR fusionnées depuis le 14/11 au soir | Journal |
|---|---|---|---|
| **B** | `prospera-platform-catalog-service`, `prospera-paiement-service`, `prospera-notification-service` (reçu de A), `prospera-auth-service` (reçu de A le 15/11) | **aucune** | « lot pas encore commencé » |
| **C** | `prospera-assurance-service`, `prospera-ocr-service` | **aucune** | « lot pas encore commencé » |
| **D** | `prospera-frontend-expert-comptable`, `frontend-admin-panel` | **aucune** | « lot pas encore commencé » |

Il n'y a donc rien à relire chez eux. La matrice des neuf états de B (STORY-936) n'existe pas encore, et la relecture
du contrat d'état publié (STORY-932) n'a pas été demandée.

⚠️ **Le lot de B sera fait par la session de A** (consigne de l'utilisateur du 2026-11-15, journal de A) : cette
relecture devra être **rejouée** à la fin de ce lot.

## A : chaque story, de la fiche aux tests

| Story | PR de code | PR de docs | Critères prouvés | Tracker |
|---|---|---|---|---|
| STORY-569 (14/11 au soir) | fiscal #39, notification #86 | #477 | oui (fiche) | `done` (S30) |
| STORY-901 | balance #143, dossier #47, fiscal #40, recette #16 | #475, #479, #482, #483 | AC-C4 par la recette Docker | `done` (plage 901) |
| Relecture §3.1 (299, 300, 365, 563) | fiscal #41 (README, migration 563) | #484 | migration jouée sur la pile | — |
| Restes §3.2 | — | #485 (ticket AP-38, procédure) | — | — |
| STORY-345 | fiscal #42 | #486 | mutation + conformité (4 écritures parallèles) | `done` (S28, 5/5) |
| STORY-902 | auth #37, puis fiscal #43 | #487 | 2 mutations + recette zone franche | `done` (plage 902) |
| STORY-903 | admin-panel #33 | #488 | 2 mutations + Docker, catalogue arrêté, 20/20 | `done` (plage 903) |
| STORY-313 | fiscal #44 | #489 | 2 mutations, vraies sections TPU et RSH | `done` (S25) |
| STORY-314 | fiscal #45 | #490 | mutation + conformité + Docker | `done` (S25) |
| STORY-904 | fiscal #46 | #491 | 2 mutations + Docker (autonome ⇒ sortie 1) | `done` (plage 904) |
| FE-069 (passation) | branche `fe-069` poussée, **sans PR** | #480, #481 | remise à D | — |

**Chaque PR de code a sa PR de docs, et inversement.** La seule exception, `fe-069`, est voulue : la branche est remise
à D sans PR (journal de A, passation du 14/11).

**Chaque arbre fusionné est l'arbre testé.** Pour 902, 903, 313, 314 et 904, le hash d'arbre de `dev` après fusion est
égal à celui de la branche éprouvée.

## Le tracker dit vrai, sauf un trou corrigé ici

- **S25** : `completed_points` 18 = la somme de ses stories `done` (311, 312, 313, 314). Juste.
- **S28** : 5 = STORY-345. Juste.
- **S30** : ⚠️ `completed_points: 0` alors que ses stories `done` (563, 567, 568, 569) font **39 points**. Le trou date
  du 14/11 : les quatre stories ont été passées `done` sans toucher la tête du sprint. **Corrigé dans cette PR**
  (0 → 39, `in_progress`), somme refaite sur le fichier.
- **Plages 901 → 904** : réservées, `DONE` en note, plafond `story_id_high_water_mark` = STORY-904. Juste.

## Les piles démarrent, et la recette de l'Atelier tient

- **12 images reconstruites depuis `dev`** (pile `grp-a`), avec chaque dépôt vérifié sur `origin/dev` et propre.
  Deux ont été réalignés avant la construction : le catalogue (sur une vieille branche `MNV-174` de même contenu) et la
  notification (un commit de retard).
- **Recettes croisées, à froid** : `atelier-balance` (STORY-100) et `zone-franche` (STORY-901), **56/56**.
  - ⚠️ **Premier passage : 2 échecs**, à la remise de `balance.created` (« Référentiel non intègre, checksum invalide »,
    bilan-service). C'est le piège connu du poste : `core.autocrlf` ressort en CRLF les 72 JSON de `bilan-service`,
    et l'image embarque des octets dont l'empreinte ne correspond plus.
  - Ces fichiers ont été ré-extraits en LF et l'image reconstruite. **Second passage : 56/56.** Ce n'est pas une
    régression du code : une image construite sur un autre poste ne l'aurait pas.
- Les **gardes de démarrage** ont chacune été jouées sous Docker dans leur story : fiscal strict (902), garde du jeu de
  répliques (904), coupe-circuit du BFF (903).

## Ce qui reste en route

| Reste | Où il est écrit | Porteur |
|---|---|---|
| **Demande à B** : borne du jeton face aux verticales (regex à tiret, 5 codes de plus de 40 caractères, droits hors du jeton) | journal de A | **B**, c'est-à-dire la session de A au lot suivant |
| **Écart de 902** : la console affiche « sans rôle métier » pour un membre qui reçoit le rôle par défaut | fiche 902, journal de A | **B** (auth-service) |
| **Demande à D** : AP-38 (motif par pièce) et reprise de FE-069 | ticket, journal de A | **D**, aucune session |
| **Écart de 314** : le calendrier n'affiche ni `montantASaisir`, ni `refusCalcul`, ni `montantRetenu` | fiche 314 | **D** |
| **Seed du catalogue** : aucun paquet `fiscal-tg-*` n'est octroyable pour `declarations` (422). La recette le contourne | fiche 901, journal de A | **dernière story de la file** (consigne de l'utilisateur) |
| **Configuration de déploiement des invitations (569)** : `JETONS_DE_SERVICE`, `NOTIFICATION_*`, `ESPACE_DECLARANT_URL` | fiche 569 | mise en service |
| Migration 563, ordre de déploiement auth → fiscal, garde du jeu de répliques | README de fiscal-service, « Mise en service » | mise en service |
| Publication du paquet Togo 2026 au catalogue | journal de A, « Procédures » | mise en service |
| TPU et RSH absentes du catalogue d'obligations ; registre des tiers ; aiguillage de la TCA | fiche 313 | à slotter |
| Purge de la base de rémunération (durée non déclarée au paquet, LPF Art. 316) | fiche 345 | à slotter |
| Ancre externe de la tête de chaîne d'audit | journal de A, « Dette » | spine fiscale |
| Deux lectures à faire valider par un fiscaliste (gérant face à l'Art. 21, résidence principale) | fiche 568 | PO |

**Passations écrites :**
- `prospera-notification-service` → B (14/11, `8916ee4`) ;
- `prospera-auth-service` → B (15/11, `456035f`).

**Docker éteint** à la fin de la relecture.

# STORY-1001 : ouvrir — recevabilité, décision de garantie, pièces attendues et courrier de demande

Status: done

**Complexité :** grande (un port de lecture vers `assurance`, deux commandes du dossier, une liste de pièces par type,
un consommateur de `ged`, la fin des constats posés en base pour l'ouverture)

**Épic :** EPIC-206 (déclarer, ouvrir et attribuer)
**Dépôts :** `prospera-plateforme` (copie du contrat consommé), `prospera-assurance-service`, `prospera-sinistres-service`
**Plage :** groupe C, n° 12 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §4) ; dépend de 1000, 993, 994.

---

## Pourquoi

Ouvrir un dossier, c'est répondre à quatre questions sur les **contrats lus** (le contrat est-il valide ? la garantie
répond-elle ? la déclaration est-elle dans le délai ? que reste-t-il à écarter ?), enregistrer une **décision de
garantie** motivée (« garantie acquise » interdite tant qu'un blocage subsiste ; la machine ne refuse jamais seule),
et remettre à l'assuré la **liste exacte des pièces** de son type de sinistre. Jusqu'ici, les constats qui ouvrent le
circuit (`PIECES_COMPLETES`, `CONTRAT_VERIFIE`, `GARANTIE_ENGAGEABLE`) étaient posés en base par les preuves ; ils
doivent l'être par les commandes et par les pièces réellement contrôlées dans `ged`.

**Source** : PRD FR-41, FR-42, FR-44, FR-45, FR-46 (FR-48, FR-49 en partie) ; démo (`lib/recevabilite-hub.ts`,
`PIECES_OBLIGATOIRES`, `PIECES_COMPLEMENTAIRES`) ; spine AD-1, AD-2 (`assurance` sert la copie des contrats ; absent ⇒
`NON_INSTALLE`), AD-16 (`sinistres` consomme `ged.piece.controlee@1`) ; plan (« les constats sont posés par ces
commandes (fin des constats posés en base) ; le courrier est archivé en copie »).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **La recevabilité** (`assurance`, FR-41) : `GET /api/v1/assurance/recevabilite` (police, type de sinistre, survenance, déclaration) rend quatre résultats distincts avec raison et sources — contrat (`BLOQUANT` hors vigueur ou hors période), garantie (`BLOQUANT` hors branche ou non souscrite, distingués), délai (`RESERVE` au-delà du délai de la garantie, jamais une déchéance), exclusions/plafond/franchise (`RESERVE`) ; le sens (`RECEVABLE`, `A_EXAMINER`, `IRRECEVABLE`) ; la date de lecture et « à relire » ; police introuvable ⇒ `POLICE_NON_RETROUVEE`, jamais un refus | tests ; pile |
| AC-2 | **Le port de `sinistres`** : `POST …/dossiers/{id}/recevabilite` interroge `assurance` (jeton de l'agent transmis) ; le résultat est **ajouté** au dossier avec sa date (une relecture n'efface pas l'ancienne) ; constat `CONTRAT_VERIFIE` posé par la commande ; réserves `CONTRAT_VERIFIE`, `POLICE_NON_RETROUVEE` ; `assurance` absent ou injoignable ⇒ `NON_INSTALLE`, « à relire », le circuit continue | tests ; pile |
| AC-3 | **La décision de garantie** (FR-42) : `POST …/dossiers/{id}/garantie` — `GARANTIE_ACQUISE`, `SOUS_RESERVE` ou `REFUS_DE_GARANTIE`, motif ≥ 10 caractères (`MOTIF_ECRIT`) ; GEST, GREC, RESP, DT, DG (ACC, CPT, NUM : `DROIT_INSUFFISANT`) ; « acquise » avec un blocage ⇒ `GARANTIE_ACQUISE_AVEC_BLOCAGE` ; refus sur une déclaration tardive sans préjudice écrit ⇒ `PREJUDICE_NON_ETABLI` ; constat `GARANTIE_ENGAGEABLE` posé par la commande | tests ; pile |
| AC-4 | **Les pièces attendues** (FR-44, FR-45) : la liste du type de sinistre (paramètre `pieces-2026.1`, listes de la démo, `PV_EXPERTISE` jamais obligatoire), chaque pièce avec qui la fournit ; posée à la déclaration ; une pièce **validée au contrôle** dans `ged` (`ged.piece.controlee@1`) passe `RECUE` ; le constat `PIECES_COMPLETES` suit ; la vue nomme les pièces manquantes | tests ; pile (fait au contrat) |
| AC-5 | **Le courrier de demande de pièces** (FR-46) : rangé au dossier à l'ouverture en attente de pièces (modèle `DEMANDE_PIECES`, destinataire, liste, statut `BROUILLON`) | tests |

## Décisions retenues par défaut (contestables)

- **D-1001-1 — `assurance` calcule la recevabilité**, `sinistres` la lit (AD-2 : `assurance` tient la copie des
  contrats et la table type de sinistre → garanties ; aucun module ne lit la base d'un voisin). Le port HTTP
  transmet le jeton de l'agent (même organisation, mêmes droits) ; adresse `ASSURANCE_URL` ; absent ⇒ `NON_INSTALLE`.
- **D-1001-2 — Le résultat de recevabilité s'ajoute** au dossier (`recevabilites[]`, daté, avec `lueLe` et l'état de
  lecture) ; le dernier fait foi pour la décision de garantie.
- **D-1001-3 — Une pièce est « reçue » quand `ged` l'a validée au contrôle** (FR-165) ; reçue mais non contrôlée,
  elle reste attendue ; rejetée, elle reste attendue. Le type de pièce de `ged` est le code de la liste (même
  vocabulaire, `PieceType` de la démo).
- **D-1001-4 — Le délai de déclaration de la garantie** est le `delaiDeclarationJours` de la garantie lue, compté en
  jours calendaires, jamais sous le plancher légal (5 jours ouvrés, 48 heures pour le vol).
- **D-1001-5 — Différés** : la copie archivée du courrier dans `ged` et son envoi (EPIC-220) ; l'accusé de réception
  du dossier complet (son échéance de 10 jours court déjà, `ACCUSE_DOSSIER_COMPLET`) ; la provision d'ouverture posée
  automatiquement (la commande de STORY-994 la propose déjà) ; le fait `sinistres.garantie.decidee@1` (avec l'envoi au
  LC). Ces points restent des écarts nommés à la fin de la fiche.

- **D-1001-6 — Une pièce de santé validée satisfait la première pièce MÉDICALE attendue** : le fait
  `ged.piece.controlee` ne dit que `DOCUMENT_MEDICAL` (AD-8) ; le type exact (certificat initial ou final) viendra avec
  l'accès de santé du dossier.
- **D-1001-7 — `ged.piece.controlee` arrive par le consommateur déjà supervisé de `sinistres`** (celui des faits de
  `liaison-assureur` : topics créés avant l'abonnement, relance, état des consommateurs) ; un consommateur par
  producteur pourra venir plus tard.
- **D-1001-8 — La recevabilité se lit par les rôles du circuit du jeton** chez `assurance` (patron STORY-994 :
  `ACC`, `GEST`, `GREC`, `RESP`, `DT`, `DG`, `AUD`), pas par `TENANT_USER` ; côté `sinistres`, seul le gate du module
  (`…_NOT_ENTITLED`) ou une route absente vaut « non installé » ; tout autre refus est journalisé, « injoignable ».
  ⚠️ **Risque nommé** : le jeton transmis doit porter l'audience `assurance-service` ; en production, c'est l'IdP qui
  la donne (à vérifier à l'installation) ; sinon la recevabilité reste « injoignable », jamais un refus.
- **Routes (proposition)** : `GET /api/v1/assurance/recevabilite` (lecture seule, à porter aux `routesLectureSeule`
  du manifeste `assurance`), `POST /api/v1/sinistres/dossiers/{id}/recevabilite`, `POST …/{id}/garantie`.

## Ce qui a été livré

**2026-11-17** — fusionnées en « Rebase and merge » :

- `prospera-assurance-service` **#24** (`dev` `8d0c598`) : `src/modules/assurance/recevabilite/` — la recevabilité
  en quatre questions sur la copie des contrats (contrat, garantie : `HORS_BRANCHE` et `GARANTIE_NON_SOUSCRITE`
  distingués, délai jamais sous le plancher, à écarter), le sens, la date et l'état de lecture ; police absente :
  `POLICE_NON_RETROUVEE` ; lue par les rôles du circuit du jeton.
- `prospera-sinistres-service` **#12** (`dev` `a873dbc`) : `src/modules/sinistres/ouverture/` — le port de
  recevabilité (`ASSURANCE_URL`, jeton transmis), les commandes `recevabilite` et `garantie`, les pièces attendues
  (`pieces-2026.1`, listes de la démo), la réception par `ged.piece.controlee` (consommé), les courriers de demande ;
  les constats `CONTRAT_VERIFIE`, `GARANTIE_ENGAGEABLE` et `PIECES_COMPLETES` posés par ces commandes et ces faits.
- Avant elles, `prospera-sinistres-service` **#11** : les codes de type de sinistre de STORY-1000 alignés sur la démo
  et la table d'`assurance` (`MRH`, `ACCIDENT_TRAVAIL` ; un accident du travail déclaré avec le code de la démo était
  refusé et son urgence ne se posait pas).
- **Node 24** : `assurance` 2 323 unitaires, 363 e2e ; `sinistres` 857 unitaires sur vrai MongoDB (4 de 1001 sur
  chacun des deux bancs), 19 e2e.
- **Pile `grp-c-1001`** (`sinistres` + `assurance`, la copie des contrats injectée au contrat) : A (police en vigueur)
  `A_EXAMINER`, `CONTRAT_VALIDE`, garantie applicable, `CONTRAT_VERIFIE` posé ; B (suspendue) `IRRECEVABLE`, réserve
  `CONTRAT_VERIFIE` ; C (inconnue) `POLICE_NON_RETROUVEE`, toujours `DECLARE` ; B « acquise » → 409
  `GARANTIE_ACQUISE_AVEC_BLOCAGE`, « sous réserve » → `GARANTIE_ENGAGEABLE` ; A ouvert sans pièces → 409
  `PIECES_COMPLETES` (les 6 manquantes nommées), en attente de pièces → un courrier ; les 6 pièces validées dans `ged`
  (faits au contrat) → `PIECES_COMPLETES`, reprise → `OUVERT` ; piste intègre ; **aucun constat posé en base** ;
  0 erreur aux journaux.
- **Ce que la préparation a montré** : la route d'`assurance` exigeait `TENANT_USER` (un agent du circuit aurait été
  refusé, et le port aurait conclu « non installé ») ; corrigé : rôles du circuit du jeton, et seul le gate du module
  vaut « non installé ».
- **Rejouée sur les images reconstruites depuis `dev`** (`sinistres` `a873dbc`, `assurance` `8d0c598`, pile `grp-c-1001d`) : même scénario, même issue ; aucun constat posé en base ; 0 erreur aux journaux.

**Reste** (D-1001-5) : la copie archivée du courrier dans `ged` et son envoi (EPIC-220) ; l'accusé de réception du
dossier complet ; la provision d'ouverture posée automatiquement ; le fait `sinistres.garantie.decidee@1` (avec
l'envoi au LC) ; le type exact d'une pièce de santé (accès de santé du dossier) ; l'audience `assurance-service` du
jeton à vérifier à l'installation (D-1001-8).

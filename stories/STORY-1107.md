# STORY-1107 : Le suivi banque par banque — remise, compléments, comité, réponse, offres comparées, choix du client

Status: ready-for-dev — **créée le 2026-11-21** à la demande de l'utilisateur, après validation de la maquette de FE-140
(PR #741). Non slottée : à placer au prochain plan.

**Service :** `prospera-bilan-service`, module `financement` · **Points :** 8
**Dépend de :** STORY-1105 (les banques et leur identifiant), STORY-1086 amendée (le dossier figé de chaque banque), STORY-1083
et 1084 (livrées). Le coût d'une offre réutilise l'échéancier de STORY-1084.
**Débloque :** STORY-1108 (conditions et décaissement), FE-155.
**Écran :** FE-155 (étape 7 « Le suivi »).
**Suite :** STORY-1108.

---

## Pourquoi

STORY-1083 suit **un seul parcours** pour toute la demande : `PRET` → `REMIS` → `ACCORDE` ou `REFUSE`. Dans la vraie vie, chaque
banque a son rythme : remise à son chargé d'affaires, compléments demandés, passage en comité, puis réponse — accord, refus ou
**contre-proposition**. Le client reçoit parfois deux offres différentes (montant, taux, durée, frais, assurance) : le cabinet
doit les **comparer sur le coût total** et le client **choisit**. Les autres banques passent « non retenues ».

## Ce qui est attendu

1. **Un suivi par banque**, avec sa propre machine à états.
2. **La remise** (date, interlocuteur), les **compléments** demandés puis fournis, le **passage en comité**.
3. **La réponse** : accord, refus (motif) ou contre-proposition, avec **l'offre détaillée**.
4. **La comparaison** des offres : coût total de chacune et coût pour 1 000 000 empruntés.
5. **Le choix du client**, qui range les autres banques en « non retenue ».
6. **Le dossier global suit** : il passe `REMIS`, `ACCORDE` ou `REFUSE` tout seul, selon les banques.

## La machine à états (refonte de FR-1, amendée le 21/11)

**Par banque** (`suivi[banqueId].etat`) :

| De | Vers | Geste | Droit |
|---|---|---|---|
| `A_REMETTRE` | `REMIS` | remettre (date, interlocuteur) | valider |
| `REMIS` | `COMPLEMENTS_DEMANDES` | noter un complément demandé | valider |
| `COMPLEMENTS_DEMANDES` | `REMIS` | tous les compléments fournis | préparer |
| `REMIS` | `EN_COMITE` | noter le passage en comité (date) | valider |
| `REMIS`, `EN_COMITE` | `ACCORD`, `REFUS`, `CONTRE_PROPOSITION` | noter la réponse | valider |
| `CONTRE_PROPOSITION` | `ACCORD` | accepter (la contre-proposition devient l'offre) | valider |
| `CONTRE_PROPOSITION` | `DECLINEE` | décliner (motif) | valider |
| `ACCORD` | `OFFRE_RETENUE` | le client choisit cette offre | valider |
| toute banque non finale, hors celle choisie | `NON_RETENUE` | effet du choix | — |
| `OFFRE_RETENUE` | `DECAISSE` | décaissement (STORY-1108) | valider |

États finaux : `REFUS`, `DECLINEE`, `NON_RETENUE`, `DECAISSE`. Toute autre transition : 409 `ETAT_BANQUE_INTERDIT`
(`details: { depuis, vers }`).

**Pour le dossier global** (états de 1083 conservés, un état de plus) : `BROUILLON`, `PRET`, `REMIS`, `ACCORDE`, `REFUSE`,
`ABANDONNE` et **`DECAISSE`** (final, STORY-1108).
- `PRET` → `REMIS` : **effet** de la première remise à une banque (`dateRemise` = la plus ancienne remise).
- `REMIS` → `ACCORDE` : **effet** du choix du client (`accord` = montant, taux, durée de l'offre choisie, forme de 1083).
- `REMIS` → `REFUSE` : **effet** quand toutes les banques sont dans `REFUS` ou `DECLINEE` (motif : « Toutes les banques ont
  refusé »).
- `BROUILLON` → `PRET`, `PRET` → `BROUILLON` et → `ABANDONNE` restent des gestes manuels (valider).
- Les transitions manuelles vers `REMIS`, `ACCORDE` et `REFUSE` répondent désormais 409 `TRANSITION_PAR_BANQUE` : on passe par
  le suivi de chaque banque.
- Annuler le choix (D-1107-7) ramène `ACCORDE` → `REMIS` : transition interne, pas un geste de la route `transitions`.

## Décisions retenues par défaut (contestables)

- **D-1107-1 — Le suivi est rangé dans le contenu de la version du dossier** (archivé avec elle). La correction d'un dossier
  `REMIS` (`POST …/versions`, 1083) archive la version n avec son suivi ; la version n+1 reprend les banques et **repart d'un suivi
  vide** (`A_REMETTRE`), puisque le contenu corrigé n'a pas encore été remis.
- **D-1107-2 — La remise** exige : le dossier `PRET`, une **version figée non périmée** pour cette banque (STORY-1086 amendée :
  sinon 409 `VERSION_FIGEE_ABSENTE` ou `VERSION_FIGEE_PERIMEE`), aucun pro forma expiré (409 `PROFORMA_EXPIRE`, STORY-1104). Corps :
  `dateRemise` (pas dans le futur, sinon 422 `DATE_INCOHERENTE`), `interlocuteur: { nom (2 à 120), fonction (0 à 120) }`.
  Référence : BOA Togo, remis le 16/02/2026 à Mme Ama Dogbé, chargée d'affaires PME ; Orabank Togo, remis le 16/02/2026 à
  M. Kodjo Agbeko, chargé d'affaires PME.
- **D-1107-3 — Les compléments** : `{ id, demandeLe, objet (3 à 500), fournisLe, fournisPar }`. Référence : BOA Togo, demandés le
  23/02/2026 : « relevés bancaires des 12 derniers mois », fournis le 26/02/2026. Fournir un complément = noter la date ; les
  pièces elles-mêmes se téléversent par le contrat de STORY-1104 (cible `PIECE_EXIGENCE`). Passage en comité : `dateComite`
  (03/03/2026 pour BOA Togo).
- **D-1107-4 — La réponse et l'offre.** `reponse: { type, date, motif }` ; `offre` (obligatoire pour `ACCORD` et
  `CONTRE_PROPOSITION`) :
  `{ montant (entier FCFA), tauxAnnuelPct (0 à 100, quatre décimales), dureeMois, differeMois, fraisDossier (entier FCFA, 0 par
  défaut), assurance: { description, tauxAnnuelPct, montantTotal }, garantiesExigees[] (textes, 20 au plus),
  conditionsPrealables[] (STORY-1108) }`.
  - `mensualite` est **calculée** par l'échéancier de STORY-1084 (échéances constantes, mensuel, début = date d'acquisition du
    projet), jamais saisie. Référence : 22 000 000 à 11,5 %, 48 mois ⇒ **573 958** ; 20 000 000 à 12 %, 36 mois ⇒ **664 286**.
  - `assurance.montantTotal` : saisi s'il est connu ; sinon **estimé** = montant × `assurance.tauxAnnuelPct` ÷ 100 × durée en
    années, taux par défaut **0,30 %** par an (valeur de démonstration, paramètre du référentiel AP-50, à confirmer). Référence :
    22 000 000 sur 4 ans ⇒ 264 000 ; 20 000 000 sur 3 ans ⇒ 180 000 (`estime: true` tant qu'elle n'est pas saisie).
  - `REFUS` exige un `motif` de 10 à 500 caractères (référence : « capacité de remboursement jugée insuffisante au regard des dettes
    en cours », BOA Togo, 12/03/2026). `ACCORD` et `CONTRE_PROPOSITION` sans offre complète : 422 `OFFRE_INCOMPLETE`
    (`details.champs`).
  - La lettre de la banque se téléverse (cible `REPONSE_BANQUE`, contrat de STORY-1104 : upload réel et « Voir »).
- **D-1107-5 — La comparaison** (`GET /suivi/comparatif`) : pour chaque banque en `ACCORD`, `CONTRE_PROPOSITION` ou `OFFRE_RETENUE` :
  - `totalInterets` : somme des intérêts de l'échéancier de l'offre ;
  - `coutTotal` = `totalInterets` + `fraisDossier` + `assurance.montantTotal` ;
  - `coutPourUnMillion` = `coutTotal` × 1 000 000 ÷ `montant`, arrondi au franc (demi vers le haut) ;
  - `resteAFinancer` = montant demandé du dossier − `offre.montant` ;
  - `laMoinsChere` : la banque au plus petit `coutPourUnMillion` (le coût pour 1 000 000 compare ce qui n'a pas le même montant).

  **Valeurs de référence (maquette)** :

  | | Orabank Togo (accord) | BOA Togo (contre-proposition) |
  |---|---:|---:|
  | Montant | 22 000 000 | 20 000 000 |
  | Taux annuel / durée | 11,5 % / 48 mois | 12,0 % / 36 mois |
  | Mensualité | 573 958 | 664 286 |
  | Total des intérêts | 5 549 992 | 3 914 306 |
  | Frais de dossier | 220 000 | 300 000 |
  | Assurance estimée (0,30 %/an) | 264 000 | 180 000 |
  | **Coût total du crédit** | **6 033 992** | **4 394 306** |
  | Coût pour 1 000 000 | 274 272 | **219 715** (la moins chère) |
  | Reste à financer | 3 000 000 | 5 000 000 |

  (la maquette met en avant « la moins chère » ; elle ne choisit pas : le choix est celui du client.)
- **D-1107-6 — Le choix du client** (`POST /suivi/choix { banqueId }`, valider) : la banque doit être en `ACCORD`
  (409 `AUCUNE_OFFRE_A_CHOISIR` sinon) ; un seul choix à la fois (409 `CHOIX_DEJA_FAIT`). Effets, **en une écriture
  conditionnelle** (D-1083-11) : la banque passe `OFFRE_RETENUE` ; toute autre banque non finale passe `NON_RETENUE` (en gardant
  son état d'avant, `etatAvantNonRetenue`) ; le dossier passe `ACCORDE` avec l'`accord` de l'offre choisie. Référence : Orabank
  Togo retenue ; BOA Togo et Ecobank Togo « non retenues » (« le client a choisi une autre offre »).
- **D-1107-7 — Annuler le choix** (`DELETE /suivi/choix`, valider, motif de 10 à 500) : permis tant qu'**aucune condition
  préalable n'est levée** et que rien n'est décaissé (STORY-1108) ; sinon 409 `CHOIX_VERROUILLE`. Les banques `NON_RETENUE`
  retrouvent `etatAvantNonRetenue`, le dossier repasse `REMIS`.
- **D-1107-8 — Les routes** (sous `/api/v1/dossiers/{dossierId}/financements/{financementId}`, mêmes gardes et portée que 1083) :

  | Route | Droit | Effet |
  |---|---|---|
  | `GET /suivi` | consulter | le suivi de chaque banque, état, dates, offre, prochain geste permis |
  | `GET /suivi/comparatif` | consulter | D-1107-5 |
  | `POST /suivi/{banqueId}/remise` | valider | remet |
  | `POST /suivi/{banqueId}/complements` | valider | note un complément demandé (201) |
  | `POST /suivi/{banqueId}/complements/{complementId}/fourni` | préparer | note la date de fourniture |
  | `POST /suivi/{banqueId}/comite` | valider | note le passage en comité |
  | `POST /suivi/{banqueId}/reponse` | valider | note la réponse et son offre |
  | `POST /suivi/{banqueId}/contre-proposition/accepter` | valider | accepte |
  | `POST /suivi/{banqueId}/contre-proposition/decliner` | valider | décline, avec `motif` |
  | `POST /suivi/choix` · `DELETE /suivi/choix` | valider | D-1107-6, D-1107-7 |

  L'écriture se fait dans les états `PRET`, `REMIS` et `ACCORDE` (le suivi commence après le figement) ; un dossier `BROUILLON`
  répond 409 `DOSSIER_NON_PRET`, un dossier `ABANDONNE`, `REFUSE` ou `DECAISSE` 409 `DOSSIER_NON_MODIFIABLE_SUIVI`.
- **D-1107-9 — Refus** : 404 `SUIVI_BANQUE_INTROUVABLE`, `COMPLEMENT_INTROUVABLE` ; 409 `ETAT_BANQUE_INTERDIT`, `DOSSIER_NON_PRET`,
  `VERSION_FIGEE_ABSENTE`, `VERSION_FIGEE_PERIMEE`, `PROFORMA_EXPIRE`, `AUCUNE_OFFRE_A_CHOISIR`, `CHOIX_DEJA_FAIT`,
  `CHOIX_VERROUILLE`, `TRANSITION_PAR_BANQUE`, `CONFLIT_CONCURRENT` ; 422 `OFFRE_INCOMPLETE`, `DATE_INCOHERENTE` (une date antérieure à
  l'étape qui la précède : réponse avant remise, comité avant remise), `MOTIF_REQUIS`.
- **D-1107-10 — Migration et compatibilité de 1083.** Aucun dossier `REMIS`, `ACCORDE` ni `REFUSE` n'existe hors des jeux d'essai
  (D-1083-9 : ces états n'étaient pas atteignables) ; les dossiers `PRET` reçoivent un suivi `A_REMETTRE` par banque (migration
  idempotente, comme D-1105-6). `ETATS_FINANCEMENT` gagne `DECAISSE` (ajout à l'énumération OpenAPI ; la table 6 × 6 de 1083
  devient 7 × 7, éprouvée couple par couple). Les champs `dateRemise` et `accord` du dossier restent, **dérivés** du suivi. Les
  versions archivées gardent leur forme.
- **D-1107-11 — Piste d'audit** : un type neuf d'`AuditType`, `FINANCEMENT_SUIVI_BANQUE` (`banque`, `geste`, `depuis`, `vers`,
  `motif`), lu par `GET /dossiers/{id}/bilan/audit` ; les changements d'état du dossier gardent `FINANCEMENT_ETAT_CHANGE` avec
  `effetDeBanque: true`. Le manifeste M49 passe en 0.3.0 (`GET /suivi`, `GET /suivi/comparatif` en lecture seule).

## Critères d'acceptation

- **AC-1** : chaque ligne de la machine par banque est éprouvée (permise et interdite) ; la table du dossier 7 × 7 aussi ; mutation
  sur la garde de chaque effet (première remise, choix, refus général).
- **AC-2** : les valeurs de référence de D-1107-5 sont reproduites au franc (mensualités 573 958 et 664 286, intérêts 5 549 992
  et 3 914 306, coûts totaux 6 033 992 et 4 394 306, coûts pour 1 000 000 274 272 et 219 715), écrites en dur dans le test.
- **AC-3** : un choix range les autres banques en `NON_RETENUE` et ouvre `ACCORDE` en **une seule écriture** ; deux choix
  simultanés : un seul passe (`CONFLIT_CONCURRENT`) ; annuler le choix restitue les états d'avant.
- **AC-4** : la première remise fait passer le dossier `REMIS` ; aucune transition manuelle vers `REMIS`, `ACCORDE`, `REFUSE` n'est
  acceptée ; toutes les banques refusées font passer le dossier `REFUSE`.
- **AC-5** : sans version figée à jour de la banque, ou avec un pro forma expiré, la remise est refusée avec le code nommé.
- **AC-6 (upload et voir)** : la lettre de réponse d'une banque se téléverse (cible `REPONSE_BANQUE`, contrat D-1104-9), se **voit**
  en aperçu dans l'application, se télécharge.
- **AC-7** : la migration est rejouable ; les versions archivées se relisent telles qu'elles étaient ; droits (remettre, répondre,
  choisir = valider ; fournir un complément = préparer) et portée comme 1083 ; contrat publié, typé dans l'OpenAPI, annoncé dans
  « ⚠ Contrats » avant le code.

## Hors périmètre

- Les conditions préalables et le décaissement (STORY-1108).
- La transmission à la banque par Prospera : jamais (D-SC-2) ; le cabinet remet le dossier lui-même.
- Le rappel automatique d'une banque qui ne répond pas, la relance du client : à nommer plus tard.
- Le moteur de négociation (contre-contre-proposition) : une contre-proposition s'accepte ou se décline.

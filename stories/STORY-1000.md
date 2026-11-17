# STORY-1000 : déclarer — canaux, saisie commune, doublon, réserves, urgence corporelle (module `sinistres`)

Status: done

**Complexité :** grande (le formulaire de déclaration, le formulaire papier de secours, le contrôle de doublon dans
Prospera et dans le logiciel de la compagnie, les réserves qui ne bloquent jamais, l'urgence corporelle)

**Épic :** EPIC-206 (déclarer, ouvrir et attribuer)
**Dépôts :** `prospera-plateforme` (dossiers de C), `prospera-liaison-assureur-service`, `prospera-sinistres-service`
**Plage :** groupe C, n° 11 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §4) ; dépend de 992 et 995.

---

## Pourquoi

Une déclaration arrive au guichet, au téléphone, par WhatsApp ou e-mail, par un courtier, ou sur un formulaire papier
de secours quand le système est indisponible : elles aboutissent au **même formulaire**. La compagnie veut que la
déclaration **s'enregistre toujours** (le mémoire de 2014 relève des saisies faites 3 à 4 jours après la réception) :
police inconnue, garantie absente, retard, doublon donnent une **réserve**, jamais un refus. Un doublon probable — dans
Prospera ou dans le logiciel de la compagnie — est montré à l'agent, qui choisit en connaissance de cause. Un accident
corporel grave ou mortel monte en tête des files.

**Source** : PRD FR-34, FR-36, FR-38, FR-39, FR-40, FR-43 (et FR-46 pour la liste des pièces de l'accusé) ; annexe C
(C-9 sinistre existant) ; spine AD-4, AD-6, AD-16, AD-23, AD-27 ; plan (« une déclaration s'enregistre toujours ; un
doublon (Prospera ou LC) est signalé ; une déclaration tardive donne une réserve, jamais une déchéance »).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Le formulaire commun** (FR-34) : `POST /api/v1/sinistres/dossiers` reçoit police, assuré, victime, téléphone, type de sinistre, date et heure de survenance, lieu, circonstances, tiers, estimation (facultative), **canal** obligatoire (`GUICHET`, `TELEPHONE`, `WHATSAPP`, `EMAIL`, `COURTIER`, `COURRIER`) ; un courtier porte son identifiant ; la déclaration est rangée au dossier, **jamais dans un fait** | tests ; pile |
| AC-2 | **Le formulaire papier de secours** : un numéro unique par organisation (`FORMULAIRE_SECOURS_DEJA_SAISI` au second) ; deux dates (réception réelle, saisie) ; un écart de plus d'1 jour ouvré donne l'alerte `SAISIE_TARDIVE` au RESP | tests ; vrai MongoDB |
| AC-3 | **Le doublon** (FR-38) : même police, même date de survenance, même immatriculation, même victime, parmi les dossiers de Prospera **et** les sinistres reçus du LC ; sans choix de l'agent ⇒ 409 `DOUBLON_PROBABLE` avec les dossiers trouvés ; « nouvelle » avec motif ⇒ créée, réserve `DOUBLON_SIGNALE` ; sans motif ⇒ `MOTIF_ECRIT` ; « rattacher » ⇒ aucune création, la déclaration est tracée au dossier existant | tests ; pile (sinistre du LC fictif) |
| AC-4 | **Toujours enregistrée** (FR-39, FR-43) : la déclaration tardive (au-delà du délai du type de sinistre, planchers légaux : 5 jours ouvrés, 48 h pour le vol) donne la réserve `DECLARATION_TARDIVE` avec le motif du retard ; aucun contrôle ne refuse ni ne change le statut `DECLARE` | tests ; pile |
| AC-5 | **L'urgence corporelle et la responsabilité initiale** (FR-40) : accident corporel automobile ou accident du travail `GRAVE` ou `MORTELLE` ⇒ « urgence corporelle », en tête des files ; tiers saisi ⇒ `INDETERMINEE`, sinon `ASSURE_FAUTIF` ; ni l'une ni l'autre ne ferme une transition | tests ; pile |
| AC-6 | **L'accusé de déclaration** (FR-36) : rendu à l'enregistrement (référence `DEC-`, canal, date et heure, résumé, pièces à fournir, contact) ; son émission journalisée au dossier | tests |

## Décisions retenues par défaut (contestables)

- **D-1000-1 — La déclaration est une donnée du dossier**, rangée dans `sinistres_dossiers` (sous-document
  `declaration`), lue par les rôles du circuit ; elle ne part dans aucun fait (AD-16, AD-23 : nom de la victime,
  téléphone, immatriculation sont des données personnelles).
- **D-1000-2 — Le doublon se compare par une empreinte à clé** : HMAC-SHA256, clé de l'instance
  (`SINISTRES_CLE_DOUBLON`, la même dans `liaison-assureur`), de `police|jour de survenance|immatriculation|victime`
  normalisés (majuscules, sans espaces ni accents). `liaison-assureur` la calcule sur chaque sinistre existant reçu du
  LC (C-9) et la publie dans `liaison-assureur.sinistre-existant.recu@1` (champ facultatif nouveau,
  `empreinteDeDoublon`) ; `sinistres` la consomme et la calcule pour ses propres déclarations. La donnée personnelle
  ne voyage pas ; hors de l'instance, l'empreinte ne se renverse pas sans la clé. Clé absente ⇒ contrôle du LC éteint
  (signalé), celui de Prospera aussi.
- **D-1000-3 — Le choix de l'agent** se donne dans la même commande (`doublon: { choix: 'NOUVELLE', motif }` ou
  `{ choix: 'RATTACHER', dossierId }`) ; rattacher n'écrit qu'une ligne d'audit `DECLARATION_RATTACHEE` sur le dossier
  existant (la fusion de deux dossiers, réservée au RESP, viendra plus tard).
- **D-1000-4 — Le délai de déclaration** est un paramètre par type de sinistre (`declaration-2026.1` : 5 jours ouvrés,
  vol 48 heures ; aucune valeur sous le plancher, refusée au chargement) ; le délai de la **garantie** lu dans la
  projection des contrats viendra avec la recevabilité (STORY-1001), comme la réserve « police non retrouvée ».
- **D-1000-5 — Pas d'envoi ici** : l'accusé est rendu dans la réponse et son émission journalisée ; l'envoi par
  `notification` et la copie archivée dans `ged` viennent avec STORY-1001 et EPIC-220. Un courtier inconnu n'est pas
  vérifié (aucune copie des intermédiaires dans `sinistres`) : son identifiant est gardé.

- **D-1000-6 — Le formulaire reste facultatif dans cette version** de `POST /api/v1/sinistres/dossiers` : les
  déclarations des stories précédentes (et leurs tests, leurs recettes) le créent sans lui ; l'écran l'envoie
  toujours, et dès qu'il est présent le canal et le type de sinistre sont exigés (`DECLARATION_INCOMPLETE`). Le rendre
  obligatoire est une ligne, à faire quand l'écran de déclaration existera.
- **D-1000-7 — L'urgence corporelle trie les files de travail** (avant l'échéance la plus proche), sauf les files du
  silence (STORY-999), triées par la dernière action ; la notification au RESP et au GEST corporel passera par
  `notification` (EPIC-220).

## Ce qui a été livré

**2026-11-17** — fusionnées en « Rebase and merge » :

- `prospera-plateforme` **#20** (`dev` `dba6ce0`) : `liaison-assureur.sinistre-existant.recu` reçoit le champ
  facultatif `empreinteDeDoublon`, classé.
- `prospera-liaison-assureur-service` **#6** (`dev` `30c6364`) : l'empreinte HMAC calculée sur chaque sinistre
  existant reçu du LC (C-9), sous `LIAISON_CLE_DOUBLON` ; ni la victime ni l'immatriculation ne partent.
- `prospera-sinistres-service` **#10** (`dev` `85206fc`) : `src/modules/sinistres/declaration/` (formulaire commun,
  paramètres `declaration-2026.1` avec les planchers légaux contrôlés au chargement, réserves, urgence, responsabilité
  initiale, accusé) ; `ControleDeDoublon` (clé `SINISTRES_CLE_DOUBLON`, copie `sinistres_sinistres_du_lc` alimentée
  par le consommateur de `liaison-assureur`) ; `creer` étendu (formulaire de secours unique par index, doublon
  montré avant l'enregistrement, nouvelle avec motif ou rattachée) ; l'urgence trie les files.
- **Node 24** : `sinistres` 842 unitaires sur vrai MongoDB (6 de 1000 sur chacun des deux bancs) et 19 e2e ;
  `liaison-assureur` 468 unitaires et 21 e2e ; le vecteur d'empreinte commun donne la même valeur dans les deux.
- **Pile `grp-c-1000`** : sans canal 400 ; au guichet `DEC-2026-00001`, accusé, `ASSURE_FAUTIF` ; la même par
  WhatsApp (police et victime écrites autrement) → 409 `DOUBLON_PROBABLE` avec le dossier ; nouvelle sans motif 400
  `MOTIF_ECRIT`, avec motif → réserve `DOUBLON_SIGNALE` ; rattachée → le même dossier, ligne
  `DECLARATION_RATTACHEE` ; **un sinistre déjà connu du LC** (fait au contrat injecté, empreinte sous la même clé) →
  409 avec `LCF-2026-000077` ; formulaire de secours reçu il y a 5 jours → `SAISIE_TARDIVE`, ressaisi 409, **deux
  saisies concurrentes → 201 et 409** ; déclarée 12 jours après → `DECLARATION_TARDIVE` (statut `DECLARE`) ;
  corporel grave avec tiers → urgence, `INDETERMINEE`, en première ligne du guichet ; 0 erreur aux journaux.
- **Rejouée sur l'image reconstruite depuis `dev`** (`85206fc`, pile `grp-c-1000d`) : même scénario, même issue ; **0 donnée personnelle dans les faits** de l'outbox (victime, immatriculation, téléphone, police) ; 0 erreur aux journaux.

**Reste** : la recevabilité sur les contrats lus et la réserve « police non retrouvée », la liste des pièces de
l'accusé, son envoi et sa copie archivée (STORY-1001) ; la fusion de deux dossiers (RESP) ; la notification de
l'urgence (EPIC-220) ; rendre le formulaire obligatoire quand l'écran existera (D-1000-6) ; la clé de doublon à
fournir à l'installation (sans défaut).

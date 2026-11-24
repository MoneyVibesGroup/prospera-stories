# STORY-1100 : Les archives du client apprennent la façon de classer du cabinet — et reçoivent les factures comptabilisées

Status: in-progress — **créée le 2026-11-18** à la demande de l'utilisateur (« côté archive, c'est important aussi
d'avoir cela »). **Prise le 2026-11-24** par la session du groupe C (lot 6), après STORY-1087 et 1088 (livrées) ;
contrat annoncé ci-dessous avant le code.

**Service :** `document-service` (module `ged`) · **Points :** 5
**Dépend de :** STORY-1087 (la GED s'ouvre au cabinet), STORY-1088 (retrouver une pièce), STORY-1097 (factures en
écritures) · **Écran :** FE-151

---

## Contrat annoncé avant le code (2026-11-24)

**Ajouts seuls**, dans deux dépôts tenus par C : `prospera-comptabilite-service` (il publie) et `document-service`
(module `ged`, il consomme et retient). Tout reste sous l'organisation du cabinet.

### 1. La mémoire de classement (points 1, 2, 4, 5 ; AC-1, AC-2, AC-5)

- **Clé** : le cabinet, puis l'**émetteur** : son NIF s'il est indexé (champ facultatif neuf `indexation.nifTiers`),
  sinon le tiers indexé, normalisé (sans accents, casse, ponctuation ni espace). Deux étages : le **fonds** du client,
  puis le **cabinet**.
- **Ce qui est retenu**, au **contrôle humain accepté** d'une pièce du cabinet (`CONTROLEE` : l'indexation est alors
  validée) : la nature, le tiers, la durée de conservation si elle a été changée, la **cote habituelle** (la boîte de
  l'original, si la pièce en a un), avec la pièce, l'auteur et la date. Le dernier choix remplace l'ancien.
- **Suggérer** : `GET /api/v1/ged/cabinet/pieces/{pieceId}/suggestion` (`ged:piece:indexer`) → `{ suggestion: { nature,
  tiers, nifTiers?, conservationAns?, boiteId?, cote?, source: { origine: MEMOIRE_FONDS | MEMOIRE_CABINET, memoireId,
  pieceRef, choisiLe, choisiPar } } | null }`. L'émetteur d'une pièce **pas encore indexée** est reconnu quand le NIF
  ou le nom d'une mémoire du cabinet se lit dans son **texte lu** (jamais pour une nature sensible, dont le texte n'est
  pas lu) ; une pièce déjà indexée prend son tiers. Une nature qui n'est plus au plan servi n'est jamais reproposée.
  Rien n'est appliqué sans geste.
- **Consulter et oublier** : `GET …/fonds/{numero}/memoire-de-classement` (`ged:piece:consulter`) ;
  `GET /api/v1/ged/cabinet/memoire-de-classement` et `DELETE …/memoire-de-classement/{memoireId}` (`ged:fonds:gerer`) ;
  chaque oubli est un acte `MEMOIRE_OUBLIEE` en ajout seul. Refus : 404 `MEMOIRE_INTROUVABLE`.
- **Natures sensibles** : la mémoire ne retient que la nature et le classement, jamais le texte lu (rien d'autre ne
  l'est, de toute façon).

### 2. Les factures comptabilisées rejoignent les archives (point 3 ; AC-3)

- **`prospera-comptabilite-service` publie** `comptabilite.facture.inscrite` (v1, par son outbox, schéma JSON
  `contrat/schemas/comptabilite.facture.inscrite.v1.json`, enregistré au registre de schémas) à chaque facture
  **inscrite au brouillard** (STORY-1097) : `{ eventId, schemaVersion: 1, organisationId, dossierId, exerciceId,
  exercice: { debut, fin }, ecritureId, numeroProvisoire, lotId, pieceId, sens: ACHAT | VENTE, avoir, dateEcriture,
  numeroFacture?, tiers?: { nom, nif? }, montantTTC, devise, inscriteLe, inscritePar }`. Aucun montant d'une ligne
  libre, aucun texte lu. Manifeste `comptabilite` **0.5.0** (`publie` + le topic).
- **`document-service` consomme** ce fait (copie du schéma dans `contrat/consommes/`, empreinte épinglée ; client Kafka
  de Confluent : `createTopics` avant `subscribe`, `metadataMaxAge: 10000`) et range la facture dans le **fonds du
  client** : le fonds du dossier dont la période couvre la date de l'écriture, sinon le plus récent du dossier. La pièce
  de la GED est une **copie** de la pièce déjà déposée (son `pieceId`, son empreinte), chiffrée comme toute pièce du
  cabinet, **pré-indexée** depuis l'écriture (nature facture d'achat, de vente ou avoir ; exercice ; date ; tiers ;
  montant ; référence = numéro de facture), avec `origine: { systeme: "comptabilite", id: ecritureId, empreinte }`. Le
  contrôle humain reste exigé avant le versement. **Sans fonds ouvert**, la facture attend (`ged_factures_a_ranger`) et
  se range à l'ouverture du premier fonds du dossier. Un rejeu ne range jamais deux fois (unique sur l'écriture).
- Manifeste `ged` **1.3.0** (`consomme` + routes de lecture neuves).

### Décisions prises au contrat (contestables)

- **D-1100-1** : la mémoire apprend au contrôle humain accepté, pas à la simple indexation : c'est l'indexation validée.
- **D-1100-2** : l'émetteur d'une pièce pas encore indexée se reconnaît dans son texte lu ; la GED ne lit pas de NIF
  structuré (son OCR rend du texte), la comptabilité si (ses factures arrivent avec leur tiers).
- **D-1100-3** : la GED ne connaît que l'inscription d'une facture : un brouillard abandonné ensuite laisse la copie au
  fonds (l'original reste un justificatif), avec son lien vers l'écriture ; un fait de désinscription est nommé pour
  plus tard.
- **D-1100-4** : le fait de la comptabilité vit dans son propre dépôt (`contrat/schemas/`), copié par la GED : le patron
  des deux dépôts aujourd'hui, sans passer par `prospera-plateforme` (tenu par B).

## Pourquoi

L'archiviste d'un cabinet indexe chaque pièce versée au fonds d'un client : nature, exercice, tiers, date, montant,
référence (STORY-1087, AC-3). Il refait chaque mois le même classement pour les mêmes émetteurs : les factures de la
CEET, les relevés de la banque, les avis d'imposition. Comme pour les écritures (STORY-1098), le cabinet veut que son
**propre** classement lui soit **suggéré et pré-rempli**, modifiable, et **jamais montré à un autre cabinet**.

## Ce qui est attendu

1. **Retenir chaque indexation validée**, pour une clé :
   - la clé : le **cabinet** (toujours), puis l'émetteur de la pièce (NIF lu, sinon nom normalisé), puis le type de
     pièce lu (facture, relevé, avis…) ;
   - ce qui est retenu : la nature du plan de classement (y compris les natures ajoutées par le cabinet), le tiers, la
     durée de conservation si elle a été changée, la boîte ou cote habituelle quand le papier est rangé, avec la date et
     l'auteur.

   Le dernier choix validé remplace l'ancien.
2. **Pré-remplir** l'indexation d'une nouvelle pièce, avec sa **source** (« Repris de votre classement du 12/03,
   pièce … »). On lit la mémoire du **fonds de ce client**, puis celle **du cabinet**, puis rien. L'archiviste garde ou
   change ; **ce qu'il valide devient la mémoire**.
3. **Les factures comptabilisées rejoignent les archives.** Une facture inscrite au brouillard par STORY-1097 apparaît
   dans le fonds d'archives du client, avec sa référence et son empreinte, liée à l'original (patron de STORY-1087,
   AC-5). Elle est **pré-indexée depuis l'écriture** : tiers, date, montant, numéro, exercice, nature « facture d'achat »
   ou « de vente ». Il n'y a donc **pas de seconde saisie**.
4. **Consulter et oublier** une mémoire de classement (journalisé). Une nature retirée du plan de classement n'est
   jamais reproposée.
5. **Natures sensibles** (STORY-1087, AC-7) : la mémoire ne retient **que** la nature et le classement, jamais le texte
   lu.

## ⛔ Cloisonnement par cabinet (exigence de l'utilisateur, 2026-11-18)

- Mémoire, suggestions et natures propres appartiennent à **l'organisation du cabinet**. Aucune mémoire n'est
  partagée entre cabinets, et rien n'est indexé par le seul NIF.
- **Le même client suivi par deux cabinets** : l'archiviste de B ne reçoit **rien** du classement de A, et ne voit
  aucune pièce du fonds de A.

## Critères d'acceptation

- **AC-1** : la deuxième pièce du même émetteur, dans le même fonds, est pré-indexée comme la première, avec sa source.
- **AC-2** : un classement corrigé remplace la mémoire ; la pièce suivante propose le nouveau classement.
- **AC-3** : une facture inscrite au brouillard (STORY-1097) apparaît dans le fonds du client, pré-indexée, sans
  seconde saisie, et reliée à son écriture.
- **AC-4** : deux cabinets suivent le même client (même NIF) ; B ne reçoit aucune suggestion ni aucune pièce de A
  (test à deux cabinets, sur la vraie pile).
- **AC-5** : une mémoire oubliée n'est plus proposée, et l'oubli est journalisé.

## ✅ Ce que les cabinets veulent qu'on leur valide — salle du 2026-11-19 (V9)

Ajouté depuis `salle-cabinets-validations-2026-11-19.md`. Ce sont les critères qu'un cabinet vérifie lui-même avant d'adopter la solution.

- Le cabinet retrouve une pièce, une liasse ou un accusé d'un client en tapant le fournisseur ou le mois, en moins de trois gestes.

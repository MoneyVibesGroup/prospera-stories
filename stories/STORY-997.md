# STORY-997 : le versement au fonds, le scellé par empreinte et le bordereau complémentaire (module `ged`)

Status: done

**Complexité :** grande (un numéro attribué jamais réutilisé, un bordereau, un scellé vérifiable, trois faits)

**Épic :** EPIC-214 (les pièces, l'OCR et les archives)
**Dépôts :** `prospera-plateforme` (dossiers de C), `document-service` (dépôt `prospera-ocr-service`)
**Plage :** groupe C, n° 8 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §4). Dépend de STORY-995 et
STORY-996 (contrôle humain).

---

## Pourquoi

Un dossier terminé quitte le circuit pour le **fonds** : un bordereau fixe son contenu pièce par pièce, il reçoit un
**numéro d'archivage** qui sera écrit sur la chemise et qui joint le papier au numérique. Quand toutes ses pièces sont
numérisées et contrôlées, son image est **scellée** par une empreinte : toute modification ultérieure doit se voir. Une
pièce arrivée après le versement (le recours qui continue) n'invalide rien : elle va dans un **bordereau
complémentaire** rattaché au même numéro.

**Source** : PRD FR-167, FR-168, FR-169 (et FR-106 / H-078 pour le bordereau complémentaire, FR-172 pour le support de
référence) ; spine AD-9 ; épics EPIC-214 (« un scellé échoue à la vérification après toute modification ») ; plan du lot
2 (« `ARC-…/C1` sans invalider l'origine ») ; manifeste `ged` (`ged.dossier.verse@1`, `ged.dossier.scelle@1`,
`ged.empreinte.echec@1` ; droits `ged:fonds:verser`, `ged:fonds:sceller`, `ged:fonds:verifier`).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Verser** (FR-168) : `POST /api/v1/ged/fonds/versements` (`ARCH`) pour un dossier `CLOTURE`, `REJETE` ou `SANS_SUITE` (connu par `sinistres.dossier.changed`) ; refusé en instruction (« le fonds ne reçoit que du terminé ») ; un dossier déjà versé ne se verse pas deux fois | tests ; pile |
| AC-2 | **Le numéro d'archivage** (FR-167) `ARC-AAAA-CCCC-NNNNN` : `AAAA` année de clôture, `CCCC` `CORP`/`MATL`/`DIVR`/`RECS` ; **attribué** (compteur par organisation, année et volet), jamais calculé, jamais réutilisé ; deux versements concurrents n'ont jamais le même numéro | tests (concurrence sur vrai MongoDB) ; pile |
| AC-3 | **Le bordereau** : dans l'ordre, pièce, type (`DOCUMENT_MEDICAL` à qui ne lit pas la santé), pages, présence numérique, présence papier, **valeur** (`ORIGINAL_IRREMPLACABLE`, `ORIGINAL_REEDITABLE`, `COPIE`), émetteur ; les pièces manquantes déclarées ; le versement n'efface rien, il ajoute | tests ; pile |
| AC-4 | **Sceller** (FR-169) : `POST …/fonds/{numero}/scellement` (`ARCH`) refusé tant qu'une pièce du bordereau est en contrôle, rejetée ou en lecture ; l'empreinte SHA-256 porte sur la liste ordonnée (pièce, version, empreinte du fichier) ; date et auteur tracés ; le **support de référence** reste « papier » | tests ; pile |
| AC-5 | **Vérifier** : `POST …/fonds/{numero}/verification` (`ARCH`, `AUD`) recalcule depuis les **fichiers** du stockage ; toute modification (un octet d'un fichier, une version ajoutée) la fait **échouer**, l'échec est tracé et publié (`ged.empreinte.echec`) | tests ; pile (un octet modifié dans MinIO) |
| AC-6 | **Le bordereau complémentaire** : une pièce ajoutée au dossier après versement va dans `ARC-…/C1` (puis `/C2`…), avec son propre scellé lié au précédent ; l'origine reste **valide** à la vérification | tests ; pile |
| AC-7 | **Faits** `ged.dossier.verse`, `ged.dossier.scelle`, `ged.empreinte.echec` par l'outbox, dans la transaction ; numéro, clés, empreinte, comptes ; jamais un nom de fichier ni un contenu | tests ; Karapace |

## Décisions retenues par défaut (contestables)

- **D-997-1 — Le dossier « terminé » se lit dans la copie `ged_dossiers`** (`statut` et `volet` de
  `sinistres.dossier.changed@1`, déjà consommé) ; l'année de clôture est celle du dernier changement de statut vers
  `CLOTURE`/`REJETE`/`SANS_SUITE` (`modifieLe`) ; la fermeture datée sans statut final viendra avec STORY-1001.
- **D-997-2 — Le versement est exécuté par `ARCH`** (la proposition par `GEST` est un geste d'écran : pas de second
  état) ; `ARCH` rejoint les rôles du circuit (il lit les pièces ordinaires, pas le contenu de santé).
- **D-997-3 — La valeur et la présence papier** ont un défaut par paramètre (`ged` `2026.3`) et se corrigent ligne
  par ligne au versement : `ORIGINAL_IRREMPLACABLE` = acte de décès, procès-verbal, rapport de police, constat, déclaration
  signée ; `ORIGINAL_REEDITABLE` = factures, devis, ticket de caisse, rapport d'expertise, attestation d'assurance,
  certificats médicaux, ordonnance ; le reste `COPIE` (la quittance n'est pas encore un type de pièce). Papier présent
  par défaut si la pièce est arrivée au guichet, par courrier ou par reprise.
- **D-997-4 — Le scellé porte sur les FICHIERS**, pas sur les métadonnées : empreinte = SHA-256 de la liste triée
  `pieceId|version|sha256(fichier en clair)` ; la vérification relit chaque objet (déchiffré pour la santé) et
  recalcule. Une version ajoutée à une pièce scellée fait échouer la vérification du scellé d'origine **sauf** si elle
  est portée par un bordereau complémentaire (elle y est alors scellée à son tour).
- **D-997-5 — Les compteurs `ARC-`** : un document par (organisation, année, volet), `$inc` atomique ; le numéro est
  écrit dans la transaction du versement ; un versement annulé (pas de route ici) ne rend jamais son numéro. Les
  numéros repris d'un autre système (FR-167, reprise) viendront avec EPIC-219 : les nouveaux sauteront ceux qui
  existent.
- **D-997-6 — Pas d'horodatage qualifié ni de valeur probante** (lignes juridiques du §13.2) : le support de référence
  reste « papier » et n'est pas modifiable par cette story.

- **D-997-7 — Un bordereau complémentaire reprend les pièces nouvelles ET les versions nouvelles** depuis le dernier
  bordereau ; il ne se scelle qu'après son précédent ; une version superposée à une pièce scellée est un écart
  (`VERSION_AJOUTEE`) tant qu'aucun complémentaire ne la porte. Routes (proposition) : `POST /api/v1/ged/fonds/versements`,
  `GET /api/v1/ged/fonds/{numero}`, `POST …/{numero}/bordereaux`, `POST …/{numero}/bordereaux/{rang}/scellement`,
  `POST …/{numero}/verification` (le rang évite un « / » dans l'URL).

## Ce qui n'est pas ici

- La cote, la boîte, la chemise de couleur, la sortie et la restitution du papier (FR-170, FR-171).
- La reconstitution `/R1` (FR-173), la conservation et la destruction (FR-174, FR-175).
- L'alerte des 75 jours sans versement (pilotage).

## Ce qui a été livré

**2026-11-17** — fusionnées en « Rebase and merge » :

- `prospera-plateforme` **#19** (`dev` `94a8058`) : `ged.dossier.verse`, `ged.dossier.scelle`, `ged.empreinte.echec` ;
  11 champs classés.
- `document-service` **#28** (`dev` `a504061`) : module `src/modules/ged/fonds/` — verser (ARCH ; terminé seulement ;
  une fois), numéro `ARC-AAAA-CCCC-NNNNN` attribué par compteur (organisation, année, volet), bordereau pièce par pièce
  (valeur et papier par défaut, paramètres `ged` `2026.3`, corrigeables ; manquantes) ; sceller (SHA-256 des fichiers
  relus, refusé tant qu'une pièce est en contrôle, rejetée ou en lecture) ; vérifier (ARCH, AUD : fichier modifié ou
  absent, version ajoutée) ; bordereau complémentaire `/Cn` lié au précédent ; copie `ged_dossiers` enrichie du volet
  et de la date de clôture ; `ARCH` rejoint les rôles du circuit (sans la santé).
- **Node 24** : 1 049 unitaires, 193 e2e, lint, build.
- **Pile `grp-c-997`** : versement d'un dossier en instruction 409, par GEST 403 ; `ARC-2026-CORP-00001` (support
  papier, bordereau à 3 lignes dont le certificat dit `DOCUMENT_MEDICAL` à ARCH, 1 manquante) ; deux fois 409 ;
  scellement avant contrôle 409 (5 motifs) puis scellé ; vérification AUD `ok` ; version ajoutée → `VERSION_AJOUTEE` ;
  `/C1` (facture v2, rapport d'expertise) scellé et lié à l'origine, l'empreinte d'origine inchangée, vérification
  `ok` des deux ; **un octet ajouté au constat dans MinIO → `FICHIER_MODIFIE`** sur l'origine, `/C1` intact ; 6
  versements concurrents → 5 numéros distincts et un 409 ; ACC lit le fonds 403 ; 0 libellé ni nom de fichier dans les
  faits ; Karapace 9 sujets, 0 refus ; 0 erreur aux journaux.
- **Rejouée sur les images reconstruites depuis `dev`** (`a504061`, pile `grp-c-997d`) : même scénario, même issue — scellement avant contrôle 409 (5 motifs) ; `/C1` lié, origine valide ; un octet modifié → `FICHIER_MODIFIE` ; 6 versements concurrents → 5 numéros distincts ; Karapace 0 refus ; 0 erreur aux journaux.

**Reste** : la cote, la boîte, la chemise et la sortie du papier (FR-170, FR-171) ; la reconstitution `/R1` (FR-173) ;
la conservation et la destruction (FR-174, FR-175) ; l'alerte des 75 jours ; les numéros repris d'un autre système
(EPIC-219).

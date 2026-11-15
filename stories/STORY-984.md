# STORY-984 : l'échange avec la compagnie, par fichier — le contrat de l'annexe C et le transport Excel/JSON

Status: done

**Complexité :** grande (un service neuf, dix-neuf schémas, un transport, l'intégration idempotente des lots)

**Épic :** EPIC-203 (l'échange avec le logiciel de la compagnie)
**Dépôts :** `MoneyVibesGroup/prospera-liaison-assureur-service` (**neuf**, vide : `main` et `dev` posées par cette story),
`MoneyVibesGroup/prospera-plateforme` (dossiers de C : `contrats/assurance/`, `classification-sante/`)
**Plage :** groupe C, n° 5 du lot (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §5).

---

## Pourquoi

Le logiciel de la compagnie (LC) fait foi pour les contrats et le numéro de sinistre ; Prospera n'en tient que des
**projections datées** (spine assurance AD-1). `liaison-assureur` est le **seul écrivain** de ces projections brutes
(AD-2) et le seul point d'échange avec le LC, par un port `TransportLC` et deux transports, l'API et les fichiers ;
**Prospera tire**, rien n'est poussé (AD-13). Le contrat est l'**annexe C** du PRD (C-1 → C-19), sans nom de produit.

Cette story pose le contrat, le service et le **transport par fichiers** : c'est le seul que tout LC sait faire, et le
LC fictif (STORY-986) le parlera d'abord.

**Source** : `prds/prd-assurance-2026-11-13/prd.md`, annexe C (l. 5263 et suivantes, **corrigée** : C-13 sans gravité ni
nom de victime pour un dossier corporel, motifs codés en C-14 et C-17) et D.3.3 (motifs codés). Pas `annexe-c-w4.md`,
antérieure aux corrections.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Le contrat** : `prospera-plateforme/contrats/assurance/echange-lc/` porte l'enveloppe de lot et les **19 objets** C-1 → C-19 en JSON Schema draft-07, fermés, versionnés `@1`, plus les codes de rejet (C.4) et les motifs codés (D.3.3) ; un exemple valide par objet | tests du dossier |
| AC-2 | **Aucune donnée de santé vers le LC** : la garde `classification-sante` passe sur les 19 schémas ; C-13 refuse gravité, type de sinistre et nom de la victime pour un dossier **corporel** ; tout motif vers le LC est un code de la liste fermée | tests (un exemple corporel avec gravité est refusé) |
| AC-3 | **Le service** `prospera-liaison-assureur-service` : pile du moteur (Node 24, Confluent avec les correctifs de STORY-990, MongoDB 8), module `liaison-assureur` (manifeste copié à l'octet), gate `LIAISON_ASSUREUR_NOT_ENTITLED`, port 3410, profil de démarrage, garde de câblage ; `main` et `dev` posées, « Rebase and merge » seul | tests ; `docker compose up` healthy |
| AC-4 | **Le transport par fichiers** : répertoire d'échange par organisation (`<racine>/<organisationId>/entree` en lecture, `sortie` en écriture), noms `<objet>_<lotId>_<version>.(json\|xlsx)`, fichier déposé visible seulement après **renommage atomique** ; JSON et Excel donnent le **même lot** | tests du transport (vrai disque) |
| AC-5 | **Le lot** : une version inconnue refuse le lot entier (`VERSION_CONTRAT_INCONNUE`) ; un lot déjà intégré n'est pas réintégré (`LOT_DEJA_INTEGRE`) ; un décompte ou une empreinte faux refuse le lot ; un lot partiel intègre ses lignes valides et refuse les autres **ligne par ligne**, code et motif ; rien n'est ignoré en silence | unitaires ; e2e |
| AC-6 | **Les lignes C-1 → C-9 deviennent des projections** (`valeur`, `lueLe`, `cleOrigineLC`, `versionObjet`, empreinte), dans l'ordre de dépendance ; **un fait rejoué ne crée aucun doublon** (même clé, même version, même contenu) ; même clé et même version avec un contenu différent : refus `DOUBLON` gardé pour la file des écarts, jamais d'écrasement ; version plus récente : le LC gagne ; plus ancienne : ignorée et comptée ; parent inconnu : `IDENTIFIANT_INCONNU`, ligne **rejouée** quand le parent arrive | unitaires ; e2e ; vrai Mongo |
| AC-7 | **Le journal des échanges** : un enregistrement par lot (fichier, objet, version, empreinte, état, décomptes) et par ligne refusée ; lisible par une route gardée | e2e |
| AC-8 | Lint 0, build, suites vertes sous Node 24 ; la pile démarre ; un dépôt de fichiers réel sur la pile est intégré | sorties ; pile `grp-c` |

## Décisions retenues par défaut (contestables)

- **D-984-1 — Découpage avec STORY-985.** Ici : le contrat complet (C-1 → C-19), le service, le transport par fichiers
  dans les deux sens (relever, déposer) et l'intégration **des objets de contrat** C-1 → C-9. Avec **985** : la file
  d'envoi acquittée (C-13 → C-17), les accusés (C-12), le numéro officiel (C-11, AD-6), la liste « à saisir » (C-18),
  la file des écarts et sa résolution, l'API, la fraîcheur, et la **publication des faits** `liaison-assureur.*@1`
  (tous ensemble, pour qu'un seul jeu de contrats arrive sur le fil). Les lots C-10 → C-12 reçus ici sont **journalisés
  et refusés** `OBJET_NON_PRIS_EN_CHARGE` (rien d'ignoré en silence), jusqu'à 985.
- **D-984-2 — Une ligne porte son enveloppe** : `cleOrigine`, `versionObjet` (entier ≥ 1) et `dateValeur` (AD-13), en
  plus des champs minimaux de l'objet. Le `messageId` déterministe se calcule chez Prospera (objet, clé, version) : un
  LC n'a pas à le produire.
- **D-984-3 — L'empreinte d'un lot** est le SHA-256 du JSON canonique (clés triées, sans espace) du tableau de ses
  lignes ; celle d'une ligne, le SHA-256 de son JSON canonique. Le même calcul vaut pour JSON et Excel.
- **D-984-4 — Le gabarit Excel** : un onglet `lot` (en-têtes `versionContrat`, `lotId`, `objet`, `genereLe`,
  `nombreLignes`, `empreinte`, puis une ligne de valeurs), un onglet par objet (première ligne = noms des champs). Un
  champ composé (liste des parts de coassurance, liste des codes de garantie) s'écrit en JSON dans sa cellule. CSV
  (« accepté », AD-13) viendra avec le premier LC qui le demande.
- **D-984-5 — Un répertoire d'échange par organisation** sous une racine configurée (`LIAISON_ECHANGE_RACINE`) ; seules
  les organisations dont le module `liaison-assureur` est actif sont relevées. Le relevé tourne à la fréquence des
  fichiers (une heure par défaut, `LIAISON_RELEVE_FICHIERS_MS`) et se déclenche aussi par une route gardée.
- **D-984-6 — Les contrats de l'échange ne sont pas des faits.** La garde `classification-sante` y refuse la santé,
  mais pas les données personnelles : l'annexe C échange légitimement téléphone, date de naissance ou pièce d'identité
  avec le LC (C-1, C-13), qui en est la source. Le dossier `contrats/assurance/echange-lc/` est de nature `ECHANGE` ;
  les autres sous-dossiers de `contrats/assurance/` restent des faits de module (D-983-6).
- **D-984-7 — Les schémas sont copiés dans le service**, à l'octet, depuis `prospera-plateforme` (épinglés au build,
  AD-13) ; un test compare leurs empreintes à une liste figée, comme pour le manifeste.

## Contexte pour le développeur

- **Patron du service** : `prospera-sinistres-service` sur `dev` (STORY-980 + correctifs de STORY-990 : création des
  topics et `metadataMaxAge`).
- **Excel** : `exceljs` ^4.4.0, comme `balance-service`.
- **Ordre de dépendance à la lecture** (C.1) : assurés et produits, puis polices, puis garanties, primes,
  intermédiaires, coassureurs, traités, puis sinistres existants.
- **Codes de rejet** (C.4) : `CHAMP_MINIMAL_ABSENT`, `FORMAT_INVALIDE`, `IDENTIFIANT_INCONNU`, `DOUBLON`,
  `ETAT_INCOMPATIBLE`, `MONTANT_INCOHERENT`, `VERSION_CONTRAT_INCONNUE`, `LOT_DEJA_INTEGRE`.

## Ce qui a été livré

**2026-11-15** — deux PR fusionnées en « Rebase and merge » :

- `prospera-plateforme` **#4** (`dev` `65ea9e7`) : `contrats/assurance/echange-lc/` (lot + C-1 → C-19, codes de rejet,
  motifs codés, exemples ; générés, comparés à l'octet), nature `ECHANGE` dans `classification-sante`. Node 24 :
  contrat 79/79, `classification-sante` 29/29, `champs-sensibles` 40/40, suite racine de B inchangée (36, 0 échec).
- `prospera-liaison-assureur-service` **#1** (`dev` `fae6ab6` ; `main` `e039a7a` et `dev` posées par cette story,
  « Rebase and merge » seul) : le service, le contrat copié à l'octet, le transport par fichiers, l'intégration, le
  journal, le relevé, les routes. Node 24 (export LF) : **367 unitaires, 17 e2e**, lint 0, build ; image reconstruite
  depuis `dev` : `docker compose up` healthy (MongoDB et Kafka « up »).
- **Pile réelle** `grp-c` (relevé toutes les 5 s, vrai `entitlement.changed`, fichiers déposés dans le volume
  d'échange) : droit projeté en 2 s ; cinq fichiers déposés dans le désordre (dont une police **Excel**) intégrés
  dans l'ordre de dépendance (assuré, produit, police, garantie) ; lot partiel (`CHAMP_MINIMAL_ABSENT : ville`) ;
  version 7 refusée en entier (`VERSION_CONTRAT_INCONNUE`) ; puis le même fait dans un autre lot compté
  **identique** (aucun doublon), la version 2 du produit appliquée, la police changée sous la même version refusée
  `DOUBLON` sans écrasement ; huit fichiers, huit entrées au journal, aucun relu.

**Reste, pour STORY-985** (D-984-1) : la file d'envoi acquittée (C-13 → C-17) et le dépôt des lots sortants, les
accusés (C-12), le numéro officiel (C-11), la liste « à saisir » (C-18), la file des écarts et sa résolution, le
transport par API, la fraîcheur, et la publication des faits `liaison-assureur.*@1`.

# STORY-331 : Le format de canal décrit comme une donnée du paquet — le classeur à téléverser et le formulaire à saisir, deux natures d'une même description, derrière le même port

Status: ready-for-dev (2026-11-26) — fiche écrite et contrat annoncé avant le code.
Écrite le 2026-11-26 par la sous-session du groupe D juste avant de coder (lot 7 de D, n° 8,
`PLAN-LOT-7-2026-11-24.md` §4, « fini quand : formats dimana et GUDEF (§1) ») ; contrat et fichiers communs annoncés
avant le code (« ⚠ Contrats » et « ⚠ Communs » du journal de D). Il n'existait pas de fiche : les critères viennent de
`epics-fiscalite-2026-08-03.md` (EPIC-032).

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle (chaîne 330 → 337, puis 561 qui attend 331)
**Points :** 5 · **Service :** `fiscal-service` (`:3012`), dossiers de D `paquets-depot`, `livrables-depot` et `depots`
(D-L7-1)
**FR :** `FR-F40` *(le format exact de chaque canal est décrit comme donnée dans le paquet : gabarit, champs,
contraintes)* · NFR-F11 *(un second pays ne coûte que de la donnée)* · **AD-12** *(le canal est un adaptateur derrière
un port asynchrone ; aucun nom de pays, de portail ni de guichet dans le domaine)*
**Dépend de :** **STORY-330** ✅ (fiscal #76, `dev` `7d48fd9` : le livrable d'une déclaration, le port `CanalDeDepot`,
le dépôt engagé, la garde d'AD-12 ; D-330-2 annonçait 331 : « le refus de 330 nomme le champ absent ; celui de 331
nommera le champ incomplet ») · STORY-536 (le registre des paquets de dépôt, vérifiés par sha256) · STORY-537 → 701 (le
paquet `TG × DSF`, le classeur du GUDEF) · STORY-325 de C ✅ (le contenu déclaré et son empreinte, D-325-3).
**Suite :** STORY-332 (le guidage : les valeurs dans l'ordre du formulaire, copiables), 561 (le connecteur : un bloc
`automatisation` dans le même paquet, qui adresse les champs par leur code), 1102 (le premier dépôt réel).

## Histoire

En tant qu'**administrateur plateforme**, je veux décrire un nouveau canal sans livrer de code, afin qu'un second pays ne
coûte que de la donnée. *(FR-F40, NFR-F11)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-032)

1. **Étant donné** un canal décrit au paquet (gabarit, champs, contraintes) **quand** un livrable est produit **alors**
   il respecte cette description sans code spécifique.
2. **Étant donné** un canal dont la description est incomplète **quand** un livrable est demandé **alors** le refus
   nomme le champ manquant.
3. **Étant donné** deux canaux de nature différente (téléversement de classeur, saisie de formulaire) **quand** ils sont
   décrits **alors** les deux passent par le même port.

**Fini quand** (plan §4, n° 8) : les formats de **dimana** et du **GUDEF** existent (jalon « format confirmé » levé le
24/11 pour les deux canaux, plan §1).

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `7d48fd9`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| Le registre des paquets de dépôt (536) | un manifeste, un paquet par `(pays, état, version)`, ses octets vérifiés par sha256 avant toute lecture ; `trouver`, `trouverVersion`, `etatsActifs` ; la garde de build (`prebuild`) | `modules/paquets-depot/registre-paquets-depot.ts`, `assets/` |
| Le contrat d'un paquet de dépôt (536 → 701) | `format.support` (`TABLEUR` seul servi), `format.schema` (le schéma du classeur), `gabarit[]` (une case par poste, sourcée), `canal`, `calendrier`, `penalites` | `domain/paquets-depot/contrat-paquet-depot.ts` |
| **Le format du GUDEF** | `TG × DSF` 1.3 (actif) : le classeur du contribuable, 92 feuilles, 2 708 cases sourcées ; `canal.adresse` le GUDEF (LPF art. 17) | `assets/tg-dsf-1.3.json` |
| Le livrable d'une déclaration (330) | le format lu sur le `gabarit` de la déclaration (donnée du paquet fiscal de C) ; `gabarit: null` ⇒ `422 FORMAT_DE_CANAL_NON_DECLARE` (`{ champ: 'gabarit', canal }`) | `domain/depot/depot-declaration.ts`, `application/livrables-depot/livrables-declaration.service.ts` |
| Le dépôt engagé (330) | `POST /depots-declaration` : `format` = la référence du paquet que le gabarit nomme, ou `null` ; le port `CanalDeDepot`, un adaptateur (`CanalAssiste`) | `application/depots/depots-declaration.service.ts`, `ports/canal-depot.ts` |
| Le paquet fiscal (C, D-L7-3) | chaque entrée du catalogue porte `canal` (`TELESERVICE_OTR` pour la TVA comme pour la DSF) et `gabarit` (`TG×DSF` pour la DSF, `null` pour la TVA, l'IS, la TAF…) | publié par le catalogue (MinIO), lu par `PaquetsService` |

**Ce qui manque** : seul le téléversement d'un classeur est décrit. Une déclaration du mois (la TVA sur dimana) n'a aucun
format : son livrable répond `FORMAT_DE_CANAL_NON_DECLARE` et son dépôt s'engage avec `format: null`. Rien ne décrit un
**formulaire** (ses champs, leur ordre, leurs contraintes), et un paquet incomplet n'est refusé qu'au build, sans nommer
le champ dans la réponse.

## Ce que la story livre

1. **Une seconde nature de format, décrite comme donnée** — le **formulaire à saisir** (`SAISIE_FORMULAIRE`), à côté du
   **fichier à téléverser** (`TELEVERSEMENT_FICHIER`, le classeur de 537). Un paquet de formulaire déclare les
   déclarations qu'il sert (`declarations[]` : le `canal` et la `taxe` que le paquet fiscal leur donne), le canal
   (`canal`), et ses champs dans l'ordre du formulaire (`formulaire.champs[]` : `code`, `libelle`, `valeur`,
   `contraintes`, `source`). Son contrat : `domain/paquets-depot/contrat-formulaire-depot.ts` (pur).
2. **Le format de dimana** : `TG × TVA` 1.0 (`assets/tg-tva-1.0.json`, manifeste `assets/manifeste-formulaires.json`) —
   la déclaration mensuelle de TVA, ses trois valeurs dans l'ordre (la période, la base imposable, la TVA due). **Le
   format du GUDEF** reste `TG × DSF` 1.3, **inchangé d'un octet** (D-331-9).
3. **Le livrable d'un formulaire** — `GET /api/v1/livrables-declaration/{obligationId}/formulaire` : les valeurs de la
   déclaration, dans l'ordre et sous les contraintes du paquet, estampillées comme le classeur (D-330-4) ; rien n'est
   calculé ni stocké : chaque valeur est une valeur du contenu déclaré (D-325-3), celui que l'estampille couvre.
4. **Le format d'une déclaration, résolu en un seul endroit** pour le livrable et pour l'engagement (D-331-3) ; le dépôt
   engagé d'une TVA porte désormais son format et chaque dépôt engagé dit sa **nature** : les deux natures passent par
   le même port `CanalDeDepot` (AC-3).
5. **Une description incomplète est refusée en nommant le champ** (AC-2) : au build (la garde de 536, étendue) et à la
   demande du livrable (`422 FORMAT_DE_CANAL_INCOMPLET`, `details.champ`).

## Décisions

- **D-331-1 — Où vit le format : dans le paquet de dépôt de D, pas dans le paquet fiscal de C.** Le paquet fiscal (C,
  D-L7-3) dit **quoi** déclarer, **quand**, et **par quel canal** (`canal`, `gabarit`) ; le paquet de dépôt (D, 536) dit
  **sous quelle forme** le livrable part. Le format d'un formulaire est donc un paquet de dépôt de plus, dans
  `modules/paquets-depot/assets/`, vérifié par sha256 comme les autres. ⛔ Écarté : poser `gabarit: "TG×TVA"` dans le
  catalogue du paquet fiscal — c'est le paquet de C, publié par le catalogue : deux groupes pour une donnée que D lit,
  et 331 bloquée. **Aucune demande à C pour 331** ; le paquet fiscal n'est ni lu autrement, ni recopié.
- **D-331-2 — Deux natures, nommées par l'endroit où le format est décrit.** `TELEVERSEMENT_FICHIER` : un paquet du
  manifeste de 536 (`manifeste.json` ; aujourd'hui `TABLEUR`, le classeur de 537). `SAISIE_FORMULAIRE` : un paquet du
  manifeste des formulaires (`manifeste-formulaires.json`, même forme d'entrée : `pays`, `etat`, `version`, `checksum`,
  `locator`, `actif`). ⚡ Un second manifeste plutôt qu'un champ de plus dans le premier : `etatsActifs` (le calendrier
  des dépôts de 539, lu par les échéances de C), la complétude de 556 et la chaîne de 538 lisent le premier ; un
  formulaire n'y entre jamais, et leur comportement ne change pas d'un octet. ⛔ Un même `(pays, état)` ne peut être
  décrit dans les deux manifestes (garde de build).
- **D-331-3 — Le format d'une déclaration, dans cet ordre.** (1) Le `gabarit` que le paquet fiscal déclare (C) : le
  paquet de fichier qu'il nomme — **330 inchangé**. (2) Sinon, le paquet de formulaire **actif** dont `declarations[]`
  nomme exactement le `canal` **et** la `taxe` de la déclaration (comparaison de chaînes, aucune lecture du code du
  canal : AD-12). (3) Sinon : `422 FORMAT_DE_CANAL_NON_DECLARE` (`{ champ: 'gabarit', canal }`), **le refus de 330
  inchangé**. ⛔ Deux paquets de formulaire actifs qui revendiquent la même `(canal, taxe)` : `PAQUET_DEPOT_AMBIGU` au
  build, jamais un choix à l'exécution. Un seul résolveur sert le livrable et l'engagement
  (`application/livrables-depot/format-de-canal.ts`).
- **D-331-4 — Le contrat d'un paquet de formulaire** (strict : une clé inconnue est refusée).
  `{ pays, etat, version, statut, declarations: [{ canal, taxe }], canal: { type, adresse, source }, formulaire: {
  champs: [{ code, libelle, valeur, contraintes, source }] } }`.
  - `statut` : le vocabulaire de 536 (`certifie`, `a-valider-par-expert`, `amorce`).
  - `code` : `^[a-z][a-zA-Z0-9]{0,39}$`, unique dans le formulaire. C'est l'adresse stable du champ (332, 561).
  - `valeur` : une grammaire fermée, celle du **contenu déclaré** de la déclaration (D-325-3), c'est-à-dire ce que
    l'estampille couvre : `DECLARATION|periode`, `DECLARATION|montant` (le déclaré), `DECLARATION|assiette` (la base
    déclarée). Aucune autre source : une valeur que la déclaration ne tient pas n'a pas de poste.
  - `contraintes` : `{ type, obligatoire, format? }`. `type` : `MONTANT` (un entier positif ou nul, en unités de la
    devise, sans séparateur) ou `PERIODE` (`format` exigé : `AAAA-MM`, `MM/AAAA` ou `AAAA`). Le type suit la valeur :
    `montant` et `assiette` ⇒ `MONTANT`, `periode` ⇒ `PERIODE` (garde de build).
  - L'ordre de `champs[]` est **l'ordre du formulaire** ; `source` cite le texte ou le relevé, comme chaque case de 537.
  - ⛔ Ni `calendrier`, ni `penalites` : l'échéance et les majorations d'une déclaration du mois sont celles du paquet
    fiscal (C) ; un paquet de formulaire ne décrit que la forme.
- **D-331-5 — Le livrable d'un formulaire.** `GET /api/v1/livrables-declaration/{obligationId}/formulaire`, droit
  `preparer`, mêmes gardes de classe que la route du classeur. Même ordre que 330 : la portée, `VALIDEE` ou au-delà
  (`409 DECLARATION_NON_VALIDEE`), active (`409 OBLIGATION_DESACTIVEE`), le format (D-331-3), l'estampille (D-330-4,
  la version scellée si elle l'est), puis les valeurs. **Chaque valeur est lue dans le contenu de l'estampille** — le
  contenu scellé pour une déclaration déposée, le contenu courant sinon — jamais recalculée. Réponse `200` JSON :
  `{ obligationId, nature: 'SAISIE_FORMULAIRE', format: { pays, etat, version, checksum }, statutFormat, estampille: {
  numero, empreinte }, champs: [{ rang, code, libelle, type, valeur }] }`, `valeur` étant une chaîne prête à copier, ou
  `null` pour un champ facultatif que la déclaration ne tient pas. Rien n'est écrit, aucun acte, aucun fait.
- **D-331-6 — Les refus d'un formulaire nomment le champ (AC-2).**
  - `422 FORMAT_DE_CANAL_INCOMPLET` (`details.champ` : le chemin dans le paquet, ex. `formulaire.champs[1].contraintes`)
    : la description est incomplète ou invalide. La garde de build la refuse d'abord (`npm run build` échoue avec le
    même chemin) ; à l'exécution, le registre la refuse à la demande du livrable, sans servir le paquet.
  - `422 VALEUR_DE_CANAL_ABSENTE` (`details.champ` : le `code`, `details.valeur` : le poste) : un champ obligatoire dont
    la déclaration ne tient pas la valeur (aucun montant déclaré, par exemple).
  - `422 VALEUR_DE_CANAL_HORS_CONTRAINTE` (`details.champ`, `details.contrainte`) : un montant négatif ou non entier.
  - `422 FORMAT_DE_CANAL_AUTRE_NATURE` (`details.nature`) : le formulaire d'une déclaration dont le format est un
    fichier, ou le classeur (`POST …/{obligationId}`) d'une déclaration dont le format est un formulaire. Pour la route
    du classeur, c'est un refus de plus : sur une déclaration que seul un formulaire décrit, elle rendait
    `FORMAT_DE_CANAL_NON_DECLARE` ; une déclaration sans aucun format le rend toujours.
  - Les octets altérés restent `PAQUET_DEPOT_INTEGRITE` (536) : une altération n'est pas une description incomplète.
- **D-331-7 — Le même port pour les deux natures (AC-3).** L'engagement (`POST /depots-declaration`) résout le format par
  le résolveur de D-331-3 et appelle `CanalDeDepot.engager` à l'identique, quelle que soit la nature : une TVA sur dimana
  s'engage désormais avec `format` = la référence de `TG × TVA` (elle s'engageait avec `null`). La réponse de
  l'engagement et celle de la lecture gagnent **`nature`** : `TELEVERSEMENT_FICHIER`, `SAISIE_FORMULAIRE`, ou `null`
  (aucun format). Elle se **déduit de la référence** (le manifeste qui la publie), elle n'est pas stockée : aucun champ
  neuf dans `engagements_depot`, l'acte `DEPOT_DECLARATION_ENGAGE` inchangé, un engagement déjà écrit se relit avec sa
  nature. Le port, son type `DepotEngage` et `CanalAssiste` ne changent pas.
- **D-331-8 — Un paquet de formulaire se vérifie comme un paquet de fichier.** Ses octets sont hachés avant d'être lus
  (`PAQUET_DEPOT_INTEGRITE`), son identité doit être celle du manifeste, il est chargé paresseusement et mémorisé une
  fois réussi (patron de 536). Il n'est servi par aucune route de lecture brute (`GET /paquets-depot/{pays}/{etat}` reste
  celle des fichiers) : le formulaire se lit par son livrable.
- **D-331-9 — Les deux formats du « fini quand ».**
  - **GUDEF** : `TG × DSF` 1.3 (537 → 701), le téléversement du classeur. Aucun octet touché (les copies sont vérifiées
    par sha256 sur leurs octets LF).
  - **dimana** : `TG × TVA` 1.0, la saisie du formulaire mensuel de TVA. Il sert `{ canal: 'TELESERVICE_OTR', taxe:
    'TVA' }` (le canal et le code que le paquet fiscal donne à la TVA) ; `canal.adresse` : dimana, le portail de
    déclaration des impôts de l'OTR (confirmé par le PO le 2026-08-28, STORY-561) ; trois champs dans l'ordre :
    `periode` (`MM/AAAA`, obligatoire), `baseImposable` (l'assiette déclarée, facultative), `tvaDue` (le montant
    déclaré, obligatoire) ; sources : CGI art. 195 et LPF art. 60 (« une déclaration conforme au modèle prescrit », au
    plus tard le 15 du mois suivant), la décision du PO du 24/11 (plan §1). **`statut: 'amorce'`** : le produit ne tient
    que le déclaré et sa base ; les autres lignes du formulaire réel (TVA collectée, déductible, crédit reporté…) et
    leur ordre exact se relèvent sur le portail au premier dépôt réel (1102, AC-3) — **Q-D-28**. Chacune s'ajoutera par
    une version du paquet, en donnée seule, dès que sa valeur existe dans le produit.
  - ⚠️ **La retenue de l'IRPP sur les salaires** (déposée aussi sur dimana, 1102) n'a pas de format ici : le paquet
    fiscal ne nomme pas son canal (`irpp.retenueALaSource.reversement` sans organisme ⇒ `canal: 'NON_DECLARE'`,
    D-349-4), et un paquet de formulaire ne peut servir qu'un canal nommé. **→ C** (non bloquante) : nommer le canal de
    son reversement au paquet fiscal ; D ajoutera alors `TG × RETENUE-IRPP` par donnée seule (un paquet, une ligne de
    manifeste).
- **D-331-10 — La garde d'AD-12 couvre le code neuf.** Le contrat du formulaire (`domain/paquets-depot`) et le
  résolveur (`application/livrables-depot`) sont dans son périmètre (D-330-12) : aucun nom de pays, de portail ni de
  guichet, commentaires compris. Le paquet `tg-tva-1.0.json` est une donnée : il nomme dimana, la garde ne le lit pas.
- **D-331-11 — Pour 561 : le format reste lisible par un adaptateur automatisé.** Chaque champ a un `code` stable et un
  rang ; le livrable d'un formulaire est une fonction pure du paquet et du contenu déclaré
  (`domain/paquets-depot/valeurs-formulaire.ts`), qu'un adaptateur appelle sans passer par HTTP. Le contrat est strict :
  561 y ajoutera son bloc `automatisation` (le parcours, la correspondance champ ↔ écran adressée par `code`, les
  marqueurs de fin) par un changement de contrat annoncé, sans toucher aux champs.
- **D-331-12 — Pour 332 : l'ordre et la forme copiable.** L'ordre de `champs[]` est celui du formulaire ; chaque valeur
  est déjà la chaîne à coller (un montant en chiffres, sans séparateur ; une période au format du formulaire). Le
  guidage de 332 les affiche tels quels et ne demande jamais une valeur que le produit connaît.

## Contrat (annoncé avant le code)

| | |
| --- | --- |
| **Route neuve** | `GET /api/v1/livrables-declaration/{obligationId}/formulaire` — droit `fiscalite:declaration:preparer` |
| Réponse 200 | `{ obligationId, nature: 'SAISIE_FORMULAIRE', format: { pays, etat, version, checksum }, statutFormat: 'certifie' \| 'a-valider-par-expert' \| 'amorce', estampille: { numero, empreinte }, champs: [{ rang, code, libelle, type: 'MONTANT' \| 'PERIODE', valeur: string \| null }] }` |
| Refus | `404 OBLIGATION_INTROUVABLE` · `409 DECLARATION_NON_VALIDEE` · `409 OBLIGATION_DESACTIVEE` · `422 FORMAT_DE_CANAL_NON_DECLARE` · `422 FORMAT_DE_CANAL_ILLISIBLE` · `422 FORMAT_DE_CANAL_AUTRE_NATURE` (`{ nature: 'TELEVERSEMENT_FICHIER' }`) · `422 FORMAT_DE_CANAL_INCOMPLET` (`{ champ }`) · `422 VALEUR_DE_CANAL_ABSENTE` (`{ champ, valeur }`) · `422 VALEUR_DE_CANAL_HORS_CONTRAINTE` (`{ champ, contrainte }`) · `502 PAQUET_DEPOT_INTEGRITE` · `502 VERSION_SCELLEE_INTROUVABLE` |
| **Refus de plus** | `POST /api/v1/livrables-declaration/{obligationId}` (330) : `422 FORMAT_DE_CANAL_AUTRE_NATURE` (`{ nature: 'SAISIE_FORMULAIRE' }`) sur une déclaration que seul un formulaire décrit (elle rendait `FORMAT_DE_CANAL_NON_DECLARE`) ; le reste inchangé |
| **Champ de plus** | `POST /api/v1/depots-declaration` (201, 200) et `GET /api/v1/depots-declaration/{depotId}` : **`nature`** (`'TELEVERSEMENT_FICHIER' \| 'SAISIE_FORMULAIRE' \| null`) ; `format` d'une déclaration que seul un formulaire décrit : la référence de son paquet (elle valait `null`) ; aucune autre clé, toujours aucun champ d'accusé |
| **Données** | `modules/paquets-depot/assets/manifeste-formulaires.json` et `tg-tva-1.0.json` (neufs) ; `manifeste.json` et `tg-dsf-*.json` intacts |
| **Stockage** | aucun changement (ni collection, ni champ, ni index) ; **aucune migration** |
| Aucun | topic, droit, acte du journal, champ du paquet fiscal |

## Ce que cette story ne fait PAS

- ⛔ Elle ne touche pas le paquet fiscal de C (ni son catalogue, ni sa copie) et n'y demande rien pour 331 (D-331-1).
- ⛔ Elle ne change ni le paquet `TG × DSF`, ni la route de 537, ni la chaîne de 538, ni le calendrier de 539, ni la
  complétude de 556 (D-331-2).
- ⛔ Elle ne guide pas (332), ne consigne aucun accusé (333) et ne branche aucun connecteur (561, D-331-11).
- ⛔ Elle n'invente aucune ligne du formulaire réel de dimana : trois valeurs que le produit tient, `amorce` (D-331-9,
  Q-D-28).

## Definition of Done

- [ ] Une TVA validée sur `TELESERVICE_OTR` ⇒ son formulaire `TG × TVA` 1.0, trois valeurs dans l'ordre, estampillées ;
      la même déposée ⇒ les valeurs et l'estampille de la version scellée (e2e, vrai paquet).
- [ ] Le classeur d'une DSF inchangé (les tests de 330 verts sans retouche) ; une déclaration sans aucun format ⇒
      `FORMAT_DE_CANAL_NON_DECLARE` inchangé.
- [ ] AC-2 : une description incomplète refusée au build et à la demande, `details.champ` nommé ; chaque refus de D-331-6
      par un test.
- [ ] AC-3 : une DSF et une TVA engagées par le même port (le même adaptateur appelé), chacune avec sa `nature`.
- [ ] La garde d'AD-12 verte sur le code neuf.
- [ ] **Mutations** qui rougissent sur une assertion (gabarit qui ne prime plus ; canal ou taxe ignorés à la résolution ;
      ordre des champs perdu ; obligatoire relâché ; contrainte de montant relâchée ; période mal formatée ; valeur lue
      hors de l'estampille ; nature fausse ; champ manquant non nommé ; ambiguïté acceptée).
- [ ] Node 24 : unitaires, e2e, `test:conformite` ; lint et `tsc` ; §1.5 : pile `grp-d` du fiscal (Redis compris) saine,
      la route neuve en `401` sans jeton.

## Questions au PO

- **Q-D-28 — Le formulaire mensuel de TVA de dimana : quelles lignes, dans quel ordre ?** Choix par défaut : les trois
  valeurs que le produit tient (la période, la base, la TVA due), `statut: 'amorce'`, relevées et complétées sur le
  portail au premier dépôt réel (1102). Une ligne de plus ne coûte qu'une version du paquet si sa valeur existe dans le
  produit ; sinon, elle reste à saisir sur le portail, et le guidage le dira.

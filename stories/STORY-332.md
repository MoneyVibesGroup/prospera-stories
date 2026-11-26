# STORY-332 : Le dépôt guidé pas à pas — les étapes viennent du paquet, les valeurs suivent l'ordre du formulaire, chacune prête à copier, et rien de ce que le produit connaît n'est demandé en saisie

Status: in-progress (2026-11-26 ; lot 7 de D, n° 9) — fiche écrite et contrat annoncé avant le code.
Écrite le 2026-11-26 par la sous-session du groupe D juste avant de coder (lot 7 de D, n° 9,
`PLAN-LOT-7-2026-11-24.md` §4, « fini quand : salle des cabinets V3 : valeurs dans l'ordre du formulaire, copiables ») ;
contrat et fichiers communs annoncés avant le code (« ⚠ Contrats » et « ⚠ Communs » du journal de D). Il n'existait pas
de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md` (EPIC-032) et de la salle des cabinets du 2026-11-19
(`salle-cabinets-validations-2026-11-19.md`, V3).

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle (chaîne 330 → 337)
**Points :** 5 · **Service :** `fiscal-service` (`:3012`), dossiers de D `depots` et `paquets-depot` (D-L7-1)
**FR :** `FR-F41` *(le collaborateur est guidé écran par écran sur le portail, sans retaper un montant)* · **AD-12**
*(aucun nom de pays, de portail ni de guichet dans le domaine)* · NFR-F11 *(un second pays ne coûte que de la donnée)*
**Dépend de :** **STORY-331** ✅ (fiscal #78, `dev` `6e9fbbe` : les deux natures de format, le résolveur unique,
`valeursDuFormulaire`, les `code` stables des champs, D-331-12 : « le guidage de 332 affiche les valeurs telles quelles et
ne demande jamais une valeur que le produit connaît ») · **STORY-330** ✅ (fiscal #76, `dev` `7d48fd9` : le dépôt engagé,
son estampille, `perime`, le port `CanalDeDepot`, la garde d'AD-12) · STORY-536 (le registre des paquets de dépôt, vérifiés
par sha256) · STORY-563 de C (le redevable d'une obligation : l'entreprise ou une personne physique).
**Suite :** STORY-333 (l'accusé d'un dépôt engagé, fait séparé), 1102 (le premier dépôt réel : relever les écrans des deux
portails), 561 (le connecteur suit les mêmes étapes, en automatique).

## Histoire

En tant que **collaborateur de cabinet**, je veux être guidé écran par écran sur le portail, afin de ne retaper aucun
montant. *(FR-F41)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-032)

1. **Étant donné** un dépôt engagé **quand** le guidage est affiché **alors** les étapes sont ordonnées et proviennent du
   paquet, pas du code.
2. **Étant donné** une étape comportant des valeurs à reporter **quand** je la consulte **alors** chaque valeur est
   **copiable individuellement**.
3. **Étant donné** un montant déjà connu du système **quand** le guidage le présente **alors** il n'est jamais demandé en
   saisie.

**Ce que les cabinets veulent qu'on leur valide** (salle du 2026-11-19, V3) :

4. **Étant donné** un dépôt sur le GUDEF **quand** le guidage s'affiche **alors** le geste principal est le téléversement
   d'**un seul fichier** : aucune des 92 feuilles n'est à ressaisir.
5. **Étant donné** une déclaration du mois sur dimana **quand** le guidage s'affiche **alors** les valeurs suivent l'ordre
   des champs du formulaire, chacune copiable en un geste, **et** l'entreprise et le dirigeant ont chacun leur guidage.

**Fini quand** (plan §4, n° 9) : salle des cabinets V3 — les valeurs dans l'ordre du formulaire, copiables.

Le plan du lot (§8) ne porte que des gestes de l'utilisateur. Les « cinq écarts du cabinet » (CH-P2 → CH-P6,
`PLAN-FEVRIER-2027-TOUT-CHARGE-2026-11-14.md` §8) ne sont pas placés et **ne concernent pas 332**. Le plus proche est
CH-P2 (l'espace de la PME cliente), mais le guidage sert le collaborateur du cabinet, pas le client.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `6e9fbbe`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| Le dépôt engagé (330) | `{ depotId, obligationId, dossierId, numero, empreinte, canal, format, mode, statut ENGAGE\|REMPLACE, remplacePar }` ; `perime` à la lecture | `domain/depot/depot-declaration.ts`, `application/depots/depots-declaration.service.ts` |
| L'estampille et son contenu (330, 331) | `estampilleEtContenu` : la version scellée si elle l'est, sinon le contenu courant | `application/depots/declarations-en-portee.ts` |
| Les deux natures de format (331) | `TELEVERSEMENT_FICHIER` (`manifeste.json` : `TG × DSF` 1.3, le GUDEF) et `SAISIE_FORMULAIRE` (`manifeste-formulaires.json` : `TG × TVA` 1.0, dimana) ; `natureDe(reference)` | `modules/paquets-depot/registre-paquets-depot.ts`, `assets/` |
| Le formulaire rempli (331) | `valeursDuFormulaire(paquet, contenu)` : une fonction pure, les champs dans l'ordre, chaque valeur une chaîne prête à coller (`rang`, `code`, `libelle`, `type`, `valeur`) | `domain/paquets-depot/valeurs-formulaire.ts` |
| Le canal de chaque format (536, 331) | `canal: { type, adresse, source }` dans les deux contrats | `contrat-paquet-depot.ts`, `contrat-formulaire-depot.ts` |
| Le redevable (563, C) | `obligation.redevableId` : `entreprise` (`REDEVABLE_ENTREPRISE`) ou l'identifiant d'une personne physique du dossier | `domain/obligations/derivation.ts`, `domain/redevables/redevable.ts` |

**Ce qui manque** : rien ne dit **comment** déposer. Le dépôt engagé nomme sa version et son format, le formulaire rend ses
valeurs, mais aucune donnée ne décrit les gestes à faire sur le portail ni leur ordre. Rien non plus ne relie une étape aux
valeurs qu'elle reporte.

## Ce que la story livre

1. **Le guidage décrit comme une donnée du paquet de dépôt.** Un troisième manifeste, `manifeste-guidages.json`, publie
   un paquet de guidage par format guidé. Ses étapes sont ordonnées, et chacune porte un geste d'une liste fermée. Une
   étape de saisie nomme les champs du formulaire qu'elle reporte, par leur `code`. Le paquet est vérifié par sha256,
   comme les autres (D-332-2 → 4).
2. **Les deux guidages du « fini quand »** :
   - `TG × TVA` (dimana) : se connecter avec le compte du redevable, ouvrir la déclaration du mois, reporter les trois
     valeurs dans l'ordre du formulaire, vérifier, valider, relever l'accusé ;
   - `TG × DSF` (GUDEF) : se connecter, ouvrir le dépôt de l'exercice, **téléverser un seul fichier**, vérifier, valider,
     relever l'accusé.
   Les deux sont en `statut: 'amorce'` (Q-D-29).
3. **Le guidage d'un dépôt engagé** — `GET /api/v1/depots-declaration/{depotId}/guidage`. Il rend les étapes dans
   l'ordre du paquet. Chaque étape de saisie porte ses valeurs, celles du formulaire rempli de 331, une par une, prêtes à
   copier. L'étape de téléversement désigne le fichier à téléverser par son estampille. La réponse nomme le redevable
   (D-332-5 → 8).
4. **La garde de build** : un guidage incomplet ou incohérent avec le format qu'il guide casse `npm run build` en
   nommant son champ. C'est le cas d'un champ du formulaire oublié ou déplacé, d'un deuxième fichier, ou d'une étape de
   saisie dans un guidage de téléversement (D-332-4).

## Décisions

- **D-332-1 — Ce que 332 reprend sans le réécrire.** Ce que 332 lit tel quel :
  - le dépôt engagé et sa lecture (330) : `registre.trouver`, `estPerime`, la portée par `DeclarationsEnPortee` ;
  - l'estampille et le contenu qu'elle couvre (`estampilleEtContenu`) ;
  - le formulaire rempli (`valeursDuFormulaire`, 331), appelé tel quel : le guidage n'a aucun chemin de lecture des
    valeurs qui lui soit propre ;
  - la nature d'un format (`natureDe`, 331) ;
  - le registre et ses gardes d'intégrité (536).

  Aucune route existante ne change, aucun format n'est touché : `tg-dsf-*.json`, `tg-tva-1.0.json` et les deux
  manifestes restent **intacts d'un octet**.
- **D-332-2 — Le guidage est un paquet à part, qui guide un format.** Il vit dans `modules/paquets-depot/assets/`, publié
  par un troisième manifeste (`manifeste-guidages.json`, même forme d'entrée : `pays`, `etat`, `version`, `checksum`,
  `locator`, `actif`). ⚡ Il est séparé du format parce qu'ils ne changent pas pour les mêmes raisons :
  - le parcours d'un portail change quand ses écrans changent ;
  - le format change quand la loi change.

  ⛔ Écarté : un bloc `guidage` dans les paquets de format. Il ferait passer le GUDEF en `TG × DSF` 1.4 pour un écran du
  portail. Or le classeur de 537 porte sa version dans ses propriétés, et la chaîne de 538 l'enregistre : chaque classeur
  déjà produit en 1.3 changerait alors de version de format pour une raison qui n'est pas un format. Le contrat strict de
  331 aurait aussi dû changer, alors que 561 y attend son bloc `automatisation`.
- **D-332-3 — Le contrat d'un paquet de guidage** (strict : une clé inconnue est refusée).
  `{ pays, etat, version, statut, guide: { nature, versions[] }, source, etapes: [{ code, libelle, geste, consigne,
  champs? }] }`.
  - `(pays, etat)` : le couple du format guidé ; `guide.nature` : sa nature (`TELEVERSEMENT_FICHIER` ou
    `SAISIE_FORMULAIRE`) ; `guide.versions` : les versions du format que ce guidage sait guider (au moins une).
  - `statut` : le vocabulaire de 536 (`certifie`, `a-valider-par-expert`, `amorce`).
  - `source` : `{ document, reference, date }`, la citation du relevé, comme pour les autres paquets.
  - `etapes[]` : l'ordre du tableau est l'ordre du parcours. `code` suit le motif `^[a-z][a-zA-Z0-9]{0,39}$` et est
    unique. `libelle` et `consigne` sont des textes non vides, des **données** qui peuvent nommer le portail.
  - `geste` : une liste fermée — `SE_CONNECTER`, `OUVRIR`, `SAISIR_VALEURS`, `TELEVERSER_FICHIER`, `VERIFIER`,
    `SOUMETTRE`, `RELEVER_ACCUSE`. ⛔ **Aucun geste ne demande une valeur à l'utilisateur** : une valeur ne vient que d'un
    champ du formulaire, rempli par le produit. C'est ainsi que se tient AC-3.
  - `champs` : exigé (non vide) sur `SAISIR_VALEURS`, interdit sur les autres gestes ; ce sont les `code` des champs du
    formulaire.
- **D-332-4 — Les règles d'un guidage, tenues au build et à la lecture** (un refus nomme le champ en cause).
  - Pour un **fichier** : exactement **une** étape `TELEVERSER_FICHIER`, aucune `SAISIR_VALEURS`. C'est AC-4, « un seul
    fichier, rien à ressaisir ».
  - Pour un **formulaire** : aucune `TELEVERSER_FICHIER`, au moins une `SAISIR_VALEURS`. **Les `champs` de toutes les
    étapes de saisie, mis bout à bout, sont exactement les `code` du formulaire, dans son ordre et une fois chacun**, pour
    chaque version guidée. C'est AC-5, « l'ordre des champs du formulaire » : un champ oublié, répété ou déplacé est
    refusé.
  - `RELEVER_ACCUSE` : exactement une fois, **en dernier**. Le parcours finit sur la preuve, que 333 consigne.
  - Au build : le couple du guidage est publié dans le manifeste de sa nature, chaque version de `guide.versions` y est
    publiée, et deux guidages actifs ne guident jamais la même version d'un même format (`PAQUET_DEPOT_AMBIGU`).
  - À la lecture, un guidage incomplet est refusé : `422 GUIDAGE_INCOMPLET` (`details.champ` : le chemin dans le paquet,
    ex. `etapes[2].champs`), jamais servi. Les octets altérés restent `PAQUET_DEPOT_INTEGRITE` (536).
- **D-332-5 — Le guidage d'un dépôt engagé.** `GET /api/v1/depots-declaration/{depotId}/guidage`, droit `deposer`
  (celui qui est guidé est celui qui dépose ; la réponse porte les montants déclarés). La route est gardée au niveau de la
  classe, comme la lecture de 330. Ordre :
  1. le dépôt, sous la portée : `404 DEPOT_INTROUVABLE`, comme la lecture, y compris hors de la portée ;
  2. s'il a été relayé : `409 DEPOT_REMPLACE` (`{ remplacePar }`) — on guide le dépôt en vol, jamais l'ancien ;
  3. la déclaration doit être active : `409 OBLIGATION_DESACTIVEE` ;
  4. son estampille doit être celle du dépôt engagé : sinon `409 LIVRABLE_PERIME` (`{ numero, empreinte }` courants),
     le même refus qu'à l'engagement. On ne guide jamais vers des valeurs qui ne sont plus celles de la déclaration ;
  5. le format engagé : `null` ⇒ `422 FORMAT_DE_CANAL_NON_DECLARE` (`{ champ: 'gabarit', canal }`, le refus de 330) ;
  6. le guidage du format : le guidage actif qui guide cette version du format, sinon `422 GUIDAGE_NON_DECLARE`
     (`{ champ: 'guidage', pays, etat, version }`) ;
  7. pour un formulaire, ses valeurs : `valeursDuFormulaire` sur **la version du format engagée** et sur le contenu de
     l'estampille. Les refus de 331 (`VALEUR_DE_CANAL_ABSENTE`, `VALEUR_DE_CANAL_HORS_CONTRAINTE`) passent tels quels.

  Rien n'est écrit : aucun acte, aucun fait, aucun stockage.
- **D-332-6 — La réponse** (200 JSON) :
  `{ depotId, obligationId, dossierId, redevable: { id, nature }, taxe, periode, nature, format: { pays, etat, version,
  checksum }, guidage: { pays, etat, version, checksum, statut }, canal: { type, adresse }, estampille: { numero,
  empreinte }, etapes: [{ rang, code, libelle, geste, consigne, valeurs, fichier }] }`.
  - `valeurs` : pour une étape `SAISIR_VALEURS`, les champs qu'elle reporte, dans l'ordre : `[{ rang, code, libelle,
    type, valeur }]`. `rang` est le rang dans le formulaire, et `valeur` la chaîne à coller telle quelle (D-331-12), ou
    `null` pour un champ facultatif que la déclaration ne tient pas (le portail le laisse vide). Pour les autres étapes,
    `valeurs` vaut `null`.
  - `fichier` : pour l'étape `TELEVERSER_FICHIER`, `{ format, numero, empreinte, periode }`, c'est-à-dire le fichier
    dont les propriétés portent cette version et cette empreinte (D-330-4), à produire par `POST
    /livrables-declaration/{obligationId}` ; `null` ailleurs.
  - **Chaque valeur est copiable individuellement (AC-2)** : une valeur par entrée, déjà mise en forme, sans séparateur
    ni unité à retirer. Le bouton « copier » est un geste d'écran : FE-081 (A).
- **D-332-7 — AC-3 tient par construction.** Le contrat n'a aucun geste qui demande une valeur, et la réponse n'a aucun
  champ de saisie. Chaque valeur montrée vient du contenu déclaré, par la fonction de 331. La garde de D-332-4 assure
  qu'aucun champ du formulaire n'est oublié : un champ que le guidage ne montrerait pas serait un champ que
  l'utilisateur devrait remplir seul. Les lignes du formulaire réel que le produit ne tient pas encore (Q-D-28) ne sont
  pas des montants connus du système : la consigne de l'étape de saisie dit qu'elles se remplissent sur le portail.
- **D-332-8 — L'entreprise et le dirigeant ont chacun leur guidage (AC-5).** Un dépôt engagé est celui d'une obligation,
  et une obligation appartient à un seul redevable (563). Le guidage nomme ce redevable : `redevable: { id, nature }`,
  où `nature` vaut `ENTREPRISE` quand `redevableId` est `entreprise`, et `PERSONNE_PHYSIQUE` sinon. L'étape
  `SE_CONNECTER` dit de se connecter **avec le compte de ce redevable**. Un dossier qui dépose pour l'entreprise et pour
  son dirigeant a donc deux dépôts engagés et deux guidages ; aucun ne mêle les valeurs de l'autre.
  - ⛔ L'identifiant fiscal du redevable n'est pas dans la réponse. Il n'est pas une valeur du formulaire, et l'accès au
    portail relève du coffre des secrets (560). La réponse ne nomme le redevable que par son identifiant interne.
  - ⚠️ Les déclarations propres du dirigeant n'ont pas encore de format. La retenue d'IRPP est sans canal nommé au paquet
    fiscal (« → C : canal de la retenue d'IRPP — ouverte », D-331-9). Le guidage d'une telle déclaration répond donc
    `FORMAT_DE_CANAL_NON_DECLARE`. Il viendra par donnée seule, en ajoutant un format et son guidage.
- **D-332-9 — L'exercice de la liasse (reste de D-330-5).** Le dépôt engagé ne nomme pas la liasse figée dont le classeur
  a été produit : rien ici ne peut donc la comparer à l'obligation. Le guidage du GUDEF donne la `periode` de la
  déclaration dans l'étape du fichier, et son étape `VERIFIER` demande de contrôler, avant d'envoyer, que l'exercice
  affiché par le portail est bien celui-là. La vérification automatique reste ouverte : elle demande que l'engagement
  nomme la liasse, ce qui changerait le contrat de 330. Elle sera revue au premier dépôt réel (1102).
- **D-332-10 — 332 ne dépose pas.** Le guidage se lit : il ne fait passer aucune obligation à « Déposée ». Ce passage reste
  la porte de C, `CycleObligationsService.transitionner` (accord du client, scellement de la version, D-324-7). Il reste
  aussi un geste séparé de l'engagement (D-330-7, Q-D-27). L'accusé arrive par 333.
- **D-332-11 — AD-12.** Le contrat du guidage (`domain/paquets-depot/contrat-guidage-depot.ts`), le guidage d'un dépôt
  (`domain/depot/guidage-depot.ts`) et son cas d'usage (`application/depots/guidage-depot.service.ts`) sont dans le
  périmètre de la garde (D-330-12) : aucun nom de pays, de portail ni de guichet, commentaires compris. Les paquets
  `tg-*-guidage-*.json` sont des données : ils nomment dimana et le GUDEF.
- **D-332-12 — Pour 561.** Les étapes ont un `code` stable, et leurs valeurs sont adressées par le `code` des champs. Le
  connecteur suivra le même parcours en automatique, sans qu'aucune étape ne soit réécrite.

## Contrat (annoncé avant le code)

| | |
| --- | --- |
| **Route neuve** | `GET /api/v1/depots-declaration/{depotId}/guidage` — droit `fiscalite:declaration:deposer` |
| Réponse 200 | `{ depotId, obligationId, dossierId, redevable: { id, nature: 'ENTREPRISE' \| 'PERSONNE_PHYSIQUE' }, taxe, periode, nature: 'TELEVERSEMENT_FICHIER' \| 'SAISIE_FORMULAIRE', format: { pays, etat, version, checksum }, guidage: { pays, etat, version, checksum, statut: 'certifie' \| 'a-valider-par-expert' \| 'amorce' }, canal: { type, adresse }, estampille: { numero, empreinte }, etapes: [{ rang, code, libelle, geste: 'SE_CONNECTER' \| 'OUVRIR' \| 'SAISIR_VALEURS' \| 'TELEVERSER_FICHIER' \| 'VERIFIER' \| 'SOUMETTRE' \| 'RELEVER_ACCUSE', consigne, valeurs: [{ rang, code, libelle, type: 'MONTANT' \| 'PERIODE', valeur: string \| null }] \| null, fichier: { format: { pays, etat, version, checksum }, numero, empreinte, periode } \| null }] }` |
| Refus | `400` (identifiant) · `404 DEPOT_INTROUVABLE` · `409 DEPOT_REMPLACE` (`{ remplacePar }`) · `409 OBLIGATION_DESACTIVEE` · `409 LIVRABLE_PERIME` (`{ numero, empreinte }`) · `422 FORMAT_DE_CANAL_NON_DECLARE` (`{ champ, canal }`) · `422 GUIDAGE_NON_DECLARE` (`{ champ: 'guidage', pays, etat, version }`) · `422 GUIDAGE_INCOMPLET` (`{ champ }`) · `422 FORMAT_DE_CANAL_INCOMPLET` (`{ champ }`) · `422 VALEUR_DE_CANAL_ABSENTE` · `422 VALEUR_DE_CANAL_HORS_CONTRAINTE` · `502 PAQUET_DEPOT_INTEGRITE` · `502 VERSION_SCELLEE_INTROUVABLE` · `503 SERVICE_AMONT_INDISPONIBLE` |
| **Données** | `modules/paquets-depot/assets/manifeste-guidages.json`, `tg-tva-guidage-1.0.json`, `tg-dsf-guidage-1.0.json` (neufs) ; `manifeste.json`, `manifeste-formulaires.json`, `tg-dsf-*.json`, `tg-tva-1.0.json` intacts |
| **Stockage** | aucun changement ; **aucune migration** |
| Aucun | topic, droit, acte du journal, champ d'une route existante, champ du paquet fiscal |

## Ce que cette story ne fait PAS

- ⛔ Elle ne fait passer aucune obligation à « Déposée » et ne touche pas la porte de C (D-332-10).
- ⛔ Elle ne change aucun format, aucune route de 330 ou 331, ni la chaîne de 538 (D-332-1).
- ⛔ Elle ne consigne aucun accusé (333) et ne branche aucun connecteur (561).
- ⛔ Elle n'invente aucun écran réel des portails : les deux guidages sont `amorce`, à relever au premier dépôt réel
  (Q-D-29).
- ⛔ Elle ne dessine pas l'écran : le bouton « copier » et l'affichage pas à pas sont FE-081 (A).

## Definition of Done

- [ ] Une TVA engagée sur `TELESERVICE_OTR` ⇒ son guidage `TG × TVA`, six étapes dans l'ordre du paquet, l'étape de
      saisie portant les trois valeurs du formulaire dans son ordre ; la même déposée ⇒ les valeurs de la version scellée
      (e2e, vrais paquets).
- [ ] Une DSF engagée ⇒ son guidage `TG × DSF` : une seule étape de téléversement, désignant le fichier par son
      estampille, et aucune valeur à reporter (e2e).
- [ ] Les refus de D-332-5, chacun par un test ; `perime` ⇒ `LIVRABLE_PERIME`, relayé ⇒ `DEPOT_REMPLACE`.
- [ ] La garde de D-332-4, au build et à la lecture : champ oublié, répété ou déplacé ; second fichier ; saisie dans un
      téléversement ; accusé absent ou pas en dernier ; version guidée non publiée ; ambiguïté — chacun refusé en
      nommant le champ.
- [ ] Deux dépôts du même dossier, l'un de l'entreprise et l'autre d'une personne physique ⇒ deux guidages, chacun avec
      son redevable et ses propres valeurs.
- [ ] La garde d'AD-12 verte sur le code neuf.
- [ ] **Mutations** qui rougissent sur une assertion.
- [ ] Node 24 : unitaires, e2e, `test:conformite` ; lint et `tsc` ; §1.5 : pile `grp-d` du fiscal (Redis compris) saine,
      la route neuve en `401` sans jeton.

## Questions au PO

- **Q-D-29 — Les écrans réels de dimana et du GUDEF : quelles étapes, dans quel ordre ?** Choix par défaut : deux
  guidages `amorce` de six étapes (se connecter, ouvrir, reporter ou téléverser, vérifier, valider, relever l'accusé).
  Ils seront relevés et complétés sur les portails au premier dépôt réel (1102). Changer une étape ne coûte qu'une
  version du paquet de guidage, sans code et sans toucher au format.

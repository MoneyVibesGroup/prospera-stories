# STORY-316 : Les échéances viennent du paquet — y compris le 30 avril des sociétés

Status: done — **livrée le 2026-11-25** : balance-service **#164** (`b78f500` sur `dev`, le paquet) et
prospera-fiscal-service **#62** (`f1296ae` sur `dev`, la dérivation) ; voir « Livraison ». Écrite le 2026-11-25 par la
session du groupe C (lot 6), contrat #873 avant le code.

**Epic :** EPIC-030 · **Points :** 5 · **FR :** FR-F18 · **NFR :** NFR-F04
**Services :** `prospera-fiscal-service` (la dérivation) ; `balance-service` (la source du paquet fiscal).
**Après :** STORY-305 et 307 (les échéances déjà dérivées du paquet), STORY-315.

## Histoire

En tant qu'**expert-comptable**, je veux que les dates limites viennent de la réglementation et non du code, afin qu'un
changement de loi de finances ne demande aucune livraison.

## Critères d'acceptation

1. **Étant donné** une société au réel **quand** ses acomptes sont générés **alors** leurs échéances tombent aux quatre
   dates du paquet (31/01, 31/05, 31/07, 31/10).
2. **Étant donné** une entreprise individuelle, une société, puis une banque **quand** l'échéance de dépôt annuel est
   calculée **alors** elle vaut respectivement 31/03, 30/04 et 31/05, toutes trois lues du paquet.
3. **Étant donné** le code du service **quand** on y cherche une date d'échéance en dur **alors** on n'en trouve aucune.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `0d353c2`, balance-service `8fbdf6e`)

- La dérivation (STORY-305, 307) lit déjà toutes ses dates dans le paquet : périodique (le jour du mois suivant),
  dates fixes (les quatre acomptes, `acomptesProvisionnels.echeances`), annuelle (`depot.echeances`). L'AC-1 tient.
- Le 31/03 (entreprise individuelle au TPU déclaratif, `REGIME_SYNTHETIQUE`) et le 31/05 (assurance et banque,
  `TYPE_ENTITE_ASSURANCE`) sont servis.
- **Le 30/04 des sociétés ne l'est pas** : l'échéance est publiée au paquet en `NON_CONSTATABLE`, parce qu'aucune donnée
  lue ne distinguait une société d'une entreprise individuelle au réel. La DSF d'une société au réel rend aujourd'hui
  `ECHEANCE_NON_CONSTATABLE`.
- La donnée existe : `GET /api/v1/dossiers/{id}` de `dossier-service` rend la `formeJuridique` (`SA`, `SARL`, `SAS`,
  `SUARL`, `EI`, `AUTRE`) de tout dossier, et le fiscal lit déjà ce dossier.

## Contrat annoncé avant le code (2026-11-25)

**Ajouts seuls**, sauf le mode de constatation d'une échéance du paquet, qui devient constatable.

### Le paquet dit quelles formes juridiques sont des sociétés

- Dans la source du paquet Togo 2026, l'échéance `societe` de `depot.echeances` passe de `NON_CONSTATABLE` à
  **`FORME_JURIDIQUE`** et gagne **`formesJuridiques: ["SA", "SARL", "SAS", "SUARL"]`** ; sa note le dit.
- L'entrée `DSF` du réel (`ENTREPRISE`) du catalogue lit sa date sur cette échéance, et gagne la condition **`formeJuridique:
  { ref: "depot.echeances", filtre: { modeConstatation: "FORME_JURIDIQUE" }, champ: "formesJuridiques" }`** : la date ne
  s'applique qu'aux formes listées. Le schéma et la règle R9 du validateur l'acceptent ; les artefacts se régénèrent, et
  l'empreinte change.

### La dérivation lit la forme juridique

- Le fiscal lit la `formeJuridique` du dossier dans `GET /api/v1/dossiers/{id}` (jeton de l'appelant), au moment de
  dériver. Une entrée qui porte la condition :
  - forme dans la liste ⇒ la date du paquet (30/04 pour Togo 2026) ;
  - forme hors de la liste (`EI`, `AUTRE`) ⇒ `ECHEANCE_NON_CONSTATABLE`, détail `FORME_JURIDIQUE_HORS_LISTE` (une
    entreprise individuelle au réel n'a pas de date publiée au paquet ; jamais celle des sociétés) ;
  - forme illisible ou dossier muet ⇒ `ECHEANCE_NON_CONSTATABLE`, détail `FORME_JURIDIQUE_INCONNUE`. Jamais une date par
    défaut.

### Aucune date en dur

- Un test de garde parcourt `src/` (hors tests et hors commentaires) et refuse toute date `JJ-MM` ou `JJ/MM` écrite dans
  le code. Ce qu'il trouve aujourd'hui est corrigé ou justifié dans la livraison.

### Livraison (2026-11-25)

- **balance-service** (#164) : l'échéance `societe` passe en `FORME_JURIDIQUE` avec `formesJuridiques`, l'entrée `DSF`
  du réel porte la condition `formeJuridique`, le schéma et la règle R9 du validateur l'acceptent ; artefact régénéré,
  empreinte **`5c683d163ecd57c6e6c8cf77666c0e9ba5f92b4e92fe4e4d10f4f7d2a69c149b`** (« dix-huitième fois »). Le moteur de
  balance-service lit un mode inconnu comme `NON_CONSTATABLE` : son calcul ne change pas.
- **fiscal** (#62) : `catalogue.ts` lit la condition, `derivation.ts` l'applique, `deriver-obligations.service.ts` lit la
  forme juridique du dossier (une fois par dérivation, et seulement si une entrée applicable la demande),
  `interpreterDossier` la lit strictement, la garde `aucune-date-en-dur.spec.ts`. Codé par une sous-session ; paquet,
  revue, preuves et gate par C.
- **Les AC en tests, sur le vrai paquet** : acomptes d'une société au réel au 31/01, 31/05, 31/07, 31/10 ; dépôt annuel
  d'une EI au TPU déclaratif au 31/03, d'une SARL au réel au 30/04 (SA, SAS, SUARL de même), d'une assurance au 31/05 ;
  EI et `AUTRE` au réel non constatables (`FORME_JURIDIQUE_HORS_LISTE`) ; forme absente ou illisible
  (`FORME_JURIDIQUE_INCONNUE`). **La garde AC-3 ne trouve aucune date `JJ-MM` ni `JJ/MM` dans le code** (hors
  commentaires) ; sa liste de tolérances est vide.
- **Preuves** (Node 24) : balance-service unitaires **5536** (7 suites tombées sous la charge, rejouées seules : 168/168),
  e2e **36/36, 1973** ; fiscal unitaires **2739** (4 suites tombées sous la charge, rejouées seules : 141/141, dont une
  suite de temps rejouée deux fois), e2e **11/11, 231**, `test:conformite` **16/16, 102/102** ; mutation **4/4** (forme
  hors liste datée, forme inconnue datée, condition ignorée, date en dur ajoutée) ; gate `grp-c` : `fiscal-service`
  `healthy`, la route de dérivation en `401` sans jeton.
- **Pas prouvé sur la pile** : la lecture réelle de `formeJuridique` dans un vrai `dossier-service` (doublure dans les
  e2e ; le champ est requis dans `DossierResponseDto` de dossier-service, relu dans son code).

### Écarts au contrat, décidés au code

- **D-316-5** : seule l'implantation principale reçoit la forme du dossier ; une implantation étrangère reçoit
  `FORME_JURIDIQUE_INCONNUE` sans lecture (la forme du dossier ne qualifie pas une implantation dans un autre pays).
- **D-316-6** : `DossierDeclarant` gagne `formeJuridique` (`null` si absente ou illisible, sans rejeter le dossier : les
  dépôts et les livrables le lisent aussi).
- **D-316-7** : le test « la DSF au réel (30/04 publié `NON_CONSTATABLE`) » devient « sans forme juridique lue :
  `FORME_JURIDIQUE_INCONNUE` ».
- **D-316-8** : la dérivation n'a qu'un chemin, `POST /exercices/{id}/obligations/derivation`, avec le jeton de
  l'appelant. Une dérivation déclenchée sans jeton (la file d'AD-18, à venir) devra fournir un jeton de service, ou
  rendra `FORME_JURIDIQUE_INCONNUE`.
- **D-316-9** : les formes se comparent exactement ; la normalisation (espaces, majuscules) se fait à la lecture du
  dossier.

### Décisions prises au contrat (contestables)

- **D-316-1** : la forme juridique se lit à la dérivation par HTTP (le dossier est déjà lu), pas dans la réplique des
  dossiers : `dossier-service` ne la publie sur ses événements que pour le dossier propre du cabinet (STORY-1073).
- **D-316-2** : la liste des sociétés est une donnée du paquet, pas du code : un pays qui classe autrement ses formes
  juridiques le dira dans son paquet.
- **D-316-3** : « une banque » de l'AC-2 est le type d'entité `ASSURANCE` (« assurance / banque » au paquet) : il n'y a
  pas de type d'entité `BANQUE`. Une IMF (`MICROFINANCE`) reste `DATE_LIMITE_INDETERMINABLE`, comme le paquet le veut.
- **D-316-4** : une entreprise individuelle **au réel** reste sans date : le 31/03 du paquet est celle du TPU
  déclaratif (régime synthétique). Nommé pour être confirmé par un fiscaliste.

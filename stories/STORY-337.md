# STORY-337 : Le rapprochement des pièces justificatives, à la granularité annoncée — la part non documentée d'un montant, chiffrée par compte et par période

Status: in-progress (2026-11-27 — fiche écrite et contrat annoncé avant le code ; lot 7 de D, n° 14)
Écrite le 2026-11-27 par la sous-session du groupe D juste avant de coder (lot 7 de D, n° 14,
`PLAN-LOT-7-2026-11-24.md` §4). Il n'existait pas de fiche : les critères viennent d'`epics-fiscalite-2026-08-03.md`
(EPIC-032), de la place laissée par 336 (D-336-9) et du contrat de 338 de C (« Pour STORY-337 (D) »).

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle (chaîne 330 → 337)
**Points :** 5 · **Service :** `fiscal-service` (`:3012`), dossier de D `depots` (D-L7-1)
**FR :** `FR-F53` *(le rapprochement annonce sa granularité)* · FR-F54 *(la liaison écriture ↔ pièce, 338)* · AD-12
*(aucun nom de pays, de portail ni de guichet dans le domaine)* · AD-14 *(le fiscal ne lit jamais la valeur de
provenance d'une balance)*
**Dépend de :** **STORY-336** ✅ (fiscal #87, `dev` `a991963` : `GET /api/v1/dossiers-controle`, `rapprochementPieces:
null`) · **STORY-338** de C ✅ (comptabilité #21, `dev` `58803f5` : `GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/pieces/justification`)
· de C, en lecture : 329 (le chemin d'un montant : les comptes que le moteur nomme, le journal et ses pièces), le
read-model `exercices_dossier` (539).

## Histoire

En tant qu'**expert-comptable**, je veux savoir quelle part d'un montant n'est pas documentée, afin de la traiter avant
le contrôle. *(FR-F53)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-032)

1. **Étant donné** un montant déclaré **quand** le rapprochement s'exécute **alors** la part non documentée est chiffrée
   au niveau du compte et de la période.
2. **Étant donné** ce résultat **quand** il est restitué **alors** la granularité est **annoncée explicitement** — compte
   et période, pas facture individuelle.
3. **Étant donné** aucune pièce rattachée **quand** le rapprochement s'exécute **alors** le résultat le dit, plutôt que de
   rendre zéro.

Et ce que 338 (C) a promis : avec la liaison, le rapprochement **descend à la pièce** (AC-2 de 338) ; sans elle, il
**retombe sur le compte × la période sans échouer** (AC-3 de 338).

## Diagnostic (lu sur `origin/dev`, fiscal `dae6a10` ; comptabilité `58803f5`)

Recherche « rapprochement », « pièce justificative », « justification », « documenté » dans les fiches et le code du
fiscal : **aucun rapprochement des pièces n'existe**. Les « rapprochements » du code sont d'autres choses : la liasse ↔
la balance (`rapprochement-liasse.ts`, C), le rapprochement annuel du paquet (`rapprochementAnnuel`), le règlement (342,
C, à venir). Ce qui existe, morceau par morceau :

| Ce que 337 demande | Ce qui existe déjà | Couvert ? |
|---|---|---|
| La place dans le dossier de contrôle | 336 (D) : chaque obligation porte `rapprochementPieces: null` (D-336-9) | Réservée, vide. |
| Les comptes d'une obligation | 329 (C) : l'étape `balance` du chemin rend `comptes: [{ grandeur, compte }]`, **les comptes que le moteur nomme** ; le moteur de `balance-service` les lit dans le paquet (`tva.declaration.comptes` : `collectee` `443`, `deductible` `445`). Le chemin est déjà lu par le dossier de contrôle. | Pour la TVA, oui (deux préfixes). Pour les autres taxes, **le moteur n'en nomme aucun** et le catalogue du paquet ne relie aucune obligation à ses comptes (voir D-337-2, Q-D-35). |
| La période | L'obligation porte `periode` (`AAAA-MM`, `AAAA-Tn`, `AAAA`, `AAAA-En`) ; aucune règle n'en tire des bornes de dates. | Non. |
| L'exercice de la comptabilité | La comptabilité nomme l'exercice par l'identifiant de `dossier-service` ; le fiscal en garde les bornes réelles dans le read-model `exercices_dossier` (539, C), lu par les échéances. | Le read-model existe ; aucune lecture « l'exercice qui couvre une période ». |
| Le rapprochement à la pièce | 338 (C) : la route de la justification (validées seules, préfixes, `mouvements` / `documente` / `aNouveaux` / `nonDocumente`, pièces) ; jeton du membre. | Côté comptabilité, oui ; **aucun appel du fiscal**. |
| Le repli compte × période | 338 : `granularite: COMPTE_PERIODE` et sa raison quand l'exercice n'est pas tenu au journal ici ; 329 : le journal du chemin (les lignes des cahiers que le moteur a agrégées, **chacune avec sa pièce ou sans**, D-329-6). | Les deux morceaux existent ; personne ne les assemble ni ne chiffre la part sans pièce. |

**Diagnostic** : 337 n'est **pas** couverte ; elle **assemble** et **chiffre**. Il manque (1) les comptes et la période
de chaque obligation, tirés de ce que le chemin publie déjà, (2) l'exercice qui couvre la période, (3) un adaptateur de
la route de 338 qui **n'échoue jamais** et nomme chaque repli, (4) le chiffrage de la part non documentée par compte, à
la pièce quand la comptabilité la rend, au compte × période sinon, et (5) son statut, qui ne confond jamais « aucune
écriture » avec « tout est documenté ». Aucun fichier de C n'est touché.

## Ce que la story livre

Dans `GET /api/v1/dossiers-controle` (336), **`rapprochementPieces`** de chaque obligation n'est plus `null` :

```
rapprochementPieces: {
  granularite: 'PIECE' | 'COMPTE_PERIODE',          // annoncée, toujours
  raison: null | RaisonDuRepli,                       // null si et seulement si PIECE
  codeAmont: string | null,                           // le code d'un refus de la comptabilité, s'il en a la forme
  message: string | null,                             // en clair : pourquoi ce repli, et ce qu'il faut faire
  statut: 'DOCUMENTE' | 'PARTIELLEMENT_DOCUMENTE' | 'NON_DOCUMENTE' | 'AUCUNE_ECRITURE' | 'NON_CHIFFRE',
  source: 'COMPTABILITE' | 'PROVENANCE_DE_LA_BALANCE' | null,   // d'où viennent les chiffres ; null : rien de chiffré
  exerciceId: string | null, periode: { du, au } | null, devise: string | null,
  comptes: [{
    compte, grandeurs: [string],
    statut: 'DOCUMENTE' | 'PARTIELLEMENT_DOCUMENTE' | 'NON_DOCUMENTE' | 'A_NOUVEAUX_SEULS' | 'AUCUNE_ECRITURE' | 'NON_CHIFFRE',
    mouvements, documente, aNouveaux, nonDocumente: { debit, credit, lignes } | null,
    pieces: [{ source: DOSSIER | GED, pieceId, documentId, type, gedVersion, nature: DOCUMENT | CLOTURE, debit, credit, lignes, ecritures }]
  }]
}
```

## Décisions

- **D-337-1 — Où vit le rapprochement.** Dans le dossier de contrôle, à la place que 336 a laissée (D-336-9) : une
  obligation, un rapprochement. Aucune route neuve : le contrôleur et le cabinet le lisent avec le reste. Le domaine
  (`domain/depot/rapprochement-pieces.ts`, pur) et le cas d'usage (`application/depots/rapprochement-pieces.service.ts`)
  sont dans le dossier `depots` de D, sous la garde d'AD-12 ; les deux ports neufs y entrent aussi.
- **D-337-2 — Les comptes couverts : ceux que le chemin publie, rien d'inventé.** Les comptes d'une obligation sont ceux
  de l'étape `balance` de son chemin (329) : le moteur de `balance-service` les nomme pour chaque grandeur en les lisant
  dans le paquet (`tva.declaration.comptes` : `443` pour la collectée, `445` pour la déductible). Ce sont des **préfixes**
  du plan : `443` couvre `4431`, `445` couvre `4452` (la règle de 338). Aucune table de comptes n'est écrite dans le
  fiscal. Une obligation dont le chemin ne nomme aucun compte (le moteur ne la chiffre pas, ou son montant est saisi par
  le cabinet, ou le chemin s'est arrêté avant la balance) rend `COMPTE_PERIODE`, raison **`COMPTES_NON_PUBLIES`**, statut
  `NON_CHIFFRE`, sans appeler la comptabilité. ⚠️ Le paquet publie d'autres comptes (`provisions.comptes` 891 / 441 pour
  l'impôt sur le résultat, `regimesImposition.synthetique_entreprenant_tpu.comptes` 641 / 441, `taxes.types[].compteComptable`
  pour les charges), mais **aucune entrée de `catalogueObligations` ne dit lesquels sont les siens** : les relier ici serait
  écrire une table. **Q-D-35** au PO, et une information à C (le paquet est à C, D-L7-3).
- **D-337-3 — La période.** Tirée de `periode`, par une règle pure : `AAAA-MM` → le mois ; `AAAA-Tn` → le trimestre ;
  `AAAA` → l'année civile. Une autre forme (`AAAA-En`, les dates fixes) : `COMPTE_PERIODE`, raison
  **`PERIODE_NON_DATEE`**, sans appel. Le montant rapproché est celui de la période de l'obligation ; pour la TVA, c'est
  la période dont le moteur a agrégé les lignes.
- **D-337-4 — L'exercice.** Celui de `dossier-service` (la comptabilité le nomme ainsi) dont les bornes réelles couvrent
  la période, lu dans le read-model `exercices_dossier` (539), **enregistré en lecture** dans `DepotsModule` : aucun
  fichier de `read-models/` ne change. Aucun exercice ne la couvre : `COMPTE_PERIODE`, raison **`EXERCICE_INCONNU`**,
  sans appel. Deux exercices la couvriraient : le plus récent.
- **D-337-5 — L'appel à la comptabilité.** `GET {COMPTABILITE_SERVICE_URL}/api/v1/dossiers/{dossierId}/exercices/{exerciceId}/pieces/justification?comptes=…&du=…&au=…`,
  **le jeton du membre** dans `Authorization` et nulle part ailleurs (comme le fiscal appelle `balance-service`), sans
  `devise` (la comptabilité la déduit ; plusieurs devises : `409 DEVISE_A_PRECISER`, un repli nommé), délai borné (celui
  des amonts, 10 s), corps borné, aucune redirection suivie. `COMPTABILITE_SERVICE_URL` (défaut
  `http://comptabilite-service:3420`, http(s) exigé, refus au démarrage sinon) est lue par un fournisseur de
  `DepotsModule` (patron du coffre de 560 et des jetons de service de 335) : **`config/` ne change pas**.
- **D-337-6 — Ne jamais échouer.** L'adaptateur ne lève jamais : toute issue est une lecture nommée, et le dossier de
  contrôle reste `200`. Chaque repli est `COMPTE_PERIODE` avec sa **raison** :

  | La comptabilité rend | `raison` | `codeAmont` |
  |---|---|---|
  | `200 PIECE` | — (`granularite: PIECE`) | `null` |
  | `200 COMPTE_PERIODE` | sa raison : `EXERCICE_TENU_AUX_CAHIERS`, `EXERCICE_NON_TENU_ICI` | `null` |
  | `403` (`COMPTABILITE_NOT_ENTITLED`, `DROIT_INSUFFISANT`…) | `COMPTABILITE_REFUSEE` | le code |
  | `404` (`DOSSIER_INTROUVABLE`, `EXERCICE_INTROUVABLE`) | `COMPTABILITE_INTROUVABLE` | le code |
  | `5xx`, `429`, délai dépassé, réseau | `COMPTABILITE_INDISPONIBLE` | le code s'il y en a un |
  | `400`, `409`, `422` (`COMPTES_MALFORMES`, `DEVISE_A_PRECISER`, `PERIODE_HORS_EXERCICE`…) | `DEMANDE_NON_SERVIE` | le code |
  | un corps hors du contrat de 338, trop gros, un compte demandé absent | `REPONSE_INVALIDE` | `null` |

  Seul le `code` d'un refus est lu (s'il a la forme `^[A-Z][A-Z0-9_]{2,63}$`) ; ni son message ni le reste ne sont
  recopiés. Une exception imprévue du cas d'usage est elle aussi un repli (`COMPTABILITE_INDISPONIBLE`) : le rapprochement
  d'une obligation ne fait jamais échouer le dossier.
- **D-337-7 — La granularité annoncée est celle de la réponse** (338). `PIECE` : les chiffres de la comptabilité tels
  qu'elle les rend (`source: COMPTABILITE`), pièce par pièce, **les à-nouveaux à part** (leur justificatif est l'exercice
  précédent).
- **D-337-8 — Le repli compte × période est chiffré quand il peut l'être (AC-1).** Quand la comptabilité ne descend pas à
  la pièce, la part non documentée se chiffre depuis **le journal du chemin** (329) : les lignes que le moteur a agrégées
  pour la période, chacune avec la pièce d'où elle est née ou sans (D-329-6, `pieceId` lu, jamais la valeur de provenance :
  AD-14). Par compte : `mouvements` (toutes), `documente` (avec une pièce), `nonDocumente` (sans) ; `aNouveaux: null` (le
  journal ne les distingue pas) ; `source: PROVENANCE_DE_LA_BALANCE`. Ce chiffrage n'a lieu que si le journal du chemin
  est **complet** (`RESTITUE`, non tronqué, aucune ligne non retrouvée) ; sinon, chaque compte est `NON_CHIFFRE` (ses
  totaux à `null`) et la raison du repli reste celle de la comptabilité : le résultat dit qu'il ne sait pas, jamais un zéro.
- **D-337-9 — Ce qui est documenté, ce qui ne l'est pas, et « aucune écriture » (AC-3).** Le statut d'un compte :
  `AUCUNE_ECRITURE` si aucune ligne ne le mouvemente (jamais « documenté ») ; `A_NOUVEAUX_SEULS` s'il n'a que des
  à-nouveaux ; `DOCUMENTE` si toutes ses lignes de la période sont couvertes ; `NON_DOCUMENTE` si aucune ne l'est (le cas
  « aucune pièce rattachée » : le résultat le dit, la part non documentée chiffrée) ; `PARTIELLEMENT_DOCUMENTE` entre les
  deux ; `NON_CHIFFRE` sans chiffre. Le statut d'ensemble suit la même règle sur les comptes chiffrés : `AUCUNE_ECRITURE`
  si aucun n'a de ligne de la période, `NON_CHIFFRE` si aucun n'est chiffré.
- **D-337-10 — Le coût.** Un appel par obligation qui nomme des comptes (une TVA mensuelle : un appel, deux préfixes), après
  son chemin, dans le lot de quatre de 336 (D-336-11). Aucune obligation sans compte n'appelle.
- **D-337-11 — Aucune écriture, aucune migration, aucun droit neuf.** Le rapprochement est une lecture, comme le dossier
  (D-336-3) ; l'empreinte du dossier le couvre. Le droit `comptabilite:dossier:consulter` du membre est vérifié par la
  comptabilité, pas par le fiscal (un 403 y est un repli nommé).

## Contrat (annoncé avant le code)

| | |
| --- | --- |
| **Champ changé** | `GET /api/v1/dossiers-controle` — `obligations[].rapprochementPieces` : `null` → l'objet ci-dessus (« Ce que la story livre »), **toujours présent**. Rien d'autre ne change dans la réponse ; l'empreinte du dossier le couvre. |
| Refus | inchangés (`400`, `403`, `404 DOSSIER_INTROUVABLE`, `422 PERIMETRE_TROP_LARGE`, `429`, `503`) : **aucun refus de la comptabilité ne remonte** |
| **Appel sortant neuf** | `GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/pieces/justification` de `comptabilite-service` (338, C), jeton du membre |
| **Variable neuve** | `COMPTABILITE_SERVICE_URL` (facultative, défaut `http://comptabilite-service:3420`) |
| Aucun | route, collection, index, migration, acte au journal, topic, droit ; aucun fichier de C |

## Ce que cette story ne fait PAS

- ⛔ Elle ne rattache aucune pièce (338, comptabilité) et n'écrit rien.
- ⛔ Elle n'invente aucun compte : sans compte publié, elle le dit (Q-D-35).
- ⛔ Elle ne lit pas la GED de B ni les octets d'une pièce : elle cite les pièces que la comptabilité ou la balance nomment.
- ⛔ Elle ne rapproche pas le règlement (342, C).

## Definition of Done

- [ ] TVA d'une période tenue au journal : `PIECE`, deux préfixes (`443`, `445`), la part documentée et la part non
      documentée par compte, les pièces, les à-nouveaux à part ; le jeton du membre transmis ; `du` et `au` du mois (e2e,
      contre une doublure HTTP de la route de 338).
- [ ] Le repli : `COMPTE_PERIODE` aux cahiers (chiffré depuis le journal du chemin), en `403`, `404`, `5xx`, délai
      dépassé, réponse invalide, sans compte publié, période non datée, exercice inconnu — le dossier reste `200`.
- [ ] « Aucune écriture » n'est jamais « documenté » ; « aucune pièce » rend `NON_DOCUMENTE` chiffré, jamais zéro.
- [ ] **MongoDB réel** (`test:conformite`) : l'exercice qui couvre une période (bornes incluses, cloisonnement par
      organisation et par dossier, le plus récent).
- [ ] La garde d'AD-12 verte (les deux ports neufs y entrent) ; **mutations** qui rougissent sur une assertion.
- [ ] Node 24 : unitaires, e2e, `test:conformite` ; lint et `tsc` ; §1.5 : `docker compose -p grp-d` du fiscal (Redis
      compris) sain, la route en `401` sans jeton, aucune dépendance manquante au démarrage.

## Questions au PO

- **Q-D-35 — Quels comptes rapprocher pour une obligation dont le moteur ne nomme pas les comptes ?** Aujourd'hui seule la
  TVA a ses comptes nommés (par le moteur, depuis `tva.declaration.comptes`). Le paquet publie aussi les comptes de
  l'impôt sur le résultat (`provisions.comptes`), de la TPU et des charges d'impôts (`taxes.types[].compteComptable`),
  mais aucune entrée du catalogue des obligations ne désigne les siens. **Choix par défaut** (D-337-2) : rien n'est
  inventé ; ces obligations rendent `COMPTE_PERIODE` / `COMPTES_NON_PUBLIES`. Si le PO veut les rapprocher : C ajoute au
  catalogue du paquet, pour chaque entrée, la référence de ses comptes (par exemple `comptes: { ref: "provisions.comptes" }`),
  et 337 les lira sans table dans le code.

# STORY-1138 : la liasse rapprochée de sa balance par l'empreinte des soldes (`soldes-v1`)

Status: done

**Plan :** `coordination/PLAN-LOT-7-2026-11-24.md` §4 bis (amendement du 26/11), n° **5a** · **Dépôt :**
`prospera-bilan-service` (tenu par D jusqu'au prochain plan ; `origin/dev` au départ : `4317dd2`, STORY-1075) · **Plage :**
groupe D, `STORY-1138 → 1141` (réservées le 26/11) · **Dépend de :** STORY-1078 ✅ (D-1078-10, le report), STORY-1022 (C)
✅ (balance-service#169, `dev` `d5878be`, annonce prospera-stories #927).
**Sources :** `stories/STORY-1078.md` (D-1078-1, D-1078-9 : les soldes lus ; **D-1078-10** : « lire l'empreinte publiée
par la balance, la recalculer sur les soldes du jeu avec le même algorithme et sa version — jamais un algorithme local —
et publier le constat à côté des quatre contrôles ») ; `stories/STORY-1022.md` (l'algorithme `soldes-v1`, ses deux
vecteurs, D-1022-1 → 6) ; `stories/STORY-381.md` (voie A′ : les soldes viennent du corps de la requête ; « Écartés » :
le rapprochement réel exige un `soldesChecksum`). **Code relu** : `prospera-balance-service` `origin/dev` `d5878be`
(`balance.checksum.ts` : `computeSoldesChecksumV1`, `verifierSoldesChecksum`, `empreinteDesSoldes` ; les deux mappers
d'événements) — lu, jamais touché ; bilan `origin/dev` `4317dd2` : `read-models/balance-payload.util.ts`,
`schemas/balance-balance.schema.ts`, `balances-dossier.repository.ts`, `balance.projection.service.ts`,
`kafka/events/balance-events.ts`, `bilan/analyse/`, `jeu-etats/` (provenance `balanceId` du jeu et du snapshot),
`instance-c13/plan-d-effacement.ts`, `plan-d-export.ts`.
**Rituel (2026-11-26) :** aucune demande neuve à D chez A, B et C ; 319 et 325 de C non fusionnées (le fiscal
`origin/dev` = `d41dbe6`) ; `bilan-service` : aucune PR ouverte, deux brouillons non suivis connus (`cr-map.txt`,
`cr-postes.txt`), laissés.

## Vérifié sur le code de C (avant de s'y fier)

- `computeSoldesChecksumV1(lignes)` = `sha256(JSON.stringify({ lignes: L }))`, `L` = lignes filtrées
  `soldeDebiteur !== 0 || soldeCrediteur !== 0`, triées par `compte` aux opérateurs `<` / `>` (tri stable de
  `Array.prototype.sort`), projetées `{ compte, soldeDebiteur, soldeCrediteur }` dans cet ordre de clés.
- `verifierSoldesChecksum(version, …)` rend `false` pour toute version autre que `'soldes-v1'` (jamais « au plus
  proche ») ; `empreinteDesSoldes` n'en publie aucune pour une balance scellée en `v1` ou sans `checksumVersion`.
- Les deux vecteurs, recalculés ici hors de tout service : `{"lignes":[{"compte":"101000","soldeDebiteur":0,"soldeCrediteur":150000},{"compte":"521000","soldeDebiteur":150000,"soldeCrediteur":0}]}`
  ⇒ `49c4d3b1e9532da78c8bb6aad3d025dbe704c3338e74bab2198af3c6140349d8` ; `{"lignes":[]}` ⇒
  `5e296cc6751191a82ddbd868691e714fe68c5ce679348d93d5590e425a6265b2`.
- La pièce manquante côté bilan : le read-model `balances_balance` ne garde que les champs qu'il déclare (Mongoose
  `strict`) et `versBalanceProjetable` ne recopie que les champs connus — l'empreinte publiée depuis `d5878be` est
  aujourd'hui **reçue et jetée**.

## « Fini quand » (plan)

« Les soldes se recalculent sous `soldesChecksumVersion` (`soldes-v1`, vecteurs de C) et se comparent à
`soldesChecksum` de `balance.created` / `balance.etat.document.change` ; une version inconnue donne un constat « non
vérifiable », jamais un recalcul local ; une balance v1 sans empreinte est dite telle. »

**Tenu ainsi (D-1138-1) :** la réponse d'analyse (`GET …/bilan/analyse`, `POST …/analyse/dry-run`) porte un bloc neuf
**`rapprochementBalance`**, toujours présent, à côté de `controlesIntegrite` : le statut du rapprochement, son motif,
la balance nommée, la version et la valeur publiées, la valeur recalculée, un message.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|---|---|---|
| AC-1 | Le contrat est annoncé avant le code (« ⚠ Contrats » du journal de D) : champs lus sur les deux topics, deux champs du read-model, bloc `rapprochementBalance` | PR de docs d'annonce, fusionnée avant le code |
| AC-2 | `balance.created` et `balance.etat.document.change` (`VALIDÉE` comme `REJETÉE`) : `soldesChecksum` et `soldesChecksumVersion` sont lus **ensemble ou pas du tout** ; une paire incomplète ou hors forme est ignorée **sans** faire rejeter le message ; le read-model les garde, et une transition qui ne les porte pas ne les efface pas | unitaires de `balance-payload.util` et de la projection |
| AC-3 | `soldes-v1` recalculé ici donne **les deux vecteurs de C**, écrits en dur ; il ne dépend ni de l'ordre des lignes ni des lignes 0/0 ; il change dès qu'un compte ou un solde change ; tri par point de code (`"A1" < "a1"`, jamais `localeCompare`) | spec pure |
| AC-4 | Empreinte publiée sous `soldes-v1` égale au recalcul ⇒ `CONCORDANT` ; différente ⇒ `DISCORDANT`, les deux valeurs publiées | spec pure ; spec du service |
| AC-5 | Version publiée inconnue ⇒ `NON_VERIFIABLE` (`VERSION_EMPREINTE_INCONNUE`), **aucun recalcul** (`soldesChecksumRecalcule: null`), la version et la valeur publiées rendues telles quelles | spec pure ; mutation |
| AC-6 | Balance scellée en `v1` (ou sans `checksumVersion`) sans empreinte ⇒ `SANS_EMPREINTE` (`BALANCE_SCELLEE_V1`) ; balance `v2` sans empreinte reçue ⇒ `SANS_EMPREINTE` (`EMPREINTE_NON_RECUE`) ; balance introuvable au read-model ⇒ `NON_VERIFIABLE` (`BALANCE_INTROUVABLE`) ; jeu sans balance (antérieur à STORY-381) ⇒ `NON_APPLICABLE` (`JEU_SANS_BALANCE`) ; `dry-run` ⇒ `NON_APPLICABLE` (`SOLDES_FOURNIS`) | spec pure ; spec du service |
| AC-7 | Les soldes comparés sont ceux de la liasse servie (D-1078-9) : ceux du jeu, ou ceux de la version figée demandée — et la balance est celle que **ce** document nomme (`balanceId` du jeu, ou du snapshot) ; lecture scopée à l'organisation **et** au dossier | spec du service |
| AC-8 | Bout en bout (vrai HTTP) : un jeu dont les soldes sortent de sa balance rend `CONCORDANT` ; un solde changé rend `DISCORDANT` ; une version inconnue `NON_VERIFIABLE` ; une balance `v1` `SANS_EMPREINTE` ; chaque réponse décrite exactement par le contrat OpenAPI | e2e `bilan-analyse`, `openapi-contract` |
| AC-9 | Rien d'autre ne change : `valide`, la batterie des contrôles de cohérence, la liasse, les quatre contrôles, le jeu et ses snapshots (aucun champ figé de plus), les plans C13 d'export et d'effacement (la collection y est déjà, ses deux champs la suivent) | suites existantes vertes ; invariants C13 |

## Contrat (annoncé avant le code)

- **Consommé, sans changement chez C** : `soldesChecksum` (chaîne) et `soldesChecksumVersion` (chaîne) sur
  `balance.created` et `balance.etat.document.change`, facultatifs, toujours ensemble.
- **Read-model `balances_balance`** (aucune collection neuve, aucune migration) : deux champs facultatifs
  `soldesChecksum`, `soldesChecksumVersion`, sans défaut ; un document projeté avant cette story ne les porte pas.
- **Réponse d'analyse**, bloc neuf toujours présent :

```
rapprochementBalance: {
  statut: 'CONCORDANT' | 'DISCORDANT' | 'NON_VERIFIABLE' | 'SANS_EMPREINTE' | 'NON_APPLICABLE',
  motif: null | 'VERSION_EMPREINTE_INCONNUE' | 'BALANCE_INTROUVABLE' | 'BALANCE_SCELLEE_V1'
             | 'EMPREINTE_NON_RECUE' | 'JEU_SANS_BALANCE' | 'SOLDES_FOURNIS',
  balanceId: string | null,                 // la balance que la liasse servie nomme
  balanceChecksumVersion: string | null,    // le sceau de la balance, tel que publié (null : non publié, vaut v1)
  soldesChecksumVersion: string | null,     // publiée, telle quelle
  soldesChecksumPublie: string | null,      // publiée, telle quelle
  soldesChecksumRecalcule: string | null,   // seulement sous une version connue
  message: string                           // affichable tel quel
}
```

`motif` est `null` pour `CONCORDANT` et `DISCORDANT`. Ajout seul : aucun champ, aucune route, aucune valeur existante ne
change ni ne disparaît.

## Décisions retenues par défaut (contestables)

- **D-1138-1 — Où.** Un bloc **à part**, `rapprochementBalance`, à côté de `controlesIntegrite` (D-1078-10 : « à côté
  des quatre contrôles ») et **non** une cinquième entrée de la liste : les quatre contrôles sont des règles comptables
  **déclarées et sourcées par le paquet** (D-1078-7), toujours quatre, dans un ordre fixe ; le rapprochement est un
  constat de **provenance** entre deux services, qu'aucun paquet ne déclare. Comme eux, c'est un **signal** : il ne
  touche ni `valide`, ni la batterie, ni le gate de dépôt, ni le contenu figé des versions.
- **D-1138-2 — L'algorithme est une copie du contrat de C, indexée par sa version** (`ALGORITHMES_EMPREINTE_SOLDES`,
  une seule entrée : `soldes-v1`), comme `balance-events.ts` copie les événements (une base et un dépôt par service :
  aucun import d'un autre dépôt). Ce n'est pas « un algorithme local » au sens de D-1078-10 : c'est celui que la
  version publiée nomme, tenu par les **vecteurs de C** écrits en dur dans la spec. Une version absente du registre
  n'est **jamais** recalculée « au plus proche » : `NON_VERIFIABLE`, `soldesChecksumRecalcule: null`.
- **D-1138-3 — L'empreinte publiée se lit au read-model `balances_balance`**, pas sur le jeu ni sur ses snapshots.
  Une balance ne change jamais de lignes pour un même `balanceId` (D-1022-4 : la version de soumission est figée sur
  le document) : son empreinte non plus. La figer sur le jeu ajouterait un champ au jeu **et** au snapshot
  (append-only, empreinte de contenu) et laisserait sans constat tous les jeux déjà créés. Le read-model garde les
  deux champs **sans défaut** : un `$set` d'une transition qui ne les porte pas ne les efface pas (patron de
  `depotLiasse`, STORY-453).
- **D-1138-4 — La paire se lit ensemble, ou pas du tout, et jamais en poison-pill** (patron du triplet de devise,
  STORY-490) : deux chaînes ; la version au motif `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`, la valeur en hexadécimal
  minuscule de 32 à 128 caractères (une version future peut changer de fonction de hachage ; la borne ferme la
  longueur). Hors forme, ou l'une sans l'autre : la paire est ignorée, le reste du message est projeté.
- **D-1138-5 — Les soldes comparés sont ceux de la liasse servie** (D-1078-9) et la balance est celle que **ce**
  document nomme : le jeu (`balanceId`, posé à la création, STORY-381) ou le snapshot de la version demandée (qui
  recopie la provenance du jeu). Lecture par `BalancesDossierRepository.parId` (organisation **et** dossier dans le
  filtre, STORY-381 AC-6).
- **D-1138-6 — Les statuts disent la raison, jamais un « OK » par défaut.** Ordre de lecture : jeu sans balance ⇒
  `NON_APPLICABLE` ; balance introuvable ⇒ `NON_VERIFIABLE` ; une empreinte publiée ⇒ recalcul sous sa version
  (`CONCORDANT` | `DISCORDANT`) ou `NON_VERIFIABLE` si la version est inconnue ; sans empreinte, sceau `v1` ou absent ⇒
  `SANS_EMPREINTE` / `BALANCE_SCELLEE_V1` (« une balance v1 sans empreinte est dite telle »), sinon
  `SANS_EMPREINTE` / `EMPREINTE_NON_RECUE`.
- **D-1138-7 — `EMPREINTE_NON_RECUE` couvre deux cas réels, et le message les nomme** : une balance publiée avant
  STORY-1022 (`d5878be`), ou projetée par un bilan antérieur à cette story (l'empreinte a été reçue et jetée). Une
  balance `VALIDÉE` est terminale : aucune transition ne la republiera. Le remède est un **rejeu des deux topics**
  (geste d'exploitation, « Ce qui reste »), pas un recalcul ici.
- **D-1138-8 — Ni tolérance, ni diagnostic ligne à ligne.** Les montants sont des entiers d'unités mineures : un écart
  n'est jamais un arrondi. Bilan ne tient pas les lignes de la balance (voie A′) : `DISCORDANT` dit que les soldes du
  jeu **ne sont pas** ceux de la balance nommée, pas lesquels ; le message renvoie à la balance et à un jeu recréé
  depuis elle.
- **D-1138-9 — Le compte tel que le jeu le porte, l'ordre stable du tri** : aucune normalisation (le DTO ne transforme
  pas `compte`), le même tri que C (`<` / `>`, stable). **Limite écrite** : deux lignes du **même** compte dans un ordre
  différent de celui de la balance donnent une autre empreinte (la balance de C n'en porte pas deux).
- **D-1138-10 — Le `dry-run` n'a pas de balance** : `NON_APPLICABLE` / `SOLDES_FOURNIS`, jamais un recalcul sans
  valeur publiée à comparer.
- **D-1138-11 — Aucun changement C13** : `balances_balance` est déjà au plan d'effacement (par `orgId`) et dans les
  collections non exportées justifiées (« copie d'un voisin ») ; ses deux champs la suivent. Fixture de
  `bilan-export.e2e` inchangée (la collection n'est pas exportée).

## Livraison

**prospera-bilan-service #193**, fusionnée en rebase : **`dev` `65eecdc`** (branche `7680a51`). Annonce avant le
code : prospera-stories #937 (`main` 69c1cfe). **Conforme à l'annonce, sans écart.**

- `rapprochement-balance.ts` (pur) : `soldes-v1` (copie du contrat de C), `ALGORITHMES_EMPREINTE_SOLDES` (une version),
  `recalculerEmpreinteSoldes` (une version inconnue rend `null`, y compris `toString`), `evaluerRapprochementBalance`.
- `balance-payload.util.ts` : `lireEmpreinteDesSoldes` (la paire ou rien, formes bornées) ; `balance-events.ts` (copie
  du contrat) ; `balance-balance.schema.ts` : deux `@Prop` sans défaut ; `BalanceLue` les expose.
- `analyse.service.ts` : la balance que nomme le document servi (jeu ou snapshot), lue par
  `BalancesDossierRepository.parId` (organisation et dossier) ; `dry-run` ⇒ `SOLDES_FOURNIS`. DTO
  `RapprochementBalanceDto` (énumérations nommées `StatutRapprochementBalance`, `MotifRapprochementBalance`).
- **Constat avant le code** : l'empreinte publiée depuis `d5878be` était reçue et **jetée** (projection limitée aux
  champs connus, et Mongoose `strict` retire du `$set` un champ que le schéma ne déclare pas).

## Preuves

| Preuve | Résultat |
|---|---|
| Node 24 (étage `verification`, image de l'archive LF de `7680a51`) — e2e complets | **45/45 suites, 3 565 tests** |
| Node 24 — `npm run build` | 0 |
| Node 24 — unitaires complets | **369/369 suites, aucun rouge**, en deux passes sur la même image : 286 suites dans la première (coupée par la borne de 40 min du script, piège 1138-2), les 83 restantes dans la seconde (518 tests verts, 2 ignorés) |
| Vecteurs de C (AC-3) | `49c4d3b1…49d8` et `5e296cc6…65b2` écrits en dur dans `rapprochement-balance.spec.ts` (et le premier dans `openapi-contract`) ; vérifiés aussi hors service (`node -e`) avant le code |
| Spec pure `rapprochement-balance.spec.ts` | 18 tests (vecteurs, lignes 0/0, ordre, point de code contre `localeCompare`, versions inconnues, chaque statut et motif) |
| Service d'analyse (AC-4 → 7) | 7 tests neufs (jeu, snapshot de la version demandée, dossier dans le filtre, introuvable, sans balance, version inconnue, `dry-run`) |
| Lecture des messages et projection (AC-2) | 20 tests neufs (`VALIDÉE` et `REJETÉE`, version inconnue gardée, 13 paires hors forme ignorées sans rejet, bornes) ; schéma réel (3 tests) : la paire gardée, un champ inconnu retiré |
| e2e `bilan-analyse` + `openapi-contract` (AC-8) | `CONCORDANT`, `DISCORDANT`, `NON_VERIFIABLE`, `SANS_EMPREINTE`, `NON_APPLICABLE` par la vraie route ; filtre du vrai dépôt (organisation, dossier, balance) ; réponses décrites exactement par le contrat ; énumérations nommées |
| Mutations | **18/18 tuées sur une assertion** (filtre 0/0 retiré ou en ET, tri retiré ou par `localeCompare`, ordre des clés, `in` au lieu de `hasOwn`, version inconnue recalculée, toujours `CONCORDANT`, sceau `v1` non reconnu, jeu sans balance non distingué, empreinte sans version acceptée, formes non bornées, paire non projetée, `@Prop` retiré, balance ou soldes du jeu au lieu du snapshot, dossier non passé) |
| Lint des fichiers touchés, `tsc` (code et tests) | 0 |
| §1.5 | sans `docker compose up` : aucun module Nest, dépendance ni Dockerfile ne change (le dépôt injecté est déjà exporté par `ReadModelsModule`) |
| C13 (AC-9) | `plan-d-export.invariant`, `export-c13`, `effaceur` verts sans changement (la collection y est déjà) |
| Verrou Docker | pris à 01:29, rendu à 02:24 (trap) ; seconde passe : prise à 02:50, rendue à 02:54 ; B et C prévenus ; aucun conteneur `grp-d` restant |

## Ce qui reste (hors story)

- **Rejeu des topics `balance.created` et `balance.etat.document.change`** sur une instance déjà en service, pour
  que les balances projetées avant cette story reçoivent leur empreinte (D-1138-7) : geste d'exploitation.
- **→ A (plus tard)** : l'écran de l'analyse affiche le bloc (`message` tel quel ; `DISCORDANT` en alerte).

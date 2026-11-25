# STORY-1022 : la balance publie l'empreinte de ses soldes (`soldesChecksum`)

Status: done

**Plan :** `coordination/PLAN-LOT-7-2026-11-24.md` §3, amendement du 2026-11-25, n° **0d** (ligne d'origine :
`PLAN-LOT-6-2026-11-23.md` §4, amendement D-L6-5, n° 11 — « chaque balance validée porte son empreinte ; STORY-1078 (D)
rapproche la liasse de sa balance par elle »). **Dépôt :** `prospera-balance-service` (tenu par C ; `origin/dev` au
départ : `c9e94c6`, STORY-564) · **Plage :** groupe C, 1022 (réservée au tracker) · **Ordre de C :** 1020 ✅ → 1019 ✅ →
1021 ✅ → 564 ✅ → **1022** → 1023.
**Sources :** `stories/STORY-381.md`, « Écartés » (« Rapprochement réel soldes ↔ balance : exige un `soldesChecksum`
publié par `balance-service` ») et constat S1 (le sceau prouve **quelle** balance a été déclarée, pas **que les soldes
du jeu en sortent** : dans la voie A′, les soldes viennent du corps de la requête) ; `stories/STORY-1078.md` D-1078-9
(les soldes lus par bilan : `{ compte, soldeDebiteur, soldeCrediteur }`) et **D-1078-10** (« lire l'empreinte publiée par
la balance, la recalculer sur les soldes du jeu **avec le même algorithme et sa version** — jamais un algorithme local,
piège de `balanceChecksum`, STORY-147/381 — et publier le constat à côté des quatre contrôles ») ; journal de D,
« Demandes aux autres groupes », → C du 24/11 mis à jour le 25/11 (STORY-1078) : « publier avec l'empreinte **son
algorithme et sa version** (champ du type `checksumVersion`) ; annoncez le contrat ici ». Code d'`origin/dev` :
`balance.checksum.ts` (STORY-147, le sceau versionné `v1`/`v2`), `types/balance-events.ts` et
`types/balance-etat-document-events.ts` (STORY-381, 453, 490), `kafka/outbox/balance-events.service.ts`,
`balance.service.ts` (`marquerEtat`), `instance-c13/verifications/balances-equilibrees.ts` (STORY-1080 : le sceau
recalculé sous la version qui l'a scellé) ; côté bilan (lu, jamais touché) : `LigneSoldeDto`
(`dto/bilan-dry-run-request.dto.ts`), `read-models/balance-payload.util.ts` (le consommateur ignore un champ qu'il ne
connaît pas).
**Rituel (2026-11-25) :** les demandes à C des journaux de A, B et D sont celles déjà placées par la session de groupe
(recopies faites en 1020, règle de l'essai servie en 1019) ; la seule qui porte sur cette story est celle de D
ci-dessus.

## Ce qui existait déjà

Chaque balance est scellée par un `checksum` versionné (`checksumVersion` : `v2` pour toute balance neuve, `v1` pour
les documents antérieurs à STORY-147), publié sur `balance.created` et `balance.etat.document.change` et figé par bilan
dans sa liasse (`balanceChecksum`, `balanceChecksumVersion`, STORY-381). **Ce sceau ne se recalcule pas depuis une
liasse** : il couvre l'en-tête (`exercice`, `source`, `referentiel`, `version`) et, par ligne, `libelle`, les deux
mouvements, les deux soldes et `niveauPreuve` — bilan ne tient que `{ compte, soldeDebiteur, soldeCrediteur }`. Il dit
donc *quelle balance* a été déclarée, jamais *que les soldes du jeu en sortent*. Aucune empreinte des seuls soldes
n'existe.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|---|---|---|
| AC-1 | Le contrat est annoncé avant le code (« ⚠ Contrats » du journal de C), algorithme, version et vecteur de référence compris | PR de docs d'annonce, fusionnée avant le code |
| AC-2 | `balance.created` et `balance.etat.document.change` portent `soldesChecksum` (SHA-256, 64 hex) **et** `soldesChecksumVersion` (`'soldes-v1'`) pour toute balance scellée en `v2` ; les deux champs voyagent **ensemble**, jamais l'un sans l'autre | unitaires des deux mappers et de l'émetteur ; e2e (outbox) |
| AC-3 | L'empreinte se calcule par l'algorithme écrit ci-dessous (et dans le code), **le même chemin de canonisation que le sceau** (tri par point de code, `JSON.stringify`, SHA-256) ; le vecteur de référence donne la valeur écrite | unitaire au vecteur écrit en dur |
| AC-4 | Elle ne dépend ni de l'ordre des lignes, ni des lignes aux deux soldes nuls, ni du libellé, des mouvements, de la provenance ou de l'en-tête ; elle change dès qu'un solde ou un compte change | unitaires ; mutations |
| AC-5 | Une balance scellée en `v1` (forme héritée `debit`/`credit`, sans colonnes de solde) ne publie **aucun** des deux champs | unitaires |
| AC-6 | Compatibilité BACKWARD : aucun champ requis de plus, aucun champ renommé, `schemaVersion` inchangé ; `docs/schemas/balance.created.v1.schema.json` gagne les deux propriétés **facultatives** (et celles déjà publiées que le schéma avait oubliées) ; l'événement construit y est conforme (Ajv) | unitaire Ajv |

## L'algorithme `soldes-v1` (le contrat)

```
soldesChecksum = SHA-256, hexadécimal minuscule (64 caractères), de la chaîne UTF-8
                 JSON.stringify({ lignes: L })
L              = les lignes de la balance dont soldeDebiteur ≠ 0 ou soldeCrediteur ≠ 0,
                 triées par `compte` en ordre de point de code (opérateurs < et > sur les chaînes,
                 jamais localeCompare),
                 chacune projetée, dans cet ordre de clés : { compte, soldeDebiteur, soldeCrediteur }
compte         : la chaîne telle que la balance la porte (aucune normalisation de plus)
montants       : entiers en unités mineures de la devise de la balance (ceux de la balance, sans échelle)
soldesChecksumVersion = 'soldes-v1'
```

**Vecteur de référence** : lignes `{ 521000 : D 150000, C 0 }`, `{ 101000 : D 0, C 150000 }`,
`{ 401000 : D 0, C 0 }` (mouvements et libellés quelconques) ⇒ chaîne canonique
`{"lignes":[{"compte":"101000","soldeDebiteur":0,"soldeCrediteur":150000},{"compte":"521000","soldeDebiteur":150000,"soldeCrediteur":0}]}`
⇒ `soldesChecksum = 49c4d3b1e9532da78c8bb6aad3d025dbe704c3338e74bab2198af3c6140349d8`. Une balance sans solde non nul :
`{"lignes":[]}` ⇒ `5e296cc6751191a82ddbd868691e714fe68c5ce679348d93d5590e425a6265b2`.

## Décisions retenues par défaut (contestables)

- **D-1022-1 — Une empreinte des seuls soldes, calculée par le chemin du sceau, pas un second algorithme.** Le sceau
  `v2` ne peut pas servir tel quel : bilan ne tient ni l'en-tête, ni les libellés, ni les mouvements, ni `niveauPreuve`
  (« Ce qui existait déjà »). On **réutilise** sa canonisation : la fonction de hachage du sceau (tri des lignes par point
  de code, `JSON.stringify`, SHA-256) est extraite dans `balance.checksum.ts` et sert aux deux ; seule la **projection**
  diffère (`compte`, `soldeDebiteur`, `soldeCrediteur`). Comme le sceau, elle se vérifie par sa version
  (`verifierSoldesChecksum(version, lignes, valeur)`).
- **D-1022-2 — Sa propre version, `soldesChecksumVersion: 'soldes-v1'`**, distincte de `checksumVersion` : les deux
  algorithmes évoluent séparément (un `v3` du sceau qui scellerait `sources` ne change pas l'empreinte des soldes, et
  l'inverse). Le préfixe `soldes-` empêche de la lire pour un `v1` du sceau.
- **D-1022-3 — Les lignes aux deux soldes nuls sont exclues.** Elles ne changent aucune liasse ; un jeu d'états qui les
  omet (ou les garde) doit donner la même empreinte que sa balance, sinon le rapprochement crierait à l'écart pour rien.
- **D-1022-4 — Calculée à la publication, pas stockée.** Les soldes sont déjà scellés par le `checksum` `v2` (une
  altération au repos se voit à `balances-equilibrees`, STORY-1080) et une version de balance ne change jamais de
  lignes : l'empreinte se dérive des lignes scellées, sans champ Mongo, sans migration. Une balance `v1` (colonnes
  `debit`/`credit`, ambiguës : STORY-147) n'a pas de soldes publiables : les **deux** champs sont omis, jamais `null`.
- **D-1022-5 — Publiée sur les deux topics, comme `checksum`** : `balance.created` (naissance) et
  `balance.etat.document.change` (chaque transition, `VALIDÉE` comprise — c'est elle qui annonce la balance qui porte la
  liasse). Le mapper calcule (il reste pur) ; l'émetteur reçoit les lignes **déclarées dans son type** (leçon de 453 et
  490 : un champ qui ne voyage que par un spread disparaît au premier nettoyage). **Le REST ne change pas** (aucun
  consommateur ; s'ajoutera en facultatif si un écran le demande).
- **D-1022-6 — Le schéma JSON de `balance.created` est remis à jour en facultatif** : il refusait déjà les messages
  réels (`additionalProperties: false` sans `dossierId`, `exerciceId`, `checksumVersion`, `devise`, `exposant`,
  `deviseDeclaree`) ; il gagne ces propriétés et les deux neuves, **sans rien ajouter à `required`**, et un test Ajv
  tient désormais le mapper conforme. `balance.etat.document.change` n'a pas de schéma JSON publié : son contrat reste le
  type TypeScript et ses tests (inchangé).

## Livraison

**prospera-balance-service #169**, fusionnée en rebase : **`dev` `d5878be`** (branche `d956deb`). Annonce avant le
code : prospera-stories #927 (`main` `c4ff743`). **Conforme à l'annonce, sans écart.** D prévenu par message (session
`moneyvibes-apps-83`) : SHA, forme exacte, algorithme, vecteur.

- `balance.checksum.ts` : `trierParCompte` et `hacherCanonique` extraits de `sceller` (les vecteurs `v1` et `v2` du sceau
  passent inchangés) ; `computeSoldesChecksumV1`, `verifierSoldesChecksum` (une version inconnue ne se vérifie jamais),
  `empreinteDesSoldes` (aucune pour une balance `v1`). `balance-canonique.ts` : `VERSIONS_SOLDES_CHECKSUM`,
  `SOLDES_CHECKSUM_VERSION_COURANTE`.
- Mappers `buildBalanceCreatedEvent` et `buildBalanceEtatDocumentChangeEvent` : les deux champs, ensemble ou aucun ;
  `BalanceEventsService.etatDocumentChange` déclare `lignes` dans son type ; `marquerEtat` passe les lignes du document
  relu dans la transaction. Les lignes ne voyagent pas.
- `docs/schemas/balance.created.v1.schema.json` : `dossierId`, `exerciceId`, `devise`, `exposant`, `deviseDeclaree`,
  `checksumVersion` (déjà publiés, que le schéma refusait), `CIMA` dans l'énumération des référentiels, les deux champs
  neufs, `dependentRequired` (l'un exige l'autre) ; `required` inchangé. `INTEGRATION.md` à jour.

## Contrat annoncé avant le code

« ⚠ Contrats » du journal de C (entrée STORY-1022) : deux champs facultatifs sur `balance.created` et
`balance.etat.document.change`, l'algorithme `soldes-v1` et son vecteur ; aucun champ requis de plus, aucun renommage,
`schemaVersion` inchangé, REST inchangé. **→ D** : STORY-1078 (D-1078-10) peut lire l'empreinte.

## Preuves

| Preuve | Résultat |
|---|---|
| Node 24 (étage `verification`, archive du commit) — unitaires | **298/298 suites** (2 ignorées), **5738 tests** verts (21 ignorés), 226 s |
| Node 24 — e2e | **37/37 suites, 2291 tests** |
| `npm run build` (Node 24), `tsc` (deux configurations), lint des fichiers touchés | verts |
| Node 25 — suites touchées (`balance`, `kafka`, `instance-c13`) | vertes, hors les 5 suites du client Kafka natif (rouges connues sous Node 25) |
| Vecteur de référence (AC-3) | écrit en dur dans `balance.checksum.spec.ts`, `empreinte-des-soldes-events.spec.ts`, `balance-events.service.spec.ts` ; vecteurs `v1`/`v2` du sceau inchangés |
| Ajv (AC-6) | l'événement construit (`v2`, `v1`, sans version) est conforme au schéma ; `required` inchangé ; l'un sans l'autre refusé |
| Mutations | **9/9 tuées sur une assertion** : lignes nulles gardées, créditeur seul ignoré, tri retiré, ordre des clés inversé, empreinte publiée pour une `v1`, version inconnue vérifiée, `balance.created` sans empreinte, `balance.etat.document.change` sans empreinte, service qui ne passe pas les lignes |
| Pile `grp-c` (mongo rs0, Kafka 3.9.0, balance REEL depuis l'image de l'archive, IdP de test) | **12/12** : B1 (`v2`) rejetée ⇒ sur Kafka **et** dans l'outbox, `soldesChecksum = 49c4d3b1…49d8`, **recalculé hors du service depuis le contrat écrit**, `soldesChecksumVersion: 'soldes-v1'`, sceau et `schemaVersion` inchangés, pas de lignes ; B2 (héritée `v1`) rejetée ⇒ aucun des deux champs ; `GET` de la balance : REST inchangé |
| Docker | verrou pris à 23:08, rendu à 23:19 (`trap EXIT`), aucun conteneur `grp-c` restant |

**Limite de la pile, écrite** : la validation de B3 y a rendu `403 BALANCE_NOT_ENTITLED` (la pile sème l'état publié mais
pas le read-model d'abonnement qu'exige l'écriture de validation) ; la transition `VALIDÉE` passe par le même mapper et
le même émetteur que le rejet, prouvés par les unitaires (`VALIDÉE` et `REJETÉE`) et par la pile (rejet).

## Ce qui reste

- **→ D** : lire l'empreinte et publier le constat à côté des quatre contrôles (D-1078-10), recalculée sous
  `soldesChecksumVersion`.
- `balance.etat.document.change` n'a toujours pas de schéma JSON publié (D-1022-6) ; le REST ne publie pas l'empreinte
  (D-1022-5), à ajouter en facultatif si un écran la demande.

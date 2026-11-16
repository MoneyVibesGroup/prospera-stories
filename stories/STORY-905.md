# STORY-905 : Une simulation est une lecture

Status: done

**Complexité :** petite (deux services, une règle de garde, une liste déclarée)

**Épic :** EPIC-159 (le cabinet sur le moteur), en préalable de la lecture seule par l'état publié (STORY-914)
**Services :** `balance-service`, `bilan-service`
**Plage :** groupe A, n° 1 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2). Nommée au journal de A le
2026-11-15, vue par le relevé du front (FE-069 A10). Fiche écrite **avant** de coder.

---

## Pourquoi

Un abonnement échu met le service en **lecture seule** (STORY-727) : on lit et on exporte toujours, on n'écrit plus.
La garde d'accès juge l'écriture **sur la méthode HTTP** (`refuseeEnLectureSeule`) : tout ce qui n'est ni `GET`, ni
`HEAD`, ni `OPTIONS` est refusé en `403 ABONNEMENT_EXPIRE`.

Or plusieurs routes sont en `POST` parce que leur corps porte des données (soldes, fichier, leviers, cours), pas parce
qu'elles écrivent :

- `bilan-service` : les huit `…/dry-run` (table de passage, bilan, compte de résultat, TFT, résultat CIMA, notes
  annexes, contrôles, analyse financière). Elles portent déjà `@LectureSeule()` depuis STORY-357, mais seule la règle
  d'archivage du dossier (D9) le lit ;
- `balance-service` : l'analyse d'un fichier d'import, la suggestion de comptes, la simulation d'un scénario fiscal et
  la réévaluation de clôture des créances et dettes en devises. Toutes les quatre disent « n'écrit rien ».

Un cabinet dont l'abonnement est échu ne peut donc plus **consulter** un bilan simulé, alors que la règle d'or de 727
est « on lit toujours ».

## Ce que la story livre

1. **Un seul marqueur de l'effet**, `@LectureSeule()` : « ce handler n'écrit rien, quel que soit son verbe ». Il existe
   dans bilan ; il est **copié à l'identique** dans balance.
2. **La garde d'accès le lit** (balance et bilan) : une route marquée passe en lecture seule ; toute autre route qui
   n'est pas une lecture HTTP reste refusée en `403 ABONNEMENT_EXPIRE`. `lecture-seule.ts` **ne change pas** : il est
   copié à l'octet dans six services, la décision « marquée » se prend dans la garde.
3. **Dans balance, la règle d'archivage (D9) le lit aussi**, comme dans bilan : un calcul qui n'écrit rien se joue sur
   un dossier archivé.
4. **La liste des routes permises en lecture seule est déclarée** dans chaque service
   (`common/decorators/routes-sans-ecriture.ts`), et un balayage des contrôleurs exige que l'ensemble des handlers
   marqués soit **exactement** cette liste : un marqueur posé ou retiré sans mettre la liste à jour rougit.

## Critères d'acceptation

- **AC-1** : abonnement échu, chaque route de la liste déclarée passe la garde d'accès (balance et bilan).
- **AC-2** : abonnement échu, **toute autre** route `POST`, `PUT`, `PATCH` ou `DELETE` des contrôleurs reste refusée en
  `403 ABONNEMENT_EXPIRE` ; balayée sur tous les contrôleurs, pas sur un échantillon.
- **AC-3** : l'ensemble des handlers marqués `@LectureSeule()` est égal à la liste déclarée, dans chaque service.
- **AC-4** : balance, dossier archivé : les quatre routes marquées passent la règle D9 ; une écriture reste en 409.
- **AC-5** : `lecture-seule.ts` garde son empreinte (copie à l'octet, sha256 inchangé).
- **AC-6** : prouvé sur pile réelle : un droit échu au read-model, un `dry-run` en 200, une écriture en 403.

## Mutations attendues

- retirer `@LectureSeule()` d'une route déclarée ⇒ AC-3 et AC-1 rougissent ;
- poser `@LectureSeule()` sur une écriture ⇒ AC-3 rougit ;
- la garde ignore le marqueur ⇒ AC-1 rougit ;
- la garde laisse passer tout `POST` ⇒ AC-2 rougit.

## Decisions

- **D-905-1** : le marqueur reste **déclaré à la main**, jamais déduit du suffixe `dry-run` ni d'un `@HttpCode(200)`
  (raison de STORY-357 : un handler qui écrit peut porter l'un comme l'autre).
- **D-905-2** : `lecture-seule.ts` n'est pas modifié (copie à l'octet dans fiscal, paiement, microfinance, assurance,
  balance, bilan). L'état publié (914) reprendra la règle.
- **D-905-3** : balance applique le marqueur à D9 comme bilan (cohérence : un marqueur, un sens).

## Definition of Done

- [x] Unitaires, lint, typecheck verts (balance, bilan). Sous Windows, quatre suites rougissent **sans lien** avec 905
  (fichiers non touchés) : séparateurs `\` (`devise-paquet.exhaustivite`, `analyse.agnosticisme`), CRLF
  (`dossier-scope.invariant`) et un délai de 5 s dépassé sous charge (`sage-parser`) : propres au poste Windows.
- [x] Mutations jouées : marqueur retiré de `simuler` ⇒ « EXACTEMENT la liste » et « chaque route déclarée PASSE »
  rouges ; marqueur posé sur `POST scenarios` ⇒ « EXACTEMENT la liste » rouge ; garde qui ignore le marqueur ⇒
  « chaque route déclarée PASSE » rouge ; garde qui laisse passer tout `POST` ⇒ « TOUTE autre écriture » rouge.
- [x] Preuve sur pile `grp-a-905` (mongo, kafka, balance, bilan ; JWKS local) : droit `ACTIVE`, `ECHEANCE` passée au
  read-model ; bilan `table-de-passage/dry-run` **200** ; témoin (image `origin/dev`, même base) **403
  ABONNEMENT_EXPIRE** ; `POST exercices` et `POST hypotheses` 403. Balance : `reevaluation` 400 (corps), `simuler`
  404 `SCENARIO_INTROUVABLE` (la garde laisse passer) ; `POST scenarios` et `POST cahiers/categories` 403.
- [x] PR code fusionnées : balance #145 (dev `4a2abec`), bilan #173 (dev `663063d`).

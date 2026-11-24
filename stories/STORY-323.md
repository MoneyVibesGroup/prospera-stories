# STORY-323 : Le cycle de vie de l'obligation — onze états, des rôles, et le visa de l'associé

Status: ready-for-dev — **fiche écrite le 2026-11-24** par la session du groupe A (lot 6, n° 5 de la ligne de A : plan
amendé le 24/11, #769). Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md`
(EPIC-031), le visa de la salle des cabinets (V6, `salle-cabinets-validations-2026-11-19.md`).

**Service :** `prospera-fiscal-service` (tenu par A jusqu'à la fusion de 328, puis rendu à C)
**Points :** 8 · **Epic :** EPIC-031 · **Suite :** STORY-320 (bases fiscales alimentées par la balance), puis 322, 328 ;
STORY-324 (la validation du client comme pièce), STORY-325 (rectificatives et retours en arrière motivés), STORY-333
et 334 (accusé et rejet liés à l'obligation)

---

## Le fait

L'obligation fiscale (STORY-305) naît `A_PREPARER` et **n'en bouge jamais** : aucune route ne change son `statut`. Le
cabinet ne peut donc ni suivre la progression d'un dossier, ni savoir qui l'a visé, ni empêcher qu'un collaborateur
dépose sans l'associé. Le cycle d'EPIC-031, la discipline commune à tous les dossiers, n'existe pas.

## Ce que le code porte déjà (lu sur `origin/dev`, 4ee8ed7)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| L'obligation | `statut` (humain, posé à la création par `$setOnInsert`, **toujours `A_PREPARER`**), `responsable`, `active` | `obligation.schema.ts`, `mongo-registre-obligations.ts` |
| Le dépôt (538) | une **chaîne de dépôts d'une liasse** (dossier × jeu d'états × pays × état) : `TRANSMISE`, `ACCEPTEE`, `REJETEE`, journal de transitions | `domain/depot/depot.ts` |
| La lecture « obligation de dépôt » (538, AC-4) | `lireObligation(chaine)` : `A_DEPOSER`, `TRANSMISE`, `REJETEE_A_RETRANSMETTRE`, `ACCEPTEE` — **calculée sur la chaîne, jamais stockée** | idem |
| Les droits | `fiscalite:declaration:preparer`, `:valider`, `:deposer` ; `CAB_ASSOCIE` les trois, `CAB_COLLABORATEUR` préparer seul | `common/rbac/droits-fiscalite.ts`, catalogue d'auth |
| Le journal chaîné | `obligation:<id>`, une entrée par acte, écrite dans la **même transaction** que l'état | `mongo-journal-audit.ts`, `transaction-mongo.ts` |

**Deux mots pour deux choses.** Le « statut de l'obligation » de `depots` est une **lecture de la chaîne d'un dépôt de
liasse**, qui ne sait rien des douze autres obligations d'un dossier (TVA, retenues, acomptes). Le `statut` de l'objet
`Obligation` est l'état de **l'obligation fiscale** dans le calendrier. Les deux coexistent ; aucun ne remplace l'autre.

## Critères d'acceptation

Ceux de l'épic, tels quels :

1. **Étant donné** une obligation **quand** elle progresse **alors** elle suit exactement le cycle `À préparer → En
   préparation → À contrôler → À valider → Validée → À déposer → Déposée → Accusé reçu → À payer → Payée → Clôturée`.
2. **Étant donné** un collaborateur **quand** il tente de valider **alors** la transition est refusée : seul
   l'expert-comptable valide.
3. **Étant donné** une transition quelconque **quand** elle aboutit **alors** l'état et son entrée d'audit sont écrits
   dans la **même** transaction.
4. **Étant donné** une transition non prévue par le cycle **quand** elle est tentée **alors** la réponse est `409`.

Et le visa de la salle (V6) :

5. **Étant donné** une obligation « Validée » **quand** on ouvre son dossier de dépôt **alors** le nom de l'associé qui
   l'a visée et la date du visa y figurent **et** un collaborateur ne peut pas la passer « À déposer » sans ce visa.

## Décisions (D-323-n) — prises le 2026-11-24, contestables

- **D-323-1 — Les onze états deviennent le `statut` de l'obligation.** Codes : `A_PREPARER`, `EN_PREPARATION`,
  `A_CONTROLER`, `A_VALIDER`, `VALIDEE`, `A_DEPOSER`, `DEPOSEE`, `ACCUSE_RECU`, `A_PAYER`, `PAYEE`, `CLOTUREE`.
  `A_PREPARER` est **déjà** la seule valeur écrite en base : **aucune migration, aucun renommage**. Le champ reste
  `statut`, la réponse reste `statut` (le front qui lit une chaîne la lit encore).
- **D-323-2 — Ce que `depots` garde.** Tout : ses états (`TRANSMISE`, `ACCEPTEE`, `REJETEE`), `lireObligation`, ses
  routes, sa réponse `statut` à quatre valeurs, `fiscal.declaration.deposee`. **Aucun renommage.** `depots` reste la
  vérité sur ce qui s'est passé **auprès de l'administration** ; le cycle est la vérité sur **où en est le cabinet**.
- **D-323-3 — Ce que le cycle remplace.** Rien d'écrit : il remplace l'absence. Il donne un sens aux deux états du
  cycle qui ne sont que le reflet d'un dépôt. **La correspondance**, écrite dans le domaine (`cycle.ts`,
  `etatDuCycleSelonLeDepot`) et éprouvée par un test, est :

  | `lireObligation(chaine).statut` (depots) | Obligation, au cycle |
  |---|---|
  | `A_DEPOSER` (aucun dépôt) | `A_DEPOSER` |
  | `TRANSMISE` | `DEPOSEE` |
  | `ACCEPTEE` (accusé) | `ACCUSE_RECU` |
  | `REJETEE_A_RETRANSMETTRE` | `A_DEPOSER` (retour en arrière : STORY-334 et 325, avec motif) |

  **Ce que 323 ne fait pas** : lier une obligation à la chaîne d'un dépôt (la clé de chaîne est la liasse, pas
  l'obligation) ni déplacer l'obligation quand un accusé arrive. Ce lien est celui de STORY-333 (`ACCUSE_REQUIS`) et de
  STORY-334 ; ils s'appuieront sur la correspondance ci-dessus. En 323, `A_DEPOSER → DEPOSEE` et `DEPOSEE → ACCUSE_RECU`
  se **consignent à la main** par la route de transition, avec le droit `deposer`.
- **D-323-4 — Une seule route**, `POST /api/v1/obligations/{id}/transition`, corps `{ "vers": "<état>" }`. Les droits
  dépendent de la **cible** et non de la route ; la route n'a donc pas de `@ExigeDroitFiscal` unique (ligne nommée dans
  la liste blanche de `garde-routes-ecriture.spec.ts`, avec sa raison) et le domaine vérifie le droit, **journalise le
  refus** (`HABILITATION_REFUSEE`, comme la garde) et répond le même `403 DROIT_FISCAL_REFUSE`.
- **D-323-5 — Aucun droit neuf.** Le tableau ci-dessous n'emploie que les trois droits qui existent. « Seul l'associé
  valide » = `fiscalite:declaration:valider`, que seul `CAB_ASSOCIE` porte. `controler` et `regler` (FR-F59) restent à
  naître avec les routes qui les exercent (la règle d'or : un droit n'est déclaré que s'il est vérifié). **Le catalogue
  d'auth et le manifeste ne changent donc pas.** Le manifeste du module est `declarations` (pas `fiscalite`) ;
  `declarations:declaration:valider` y est déjà.
- **D-323-6 — Le cycle strictement séquentiel.** Une seule cible possible par état : la suivante. Pas de saut (une
  obligation sans règlement passe quand même par « À payer » puis « Payée » : un compte rendu de plus, jamais un trou) ;
  **pas de retour en arrière** : il est refusé `409 TRANSITION_NON_PREVUE` jusqu'à STORY-325, qui l'ouvre avec un motif
  obligatoire. Un état terminal (`CLOTUREE`) ne bouge plus.
- **D-323-7 — Le visa.** À `A_VALIDER → VALIDEE`, l'obligation reçoit `visa: { par, nom, le }` — `par` l'identifiant du
  jeton, `nom` **copié** de l'annuaire local (`identity_users`, prénom + nom) à cet instant, `le` l'instant serveur. Le
  nom est **recopié** pour que le visa reste lisible si la personne change de nom ou quitte le cabinet ; il n'entre
  **jamais** dans le journal chaîné (ineffaçable dix ans, AD-10, AD-21) : celui-ci ne porte que `par`. Nom inconnu de
  l'annuaire : `nom: null`, le visa tient par `par`. **`VALIDEE → A_DEPOSER` exige un visa** : `409 VISA_REQUIS` s'il
  manque (obligation antérieure, donnée altérée), même pour l'associé.
- **D-323-8 — Qui fait quoi.**

  | De → vers | Droit |
  |---|---|
  | `A_PREPARER → EN_PREPARATION` | `preparer` |
  | `EN_PREPARATION → A_CONTROLER` | `preparer` |
  | `A_CONTROLER → A_VALIDER` (le contrôle) | `valider` |
  | `A_VALIDER → VALIDEE` (le visa) | `valider` |
  | `VALIDEE → A_DEPOSER` | `preparer` + visa présent |
  | `A_DEPOSER → DEPOSEE` | `deposer` |
  | `DEPOSEE → ACCUSE_RECU` | `deposer` |
  | `ACCUSE_RECU → A_PAYER` | `preparer` |
  | `A_PAYER → PAYEE` | `preparer` (un constat : le règlement n'est jamais exécuté ici, §3.3 du PRD) |
  | `PAYEE → CLOTUREE` | `valider` (la clôture est l'acte de l'associé) |

  Aucun droit n'en implique un autre (FR-F59) : un associé qui veut préparer doit porter `preparer`.
- **D-323-9 — Les gardes d'état.** Une obligation **écartée** (`active: false`, STORY-306) ne bouge pas :
  `409 OBLIGATION_DESACTIVEE`. Une obligation d'un redevable **bloqué** (`blocage` non nul, STORY-563) ne bouge pas :
  `409 OBLIGATION_BLOQUEE`. **Ordre des vérifications** : le droit d'abord (on ne dit pas à qui n'a pas le droit ce que l'obligation a), puis
  les gardes d'état, puis le cycle.
- **D-323-10 — La concurrence.** L'écriture est une comparaison-échange : `findOneAndUpdate({ _id, orgId, statut: de })`.
  Perdue, elle se relit : l'état a changé ⇒ `409 TRANSITION_CONCURRENTE`, jamais un 404 ni un écrasement.
- **D-323-11 — Pas d'événement Kafka en 323.** Personne ne consomme un changement d'état d'obligation aujourd'hui ; un
  topic sans lecteur est de la dette. Le journal chaîné (`OBLIGATION_TRANSITION`) est la trace. Quand un lecteur existera
  (le tableau de bord du cabinet, EPIC-030), un topic `fiscal.obligation.etat-change@1` s'ajoutera, sans rien casser.
- **D-323-12 — « Le dossier de dépôt » (V6).** Tant que l'obligation n'est pas liée à la chaîne d'un dépôt (D-323-3), le
  dossier de dépôt d'une obligation **est** l'obligation : `visa` figure dans sa réponse (`GET …/obligations`, la fiche,
  et le retour de la transition). Quand 333/334 lieront, le dossier de contrôle (STORY-336) lira le visa là.

## Contrat annoncé avant le code (2026-11-24)

**Ajouts seuls** dans `prospera-fiscal-service` : aucun champ, route ni topic renommé ; aucun droit neuf ; aucun
événement ; manifeste `declarations` et catalogue d'auth **inchangés**.

- **Route neuve** : `POST /api/v1/obligations/{id}/transition`, corps `{ "vers": "EN_PREPARATION" | … | "CLOTUREE" }`,
  réponse **200** : l'obligation telle que `GET …/obligations` la rend (`ObligationResponseDto`), avec les champs neufs
  ci-dessous. Passe par la porte d'accès fiscal et les rôles `TENANT_ADMIN`/`TENANT_USER` comme les autres routes de
  l'obligation.
- **Champs neufs, facultatifs, sur `ObligationResponseDto`** : `visa` (`{ par, nom, le }` ou `null`) ;
  `prochainEtat` (`string | null` : la seule cible permise, `null` à `CLOTUREE`) ; `droitRequis` (le code du droit que la
  prochaine transition exige, `null` à `CLOTUREE`). **Au front** : on grise le bouton selon `droitRequis` et `perms`.
  Types à régénérer ; un client qui ignore ces champs ne change rien.
- **Champ de base neuf** : `visa` sur la collection `obligations` (humain : posé par la seule transition de visa, jamais
  par une dérivation — AD-17). Aucune reprise de données.
- **Journal chaîné** : acte neuf `OBLIGATION_TRANSITION`, contenu `{ de, vers, visa }` (`visa` : booléen — vrai sur le
  visa). Aucune donnée personnelle.
- **Refus** : `403 DROIT_FISCAL_REFUSE` (détail `{ droit }`, journalisé) ; `404 OBLIGATION_INTROUVABLE` (même réponse hors
  portée) ; `400` corps invalide (`vers` absent ou hors des onze états) ; `409` : `TRANSITION_NON_PREVUE` (détails
  `{ de, vers, attendu }`), `VISA_REQUIS`, `OBLIGATION_DESACTIVEE`, `OBLIGATION_BLOQUEE`, `TRANSITION_CONCURRENTE`.
- **Rien d'autre ne change** : `GET …/depots`, leurs états et `fiscal.declaration.deposee` restent à l'octet.

## Preuves attendues

Unitaires (`-w 2`) du domaine (cycle, droits, visa, correspondance avec `depots`) et du service ; `test:conformite` sur
un `mongo:7` en jeu de répliques (état + audit dans la même transaction, comparaison-échange, visa humain qu'une
re-dérivation n'efface pas) ; mutations qui rougissent sur l'assertion ; `docker compose up` du service, qui démarre, et
la route neuve rend `401` sans jeton.

## Hors périmètre

La liaison obligation ↔ chaîne de dépôt (333, 334) ; la validation du client comme pièce (324) ; les retours en arrière
et les rectificatives (325) ; l'écran (le cabinet suit son dossier par FE-081, dossier de dépôt) ; les droits `controler`
et `regler` ; tout événement Kafka.

## Notes

- Les chaînes d'audit de `obligation:<id>` se vérifient comme les autres (`verifierChaine`).
- STORY-333 et 334 sont couvertes **en partie** par 537 → 539 et 688 → 691 (accusé, rejet, archivage) ; ce que 323 ne
  couvre pas pour elles est dit ci-dessus (liaison à l'obligation).

## Progress Tracking

| Date | Événement |
|---|---|
| 2026-11-24 | Fiche écrite, contrat annoncé (PR de docs) avant le code. |

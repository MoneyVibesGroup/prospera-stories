# STORY-729 : Le référentiel se choisit PAR DOSSIER — un cabinet produit la liasse SFD ou CIMA de son client IMF

Status: ready-for-dev

**Service :** `bilan-service` · **Recette :** `prospera-recette`
**Points :** 8 · **Sprint :** non slottée (même régime que 727/728 : réservée, tirée à la demande du PO)
**Prérequis :** STORY-728 (le cabinet prend l'option `microfinance`/`assurance`, qui porte le
référentiel), STORY-304 (`typeEntite` → famille de référentiel), STORY-727 (version épinglée par
exercice), STORY-533 (habilitation plurielle).
**Origine :** arbitrage PO 1 de STORY-728 (2026-11-09) : *« le référentiel va à l'option SEULE ; la
liasse SFD/CIMA d'un client IMF produite par un cabinet = story bilan-service "référentiel par
dossier", à part »*. Ouverte à la demande du PO le 2026-11-09.

---

## Le fait

Un cabinet SYSCOHADA prend l'option `microfinance` (STORY-728). Il crée le dossier de son client IMF :
`typeEntite = MICROFINANCE`, et `dossier-service` expose `referentielComptable = SFD-BCEAO`. Il dépose
la balance. **La liasse sort en SYSCOHADA.**

Ce n'est pas un refus. C'est un calcul faux, et il passe pour juste : le plan SYSCOHADA rattache presque
tous les comptes d'une balance SFD, puisque les classes se ressemblent. On obtient une liasse complète
au mauvais format réglementaire, avec un tampon de référentiel cohérent.

**Pourquoi.** `BilanEngineService.resolveReferentielForOrg(orgId)` répond à la question *« quel est LE
référentiel de cette organisation ? »*. Il lit `OrgBilanEntitlement`, c'est-à-dire l'habilitation du
**seul** module `bilan` (`entitlement-events.ts` filtre `moduleCode == "bilan"`).
- Depuis 728, le module `bilan` du cabinet ne porte que SYSCOHADA, et `sfd-bceao` est porté par
  l'option `microfinance`. Le bilan-service ne le voit donc pas.
- Si on ajoutait `sfd-bceao` au module `bilan`, on tomberait dans `ReferentielAmbiguError` (409, garde
  de STORY-422/533) et la liasse SYSCOHADA du cabinet ne sortirait plus. C'est la raison de
  l'arbitrage 728.

Le code le dit déjà, sans le résoudre (`bilan-engine.service.ts`, garde STORY-533) :
*« "Quel est LE référentiel de cette organisation ?" n'a plus de réponse dès qu'elle en porte deux :
elle dépend du **dossier** traité, que cet appelant ne connaît pas. »*

**Ce que le dossier sait déjà.** Toutes les routes du moteur sont sous `dossiers/:dossierId/bilan`
(`@RequiresDossierScope`), et le read-model `dossiers_dossier` porte `typeEntite` (requis). Il manque
une seule chose : **lire la famille du dossier avant de choisir le référentiel.**

## Critères d'acceptation

- [ ] AC-1 — **Résolution par dossier.** Sur toute route à portée dossier, le référentiel est choisi
      ainsi :
      1. **la famille** vient du `typeEntite` du dossier courant, lu dans `dossiers_dossier` (filtre
         `orgId` ET `dossierId`, comme `DossiersDossierRepository`) :
         `ENTREPRISE → SYSCOHADA`, `MICROFINANCE → SFD-BCEAO`, `ASSURANCE → CIMA` ;
      2. **la version** est celle des référentiels habilités de l'organisation **dans cette famille**.
      Un cabinet habilité à `syscohada-revise` (module `bilan`) et `sfd-bceao` (option `microfinance`)
      obtient SYSCOHADA sur le dossier « Mon cabinet » et SFD-BCEAO sur le dossier de son client IMF,
      **sans aucun 409**.
- [ ] AC-2 — **La correspondance code → famille est exhaustive et vérifiée.** Elle est écrite
      `syscohada-revise`, `smt-togo` → SYSCOHADA · `sfd-bceao` → SFD-BCEAO · `cima-assurances` → CIMA,
      dans un `Record` littéral sur le patron de `resolution-referentiel.util.ts` (dossier-service).
      Un test charge **chaque** paquet embarqué et échoue s'il en trouve un sans famille. Sinon, le
      prochain paquet (ONG/SYCEBNL) tomberait en silence dans la mauvaise branche.
- [ ] AC-3 — **Pas de repli silencieux.** Un dossier `MICROFINANCE` dans une organisation qui n'a
      **aucun** référentiel SFD habilité est refusé. Le refus a un code dédié (proposé :
      `REFERENTIEL_DU_DOSSIER_NON_HABILITE`) et nomme la famille attendue. ⛔ **Jamais** de repli sur le
      SYSCOHADA de l'organisation : ce repli produirait exactement le défaut de cette story.
- [ ] AC-4 — **La version épinglée par l'exercice (STORY-727) reste prioritaire**, mais à l'intérieur
      de la famille du dossier. Si l'épingle désigne un code d'une **autre** famille, la requête est
      refusée, jamais servie. Cela couvre une base historique où un exercice IMF aurait été épinglé
      en SYSCOHADA avant cette story.
- [ ] AC-5 — **L'ambiguïté se mesure dans la famille, plus dans l'organisation.**
      `ReferentielAmbiguError` n'est levée que si la famille du dossier compte plusieurs référentiels
      habilités (par exemple `syscohada-revise` et `smt-togo`). Le choix SN/SMT relève de l'axe
      `systemeComptable` daté par exercice (STORY-303), hors de cette story : sur ce cas, le
      comportement reste celui d'aujourd'hui.
- [ ] AC-6 — **La balance doit déclarer la même famille que le dossier.** Le read-model de balance
      porte le `referentiel` déclaré par le client (`SN` | `SMT` | `SFD-BCEAO` | `CIMA`). Aujourd'hui,
      c'est un simple diagnostic : `balance-service` ne le croise pas avec le `typeEntite` (voir la
      docstring de `type-entite.enum.ts`). Si la famille déclarée diffère de celle du dossier, la
      production de la liasse est **refusée** avec un code dédié. Une balance qui ne déclare pas de
      référentiel n'est pas refusée pour ce motif.
- [ ] AC-7 — **Non-régression, mesurée avant d'être affirmée.** Prenons une organisation à un seul
      référentiel dont tous les dossiers sont de la même famille, comme un cabinet SYSCOHADA sans
      option ou une IMF dont tous les dossiers sont `MICROFINANCE`. Elle reçoit **exactement** la
      même réponse qu'avant sur `GET …/bilan/referentiel` (référentiel, checksum, tampon) et sur la
      production de la liasse. ⚠️ Avant de livrer, **compter** dans la base de recette les dossiers
      dont la famille diffère du seul référentiel habilité de leur organisation. Exemple : une IMF
      dont le dossier propre aurait été créé `ENTREPRISE` par défaut. Ces dossiers passeraient de
      « liasse rendue » à « refus AC-3 ». C'est juste sur le fond, mais c'est une rupture : la
      soumettre au PO avant la fusion.
- [ ] AC-8 — **Recette de bout en bout** (`prospera-recette`, volumes neufs, images reconstruites
      depuis `dev`). Un cabinet SYSCOHADA prend l'option `microfinance`. Il produit, dans la même
      session, la liasse SYSCOHADA de « Mon cabinet » **et** la liasse SFD-BCEAO de son client IMF.
      Les deux tampons sont lus. La contre-preuve : le même cabinet **sans** l'option obtient le
      refus AC-3 sur le dossier IMF.

## Décision prise avant le développement

**Q1 — D'où le bilan-service tient-il l'habilitation SFD/CIMA du cabinet ?** ✅ **Tranchée par le PO
le 2026-11-09 : (a).**
- **(a) retenue :** le bilan-service projette **aussi** les droits des options normatives
  (`microfinance`, `assurance`) dans son read-model, à côté du droit `bilan`. Le gate
  `@RequiresBilanAccess` reste porté **par le seul module `bilan`** : l'option apporte un
  référentiel, pas l'accès au module. L'arbitrage 728 reste intact, et le catalogue ne change pas.
- **(b) :** le catalogue ajoute le référentiel de l'option au droit `bilan`. C'est plus simple côté
  bilan, mais cela rouvre l'arbitrage 728. Tout appel resté à portée organisation (voir « facile à
  rater » n° 2) repasserait en 409.

## Ce qui sera facile à rater

1. ⛔ **Choisir `habilites[0]` de la famille sans regarder la taille.** C'est le défaut que STORY-422
   a levé : il revient dès que la famille compte deux versions ou deux variantes (AC-5).
2. ⚠️ **Les appels hors chemin HTTP**, ceux qui n'ont pas de dossier dans le contexte : jobs, projection
   `declaration-deposee.projection.service.ts`, re-génération. Ils lisent encore l'habilitation par
   organisation. Les inventorier (aujourd'hui : 10 appels dans `bilan-engine.service.ts`, 3 dans le
   contrôleur de diagnostic, 2 dans `mapping-override.service.ts`, 1 dans `jeu-etats.service.ts`).
   Chacun reçoit son dossier, ou garde **explicitement** la résolution par organisation avec un
   commentaire. Il n'y a pas de troisième voie.
3. ⚠️ **La validation des surcharges de mappage.** `MappingOverrideService.proposer` valide le poste
   cible contre `pkg.postes` du référentiel résolu. Une fois la résolution faite par dossier, une
   surcharge proposée sur un dossier SFD doit être validée contre les postes **SFD**. Les surcharges
   sont déjà à portée dossier (STORY-357), il n'y a donc pas de fuite entre dossiers. Il reste à
   vérifier que la validation et l'application passent par la **même** résolution.
4. ⚠️ **Le front n'a rien à changer.** FE-030 lit `GET dossiers/:dossierId/bilan/referentiel`,
   `…/postes` et `…/plan-de-comptes`, déjà à portée dossier. Si un écran se met à écrire le
   référentiel en dur, ou à le lire ailleurs que dans ces routes, ce n'est plus cette story.
5. ⚠️ **Le cache du chargeur reste indexé par `(code, version)`.** Ne pas l'indexer par dossier : deux
   dossiers de la même famille partagent le même paquet vérifié.

## Hors périmètre

- Le croisement côté `balance-service` (refuser au dépôt une balance dont le référentiel contredit le
  `typeEntite` du dossier) : candidate STORY-236. AC-6 ne protège que la liasse.
- Le choix SN/SMT dans la famille SYSCOHADA (STORY-303).
- Le contenu des référentiels SFD et CIMA eux-mêmes (amorces, voir le journal des référentiels
  verticaux).

## Notes

- Voir [[STORY-728]], [[STORY-727]], [[STORY-533]], [[STORY-422]], [[STORY-304]], [[STORY-303]],
  [[STORY-357]], [[STORY-236]].
- Id pris après un MAX sur toutes les branches distantes de `prospera-stories` (728). Le fichier NON
  SUIVI `PLAN-2-DEVS-8-SEMAINES-2026-10-26.md` réserve 730 → 899 : 729 est libre.

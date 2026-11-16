# STORY-913 : La garde partagée en double lecture — fiscal et dossier

Status: done

**Complexité :** moyenne (le patron de 912, deux services aux règles propres)

**Épic :** EPIC-159 (le cabinet sur le moteur), volet (b)
**Services :** `prospera-fiscal-service`, `dossier-service`
**Plage :** groupe A, n° 9 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2). Dépend de 909 et 910 (faits).
Fiche écrite **avant** de coder.

---

## Pourquoi

Comme balance et bilan (912), fiscal et dossier doivent appliquer l'état publié des modules (AD-24) au lieu du droit
`entitlement.changed` et de son échéance. Leurs règles diffèrent :

- **fiscal** garde le module `declarations` (le seul vendu ; `fiscalite`, retiré de l'offre, n'a pas de manifeste) ;
  sa garde accepte aujourd'hui un droit `fiscalite` **ou** `declarations` actif ;
- **dossier** ne garde aucun module : il tient le portefeuille du cabinet et ne lit les droits que pour le **palier** de
  volume et la **lecture seule** (STORY-727 : un abonnement échu ne crée plus de dossier client).

## Ce que la story livre

1. **fiscal** — patron de 912 : garde partagée copiée (`src/vendor/`, sha256 `a830c449…`), projection de
   `etat-publie.changed.<espace>` pour `declarations` (`etats_publies_fiscal`, par la classe de base `ConsumerReadModel`
   du service), `FiscalAccessGuard` en double lecture : état publié de `declarations` connu ⇒ il décide seul (codes
   `ABONNEMENT_EXPIRE` ou `FISCAL_NOT_ENTITLED`) ; inconnu ⇒ l'ancienne garde (`fiscalite` ou `declarations`).
2. **dossier** — la projection de l'état publié de **tous** les modules du cabinet (`etats_publies_cabinet`, clé
   `(organisation, module)`) ; la **lecture seule** du cabinet se lit dans les états publiés quand il y en a : lecture
   seule si **aucun** module publié n'ouvre l'écriture à l'utilisateur (`deciderGarde`, sorte `ecriture`). Sans état
   publié, l'ancienne règle. Le **palier** reste celui des droits (`config.dossiersMax`).

## Critères d'acceptation

- **AC-1** : copies de la garde à l'empreinte de l'étiquette (fiscal, dossier).
- **AC-2** : projections ordonnées par `(epoque, numero)` ; un rejeu ancien ne rouvre rien.
- **AC-3** : fiscal, état publié connu : falsifier `echeanceLe` ne change aucune décision.
- **AC-4** : dossier : un module publié `EN_SERVICE` lève la lecture seule même si tous les droits datés sont échus ;
  tous les modules publiés en `LECTURE_SEULE` ⇒ création de dossier refusée `ABONNEMENT_EXPIRE`.
- **AC-5** : sans état publié, les deux services décident comme avant (non-régression de 727).

## Definition of Done

- [x] Unitaires (Node 24, étage `verification`), conformité fiscale, lint, `tsc` verts.
- [x] Mutations : la garde ignore l'état publié connu ⇒ rouge (fiscal) ; la lecture seule ignore les états publiés ⇒
  rouge (dossier).
- [x] Pile réelle : un `etat-publie.changed.reel` change la décision en secondes.
- [x] PR code et docs fusionnées.

## Livraison (2026-11-16)

🏁 **DONE** — fiscal #49 (dev `6d424cc`), dossier #50 (dev `45f8ecd`). Unitaires et conformité fiscale sous Node 24
(étage `verification`) ; mutations rouges (fiscal : la garde ignore l'état publié ; dossier : la lecture seule ignore
les états publiés) ; pile : un `etat-publie.changed.reel` change la décision en secondes. La double lecture est
retirée par STORY-918.

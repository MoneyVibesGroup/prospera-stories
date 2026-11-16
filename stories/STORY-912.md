# STORY-912 : La garde partagée en double lecture — balance et bilan

Status: done

**Complexité :** moyenne (deux services, le patron de 937 et 950)

**Épic :** EPIC-159 (le cabinet sur le moteur), volet (a)
**Services :** `balance-service`, `bilan-service`
**Plage :** groupe A, n° 8 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2). Dépend de 908 (fait).
Fiche écrite **avant** de coder.

---

## Pourquoi

La spine du moteur (AD-24) veut que la garde d'un module applique **l'état publié seul**, par la garde partagée
(`garde-etat-publie-v1`, STORY-937), et non plus le droit `entitlement.changed` et son échéance. Paiement (937) et
notification (950) y sont, en double lecture. Balance et bilan gardent encore leurs modules `balance` et `bilan` par
l'ancienne voie.

## Ce que la story livre (patron de 950)

1. **La garde partagée copiée** dans `src/vendor/garde-etat-publie/` (`ORIGINE.json`, sha256 `a830c449…` de
   l'étiquette), octets figés par `.gitattributes`, hors lint ; un test compare l'empreinte.
2. **La projection de `etat-publie.changed.<espace>`** (`INSTANCE_ESPACE`, `REEL` par défaut) : un consommateur supervisé
   (patron de 908), l'enveloppe du moteur (`organisationId`, `emisLe`), une collection par service
   (`etats_publies_balance`, `etats_publies_bilan`) qui n'accepte un état que si `(epoque, numero)` est plus récent.
3. **La garde d'accès en double lecture** : état publié connu ⇒ **il décide seul** (`deciderGarde`, identité
   `UTILISATEUR`, sorte `lecture` pour une route `@LectureSeule()` — STORY-905 — sinon celle de la méthode) ; la
   divergence avec l'ancienne garde est journalisée ; état inconnu ⇒ l'ancienne garde décide encore. Les codes rendus
   restent `ABONNEMENT_EXPIRE` et `BALANCE_NOT_ENTITLED` / `BILAN_NOT_ENTITLED`.

## Critères d'acceptation

- **AC-1** : la copie de la garde a l'empreinte de l'étiquette ; une copie modifiée rougit.
- **AC-2** : la projection n'écrit que le module du service, et seulement si `(epoque, numero)` est plus récent ; un
  message ancien ne rouvre rien.
- **AC-3** : état publié connu, **falsifier `echeanceLe` ne change aucune décision** (le droit au read-model est échu,
  l'état publié `EN_SERVICE` ouvre ; l'échéance est à venir, `LECTURE_SEULE` ferme l'écriture).
- **AC-4** : état publié inconnu, l'ancienne garde décide comme avant (non-régression de 727 et 905).
- **AC-5** : une route `@LectureSeule()` passe sous `LECTURE_SEULE` publié.
- **AC-6** : sur pile, un `etat-publie.changed.reel` publié change la décision de la garde en secondes.

## Definition of Done

- [x] Étage `verification` (Node 24.22) : balance **271/271** suites, bilan **325/325** ; lint et `tsc` verts. Les tests de
  graphe d'injection ont trouvé un `espace` absent des doubles de configuration ⇒ `REEL` par défaut dans le consommateur.
- [x] Mutation : la garde ignore l'état publié connu ⇒ 4 tests rouges (AC-3, NON_INSTALLE).
- [x] Pile `grp-a-912` (images des branches, JWKS local) : droit sans terme ; `LECTURE_SEULE` publié (n° 1) ⇒ écriture
  `403 ABONNEMENT_EXPIRE` en **4,6 s** (balance) et **0,1 s** (bilan), lecture 200 ; rejeu **ancien** (n° 0,
  `EN_SERVICE`) ⇒ toujours 403 ; `EN_SERVICE` n° 2 ⇒ écriture rouverte en ~0,1 s ; les collections portent n° 2.
- [x] Recettes depuis `dev` : 63/63 au gate de 911.
- [x] PR code fusionnées : balance #149 (`390775c`), bilan #175 (`d2e900b`).

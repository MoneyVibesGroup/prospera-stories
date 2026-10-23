# STORY-709 : Les passerelles et les domaines d'envoi se revérifient d'eux-mêmes

Status: done

**Épic :** EPIC-054 — Permissions au catalogue et cloisonnement des passerelles
**Service :** `notification-service`
**Points :** 3 · **Sprint :** rail F, bloc F3
**Prérequis :** **STORY-614** (vérifier est une question), **STORY-615** (domaine attesté par le DNS)
**Origine :** rail F.

---

## Le récit

En tant qu'**organisation cliente**, je veux que mon domaine d'envoi ne se ferme pas un matin parce
que personne n'a cliqué sur « vérifier » depuis trente jours.

## Le fait

⛔ **Deux horloges, aucune main pour les remonter.**
- Un **domaine** cesse d'être vérifié trente jours après sa dernière preuve
  (`VALIDITE_VERIFICATION_JOURS`). Rien ne refait la preuve : au 31ᵉ jour, l'expéditeur de
  l'organisation se ferme et ses messages repartent sous le repli — sans que personne ne l'ait décidé.
- Une **passerelle** vérifiée le reste **pour toujours** : un compte révoqué chez le fournisseur
  continue d'être annoncé `VERIFIEE` jusqu'au premier envoi qui échoue.

## Critères d'acceptation

- [x] AC-1 — Un travail de file planifié (patron STORY-586, clé fixe) revérifie chaque jour les
      domaines dont la dernière preuve a **plus de 20 jours** — avant l'échéance, jamais après.
- [x] AC-2 — ⚡ Une revérification qui **trouve** la preuve repousse l'échéance ; une résolution DNS en
      **échec** n'efface pas une preuve antérieure (règle de STORY-615) ; une preuve **absente** laisse
      l'échéance courir.
- [x] AC-3 — Le même travail revérifie les passerelles par la question de STORY-614 ; ⛔ une passerelle
      **injoignable** ne change pas d'état (`NON_VERIFIEE` sans date ne s'écrit pas sur une panne),
      une passerelle **refusée** passe `REFUSEE`.
- [x] AC-4 — ⛔ La revérification n'envoie **aucun** message (STORY-614 : vérifier est une question,
      jamais un envoi).
- [x] AC-5 — Une organisation en échec n'arrête pas les autres ; le compte rendu nomme les échecs.

---

## Livré le 2026-10-23 — branche `MNV-709` (`prospera-notification-service`, sur `origin/dev`)

`npm test` 3 417/3 417 (257 suites) · `npm run test:e2e` 246/246 · lint 0 · build vert.

- `ReverificationPlanifieeService` : planification à clé fixe, **tous les jours à 05 h 00 UTC** (après
  la purge de 03 h et la clôture de 04 h le 2 du mois).
- `ReverificationService.executer` ne fait que **rejouer les deux questions existantes** — aucune règle
  neuve, donc aucune seconde façon de juger :
  - domaines dont la preuve a **20 jours ou plus** (`SEUIL_REVERIFICATION_JOURS`, dix jours de marge
    avant l'échéance de 30) → `DomainesService.verifier` ; un domaine jamais prouvé n'en fait pas partie ;
  - passerelles **actives** → `PasserellesService.reverifier(…, { planifiee: true })`.
- ⛔ **En mode planifié, seuls `VERIFIEE` et `REFUSEE` s'écrivent** : un `NON_VERIFIEE` (injoignable) à
  5 h du matin aurait effacé un `VERIFIEE` que rien n'a démenti. La route manuelle garde son
  comportement (contre-preuve testée).
- ⚠️ **Un `VERIFIEE` planifié ne lève pas la quarantaine** : STORY-634 la fait lever par quelqu'un qui
  décide.
- Un échec est nommé par sa cause (code ou nom d'erreur) et n'arrête pas les autres.
- Les doubles de `domaines.service.spec.ts` et `passerelles.service.spec.ts` honorent désormais
  `$lte`, le filtre `actif` et la chaîne `select`.

⛔ **Ouvert** : aucune conformité contre un vrai Redis ; une passerelle `REFUSEE` par la routine n'est
signalée qu'au journal et à l'état — aucune notification à l'organisation.

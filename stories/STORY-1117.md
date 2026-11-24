# STORY-1117 : La balance de référence d'un exercice, servie par le moteur de balance — et sa liste sans les lignes

Status: in-progress — **écrite le 2026-11-24** par la session du groupe C, à la demande de A (journal C, « Réponses aux
demandes reçues », STORY-320, D-320-5) ; contrat annoncé ci-dessous avant le code.

**Services :** `balance-service` (sert) ; `prospera-fiscal-service` (lit ; rendu à C à la fusion de 328).
**Suite de :** STORY-320 (les bases fiscales viennent de la balance), STORY-087 (la balance de clôture d'un exercice).

## Pourquoi

Pour fonder une déclaration, le fiscal cherche « la » balance de l'exercice. Il ne peut pas lire l'origine d'une
balance (garde AD-14) : il retient donc la plus haute version validée, et un socle d'à-nouveaux validé de version plus
haute pourrait passer devant la vraie balance de l'exercice. Et pour cela il télécharge chaque balance avec toutes ses
lignes. Le moteur de balance sait déjà quelle balance est la balance complète d'un exercice (STORY-087) : c'est à lui de
la servir.

## Critères d'acceptation

1. **Étant donné** un exercice avec une balance validée et un socle d'à-nouveaux validé de version plus haute **quand**
   le fiscal demande la balance de référence à une date de l'exercice **alors** c'est la balance validée complète qui
   est servie, jamais le socle.
2. **Étant donné** un exercice sans balance validée mais avec un brouillon **quand** le fiscal demande la référence
   **alors** le brouillon est servi, avec son état ; sans rien, la réponse dit « aucune » (pas une erreur).
3. **Étant donné** une liste de balances **quand** elle est demandée en résumé **alors** aucune ligne n'est servie,
   et le résumé dit tout ce que la liste dit d'autre.
4. **Étant donné** un cabinet A **quand** il demande la référence ou le résumé d'un dossier du cabinet B **alors** il
   reçoit le même refus que pour un dossier inconnu.
5. **Étant donné** une déclaration à préparer **quand** le fiscal lit sa balance **alors** il passe par la référence, et
   ne charge plus aucune ligne.

## Contrat annoncé avant le code (2026-11-24)

**Ajouts seuls.** Mêmes gardes que `GET /api/v1/dossiers/{dossierId}/balances` (portée du dossier, droit du module
`balance`) ; mêmes refus.

- **`GET /api/v1/dossiers/{dossierId}/balances/reference?au=AAAA-MM-JJ`** → `200 { balance: BalanceResumeDto | null }`.
  La balance retenue parmi les **balances complètes** du dossier (origine hors `ORIGINES_HORS_BALANCE_COMPLETE` : ni
  socle d'à-nouveaux, ni portefeuille SFD ; une balance provisionnée EST complète) dont l'exercice **contient** `au`
  (au jour UTC, bornes comprises) : la dernière **`VALIDÉE`** (règle de la balance de clôture, STORY-087 :
  `horodatageValidation` puis `version`, décroissants) ; à défaut la dernière **`BROUILLON`** (`horodatage` puis
  `version`) ; à défaut `null`. Une `REJETÉE` n'est jamais retenue. `au` manquant ou mal formé : `400`.
- **`GET /api/v1/dossiers/{dossierId}/balances/resumes`** (mêmes filtres que la liste : `etat`, `source`, `origine`,
  `limit`, `skip`) → `200 BalanceResumeDto[]`, même tri que la liste.
- **`BalanceResumeDto`** = `BalanceResponseDto` **sans `lignes`** (tous les autres champs, à l'identique, dont
  `sommaire`, `statutPreuve`, `checksum`, `anteriorite`). Un type distinct : un tableau `lignes` vide se lirait comme une
  balance vide.
- **Manifeste `balance` 1.1.0** : les deux routes de lecture neuves.
- **`prospera-fiscal-service`** (STORY-320, D-320-5 levé) : il lit la référence à la date de référence de
  l'obligation ; `BROUILLON` ⇒ bases `PROVISOIRES`, `VALIDÉE` ⇒ `ALIMENTEES`, déséquilibrée ⇒ `BALANCE_DESEQUILIBREE`,
  `null` ⇒ `resumes?etat=REJETÉE` pour dire pourquoi (`BALANCE_REJETEE` ou `BALANCE_ABSENTE`). Il ne lit toujours pas
  l'origine (AD-14). Aucune route du fiscal ne change.

### Décisions prises au contrat (contestables)

- **D-1117-1** : la référence est la **balance de clôture** de STORY-087 (provisionnée comprise), pas la base du
  moteur fiscal (`trouverDerniereBaseFiscale`, qui exclut la balance provisionnée pour ne pas tourner en rond) : une
  déclaration se fonde sur la balance arrêtée ; le calcul (321) restera dans le moteur, sur sa propre base.
- **D-1117-2** : le moteur ne filtre pas sur l'équilibre : il sert la balance retenue, et `sommaire.estEquilibre` le
  dit. Le fiscal qui prenait « le plus haut brouillon équilibré » dira désormais qu'il est déséquilibré quand le dernier
  brouillon l'est : c'est la balance en cours.
- **D-1117-3** : plusieurs exercices contenant `au` (bornes corrigées entre deux imports) : la règle s'applique à toutes
  les balances complètes qui le contiennent, sans choisir d'abord un exercice.

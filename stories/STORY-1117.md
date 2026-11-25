# STORY-1117 : La balance de référence d'un exercice, servie par le moteur de balance — et sa liste sans les lignes

Status: done — **livrée le 2026-11-25** : balance-service **#161** (`e968388` sur `dev`) et prospera-fiscal-service
**#58** (`b2efaa7` sur `dev`) ; voir « Livraison ». Écrite le 2026-11-24 par la session du groupe C, à la demande de A
(STORY-320, D-320-5) ; contrat #842 avant le code.

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

### Livraison (2026-11-25)

- **balance-service** (#161, `e968388`) : `BalanceRepository.trouverReference`, `BalanceService.reference`, deux routes
  dans `BalanceController` (déclarées avant `:id`), `dto/balance-resume.dto.ts` (`BalanceResumeDto` =
  `OmitType(BalanceResponseDto, ['lignes'])`, `BalanceDeReferenceResponseDto`, `?au=` en `AAAA-MM-JJ` réel).
- **fiscal** (#58, `b2efaa7`) : `SourceBalances.reference` (port), `interpreterReference` (une rejetée servie, ou un
  exercice qui ne contient pas le jour : `502 BALANCE_AMONT_INVALIDE`), `BasesObligationsService.resoudre` lit la
  référence ; `retenirLaSource` retirée. **D-320-5 est levé.** L'origine n'est toujours pas lue (AD-14).
- **Preuves, balance-service** (Node 24) : unitaires **5593** (3 suites coupées par un arrêt du poste, rejouées seules :
  44/44), e2e **36/36 suites, 1973/1973** ; dépôt sur un vrai MongoDB **8/8** (socle et portefeuille SFD jamais
  retenus, provisionnée comprise, VALIDÉE avant BROUILLON, REJETÉE jamais, bornes au jour, deux cabinets) ; mutation
  **3/3** (socle admis, rejetée admise, tri par la seule version).
- **Preuves, fiscal** (Node 24) : unitaires **2560** (2 suites lentes, rejouées seules : 51/51), e2e **11/11 suites,
  208/208**.
- **Manifeste `balance` 1.1.0** (#842) : copie au catalogue demandée à B.

### Écarts au contrat, décidés au code

- **D-1117-4** : le résumé lit toujours les lignes en base (`anteriorite` se dérive des lignes servies, STORY-557) ;
  seule la réponse s'allège.
- **D-1117-5** : pas de `docker compose up` : aucun module, fournisseur ni injection neufs dans les deux services (des
  méthodes, un DTO, deux routes) ; les e2e montent les vrais contrôleurs.
- **D-1117-6** : deux tests déjà rouges sur `dev`, corrigés au passage :
  - le garde-fou du recensement STORY-694 de balance-service comptait 34 contrôleurs gardés ; il y en a 35 depuis 1099
    (la mémoire des cahiers) ;
  - le test du cycle de STORY-323 du fiscal clôturait sans montant déclaré, ce que STORY-328 refuse depuis
    (`DECLARE_ABSENT_AU_DEPOT`) : il l'enregistre pendant la préparation.

### Décisions prises au contrat (contestables)

- **D-1117-1** : la référence est la **balance de clôture** de STORY-087 (provisionnée comprise), pas la base du
  moteur fiscal (`trouverDerniereBaseFiscale`, qui exclut la balance provisionnée pour ne pas tourner en rond) : une
  déclaration se fonde sur la balance arrêtée ; le calcul (321) restera dans le moteur, sur sa propre base.
- **D-1117-2** : le moteur ne filtre pas sur l'équilibre : il sert la balance retenue, et `sommaire.estEquilibre` le
  dit. Le fiscal qui prenait « le plus haut brouillon équilibré » dira désormais qu'il est déséquilibré quand le dernier
  brouillon l'est : c'est la balance en cours.
- **D-1117-3** : plusieurs exercices contenant `au` (bornes corrigées entre deux imports) : la règle s'applique à toutes
  les balances complètes qui le contiennent, sans choisir d'abord un exercice.

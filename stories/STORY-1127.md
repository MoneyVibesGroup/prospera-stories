# STORY-1127 : Les référentiels habilités dans l'état publié (`module.referentiels`, champ facultatif)

Status: in-progress — fiche écrite le 2026-11-26 par la session du groupe B juste avant de la coder (lot 7, n° 9 de B,
`coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, deuxième partie, ligne 9 ; identifiant réservé D-L7B-1).
**Date dure : fusionnée au plus tard le 09/12, avant le gel du contrat d'état publié du 11/12** (plan §3, D-L7B-5).

**Service :** `platform-catalog-service` (la partie A du moteur) · **Points :** 3 · **Dépend de :** STORY-932 (le contrat
figé, `contrat-etat-publie-v1`), STORY-936 (le calcul, la route, l'émetteur), STORY-533 (`referentiels` en liste dans le
droit et dans `entitlement.changed` v2), STORY-1080 (la lecture de la console) · **Suite :** STORY-1128 (n° 10, le contrat
figé et l'inventaire d'EPIC-142 → 147 et 159)
**Sources :** plan du lot 7 de B §1 (n° 9 : « C retire son consommateur de `entitlement.changed` (STORY-1006) ») et §3 ;
`PLAN-FEVRIER-2027-TOUT-CHARGE-2026-11-14.md` (EPIC-142 contrat figé le 11/12 ; EPIC-145 « la garde applique l'état publié
seul » ; EPIC-159 « retrait de la lecture de `entitlement.changed` » par les services du cabinet) ; fiche STORY-1006
(D-1006-5) et journal de C (« → B (2026-11-17) : les référentiels habilités dans l'état publié ? ») ; réponse de B au
journal (« pris en charge, pas encore servie ») ; fiche STORY-972 (D-972-10).

---

## Pourquoi

Depuis STORY-1006, `prospera-assurance-service` lit le droit, la lecture seule et l'interrupteur `compta-cima` dans l'état
publié, mais garde un consommateur de `entitlement.changed` **pour le seul champ `referentiels`** (palier ④ de sa garde :
`cima-assurances@7.0` exigé) : l'état publié ne le porte pas (D-1006-5). Tant qu'il en est ainsi, le service lit deux
sources, et EPIC-145 (« `entitlement.changed` ne ferme plus rien ») ne peut pas se refermer. Le contrat d'état publié est
figé le 11/12 (EPIC-142, STORY-1128) : après, plus rien ne s'y ajoute sans version neuve. Cette story y ajoute, **avant le
gel**, la liste des référentiels habilités, champ facultatif, à la route et à l'événement.

## Ce qui est déjà livré (relu dans le code le 26/11, `origin/dev` `ce8cbc0`)

- **Le droit** (`Entitlement.referentiels`, STORY-533) : liste `{ code, version }`, **absente** si le module n'en consomme
  aucun, jamais vide (`default: undefined`). Écrite par l'octroi (`PUT …/entitlements`, `…/declarations`) et les chemins du
  moteur ; validée (versions existantes, non `RETIRED`) avant l'écriture.
- **`entitlement.changed` v2** (`EntitlementEventsService.changed`) : porte `referentiels` (omis si vide) ; pour les modules
  à artefact fiscal (`MODULES_A_ARTEFACT_FISCAL` = `fiscalite`, `declarations`), chaque entrée porte aussi `artifactUri` et
  `checksum` (`sha256:<64 hexa>`), lus au registre des référentiels ; un référentiel fiscal sans intégrité **refuse
  l'écriture** du droit. L'émission recalcule l'état publié dans la même transaction (`EmetteurEtatPublie.recalculer`).
- **L'état publié** : aucun champ `referentiels`, ni dans `contrat/etat-publie.openapi.json` (`ModuleEtatPublie`) ni dans
  `contrat/schemas/etat-publie.changed.json` (`module`) ; un test garde que les deux définitions sont **identiques**
  (`src/contrat/etat-publie.contrat.spec.ts`). Le calcul (`LectureEtatPublie.calculer`, commun à la route du contrat et à
  la lecture de la console de 1080) et l'émetteur ne lisent pas les référentiels du droit.
- **L'émetteur** ne publie que si `etat`, `finLe` ou `effacementLe` changent (`etats_emis`) : un changement de
  référentiels seul (nouvelle version d'un paquet fiscal déclarée) ne serait pas publié.
- **Les consommateurs** : `assurance` lit `referentiels: { code, version }[]` dans `entitlement.changed` (lecteur v1 et v2,
  `referentielsHabilites`) ; `prospera-fiscal-service` lit `artifactUri` et `checksum` dans le même fait (rattachement du
  paquet fiscal) ; les gardes partagées (`garde-etat-publie`, copiées à l'octet) ne lisent que l'état et `versionMatrice`.
- **Le BFF** (1080) projette l'état publié champ par champ pour la console (code, libellé, état, dates, version, acquis) ;
  la console lit les référentiels du droit par le relais des droits (AP-10, `AdminEntitlementDto.referentiels`).
- **`prospera-plateforme`** ne copie pas le schéma de l'état publié ; son catalogue des faits nomme le topic `@1` seulement.

## Contrat annoncé avant le code (2026-11-26)

**Un ajout facultatif, au modèle fermé de `module`**, à la route (`ModuleEtatPublie`) et à l'événement
(`etat-publie.changed.essai@1`, `.reel@1`), même définition des deux côtés :

```json
"referentiels": {
  "type": "array",
  "minItems": 1,
  "items": {
    "type": "object",
    "additionalProperties": false,
    "required": ["code", "version"],
    "properties": {
      "code": { "type": "string", "minLength": 1 },
      "version": { "type": "string", "minLength": 1 },
      "artifactUri": { "type": "string", "minLength": 1 },
      "checksum": { "type": "string", "pattern": "^sha256:[a-f0-9]{64}$" }
    }
  }
}
```

- **Sens** : les référentiels habilités par le droit du module, **la même liste** que `referentiels` de
  `entitlement.changed` v2, dans le même ordre, à la même forme. `artifactUri` et `checksum` : modules à artefact fiscal
  seulement (`fiscalite`, `declarations`), ensemble.
- **Présent** quand le droit en porte et que le module est installé (même règle que `versionCode` : jamais en
  `NON_INSTALLE` ni `EN_INSTALLATION`) ; **omis** sinon ; **jamais présent et vide**.
- ⛔ **N'ouvre rien** : seul `etat` ouvre (matrice). Un consommateur qui exige un référentiel et ne le trouve pas refuse.
- **Versions** : `schemaVersion` de l'événement reste **1**, `schemaEtatPublie` reste **1**, topics inchangés ;
  `contrat/etat-publie.openapi.json` **1.0.0 → 1.1.0** ; étiquette **`contrat-etat-publie-v1.1`** posée sur le commit fusionné
  (`contrat-etat-publie-v1` inchangée). Registre : compatible **BACKWARD**, prouvé sur Karapace.
- **Émission** : un changement de la liste (une version neuve de paquet déclarée) publie un état neuf (`numero` suivant),
  même si l'état ne change pas. Au premier démarrage du catalogue livré, chaque module dont le droit porte des référentiels
  est **republié une fois** (rattrapage : les consommateurs les reçoivent sans attendre un fait neuf).
- **Manifeste `instance`** (la source est le catalogue) : **1.0.0 → 1.1.0**, `publie` inchangé (noms et `@1`) ; recopié
  dans `copies.json` (copie entière, depuis `prospera-stories` `main`).
- **Inchangés** : `entitlement.changed` (forme, émission, refus), la matrice, la garde partagée, le BFF (D-1127-8),
  `prospera-plateforme` (D-1127-9), les droits (auth), toute autre route.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | La route `GET /etat-publie/{organisationId}` et la lecture de la console rendent `module.referentiels` du droit (même ordre, même forme que `entitlement.changed`), omis sans référentiel ou hors installation, jamais vide | unitaires ; pile |
| AC-2 | `etat-publie.changed` porte la même liste, valide au schéma ; route et événement gardent une seule définition du module | unitaires (contrat) ; pile (message lu sur Kafka, validé) |
| AC-3 | Un module fiscal porte `artifactUri` et `checksum` du registre ; un référentiel sans intégrité lisible est publié sans eux, jamais une panne de la lecture ni de l'émission | unitaires |
| AC-4 | Un changement de liste seul publie un état neuf (`numero` suivant) ; une liste inchangée ne publie rien ; au démarrage, un état émis sans la liste est republié une fois | unitaires ; socle (vrai MongoDB) ; pile |
| AC-5 | Le schéma neuf est compatible BACKWARD avec celui de `contrat-etat-publie-v1` sur Karapace, et s'y enregistre | pile (`test:schemas`, `schemas:enregistrer`) |
| AC-6 | Manifeste `instance` 1.1.0 à la source et dans `copies.json` ; `manifestes:garde` verte | garde ; unitaires |
| AC-7 | Contrat annoncé avant la fusion ; C (et D, qui tient `assurance` depuis le lot 6) prévenus du chemin et de la forme | journal ; message |

## Décisions retenues par défaut (contestables)

- **D-1127-1 — Le nom et la place : `module.referentiels`**, le nom du droit et de `entitlement.changed` ; dans `module`
  (l'état d'UN module), à la route et à l'événement, une seule définition (le test de STORY-932 la garde).
- **D-1127-2 — La forme de `entitlement.changed` v2, `artifactUri` et `checksum` compris** (modules fiscaux seulement).
  `assurance` n'a besoin que de `code` et `version` ; mais EPIC-159 retire aussi la lecture de `entitlement.changed` dans
  `prospera-fiscal-service` et `balance-service`, et le fiscal rattache son paquet par `artifactUri` et `checksum`. Après le
  gel du 11/12, les ajouter demanderait une version neuve : ils entrent maintenant, facultatifs.
- **D-1127-3 — Présent comme `versionCode`** : seulement quand le module est installé (ni `NON_INSTALLE`, ni
  `EN_INSTALLATION`) et que le droit en porte. Omis sinon, jamais vide (STORY-533 : l'absence dit déjà « aucun »).
- **D-1127-4 — L'émetteur compare aussi la liste** (rangée dans `etats_emis.referentiels`, comparée champ à champ, ordre
  compris). Conséquence voulue : au premier démarrage après la livraison, chaque module dont le droit porte des
  référentiels est republié une fois (`numero` + 1).
- **D-1127-5 — Tolérance de la lecture** : un référentiel fiscal dont le registre ne donne pas une intégrité lisible
  (version absente, `artifactUri` vide, `checksum` mal formé) est publié **sans** `artifactUri` ni `checksum`, avec un
  avertissement au journal du service ; jamais une exception. L'émetteur tourne au démarrage pour tous les droits et à
  l'heure des échéances : un référentiel abîmé ne doit ni arrêter ce tour ni fermer la route. Le refus reste à l'écriture
  du droit (`entitlement.changed`, inchangé), si bien que le cas ne naît que d'un registre altéré après l'octroi.
- **D-1127-6 — Versions** : un ajout facultatif ne change ni `schemaVersion`, ni `schemaEtatPublie`, ni le topic `@1`
  (AD-27) ; l'OpenAPI du contrat passe en 1.1.0 ; étiquette `contrat-etat-publie-v1.1` (comme `contrats-instance-v1.1` à la
  suite de STORY-953) ; les copies épinglées des consommateurs restent valides (lecteur tolérant, C12).
- **D-1127-7 — Manifeste `instance` 1.0.0 → 1.1.0** : le contrat d'un fait qu'il publie gagne un champ (même geste que
  `paiement` 1.2.0, STORY-1141) ; `copies.json` regénéré par `manifestes:copier` depuis `_wt-b-stories` sur `origin/main`
  (copie entière : vérifier d'abord qu'elle n'entraîne aucun autre manifeste).
- **D-1127-8 — Le BFF ne relaie pas `referentiels`** : la projection de 1080 est la ligne de la console (l'état de chaque
  module) ; la console lit déjà les référentiels du droit par AP-10 (`AdminEntitlementDto.referentiels`). Aucune OpenAPI du
  BFF ne change. À relayer (une ligne de `projeterModule`, un DTO) quand un écran de A le demande.
- **D-1127-9 — `prospera-plateforme` inchangée** : elle ne copie pas le schéma de l'état publié ; la garde partagée ne lit
  que l'état et `versionMatrice` ; le catalogue des faits nomme le topic `@1`, qui ne change pas.
- **D-1127-10 — `versionCode` reste hors de la comparaison de l'émetteur** (un changement de version seule n'est pas
  republié, depuis STORY-936) : écart préexistant, hors de ce champ ; **nommé pour l'inventaire de STORY-1128**.
- **D-1127-11 — Les consommateurs basculent chez eux** : `assurance` est à D depuis le lot 6 ; C a posé la question
  (D-1006-5). Le message part aux deux avec le chemin et la forme ; B ne touche aucun de leurs dépôts.

## Hors de cette story

- Le retrait du consommateur de `entitlement.changed` dans `assurance` (D, à sa semaine) ; la bascule du fiscal et de
  balance (EPIC-159, STORY-1129 et suivantes).
- Le gel du contrat et l'inventaire d'EPIC-142 → 147 et 159 (STORY-1128).
- Le relais du BFF (D-1127-8).

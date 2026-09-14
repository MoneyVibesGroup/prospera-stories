# STORY-501 : Un crédit est la somme de ses événements — jamais un encours qu'on corrige

Status: done

**Complexité :** high

**Épic :** EPIC-123 — Portefeuille de crédits
**Service :** `microfinance-service`
**Points :** 13 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`, **AD-1** de la spine.

---

## Le fait

Un encours restant dû n'est **pas un compteur**. C'est le résultat d'une suite d'événements :
octroi, décaissement (parfois en plusieurs tranches), remboursements, rééchelonnement,
passage en perte. Un module qui stocke l'encours et le met à jour ne sait pas répondre à
*« pourquoi 1 240 000 et pas 1 500 000 ? »* — et c'est la question que pose le premier contrôle.

⚡ **C'est le même invariant que `stock-service`** (AD-1/AD-2 de sa spine) : la propriété n'est pas
comptable, elle est structurelle, et tout le reste — le classement, le provisionnement, l'audit, le
portefeuille à une date passée — en découle.

## Cadrage mesuré avant de coder (2026-09-14)

| Affirmation | Verdict | Mesure |
|---|---|---|
| Un **produit de crédit** existe | **FAUX** | aucun service, aucune collection, aucun read-model ne le définit |
| Une **agence** existe | **FAUX** | D-499-A : seule la spine de `reseau-service` la définit, service sans code |
| L'ordre d'imputation d'un remboursement est connu | **PRÉMATURÉ** | il est déclaré en STORY-502 (AC-2), avec l'échéancier |
| Le nantissement d'un dépôt est rapprochable | **VRAI** | STORY-500 livre le blocage daté, motivé, attribué ; le hook `CREDIT_NANTI_PAR_BLOCAGE` (D-500-D) désigne 501 |
| Un patron de points d'arrêt existe dans le code | **FAUX** | `stock-service` n'a que sa spine ; `depots` dérive par rejeu intégral |

### Décisions du 2026-09-14

- **D-501-A — l'agence d'un crédit est un emplacement inerte** (précédent user D-499-A) : un code libre
  deviendrait la clé d'agrégation de STORY-506. Débloqué par le read-model d'agences de `reseau-service`.
- **D-501-B — le produit de crédit est un référentiel local du dossier (décision user)** : collection
  `produits_credit` (code unique par dossier, charset fermé, libellé), créée par l'API ; le crédit porte un
  `produitId` **validé**. Les conditions du produit (ordre d'imputation) s'y ajoutent en STORY-502.
- **D-501-C — un remboursement porte sa ventilation SAISIE (décision user)** : capital et intérêts, entiers
  dans l'exposant de la devise. 501 dérive l'encours, le capital remboursé et les intérêts perçus ; en
  STORY-502, l'imputation déclarée remplace la saisie (aucun contrat n'est encore publié).
- **D-501-D — les garanties sont déclarées à l'octroi, figées, et le nantissement de dépôt est lié (décision
  user)** : type fermé, valeur, référence ; un nantissement de dépôt référence un **blocage validé** (même
  dossier, même membre, actif à la date d'octroi, jamais déjà affecté à un autre crédit). Le hook D-500-D est
  débloqué.
- **D-501-E — dérivation pure, aucun point d'arrêt persisté (décision user)** : la situation d'un crédit se
  recalcule par rejeu intégral de ses événements. La performance du portefeuille entier relève de STORY-503
  (AC-5) ; la linéarité est consignée comme dette.
- **D-501-F — une convention contractuelle n'est jamais supposée** (doctrine D-500-A / D-499-B) : taux,
  base de calcul, durée, périodicité et différé sont obligatoires à l'octroi, sans défaut ni constante.

### Hors périmètre, déclaré

Échéancier et imputation déclarée (STORY-502) · rééchelonnement (STORY-502/505) · passage en perte et
recouvrement (STORY-505) · classement (STORY-503) · publication en balance et hors bilan (STORY-507/508) ·
publication d'événements · scoring ou décision d'octroi (AD-12).

## Critères d'acceptation

- [ ] AC-1 — Les événements de crédit sont **append-only** : le schéma le refuse, pas seulement la
      convention. Une correction est un **événement de correction**, pas une mise à jour.
- [ ] AC-2 — L'encours restant dû, le capital remboursé et les intérêts perçus sont **dérivés** à
      une date d'arrêté. Points d'arrêt et rejeu, comme la dérivation de `stock-service`.
- [ ] AC-3 — Un crédit porte : montant octroyé, taux, durée, périodicité, différé éventuel,
      garanties, **agence** et **produit de crédit**.
- [ ] AC-4 — Le **décaissement en plusieurs tranches** est supporté : un crédit octroyé et non
      décaissé n'est **pas** un encours — c'est un **engagement hors bilan** (AD-9, STORY-508).
- [ ] AC-5 — ⛔ **Le module ne décide aucun octroi** (AD-12) : ni scoring, ni analyse de risque. Il
      enregistre une décision prise ailleurs, avec son auteur et sa date.
- [ ] AC-6 — Le portefeuille à une date passée se rejoue à l'identique, en désordre et après
      redémarrage. C'est ce test qui fait de la story « terminé », pas la recette fonctionnelle.

## Progress Tracking

**Statut : `done` (2026-09-14).** PR `microfinance-service` **#5** intégrée en rebase-merge sur `dev` (2 commits
de feature, 1 de revue) ; branche supprimée. Décisions D-501-A → D-501-F consignées ci-dessus. PR
`microfinance-service` **#5**.

### Développement — livré (sous-agent `opus`, rapport vérifié en session)

- Module `credits` : collections `produits_credit` (immuable, code unique par dossier), `credits` (conditions
  immuables, verrou `revision` avec `timestamps: false`, **aucun encours en base**) et `mouvements_credit`
  (append-only refusé par le schéma : `DECAISSEMENT`, `REMBOURSEMENT` ventilé, `ANNULATION`,
  `ANNULATION_OCTROI`). Situation et portefeuille **dérivés** à une date d'arrêté, avec la liste des événements
  retenus (« pourquoi 1 240 000 »). Hook D-500-D débloqué : `CREDIT_NANTI_PAR_BLOCAGE` livré.
- 12 routes (GET/POST seulement) sous `dossiers/:dossierId/microfinance`.

### Décisions prises pendant le dev (2026-09-14)

- **D-501-G — l'index de nantissement du brief était faux sur Mongo réel** : un unique sur
  `garanties.blocageId` indexe `null` pour chaque garantie sans blocage ⇒ deux crédits « nantissement +
  caution » entraient en collision (faux `BLOCAGE_DEJA_NANTI`). Tableau `blocagesNantis` + index unique
  partiel `unicite_blocage_nanti`.
- **D-501-H** — mouvement à annuler introuvable (paramètre d'URL) ⇒ `404 MOUVEMENT_CREDIT_INTROUVABLE`, même
  corps inexistant / malformé / autre crédit.
- **D-501-I** — nombre de périodes `⌈durée / pas⌉`, `A_ECHEANCE` = 1 ; borne le différé.
- **D-501-J** — un blocage levé à **n'importe quelle date** ne peut pas être nanti.
- **D-501-K** — annulation d'octroi : aucun décaissement non annulé, date ≥ dernier mouvement.
- **D-501-L** — une annulation ne recopie aucun montant ; elle agit **à sa date**, jamais rétroactivement.
- **D-501-M** — avant la date d'octroi : engagement nul, aucun événement.
- **D-501-N** — produit cité au corps mais absent du dossier ⇒ `409 PRODUIT_CREDIT_INTROUVABLE`.
- **D-501-O** — taux borné comme les DAT (1 à 10 000 points de base).
- **D-501-P** — référence de garantie au charset fermé, sans espace : on ne peut pas y écrire un nom.
- **D-501-Q** — produits en sous-dossier de `CreditsModule` ; `decision` validée `@IsObject`.

### Mutations (rougissent par assertion, restaurées sans `git checkout`)

| Mutation | Test qui rougit |
|---|---|
| `timestamps: false` retiré du verrou | `credits.repositories.spec.ts` ; `credits.mongo.e2e-spec.ts` |
| décaissé ≤ octroyé retiré | `invariants-credit.spec.ts`, `credits.service.spec.ts`, e2e « cycle » |
| capital ≤ décaissé vérifié au total seulement | annulation d'une tranche ⇒ violation à une date **intermédiaire** |
| effet d'annulation à la date de la cible / rejeu rétroactif | `invariants-credit.spec.ts`, `situation-credit.spec.ts`, AC-6 sur Mongo |
| garde membre ACTIF au décaissement retirée | `credits.service.spec.ts` (RADIE, DECEDE), e2e |
| blocage d'un autre membre accepté | `depots.repositories.spec.ts`, `credits.mongo.e2e-spec.ts` |
| exercice clos ignoré | `credits.service.spec.ts` (3), `credits.mongo.e2e-spec.ts` |
| route paramétrée avant les littérales | `credits.controller.spec.ts` |
| garanties sans `@IsObject({ each })` (revue ⑥) | `credits.dto.spec.ts` (2 cas) — **rejouée en session** |

### Revue de code (⑥) — un bloquant corrigé, deux non bloquants corrigés

- **[bloquant, 90] Une garantie envoyée comme TABLEAU passait le pipe et rendait 500** : `@ValidateNested({ each })`
  seul admet `garanties: [[]]` ; le service construisait une garantie sans type, Mongoose levait une
  `ValidationError` que le filtre ne traduit pas. Le piège fermé pour `decision` (D-501-Q) restait ouvert sur
  les éléments de la liste. **Corrigé** (`@IsObject({ each: true })`), mutation prouvée.
- **[90] Méthode morte** `MouvementsCreditRepository.trouver` (aucun appelant, figée par un test) — retirée.
- **[95] Commentaire citant un spec inexistant** — corrigé.
- Lentille over-engineering (`ponytail-review`) **non passée** sur ce run, pour tenir le rythme demandé.

### Revue de sécurité (⑦) — aucune vulnérabilité

Pistes écartées avec preuve : filtres org/dossier/membre/crédit sur chaque lecture et verrou ; blocage d'un
autre membre/dossier/org ⇒ même `409 BLOCAGE_NANTI_INTROUVABLE` qu'un inexistant ; cible d'annulation cherchée
parmi les seuls mouvements du crédit verrouillé ; 404 jamais 403 ; injection NoSQL (identifiants, dates,
curseur validés en chaîne) ; mass assignment (devise, exposant, auteur, portée jamais lus du corps,
`forbidNonWhitelisted` sur les objets imbriqués) ; E11000 traduits par nom d'index ; concurrence (verrou en
première écriture + index uniques d'annulation, d'annulation d'octroi et de nantissement) ; exercice clos ;
BigInt et borne des entiers sûrs ; `decidePar` jamais journalisé.

### Portes sur l'état final (HEAD `9071849`, rejouées en session après les correctifs de revue)

Lint 0 · build OK · **1 886** unitaires / 99 suites, couverture **99,74 / 96,63 / 99,45 / 99,78** · **279** e2e
(38 sautés : suites Mongo sans URI) · **28/28** sur Mongo réel (`credits.mongo` 15, `depots.mongo` 13, aucun sauté).

### ✅ Vérification docker — douze points prouvés, aucun défaut (HEAD `9071849`)

Code servi prouvé **avant** le premier point : processus démarré après la dernière modification de `src/`, 0
`EADDRINUSE`, `PRODUIT_CREDIT_CODE_EXISTANT` publié sur le port, et `garanties: [[]]` rendu **400** (le correctif
de revue est bien celui qui tourne). Jetons RS256 réels, montants codés dans le harnais avant exécution, recalculs
`mongosh` directs. Rapport du sous-agent **recontrôlé en session** : empreintes des trois relectures du portefeuille
identiques.

| Point | Verdict |
|---|---|
| **P1** collections `produits_credit`, `credits`, `mouvements_credit` ; 4 index uniques nommés, dont `unicite_blocage_nanti` partiel | **PROUVÉ** |
| **P2** produit : 201, doublon ⇒ 409 `PRODUIT_CREDIT_CODE_EXISTANT`, un seul document | **PROUVÉ** |
| **P3** octroi : conditions exactes, **aucun encours, solde ni agence** parmi les 21 clés, devise du dossier, auteur = `sub` ; sans base ⇒ 400, `[[]]` ⇒ 400, rien écrit | **PROUVÉ** |
| **P4** nantissement sur 4 blocages réels : 201 ; même blocage ⇒ 409 `BLOCAGE_DEJA_NANTI` ; autre membre ⇒ 409 ; blocage levé ⇒ 409 ; deux crédits « nantissement + caution » coexistent (D-501-G) | **PROUVÉ** |
| **P5** tranches 1 000 000 + 500 000, troisième ⇒ 409 ; engagement hors bilan 1 500 000 → 500 000 → 0 | **PROUVÉ** |
| **P6** remboursements saisis en désordre : API = `mongosh` = attendu à trois dates ; événements retenus chronologiques | **PROUVÉ** |
| **P7** annulation d'une tranche déjà remboursée ⇒ 409 ; annulation valide agit **à sa date** (veille inchangée) ; double annulation ⇒ un document | **PROUVÉ** |
| **P8** rejeu AC-6 : portefeuille au 30/06 relu avant, après écritures ultérieures et après **redémarrage du service** ⇒ diff vide | **PROUVÉ** |
| **P9** concurrence HTTP : 2 × 60 sur 100, **5 tirages** ⇒ `[201, 409]` chaque fois, un seul décaissement | **PROUVÉ** |
| **P10** portée : autre membre, dossier, organisation ⇒ 404 au corps de l'inexistant ; dossier d'ENTREPRISE ⇒ les **12 routes** en 409, rien écrit | **PROUVÉ** |
| **P11** exercice clos ⇒ 409 `EXERCICE_CLOS`, rien écrit ; témoin en exercice ouvert ⇒ 201 | **PROUVÉ** |
| **P12** 0 orphelin, 0 incohérence org/dossier/membre/devise, 0 annulation hors crédit ; journaux sans `decidePar`, référence ni motif ; aucune 500 sur 93 réponses | **PROUVÉ** |

Réserves : P9 sans preuve d'arrivée à la même milliseconde (écart de départ < 0,4 ms) ; P10 sur dossier
d'entreprise mesure l'ordre des gardes ; non rejoués en docker (gardés par unitaires et mutations) : annulation
d'octroi, membre radié, bornes. Mots de passe des comptes de vérif 497 réinitialisés par le parcours
`forgot-password` (non conservés). Effets de bord laissés en base de dev : « IMF Verif 500 A » (2 produits,
10 crédits, 14 mouvements de crédit, 4 blocages) et « IMF Verif 500 B » (1 produit, 1 crédit).

### Réserves et dettes

- **Levée d'un blocage nanti** : les dépôts ne la refusent pas (ils ne lisent pas les crédits) ; le nantissement
  est validé hors transaction. Documenté, hors périmètre.
- **Rejeu intégral linéaire** (D-501-E) ; une divergence de devise dans une page du portefeuille rend la page en 409.
- Statut du membre hors verrou, même arbitrage que les dépôts.
- ⚠️ Un test e2e a échoué **une fois**, pendant un passage lancé en parallèle de la couverture et des specs Mongo ;
  non identifié (sortie filtrée), **non reproduit** au passage suivant (279/279). Consigné comme non reproduit.
- Portly indisponible pendant le run (« not running ») : tests bornés lancés directement.

## Notes

- Voir [[STORY-502]] (l'échéancier), [[STORY-503]] (le classement dérivé), spine AD-1.

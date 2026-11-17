# STORY-1006 : `compta-cima` lu sur l'état publié

Status: done

**Complexité :** moyenne (un port, une projection, un consommateur, la garde, la configuration, une preuve de pile)

**Épic :** EPIC-201 (socle des modules)
**Dépôt :** `prospera-assurance-service`
**Plage :** groupe C, n° 2 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §5) ; dépend de STORY-1005
(même patron) et de `garde-etat-publie-v1` (B-937).

---

## Pourquoi

STORY-981 (D-981-1) lisait l'interrupteur `compta-cima` dans la configuration du droit `assurance`
(`entitlement.changed`, `config.interrupteurs`), « en attendant l'état publié », sous la forme exacte du contrat figé.
Le contrat d'état publié porte bien `module.interrupteurs[] = { code, allume, dateLimite? }` (schéma
`etat-publie.changed.json`, `required` dans `module`) ; le moteur publie désormais cet état. Cette story fait la bascule
que D-981-1 annonçait : la position se lit là où le moteur la publie.

**Source** : plan lot 3 §5 (ligne 1006) ; D-981-1, D-981-2 ; contrat `contrat-etat-publie-v1` ; STORY-1005.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | La garde `AssuranceAccessGuard` lit le droit, la lecture seule et l'interrupteur par le port `EtatDuModule`, alimenté par la projection de `etat-publie.changed.<espace>@1` ; routes et codes inchangés | tests ; pile |
| AC-2 | La garde partagée de B est copiée à l'octet dans `src/vendor/garde-etat-publie/` (sha256 `a830c449…`) | pile (empreinte) |
| AC-3 | `compta-cima` éteint = absent de la liste, `allume` non booléen, entrée mal formée, module fermé, état absent : `COMPTA_CIMA_ETEINTE` (route comptable, module ouvert) ou `ASSURANCE_NOT_ENTITLED` (état absent ou fermé) | tests ; pile |
| AC-4 | L'ancienne position (`config.interrupteurs` du droit) ne change plus rien | e2e ; pile |
| AC-5 | État plus ancien sans effet, état de l'autre espace ou d'un autre module ignoré, état plus récent applique (la liste est remplacée) | tests ; pile |
| AC-6 | Nouvelles variables `KAFKA_ETAT_PUBLIE_GROUP_ID`, `INSTANCE_ESPACE` (défaut `REEL`) ; le service démarre | pile |

## Décisions retenues par défaut (contestables)

- **D-1006-1 — Le contrat de B porte l'interrupteur : c'est `module.interrupteurs[]` du module `assurance`.** Pas
  d'« option » ni de module `compta-cima` publié : la position est celle du manifeste d'`assurance` (C12). Le droit, la
  lecture seule et l'interrupteur se lisent ensemble, dans le même fait, par un seul port. Note : à la date de
  STORY-936, la route de B publie `interrupteurs` vide (D-936) ; tant que le moteur n'allume rien, `compta-cima` est
  éteint partout, ce qui est le défaut voulu par D-981.
- **D-1006-2 — Mêmes règles que STORY-1005 pour le droit.** `LECTURE_SEULE` se traduit en `ACTIVE` à échéance d'époque 0
  (la garde refuse l'écriture par `ABONNEMENT_EXPIRE`, rend la lecture) ; lecture fermée (`NON_INSTALLE`, `SUSPENDU`,
  valeur inconnue, version de matrice inconnue…) : refus `ASSURANCE_NOT_ENTITLED`. L'état publié décide seul pour le
  droit : plus de double lecture.
- **D-1006-3 — Entrée illisible = éteinte.** La lecture du fait ne retient que `{ code: texte non vide, allume:
  booléen }` ; le reste est écarté. `dateLimite` n'est pas lue (le moteur publie la position effective).
- **D-1006-4 — Un module fermé n'allume rien.** Quand la lecture est fermée, les interrupteurs sont rendus vides.
- **D-1006-5 — Les référentiels habilités restent lus dans `entitlement.changed`.** L'état publié ne porte pas
  `referentiels` (palier ④ du gate, STORY-533) : le consommateur `entitlement.changed`, sa projection et le read-model
  restent, mais la garde n'y lit plus que `referentiels`. Les champs `status`, `config`, `terme`, `echeanceLe` de ce
  read-model ne sont plus lus. **Demande à B** (journal de C) : l'état publié portera-t-il un jour les référentiels
  habilités ? Tant que non, `assurance` garde ce fil.
- **D-1006-6 — Ordre de la garde inchangé** (e-mail, KYC, droit, `compta-cima`, lecture seule, référentiel). Une
  conséquence nouvelle : sans entitlement mais avec état publié ouvert, le refus est `REFERENTIEL_NON_HABILITE`, plus
  `ASSURANCE_NOT_ENTITLED`.
- **D-1006-7 — La collection `org_assurance_etat_publie`** (une ligne par organisation, index unique) ; la projection
  est idempotente par `(epoque, numero)`, sans registre d'`eventId`.
- **D-1006-8 — `src/vendor` est ignoré par eslint** (copie à l'octet, jamais reformatée), comme dans `sinistres`.

## Ce qui a été livré

**2026-11-17** — `prospera-assurance-service` **#25**, fusionnée en « Rebase and merge » : `dev` `93c0e23`
(`d162771` + `93c0e23`).

- Code : port `EtatDuModule` (adaptateur `EtatDuModuleEtatPublie`), `lireEtatPublie`, projection
  `EtatPublieProjectionService`, consommateur `EtatPublieConsumer` (supervisé), schéma `org_assurance_etat_publie`,
  garde partagée copiée à l'octet, `interrupteurAllume(liste, code)` ; configuration et validation d'environnement.
- **Node 24, export de la branche** : 127 suites, **2 389 unitaires**, **367 e2e**, lint 0, build 0.
- Un premier passage de l'étage de vérification a rougi (lint de la copie de la garde ; double de `ConfigService` du
  test du graphe d'injection sans `kafka.espace`) : corrigés avant la PR.
- **Pile `grp-c-1006`** (assurance, MongoDB rs0, Kafka, IdP de test) : service healthy, 7 consommateurs lancés, 0
  erreur aux journaux ; sans état : refus `ASSURANCE_NOT_ENTITLED` malgré le droit `ACTIVE` ; `EN_SERVICE` sans
  interrupteur : `COMPTA_CIMA_ETEINTE` bien que `config` du droit allume `compta-cima` ; allumé dans l'état publié :
  servi ; `LECTURE_SEULE` : lecture 200, écriture `ABONNEMENT_EXPIRE` ; `SUSPENDU` refusé ; rejeu ancien, `entitlement.changed`,
  autre espace et autre module sans effet ; plus récent rouvre ; le moteur éteint ⇒ `COMPTA_CIMA_ETEINTE` (liste
  remplacée) ; `allume` non booléen ⇒ éteint.
- **Rejeu depuis `origin/dev`** (`93c0e23`, export, volumes neufs) : mêmes chiffres (127 suites, 2 389 unitaires, 367 e2e,
  lint 0, build 0) et service healthy, 0 erreur aux journaux.

**Reste** : la collection `org_assurance_entitlement` garde ses champs inutilisés (aucune migration) ; question à B sur
les référentiels (D-1006-5).

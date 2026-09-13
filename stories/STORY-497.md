# STORY-497 : Socle `microfinance-service` — le portefeuille naît dans un dossier, sur le référentiel du dossier

Status: ready-for-dev

**Épic :** EPIC-121 — Socle vertical SFD
**Service :** `microfinance-service` (nouveau)
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-533** (N référentiels par organisation) · **STORY-422** (le plan suit le dossier)
**Origine :** découpage `epics-microfinance-2026-08-27.md`, spine AD-6/AD-7/AD-8.

---

## Le fait

Le service n'existe pas. Ce qui existe, et qu'il ne faut pas refaire : `sfd-bceao@2.0` est packagé,
sourcé et **complet** — 372 comptes du RCSFD, `BAT`/`BPT` en `FORMULE` avec leurs `role`
`TOTAL_ACTIF`/`TOTAL_PASSIF`, cascade `RSA → RSG` des soldes intermédiaires DIMF 2080. *(Vérifié dans
l'artefact le 2026-08-27.)*

⚡ **Le socle n'a jamais été compté dans un PRD de ce programme** — quatre fois d'affilée (`reseau`,
`catalogue-produits`, `stock`, `pdv`). Il l'est ici dès le découpage, et c'est pour cela que la
story vaut 13 et non 5.

## Critères d'acceptation

- [ ] AC-1 — Scaffold sur le moule commun : NestJS, config, Swagger, health, docker-compose,
      Mongo replica set, outbox Kafka. Aucun écart au moule.
- [ ] AC-2 — Gate `@RequiresMicrofinanceAccess` : e-mail → KYC → entitlement, **dans cet ordre**,
      comme les modules existants. L'habilitation exige `sfd-bceao` dans la liste de l'organisation
      (STORY-533 AC-3).
- [ ] AC-3 — **Tout agrégat appartient à un dossier** (AD-6). Un accès hors portée répond
      **`404`, jamais `403`** : un `403` révèle l'existence de la ressource.
- [ ] AC-4 — Read-model `exercices_dossier` (AD-P14). Aucune écriture sur un exercice clos.
      ⚠️ La garde interroge `exercices_dossier`, **pas** `exercices_atelier` — c'est exactement le
      piège de STORY-374, et `estClos` rendant `false` sur un exercice introuvable, s'y tromper
      laisse la garde **ouverte en permanence**.
- [ ] AC-5 — ⛔ **Le référentiel résolu est celui du DOSSIER** (AD-8). Un test de mutation le prouve :
      un compte `57…` d'une IMF est son **capital social** en SFD et la **Caisse** en SYSCOHADA — le
      valider contre SYSCOHADA ne rate jamais et donne des états faux.
- [ ] AC-6 — ⚠️ **Aucune constante `XOF` dans ce service** (AD-11) : la devise vient du contrat
      canonique (STORY-489). Vérifié par un test de présence, pas par relecture.

## Mesuré le 2026-09-13 — story REPORTÉE, et trois arbitrages tranchés

⏸ **Reportée sur décision user du 2026-09-13** : le service n'existe pas et son dépôt non plus.
Les prérequis, eux, sont **vérifiés dans le code** : STORY-533 (`entitlement.schema.ts` porte
`referentiels?: {code,version}[]`, publié sur `entitlement.changed`), STORY-422
(`resoudreReferentielDuDossier`) et STORY-489 (devise au contrat canonique) sont bien livrées.

**Décisions user du 2026-09-13, à appliquer à la reprise :**

- **D-497-A — le dépôt reste à créer** : `MoneyVibesGroup/prospera-microfinance-service` (convention
  observée : un dépôt par service). ⚠️ La racine du workspace **n'est pas un dépôt git** :
  `docker-compose.yml`, l'override et `.github/workflows/ci.yml` ne sont versionnés nulle part —
  leurs ajouts sont locaux, et ce point doit être tranché séparément.
- **D-497-B — un NOUVEAU module `microfinance` au catalogue** ouvre le service (pas de réutilisation
  de `credit` ni de `conformite-bceao`). ⛔ À corriger dans le même geste : le pack `imf-sfd`
  (`packs.seed-data.ts:66`) cite **`sfd-bceao@1.3`**, version qui **n'existe pas** (le registre ne
  connaît que `1.0` et `2.0`) — or l'habilitation compare `code@version`, donc un client abonné au
  pack n'obtiendrait **jamais** l'accès. PR supplémentaire dans `platform-catalog-service`.
- **D-497-C — la devise sera publiée dans les événements `dossier.*`** (ajout optionnel au contrat,
  producteur + consommateurs, **2 PR intégrées ensemble**), au lieu de déclarer AC-6 non livré. Le
  test « aucune constante `XOF` » porte sur le **code du service**, pas sur le registre ISO des
  devises qu'il recopie (`devise.ts` porte des clés littérales `XOF` par nature).

**Corrections de la fiche, mesurées :**

- Le moule à copier pour le gate est **`balance-service`** (`balance-access.guard.ts:44-46`,
  e-mail → KYC → entitlement), **pas** `dossier-service` : `@RequiresDossierAccess` n'a
  volontairement **pas** d'entitlement.
- ⚠️ **AC-4, piège mesuré** : `estClos` de `balance-service` retombe sur `exercices_atelier` quand le
  read-model est vide (`exercices.repository.ts:106-140`). Le nouveau service **n'a pas d'Atelier** :
  sa garde doit **refuser** un exercice introuvable, jamais recopier ce repli — sinon elle reste
  ouverte en permanence, exactement le défaut de STORY-374.
- `sfd-bceao@2.0` vérifié : 372 comptes / 31 postes / 31 mappings, checksum conforme au registre,
  asset **identique à l'octet** entre `bilan-service` et `balance-service`. Le nouveau service en
  ferait une **3ᵉ copie** à garder identique à l'octet (précédent STORY-428). La clé de l'artefact
  est `meta`, **pas** `_meta` (contrairement au paquet fiscal).
- AC-5 confirmé : dans l'artefact SFD, `57` = **Capital social** ; dans `syscohada-revise@2.1`,
  `57` = **Caisse**.
- ⚠️ **13 points sous-estimés** : scaffold + CI/compose, gate + 2 consommateurs, read-models
  dossier/axes/exercices + garde 404, référentiel du dossier + 3ᵉ copie de l'artefact, devise et sa
  PR `dossier-service`. **Scission conseillée** : socle + gate + portée d'un côté, référentiel du
  dossier + devise de l'autre.

## Notes

- Voir la spine `architecture/architecture-microfinance-service-2026-08-27/ARCHITECTURE-SPINE.md`.

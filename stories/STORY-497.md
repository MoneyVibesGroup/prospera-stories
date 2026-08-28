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

## Notes

- Voir la spine `architecture/architecture-microfinance-service-2026-08-27/ARCHITECTURE-SPINE.md`.

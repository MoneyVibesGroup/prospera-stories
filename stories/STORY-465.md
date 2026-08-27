# STORY-465 : Aucun rebasage : quand la liasse est re-validée, les jeux d'hypothèses continuent de projeter sur l'ancien snapshot, en silence

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en confrontant `JeuHypothesesService.creer` (capture `snapshots.dernier`) au cycle de réouverture de la liasse (FE-034).

---

## Le fait

`base` est capturé **à la création** — `{ jeuEtatsId, snapshotId, version, exercice }` — et
`editer()` ne le touche pas (c'est voulu : « la base reste figée »). Mais **aucune route ne permet de
rebaser**, et le contrôleur n'expose que POST / GET / PUT.

Or la liasse **peut** être rouverte puis re-validée : STORY-065 produit alors un snapshot **version 2**.
Tous les jeux d'hypothèses créés avant continuent de projeter sur la **version 1** — c'est-à-dire sur
des chiffres que le cabinet a lui-même corrigés — et **rien, nulle part, ne le signale**. Sur le dossier
de démonstration, l'écart entre les deux versions est de **80 000** sur le résultat et **80 000** sur le
total actif.

⚠️ **Et « dupliquer » aggrave le problème plutôt que de le résoudre** : faute de route dédiée
(**STORY-466**), dupliquer ne peut être qu'un `POST` de plus — qui **recapture le dernier snapshot**. La
copie n'a donc pas la même base que l'original, silencieusement. C'est exactement le cas
d'hétérogénéité que le cadrage du 2026-07-23 (décision **D2**) prévoit d'autoriser avec un
`baseHomogene: false` — et il note déjà que *« si 071 durcit ce cas, elle **doit** livrer conjointement
un endpoint de rebasage, sinon elle livre un blocage sans issue »*.

## Critères d'acceptation

- [ ] AC-1 — `POST /dossiers/:dossierId/bilan/hypotheses/:id/rebaser` recapture le **dernier** snapshot
      **du même `jeuEtatsId`** — jamais d'un autre exercice.
- [ ] AC-2 — Le rebasage **crée une version** (`version + 1`) comme une édition : le triplet de
      reproductibilité doit rester exact pour les projections antérieures.
- [ ] AC-3 — `GET` (liste et détail) publie `baseAJour: boolean` — vrai si `base.version` est la
      dernière version de snapshot du jeu d'états. C'est ce qui permet à l'écran de prévenir **avant**
      qu'on lise une projection périmée.
- [ ] AC-4 — Rebaser sur une base **identique** est un no-op explicite (200, aucune version créée).
- [ ] AC-5 — Rôle : réservé au `TENANT_ADMIN` (voir **STORY-470**).

## Conséquences ailleurs

- Débloque le durcissement éventuel de **STORY-071** (comparaison de scénarios) : sans rebasage, refuser
  une comparaison hétérogène serait un cul-de-sac.

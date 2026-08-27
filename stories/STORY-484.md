# STORY-484 : Une projection n'est ni figée, ni horodatée, ni tracée — alors qu'elle est remise à un tiers

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé par la checklist posée en FE-034 puis étendue en FE-035 : pour tout objet qu'un cabinet REMET À UN TIERS, demander « qui a le droit » ET « qui le saura ».

---

## Le fait

`ProjectionController` et `ComparaisonController` sont en **lecture pure** : rien n'est écrit, rien
n'est journalisé. C'est un bon choix d'architecture — une projection est une **dérivation**, il n'y a
rien à stocker donc rien à invalider — et il rend la projection **rejouable** grâce au triplet
`(snapshotId, versionHypothesesId, modeleVersion)` et au paramètre `?versionHypotheses=`.

**Rejouable n'est pas retrouvable.** Le produit ne sait pas dire :

- **qui** a sorti le prévisionnel remis à la banque (`AuditType` ne compte aucun acte de projection,
  et les contrôleurs n'injectent pas `AuditService`) ;
- **quand** il a été produit (la réponse ne porte aucune date) ;
- **lequel** a été remis, s'il y en a eu plusieurs.

Le contraste est frappant avec la **liasse** dont ce prévisionnel découle : elle porte un journal
complet, des versions figées et une piste d'audit (FE-034). Le document qui en dérive — celui qui sort
du cabinet — n'en porte aucun.

⚠️ Même famille que **STORY-471** (aucune piste d'audit sur les hypothèses), objet différent : ici
c'est l'acte de **restitution** qui n'est pas tracé.

## Critères d'acceptation

- [ ] AC-1 — La réponse porte `produitLe` (horodatage serveur) et `produitPar` (identifiant de
      l'appelant). Une date posée par le client serait une date qu'il choisit.
- [ ] AC-2 — Un `AuditType.PROJECTION_CONSULTEE` est journalisé par appel, avec le triplet de
      reproductibilité — c'est ce triplet, et non la réponse, qui permet de rejouer.
- [ ] AC-3 — Le rôle : `@Roles(TENANT_ADMIN, TENANT_USER)` sur les deux contrôleurs. **Arbitrage PO
      requis**, même arbitrage que **STORY-470** : un prévisionnel remis à un tiers engage le cabinet.
      À trancher **avant** la première ligne de code, le rôle changeant la forme de l'écran.
- [ ] AC-4 — Aucune écriture métier n'est introduite : la projection reste une dérivation. Le journal
      est un effet de bord d'observabilité, pas un agrégat.

## Conséquences ailleurs

- Si le PO veut un prévisionnel **opposable** (figé, versionné, exportable tel quel), c'est une autre
  story — et elle appartient à **FE-038** (export). Celle-ci se limite à savoir **qui a produit quoi,
  et quand**.

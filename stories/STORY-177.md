# STORY-177 : Un entitlement porte sa **date d'octroi** — `updatedAt` n'est pas une date d'octroi

**Epic :** EPIC-007 — `platform-catalog-service`
**Réf. :** ticket §E · **AP-05** · **STORY-033** (entitlements)
**Découverte par :** AP-INT-0, en branchant les entitlements
**Priorité :** Should Have
**Story Points :** 2
**Statut :** À faire
**Créée le :** 2026-08-04
**Sprint :** 21
**Service :** `platform-catalog-service` (`:3003`)

---

## Le constat

`EntitlementResponseDto` porte `updatedAt` — la date de **dernière modification** — et **aucune date
d'octroi**. L'écran, lui, affiche « Octroyé le … par … ».

**Le scénario, en clair :** un droit est octroyé le 12 janvier. Le 3 mars, on change sa version.
L'écran affiche alors **« Octroyé le 3 mars »**. C'est faux, et ce n'est **pas réparable côté
front** : l'information n'existe nulle part.

> ⚡ Ce n'est pas un détail d'affichage. `grantedBy` est déjà là — le service sait **qui** a octroyé,
> mais plus **quand**. Une attribution dont on connaît l'auteur et pas la date est à moitié
> auditable, et c'est la moitié qui compte le jour où un client conteste une facturation.

## Pourquoi `updatedAt` ne peut pas en tenir lieu

Le `PUT` est **idempotent** et sert deux gestes différents : créer un droit, et en changer la
version ou le référentiel. Il écrase donc `updatedAt` dans les deux cas. Aucune heuristique de
lecture ne peut distinguer un droit octroyé hier d'un droit ancien modifié hier.

---

## Périmètre

- `grantedAt` sur le schéma, **posé à la création et jamais réécrit**.
- Exposé dans `EntitlementResponseDto`, à côté de `grantedBy`.
- ⚡ **Exception assumée** : ré-octroyer un droit `REVOKED` **remet** `grantedAt` à la date du jour.
  C'est un **nouvel** octroi — conserver l'ancienne date laisserait croire que le droit n'a jamais
  été interrompu.
- **Migration** des entitlements existants : `grantedAt = updatedAt`, avec la limite écrite noir sur
  blanc — c'est la meilleure approximation disponible, elle est **fausse** pour tout droit déjà
  modifié, et rien ne permet de faire mieux rétroactivement.

---

## Critères d'acceptation

1. Un octroi pose `grantedAt` ; le DTO le renvoie.
2. ⚡ Une **mise à jour** (même `PUT`, 200) laisse `grantedAt` **inchangé** et ne touche
   qu'`updatedAt`.
3. Ré-octroyer un droit `REVOKED` **remet** `grantedAt` à la date du jour.
4. Migration idempotente, rejouable deux fois sans effet de bord.
5. Non-régression : `updatedAt`, `grantedBy` et `source` conservent leur sémantique.

---

## Definition of Done

- [ ] Les 5 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : octroi → mise à jour → révocation → ré-octroi, en observant les deux
      dates à chaque étape
- [ ] ⚡ La console lit `grantedAt` et **retire** la note « `grantedAt` n'existe pas amont » de
      `entitlements-client.ts` — c'est le signal que la dette est soldée
- [ ] Branche `MNV-177`, PR rebase-mergée sur `dev`

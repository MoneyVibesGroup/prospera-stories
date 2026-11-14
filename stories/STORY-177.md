# STORY-177 : Un entitlement porte sa **date d'octroi** — `updatedAt` n'est pas une date d'octroi

**Epic :** EPIC-007 — `platform-catalog-service`
**Réf. :** ticket §E · **AP-05** · **STORY-033** (entitlements)
**Découverte par :** AP-INT-0, en branchant les entitlements
**Priorité :** Should Have
**Story Points :** 2
**Statut :** Terminée (2026-11-14)
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

- [x] Les 5 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [x] **Vérification docker** : octroi → mise à jour → révocation → ré-octroi, en observant les deux
      dates à chaque étape
- [x] ⚡ La console lit `grantedAt` et **retire** la note « `grantedAt` n'existe pas amont » de
      `entitlements-client.ts` — c'est le signal que la dette est soldée
- [x] Branche `MNV-177`, PR rebase-mergée sur `dev`

---

## Suivi — 2026-11-14 (livrée, fusionnée sur `dev`)

**PR :** MoneyVibesGroup/prospera-platform-catalog-service#42 · MoneyVibesGroup/frontend-admin-panel#26 (console).

### Ce qui a été fait

- `grantedAt` posé à la création par un hook `pre('validate')` sur tout document **neuf** (octroi
  par abonnement, par vertical, tout futur `Model.create`) ; le `PUT` le pose à la création **et**
  au ré-octroi d'un droit `REVOKED`. Une mise à jour ou une révocation ne le touchent jamais.
- Exposé dans `EntitlementResponseDto` (pas dans la vue « par module », qui exclut l'audit).
- La console lit `grantedAt` ; la note « `grantedAt` n'existe pas amont » est retirée.

### ⚡ Écart à la fiche : la migration prend `createdAt`, pas `updatedAt`

Le schéma porte `timestamps: true` : `createdAt` **est** la date du premier octroi, exacte pour
tout droit jamais révoqué puis ré-octroyé. `updatedAt` est faux dès la première mise à jour, le
défaut même que la story corrige. `updatedAt` ne sert qu'à défaut ; sans aucune date, le droit
reste sans `grantedAt` (jamais une date inventée). Commande : `npm run migrate:granted-at`, à
lancer une fois après le déploiement.

### Deux défauts trouvés par la vraie base, invisibles aux unitaires

1. Sans `timestamps: false`, Mongoose ajoute `updatedAt = maintenant` à l'`updateMany`, pipeline
   compris : chaque `updatedAt` migré était réécrit (AC-5), et un droit sans date recevait
   l'instant de la migration comme date d'octroi.
2. Le script ne rendait jamais la main : `AppModule` monte les consommateurs Kafka, qui se
   reconnectent après `app.close()`. Sortie explicite. ⚠️ `migrate:terme-entitlements` (STORY-609)
   suit le même patron et a sans doute le même blocage — non touché.

### Preuves

Unitaires 1 042/1 042, e2e des droits 54/54 ; console 631/631. Docker sur volumes neufs avec un
vrai jeton : octroi 201 → mise à jour, révocation, mise à jour après ré-octroi = `grantedAt`
**inchangé** ; ré-octroi = `grantedAt` **remis à la date du jour**. `Model.create` réel pose la
date. Migration : un droit (12/01 créé, 03/03 modifié) reçoit 12/01 et garde son `updatedAt` ; un
droit sans date reste sans ; code de sortie 0 ; rejouée, « 0 posée ».

### Restes

- ⚠️ Les types générés de la console sont en retard sur l'OpenAPI du catalogue : elle lit encore
  `referentiel` (singulier) alors que le service renvoie `referentiels` depuis STORY-533. Seul
  `grantedAt` a été ajouté à la main ; la régénération complète est une story à part.

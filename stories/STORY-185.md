# STORY-185 : Les **packs verticaux** n'existent nulle part — la console propose une offre que rien ne stocke

**Epic :** EPIC-014 — Catalogue plateforme (`platform-catalog-service`)
**Réf. :** **AP-06** *(assistant de provisioning — consommateur nº 1)* · **AP-04** *(onglet « Plateformes » de la maquette)* · **STORY-171** *(`Organization.vertical` — le champ auquel un pack se rattache)* · **STORY-032** *(catalogue admin CRUD, le patron à recopier)*
**Découverte par :** revue de cohérence maquette ⇄ code du 2026-08-06, après livraison d'AP-06/AP-07
**Priorité :** Should Have — ⚡ **non bloquante pour AP-06**, qui vit avec une config en dur ; bloquante pour l'écran « Plateformes » de la maquette
**Story Points :** 5
**Statut :** À faire
**Créée le :** 2026-08-06
**Sprint :** 20
**Service :** `platform-catalog-service` (`:3003`)

---

## Le constat

**Un « pack vertical » est aujourd'hui un fichier TypeScript dans le frontend.**

```ts
// frontend-admin-panel/src/features/provisioning/config/vertical-packs.ts
export const VERTICAL_PACKS: Record<Exclude<Vertical, "">, VerticalPack> = {
  Distribution: { referentiel: { code: "syscohada-revise", version: "2.1" },
                  modules: ["bilan", "pdv", "stock", "catalogue", "commande", "facturation"] },
  Finance:      { referentiel: { code: "sfd-bceao", version: "1.3" }, modules: [...] },
  Assurance:    { ... },
  "Expertise comptable": { ... },
};
```

Côté service, **la notion n'est pas modélisée** :

| Vérification | Résultat |
|---|---|
| `ls platform-catalog-service/src/modules` | `auth` · `catalog` · `entitlements` · `projects` — **pas de `packs`** |
| Entité « pack » / « vertical » dans le schéma | ⛔ aucune |
| Route servant la composition d'un vertical | ⛔ aucune |
| Story couvrant le sujet | ⛔ aucune *(recherche menée sur `stories/` et `frontend-stories/` avant d'écrire celle-ci)* |

⚠️ **AP-06 n'a pas triché** : sa story ne demande qu'une *« config déclarative des packs vertical
(modules + référentiel par défaut), extensible »*. Un fichier de config **satisfait** ce critère.
Ce qui ne tient pas, c'est l'**onglet « Plateformes »** ajouté à la maquette de la console : il
permet de **créer et d'éditer** un pack, et il n'a aucun serveur derrière lui.

## Pourquoi ça compte

Un pack en dur est acceptable tant qu'une seule personne le modifie, à la compilation. Il cesse de
l'être dès que **l'offre devient commerciale** :

1. **Ouvrir une cinquième verticale ne doit pas être un déploiement frontend.** C'est exactement
   l'exigence que `STORY-171` §D pose déjà pour le vertical lui-même — le pack doit suivre la même
   règle, sinon on aura résolu la moitié du problème.
2. **Deux consommateurs, deux copies.** L'app distributeur (`DI-*`) et la page publique de paiement
   auront besoin de savoir ce que « le vertical distributeur » ouvre. Avec un pack en dur dans la
   console, chacun en refera une copie — et elles divergeront, en silence.
3. **Un pack est une décision produit datée.** Savoir *ce qu'on vendait en mars* n'est pas
   reconstituable depuis un fichier de config écrasé par le commit suivant.

⚠️ **Ce n'est PAS un projet** (`EPIC-026`). Un `Project` est le périmètre de modules **d'une
organisation donnée** ; un pack est le **gabarit** d'un secteur, avant toute organisation. Les
confondre ferait du pack une instance et perdrait ce qui en fait la valeur : sa réutilisation.

---

## Périmètre

**Inclus :**

- Entité `VerticalPack` : `{ key, label, referentiel: { code, version }, modules: string[], status, order }`.
- `GET /catalog/packs` — lecture, **ouverte à `catalog:read`** *(la console la lit à chaque ouverture de l'assistant)*.
- `POST|PATCH /catalog/admin/packs/:key` + `DELETE` — écriture, **`catalog:manage`**.
- **Validation référentielle à l'écriture** : chaque `moduleCode` doit exister au catalogue, le couple
  `(referentiel.code, referentiel.version)` aussi. Un pack qui référence un module inexistant est un
  pack qui produira des lignes « non octroyable » chez tous les clients.
- Seed des **quatre packs actuels**, repris à l'octet près de `vertical-packs.ts` — le fichier front
  est la source de vérité de la migration, pas une inspiration.

**Hors périmètre :**

- Le **rattachement** d'un pack à une organisation (c'est l'entitlement, AP-05, déjà livré).
- La **tarification** d'un pack (Module 2).
- L'historisation/versionnement d'un pack — à ouvrir si le besoin « ce qu'on vendait en mars »
  devient réel ; le noter ici ne l'engage pas.

---

## ⚠️ Décision à prendre : `key` ou `Organization.vertical` ?

`STORY-171` livre `Organization.vertical` sur une **liste fermée** (`cabinet`, `distributeur`,
`imf-sfd`, `assurance-cima`). Deux options :

| Option | Conséquence |
|---|---|
| **A — la `key` du pack EST la valeur du vertical** | un vertical = un pack, point. Simple, et interdit deux offres pour un même secteur. |
| **B — un pack porte un `vertical` en attribut** | plusieurs packs par secteur (« distributeur essentiel » / « distributeur complet »). Ouvre la porte au commercial, complique tout de suite. |

**Recommandation : A**, et B le jour où quelqu'un demande deux offres. Passer de A à B, c'est ajouter
une colonne ; l'inverse, c'est une migration de données. ⚡ **Cette décision est un préalable à
l'implémentation** — elle conditionne le schéma, et elle appartient au PO.

---

## Critères d'acceptation

- [ ] `GET /catalog/packs` rend les packs actifs, triés par `order` ; `catalog:read` exigé.
- [ ] `POST|PATCH|DELETE /catalog/admin/packs/:key` sous `catalog:manage` ; **403** pour tout autre rôle.
- [ ] **Un pack référençant un module ou un référentiel inconnu est refusé en 422**, avec le champ fautif.
- [ ] Les quatre packs actuels sont seedés et **identiques** à `vertical-packs.ts` — vérifié par un test
      qui compare les deux listes, pas par relecture.
- [ ] Un pack **vide** (aucun module) est valide : une plateforme peut exister avant d'être composée.
      *(La console le dit déjà — « Ce pack ne contient encore aucun module ».)*
- [ ] OpenAPI à jour ; `npm run gen:api` côté console rend les types sans écart.
- [ ] Tests : lecture, écriture, refus 422, refus 403, seed conforme.

---

## Tâches

- [ ] Trancher A vs B *(PO)* — préalable bloquant.
- [ ] Schéma `VerticalPack` + module `packs` (AC 1, 2)
- [ ] Validation référentielle contre modules & référentiels (AC 3)
- [ ] Seed des quatre packs + test de conformité au fichier front (AC 4, 5)
- [ ] OpenAPI + tests (AC 6, 7)

---

## Ce que la console fera ensuite *(hors de cette story)*

`vertical-packs.ts` devient un **repli** : la config en dur reste, la console lit d'abord le service
et retombe dessus s'il ne répond pas. Puis, une fois la lecture éprouvée, le fichier disparaît et
l'onglet « Plateformes » d'AP-04 devient utilisable. ⚡ **Aucune story frontend n'est ouverte ici** :
elle n'aurait rien à faire tant que cette route n'existe pas.

---

## ⚠️ Note de capacité — à arbitrer par le PO

Le sprint 20 est **déjà à 64 points pour 34 de capacité** *(surcharge héritée de l'ajout des
STORY-179 → 184)*. Ces 5 points le portent à **69**. Le slot en S20 est celui qui a été demandé ; il
n'est pas tenable sans décaler autre chose. Ordre de décalage défendable, si la capacité doit être
tenue : **garder 179 + 180** *(sans elles, la revue KYC reste inexploitable)*, décaler **181 → 185**
au S21.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

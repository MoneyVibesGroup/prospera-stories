# STORY-447 : Un collaborateur peut figer la liasse entière, alors qu'il ne peut pas valider la surcharge d'un seul compte

Status: ready-for-dev

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 2 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

Sur le **même dossier**, dans le **même service** :

| Route | Rôles admis |
|---|---|
| `POST …/mapping-overrides/:id/valider` — arbitrer **un compte** | `@Roles(TENANT_ADMIN)` |
| `POST …/mapping-overrides/:id/rejeter` | `@Roles(TENANT_ADMIN)` |
| `POST …/bilan/etats/:id/valider` — **figer la liasse** | `@Roles(TENANT_ADMIN, TENANT_USER)` |
| `POST …/bilan/etats/:id/rouvrir` — **rouvrir des comptes arrêtés** | `@Roles(TENANT_ADMIN, TENANT_USER)` |

Le produit est donc **plus exigeant pour le rattachement d'un compte que pour l'arrêté des
comptes**. C'est une incohérence interne, pas un arbitrage : FE-030 a explicitement posé la règle
« proposer est ouvert à tous, **valider** ne l'est pas », et la validation de la liasse y échappe.

## Critères d'acceptation

- [ ] AC-1 — `POST …/etats/:id/valider` et `POST …/etats/:id/rouvrir` passent à
      `@Roles(TENANT_ADMIN)`.
- [ ] AC-2 — `creer`, `recalculer`, `consulter`, `versions` restent ouverts aux deux rôles : c'est
      le **travail**, pas l'**engagement**.
- [ ] AC-3 — Le refus est un `403` **nommé** (`VALIDATION_RESERVEE_ADMIN`), pas le 403 générique du
      gate d'entitlement — l'écran doit pouvoir dire « demandez à un administrateur », pas
      « accès refusé ».
- [ ] AC-4 — ⚠️ **À trancher par le PO** : faut-il un rôle **signataire** distinct de
      `TENANT_ADMIN` ? En cabinet, l'administrateur de l'outil et le professionnel qui engage sa
      responsabilité ne sont pas toujours la même personne. La story livre la restriction simple ;
      le rôle dédié est une décision, pas une évidence.

## Conséquences ailleurs

- La maquette FE-034 affiche le bouton pour les deux rôles — **parce que c'est l'état servi** — et
  nomme l'écart à côté du bouton.
- Le scénario de démonstration rend l'incohérence lisible : la **version 1 y est figée par un
  collaborateur**, sur un dossier dont les surcharges de mapping ont dû être validées par
  l'administratrice.

# STORY-447 : Un collaborateur peut figer la liasse entière, alors qu'il ne peut pas valider la surcharge d'un seul compte

Status: done

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

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker
rejouée sur l'état final**, PR `bilan-service` **#79** (3 commits) rebase-mergée sur `dev`
le 2026-09-03.

Branches créées **avant** la première ligne de code :

```
docs             MNV-447
bilan-service    MNV-447
```

**Un seul dépôt impacté** : la restriction, son décorateur et son code de refus vivent dans
`bilan-service`. Aucun contrat d'événement ne change.

### Ce qui est livré

- **AC-1** — `valider` et `rouvrir` passent à `@Roles(TENANT_ADMIN)`.
- **AC-2** — `creer`, `recalculer`, `consulter`, `versions` **et `PUT :id/complements`**
  restent ouverts aux deux rôles. Ce dernier n'est nommé par aucun AC : la saisie des cases
  hors balance n'est possible que sur un `BROUILLON` (`refuserSiValide` refuse tout ce qui
  n'en est pas un), donc c'est du **travail**, pas de l'**engagement**.
- **AC-3** — le refus est un `403` **nommé** (`VALIDATION_RESERVEE_ADMIN`) porté par un
  nouveau décorateur `@CodeRefusRole`, lu par le `RolesGuard`.
- **AC-4** — **non tranché, et c'est écrit.** Hook inerte documenté à l'inventaire des
  codes : `TENANT_ADMIN` est la restriction **simple**, pas la restriction **juste**. Le
  jour où le PO décide d'un rôle **signataire**, c'est le `@Roles` de ces trois routes qui
  change — le code de refus, lui, reste bon.

### ⚠️ `deposer` a été ajouté aux routes restreintes

L'AC-1 ne nomme que `valider` et `rouvrir` : `POST …/deposer` a été **créée par STORY-446**,
mergée entre l'écriture de cette fiche et son implémentation. Laisser l'acte **le plus
engageant du cycle** ouvert au collaborateur pendant qu'on ferme la validation aurait
**recréé l'incohérence** que la story supprime. La revue de code a confirmé : nécessité, pas
débordement — la revue de sécurité de STORY-446 range déjà `deposer`/`rouvrir` dans la même
classe de rôle que `valider`.

### ⚡⚡ Revue de code — la promesse « strictement additif » était fausse sur ses trois routes

**⛔ Le refus nommé passait un objet à `ForbiddenException` sans poser `error`.** Nest ne le
construit que pour une exception créée à partir d'une **chaîne** ; avec un objet il
disparaît, et `AllExceptionsFilter` retombe sur `HttpStatus[403]` — le corps passait de
« Forbidden » à « FORBIDDEN ». Une **modification silencieuse d'un champ existant**, là où
la story ne devait qu'**ajouter** `code`. La décision **D-138-1** avait tranché ce point
cinq fichiers plus loin (`email-verified.guard.ts`), et sa prose le disait mot pour mot.
⚠️ Les assertions sont passées de `toMatchObject` — **aveugle à un champ disparu** — à
`toEqual` sur l'enveloppe entière.

**⛔ JSDoc détaché par insertion, 8ᵉ récidive** : la constante avait été posée entre le
docstring de l'inventaire et l'inventaire. Le bloc déplacé porte une **instruction**
(« retirer une entrée d'ici doit casser la compilation d'un client ») qui pointait sur une
chaîne scalaire.

**⛔ Restreindre `deposer` contredisait QUATRE proses de STORY-446**, dont une **publiée en
Swagger** : « un collaborateur peut consigner un accusé signé par l'expert ». Reformulées
sur le fait qui reste vrai — *celui qui consigne n'est pas celui qui signe*.

⚠️ Deux constats non bloquants traités : le balayage d'exhaustivité ne lisait que les
littéraux `code: '…'`, donc un `@CodeRefusRole('X')` écrit en dur aurait rendu un 403 dont
le code est **absent de l'énumération publiée** — regex ajoutée, mutation vérifiée ; et la
description Swagger du 403, **triplée à l'octet près**, est extraite en constante partagée
(patron de `MENTION_PORTEE_DU_SCEAU`, juste à côté).

⚠️ **La prose disait que la route rend « aussi » les codes du gate — c'est faux pour un
non-administrateur** : le `RolesGuard` court **avant** le `BilanAccessGuard`. La précédence
est désormais dite au contrat et **figée par un e2e**.

### ⚡ Revue de sécurité — aucun constat

Blanchi explicitement : la modification du `RolesGuard` **global** est confinée aux trois
handlers décorés (inventaire exhaustif — aucun décorateur de classe, aucun autre lecteur de
la clé, les ~45 autres `@Roles` du service retombent sur la branche inchangée) · `error` est
posé conformément à D-138-1 · le rôle reste dérivé du JWT RS256/JWKS, inchangé · aucun des
chemins laissés ouverts ne donne l'effet d'un acte réservé (`complements` et `recalculer`
sont enfermés dans le `BROUILLON` par le **filtre atomique**, pas par une relecture) ·
`SetMetadata` est évalué à la définition de la classe, donc le `code` n'est pas injectable ·
throttler toujours en tête.

⚠️ **Le renversement 404 → 403 a été instruit puis écarté.** Un `TENANT_USER` d'un **autre**
cabinet reçoit désormais `403 VALIDATION_RESERVEE_ADMIN` là où il recevait `404
DOSSIER_INTROUVABLE`. Ce n'est pas une violation de l'anti-énumération : le refus de rôle est
**constant en fonction de la ressource** — il ne lit ni `dossierId`, ni `:id`, ni la base.
Le même appelant reçoit le même 403 pour son propre dossier, pour celui d'un autre tenant,
pour un identifiant inexistant et pour un identifiant malformé. Le gain informationnel est
**nul, et strictement moindre qu'avant**.

### ⛔ Ce qui n'a PAS été fait, et pourquoi

`mapping-overrides/:id/valider` et `/rejeter` — les routes que la fiche cite en **référence**
— gardent leur 403 **anonyme**. Le front devra donc, pour un seul geste produit (« demandez à
un administrateur »), lire un `code` sur la liasse et un `message` sur la surcharge. Aucun AC
ne le demande, et leur poser `@CodeRefusRole` changerait le contrat d'un autre module :
**hook inerte, story suivante naturelle** — le décorateur rend le geste trivial.

⚠️ Le contrôle mécanique « JSDoc suivi d'un JSDoc » balaie désormais tout `src/` : **4
suspects subsistent, tous antérieurs à cette story**, dont le docstring de classe de
`JeuEtatsService`, détaché depuis MNV-359. Consignés, non corrigés ici.

### Vérification

Lint 0 warning · build OK · **1 705 unitaires + 474 e2e verts** · couverture **98,8 / 93,91 /
98,76 / 98,82** · **5 mutations rouges par assertion**, aucune par erreur de compilation :

| mutation | ce qui vire au rouge |
|---|---|
| les trois actes redeviennent ouverts aux deux rôles | 3 e2e |
| le décorateur `@CodeRefusRole` retiré | 1 exhaustivité + 3 e2e |
| le guard nomme **tous** les refus, décorateur ou non | le spec « sans décorateur, le 403 est celui d'avant » |
| le guard oublie de poser `error` | 1 unitaire + 3 e2e |
| la regex de décorateur retirée du balayage | le code non inventorié cesse d'être vu |

⚠️ **Le flake connu de `bilan-service` s'est manifesté deux fois** (`bilan-consultation`
« 401 sans jeton », puis `bilan-jeu-etats` « 404 IDENTIQUES » recevant 401) : toujours sur un
refus d'auth, vert en isolation et à la réexécution complète.

**Vérification docker avec DEUX jetons réels de l'IdP** — une administratrice et un
collaborateur du **même** cabinet (membership `TENANT_USER` semé, rôle lu dans le JWT) :

| critère | mesure |
|---|---|
| AC-1 / AC-3 | `valider`, `rouvrir` et `deposer` rendent **403 `VALIDATION_RESERVEE_ADMIN`** au collaborateur |
| revue ① | l'enveloppe complète est `{statusCode: 403, error: "Forbidden", code, message}` — **`error` présent et inchangé** |
| AC-2 | le collaborateur garde consulter, lister, versions, **recalculer** et **compléments** en 200 |
| revue ⑥ | sans entitlement : l'administratrice reçoit `BILAN_NOT_ENTITLED`, le collaborateur `VALIDATION_RESERVEE_ADMIN` — la précédence documentée est bien celle du code |
| nominal | le collaborateur prépare, l'administratrice arrête les comptes |

⚠️⚠️ **Non-vacance prouvée** : rôles rouverts, le collaborateur **rouvre des comptes
arrêtés** en 200 — le défaut que la story ferme, constaté.

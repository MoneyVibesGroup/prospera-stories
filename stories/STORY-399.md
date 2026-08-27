# STORY-399 : Le contenu du référentiel n'est lisible par aucune route — et le serveur valide contre lui

Status: in_progress

**Épic :** EPIC-010 — Référentiels & table de passage (FR-005..FR-008)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/referentiel`
**Points :** 5 · **Sprint :** S20 · **Complexité :** medium
**Origine :** remontée le **2026-08-24** par **FE-030**, en dessinant le dialogue
d'affectation d'un compte non reconnu.

---

## Le fait, relevé à la source

`GET /dossiers/{id}/bilan/referentiel` publie **des compteurs**, jamais du contenu :

```ts
planCount:    resolved.package.planDeComptes.length,   // 918
postesCount:  resolved.package.postes.length,          // 214
mappingCount: resolved.package.tableDePassage.length,  // 371
```

Et `MappingOverrideService.proposer` **valide contre cette liste invisible** :

```ts
const posteExiste = pkg.postes.some(
  (p) => p.etat === input.cible.etat && p.code === input.cible.poste,
);
if (!posteExiste) throw new UnprocessableEntityException({ code: 'POSTE_INCONNU' });
```

⛔ **Aucun contrôleur du service n'expose `pkg.postes` ni `pkg.planDeComptes.`** Vérifié :
`postes` n'apparaît dans aucun `*.controller.ts` autrement que sous forme de `.length`.

⚠️ Et le refus n'est même pas au contrat : l'OpenAPI de `POST …/mapping-overrides`
documente **403, 404 et 409** — pas le **422 `POSTE_INCONNU`**, qui est pourtant le refus
le plus probable de la route.

---

## Ce que ça coûte, concrètement

Pour affecter un compte non reconnu, le comptable doit fournir un couple
`(état, code de poste)` que **rien ne lui montre** : il le tape de mémoire, ou depuis une
liasse papier, pour recevoir un `422`. Il n'y a pas de troisième possibilité — ni liste
déroulante, ni autocomplétion, ni message qui nommerait les valeurs admises.

⚠️ **Second manque, moins visible, et il touche la lecture** : le regroupement d'une
balance **par classe comptable** (« Classe 4 — Tiers ») a besoin des **libellés de
classe**, qui vivent dans `planDeComptes[].classe`. Ne pas les servir laisse deux choix,
tous deux mauvais : afficher « Classe 4 » nu, ou **écrire les libellés SYSCOHADA en dur
côté front** — ce qui casserait l'invariant **P7** (moteur ⊥ référentiel) et serait
**faux pour SFD-BCEAO et CIMA**. C'est exactement la dette que
`TICKET-FRONTEND-retrait-dictionnaire-plan-comptes` a fait retirer une fois déjà.

⇒ **Contournement en place (FE-030), volontairement déclaré partiel** : le dialogue
propose les **postes observés dans la balance courante** (extraits de `mappes[]`), affiche
en tête que **la liste est partielle** — « le référentiel compte 214 postes, seuls les N
atteints par un compte de cette balance sont proposés » —, laisse une **saisie libre**, et
rend le `422` **verbatim** dans le dialogue, à côté du champ fautif. Le regroupement par
classe affiche « Classe 4 » **sans libellé**.

⚡ Ce contournement a un angle mort structurel : **le poste dont on a besoin pour un
compte inhabituel est précisément celui qu'aucun autre compte n'a atteint.**

---

## Périmètre

**Inclus**

- Une route de lecture qui rend le **contenu du référentiel effectif** de l'organisation.
  La forme la plus simple qui serve : `GET /dossiers/{id}/bilan/referentiel/postes` →
  `[{ etat, code, libelle, note? }]`, et `…/referentiel/plan-de-comptes` →
  `[{ numero, libelle, classe }]`. Une seule route portant les deux volets convient aussi.
- Les deux rendent **exactement** `pkg.postes` / `pkg.planDeComptes` — la **même source**
  que la validation, jamais une liste parallèle.
- Mêmes gates que le reste du module (`@RequiresDossierScope` + `@RequiresBilanAccess`),
  et mêmes refus de référentiel (`REFERENTIEL_UNRESOLVED`, `…_INTEGRITY`, …).
- **Documenter `422 POSTE_INCONNU`** sur `POST …/mapping-overrides` — le code existe, il
  n'est simplement pas publié.

**Hors périmètre**

- Un moteur de recherche ou une pagination : 214 postes et 918 comptes se servent en une
  fois, et le paquet est **déjà en cache** côté serveur.
- Enrichir les paquets `syscohada-revise` / `sfd-bceao` : cette story **expose** ce qu'ils
  contiennent, elle n'y ajoute rien.

---

## Critères d'acceptation

1. Une route de lecture rend les **postes** du référentiel effectif (`etat`, `code`,
   `libelle`), typés au contrat — pas en `Record<string, never>`.
2. Une route de lecture rend le **plan de comptes** normalisé (`numero`, `libelle`,
   `classe`).
3. Un test vérifie que la liste des postes rendue est **exactement** celle contre laquelle
   `MappingOverrideService.proposer` valide, en lisant la **même** source.
4. Un référentiel non résolu / non intègre produit les **mêmes** refus que les autres
   routes du module, jamais un 200 avec une liste vide.
5. `422 POSTE_INCONNU` est documenté sur `POST …/mapping-overrides`.

---

## Notes

- ⚠️⚠️ **TROISIÈME OCCURRENCE DE LA MÊME FORME**, après **STORY-394** (« aucune route
  n'énumère les comptes de classe 7 », FE-043) et **STORY-397** (« les codes de
  réintégration sont validés sans être publiés », FE-044). Trois occurrences dans trois
  services différents en une semaine : ce n'est plus un oubli isolé, c'est un **angle mort
  de conception**. ⇒ **Toute validation fail-closed contre un référentiel a besoin de sa
  route de lecture**, sinon elle rend l'écran inutilisable là où elle voulait le protéger.
  Cette phrase mérite d'être une **règle d'architecture**, pas la note d'une troisième
  story.
- ⚠️ **Recouvrement avec STORY-400** (affectation par racine) : les deux touchent le même
  dialogue et la même route d'écriture. Les livrer ensemble évite deux passes de front.
- Consommateur nommé : **FE-030** (dialogue d'affectation + regroupement par classe).

---

## Progress Tracking

**Statut : `in_progress`** — dev démarré le **2026-08-27**, branche `MNV-399` ouverte sur
`docs` et sur `bilan-service`.

⚠️ **Un seul dépôt de code** : la story n'expose que de la lecture HTTP, aucun contrat
d'événement Kafka n'est touché.

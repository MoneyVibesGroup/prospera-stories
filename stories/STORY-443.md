# STORY-443 : `GET /bilan/audit` n'a ni pagination, ni fenêtre de dates, ni filtre par cible — un journal append-only jamais purgé rend tout

Status: in_progress

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 3 · **Complexité :** medium · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

La route ne prend qu'un paramètre : `?type=` (un `AuditType`). Elle rend **tous** les événements
du dossier, du plus récent au plus ancien, sans limite.

Trois manques, du plus grave au plus gênant :

1. **Aucun filtre par cible.** Le journal est celui du **dossier** : il mélange les jeux d'états
   et les exercices. La question naturelle — « le journal de **cette** liasse » — n'est pas
   servie, alors que `cible.id` est stocké sur chaque ligne.
2. **Aucune pagination.** La collection est **append-only** et n'est jamais purgée : la réponse
   grossit indéfiniment, et l'écran la charge en entier à chaque ouverture.
3. **Aucune fenêtre de dates.** « Ce qui s'est passé pendant la campagne 2025 » n'est pas
   exprimable.

## Critères d'acceptation

- [ ] AC-1 — `?cibleId=` (et `?cibleCollection=`) filtrent sur `cible`. L'index existant
      `{tenantId, dossierId, createdAt:-1}` est complété si le plan d'exécution le demande.
- [ ] AC-2 — Pagination **par curseur** sur `createdAt` (`?avant=`, `?limite=`, défaut 50,
      plafond 200) — pas d'`offset` : un journal append-only en tête de liste déplace les pages.
- [ ] AC-3 — `?depuis=` / `?jusqua=` (dates ISO, bornes incluses).
- [ ] AC-4 — La réponse porte `{ evenements: [...], curseurSuivant: string | null }`.
- [ ] AC-5 — Les combinaisons de filtres sont **ET**, jamais **OU**.

## Conséquences ailleurs

- La maquette FE-034 n'offre que le filtre par **type** — le seul servi — et l'écrit à l'écran.
- À livrer avec **STORY-442** (même DTO, même route).

---

## Progress Tracking

**Statut : `in_progress`** — branches créées **avant** la première ligne de code (preuve
`git rev-parse --abbrev-ref HEAD` sur chaque dépôt impacté) :

```
docs             MNV-443
bilan-service    MNV-443
```

**Un seul dépôt impacté** : la route, son DTO et son index vivent entièrement dans `bilan-service`.
Aucun contrat d'événement ne change, donc pas de second dépôt (la règle « un contrat Kafka = 2
dépôts » ne s'applique pas ici). **Aucun consommateur** de `GET …/bilan/audit` n'existe hors du
service : `admin-panel`, `frontend-admin-panel` et `expert-comptable` ne l'appellent nulle part —
vérifié par balayage. Le changement de forme de la réponse (AC-4) ne casse donc aucun appelant
existant.

# STORY-444 : La réouverture d'une liasse figée n'exige aucun motif et n'en trace aucun

Status: ready-for-dev

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`POST /dossiers/:dossierId/bilan/etats/:id/rouvrir` **ne prend aucun corps**. L'événement
`JEU_ROUVERT` est journalisé avec `cible` seule — `journaliser()` accepte pourtant un `contexte`,
qui reste `null` ici.

Rouvrir des comptes **déjà arrêtés** est l'acte le plus engageant du cycle après la validation
elle-même : il retire à une version figée son caractère de référence courante, et il produira des
états différents de ceux que le client — ou l'administration — a peut-être déjà vus.

**C'est le point faible de l'opposabilité que la story FE-034 vend.** Un journal qui dit
« rouverte le 22/07 par 68a1f3…4c02 » sans dire **pourquoi** ne défend rien devant un contrôle.

Le produit sait pourtant déjà faire : `ProposerSurchargeDto` porte un `motif` pour l'arbitrage
d'**un seul compte** (FE-030).

## Critères d'acceptation

- [ ] AC-1 — `POST …/rouvrir` accepte `{ motif: string }`, **obligatoire**, 10 à 500 caractères.
      Un corps absent ou un motif vide → `400`.
- [ ] AC-2 — Le motif est journalisé dans `contexte` de l'événement `JEU_ROUVERT`
      (`{ motif, versionRouverte }`).
- [ ] AC-3 — Le motif est **conservé sur le jeu** (`derniereReouverture: { motif, par, at }`) pour
      que l'écran puisse le rappeler tant que le brouillon est ouvert — un journal se consulte,
      un bandeau se lit.
- [ ] AC-4 — La réouverture d'un jeu **jamais validé** reste refusée (`409 JEU_NON_VALIDE`,
      inchangé) : pas de motif à demander là où il n'y a pas d'acte.
- [ ] AC-5 — `contexte` étant publié par **STORY-442**, le motif apparaît dans le journal sans
      travail supplémentaire côté lecture.

## Conséquences ailleurs

- Dépend de **STORY-442** pour être **visible** (sinon le motif est stocké et invisible, exactement
  le défaut que 458 corrige).
- La maquette FE-034 **dessine le champ** dans le dialogue de réouverture et déclare qu'il n'est
  transmis à personne aujourd'hui — règle PO : dessiner la cible, et le dire.

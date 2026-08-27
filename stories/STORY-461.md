# STORY-461 : Rouvrir une liasse sur un exercice CLOS est accepté — et sans retour : la liasse reste bloquée en brouillon et le portefeuille l'affiche « bilan en cours »

Status: ready-for-dev

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 2 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`JeuEtatsService.valider()` appelle `refuserSiExerciceClos()` (409 `EXERCICE_CLOS`, STORY-066).
**`rouvrir()` et `recalculer()` ne l'appellent pas.**

Sur un exercice déclaré `CLOS`, la séquence est donc :

1. `POST …/rouvrir` → **200**. Le jeu repasse `BROUILLON`.
2. `liasse.etat.change` publie `etat: 'BROUILLON'` → `dossier-service` recalcule l'avancement du
   dossier en `BILAN_EN_COURS`. **Le portefeuille affiche « bilan en cours » sur un exercice clos.**
3. `POST …/valider` → **409 `EXERCICE_CLOS`**.

La liasse est en **cul-de-sac** : elle n'a plus de version courante déclarée, elle ne peut pas
être re-figée, et rien à l'écran n'indique que le geste manquant est de rouvrir l'**exercice**,
pas la liasse. L'utilisateur a détruit un état stable en une requête que le serveur a acceptée.

## Critères d'acceptation

- [ ] AC-1 — `rouvrir()` appelle `refuserSiExerciceClos()` **avant** toute écriture →
      `409 EXERCICE_CLOS`, aucune transition, aucun événement publié.
- [ ] AC-2 — `recalculer()` fait de même (un brouillon d'exercice clos n'a rien à recalculer :
      il ne pourra pas être validé).
- [ ] AC-3 — Un test couvre la séquence complète (clore → rouvrir → **refus**), pas seulement
      l'appel isolé.
- [ ] AC-4 — Le message nomme le geste : « rouvrir l'exercice 2025 d'abord ».
- [ ] AC-5 — **Cas des jeux déjà en cul-de-sac** : aucune migration. Rouvrir l'exercice suffit à
      les débloquer ; le préciser dans les notes de version.

## Conséquences ailleurs

- Le symptôme est visible **hors** de `bilan-service` : c'est `dossier-service` qui affiche l'état
  faux. Un refus au bon endroit supprime les deux.
- La maquette FE-034 joue cette séquence : bascule « **Rouverte sur exercice clos** ».

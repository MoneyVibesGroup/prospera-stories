# STORY-430 : Le comparatif N-1 n'est ni ordonné, ni daté, ni duré — rien n'empêche de comparer 2025 à 2022, ni 12 mois à 9

Status: ready-for-dev

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `dto/bilan-dry-run-request.dto.ts`, `modules/bilan/etats`
**Points :** 3 · **Sprint :** à slotter
**Origine :** maquette **FE-032**, 2026-08-27. Confirmé sur la DSF déposée
`1000745307_2025_Definitif (1).xlsx`, dont l'en-tête porte **« Durée (en mois) : 12 »**.

---

## Le fait

`BilanDryRunRequestDto` reçoit `soldesN` et `soldesN1` — **deux tableaux de soldes nus** :

```ts
soldesN!:   LigneSoldeDto[];   // { compte, soldeDebiteur, soldeCrediteur }
soldesN1?:  LigneSoldeDto[];
```

Aucune identité d'exercice n'accompagne les soldes. Le serveur ne sait donc pas :

- **quel exercice** est N, ni quel exercice est N-1 ;
- **dans quel ordre** ils sont (rien n'interdit de poster 2022 en `soldesN1` d'un 2025, ni
  l'inverse) ;
- **combien de mois** chacun couvre.

⇒ Le comparatif est **entièrement à la charge de l'écran**, et une erreur d'appariement
**ne rougit nulle part** : elle s'affiche comme un fait, et toutes les variations calculées
dessus se lisent comme des anomalies de gestion.

## La durée n'est pas un raffinement

Le formulaire officiel porte la durée **dans son en-tête**, précisément parce qu'un exercice de
**9 mois** (création en cours d'année, changement de date de clôture) ne se compare pas à un
exercice de 12. Sur le CR de FE-032, toutes les variations seraient fausses de **25 %** — sans
qu'une seule ligne ne paraisse anormale.

## Ce qui existe déjà, et qui ne suffit pas

`ExerciceView` (STORY-066) porte `{ debut, fin }`. Mais **Q6 a donné le dernier mot sur les
exercices au dossier**, et le `dry-run` ne reçoit pas de `dossierId` d'exercice : les dates
existent quelque part, elles n'arrivent jamais jusqu'au calcul. C'est le même défaut de
chaînage que STORY-381 (`bilan-service` ne connaît aucun `balanceId`) — **une liasse ne peut
pas dire d'où elle sort.**

---

## Critères d'acceptation

- [ ] AC-1 — `BilanDryRunRequestDto` accepte `exerciceN: { debut, fin }` et
      `exerciceN1?: { debut, fin }` (ISO-8601, dates de **clôture** comprises).
- [ ] AC-2 — `400 EXERCICES_NON_ORDONNES` si `exerciceN1.fin >= exerciceN.debut`. Le motif
      **nomme les deux périodes**, pas un code seul.
- [ ] AC-3 — `BilanDto` et `CompteResultatDto` publient `exerciceN` / `exerciceN1` **et**
      `dureeMoisN` / `dureeMoisN1` (dérivées), pour que l'écran étiquette ses colonnes avec ce
      que le serveur a réellement calculé, et non avec ce que l'écran croit avoir envoyé.
- [ ] AC-4 — `dureeMoisN ≠ dureeMoisN1` ⇒ drapeau `comparabiliteReduite: true` dans la réponse.
      **Non bloquant** : un exercice court est licite, il doit juste être *dit*.
- [ ] AC-5 — Les champs sont **optionnels** ⇒ aucun appel existant ne casse ; leur absence rend
      `null` et `comparabiliteReduite: false`.
- [ ] AC-6 — Test : mêmes soldes, `exerciceN1` de 9 mois ⇒ `comparabiliteReduite: true` et les
      montants **inchangés** (le drapeau informe, il ne proratise rien).

## Vigilance

- ⛔ **Ne rien proratiser.** Ramener un exercice de 9 mois à 12 est une décision de gestion, pas
  une règle comptable : la liasse déposée ne le fait pas, l'état ne doit pas le faire non plus.
- ⚠️ Ce contrôle est une **garde**, pas un appariement : le serveur ne devine toujours pas quel
  exercice est le N-1 d'un autre. C'est FE-032/FE-031 qui **désignent** — et la maquette l'écrit
  (« le comparatif se désigne, il ne se devine pas », règle posée par FE-031).
- ⚠️ `soldesN` est plafonné à **5 000 lignes** (`ArrayMaxSize`) : un cabinet à auxiliaires par
  point de vente le dépasse. Hors périmètre ici, mais à ficher si le cas se présente.

## Conséquences ailleurs

- **FE-031** et **FE-032** étiquettent tous deux leurs colonnes « Exercice 2025 / 2024 · N mois » :
  aujourd'hui c'est l'écran qui l'affirme, demain c'est le serveur qui le confirme.

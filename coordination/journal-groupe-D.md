# Journal du groupe D

> Écrit par le groupe D seulement. Lot 1 : `PLAN-4-SESSIONS-2026-11-14.md` §6 (le frontend, jamais commencé). **Lot 2 :
> `PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §5 (backend : `reseau-service`, puis le socle du distributeur).**

## État

- **2026-11-14** : journal ouvert, lot 1 pas encore commencé.
- **2026-11-16** : lot 2 lancé par l'utilisateur (« prends le lot 2 du groupe D et tu fais toutes les stories de ce
  lot »). La session tourne sur un poste à part (`C:\Users\USER\…`), pas sur le poste principal de A et C.
  - **STORY-1030** ✅ — le squelette de `reseau-service` (PR reseau-service#1, `dev` 80a4a29 ; `main` dc44bbf).
  - **STORY-1031** ✅ — gate complète (KYC), read-models KYC et identité, cloisonnement par le jeton, outbox
    transactionnelle (PR reseau-service#2, `dev` 64537b1).
  - **STORY-1032** ✅ — zones et agences, codes jamais réattribués, fermeture refusée et nommée, montants entiers,
    droits du module (PR reseau-service#3, `dev` e96d5da).
  - **STORY-1033** ✅ — hiérarchie récursive, 3 → 4 niveaux par configuration, anti-cycle, déplacement sur compte
    rendu (PR reseau-service#4, `dev` 2ddbebd).
  - Suivante : **STORY-1034** (personnes, commerciaux, affectations).

## Dépôts tenus

- `reseau-service` (lot 2) : `main` et `dev` posées le 2026-11-16 ; port de développement **3419** ; piles Docker
  `grp-d`.
- À venir : `prospera-ventes-service`, `prospera-terrain-service`, `prospera-recouvrement-service`,
  `prospera-pilotage-service`, `prospera-croissance-service` (à créer par l'utilisateur) ; dans `prospera-plateforme` :
  `series/`, `vocabulaires/`, `contrats/distributeur/`.
- Lot 1 (frontend) : rien n'a été écrit ; `frontend-admin-panel` n'est tenu par personne pendant le lot 2.

## Passations

- *(aucune)* — D-L2-5 : passation à Dev A **avant le 04/12**.

## Demandes aux autres groupes

- *(aucune)*

## Réponses aux demandes reçues

- ← A (2026-11-15) : les deux demandes adressées à D au lot 1 (point de départ AP-38 ; motif KYC perdu, reste de
  STORY-176) portent sur le frontend. Le lot 2 fait passer D au backend : elles **restent ouvertes** et reviendront
  avec le lot frontend. D n'y touche pas pendant le lot 2.

## Demandes à l'utilisateur (gestes réservés)

- **`reseau-service` : poser « Rebase and merge » seul.** Au 2026-11-16, la fusion par squash et par commit de fusion
  est encore permise. La session ne fusionne qu'en `gh pr merge --rebase`.
- **Créer les cinq dépôts du distributeur** (plan lot 2, §6) avant la 13e story (vers le 25/11).

## ⚠ Contrats

- *(aucun changement annoncé)* — `reseau.portee.changed@1` sera annoncé ici avant la fusion de STORY-1036.

## Questions à l'utilisateur ou au PO

- **Q-D-1 (2026-11-16, STORY-1031) — Le KYC dans la garde de `reseau` en mode « sur site ».** La spine (AD-10)
  exige le KYC Money Vibes de l'organisation ; une instance installée chez le client (EPIC-148) n'aura pas forcément
  de `kyc-service`. **Choix par défaut : KYC exigé partout** (D-1031-2), à revoir avec l'agent d'instance.

## Pièges rencontrés

- **Verrou Docker du poste** (`MoneyVibes_Apps\.verrou-docker`, une ligne : groupe, story, heure) : B l'a adopté sur ce
  poste ; D le prend avant toute pile ou image et le rend après `down -v`. Une attente de B (STORY-942) a duré ~30 min :
  D a avancé 1033 → 1035 sur des branches empilées pendant ce temps, puis a tout prouvé et fusionné d'une traite.

- Le poste de D est **partagé avec B** (piles `grp-b`) : toujours `docker compose -p grp-d …`, jamais un `down` sans
  `-p` ; ne jamais écrire dans les copies de travail de B (`_wt-b-stories`, `prospera-plateforme`).
- Un JSON écrit par heredoc perd ses antislashs (`"^.+\.(t|j)s$"` de `jest-int.json`) : outil d'écriture seulement.

- Poste de D : Node 25 en local. Le client Kafka de Confluent est natif : les tests se jouent dans le stage
  `verification` du `Dockerfile` (Node 24), `npm ci --ignore-scripts` suffit en local pour `tsc` et le lint.

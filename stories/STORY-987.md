# STORY-987 : le jeu de la compagnie de démonstration — un générateur à graine fixe

Status: done

**Complexité :** grande (un générateur déterministe de ~150 000 lignes cohérentes, quatre scénarios au franc près)

**Épic :** EPIC-204 (le logiciel de compagnie fictif, la compagnie de démonstration et la recette de la démo)
**Dépôts :** `prospera-plateforme` (dossier de C `contrats/assurance/demo/` : le générateur), `prospera-assureur-fictif`
(le chargement et la remise à zéro)
**Plage :** groupe C, n° 8 du lot (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §5).

---

## Pourquoi

La démo tourne sur une compagnie fictive (FR-15) : 14 gestionnaires, environ 3 500 dossiers sur tous les statuts, les
polices et garanties des sept produits (environ 25 000 contrats), les quatre scénarios `SIN-2026-9001` à `9004`,
rejouables. La spine (AD-19) et l'épic exigent un **générateur à graine fixe, par le contrat, jamais par écriture
directe**, et un jeu **cohérent au franc près** (FR-17).

## Ce qui doit être vrai à la fin (plan §5, n° 8)

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Graine fixe** : la même graine donne le même jeu, à l'octet (empreinte figée dans un test) ; aucune date système, aucun hasard non semé | tests |
| AC-2 | **Par le contrat** : chaque ligne du jeu est une ligne valide de l'annexe C (C-1 → C-9), et chaque lien existe (police → assuré et produit ; garantie, prime, coassurance, sinistre → police) | tests |
| AC-3 | **Le volume de la démo** : 7 produits, ~25 000 polices de tous statuts (dont primes impayées et coassurance), ~3 500 sinistres existants couvrant **chacun des 11 statuts et des 4 sorties au moins 10 fois**, chaque volet, chaque produit | tests |
| AC-4 | **Au franc près** (FR-17) : pour chaque sinistre, payé ≤ évalué, reste à payer nul au statut `REGLE` et après ; provision d'ouverture arrondie à 5 000, montants arrêtés au franc ; les quatre scénarios au **statut déclaré**, avec leurs chiffres de référence (`SIN-2026-9002` : devis 1 273 000, expert 445 500, évaluation 395 500, provision d'ouverture 780 000) | tests |
| AC-5 | **Le personnel** : 14 gestionnaires (3 corporel, 5 matériel, 3 risques divers, 3 recours), un compte par rôle (14 rôles), les experts (interne automobile, médecin-conseil, cabinets) ; noms fictifs | tests |
| AC-6 | **Le LC fictif charge le jeu** et le **remet à zéro** (en essai seulement, D-986-2) : tout est republié par lots du contrat ; prouvé avec `liaison-assureur` sur la pile | pile `grp-c` |

## Décisions retenues par défaut (contestables)

- **D-987-1 — Le générateur vit dans `contrats/assurance/demo/`** (dossier de C dans `prospera-plateforme`) : un fichier
  unique sans import, que le LC fictif copie (patron de `garde-etat-publie`).
- **D-987-2 — Les ~3 500 dossiers sont des « sinistres existants » du LC** (C-9), dont l'état porte le statut Prospera
  qu'ils auront ; les dossiers de Prospera naîtront de leur reprise ou de la machine à états (STORY-988 et suivantes).
  Le personnel et les scénarios sont des **données** du jeu, que les stories des rôles et du circuit chargeront.
- **D-987-3 — Les chiffres de `SIN-2026-9001`, `9003` et `9004`** non fixés par le PRD sont fixés ici (défauts H-003,
  H-084 : « le jeu de démonstration fixe la valeur exacte ») et figés par le test.
- **D-987-4 — La remise à zéro est celle du LC fictif** (ses objets, ses lots, ses numéros) ; la remise à zéro de
  l'espace d'essai entier est une opération du moteur (`agent-instance`, hors de C).

## Ce qui a été livré

**2026-11-16** — deux PR fusionnées en « Rebase and merge » :

- `prospera-plateforme` **#5** (`dev` `4a130b2`) : `contrats/assurance/demo/generateur.ts` et `test/demo.test.ts` ;
  chaque ligne du jeu complet validée contre le contrat ; empreinte du jeu figée, identique sous Node 24 et 25 ;
  dossier 103/103.
- `prospera-assureur-fictif` **#2** (`dev` `78ad10c`) : le générateur copié à l'octet ; `POST /assureur-fictif/jeu`,
  `POST /assureur-fictif/remise-a-zero`, `GET /assureur-fictif/jeu`. Node 24 : 351 unitaires + 14 e2e, lint 0 ; image
  reconstruite depuis `dev` : healthy.
- **Défaut trouvé par la preuve sur pile neuve, corrigé** : le cycle du LC fictif ne servait que les dossiers
  d'organisation existants ; un jeu publié avant le premier dépôt de Prospera n'était jamais écrit.
- **Pile réelle avec `liaison-assureur`** :
  - jeu réduit : 9 lots, 5 180 lignes relevées en 29 s, 0 refus, 0 attente ; `SIN-2026-9002` au statut déclaré,
    provision 780 000 ; remise à zéro puis relevé : tout « identique », aucun doublon ;
  - **jeu complet** : 205 915 objets en 46 lots, chargés au LC en 51 s ; relevés par Prospera en 1 015 s
    (209 361 projections, 0 attente) ; 1 242 refus, tous `DOUBLON` attendus (les clés du jeu réduit, déjà projetées
    avec un autre contenu : écart, jamais un écrasement). La remise à zéro côté Prospera est celle du moteur (D-987-4).

**Reste** : charger le personnel et les scénarios dans les modules qui les portent (rôles, circuit : EPIC-202, 205 et
suivants) ; la recette de l'annexe E au fil des épics.

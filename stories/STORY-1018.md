# STORY-1018 : l'indemnité proposée est arrondie, le décompte et le montant arrêté restent au franc (correctif de FR-73)

Status: ready-for-dev

**Complexité :** faible (une règle de comparaison, un détail de refus, des tests ; aucun contrat neuf)

**Épic :** EPIC-207 (instruire le dossier)
**Dépôt :** `prospera-sinistres-service` (module `sinistres`, dossiers `decompte/` et `evaluation/`)
**Porteur :** groupe C (dépôt de C). Fiche écrite par A le 2026-11-18 à la demande de l'utilisateur, qui a fait corriger
FR-73 le même jour.
Ancrage : FR-73 (corrigé le 2026-11-18), FR-75 (le montant arrêté n'est jamais écrit d'office), arbitrage R8
(`arbitrages-relectures.md` : l'arrondi à 5 000 ne vaut que pour les montants calculés par le système), H-060,
STORY-1010 (D-1010-4), STORY-1013 (D-1013-7).

---

## Pourquoi

FR-73 disait que l'indemnité calculée par le formulaire (702 000 FCFA dans le cas de FR-69) est « un repère déjà arrondi
au multiple de 5 000 ». C'est faux : 702 000 n'est pas un multiple de 5 000. 1010 a vu la contradiction et calcule
les deux montants (`indemniteCalculee` = 702 000, `reperePropose` = 700 000) ; l'utilisateur a tranché le 2026-11-18
selon les règles (R8, FR-73, H-060) :

| Montant | Règle | Exemple de FR-69 |
|---|---|---|
| **Le décompte** (`indemniteCalculee`) | au franc, ligne à ligne, arithmétique entière | 780 000 − 78 000 = **702 000** |
| **L'indemnité proposée** (`reperePropose`) | calculée par le système ⇒ arrondie au multiple de 5 000 le plus proche, une seule fois, à la fin | **700 000** |
| **Le montant arrêté** (`montant` de l'évaluation) | saisi par le gestionnaire, au franc, jamais pré-rempli | ce que le gestionnaire décide |

Le PRD est corrigé (FR-73, même PR que cette fiche). Il reste un défaut dans le code : `jugerLArret`
(`src/modules/sinistres/evaluation/evaluation.ts`, D-1013-7) ne compare le montant arrêté qu'au décompte au franc
(`e.montant !== decompte.indemniteCalculee`). Un gestionnaire qui arrête **exactement l'indemnité proposée** (700 000)
reçoit `MOTIF_ECRIT` (« le montant diffère du décompte »), et le refus ne cite que `calcule: 702000` : l'écran ne
peut même pas lui montrer le montant proposé. Et le test de référence de 780 000 n'éprouve pas le repère.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | ⛔ **Le cas de référence est éprouvé en entier** : 780 000, franchise 10 % minimum 50 000 ⇒ franchise 78 000, `indemniteCalculee` **702 000**, `reperePropose` **700 000** ; vol 400 000, vétusté 20 %, franchise 25 000 ⇒ 295 000 et 295 000 ; un montant calculé de 297 400 ⇒ repère 295 000 | tests purs (valeurs écrites dans le test) |
| AC-2 | ⛔ **Arrêter au montant proposé ne demande pas de motif** : à la première version, un montant égal à `reperePropose` (700 000) **ou** à `indemniteCalculee` (702 000) s'arrête sans motif ; tout autre montant (701 000, 650 000…) exige `MOTIF_ECRIT` comme aujourd'hui | tests purs ; mutation (retirer la comparaison au repère ⇒ rouge) |
| AC-3 | **Le refus nomme les deux montants** : `MOTIF_ECRIT` porte `details: { calcule: 702000, propose: 700000 }`, pour que l'écran montre au gestionnaire d'où vient l'écart | test pur ; e2e HTTP |
| AC-4 | **Le montant arrêté n'est jamais arrondi ni rempli d'office** : 297 400 arrêté reste 297 400 ; 395 500 (`SIN-2026-9002`) reste 395 500 ; rien n'écrit `reperePropose` dans `montant` | tests purs |
| AC-5 | **L'évaluation arrêtée garde les deux montants du décompte copié** (D-1013-3) et `GET …/evaluations` les rend sous leurs noms (`indemniteCalculee`, `reperePropose`) ; l'OpenAPI les décrit : « indemnité au décompte, au franc » et « indemnité proposée, arrondie au multiple de 5 000 (paramètre `arrondi_indemnite_fcfa`) » | test de service ; contrôle de l'OpenAPI |
| AC-6 | **Le corporel ne change pas** : aucun repère, aucun arrondi, motif jugé comme avant (D-1013-12) | test pur |
| AC-7 | **Une version suivante exige toujours un motif**, quel que soit le montant (D-1013-5) | test pur |

## Décisions retenues par défaut (contestables)

- **D-1018-1 — Deux montants « conformes », pas un seul.** Le gestionnaire peut suivre le décompte au franc ou
  l'indemnité proposée sans se justifier : les deux viennent du calcul. Tout autre montant est son choix, motivé.
- **D-1018-2 — Le nom d'écran est « indemnité proposée »**, pas « repère » : c'est le mot de FR-73 et de R8. Le champ
  garde son nom technique `reperePropose` (aucun renommage de contrat).
- **D-1018-3 — Le pas reste un paramètre** (`arrondi_indemnite_fcfa`, 5 000, H-060 à confirmer avec la compagnie) : la
  table du décompte porte déjà `arrondiDuRepere.pas` ; aucun chiffre écrit dans le code.

## Hors story

- L'écran « Pourquoi ce montant ? » (FR-74) et la saisie de l'évaluation : ils liront `details.propose` et
  `reperePropose`.
- Le chiffrage validé par l'expertise comme troisième montant conforme (FR-61, D-1013-7).

## Preuves attendues (règles des groupes)

Tests purs et de service par chemin de fichier, mutation de AC-2, e2e HTTP du refus (AC-3), lint ; Node 24
(étage `verification` ou nvm `24.22.3` sur le poste principal). Docker : non (aucune dépendance neuve).

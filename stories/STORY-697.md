# STORY-697 : L elimination fiscale ignore la part du 151 deja eliminee par l ecart de premiere consolidation

Status: done

**Épic :** EPIC-137
**Service :** `bilan-service` — module `consolidation`
**Points :** 5 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Prérequis :** **STORY-685** (élimination des écritures fiscales)
**Origine :** revue de code de STORY-685 (2026-10-02), constat n°1 — non bloquant pour le périmètre écrit, non vu par le cadrage (C7).

---

## Le fait

STORY-543 élimine les capitaux propres acquis **compte par compte**, au pourcentage d'intérêt, sur les
comptes de la fille (`ecarts-premiere-consolidation.regles.ts`, `pousser('DETENTEUR', s, cp.compte, …)`).
Le `151` étant un capital propre, il peut figurer dans ces lignes. Le résiduel fiscal de STORY-685
(`ecritures-fiscales.regles.ts`, `residuels`) ne lit que la liasse, l'écriture fiscale de l'exercice et
les reports : il **ignore** la colonne `ecartsPremiereConsolidation`.

**Scénario chiffré** — fille acquise à 80 %, capitaux propres d'entrée déclarés avec `151000 : 500` ;
STORY-543 passe `Dr 151 400`. En 2024, la liasse porte `151 C 500` sans mouvement : résiduel −500,
proposition `Dr 151 500 / Cr réserves 500`. Confirmée, le `151` consolidé vaut 500 − 400 − 500 =
**−400, à l'actif** ; le poste CM sort négatif, les réserves de la fille gagnent 400 de réserves
**antérieures à l'acquisition** — et `ECRITURES_FISCALES` passe pourtant `APPLIQUE`.

## Critères d'acceptation

- [x] AC-1 — Cadrer AVANT de coder l'articulation 541/543/685 : l'élimination fiscale doit-elle
      précéder (homogénéisation des capitaux propres d'entrée) ou tenir compte des lignes d'écart de
      première consolidation ? Décision écrite, appuyée sur le D4C.
- [x] AC-2 — Le scénario chiffré ci-dessus ne produit ni `151` négatif ni réserves d'avant
      l'acquisition ; test unitaire tiré de la décision, mutation rouge.
- [x] AC-3 — Non-régression : un groupe sans capitaux propres d'entrée sur `15` ne change pas.

## Cadrage (AC-1) — décisions, posées AVANT le code (2026-10-07)

**Ce que dit le texte.** Les capitaux propres acquis s'éliminent « après retraitements de
consolidation » : les capitaux propres d'entrée sont ceux de la société **homogénéisée**
(D4C, ch. 6, section 1 — capitaux propres retraités ; c'est le `K` de STORY-543 : « capitaux propres
**retraités** à la date d'entrée »). L'élimination des écritures passées pour la seule loi fiscale est
un de ces retraitements (AUDCIF, art. 86 3° ; D4C, ch. 3, § 2.2.1). Une provision réglementée
présente à l'entrée n'est donc, au regard du groupe, **pas** une provision : ce sont des **réserves**
de la filiale — et c'est en réserves que l'élimination des capitaux propres acquis doit la retirer.

**Les deux voies, mesurées sur le scénario** (fille à 80 %, `151 C 500` à l'entrée et à la clôture) :

| Voie | Fiscale proposée | Écart (543) | `151` avant minoritaires | Partage 544 (par compte, propriétaire `s` à 20 %) | `151` final | Réserves du groupe |
|---|---|---|---|---|---|---|
| **(B) tenir compte** — le résiduel lit `Dr 151 400` | `Dr 151 100 / Cr R 100` | `Dr 151 400` | 0 | 151 : 20 % × (500 − 100) = 80 ; R : 20 % × 100 = 20 | **−80** ❌ | +80 d'avant l'acquisition ❌ |
| **(A) précéder** — l'écart élimine en réserves | `Dr 151 500 / Cr R 500` | `Dr R 400` | 0 | 151 : 0 ; R : 20 % × 500 = 100 | **0** ✅ | 500 − 400 − 100 = **0** ✅ |

La voie (B) est **fausse** : le partage des minoritaires de STORY-544 est fait **compte par compte**
par propriétaire — la part du détenteur (`Dr 151 400`) ne réduit pas l'assiette des minoritaires sur
le `151` de la fille, qui gardent leurs 20 % de `151` et le rendent négatif.

- **D-697-1 — L'élimination fiscale PRÉCÈDE l'élimination des capitaux propres acquis.** À
  l'application d'un écart (`diagnostiquerEcarts`), une ligne d'élimination des capitaux propres
  (`eliminationCapitauxPropres`) portant sur une **provision réglementée** reconnue par les règles
  des écritures fiscales (`racinesProvisions`, D-685-2) se pose sur le **compte de réserves du groupe**,
  même société (`s`), même montant, même attribution (`DETENTEUR`). Le résiduel fiscal de STORY-685
  est **inchangé** : il contre-passe la provision en entier, ce qui est juste puisque l'écart ne la
  touche plus.
- **D-697-2 — Seulement quand l'élimination fiscale est opérante** : règles publiées, racines de
  gestion connues, règles cohérentes (exactement la condition sous laquelle 685 propose — une seule
  fonction, `reglesUtilisables`, pour les deux). Sans règles (SFD, CIMA, SMT, paquet < 1.5), rien ne
  change (AC-3) : la provision n'est pas éliminée, l'écart l'élimine où elle est. **Amendée en revue
  (2026-10-07)** : ni pour une société dont l'élimination fiscale de l'exercice est **OMISE** — sa
  provision n'est jamais contre-passée ; déplacer l'élimination y créait des réserves d'avant
  l'acquisition sous un traitement `APPLIQUE` (et un 409 sans objet sans compte de réserves).
- **D-697-3 — Le figé n'est pas touché** (AC-6 de 543) : ni le coût, ni `K`, ni l'écart
  d'acquisition, ni `eliminationCapitauxPropres` ne se recalculent ; seule la **pose** de la ligne
  change. Le compte de réserves devient requis dès qu'une telle ligne existe : son absence ou un
  compte de gestion refuse l'agrégat par le blocage existant de 543 (`COMPTE_RESERVES_NON_DECLARE`,
  `COMPTE_RESERVES_INVALIDE`) — jamais une ligne posée sur un compte vide.
- **Hors périmètre (nommé)** : (1) l'**impôt différé** de la provision éliminée à l'entrée — le texte
  le déduirait des capitaux propres acquis (écart d'acquisition plus fort) ; le figé ne se recalcule
  pas, STORY-545 le porte en réserves comme pour toute écriture fiscale ; (2) un référentiel **sans
  règles** où le cabinet DÉCLARE lui-même une élimination fiscale du `15` d'entrée : le produit ne
  sait pas reconnaître la provision, la déclaration reste sous sa responsabilité (état `DECLAREE`).

## Notes

- Voir [[STORY-685]] (C7, D-685-3), [[STORY-543]], [[STORY-544]] (partage par compte, D-544-7).

## Progress Tracking

**Statut : `done` (2026-10-07).** prospera-bilan-service#163 rebase-mergée sur `dev`.
- **Code** : `ecarts-premiere-consolidation.regles.ts` (`racinesProvisionsReglementees`, `societesOmises`,
  pose en réserves, attribution `DETENTEUR`) ; `ecritures-fiscales.regles.ts` (`reglesUtilisables`, condition
  unique, reprise aussi par la déclaration d'une société) ; `consolidation.service.ts` (câblage, sociétés
  intégrées seulement — l'appel des associées n'applique aucune ligne).
- **Preuve AC-2** : `ecritures-fiscales-ecarts.regles.spec.ts` rejoue la chaîne 543 → 685 (proposition
  confirmée) → agrégat → 544 par les fonctions de production : `151` = 0, réserves = 0, IM = −250 ; le code
  d'avant reproduit −400 / +400 (illustration). AC-3 réel : règles opérantes, entrée sans `15` (`101500`,
  racine et non sous-chaîne), aucun compte de réserves exigé.
- **Mutations** : 8/8 rouges (déplacement retiré, attribution AUCUNE, règles brutes, argument oublié,
  cohérence ignorée, omission ignorée, omises non câblées, `includes` au lieu de `startsWith`).
- **Portes** : lint 0 · build · 11 644 unit, 99,43/97,07/99,58/99,53 · 3 289 e2e.
- **Vérif docker** : sans objet — aucune écriture en base, aucun schéma touché (calcul de l'agrégat seul).
- **Revue de code** : 3 constats retenus et corrigés (omission → réserves d'avant l'acquisition ; AC-3 testé
  sur un cas qui ne pouvait pas rougir ; test « code d'avant » présenté à tort comme filtrant) + condition
  dupliquée de la déclaration unifiée. **Revue de sécurité** : 0 constat.

**Statut : `in_progress` (2026-10-07).** Cadrage AC-1 posé (D-697-1 à D-697-3) ; branches `MNV-697`
ouvertes sur `docs` (base `main`) et `bilan-service` (base `dev`).

**Statut : `ready-for-dev` (2026-10-02).** Créée à la clôture de STORY-685.

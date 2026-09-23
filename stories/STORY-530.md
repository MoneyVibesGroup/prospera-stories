# STORY-530 : Le périmètre de groupe — mère, filiales, pourcentages, et la date à laquelle tout ça était vrai

Status: done

**Épic :** EPIC-136 — Multi-société et périmètre de groupe
**Service :** `dossier-service`
**Points :** 8 · **Sprint :** S20
**Complexité :** high
**Prérequis :** **STORY-529** (plusieurs sociétés par organisation)
**Origine :** §6.3 de `analyse-scalabilite-multireferentiel-2026-08-27.md`.

---

## Le fait

Avant toute consolidation, il faut un **périmètre** : quelles sociétés, détenues à quel pourcentage,
depuis quand, et selon quelle méthode.

⚠️ **Un périmètre est daté, et c'est ce qui le rend difficile.** Une filiale acquise en juin n'entre
au périmètre qu'à partir de juin ; une filiale cédée en octobre en sort. Un périmètre sans dates est
un organigramme, pas un périmètre — et il produirait une consolidation fausse dont personne ne
verrait la cause.

## Critères d'acceptation

- [ ] AC-1 — Un **lien de participation** : société détentrice, société détenue, **pourcentage de
      contrôle** et **pourcentage d'intérêt** (les deux, ils diffèrent en cascade), **date d'effet**
      et date de fin éventuelle.
- [ ] AC-2 — La **méthode** est portée par le lien : intégration globale, intégration proportionnelle,
      mise en équivalence, hors périmètre. ⛔ Elle est **déclarée**, jamais déduite du pourcentage —
      le contrôle peut exister sans la majorité, et la majorité sans le contrôle.
- [ ] AC-3 — Le périmètre est **restituable à une date** : `perimetre(dossierId, date)` rend les
      sociétés retenues avec leur méthode et leurs pourcentages **à cette date**.
- [ ] AC-4 — Les **participations en cascade** sont supportées (mère → fille → petite-fille), et le
      pourcentage d'intérêt est calculé par produit des chaînes. ⚠️ Les **participations
      circulaires** sont **détectées et refusées**, pas calculées en boucle.
- [ ] AC-5 — ⛔ **Aucune consolidation dans cette story.** Elle livre le périmètre, et le périmètre
      seul a déjà une valeur : il permet à un cabinet de voir son groupe.
- [ ] AC-6 — Le périmètre appartient au **dossier de la mère**, et ne franchit jamais la frontière de
      l'organisation : deux cabinets ne partagent pas un périmètre.

---

# Cadrage — fait AVANT toute ligne de code

Sources : **AUDCIF 2017, articles 74, 78, 80, 94 et 96**, lus verbatim (texte officiel, édition
LegalRDC) ; la règle de cumul des droits de vote en cascade, de pratique constante (elle n'est pas écrite
dans l'Acte uniforme) ; le code de `dossier-service` (`dev`) ; le cadrage de STORY-529.

## Les constats mesurés

### M1 — Une « société » est un dossier du cabinet (D-529-1)

STORY-529 a tranché : le dossier porte l'identité complète de la société et la balance est keyée sur
lui. Un lien de participation relie donc **deux dossiers de la même organisation**. Aucun code n'est
partagé avec 529 : la dépendance est une **décision**, pas une branche.

### M2 — Le texte distingue trois contrôles, et aucun ne se réduit à un seuil

AUDCIF art. 78 : le **contrôle exclusif** résulte *« soit de la détention directe ou indirecte de la
majorité des droits de vote »*, *« soit de la désignation, pendant deux exercices successifs, de la
majorité des membres des organes »* (présumée au-delà de 40 % sans détenteur supérieur), *« soit du droit
d'exercer une influence dominante […] en vertu d'un contrat ou de clauses statutaires »* ; le **contrôle
conjoint** suppose un accord contractuel entre un nombre limité d'associés ; l'**influence notable** est
présumée à partir d'**un cinquième** des droits de vote. Art. 80 : exclusif ⇒ **intégration globale**,
conjoint ⇒ **intégration proportionnelle**, influence notable ⇒ **mise en équivalence**. Art. 96 : une
entité peut sortir du périmètre malgré sa détention (perte de contrôle démontrée, restrictions sévères,
titres détenus en vue de leur cession, importance négligeable).

⇒ L'AC-2 est exactement le texte : un contrat donne le contrôle sans la majorité, l'art. 96 retire la
majorité sans retirer les titres. La méthode est **déclarée** ; un pourcentage n'en décide jamais.

### M3 — Contrôle et intérêt ne se composent pas de la même façon

Le **pourcentage de contrôle** additionne les droits de vote détenus dans une société par la mère **et
par les seules sociétés qu'elle contrôle** : une chaîne de contrôle s'arrête à la première société non
contrôlée. Le **pourcentage d'intérêt** multiplie les parts de capital le long de chaque chaîne et somme
les chaînes. Exemple de référence : mère → fille 80 % (contrôlée), fille → petite-fille 60 % ⇒ contrôle
**60 %**, intérêt **48 %**. C'est la divergence que l'AC-1 annonce, et la seconde grandeur est celle qui
chiffrera les minoritaires (STORY-544).

### M4 — Un lien direct porte déjà DEUX pourcentages

Droits de vote et parts de capital divergent dès le lien direct (actions à droit de vote double, actions
sans droit de vote). Le lien porte donc `pctControle` (droits de vote détenus) **et** `pctInteret` (parts
de capital détenues), jamais l'un déduit de l'autre.

### M5 — Un périmètre daté se juge à CHAQUE date, pas sur l'ensemble des liens

Deux garde-fous que l'AC-4 et le simple bon sens imposent se jugent **date par date** : une participation
circulaire n'existe que si tous ses liens sont en vigueur **en même temps** (A→B jusqu'en 2021 et B→A
depuis 2023 ne forment aucun cycle), et la somme des détentions d'une même société ne dépasse **jamais
100 %** — mais seulement parmi les liens simultanés. Le calendrier d'un ensemble de liens se découpe en
intervalles où l'ensemble en vigueur est constant : c'est sur eux que le contrôle porte.

### M6 — Deux écritures concurrentes peuvent former ensemble ce que chacune évite

Un cycle A→B / B→A créé par deux requêtes simultanées passe les deux contrôles s'ils lisent l'état avant
l'écriture de l'autre. Même classe que STORY-505 (une règle d'écriture sous un verrou commun) : les
écritures de liens d'une organisation doivent être **sérialisées**.

### M7 — Les conventions de `dossier-service` s'appliquent telles quelles

Écriture sur un dossier archivé ⇒ `409 DOSSIER_ARCHIVE` (D9, règle unique du service) ; toute écriture
est **journalisée** (`dossiers_journal`, vocabulaire fermé `type-evenement-dossier`) ; transactions
manuelles à abandon gardé ; portée appliquée **dans la requête** (un collaborateur ne voit que ses
dossiers, jamais « Mon cabinet »).

## Les décisions

**D-530-1 — Le lien de participation** (collection `liens_participation`) : organisation, dossier
**détenteur**, dossier **détenu**, `pctControle` et `pctInteret` en **points de base** (entiers 0 à 10 000,
deux décimales, jamais un flottant), **méthode** déclarée — `INTEGRATION_GLOBALE`,
`INTEGRATION_PROPORTIONNELLE`, `MISE_EN_EQUIVALENCE`, `HORS_PERIMETRE` —, **date d'effet** et **date de
fin** facultative, incluse, à minuit UTC (convention des exercices du service). Refus : même dossier des
deux côtés, dossier d'une autre organisation (`404`, anti-énumération), dossier archivé, deux
pourcentages nuls, fin antérieure à l'effet.

**D-530-2 — Les invariants, jugés intervalle par intervalle** (M5), sous verrou (M6) : pas deux liens
simultanés entre les mêmes dossiers (`409 LIEN_DEJA_EN_VIGUEUR`) ; somme des droits de vote et somme des
parts détenues dans un même dossier ≤ 100 % à toute date (`409 DETENTION_SUPERIEURE_A_100`) ; **aucun
cycle** à aucune date (`409 PARTICIPATION_CIRCULAIRE`, le cycle nommé). La sérialisation passe par un
document de verrou par organisation, incrémenté dans la transaction de l'écriture (`409
CONFLIT_CONCURRENT` en cas de course, rien d'écrit).

**D-530-3 — Un lien se clôt ou s'annule, il ne se réécrit pas.** Un changement de pourcentage ou de
méthode = **clore** le lien (date de fin) et en créer un nouveau le lendemain ; une erreur de saisie =
**annuler** (le lien sort de tout calcul, reste lisible et journalisé). Aucune autre modification.

**D-530-4 — `GET /dossiers/:dossierId/perimetre?date=AAAA-MM-JJ` (AC-3)**, date **exigée** (jamais
supposée), calcul **pur** : la mère (entité consolidante, 100/100) ; les sociétés contrôlées de proche
en proche par des liens `INTEGRATION_GLOBALE` ; pour chaque société atteinte depuis la mère ou une société
contrôlée — contrôle = somme des droits de vote de ces détenteurs, intérêt = somme sur les chaînes du
produit des parts (fraction **exacte**, publiée aussi arrondie à deux décimales) (M3) ; méthode = celle
que déclarent ses liens entrants. Liens entrants de méthodes **divergentes** ⇒ la société est rendue
**sans méthode** avec l'anomalie `METHODES_DIVERGENTES` — jamais une méthode choisie. Une chaîne ne se
poursuit qu'à travers une société **contrôlée** : ce que détient une société mise en équivalence ou
intégrée proportionnellement n'entre pas au périmètre de la mère par elle. `HORS_PERIMETRE` ⇒ listée en
**exclue**, avec son motif (art. 96, justification en annexe).

**D-530-5 — La circularité est refusée à l'écriture ET détectée à la lecture** (AC-4) : le calcul ne
boucle jamais — une incohérence en base rend `409 PERIMETRE_CIRCULAIRE`, pas une récursion infinie.

**D-530-6 — Frontière de l'organisation (AC-6)** : les deux dossiers d'un lien appartiennent à
l'organisation du jeton, chaque requête filtre sur elle ; le périmètre ne lit que les liens de cette
organisation. Écritures réservées à `TENANT_ADMIN` (comme la création d'un dossier) ; lecture ouverte à
qui a la portée du dossier de la mère — et une société **hors de la portée du lecteur** est rendue **sans
son identité** : le périmètre ne devient pas un moyen de lire un dossier qu'on ne peut pas ouvrir.

**D-530-7 — Routes** : `POST /dossiers/:dossierId/participations` (le dossier du chemin est le
**détenteur**), `GET /dossiers/:dossierId/participations` (liens détenus et reçus), `POST
…/participations/:lienId/cloture`, `POST …/participations/:lienId/annulation`, `GET
/dossiers/:dossierId/perimetre`. Bornes de volume (liens par organisation) posées sur mesure.

## Hors périmètre — hooks inertes documentés

- **Toute consolidation** (AC-5) : agrégation, éliminations, retraitements — STORY-531 puis EPIC-137-141.
- **La publication du périmètre vers `bilan-service`** : aucun consommateur n'existe ; c'est la
  consolidation (531) qui dira ce qu'elle doit recevoir. Aucun producteur n'émet dans le vide.
- **Les entités hors cabinet** (une société du groupe que le cabinet ne tient pas en dossier) et **les
  sous-périmètres des entités en intégration proportionnelle**.
- **Les dates de clôture divergentes** entre mère et filiales (STORY-532) et l'homogénéité des
  référentiels et devises (531).

## Notes

- Voir [[STORY-529]], [[STORY-531]], `epics-consolidation-2026-08-28.md`.

## Progress Tracking

- 2026-09-23 — branche `MNV-530` ouverte sur `docs/` ; statut `ready-for-dev` → `in_progress`.
- 2026-09-23 — **cadrage fait avant tout code**, sur le texte (AUDCIF art. 74, 78, 80, 94, 96) : 7
  constats, 7 décisions. La méthode est déclarée parce que le texte lui-même la détache du seuil (M2) ;
  contrôle et intérêt ne se composent pas de la même façon (M3) ; cycles et plafond de 100 % se jugent
  date par date (M5) et sous verrou (M6).

- 2026-09-23 — **développée** (`dossier-service`, branche `MNV-530`) : module `participations` — liens
  datés (contrôle et intérêt en points de base), clôture, annulation motivée, journal des deux dossiers ;
  invariants (doublon, ≤ 100 %, cycle) jugés aux jours de bascule, sous verrou par organisation, reprise
  bornée à 3 ; périmètre à une date en fractions exactes, méthode déclarée, sociétés hors portée
  masquées ; borne de 2 000 liens par organisation. Au-delà de la fiche : motif obligatoire à
  l'annulation ; le journal ne nomme jamais l'autre dossier ; une `reference` (`S0`, `S1`…) garde la
  structure lisible pour un collaborateur. PR `dossier-service#33`.

### Revue de code (⑥)

- **1 constat (confiance 80), corrigé** (`109ae3b`) : un lien créé avec une date de fin future (pacte à
  terme, D-530-1) refusait toute clôture (`LIEN_DEJA_CLOS`) — la procédure de changement de D-530-3
  (clore, puis créer le successeur le lendemain) y était impossible, seule l'annulation restait. Une
  clôture peut désormais RACCOURCIR un lien jamais clos ; une fin posée par une clôture ne se repose pas,
  aucune fin ne s'allonge. Quatre mutants rouges.

### Revue de sécurité (⑦)

- **1 constat (confiance 95), corrigé** dans un commit séparé (`f4f082b`) : ⚡⚡ **DoS par la taille des
  fractions exactes** (CWE-400/407). L'intérêt le long d'une chaîne de k liens a un dénominateur de
  10 000^k, réduit à chaque étape par un PGCD naïf : une chaîne de 1 000 liens à 99,99 % — admise par
  tous les invariants d'écriture — bloquait la boucle d'événements **39 s** pour tous les cabinets et
  publiait 4,4 Mo ; 2 000 liens, plusieurs minutes. Au-delà de **30 niveaux**, le périmètre rend
  `409 PERIMETRE_TROP_PROFOND` sans rien calculer ; la borne porte sur la **plus longue** chaîne retenue
  (celle qui fixe la taille de la fraction), pas sur la profondeur publiée. Trois mutants rouges.

### Mutations — rejouées dans la session

- 22 / 22 rouges sur les mutations restantes de l'agent (reprise, portée du lecteur, verrou, dépôt,
  rôles, DTO, immuabilité, garde d'exhaustivité ; S12-S14 et R3 réalignées sur le correctif de revue) —
  les 33 premières définitions ont été purgées avec le scratchpad, leur table (toutes rouges) est celle
  de l'agent ; + 4 mutants du correctif de revue, + 3 du correctif de sécurité.

### Portes finales — `f4f082b`, mesurées dans la session

| lint · build | unitaires | couverture (instr. / branches / fonctions / lignes) | e2e |
|---|---|---|---|
| ✅ | **100 suites, 1 623** | 99,44 / 94,49 / 98,49 / 99,55 | **9 suites, 334** |

### Vérification docker — pile neuve (`down -v`), `dossier-service` `f4f082b`

| Scénario | Mesuré |
|---|---|
| M→F 80/80, F→PF 60/60 (IG), périmètre au 30/06/2025 | F : contrôle 8000, intérêt 4/5 ; PF : contrôle 6000, intérêt **12/25** (4800) |
| Cycle PF→M | `409 PARTICIPATION_CIRCULAIRE`, cycle nommé — rien d'écrit |
| Doublon M→F chevauchant | `409 LIEN_DEJA_EN_VIGUEUR` (`premierJourCommun`) |
| X→F 30 % (80 + 30) | `409 DETENTION_SUPERIEURE_A_100` (11 000 > 10 000) |
| Course A→B / B→A simultanés | un `201`, un `409 PARTICIPATION_CIRCULAIRE` ; **1** lien en base |
| ⚡ Revue : fin 2030 ramenée au 30/06/2026, successeur au 01/07/2026 | `200` puis `201` ; 2ᵉ clôture `409 LIEN_DEJA_CLOS` ; `closLe`/`closPar` en base |
| Annulation | sans motif `400` ; avec motif `200 ANNULE`, lien sorti du périmètre |
| Journal | 2 entrées par acte (10 créations, 2 clôtures, 2 annulations sur 5 + 1 + 1 actes) |
| ⚡ Sécurité : chaîne à 99,99 % | 30 maillons `200` en 39 ms ; 31 maillons `409 PERIMETRE_TROP_PROFOND` en 27 ms ; `/health` 32 ms |

Non rejoué en docker : le masquage pour un collaborateur (`TENANT_USER`), couvert par l'e2e (jeton
collaborateur sur chaque route) et les mutations S15/S16/S18/R2.

Pile arrêtée après la vérification (`docker compose stop`).
- 2026-09-23 — **clôturée** : `dossier-service#33` rebase-mergée sur `dev`, branche supprimée. Statut
  `in_progress` → `done`.

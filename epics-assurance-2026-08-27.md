---
stepsCompleted: [1]
inputDocuments:
  - prospera-stories/analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md (§3, CIMA @1.0 allégé)
  - prospera-stories/referentiels/README-cima-assurances.md
  - prospera-stories/stories/STORY-488.md (CIMA entre au contrat canonique de balance)
  - prospera-stories/sprint-status.yaml (reserved_ranges, relevé le 2026-08-27)
---

# Vertical Assurance / CIMA (`assurance-service`) — Découpage en épics

> **Décision PO du 2026-08-27 :** l'assurance est **promise**. Ce document dit ce que la promesse
> engage, et à quelle condition elle est tenable sans exposer un assureur.

## Vue d'ensemble

**Série retenue : épics EPIC-128 → EPIC-134.** Dernier épic attribué au 2026-08-27 : **EPIC-127**
(vertical microfinance, pris le même jour). **Aucun `story_id` n'est réservé ici.**

---

## Où en est réellement le produit

`cima-assurances@1.0` existe, packagé côté `bilan-service` (STORY-122) : plan de comptes issu de la
**liste officielle de l'article 431 du code CIMA** (libellés verbatim, classes 0 à 8), postes de
bilan et compte de résultat avec **résultat technique** et **résultat net** en formules.

Trois choses qu'il faut dire ensemble, sinon la promesse devient un piège :

1. **Le référentiel est une amorce**, explicitement marquée *« à valider par un actuaire / expert
   assurance »*. Le plan est officiel ; les **postes et la table de passage** sont une proposition
   structurellement cohérente, pas une norme certifiée.
2. **La balance d'un assureur est aujourd'hui impossible.** `CIMA` est un axe que le dossier accepte
   et que le contrat canonique de balance ne connaît pas ⇒ `500 REFERENTIEL_UNAVAILABLE`. C'est
   **STORY-488**, slottée au S20, qui ferme ce trou.
3. **Ce qui manque n'est pas le plan, c'est le métier.** La ventilation fine Vie / Non-Vie, les
   variations de provisions techniques poste à poste et les états annexes C1..C25 sont **hors
   amorce**, écrit noir sur blanc dans l'analyse du 2026-07-21.

## Le fait qui commande le découpage

**Les provisions techniques représentent l'essentiel du passif d'un assureur, et elles ne se
calculent pas comptablement.**

Une provision pour sinistres à payer, une provision pour risques en cours, une provision
mathématique vie sont des **évaluations actuarielles** : elles dépendent de cadences de règlement, de
tables de mortalité, de taux d'actualisation. Aucun moteur d'états ne les produit à partir d'une
balance — c'est l'inverse : **elles entrent dans la balance**, et tout le passif en dépend.

⚡ **Conséquence directe sur la promesse commerciale.** Un assureur à qui l'on vend « le bilan CIMA »
comprendra « la liasse réglementaire ». Ce que le produit sait faire aujourd'hui, c'est **présenter
au format CIMA une balance qu'on lui donne**. Les deux sont très loin l'un de l'autre, et l'écart se
découvre au premier arrêté — c'est-à-dire trop tard.

⛔ **Recommandation d'expert-comptable : promettre par palier, pas en bloc.** Le palier 1
(EPIC-128/129) est atteignable et se vend honnêtement ; le palier 2 (provisions techniques) est un
projet actuariel, et l'annoncer disponible avant qu'il ne le soit coûterait la crédibilité de tout
le reste du produit.

---

## Les épics, en deux paliers

### Palier 1 — vendable, et honnête (EPIC-128 → EPIC-130)

| Épic | Objet | Note |
|---|---|---|
| **EPIC-128** | **Socle vertical CIMA** : entitlement `cima-assurances`, gate, cloisonnement, et **fermeture du 500** | Repose sur **STORY-488** (S20). Le statut « amorce » reste **publié au contrat**, jamais masqué |
| **EPIC-129** | **Contrats, primes et quittances** : émission, annulation, ristournes, primes acquises et non acquises, **fractionnement** | Le **cycle inversé** de l'assurance commence ici : l'encaissement précède le service rendu |
| **EPIC-130** | **Sinistres et règlements** : déclaration, évaluation, règlements, recours et sauvetages | Alimente EPIC-131 en **cadences de règlement** — sans elles, aucune PSAP n'est calculable |

### Palier 2 — projet actuariel, à ne pas annoncer avant cadrage (EPIC-131 → EPIC-134)

| Épic | Objet | Note |
|---|---|---|
| **EPIC-131** | ⚡ **Provisions techniques** : PSAP, provision pour risques en cours, provisions mathématiques vie | ⛔ **Exige une compétence actuarielle au cadrage, pas à la recette.** Ni le PRD, ni l'architecture, ni ce document ne peuvent la remplacer |
| **EPIC-132** | **Réassurance** : traités, cessions, part des réassureurs à l'actif, commissions | Omniprésente en CIMA. Elle traverse **tous** les états et ne s'ajoute pas après coup |
| **EPIC-133** | **Comptes de résultat technique Vie et Non-Vie, et compte non technique** | ⚠️ Ce n'est **pas** un compte de résultat SYSCOHADA réarrangé : la séparation Vie / Non-Vie est réglementaire et étanche |
| **EPIC-134** | **États annuels CIMA (art. 433) et marge de solvabilité** | ⚠️ **Jalon `format confirmé` obligatoire.** Une trentaine d'états modèles, pas une liasse |

---

## Le piège déjà attrapé, et qu'il faut garder

La **classe 8 du plan CIMA mêle comptes de gestion et comptes de regroupement**. Le repli générique
du moteur fiscal a été mesuré dessus : la base imposable ressortait **exactement doublée**, et aucun
contrôle ne s'en apercevait — le calcul était juste, sa source ne l'était pas.

⚡ C'est le meilleur avertissement de ce document : sur un référentiel sectoriel, **un traitement
générique qui « marche » est le mode de panne le plus probable**, pas le rassurant. STORY-488 AC-5
en fait un test permanent.

---

## Trois décisions à rendre

1. **Q1 — Fait-on l'assurance, ou la comptabilité de l'assurance ?** Recommandation : **la
   comptabilité**. Souscription, gestion de contrats et sinistres au guichet relèvent d'un logiciel
   métier ; Prospera tient les **comptes** et produit les **états**. EPIC-129/130 se limitent alors à
   ce qui alimente la comptabilité, ce qui divise le périmètre.
2. **Q2 — Qui valide l'amorce ?** Le référentiel porte le statut « à valider par un actuaire ».
   **Tant que personne n'est nommé, le palier 1 ne peut pas être annoncé comme certifié** — seulement
   comme servi avec son statut.
3. **Q3 — IFRS 17 ?** Hors zone CIMA (Nigeria, Ghana), l'assurance relève d'IFRS 17, qui n'a **aucun
   rapport** avec le plan CIMA. Le PO vise la CEDEAO : il faut décider maintenant si le vertical
   assurance s'arrête aux 14 États CIMA. **Recommandation : oui, et le dire** — traiter IFRS 17
   serait un second produit.

---

## Stories attribuées — 2026-08-27, après lecture de l'artefact

**14 stories, 145 pts, toutes slottées S20** sur décision PO, plus **STORY-488** qui ferme le `500`.
Spine : `architecture/architecture-assurance-service-2026-08-27/ARCHITECTURE-SPINE.md` (AD-1 → AD-12).

| Palier | Épic | Stories | Pts |
|---|---|---|---:|
| **1** | **EPIC-128** Socle | **511** socle et amorce publiée · **512** niveau de détail du plan | 21 |
| **1** | **EPIC-129** Contrats & primes | **513** contrats et quittances · **514** primes acquises ≠ émises | 16 |
| **1** | **EPIC-130** Sinistres | **515** sinistres et recours · **516** cadences de règlement | 16 |
| **2** | **EPIC-131** Provisions techniques | **517** évaluation datée · **518** variations au CR · **519** ce qu'on calcule *(needs-po-decision)* | 34 |
| **2** | **EPIC-132** Réassurance | **520** modélisée à la cession | 13 |
| **2** | **EPIC-133** Vie/Non-Vie | **521** étanchéité · **522** classe 8 par liste explicite | 21 |
| **2** | **EPIC-134** États & solvabilité | **523** états art. 433 *(needs-po-decision)* · **524** marge et représentation | 26 |

### Ordre contraignant

```
488 → 511 → 512
        ↘ 513 → 514 → 517 → 518 → 521 → 523
                        ↘ 520 ↗      ↘ 524
        ↘ 515 → 516 → (519)
```

### Ce que la lecture de l'artefact a établi, et qui n'était dans aucun document

Trois faits **mesurés** dans `cima-assurances-1.0.json` le 2026-08-27, qui déplacent le découpage :

1. ⛔ **`RT = +RP1 +RP3 +RP5 −RC1 −RC5 …`, sans aucune variation de provision technique**, et `RP1`
   mappe le compte `70` — **primes émises**. ⇒ Le résultat technique publié est **un résultat de
   trésorerie**. C'est STORY-514 et STORY-518, et c'est la raison d'être du palier 2.
2. ⚠️ **Le plan s'arrête à 80 comptes à DEUX chiffres.** Le rattachement résolvant par plus long
   préfixe, tout fonctionnera — et la liasse n'aura aucun détail. Le SFD a payé cette question deux
   fois (STORY-172, puis STORY-368 sur un artefact **tronqué à 156 comptes sur 372**) ; CIMA ne l'a
   jamais posée. ⇒ STORY-512.
3. ⚡ **`racinesDeGestion: ['6','7','80','82','83','84','85','86']`** — la classe 8 déclarée en bloc,
   alors qu'elle mêle gestion et **regroupement**. C'est la source mesurée du doublement exact de la
   base imposable. ⇒ STORY-522, qui généralise la garde posée par STORY-488 AC-5.

⚡ **À porter au crédit de l'auteur de l'amorce : les trois manques sont écrits dans les libellés
eux-mêmes.** `RT` s'intitule *« Résultat technique (amorce — hors variations de provisions
techniques et séparation Vie/Non-Vie) »*. Rien n'a été caché ; ce qui manquait, c'étaient les
stories.

### Les deux décisions qui bloquent le palier 2

- **STORY-519** — *qui valide l'amorce actuarielle ?* Tant qu'aucune personne n'est nommée, le
  palier 2 ne démarre pas. Une méthode de provisionnement fausse produit un passif faux, donc une
  marge de solvabilité fausse, donc un avis de conformité faux.
- **STORY-523** — *combien d'états de l'article 433, et lesquels ?* Une trentaine d'états annexes
  n'est pas une story : c'est un lot. Même question de doctrine que STORY-509 et STORY-525.

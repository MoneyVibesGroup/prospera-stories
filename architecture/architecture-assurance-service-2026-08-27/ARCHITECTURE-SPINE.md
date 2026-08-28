---
name: 'assurance-service'
type: architecture-spine
purpose: build-substrate
altitude: feature
paradigm: 'modules NestJS sur le moule commun Prospera — module du vertical Assurance (zone CIMA), relying-party de l''IdP, producteur d''événements, **adaptateur de la balance canonique**'
scope: 'micro-service assurance-service — contrats, primes et quittances, sinistres et règlements, provisions techniques (hébergées et datées), réassurance, comptes techniques Vie/Non-Vie, états annuels CIMA et marge de solvabilité'
status: 'proposé — 2026-08-27, à la suite de la revue expert-comptable de la maquette cumulative (décision PO : l''assurance est promise). ⚠️ DÉCOUPÉ EN DEUX PALIERS, et le découpage EST la décision.'
created: '2026-08-27'
binds:
  - 'epics-assurance-2026-08-27.md — EPIC-128 → EPIC-134'
sources:
  - 'bilan-service/src/modules/bilan/referentiel/assets/cima-assurances-1.0.json — LU LE 2026-08-27 : 80 comptes (art. 431, 2 chiffres), 25 postes, 25 mappings, 4 FORMULE (CAT, CPT, RT, RN), roles TOTAL_ACTIF/TOTAL_PASSIF/RESULTAT_BILAN, racinesDeGestion [6,7,80,82,83,84,85,86]'
  - 'prospera-stories/referentiels/README-cima-assurances.md'
  - 'prospera-stories/analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md §3'
  - 'prospera-stories/stories/STORY-488.md (CIMA entre au contrat canonique de balance — S20)'
  - 'prospera-stories/architecture/architecture-stock-service-2026-08-15/ARCHITECTURE-SPINE.md (patron de l''adaptateur de balance)'
---

# Architecture Spine — assurance-service

> **Ce que ce service est.** La comptabilité d'une compagnie d'assurance de la zone CIMA : ce qu'elle
> a **encaissé**, ce qu'elle **devra**, et l'écart entre les deux — qui est **tout le métier**.
>
> **Sa propriété structurante :** *le résultat technique d'un assureur est un écart de provisions,
> pas une différence d'encaissements.* Un module qui l'oublie produit un résultat juste
> arithmétiquement et faux métier — ce que l'amorce packagée fait aujourd'hui, et le dit.

## ⚡ Ce que la lecture de l'artefact a établi le 2026-08-27

`cima-assurances@1.0` est packagé et fonctionne. Sa **structure exacte**, relevée dans le fichier :

- **80 comptes** — la liste de l'article 431, à **2 chiffres**, libellés verbatim ;
- **25 postes / 25 mappings**, dont **4 en `FORMULE`** : `CAT` (total actif), `CPT` (total passif),
  `RT` (résultat technique), `RN` (résultat net) — avec leurs `role` ;
- `racinesDeGestion: ['6','7','80','82','83','84','85','86']`.

**Et les trois manques sont dans les libellés eux-mêmes**, ce qui est à porter au crédit de son
auteur : `RT` est intitulé *« Résultat technique (amorce — **hors variations de provisions
techniques et séparation Vie/Non-Vie**) »*.

| Manque relevé dans l'artefact | Conséquence |
|---|---|
| `RT` = `+RP1 +RP3 +RP5 −RC1 −RC5 …` — **aucune variation de provision technique** | Le résultat technique publié est **un résultat de trésorerie**, pas un résultat technique |
| `RP1` mappe le compte `70` — **primes émises**, pas primes **acquises** | Il manque la variation de la provision pour primes non acquises |
| **Aucune séparation Vie / Non-Vie** — un seul `COMPTE_RESULTAT` plat | Le CIMA impose des comptes techniques **étanches** |
| **Rien dans le CR pour la part des réassureurs dans les sinistres** (`CA2` existe au bilan seul) | La réassurance traverse tous les états ; elle ne s'ajoute pas à la fin |
| **Plan à 2 chiffres** | Le rattachement résout par plus long préfixe : tout marchera, et **la liasse n'aura aucun détail** |

## Colonne vertébrale — AD-1 → AD-12

| # | Décision | Ce qu'elle contraint |
|---|---|---|
| **AD-1** | **Le résultat technique est un écart de provisions.** Toute la conception en découle | Le CR porte des **postes de variation** de provisions techniques ; sans eux, `RT` reste faux |
| **AD-2** | ⚡ **Une provision technique est une ÉVALUATION DATÉE ET VERSIONNÉE**, avec sa **méthode** et son **auteur** — jamais un solde qu'on écrase | C'est ce qui sépare une provision d'un chiffre. Un contrôle CIMA demande la méthode, pas le montant |
| **AD-3** | **Vie et Non-Vie sont étanches** : deux comptes techniques, jamais une somme | Contrainte réglementaire, pas une préférence de présentation |
| **AD-4** | **La réassurance se modélise à la cession**, pas en correction finale | Elle traverse primes, sinistres, provisions et commissions. L'ajouter après oblige à tout reprendre |
| **AD-5** | **Le module publie une BALANCE canonique**, jamais des écritures | Même patron que `stock-service` et `microfinance-service`. Le contrat aval ne change pas |
| **AD-6 / AD-7** | **Dossier** (AD-P13) et **exercice du dossier** (AD-P14) | Hors portée ⇒ `404`. Aucune écriture sur exercice clos |
| **AD-8** | **Le référentiel du dossier fait autorité** — `cima-assurances` | ⛔ **Dépend de STORY-488** : aujourd'hui l'axe `CIMA` existe au dossier et pas au contrat de balance ⇒ `500` |
| **AD-9** | ⚡⚡ **Toute lecture de la classe 8 passe par une liste EXPLICITE de comptes, jamais par une racine** | La classe 8 CIMA mêle comptes de **gestion** et comptes de **regroupement** ; `racinesDeGestion` la déclare en bloc, et le repli générique y a déjà **doublé exactement la base imposable** sans qu'aucun contrôle ne s'en aperçoive |
| **AD-10** | **L'amorce est publiée COMME TELLE**, statut compris, partout où elle est servie | Un résultat technique faux publié **sans son statut** est le pire livrable possible du programme |
| **AD-11** | **Le niveau de détail du plan est une question ouverte et déclarée** | Le SFD a payé cette question deux fois (STORY-172, STORY-368). CIMA ne l'a jamais posée |
| **AD-12** | ⛔ **Aucun calcul actuariel n'est inventé.** Le module **héberge** une évaluation et sa méthode ; il ne la produit pas tant qu'un actuaire n'a pas validé la méthode | C'est ce qui rend le **palier 1 livrable maintenant** sans mentir |

## Les deux paliers, et pourquoi c'est la décision

**Palier 1 — EPIC-128/129/130.** Socle, contrats/primes/quittances, sinistres/règlements. Atteignable,
vendable, honnête : le produit sait **présenter au format CIMA une balance qu'on lui donne**, et il
enregistre la matière (primes, sinistres) qui alimentera le palier 2.

**Palier 2 — EPIC-131 à 134.** Provisions techniques, réassurance, comptes techniques Vie/Non-Vie,
états art. 433 et marge de solvabilité. **Projet actuariel.**

⛔ **Un assureur à qui l'on vend « le bilan CIMA » comprend « la liasse réglementaire ».** L'écart
entre les deux se découvre **au premier arrêté**, c'est-à-dire trop tard. AD-12 et AD-10 existent
pour que le palier 1 ne puisse pas être confondu avec le palier 2.

## Ce qui reste ouvert

- **Q1 (tranchée par le périmètre)** — on fait **la comptabilité de l'assurance**, pas l'assurance :
  souscription et gestion de sinistres au guichet relèvent d'un logiciel métier ; EPIC-129/130 se
  limitent à ce qui **alimente la comptabilité**.
- ⛔ **Q2 non tranchée : qui valide l'amorce ?** Tant qu'aucun actuaire n'est nommé, le palier 1 ne
  peut être annoncé que **servi avec son statut**, jamais certifié.
- ⛔ **Q3 non tranchée : IFRS 17.** Hors zone CIMA (Nigeria, Ghana), l'assurance relève d'IFRS 17,
  qui n'a **aucun rapport** avec le plan CIMA. Recommandation : le vertical s'arrête aux 14 États
  CIMA, **et on le dit**.

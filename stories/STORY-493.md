# STORY-493 : Packager un paquet fiscal pays est un travail non reproductible — ni schéma, ni garde de complétude, ni procédure

Status: in_progress

**Épic :** EPIC-109 — Paquets fiscaux pays : gabarit, garde et procédure de sourcing
**Service :** `balance-service` (`scripts/referentiels/sources/`, `scripts/referentiels/build.mjs`,
`src/modules/referentiel/`). **Il n'existe pas de `fiscal-service`** : la fiche le nommait par anticipation.
Le paquet togolais est aujourd'hui recopié dans **quatre** emplacements de **trois** dépôts —
`balance-service` (source + asset, 20 rubriques), `dossier-service` (asset, octet pour octet identique),
`bilan-service` (source propre, 10 rubriques) et `docs/referentiels/` (16 rubriques) — voir le périmètre.
**Points :** 8 · **Complexité :** high · **Assigné à :** vivianMoneyVibesGroupes · **Sprint :** S20
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27 — la question « comment ajoute-t-on le Bénin ? » n'a aujourd'hui aucune réponse écrite.

---

## Le fait

Le paquet fiscal togolais est **le meilleur artefact du programme** : types de taxes, déductibilité
**type par type**, codes de réintégration, échéances d'acomptes, plancher de MFP, plafond de TPU,
taux de retenue. Il a été construit depuis le CGI et le LPF de l'OTR, et deux erreurs de maquette ont
été attrapées **contre lui** (acomptes posés en trimestriel au lieu des dates réelles ; RSL à 10 % au
lieu de 8,75 %) — ce qui a produit la règle projet « les chiffres d'une maquette fiscale se prennent
dans le PAQUET, jamais dans le vraisemblable ».

**Et il est irreproductible.** Il n'existe ni schéma formel de ce qu'un paquet doit contenir, ni
garde qui refuse un paquet incomplet, ni procédure écrite de sourcing. Le second pays sera donc
construit de mémoire, par comparaison au premier, et ce qui manquera manquera en silence — comme les
quatre exonérations de MFP publiées en prose et jamais exposées au contrat (STORY-412), erreur que sa
propre traçabilité rendait plus difficile à mettre en doute qu'un chiffre sans provenance.

⚡ **Cette story ne livre pas un pays. Elle livre la capacité d'en livrer N.**

## Critères d'acceptation

- [ ] AC-1 — Un **schéma JSON** décrit le paquet fiscal : impôt sur le résultat (taux, minimum
      forfaitaire et ses **exonérations**), régime synthétique et son plafond, TVA (taux,
      exonérations, règles de déduction, échéances), retenues à la source, types de « autres impôts
      et taxes » avec leur **déductibilité** et leur **code de réintégration**, échéances
      déclaratives et de paiement, report déficitaire (durée et ordre d'imputation), **devise** et
      **pays**.
- [ ] AC-2 — Chaque valeur porte sa **référence légale** (texte, article, année) et l'`_meta` porte
      la loi de finances applicable. Une valeur sans référence fait **échouer le build** — c'est la
      seule garde qui empêche « vraisemblable » d'entrer.
- [ ] AC-3 — Une **garde de complétude** refuse au build un paquet dont une section obligatoire
      manque, en nommant la section. Le paquet togolais doit la passer **sans modification** ; s'il
      ne la passe pas, c'est la garde qui est fausse, et le constater est un résultat en soi.
- [ ] AC-4 — Une **procédure de sourcing** écrite (`referentiels/README-paquet-fiscal.md`) : où
      trouver le texte officiel, quoi extraire, dans quel ordre, ce qui se valide par un fiscaliste
      et ce qui ne se valide pas. Elle est rédigée **en refaisant le paquet togolais avec**, pas de
      mémoire — sinon elle décrit une méthode que personne n'a suivie.
- [ ] AC-5 — Le statut « à valider par un fiscaliste » est un **champ**, pas une note de bas de page.
      Un paquet non validé est servi avec son statut, et tout écran qui l'affiche doit pouvoir le
      dire. Un barème présenté comme certifié quand il ne l'est pas est le seul défaut de ce produit
      qui puisse coûter un redressement à un client.

## Conséquences ailleurs

- Rend chiffrable, et surtout **répétable**, l'ouverture des 7 autres pays UEMOA puis de la Guinée.
- Chaque paquet pays reste **une story à part entière avec son sourcing** : celle-ci ne les
  pré-approuve pas. On ne package pas une loi de finances par analogie.

## ⚠️ Mesuré dans le code avant de brancher (2026-09-12)

La fiche décrit **un** paquet fiscal togolais. Il y en a **trois contenus distincts**, recopiés dans
**quatre** emplacements de **trois** dépôts, et aucune garde ne les confronte :

| Emplacement | Rubriques | Rôle réel |
|---|---|---|
| `balance-service/scripts/referentiels/sources/` → `src/modules/referentiel/assets/` | **20** | artefact **autoritaire**, produit par `build.mjs`, lu par le moteur fiscal |
| `dossier-service/src/modules/portefeuille/echeance/assets/` | 20 | copie **octet pour octet** de l'asset de `balance-service` |
| `bilan-service/scripts/referentiels/sources/` (+ variante `-zonefranche`) | **10** | **embarqué** dans le référentiel `syscohada-revise@2.1` sous la clé `paquetFiscal`, et **lu par le prévisionnel** (`projection/impot.ts` : `is.taux`, `tva`, `minimumForfaitairePerception`, `acomptesProvisionnels`) |
| `docs/referentiels/` | 16 | copie de documentation, en retard |

**D-493-A — la copie de `bilan-service` porte un chiffre déjà corrigé ailleurs.** Sur les 78 feuilles
communes aux deux sources, **25 divergent**, toutes textuelles à ce jour — mais l'une d'elles publie
`IRPP (bareme progressif, tranche haute 30%)` quand `balance-service` **et** le README du dépôt `docs/`
portent **35 %**, correction explicitement consignée le 2026-07-19. Elle est dans l'artefact **construit et
servi** `syscohada-revise-2.1.json`. Aucune valeur **numérique** ne diverge aujourd'hui : rien ne
l'empêche demain, le prévisionnel et la liquidation lisant deux fichiers différents pour le même
`pays × année`.

**D-493-B — la garde de STORY-491 ne couvre pas le paquet fiscal.** `bilan-service` refuse depuis
STORY-491 de packager un **référentiel comptable** dont le `_meta` est incomplet (`zoneComptable`,
`pays`, `devisePresentation`, `normeSource`, `statut`, `miseEnGarde` si `amorce`), avec un vocabulaire
fermé dans `meta-vocabulaire.json`. Cette garde porte sur le `_meta` **du référentiel**, jamais sur le
`_meta` **du paquet fiscal** qu'il embarque. Côté `balance-service`, `build.mjs` se contente
d'**imprimer** `_meta.statut` : aucune garde, d'aucune sorte.

**D-493-C — la règle d'AC-2 se calibre sur l'artefact, pas sur une intuition.** Règle retenue : toute
valeur **numérique ou booléenne** doit porter une référence légale sur son propre nœud ou sur un
ancêtre de sa rubrique (`source`, `reference`, ou `_meta.source`). Balayée sur le paquet togolais :
**112 valeurs, 112 couvertes, 0 orpheline, sans modifier l'artefact** — AC-3 est donc tenable. Mais la
mesure de sensibilité montre que la règle seule est **trop permissive** : sur les 52 nœuds porteurs
d'une `source`, en supprimer une n'est détecté que **36 fois sur 52**. Les 16 muettes incluent les
**quatre exonérations de MFP** — exactement les valeurs de STORY-412. Le schéma doit donc **exiger
nommément** la `source` sur chaque élément des collections (types de taxes, exonérations, échéances,
crédits d'impôt), et le balayage des valeurs orphelines n'est que le **second filet**.

---

## Périmètre

**Inclus**
- `balance-service` — schéma JSON du paquet fiscal (AC-1), garde de complétude + de référence légale
  exécutée par `scripts/referentiels/build.mjs` (AC-2, AC-3), champ de statut de validation publié au
  contrat HTTP (AC-5).
- `docs/referentiels/README-paquet-fiscal.md` — procédure de sourcing (AC-4).

**Hors périmètre**
- ⚠️ **Aligner les copies de `bilan-service` et de `docs/` sur l'artefact autoritaire**, et la garde
  inter-dépôts qui les confronterait. Le trou est réel et nommé ci-dessus (D-493-A) ; le refermer
  change le checksum de `syscohada-revise@2.1`, qui est un **acte de contrat** encadré par le
  `README.md` des référentiels. **Story à ouvrir.**
- Tout paquet fiscal d'un autre pays : cette story livre le gabarit, jamais un pays (les paquets pays
  restent chacun une story avec son sourcing).
- Le barème CNSS, resté incomplet (plafond, branches, SMIG) : consigné, pas comblé.

**🪝 Hooks inertes documentés**
- Le schéma décrit des rubriques **obligatoires** et des rubriques **facultatives** : une rubrique
  qu'un seul pays porte (droits d'accises, taxe sur les conventions d'assurance) reste facultative,
  et le devenir est une décision de packaging, pas de schéma.
- Le vocabulaire du statut de validation est **celui de STORY-491**
  (`certifie` · `amorce` · `a-valider-par-expert`), pas un second vocabulaire parallèle.

---

## Notes

- Voir le référentiel fiscal togolais du dépôt, [[STORY-412]], [[STORY-413]], [[STORY-492]].


---

## Progress Tracking

**Statut : `in_progress`** — démarrée le **2026-09-12** (flux APEX complet, développement compris).

- ① Fiche requalifiée sur mesure du code : trois contenus pour un même paquet, la garde de STORY-491
  hors sujet ici, et la règle d'AC-2 calibrée par balayage (D-493-A, D-493-B, D-493-C ci-dessus).

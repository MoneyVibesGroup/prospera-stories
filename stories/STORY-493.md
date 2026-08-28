# STORY-493 : Packager un paquet fiscal pays est un travail non reproductible — ni schéma, ni garde de complétude, ni procédure

Status: ready-for-dev

**Épic :** EPIC-109 — Paquets fiscaux pays : gabarit, garde et procédure de sourcing
**Service :** `fiscal-service` / `balance-service` (`referentiels/*.json`, `scripts/referentiels/build.mjs`)
**Points :** 8 · **Sprint :** S20
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

## Notes

- Voir le référentiel fiscal togolais du dépôt, [[STORY-412]], [[STORY-413]], [[STORY-492]].

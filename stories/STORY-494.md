# STORY-494 : `smt-togo@1.0` est déclaré et non packagé — la TPE, persona la plus nombreuse du marché, est la seule à recevoir un refus

Status: ready-for-dev

**Épic :** EPIC-109 — Paquets fiscaux pays : gabarit, garde et procédure de sourcing
**Service :** `balance-service` + `bilan-service` (`referentiels/`, `ReferentielRegistry`)
**Points :** 13 · **Sprint :** S20
**Se tire avec :** **STORY-487** — les deux ensemble, ou aucune des deux.
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27 ; décision D-078-3 rouverte.

---

## Le fait

Le Système Minimal de Trésorerie est **le système comptable du petit commerçant** : celui de la
boutique, de l'entreprenant, de la très petite entreprise — la persona que le produit sert par ses
**cahiers de recettes et de dépenses**, et de loin la plus nombreuse du marché visé.

`smt-togo@1.0` est **déclaré et non packagé**. La décision d'origine était assumée et raisonnable :
« le packager reviendrait à inventer du comptable ». Deux choses ont changé depuis :

1. Le produit a construit **toute une chaîne de saisie destinée à cette persona** — cahiers mois par
   mois, OCR, rattachement au plan, catégories de dépenses. Cette chaîne débouche aujourd'hui sur un
   `409 REFERENTIEL_NON_PACKAGE`.
2. **Le produit sait maintenant packager un référentiel sans inventer** : trois artefacts sourcés
   l'ont prouvé (SFD-BCEAO complet, CIMA, zone franche). Et le fichier
   `LIASSE SYSCOHADA REVISE- SMT-Réf 24-01-19.xlsx` est **présent au dépôt** : le gabarit d'états SMT
   existe, sourcé, et n'a jamais été packagé.

⛔ **Conséquence produit aujourd'hui : la petite entreprise est servie en Système Normal.** C'est
disproportionné — le SN exige des états qu'une TPE n'a pas à produire — et c'est faux : son axe dit
`SMT`, sa validation se fait contre `SN` (le défaut que STORY-422 corrige). **Elle est donc à la fois
mal servie et mal validée.**

## Ce que le SMT est, et ce qu'il n'est pas

Le SMT est une **comptabilité de trésorerie** : elle enregistre les encaissements et les
décaissements, pas les engagements. Sa liasse est **simplifiée** — pas de tableau des flux, un jeu de
notes réduit. C'est exactement la forme de dégradation que le moteur sait déjà rendre pour SFD-BCEAO
(`postes: []`, contrôle `NON_APPLICABLE`, `coherent: true`) : **le mécanisme existe, il n'a jamais
servi ici.**

## Critères d'acceptation

- [ ] AC-1 — `smt-togo@1.0` est packagé : plan de comptes, postes, table de passage et gabarit
      d'états, **sourcés** depuis le référentiel SYSCOHADA révisé (partie SMT) et le gabarit de
      liasse SMT présent au dépôt. Aucune donnée inventée ; ce qui n'est pas sourcé n'est pas
      packagé, et son absence est déclarée.
- [ ] AC-2 — `_meta` renseigné selon **STORY-491** : zone `OHADA`, pays, devise, norme source, statut
      `a-valider-par-expert` tant qu'un expert-comptable ne l'a pas relu.
- [ ] AC-3 — Les états non prévus par le SMT rendent `NON_APPLICABLE` et `coherent: true`, **jamais
      une anomalie** — et l'onglet correspondant **reste visible et s'explique**, comme il le fait
      déjà pour SFD-BCEAO. Un onglet qui disparaît est pire qu'un onglet vide.
- [ ] AC-4 — Un dossier `SMT` construit une balance, la valide **contre le plan SMT**, et produit sa
      liasse simplifiée de bout en bout. Vérifié en docker, sur stack neuve.
- [ ] AC-5 — Le **franchissement de seuil** est nommé, pas traité. Une TPE qui dépasse le seuil
      bascule au Système Normal en cours de vie ; l'axe du dossier est daté (STORY-303) et un
      changement d'axe « ne rejoue pas les exercices déjà clos ». Cette story **n'ouvre pas** la
      conversion SMT → SN : elle vérifie que la bascule d'axe ne casse rien, et le documente.

## Conséquences ailleurs

- Sans elle, **STORY-487** transforme un défaut silencieux en blocage bruyant pour la TPE.
- Le prototype cesse d'afficher « TPE (SMT) ⚠ » et son encart de manque backend.

## Notes

- **13 points, pas 8** : le coût n'est pas le packaging, c'est le **sourcing et la relecture
  comptable** du plan et du gabarit. Sous-estimer ce poste est ce qui avait produit la décision
  d'origine.
- Voir [[STORY-078]] (D-078-3), [[STORY-487]], [[STORY-491]], [[STORY-422]].

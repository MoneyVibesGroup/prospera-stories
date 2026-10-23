# STORY-719 : Jours fériés du Togo, versionnés — le délai en heures ouvrées ne court plus un jour férié

Status: done

**Épic :** EPIC-038 — Encaissements hors ligne et validation · **Service :** `paiement-service`
**Points :** 3 · **Rail :** E3 · **Prérequis :** [[STORY-264]] (le délai de validation)
**Réf. :** FR-P34

## Le fait

`CALENDRIER_UEMOA.joursFeries` valait `[]`, par un choix écrit : « un calendrier férié se périme
chaque année ». Conséquence : une remise d'espèces reçue la veille du 1er mai voyait son délai courir
le 1er mai, et l'écart nommait un commercial pour un jour chômé.

## Critères d'acceptation

- [x] AC-1 — Un **référentiel versionné** (`VERSION_DES_JOURS_FERIES`) porte les fériés ; la version
      voyage avec le calendrier en usage.
- [x] AC-2 — Il **calcule** chaque année depuis ses règles, au lieu de s'écrire en dur : dates fixes
      (1er janvier, 27 avril, 1er mai, 21 juin, 15 août, 1er novembre, 25 décembre) et fêtes
      chrétiennes mobiles depuis Pâques (lundi de Pâques, Ascension, lundi de Pentecôte), 2020→2040.
- [x] AC-3 — ⛔ **Rien d'inventé** : les fêtes musulmanes n'entrent qu'une fois décrétées, année par
      année (`FERIES_DECRETES`).
- [x] AC-4 — Le délai saute le férié : reçu jeudi 30 avril 2026 après la fermeture, 9 h ouvrées
      s'épuisent le lundi 4 mai à 17:00 (contre-preuve : le 1er mai sans fériés).

## Livraison — 2026-10-23

`MNV-719` (`18f075d`) sur `origin/dev` (`0e87d96`). 4 104 tests unitaires, lint 0. Pâques vérifiée
contre cinq dates connues (2024 → 2038).

⛔ La garde des montants refuse toute division par cent : le siècle de l'algorithme de Pâques est
nommé (`ANS_PAR_SIECLE`) — la garde n'a pas été desserrée.

## Points ouverts — à trancher par le PO

1. **Aïd el-Fitr et Tabaski** : à saisir chaque année depuis le décret (`FERIES_DECRETES`). Tant
   qu'ils manquent, le délai les compte, comme avant.
2. **Le 13 janvier** (fête de la Libération) : chômé ou non ? Il n'est pas dans la liste.
3. **Un seul pays** : le service ne sait pas de quel pays vient une déclaration ; le calendrier est
   celui du Togo pour tous. Un calendrier par pays suppose de porter le pays sur la déclaration
   (ou sur l'organisation — voir [[STORY-720]]).

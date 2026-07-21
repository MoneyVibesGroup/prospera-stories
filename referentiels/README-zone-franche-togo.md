# Référence Zone Franche Togo (régime dérogatoire) — extraite des sources officielles

**Nature :** la « Zone Franche » togolaise (statut d'Entreprise Franche, SAZOF) est un **régime FISCAL et
douanier dérogatoire**, **pas un plan comptable distinct**. Une entreprise franche tient sa comptabilité
selon le **SYSCOHADA révisé** (Système Normal) comme toute société commerciale OHADA ; ce qui change, ce sont
les **exonérations et taux réduits** (IS, TVA, droits de douane, taxe sur dividendes, patente…).

**Sources :**
- Manuel des régimes économiques dérogatoires et de la loi sur la zone franche (Agence de promotion des
  investissements, Togo) : https://investissement.gouv.tg/wp-content/uploads/2025/05/Manuel2024V4-2.pdf
- Zone franche togolaise et ses facilités (MCA-Togo) : http://www.mcatogo.org (rubrique zone franche)
- Impôt sur les sociétés au Togo (Office Togolais des Recettes / Togo First) :
  https://www.togofirst.com/fr/fiscalite/2310-8770-togo-tout-savoir-sur-le-paiement-de-l-impot-sur-les-societes-is
- Code Général des Impôts (OTR) : https://www.otr.tg — Cadre légal d'origine : loi n°89-14 instituant le statut
  de zone franche de transformation pour l'exportation (et textes modificatifs ultérieurs).

## Avantages fiscaux — barème dégressif (entreprise franche)
| Poste fiscal | Régime zone franche | Droit commun (rappel) |
|---|---|---|
| **Impôt sur les sociétés (IS)** | **0 %** années 1→5 · **8 %** années 6→10 · **10 %** années 11→20 · **20 %** dès l'année 21 | 27 % (taux normal Togo) |
| **Taxe sur les dividendes** | **Exonération totale** années 1→5 · **50 % du taux normal** années 6→10 · droit commun ensuite | taux normal |
| **TVA** | Exonération sur travaux et services réalisés pour le compte de l'entreprise franche | 18 % |
| **Droits de douane / fiscalité de porte** | Exonération des droits d'entrée et de la taxe statistique sur les équipements ; **−50 %** sur véhicules utilitaires | tarif commun |
| **Impôts fonciers / patente / taxes locales** | Exonérations selon convention d'agrément | droit commun |

> Variantes régionales (incitation à la décentralisation) : régions **Plateaux/Centrale** → exonération d'IS
> 10 ans puis barème progressif 0→20 % dès l'an 11 ; régions **Kara/Savanes** → exonération 15 ans puis barème
> progressif dès l'an 16. (À paramétrer dans le paquet fiscal si le vertical le requiert.)

## Conséquence pour le moteur `bilan-service`
- **Présentation comptable** (Bilan, Compte de résultat, TFT, notes) = **identique au SYSCOHADA révisé** : mêmes
  plan de comptes, mêmes postes, même table de passage. Le régime zone franche **ne modifie aucun état de synthèse**.
- Ce qui diffère est **fiscal** : porté par le **paquet fiscal** (`paquetFiscal`) attaché au référentiel — barème
  IS dégressif par ancienneté, exonérations, taux de dividendes — consommé plus tard par le **prévisionnel**
  (EPIC-013 : impôt prévisionnel) et d'éventuels contrôles de cohérence fiscale, **pas** par la liasse d'états.

## Cadrage de l'amorce `zone-franche-togo@1.0`
Sur décision de l'utilisateur, la zone franche est packagée comme **référentiel pluggable distinct** (et non
comme simple surcouche fiscale de `syscohada-revise`). Concrètement :
- **plan / postes / table de passage** = **réutilisent les sources SYSCOHADA révisé** (aucune donnée comptable
  inventée : l'assiette comptable d'une entreprise franche EST le SYSCOHADA) ;
- **`paquetFiscal`** = **propre à la zone franche** (barème dégressif ci-dessus, `pays=TG`, `regime=zone-franche`),
  ce qui distingue ce référentiel du SYSCOHADA de droit commun.
Statut **« barème à valider / actualiser par un fiscaliste »** (les taux et la durée des paliers évoluent avec
les lois de finances). Le champ `paquetFiscal` est **optionnel pour le moteur d'états** (non requis par la liasse).

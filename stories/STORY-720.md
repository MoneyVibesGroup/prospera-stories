# STORY-720 : Délai de validation par organisation — elle peut le raccourcir, jamais l'allonger

Status: done

**Épic :** EPIC-038 · **Service :** `paiement-service` · **Points :** 3 · **Rail :** E3
**Prérequis :** [[STORY-264]] (le délai de validation), [[STORY-719]] (les fériés)
**Réf. :** FR-P34 (« 48 heures ouvrées **par défaut** »), AD-6

## Le fait

`encaissement.delaiValidationHeuresOuvrees` était un réglage du **service** : toutes les organisations
attendaient 48 heures ouvrées avant qu'une remise d'espèces non validée ne devienne un écart — y
compris celles qui veulent le savoir le soir même.

## L'arbitrage

⛔ **AD-6 : un réglage d'organisation ne peut que RETRANCHER à ce que le service autorise.** Le délai
est le temps pendant lequel des espèces restent entre les mains d'un commercial avant qu'un écart ne
le nomme : l'allonger affaiblirait un contrôle posé pour tous. L'organisation peut donc le
**raccourcir**, de 1 heure au délai du service ; au-delà, le réglage est **refusé**, nommément.

## Critères d'acceptation

- [x] AC-1 — Une organisation règle son délai (`PUT /v1/reglages-d-encaissement`), sous le droit de
      valider ; elle le relit avec le délai du service (`GET`).
- [x] AC-2 — ⛔ Au-delà du délai du service, sous 1 heure ou non entier : refus
      `DELAI_DE_VALIDATION_HORS_BORNES`.
- [x] AC-3 — Le défaut vit dans l'**absence** de document ; `null` rend la main au service ; un
      réglage devenu trop long après une baisse du service est ramené au plafond à chaque lecture.
- [x] AC-4 — La déclaration d'un encaissement pose sa surveillance au délai de **l'organisation** qui
      déclare.
- [x] AC-5 — Le réglage est **audité** (chaîne neuve `REGLAGES_ENCAISSEMENT`), valeur retenue et
      origine (organisation ou service).

## Livraison — 2026-10-23

`MNV-720` (`7e7cb80`) sur `origin/dev` (`0e87d96`). 4 104 tests unitaires, 34 e2e, lint 0.

- ⚡ Un chemin à lui (`reglages-d-encaissement`) : le contrôleur des encaissements porte des routes à
  paramètre, et un littéral déclaré après un paramètre est une route morte.
- La garde de la piste d'audit (inventaire **fermé** des écritures) a rougi, à raison : le nouveau cas
  d'usage y est inscrit.

### Point ouvert

- Le calendrier (fériés, [[STORY-719]]) reste celui du service : un calendrier par organisation
  — ou par pays — se rangera ici le jour où il sera demandé.

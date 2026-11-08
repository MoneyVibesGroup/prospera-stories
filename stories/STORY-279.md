# STORY-279 : `platform-catalog-service` consomme `paiement.abonnement.*`

Status: done (octroi) — `impayee` / `regularise` à arbitrer, voir « Ce qui reste »

**Épic :** EPIC-041 — Abonnements Prospera et entitlements par événement
**Service :** `platform-catalog-service` · **Points :** 5 · **Branche :** `MNV-279`
**Producteur :** STORY-278 (livrée) · **Suite :** STORY-609 (empilée sur cette branche)
**Fiche :** écrite à la livraison (2026-11-07) — elle n'existait pas ; le tracker portait l'entrée.

---

## Le fait

⚡⚡ **C'est ce qui remplace la décision C8, ouverte depuis STORY-034.** Le paiement ne fait aucun
`PUT` chez le catalogue — ni jeton de service, ni mTLS. Il **publie** qu'une échéance est
intégralement réglée ; le catalogue **consomme**, et reste l'unique écrivain de l'entitlement (P8).
Le prix payé est un octroi éventuellement cohérent, de quelques secondes.

Avant cette story, le catalogue n'avait **aucun** consommateur Kafka.

## Critères d'acceptation

- [x] AC-1 — `paiement.abonnement.echeance.encaissee` **ouvre** le droit de l'organisation
      `organisationAbonnee` — jamais `orgId`, qui est Money Vibes, l'émettrice. Le droit est créé
      sur la version ACTIVE la plus haute du module (semver, pas l'ordre lexical) ; `source :
      abonnement:<contrat>`.
- [x] AC-2 — **Une transaction** : la trace d'idempotence (`eventId`), l'entitlement et son
      `entitlement.changed` (outbox). Un message relivré n'écrit rien.
- [x] AC-3 — Un droit **révoqué** ou **suspendu** n'est pas rouvert par un paiement : chacun a son
      remède (une décision ; la régularisation).
- [x] AC-4 — Un module inconnu, retiré de l'offre ou sans version active est un **écart nommé**,
      journalisé ; le message est traité quand même (le rejouer ne créera pas le module).
- [x] AC-5 — ⛔ **Un message illisible est écarté, jamais levé** (« poison pill ») ; une panne de base
      lève, et kafkajs rejoue.
- [x] AC-6 — Le consommateur (`platform-catalog-abonnements`, `fromBeginning`) **se relance seul**
      après un `CRASH` (délai doublé, plafond 30 s) : un consommateur peut mourir dans un conteneur
      `healthy`.
- [x] AC-7 — Les codes de module se traduisent : `PI_SPI` (paiement) ↔ `pi-spi` (catalogue).

## Ce qui reste — à arbitrer par le PO

`paiement.abonnement.impayee` et `paiement.abonnement.regularise` sont publiés (STORY-280, 282)
mais **pas consommés**. La question n'est pas technique : AD-13 dit que l'impayé fait
« **révoquer** » ; STORY-609 distingue expiré, suspendu et révoqué, parce qu'ils ne se soignent
pas pareil. Suspendre (et lever à la régularisation) ou révoquer : c'est un choix de produit, pas à
faire en silence. ⚡ Avec 609, un impayé ferme **déjà** le droit à son échéance, sans aucun
consommateur : le seul effet manquant est une coupure **avant** l'échéance du droit.

## Ce que la livraison a appris

- ⛔⛔ **Aucun test ne montait `AppModule`.** Les e2e assemblent leurs propres modules, les unitaires
  construisent les services à la main : un modèle Mongoose oublié passait toute la suite au vert.
  `app-cablage.invariant.spec.ts` résout désormais tout le graphe en `preview` (sans connexion) —
  et **rougit** quand on retire le modèle de la trace d'idempotence (vérifié par mutation).
- ⚡ La convention de disponibilité de `prospera-recette` attend désormais ce groupe `Stable`.

## Preuves

`MNV-279` (`f7b1af8`) : 899 unitaires, 202 e2e, lint propre. Recette STORY-631 AC-7.

## Notes

Voir [[STORY-278]], [[STORY-609]], [[STORY-631]], [[STORY-280]], [[STORY-282]].

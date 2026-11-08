# STORY-726 : La cloche de l'échéance suivante, déposée par le paiement

Status: done

**Services :** `paiement-service` (dépose) · `notification-service` (périmètre) · **Points :** 3
**Branches :** `MNV-726` dans les deux dépôts (paiement : empilée sur `MNV-725`)
**Origine :** point légué par STORY-612 (« `paiement-service` n'appelle encore rien ») ; AC-8 de
STORY-631.

---

## Le fait

STORY-612 a livré, côté notification, quatre modèles de cloche d'abonnement (échéance proche,
impayé, suspension, rétablissement), leur canal `in-app` et une boîte qui s'ouvre même suspendue.
Personne ne les déposait. Cette story dépose le premier : **l'échéance suivante**, au moment où le
cabinet vient de régler la précédente.

⚡ **Pourquoi à l'encaissement.** C'est l'instant où le service sait les deux choses à la fois : le
cabinet a payé (solde intégral, la règle de `echeance.encaissee`, STORY-278), et la date de la
période suivante (le contrat a avancé quand l'échéance a été produite). Le message n'est pas une
relance : c'est « voici la suite ».

## Critères d'acceptation

- [x] AC-1 — L'encaissement qui solde une échéance d'abonnement enfile une cloche **dans sa
      transaction** (`cloches_sortantes`, clé primaire `ECHEANCE_PROCHE:<contrat>:<date>`), sous la
      condition de `echeance.encaissee` plus une : la suite existe et suit l'échéance réglée. Un
      versement partiel, une créance ordinaire, un contrat clos ou qui n'a pas avancé : rien.
- [x] AC-2 — `RelaisDesCloches` la remet par la **route directe** (`POST /service/envois`, canal
      `in-app`, clé `abonnement-echeance-proche`), sous l'organisation **du cabinet** — une cloche se
      range dans le fil de l'organisation qui la lit. Clé d'idempotence stable : un réessai rend le
      même envoi.
- [x] AC-3 — ⛔ Ni lien, ni montant, ni jeton (612, AC-3) : deux variables, `dateEcheance` et
      `joursRestants` (comptés à la remise, jamais négatifs).
- [x] AC-4 — Le destinataire est le **fondateur** du cabinet (`createdByUserId` de
      `identity.org.created`, désormais projeté par le paiement). Une organisation projetée avant
      726 n'a pas de fondateur connu : la cloche est **écartée** `SANS_FONDATEUR`, sans tentative.
- [x] AC-5 — Côté notification, `abonnement-echeance-proche` entre au périmètre de
      `paiement-service`, **et lui seul** : impayé, suspension et rétablissement restent fermés
      (refusés avant le périmètre, `422 CHEMIN_D_ENTREE_INADAPTE`).

## Décisions prises en cours de route (à confirmer par le PO)

- ⚠️ **Le fondateur, pas « tous les membres habilités à voir la facturation ».** C'est ce que 612
  recommandait par défaut, mais le paiement ne projette aucune adhésion : construire cette liste ici
  aurait importé un annuaire dans le paiement. Le fondateur est le plus petit destinataire juste ;
  l'élargir se fera là où les membres sont connus.
- ⚠️ **La route directe, pas le bus** — la recommandation de 612, suivie : `EVENEMENTS_DECLENCHEURS`
  reste fermée.

## Ce qui ne fait PAS partie de cette story

- Les trois autres cloches (impayé, suspension, rétablissement) et l'ordre préavis → suspension
  (AC-5 de 612) : elles ont besoin de leurs déclencheurs (rail C, STORY-280/282).

## Ce que la livraison a appris

- ⛔ **Un paramètre de constructeur sans jeton Nest fait tomber le démarrage.** La première version
  du relais recevait une horloge en paramètre facultatif : Nest l'aurait résolu comme une dépendance
  (`UnknownDependenciesException`, gate Docker du 2026-09-07). Retiré avant tout commit ; les tests
  figent l'heure avec les faux minuteurs de jest.
- ⚡ **Un refus à 422 n'est pas un 403.** L'e2e attendait `403 APPELANT_HORS_PERIMETRE` pour
  `abonnement-impaye` ; la route le refuse plus tôt, parce que ce n'est pas un message de service.
  L'attente a été corrigée, pas la route.
- ⚠️ La garde « ne projette NI slug, NI créateur » de la projection d'identité a été **réécrite**,
  pas contournée : le besoin du créateur est désormais constaté.

## Preuves

Paiement `MNV-726` : 4 352 unitaires verts ; e2e 27/27 suites (340 tests) en série ; câblage
(`app-cablage.invariant.spec.ts`) vert. Notification `MNV-726` (`d7a0bba`) : 3 624 unitaires,
275 e2e. Recette STORY-631 AC-8 sur la vraie pile.

## Notes

Voir [[STORY-612]], [[STORY-278]], [[STORY-648]] (le relais jumeau), [[STORY-631]], [[STORY-725]].

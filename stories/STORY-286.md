# STORY-286 : Console d'exploitation en lecture seule — demandes, notifications refusées, écarts de rapprochement

Status: done

**Épic :** EPIC-042 — Exploitation, conformité et recette
**Service :** `paiement-service` · surface consommée par `frontend-admin-panel` ([[AP-14]])
**Points :** 3 · **Rail :** E1 (Rail E · paiement-service)
**Prérequis :** [[STORY-289]] (la plateforme est une organisation comme une autre, droit de portée
plateforme), [[STORY-270]] (la cascade de rapprochement), [[STORY-674]] (les sorties au relevé)
**Réf. PRD :** FR-P63 · AD-6, AD-16, AD-17

---

## User story

En tant qu'**exploitant de la plateforme Money Vibes**,
je veux **suivre les demandes d'une organisation, voir les notifications de fournisseur que le
service refuse et les écarts de rapprochement d'un compte**,
afin d'**intervenir sur un incident sans pouvoir agir à la place de l'organisation**.

## Le fait

FR-P63 et l'épic listaient **quatre** usages : suivre les demandes, consulter les notifications
rejetées, **réacheminer** une demande, consulter les écarts. Le Rail E (2026-10) l'a resserrée en
**lecture seule** : trois usages. Un réacheminement est un geste de l'organisation, qui obéit à AD-6
par ses propres routes — la console n'a pas à en être un second chemin.

Deux trous rendaient la console impossible jusqu'ici :

1. **Les notifications refusées n'étaient rangées nulle part** : une ligne de journal applicatif,
   et c'est tout. Les ranger telles quelles reviendrait à offrir une collection que n'importe quel
   inconnu remplit depuis une route publique.
2. **Les écarts ne se lisaient qu'en rapprochant** : la confrontation vivait dans
   `RapprocherLeReleve`, qui **applique** les appariements certains. Donner ce cas d'usage à la
   console l'aurait rendue capable d'écrire chez une organisation cliente.

## Critères d'acceptation

- [x] AC-1 — ⛔⛔ **Trois lectures, aucune route d'écriture.** Le contrôleur n'a que des `GET` ;
      une garde le prouve, contre-preuve comprise. Il n'existe ni relance, ni facturation, ni
      écriture comptable, ni réacheminement — il n'y a rien à cacher.
- [x] AC-2 — ⛔ **Ce que la console reçoit ne sait que lire** (absence d'injection) : ni le service
      des demandes (qui émet et révoque), ni `RapprocherLeReleve`, ni le registre des refus.
- [x] AC-3 — **Réservée à la plateforme** : `@RequiresPaiementAccess()`, le droit
      `paiement:exploitation:consulter` (portée plateforme, attribuable par l'IdP), puis
      `PorteDeLaPlateforme` — le `404` commun, jamais un `403`, pour toute autre organisation.
- [x] AC-4 — **Le cloisonnement s'applique comme partout** : l'organisation regardée est nommée
      dans le chemin et filtre chaque requête ; aucune liste de demandes « de tout le parc ».
- [x] AC-5 — ⛔ **Moins que ce que voit l'organisation** : ni le payeur d'une demande (nom,
      téléphone, courriel, adresse de paiement), ni le libellé d'une ligne de relevé.
- [x] AC-6 — ⚡ **Les notifications refusées sont comptées, bornées, et sans corps** : par compte
      **existant**, motif et jour ; un refus sans compte résolu ne crée rien ; durée de vie de
      90 jours depuis le dernier refus ; un incident de comptage ne change jamais la réponse au
      fournisseur.
- [x] AC-7 — **Les écarts sont ceux que voit l'organisation**, par la même confrontation, sans rien
      appliquer — écarts de la cascade et écarts de sortie ([[STORY-674]]).

## Surface

| Route | Ce qu'elle rend |
|---|---|
| `GET /v1/exploitation/organisations/:organisationId/demandes?etat=&limite=` | id, créance, montant, devise, état, module appelant, dates — jamais le payeur |
| `GET /v1/exploitation/notifications-refusees?organisationId=&depuis=&limite=` | par compte, motif et jour : nombre, premier et dernier refus (7 jours par défaut) |
| `GET /v1/exploitation/organisations/:organisationId/comptes/:compteId/ecarts?depuis=&jusqua=` | écarts (sans libellé), nombre de propositions et de certains non appliqués, totaux, écarts de sortie |

## Ce que cette story ne fait pas

- Elle **ne réachemine pas** (voir « Le fait »).
- Elle **n'inscrit pas** les refus dans la chaîne d'audit d'un compte — c'est l'arbitrage de la
  story « Audit des notifications rejetées » (Rail E3).
- Elle **ne livre pas l'écran** : c'est [[AP-14]], dont la fiche décrit encore quatre panneaux et
  doit être réalignée sur trois.

## Livraison — 2026-10-23

**Code :** `prospera-paiement-service`, branche `MNV-286` (`99cd798`), basée sur `origin/dev`
(`b1150a0`). 4 062 tests unitaires (299 suites), 78 e2e (notifications, points de vente, relevés),
lint 0. Aucune conformité Docker jouée (règle « Docker à la demande »).

- **Module `exploitation`** : `ExploitationController` (trois `GET`), `DemandesALExploitation` et
  `RefusALExploitation` (un modèle, `lister`), et `ConfrontationDuReleve` importée de
  `RapprochementModule`.
- **`ConfrontationDuReleve`** : extraite de `RapprocherLeReleve`, qui l'injecte désormais — une
  seule confrontation, pour l'organisation qui rapproche et pour l'exploitant qui regarde.
- **`RegistreDesRefus`** (`notifications_refusees`) : clef `<compte>|<motif>|<jour UTC>`, `$inc`
  en upsert, `$min`/`$max` des instants, TTL sur `dernierLe`. La réception retient le compte trouvé
  **avant** la vérification : c'est lui, et non le chemin écrit par l'appelant, qui dit à quelle
  organisation compter.
- **Droit n° 9** : `paiement:exploitation:consulter`, distinct de l'administration des
  fournisseurs — qui suit les incidents n'a pas à fermer un marché.

### Leçons

- ⛔ **La garde de la piste d'audit cherche la FORME `.consigner(`** : la méthode du nouveau
  registre s'appelait ainsi, et la garde a rougi. Elle accrochait une forme, pas une capacité ; le
  remède a été de nommer le geste pour ce qu'il est (`compter`) plutôt que d'élargir la garde.
- ⚡ Ré-enregistrer un modèle dans un second module (`DemandeDoc`) est sans risque :
  `@nestjs/mongoose` reprend `connection.models[nom]` s'il existe.

### Points ouverts

1. **Ajouter `paiement:exploitation:consulter` au catalogue de l'IdP** (`auth-service`, quatre
   copies à l'octet près) — un geste hors de ce dépôt, comme pour
   `paiement:fournisseur:administrer`.
2. **Réaligner [[AP-14]]** : trois panneaux en lecture, pas quatre actions.
3. La liste des refus « tout le parc » est triée par l'index de durée de vie ; au-delà de quelques
   milliers de comptes harcelés, une pagination par curseur sera à ajouter.

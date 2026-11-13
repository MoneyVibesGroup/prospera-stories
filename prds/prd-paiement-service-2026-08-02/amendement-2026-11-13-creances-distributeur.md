# Amendement du 2026-11-13 : les Créances du distributeur, le crédit du tiers et le versement au freelance

**Statut : ✅ VALIDÉ par le PO.** Le fond a été tranché dans le PRD distributeur le 2026-11-12 (FR-247, FR-248, FR-98). Les noms des faits ont été tranchés le 2026-11-13, lors de la 21e séance de la salle, points 1 et 2. Il faut l'appliquer à `prd.md` quand on écrira les stories de `paiement` pour le distributeur.

**Date :** 2026-11-13 · **Demandé par :** le PRD distributeur (`prds/prd-distributeur-2026-11-12/prd.md`, FR-247, FR-248, FR-97, FR-98, FR-187, annexe A.17 point 11, annexe B) · **Rédigé pour :** Dev A et Dev B, qui écriront les stories · **Voisin :** l'amendement du même jour sur les échéances de prêt (`amendement-2026-11-13-echeances-de-pret.md`). Les deux amendements se complètent sans se contredire.

---

## 1. Pourquoi un amendement

Le PRD `paiement` du 2026-08-02 tient une **créance projetée** (FR-P13). C'est une référence externe dont il maintient le solde encaissé ; la facture appartient au module appelant (Q10). Le PRD distributeur va plus loin : `paiement` devient le **propriétaire unique** de la Créance (FR-247), et `facturation` ne tient aucun solde. Il lui confie aussi un objet nouveau, le **crédit du tiers** (FR-248), et le versement de la commission d'un freelance (FR-98). L'annexe A.17 (point 11) demande d'écrire cet amendement avant de valider le lot, parce que `facturation`, `recouvrement` et `commande` en dépendent.

## 2. La Créance devient un registre (FR-P13 étendue)

La créance projetée garde ses champs : référence, montant d'origine, devise, échéance et libellé. Elle en reçoit quatre de plus :

| Champ | Valeurs | Remarque |
|---|---|---|
| **tiers** | point de vente, freelance envers la société, membre d'une IMF, assuré | celui qui doit |
| **source** | `FACTURE` (ouverte ici) ; `ECHEANCE_DE_PRET` (ouverte par l'amendement des échéances de prêt) ; `PRIME` (réservée à l'assurance) | une source est un type enregistré par un module ; elle se reconnaît par sa `reference` |
| **périmètre** | l'organisation, ou l'**espace propre d'un freelance** (ses créances sur ses détaillants) | une créance du périmètre d'un freelance n'apparaît dans **aucune** balance de la société (FR-C29) |
| **composantes** | principal seul pour `FACTURE` ; principal, intérêt, pénalité et frais pour les autres sources | |

Ce que `paiement` consomme pour la source `FACTURE` :

- `facturation.facture.emise@1` **ouvre** la Créance au montant TTC. Si l'émetteur est un freelance (FR-224), elle s'ouvre dans son périmètre.
- `facturation.avoir.emis@1` **réduit** la Créance du montant de l'avoir. Sur une facture déjà payée, ou pour la part qui dépasse le reste dû, l'avoir crée un crédit du tiers (§3).
- `facturation.facture.reprise@1` ouvre la Créance au **reste dû repris** de l'ancien logiciel (Sage), avec `origine = REPRISE` (FR-216).

`facturation` ne contient aucun champ de reste dû, de montant encaissé ou de statut payé. La balance clients, la balance âgée et le recouvrement lisent le même registre (contrat de lecture `paiement.creance@1`).

## 3. Le crédit du tiers (FR-248)

- Un encaissement qui n'a pas (encore) de Créance devient un **crédit du tiers** : avance, acompte ou trop-perçu. Un avoir sur une facture déjà payée en crée un aussi.
- Un paiement déjà reçu chez le fournisseur (PI-SPI, FedaPay) n'est **jamais refusé**, puisque l'argent est déjà là. Seul un encaissement **déclaré** (espèces, virement) au-dessus du reste dû peut être refusé, avec `PAIEMENT_SUPERIEUR_AU_RESTE_DU`, ou confirmé explicitement.
- Le crédit est **imputé** sur la Créance désignée, sinon sur la Créance échue la plus ancienne. L'imputation est tracée au journal. La facture garde son montant ; seule la Créance baisse.
- Le crédit peut être **remboursé** par un ordre de paiement (amendement du 2026-09-21). Il faut deux personnes : celle qui prépare n'est pas celle qui valide (FR-P66).
- Le crédit du tiers réduit l'**encours** (FR-187). L'encours se calcule chez `commande` et `pdv` : créances ouvertes, plus commandes validées non facturées, moins crédit du tiers. Ces deux modules lisent les faits ci-dessous.

## 4. Le freelance : le dû à la société et le versement de la commission (FR-97, FR-98)

- **Le dû du freelance** est une Créance dont le tiers est le freelance, ouverte au prix société à partir du relevé de vente. Il la règle comme tout client, par PI-SPI, FedaPay, espèces ou virement. ⚠️ Le relevé de vente n'a pas encore de fait nommé chez `facturation`. La story du relevé le fixera ; d'ici là, cette ouverture n'a pas de source.
- **La commission** passe de `ACQUISE` à `VALIDEE` dans le module `freelance` (DAF), puis à `VERSEE` par un **ordre de versement** de `paiement`. Cet ordre est un ordre de paiement au sens de l'amendement du 2026-09-21 : il part du compte de l'organisation, sous ses propres identifiants, vers le freelance qu'elle désigne. Money Vibes ne détient jamais les fonds (NFR-1). Celui qui prépare l'ordre n'est pas celui qui le valide.
- Le versement de la commission et le règlement du dû sont **deux mouvements distincts**. Une compensation entre les deux est une décision du DAF, tracée.
- **Le compteur de l'add-on** : `paiement` lit `freelance.freelance.active@1` pour facturer l'abonnement Prospera au nombre de freelances actifs (D-24). Cette facturation est celle de la plateforme, pas le module vendu au client.

## 5. Les faits

**Règle de nommage.** Les topics déjà codés gardent leur graphie sans `@1`, comme le prévoit la clause C5 amendée : les renommer casserait les consommateurs en place. Les faits **nouveaux** portent `@1`.

| Fait | Nouveau ? | Contenu | Lu par |
|---|---|---|---|
| `paiement.creance.materialisee`, `.soldee`, `.cloturee` | non | ouverture, solde, clôture | `facturation` (soldée) |
| `paiement.creance.changed@1` | **oui** | **état absolu** : tiers, source, périmètre, composantes, reste dû, `montantExigible`, `lueLe`, échéance, ancienneté | `commande`, `facturation`, `freelance`, `recouvrement`, `credit`, `risque-par` |
| `paiement.credit-tiers.changed@1` | **oui** | solde, origine, imputations | `commande` (encours), `pdv` |
| `paiement.encaissement.changed@1` | **oui** | état absolu d'un encaissement | microfinance (spine IMF, AD-9) |
| `paiement.ordre-versement.changed@1` | **oui** | `ordreId`, état EN_COURS, EXECUTE, REJETE ou INCONNU, référence du fournisseur | `freelance` (EXECUTE ⇒ commission `VERSEE`) |
| `paiement.ordre-decaissement.changed@1`, `paiement.relecture.demandee@1` | **oui** | voir la spine de la microfinance (AD-5, AD-6) | `credit`, `coeur-sfd` |

**Faits d'état et faits fins.** Les faits fins existants restent. Le fait d'état `.changed@1` donne l'état complet à chaque changement, si bien qu'un consommateur n'a pas besoin de rejouer une suite de faits fins pour connaître un solde. C'est le motif de `credit.dossier.changed@1` à côté de `credit.dossier.accorde@1`.

**Sorties d'argent.** Chaque nature d'ordre a son fait d'état, `paiement.ordre-<nature>.changed@1`, selon le motif fixé par la spine de la microfinance (`ordre-decaissement`). Les ordres génériques de l'amendement du 2026-09-21 (fournisseurs, remboursement d'un crédit du tiers) ne publient encore aucun fait. `paiement.ordre-paiement.changed@1` sera créé le jour où un module en aura besoin.

## 6. Les droits

Deux droits de tenant s'ajoutent aux sept existants (`TenantPermission`, auth-service) :

| Droit | Rôles par défaut (PRD distributeur, annexe B) |
|---|---|
| `paiement:creance:consulter` | DG, DC, RESP_VENTES, SUPERVISEUR, DAF, COMPTABLE, CONTROLE_GESTION, RECOUVREMENT ; COMMERCIAL et FREELANCE pour leur portefeuille. Le serveur applique la portée. |
| `paiement:credit-tiers:imputer` | COMPTABLE, DAF |

Préparer et valider un ordre de versement réutilise la paire de droits de FR-P60 (`demande:emettre` pour préparer, `encaissement:valider` pour valider), comme les autres ordres. Des droits `paiement:ordre:*` plus lisibles restent [À CONFIRMER].

## 7. Ce qui n'est pas dans cet amendement

- Le fait du **relevé de vente** du freelance, chez `facturation` (§4).
- Le domaine d'échange `paiement.creances`, déclaré pour plus tard avec Connecteurs, hors février (annexe A.17).
- Le décaissement **Mobile Money sortant** : voir l'amendement des échéances de prêt, §2.4.
- Le fait des ordres génériques (§5).

## 8. Critères de recette

1. Une facture de 507 400 FCFA émise ouvre en moins de 5 secondes une Créance de 507 400 FCFA. Un encaissement de 200 000 FCFA la ramène à 307 400 FCFA, et la facture, le dossier de recouvrement et la balance âgée affichent 307 400 FCFA. Aucun test n'exige « le même instant » entre deux services.
2. Un avoir émis réduit la Créance de son montant. Sur une facture déjà payée, il crée un crédit du tiers du même montant.
3. Un paiement par lien de 520 000 FCFA sur une Créance de 507 400 FCFA solde la Créance et crée un crédit du tiers de 12 600 FCFA. Rien n'est refusé. À la facture suivante du même client, la Créance est réduite de 12 600 FCFA par l'imputation, et le journal le dit.
4. Un acompte de 100 000 FCFA reçu avant toute facture est un crédit du tiers, imputé sur la première facture du client.
5. Un encaissement déclaré de 400 000 FCFA sur un reste dû de 307 400 FCFA est refusé avec `PAIEMENT_SUPERIEUR_AU_RESTE_DU`, sauf confirmation explicite.
6. Une Créance du périmètre d'un freelance n'apparaît dans aucune balance de la société, et la société n'en lit aucun montant.
7. Une commission de 700 FCFA validée par le DAF passe à `VERSEE` seulement sur `paiement.ordre-versement.changed@1` à l'état EXECUTE. Un ordre préparé par le comptable n'est jamais validé par le comptable lui-même.
8. Un ordre de versement rejeté laisse la commission à `VALIDEE`. Rien n'est versé deux fois (FR-P68 durci : un ordre rejeté est terminal ; il faut une nouvelle validation pour un nouvel ordre).
9. Une Créance de source `FACTURE` garde la règle de rattachement actuelle (FR-P38). Le test « facture du distributeur » de l'amendement des échéances de prêt reste vert.

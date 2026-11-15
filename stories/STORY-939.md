# STORY-939 : le read-model de manifestes de `paiement`

Status: done

**Complexité :** moyenne (un consommateur, un read-model, un résolveur copié, une route, une règle de vente)

**Épics :** EPIC-143 (les manifestes et la résolution des dépendances)
**Dépôts :** `MoneyVibesGroup/prospera-paiement-service` (PR #118), `MoneyVibesGroup/prospera-stories` (ticket pour D)
**Plage :** groupe B, n° 10 du lot de B (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §4), dernière story du lot.

---

## Pourquoi

« La vente résout une offre comme la console : ce qui est ajouté, et pourquoi ; un module sans manifeste n'est ni
installable ni vendable » (EPIC-143 ; FR-1, FR-2, FR-37). Le catalogue publie l'état absolu de chaque version et de son
manifeste sur `catalogue.manifeste.publie` (STORY-935), et le résolveur des dépendances dures avec ses cas de contrat
(STORY-934). Paiement, qui vend, doit lire les mêmes manifestes et résoudre avec le même code.

## Ce qui doit être vrai à la fin (plan §4, n° 10)

| Exigence | Fait |
|---|---|
| `paiement` tient un read-model des manifestes publiés | oui : collection `manifestes_catalogue`, 46 documents en pile |
| Il résout les dépendances comme la console | oui : copie épinglée du résolveur du catalogue, cas du contrat rejoués côté paiement |
| Un module sans manifeste n'est pas vendable | oui : 422 `MODULE_NON_VENDABLE` à l'engagement d'un abonnement |
| Les écrans de la console font l'objet d'un ticket pour D | oui : `tickets/TICKET-FRONTEND-console-manifestes.md` |

## Ce qui a été livré

1. **Le consommateur** de `catalogue.manifeste.publie` (topic compacté), groupe `paiement-manifestes`
   (`KAFKA_MANIFESTES_GROUP_ID`). Il est supervisé comme les cinq autres consommateurs du service (STORY-937).
2. **Le read-model** `manifestes_catalogue` :
   - une ligne par version, clé `<module>@<version>` ;
   - le statut de la version (`ACTIVE`, `DEPRECATED`, `RETIRED`) et les dépendances dures avec leur raison ;
   - l'état est absolu : un message s'applique seulement s'il est plus récent (`publieLe`), donc le rejeu du topic
     compacté ne recule jamais.
3. **Le résolveur, copie épinglée** (`src/vendor/resolution-des-dependances/`) :
   - `resolution-des-dependances.ts` et `cas.json`, copiés du catalogue à `f49cf22` ;
   - `ORIGINE.json` garde leur sha256 ; un test refuse toute copie modifiée ;
   - les cas du contrat sont rejoués côté paiement : la console et paiement résolvent à l'identique.
4. **`ResolutionDesOffres`** :
   - le manifeste en vigueur d'un module est celui de sa plus haute version **vendable** (`ACTIVE` ou `DEPRECATED`) ;
     une version `RETIRED` ne se vend plus ;
   - les codes passent sous la forme du catalogue (sans espaces, en minuscules) : le domaine de l'abonnement range
     `DECLARATIONS`, le catalogue publie `declarations` ;
   - transition (AD-41) : tant que le catalogue n'a publié aucun manifeste, rien n'est refusé.
5. **La route** `GET /api/v1/offres/resolution?modules=a,b` : surface plateforme, droit `paiement:demande:emettre`.
   Réponse `{ modules: [{ code, ajoutePar: { code, raison } | null }], inconnus }`.
6. **La règle de vente** : `POST /api/v1/abonnements` refuse en 422 `MODULE_NON_VENDABLE` (avec `modules`) un module
   à la carte sans manifeste vendable, ou dont une dépendance n'en a pas.
7. **Le ticket pour D** : les écrans de la console (catalogue des modules commerciaux, fiche d'un manifeste avec ses
   dépendances et leur raison, refus par leur nom, choix de l'offre).

## Preuves

- `paiement` sous Node 24 : **4502** passés, 2 ignorés. Tests ajoutés :
  - empreintes de la copie du résolveur ;
  - les 7 cas du contrat, rejoués ;
  - le manifeste en vigueur, la résolution, le refus nommé, l'offre vendable, la casse, la transition ;
  - la projection : clé, état absolu, message plus ancien ignoré ;
  - invariants : 6 consommateurs supervisés, groupes, surfaces plateforme (la route `offres` y est inscrite).
- **Pile `grp-b`**, image de la branche, catalogue de `dev` :
  - au démarrage, paiement relit le topic compacté : **46 manifestes** dans `manifestes_catalogue` (par exemple
    `declarations@1.0` dépend de `bilan`, `pdv@1.0` de `reseau`, avec leur raison) ;
  - `GET /offres/resolution?modules=pdv,declarations,module-fantome` : **200**, `reseau` ajouté par `pdv`, `bilan` par
    `declarations`, `balance` par `bilan`, chacun avec sa raison ; `inconnus: [module-fantome]` ;
  - `POST /abonnements` avec `module-fantome` : **422** `MODULE_NON_VENDABLE` ;
  - `POST /abonnements` avec `declarations` : **201** ; avec `DECLARATIONS`, la règle passe aussi (la casse ne
    compte pas ; le 404 qui suit vient de l'étape d'après, l'abonné n'étant pas projeté).
  - Le chemin réel est complet : droit `paiement` octroyé au catalogue ⇒ état publié projeté ⇒ garde de paiement ;
    puis KYC approuvé publié sur `kyc.status.changed`.

## Décisions

- **D-939-1 — Une copie épinglée du résolveur, pas un paquet partagé.** C'est le patron de la garde de l'état publié
  (STORY-937) : copie, sha256 dans `ORIGINE.json`, cas du contrat rejoués des deux côtés. Le résolveur n'a pas encore
  sa place dans `prospera-plateforme` ; il l'aura si un troisième lecteur arrive.
- **D-939-2 — Le manifeste en vigueur est celui de la plus haute version vendable.** Une version `RETIRED` ne se vend
  plus ; une `DEPRECATED` se vend encore (elle n'est pas retirée).
- **D-939-3 — Transition : un read-model vide ne refuse rien** (AD-41). Sinon la vente s'arrêterait sur un paiement
  levé avant le catalogue, ou sur une pile sans moteur.
- **D-939-4 — Seuls les modules à la carte sont contrôlés par paiement.** Un package est composé au catalogue
  (`/admin/packs`) ; paiement n'en connaît que le code. Vérifier qu'un package ne contient que des modules vendables
  relève du catalogue, avec la table de l'offre au menu (EPIC-144).
- **D-939-5 — Les refus d'installation et de désinstallation** (`MODULE_DEPENDANCE_MANQUANTE`, `MODULE_REQUIS_PAR`)
  sont dans le résolveur copié, mais ne sont branchés sur aucune route : l'installation vient avec EPIC-144.

## Suite

- EPIC-144 : l'installation et le retrait, qui appelleront `verifierInstallation` et `verifierDesinstallation`.
- D : les écrans de la console, sur le ticket.

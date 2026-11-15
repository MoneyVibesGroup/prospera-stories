# STORY-931 : Le dépôt `prospera-plateforme`

Status: done

**Complexité :** moyenne (un dépôt neuf : contrats, signature, vecteurs, une amorce de bibliothèque)

**Épic :** EPIC-142 (un contrat d'état publié stable, et un socle prêt pour le moteur)
**Dépôt :** `MoneyVibesGroup/prospera-plateforme` (neuf, privé)
**Plage :** groupe B, n° 2 du lot de B (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §4).

---

## Pourquoi

La spine du moteur (AD-26) fait naître un dépôt qui porte **les contrats entre l'agent, la centrale et la partie A**,
avec des **vecteurs signés** que l'agent et la centrale rejouent tous deux, et la bibliothèque **`point-de-decision`**
que la partie A et la centrale embarquent telle quelle (AD-23). Sans lui, deux développeurs construiraient l'agent et
la centrale sur deux lectures d'un même format. Le groupe C l'attend aussi (STORY-983, STORY-987).

## Ce qui doit être vrai à la fin (plan §4, n° 2)

| Exigence | Fait |
|---|---|
| Dépôt créé (privé) | oui. **Créé par l'utilisateur** le 2026-11-14, vide ; `main` (premier commit : README) et `dev` poussées par la story |
| Un README qui dit qui écrit dans quel dossier (§2) | oui : C écrit dans `contrats/assurance/`, `champs-sensibles/` et `classification-sante/`, chaque module dans `contrats/objets/<code>/`, B dans tout le reste |
| Contrats agent, centrale et partie A en JSON Schema | oui pour six contrats (D-931-1) |
| Vecteurs signés par une racine de test | oui : 5 valides, 11 invalides, 4 certificats |
| Paquet `point-de-decision` amorcé | oui (D-931-4) |

## Ce qui a été livré

1. **`contrats/`** (JSON Schema **draft-07**, objets fermés, version `@1`, ajouts facultatifs seulement) :
   - `certificat-cle` (AD-7, AD-28) ;
   - `licence` (AD-8) ;
   - `etat-voulu` (AD-22) ;
   - `heure-de-reference` (AD-5) ;
   - `liste-revocation` (AD-7) ;
   - `fichier-urgence` (AD-7, AD-31).
2. **`@prospera/signature`** :
   - `jcs` (RFC 8785, par `canonicalize`) ;
   - `signer` (JWS compact EdDSA, par `jose`) ;
   - `certifier` (la racine certifie une clé) ;
   - `verifierCertificat` ;
   - `verifierArtefact`, qui contrôle dans l'ordre :
     1. la forme ;
     2. l'algorithme ;
     3. le type ;
     4. le signataire ;
     5. l'environnement ;
     6. l'usage ;
     7. la validité à l'horloge scellée ;
     8. la signature ;
     9. la charge canonique ;
     10. le `kid` ;
     11. l'instance ;
     12. l'audience.

     Le premier écart refuse tout, avec un **code nommé**.
3. **`vecteurs/`** : une racine de test `racine-test-2026`, des clés de test (privées comprises, voulu) et
   `index.json`. Chaque vecteur donne `VALIDE` ou **un** code :
   - `SIGNATURE_INVALIDE` ;
   - `USAGE_NON_COUVERT` : une licence signée par une clé de CI ;
   - `CLE_HORS_VALIDITE` ;
   - `ENVIRONNEMENT_INTERDIT` : une clé certifiée « production » par une racine de test ;
   - `CLE_INCONNUE` ;
   - `AUTRE_INSTANCE` ;
   - `AUDIENCE_INCORRECTE` ;
   - `CHARGE_NON_CANONIQUE` ;
   - `ALGORITHME_INTERDIT` (`alg: none`) ;
   - `TYPE_INCONNU` ;
   - `SCHEMA_INVALIDE` : un champ hors contrat.
4. **`@prospera/point-de-decision`** : l'entrée, la sortie, les codes de refus et leur **ordre**
   (`MODULE_NON_SOUSCRIT`, `MODULE_HORS_LICENCE`, `MODULE_DEPENDANCE_MANQUANTE` ; sur site, `MODULE_HORS_LICENCE` seul).
5. **Les gardes** :
   - `test/contrats.test.ts` : draft-07, aucun `$ref`, aucun mot-clé postérieur, chaque objet fermé ;
   - `test/vecteurs.test.ts` : chaque vecteur rejoué, l'état voulu vérifié jusqu'à ses artefacts imbriqués, une autre
     racine qui refuse tout, un code distinct par vecteur.
6. **Le socle** :
   - Node 24, avec TypeScript exécuté nativement (`node --test`, sans compilation) ;
   - un espace de travail npm (`paquets/*`) ;
   - LF partout (`.gitattributes`).

## Décisions

- **D-931-1 — Six contrats d'abord, les autres avec leur premier consommateur.**
  - Les six livrés sont ceux qu'AD-41 (un agent simulé vérifie un état voulu signé et applique une licence) et la
    garde des clés exigent.
  - Le jeton d'export (AD-14), les fichiers de rétablissement et de prolongation (AD-35), le signal et le contact
    (AD-9) arrivent avec la story qui les produit. Ce sont tous des contrats de la centrale ou de l'agent, dont aucun
    n'existe encore.
  - Le manifeste de version arrive avec la CI de publication (AD-28 : les clés de CI sont scellées dans la CI).
- **D-931-2 — L'état voulu porte la licence, l'heure de référence et la liste de révocation SIGNÉES À PART** (des JWS
  imbriqués). Chacune garde son propre numéro, que l'agent compare au plus haut vu pour sa clé (AD-8). Une copie
  dans le corps de l'état voulu perdrait cette garde.
- **D-931-3 — Les deux artefacts de la racine valent pour tout leur environnement.** Le certificat de clé et le
  fichier d'urgence n'ont ni `instanceId` ni `audience` : une clé certifiée, une clé révoquée le sont pour toutes les
  instances. Tous les autres artefacts portent les cinq champs d'AD-26.
- **D-931-4 — L'amorce du point de décision refuse, et le dit.** Tant que la logique n'est pas livrée (EPIC-144),
  `decider` rend `POINT_DE_DECISION_NON_LIVRE`, jamais un « oui » par défaut. L'amorce fixe déjà le contrat que la
  partie A et la centrale appelleront.
- **D-931-5 — Les clés privées de test sont dans le dépôt.** Elles ne signent que des vecteurs. Un agent de production
  embarque la racine de production et refuse tout le reste : un test le prouve (`CLE_INCONNUE` sous une autre racine).

## Écart

- **Les réglages du dépôt** (« Rebase and merge » seul, plan §10) n'ont pas pu être posés par la session : la
  commande a été refusée par le mode automatique. À faire par l'utilisateur dans les réglages GitHub du dépôt. Les
  commits de fusion et le squash y sont encore permis.

## Preuves (2026-11-15)

- `npm test` : **32/32** sous Node 25 (poste) et sous **Node 24.22** (`node:24-slim`) ; `npm run typecheck` vert.
- `npm run vecteurs:generer` rejoué : empreinte du dossier `vecteurs/` **identique**.
- **Mutation** : le contrôle d'usage retiré, `licence-par-cle-ci ⇒ USAGE_NON_COUVERT` rougit (1 échec), et repasse
  avec le code d'origine.

## PR

- `prospera-plateforme` : `main` (`eee5735`), **#1** fusionnée sur `dev` (`7630cdd`).

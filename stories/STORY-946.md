# STORY-946 : le kit des cibles (1) — les contrats de la Reprise, les routes d'import et de contrôle

Status: done

**Complexité :** grande (dix contrats et deux OpenAPI, une bibliothèque, la preuve par mutation)

**Épic :** EPIC-161 (le kit des cibles : une cible reçoit une reprise en déclarant ses objets)
**Dépôts :** `MoneyVibesGroup/prospera-plateforme` (`contrats/reprise/`, `bibliotheques/kit-cible/`, scripts et fichiers racines)
**Plage :** groupe B, n° 6 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3).

---

## Pourquoi

Une trentaine de modules cibles doivent recevoir une reprise en février sans coder trente fois la même garde, la même
idempotence et la même simulation (spine de Connecteurs AD-12, décision du PO du 12/11). Le kit des cibles fait la
mécanique ; le module déclare ses objets. `kit-cible` 1.0.0 doit être étiqueté **avant le 04/12** : le point d'import de
`pdv` se code en S5. 946 en pose le socle ; 947 le complète (suite de conformité publiée, cible témoin, 1.0.0).

## Ce qui doit être vrai à la fin (plan du lot 2, §3, n° 6)

| Exigence | Fait |
|---|---|
| Contrats publiés | oui : dix schémas et deux OpenAPI dans `contrats/reprise/`, générés depuis une source |
| CI Ajv | oui : chaque contrat compile sous Ajv strict ; draft-07, aucun `$ref`, objets fermés ; OpenAPI = contrats à l'identique |
| `SIMULER` et `APPLIQUER` | oui : le même code, dans une transaction annulée en `SIMULER` |
| Idempotence | oui : par (`lotId`, `versionLot`, `cleOrigine`) ; un rejeu rend le même résultat et n'écrit rien |
| Refus nommés | oui : 6 refus de requête, 7 codes d'objet, et les refus de garde de la matrice |

## Ce qui a été livré

1. **Les contrats de la Reprise** (`contrats/reprise/`, AD-21), générés par `npm run contrats:reprise` depuis
   `scripts/contrats-reprise.ts` :
   - `enveloppe-reprise@1` : le corps du point d'import. Il ne porte aucun `organisationId`, et ses `champs` ont des noms
     d'identifiant ;
   - `reponse-reprise@1`, `refus-reprise@1` ;
   - `controles-demande@1`, `controles-reponse@1` : valeurs de contrôle étiquetées `montant`, `date`, `entier`, `etat` ;
   - `declaration-objet@1` : l'annotation `x-reprise` d'un schéma d'objet ;
   - `reprise.feu-vert.changed@1` (réel seulement), `reprise.historique.livre@1` ;
   - `verification-donnees-importees@1`, `sante@1` ;
   - `reprise-cible.openapi.json` (les deux routes de chaque cible) et `reprise-c13.openapi.json` (vérification et santé
     de la Reprise), en OpenAPI 3.1.
2. **`@prospera/kit-cible` 0.1.0** (`bibliotheques/kit-cible/`, espace de travail npm) :
   - `creerCible({ code, objets: [{ schema, raccord }], transactions, etatPublie })` : une déclaration fausse échoue au
     démarrage. C'est le cas d'un schéma qui n'est pas en draft-07, d'un schéma ouvert, d'un `$id` hors norme, d'un
     `x-reprise` invalide ou qui nomme un champ absent, d'un objet d'un autre module, d'une référence vers un objet non
     déclaré ;
   - `cible.importer(appelant, chemin, corps, octets)` et `cible.controler(…)`, dans l'ordre d'AD-4 (voir le README) ;
   - `traiterRequete(cible, { methode, chemin, appelant, corps, octets })` : l'adaptateur HTTP, indépendant du cadre ;
   - les ports `Transactions`/`Session`, `Raccord`, `LecteurEtatPublie` ; les surcharges `juger`, `appliquer`,
     `valeursDeControle`, `doublonsProbables` ;
   - `@prospera/kit-cible/memoire` : un magasin transactionnel en mémoire (index unique) et une doublure de l'état publié.
3. **Racine** : l'espace de travail `bibliotheques/*` entre au verrou ; les scripts `test` et `typecheck` le lisent (la
   garde de STORY-941 l'a exigé) ; script `contrats:reprise` ; README (tableau « Qui écrit », contrats, kit).

## Preuves

- Node 24 (`node:24-slim`, export de l'arbre par `git archive`) : `npm ci` ✔, `npm run typecheck` ✔, `npm test`
  **318 passés, 0 échec, 1 sauté** (la matrice du catalogue, absente du conteneur), contre 253 avant : aucune
  régression. Code : plateforme #8, `300779e` sur `dev`.
- Kit : 34 tests (import 21, contrôles 5, déclaration 6, HTTP 2) ; contrats : 15 tests.
- Chaque réponse et chaque refus du kit sont jugés par leur contrat publié, dans les tests.
- Garde de l'état publié : les neuf états, essai et réel, Reprise, Connecteurs et utilisateur, et une version de matrice
  inconnue. Le cas de l'installation du réel, ouverte à la seule Reprise, en fait partie.
- `SIMULER` de 500 objets : quelques dizaines de millisecondes en mémoire (borne de la conformité : 30 s).
- **Mutation** (`test/mutation.test.ts`, crochet de chargement `module.registerHooks`, aucun fichier copié) : quinze
  altérations de `src/`, et chacune fait rougir la suite **sur une assertion**. On y trouve d'abord les trois de la fin
  d'EPIC-161 :
  - la comparaison au verdict validé retirée ;
  - `ORGANISATION_HORS_JETON` retiré ;
  - un champ inconnu accepté.

  Puis :
  - l'idempotence cassée ;
  - `SIMULER` qui écrit ;
  - `ALIAS_DEJA_UTILISE` renommé ;
  - une version antérieure rejouée ;
  - une référence inconnue créée ;
  - un objet historique modifiable ;
  - la garde ouverte ;
  - 501 objets acceptés ;
  - `APPLIQUER` sans validation ;
  - des contrôles qui écrivent ;
  - une empreinte sans les alias ;
  - une mineure plus récente acceptée.

  La mutation « empreinte sans les alias » a d'abord survécu. Un test l'attrape désormais : un alias ajouté rend `MODIFIE`.
- Pas de `docker compose up` : le dépôt n'a pas de service.

## Décisions

- **D-946-1 — Le cœur du kit est indépendant du cadre.** La spine dit « bibliothèque NestJS ». Mais `prospera-plateforme`
  est sans compilation et sans NestJS, et la mécanique (garde, idempotence, simulation) n'en a pas besoin. Le contrôleur
  d'un service appelle `traiterRequete` en quelques lignes. L'adaptateur NestJS (module, contrôleur générique) vient avec
  947, si la cible témoin le justifie.
- **D-946-2 — La garde du kit EST la garde partagée.** Le kit importe `@prospera/garde-etat-publie` (sortes `reprise` et
  `controles` de la matrice figée) au lieu d'une doublure. Seul l'état vient d'un port, `LecteurEtatPublie`, avec sa
  doublure `EtatPublieFixe`. La relecture au bout de 15 minutes (spine de Connecteurs AD-21, `[PROPOSÉ]`) est laissée
  au port.
- **D-946-3 — Le schéma d'objet juge les `champs`, et sa déclaration vit dans `x-reprise`.** L'enveloppe met les champs
  sous `champs`, comme l'empreinte du livrable d'AD-32. Le schéma d'objet du module est un JSON Schema draft-07 fermé
  de ces champs. Les références, les régimes, les états et les valeurs de contrôle d'AD-2 sont une annotation `x-reprise`
  (Ajv strict la connaît, Karapace l'ignore), jugée par `declaration-objet@1`.
- **D-946-4 — Un écart au schéma refuse la requête entière (422 `SCHEMA_NON_CONFORME`, avec les objets en cause).** La
  Reprise a déjà contrôlé la conformité à l'étape 4. Un écart ici est donc un désaccord de contrat, pas un verdict
  métier. Un refus d'objet laisserait livrer le reste en silence. Même règle pour l'enveloppe
  (`ENVELOPPE_NON_CONFORME`, code nommé ici).
- **D-946-5 — Une version antérieure rend `INCHANGE` avec le code `VERSION_ANTERIEURE`** (spine AD-4). L'épic le range
  parmi les `REFUSE` ; la spine fait foi. Rien n'est écrit.
- **D-946-6 — `rattacherA` rend `INCHANGE` avec le code `RATTACHE`.** La clé de la ligne devient une clé de l'objet
  existant ; ses champs ne sont pas appliqués, et rien n'est créé (AD-9). Une cible inconnue rend `REFERENCE_INCONNUE`.
- **D-946-7 — Un objet refusé n'écrit rien, pas même son idempotence.** Un rejeu le rejuge donc, par exemple après la
  livraison d'une référence manquante. Un objet accepté écrit sa fiche, ses clés, ses alias et son résultat dans la même
  transaction.
- **D-946-8 — Un refus de la cible (`juger`) a le code `REFUSE_PAR_LA_CIBLE`, avec sa raison.** La spine ne nommait pas
  ce cas.
- **D-946-9 — Les références visent un objet du même module.** Une référence vers l'objet d'un autre module se
  résoudra par un port, quand le premier cas existera.
- **D-946-10 — Les routes C13 de la Reprise décrites : vérification `donnees-importees` et santé seulement.** Leur corps
  est fixé par la spine ; `export`, `import` et `effacement` attendent la forme générique de C13 (moteur, EPIC-146).

## Suite (STORY-947)

- La suite de conformité de la reprise, publiée (`contrats/objets/conformite/`), et la cible témoin (un objet de
  référence simple, un objet à circuit) qui la joue. On y trouve :
  - un lot de 600 objets chaînés ;
  - le motif et la trace d'un `montantASaisir` ;
  - le crochet `OUVERTURE_CLOSE`.
- L'adaptateur MongoDB (transaction de session, jeu de répliques exigé) et, au besoin, l'adaptateur NestJS.
- La façon de publier le kit (copie épinglée ou paquet) ; `kit-cible` 1.0.0 étiqueté, relu par A, **avant le 04/12**.

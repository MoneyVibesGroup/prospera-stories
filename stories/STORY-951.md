# STORY-951 : essai ou réel — la répétition générale et la mise en service

Status: review

**Complexité :** moyenne (deux règles pures, une projection Kafka, deux routes, un filtre d'erreurs)

**Épic :** EPIC-146 (deux espaces : essayer, puis mettre en service)
**Dépôts :** `MoneyVibesGroup/prospera-platform-catalog-service`
**Plage :** groupe B, n° 11 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3). Dépend de 948 (naissance)
et de 947 (`kit-cible-v1.0.0`, contrats de la Reprise).

---

## Pourquoi

EPIC-146, « fin de l'épic » : « une écriture vers le réel depuis l'essai est refusée et journalisée ; la Reprise est
mise en service la première dans le réel ; un sous-ensemble dont un module attendu par la Reprise n'est pas `VERT`
(relu par la vérification `donnees-importees`) est refusé ». Spine du moteur :

- AD-10 : « l'essai ne reçoit aucun secret d'écriture du réel […]. La liste blanche des sorties est tenue par la partie
  A ; chaque module intercepte (C13) et la partie A tient le journal des interceptions » ;
- AD-23 (amendée le 2026-11-11) : la Reprise d'abord, sans feu vert ; `MISE_EN_SERVICE_SANS_FEU_VERT` tant qu'un module
  attendu n'est pas `VERT`, la vérification relue avant toute mise en service et à tout trou de `numero` ;
- AD-17 : `reprise.feu-vert.changed` (reprise-service → partie A du réel), `reception-definitive.enregistree`
  (partie A → reprise-service).

## Ce qui doit être vrai à la fin (plan du lot 2, §3, n° 11)

| Exigence | Fait |
|---|---|
| `ECRITURE_REELLE_DEPUIS_ESSAI` | oui : dans l'essai, une destination hors liste blanche est refusée (403) et journalisée avant la réponse ; dans le réel, sans objet |
| `MISE_EN_SERVICE_SANS_FEU_VERT` | oui : un module attendu par la Reprise qui n'est pas `VERT` refuse le sous-ensemble (409, modules nommés avec leur fait) |
| Prouvé sur la cible témoin | oui : le module cible des preuves est `temoin`, le module fictif de la cible témoin du kit (`kit-cible-v1.0.0`). La Reprise est une **doublure** qui répond au contrat publié (EPIC-146 : « sur leur doublure en S6, avant reprise-service ») |

## Ce qui a été livré

1. **Les sorties de l'essai** (`src/mise-en-service/sorties-d-essai.ts`, une règle pure) :
   - réel : toute sortie est permise (`REEL`) ;
   - essai : seulement la liste blanche (`LISTE_BLANCHE`) ; sinon `ECRITURE_REELLE_DEPUIS_ESSAI` ;
   - types `COURRIEL`, `SMS`, `HTTP`, `PAIEMENT`, `FICHIER` ; adresse exacte ou joker de suffixe (`*@essai.prospera.io`,
     `*.sandbox.example`) ; un joker trop large (`*`, `*x`, `*@`) est refusé à l'écriture (422 `SORTIE_INVALIDE`) et
     n'ouvre rien s'il est en base.
2. **Les routes des sorties** (`/api/v1/sorties-essai`, public `/api/instance/v1/…`) :
   - `POST /{organisationId}/verifier` : appelée par un module, sous le jeton du membre ou d'une identité de service
     (`MOTEUR`, `REPRISE`, `CONNECTEURS`) limitée à son organisation (`ORGANISATION_HORS_JETON`) ;
   - `GET|POST /liste-blanche`, `DELETE /liste-blanche/{id}` (console : `org:read`, `entitlement:grant`) ;
   - `GET /{organisationId}/interceptions` : le journal, en ajout seul (collection `interceptions_essai`).
3. **La mise en service** (`src/mise-en-service/mise-en-service.ts`, une règle pure). Refus, dans l'ordre :
   1. `MISE_EN_SERVICE_HORS_DU_REEL` ;
   2. `MISE_EN_SERVICE_MODULE_NON_INSTALLE` (modules nommés) ;
   3. `MISE_EN_SERVICE_REPRISE_D_ABORD` ;
   4. `VERIFICATION_DONNEES_IMPORTEES_NON_EXECUTEE` (503, avec `raison`) ;
   5. `MISE_EN_SERVICE_SANS_FEU_VERT` (modules nommés, chacun `ATTENDU` avec son `epoque` et son `numero`).

   Le fait retenu d'un module attendu est le plus récent par `(epoque, numero)` entre la projection et la vérification
   relue ; à égalité, la vérification.
4. **La route** `POST /api/v1/mises-en-service/{organisationId}` (`entitlement:grant`), `GET` (`org:read`) :
   - idempotente sur (organisation, sous-ensemble) : 201 puis 200, le même bilan ;
   - le bilan (`mises_en_service`) et `reception-definitive.enregistree` (outbox) s'écrivent dans **une** transaction ;
   - deux ordres concurrents ne font qu'un bilan et qu'un événement.
5. **La relecture de la Reprise** (`verification-donnees-importees.ts`) :
   - `POST /api/v1/instance/reprise/{organisationId}/verifications/donnees-importees` à l'adresse du module `reprise`
     (`INSTALLATION_SERVICES`), sous le jeton de service du moteur ;
   - la réponse est validée par le contrat publié ;
   - hors contrat, autre organisation, injoignable : jamais un feu vert.
6. **La projection de `reprise.feu-vert.changed`** (consommateur, groupe `platform-catalog-feux-verts`) :
   - **réel seulement** : il ne démarre pas dans l'essai ;
   - garde le plus grand `(epoque, numero)`, en écriture conditionnelle ;
   - un trou de numéro marque la ligne « à relire » ;
   - un fait hors contrat est écarté (un feu vert d'essai en est un).
7. **Les contrats** :
   - les deux schémas de la Reprise copiés à `kit-cible-v1.0.0` dans `src/vendor/reprise/` (sha256 gardé, lus à
     l'exécution) ;
   - `contrat/mise-en-service.openapi.json` ;
   - `contrat/schemas/reception-definitive.enregistree.json` (fermé). Le registre le prend au prochain
     `schemas:enregistrer`, comme tout fichier de `contrat/schemas/` ; c'est un sujet neuf, donc compatible. Il n'a pas
     été enregistré sur la pile de preuve, qui n'avait pas de Karapace.
8. **Le filtre d'erreurs** laisse passer `interceptionId`, `raison`, et `modules` sous la forme d'un feu vert
   (`{ module, etat, epoque, numero }`). Constaté sur la pile : la liste blanche du filtre les taisait.
9. **La doublure de la Reprise** (`test/doublures/reprise.mjs`, sans dépendance), pour les preuves et les recettes.

## Preuves

- **Node 24**, étage `verification` construit depuis un export `git archive` de la branche : **94 suites, 1 402/1 402**,
  `tsc` et build verts. Les fichiers touchés passent le lint.
- **Pile `grp-b-951`**, sur les images de la branche :
  - deux parties A, **essai** et **réel**, dans un Mongo 8 en jeu de répliques (une base par espace), avec Kafka et
    Redis ;
  - auth d'`origin/dev` (948) ;
  - la doublure de la Reprise ;
  - sans MinIO, introuvable, comme en 942 et 948.

  La preuve de bout en bout compte **28 vérifications sur 28** :
  - **naissance** de la même organisation dans les deux espaces : 201 `NEE` ;
  - **essai** :
    - liste blanche `*@essai.prospera.io` : 201, puis 200 au rejeu ; `*` : 422 `SORTIE_INVALIDE` ;
    - `dg@client-reel.tg` sous le jeton `REPRISE` : 403 `ECRITURE_REELLE_DEPUIS_ESSAI`, avec `interceptionId` ;
    - `dg@essai.prospera.io` : 200 `LISTE_BLANCHE` ;
    - le journal porte une interception, celle-là, par `service:reprise` ;
    - une autre organisation : 403 `ORGANISATION_HORS_JETON` ;
  - **réel** : la même écriture, 200 `REEL` ;
  - **mise en service** :
    - essai : 409 `MISE_EN_SERVICE_HORS_DU_REEL` ;
    - réel, témoin non installé : 409 `MISE_EN_SERVICE_MODULE_NON_INSTALLE` ;
    - témoin, Reprise et bilan installés : `{temoin}` donne 409 `MISE_EN_SERVICE_REPRISE_D_ABORD` ; `{reprise}` donne
      201, sans feu vert ;
    - doublure `temoin ATTENDU 0/1` : 409 `MISE_EN_SERVICE_SANS_FEU_VERT`, module nommé ; la vérification a été relue
      sous jeton ;
    - doublure arrêtée : 503 `VERIFICATION_DONNEES_IMPORTEES_NON_EXECUTEE`, `raison: SERVICE_INJOIGNABLE` ;
    - un feu vert d'essai publié sur le topic : écarté ; `VERT 0/2` du réel : projeté en **1,2 s** ;
    - doublure `VERT 0/2` : 201, attendu `temoin 0/2` ; rejeu : 200, le même bilan ;
    - projection `ATTENDU 0/3`, plus récente que la vérification `VERT 0/2` : 409 sur `{bilan, temoin}` ;
  - **sur le fil** : `reception-definitive.enregistree` porte deux faits (`reprise`, puis `temoin`), **tous deux au
    schéma publié** (Ajv) ;
  - deux bilans, la Reprise d'abord ; une identité de service ne lit pas les bilans (403) ;
  - essai : le consommateur des feux verts ne démarre pas.
- **Mutations** : 9 sur 9 rougissent sur une assertion.
  - Une première série laissait survivre « deux événements pour un ordre rejoué » : le rejeu s'arrête à la relecture
    du bilan. Le test de deux ordres concurrents a été ajouté.
  - Trois mutations faisaient d'abord échouer la compilation ; elles ont été réécrites pour compiler.
  - La liste des mutations :
    - l'essai traité comme le réel ;
    - un joker sans séparateur ;
    - le feu vert ignoré ;
    - la vérification qui l'emporte toujours ;
    - la Reprise qui ne passe plus d'abord ;
    - la vérification relue ignorée ;
    - un refus non journalisé ;
    - deux événements ;
    - le filtre qui tait `interceptionId`.
- Pile descendue avec ses volumes (`down -v`), images retirées, verrou Docker rendu.

## Décisions

- **D-951-1 — La partie A décide, le module obéit.** « Chaque module intercepte » se lit ainsi : avant toute écriture
  sortante, le module demande à la partie A de son espace (`verifier`). La règle n'existe qu'une fois, et le journal
  est tenu par la partie A, comme le veut AD-10. Un module qui garderait une copie locale de la liste ferait deux
  calculs.
- **D-951-2 — Refuser, puis journaliser avant de répondre.** Le refus ne dépend pas de l'heure. Sans heure de
  référence, la ligne du journal est écrite sans instant plutôt que rien.
- **D-951-3 — Le joker est un suffixe qui commence par `@` ou `.`.** `*@essai.io` ne couvre pas `x@faux-essai.io`. Un
  joker plus large est refusé à l'écriture, et sans effet s'il est déjà en base.
- **D-951-4 — Trois refus nommés de plus que la spine**, tous contestables :
  - `MISE_EN_SERVICE_HORS_DU_REEL` : une mise en service n'a pas de sens dans l'essai ;
  - `MISE_EN_SERVICE_MODULE_NON_INSTALLE` : on ne met pas en service ce qui n'est pas installé ;
  - `MISE_EN_SERVICE_REPRISE_D_ABORD` : « la Reprise mise en service la première », rendu explicite.
- **D-951-5 — « Module attendu »** = un module du sous-ensemble que la vérification relue liste (la part de la Reprise
  au dossier) ou dont la projection a reçu un fait. Un module que la Reprise ne connaît pas passe sans feu vert : il
  n'a rien à importer. Si la Reprise n'est pas installée, rien n'est relu, mais un feu `ATTENDU` projeté ferme quand
  même.
- **D-951-6 — Le plus récent l'emporte**, entre la projection et la vérification, par `(epoque, numero)` ; à égalité,
  la vérification. Ni la projection seule ni la vérification seule ne suffisent à ouvrir.
- **D-951-7 — La mise en service ne change pas l'état publié.** La matrice est figée (`contrat-etat-publie-v1`) :
  `EN_SERVICE` reste « installé + droit actif ». La mise en service est un fait de la partie A (bilan,
  `reception-definitive.enregistree`), lu par la Reprise. Si une sorte de route doit un jour dépendre d'elle, ce sera
  un ajout annoncé.
- **D-951-8 — L'invitation au réel n'est pas faite ici.** AD-15 : « l'invitation au réel part à la mise en service ».
  Il n'existe pas encore de route d'invitation pour l'identité de service du moteur dans auth ; elle viendra avec la
  console de mise en service (EPIC-146, écrans), dans une story de B. Noté au journal.
- **D-951-9 — Les contrats de la Reprise vivent sous `src/vendor/reprise/`, pas sous `contrat/copies/`.** Ils sont lus
  à l'exécution (validation), et l'image de production ne copie que `dist/`.

## Hors de cette story (EPIC-146, à venir)

- le **dossier d'installation** rejoué de l'essai vers le réel (répétition générale, FR-8) ;
- le **rafraîchissement** (FR-10) : réel vers essai, `ESSAI_CLIENT` seulement, ordres `SUSPENDRE_ECHEANCES` et
  `REPRENDRE_ECHEANCES` ;
- l'**invitation au réel** (D-951-8) ;
- les **écrans** de la console : un ticket pour D quand le lot frontend s'ouvrira.

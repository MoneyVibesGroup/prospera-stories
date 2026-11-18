# STORY-1015 : la déclaration part seule à l'assureur

Status: done

**Complexité :** moyenne-haute (trois dépôts, un chiffrement de champ, un consommateur, une preuve sur pile)

**Épic :** EPIC-206 (la déclaration) et EPIC-212 (l'échange avec le logiciel de la compagnie)
**Dépôts :** `prospera-plateforme` (`contrats/assurance/`), `prospera-sinistres-service`, `prospera-liaison-assureur-service`
**Porteur :** groupe C, n° 2 du lot 4 (`coordination/PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §5). Une pile.
Origine : D-1002-8 (le fait de déclaration n'avait pas de porteur) ; question au PO du 17/11 acceptée (journal de A,
« Demandes aux autres groupes »). Ancrage : AD-6 (`DEC-` clé d'idempotence de C-13), AD-16 (catalogue des faits), AD-24
(champs-sensibles), FR-36, FR-196 (aucune donnée médicale vers le LC), FR-198, FR-199.

---

## Pourquoi

Jusqu'ici la déclaration enregistrée dans `sinistres` ne partait pas au logiciel de la compagnie : la preuve de 1002
enfilait la ligne C-13 chez `liaison-assureur` à la main. La spine fait consommer `sinistres.declaration.enregistree@1`
et `sinistres.garantie.decidee@1` par `liaison-assureur` ; aucune story ne les créait. Avant la démo, une déclaration
enregistrée doit aboutir seule à un envoi, et le numéro du LC doit revenir au dossier.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | Les deux faits sont au registre (schémas dans `prospera-plateforme`, champs classés) | tests de la plateforme, Karapace sur pile |
| AC-2 | ⛔ Le fait de déclaration ne porte aucune donnée personnelle en clair : la ligne C-13 voyage chiffrée ; rien de santé pour un dossier corporel | schéma fermé, test, outbox de la pile |
| AC-3 | `sinistres` publie les deux faits dans la transaction du dossier ; ni recours, ni dossier sans déclaration, ni sans trousseau | tests du service (deux bancs) |
| AC-4 | `liaison-assureur` forme la ligne C-13, l'enfile sous `DEC-`, l'émet ; un rejeu n'enfile rien de plus | tests, pile |
| AC-5 | Une déclaration incomplète ou refusée par le contrat ouvre UN écart `DECLARATION_INCOMPLETE`, sans envoi | tests, pile |
| AC-6 | La décision de garantie est gardée par version, jamais envoyée seule | tests, pile |
| AC-7 | Pile : déclaration enregistrée → envoi → numéro du LC fictif revenu au dossier | pile `grp-c` |

## Décisions retenues par défaut (contestables)

- **D-1015-1 — Le fait ne porte que des clés** (référence, police, volet, canal, dates, `complete`) ; le contenu
  personnel (déclarant, téléphone, lieu, victime…) est dans `ligneChiffree`, enveloppe `cs1.` de champs-sensibles
  (contexte `sinistres.declaration.ligne-c13`). Le manifeste interdit les données personnelles en clair dans un fait.
- **D-1015-2 — Le déclarant du C-13 est l'assuré saisi à la déclaration** (`assure`, `telephone`, `lieu`).
- **D-1015-3 — Seule une déclaration créée publie** : pas de fait pour un rattachement à un dossier existant (doublon),
  ni pour un dossier de recours, ni pour un dossier créé sans déclaration.
- **D-1015-4 — Sans trousseau, la déclaration ne part pas seule** (comportement d'avant, dit au démarrage) ; côté
  liaison, le topic de la déclaration n'est alors pas lu (les messages attendent). ⚙ **Configuration à poser :
  `SINISTRES_TROUSSEAU` = `LIAISON_TROUSSEAU`** (JSON `{chiffrement:{active,cles},index:{active,cles}}`, clés de 32
  octets en base64, la même valeur des deux côtés, comme la clé de doublon). Aucune valeur par défaut.
- **D-1015-5 — Une déclaration incomplète** (police, lieu, déclarant ou téléphone manquant) publie `complete: false` et
  `manque`, sans ligne ; `liaison-assureur` ouvre l'écart `DECLARATION_INCOMPLETE` (une fois), à saisir à la main au LC.
  Nature ajoutée à l'énumération de `ecart.ouvert@1` (élargissement compatible).
- **D-1015-6 — Le relevé est déclenché juste après l'enfilage** (la déclaration « part seule » sans attendre l'heure) ;
  en cas d'échec, le cycle suivant émet.
- **D-1015-7 — Le module `liaison-assureur` doit être en service avec écriture ouverte** pour l'organisation ; sinon le
  message est écarté (journalisé) et la déclaration n'est pas enfilée. Risque connu : une déclaration reçue avant
  l'installation n'est pas rejouée (la reprise du passé relève de la reprise de données).
- **D-1015-8 — `sinistres.garantie.decidee@1` est gardée par `liaison-assureur`** (collection par dossier, version la
  plus haute) et sert aux envois à venir (C-14, C-17) ; elle ne déclenche aucun envoi seule. Le motif écrit et le
  préjudice (texte libre) ne voyagent pas.
- **D-1015-9 — `LIAISON_ATTRIBUTEUR`** (`LC` par défaut) fixe l'`attributeur` de chaque C-13 ; la voie `PROSPERA`
  (numéro `PRO-` généré par la liaison) n'est pas dans cette story.
- **D-1015-10 — La preuve rejoue la garantie par `RESP`** : un `GEST` sans registre de gestionnaire n'a aucun dossier dans
  sa portée (404, STORY-1004), c'est le comportement voulu.

## Hors story

Réémission d'une déclaration complétée après coup ; reprise des déclarations antérieures à l'installation ; envois C-14
et C-17 ; numéro `PRO-` ; écran de la file des écarts.

## Ce qui a été livré

- **Plateforme** : #33 (dev `cd5a2b8`) et #34 (dev `c4368ba`, schéma valide en Ajv strict, `strictRequired`).
- **prospera-sinistres-service#27** : dev `87e0074` (publication des deux faits par l'outbox, `ligne-c13.ts`, champs-sensibles
  épinglé, schémas copiés de `c4368ba`). Node 24 : 1289 unitaires sur MongoDB réel (64 suites), 33 e2e, lint 0.
- **prospera-liaison-assureur-service#8** : dev `a0713f4` (consommateur, garanties gardées, écart, `LIAISON_TROUSSEAU`,
  `LIAISON_ATTRIBUTEUR`). Node 24 : 500 unitaires (44 suites), 21 e2e, lint 0.
- **Pile `grp-c-1015`** (Karapace, Kafka, MongoDB, sinistres, liaison, LC fictif) : deux sujets au registre, 19 sujets / 0
  refus à la garde de classification ; `DEC-2026-00001` envoyée seule, `LCF-2026-000001` revenu au dossier, envoi
  ACCEPTÉ ; `DEC-2026-00002` sans police : écart, aucun envoi ; garantie gardée (version 3) ; fait de déclaration en clair
  = 0 ; 0 erreur dans les journaux ; pile descendue avec ses volumes.
- Rejeu depuis `dev` : l'arbre de `dev` est identique à celui des branches vérifiées (aucun commit intercalé).
- Reste : réémission après complétion, reprise du passé, C-14 et C-17.

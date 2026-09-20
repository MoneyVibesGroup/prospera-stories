# STORY-672 : Onze comptes de gestion CIMA ne mènent à aucun poste — et la liasse les perd en silence

Status: ready-for-dev

**Complexité :** high

**Épic :** EPIC-128 — Socle vertical CIMA
**Service :** `bilan-service` (source des octets) + `balance-service` + `assurance-service`
**Points :** 8
**Origine :** ⚡ **mesure du cadrage de STORY-513**, 2026-09-20 — dépouillement de la table de passage
de `cima-assurances@1.0`.

---

## Le fait, mesuré sur l'artefact

L'artefact déclare `racinesDeGestion: ["6","7","80","82","83","84","85","86"]` — les racines qui
portent le résultat comptable. Sa **table de passage** ne route que `60`→`68`, `70`, `71`, `75`, `76`
et `77`.

**Onze comptes déclarés « de gestion » ne sont donc routés vers aucun poste de la liasse :**

| Compte | Libellé |
|---|---|
| `69` | Charges par nature à l'étranger |
| `73` | **Réductions et ristournes de primes** |
| `74` | Ristournes, rabais et remises obtenus |
| `78` | Travaux faits par l'entreprise pour elle-même |
| `79` | Produits par nature à l'étranger |
| `80` | Exploitation générale |
| `82` | **Pertes et profits sur exercices antérieurs** |
| `83` | Dotation aux provisions exceptionnelles et réserves réglementaires |
| `84` | Pertes et profits exceptionnels |
| `85` | Impôts sur les bénéfices |
| `86` | Produits de prestations de services échangés |

⛔ **Le mode de panne est silencieux, et le projet le connaît déjà.** Un solde porté par l'un de ces
comptes est un **compte non mappé** : la balance le porte, la liasse ne le voit pas, et aucun contrôle
ne bronche — `CAT = CPT` reste vrai, puisque l'écart ne touche que la présentation. C'est le patron de
**STORY-486**, transposé de `syscohada-revise` à `cima-assurances`.

⚡ **Deux de ces onze comptes ont un demandeur nommé.** L'AC-4 de **STORY-513** exige de distinguer les
ristournes **de l'exercice** (compte `73`) de celles portant sur un **exercice antérieur** (compte
`82`). STORY-513 enregistre la distinction dans l'agrégat ; elle ne peut pas la **présenter**, faute de
poste. Sans cette story, `RP1` « Primes ou cotisations » **surévalue les primes** de toutes les
ristournes accordées.

⚠️ **`85` est un cas à part, et il est déjà déclaré** : le poste `RN` s'intitule « RÉSULTAT NET DE
L'EXERCICE (avant impôt sur les bénéfices) ». Son absence de routage est **cohérente avec son libellé**
— à confirmer, pas à corriger d'office.

## Critères d'acceptation

- [ ] AC-1 — Pour **chacun** des onze comptes, une décision **écrite** : routé vers un poste (lequel,
      avec quel signe), ou **délibérément non routé** avec le motif. ⛔ Aucun ne reste sans mention.
- [ ] AC-2 — `73` et `82` sont routés, et **pas au même endroit** : une ristourne de l'exercice réduit
      les primes, une ristourne sur exercice antérieur ne les touche pas. C'est ce que STORY-513 attend.
- [ ] AC-3 — ⛔ Un test **mesure l'assiette** de chaque poste touché **avant et après**, poste par
      poste : ajouter des comptes à une table de passage peut élargir une assiette sans qu'on l'ait
      voulu. Un « plan ⊇ préfixes de la table » ne le verrait pas.
- [ ] AC-4 — ⛔ **Nouvelle version du paquet** : les octets changent dans **trois** dépôts, donc la
      version, le checksum et les trois recopies, **dans le même lot de PR**. ⚠️ Vérifier la version
      réellement packagée avant de commencer — **STORY-514** et **STORY-671** en demandent une aussi.
- [ ] AC-5 — Le `statut` de l'artefact reste `amorce` (AD-12) : router des comptes ne valide ni la
      liasse ni les provisions techniques.
- [ ] AC-6 — ⚠️ Un test **générique** : tout compte du plan déclaré dans `racinesDeGestion` est soit
      routé, soit inscrit dans une liste d'exclusions **motivée**. C'est lui qui empêche le douzième
      compte orphelin d'arriver en silence.

## Hors périmètre

- Les **variations de provisions techniques** au compte de résultat → STORY-518.
- La **provision pour primes non acquises** → STORY-514.
- La transcription des 1 052 comptes du plan → STORY-671.
- Toute **validation actuarielle** (AD-12).

## Notes

- Voir [[STORY-513]] (qui a produit la mesure et attend `73`/`82`), [[STORY-486]] (le même mode de
  panne sur `syscohada-revise`), [[STORY-518]], [[STORY-671]], spine AD-5, AD-9, AD-12.

# STORY-292 : `balance-service` — le référentiel **CIMA** est attribuable par la console mais inconnu de la balance : l'ajouter au manifeste **et au contrat canonique**

**Epic :** EPIC-017 — Contrat canonique & socle Atelier
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § NFR-A06 (piloté par données) · **STORY-078** (registre + résolution) · **STORY-101** (contrat canonique de balance) · **STORY-122** (paquet CIMA livré côté `bilan-service`) · **STORY-147** (précédent de changement du contrat)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** medium
**Statut :** ready-for-dev
**Assigné à :** —
**Créée le :** 2026-08-07
**Sprint :** 20
**Service :** `balance-service` (:3007)
**Branche :** `MNV-292`
**Origine :** `tickets/TICKET-BACKEND-referentiels-attribuables-mais-non-servis.md` ① — ouvert par la maquette **FE-056**

---

## Le défaut, en une phrase

La console **peut attribuer** `cima-assurances@1.0` à une organisation (pack vertical Assurance,
AP-06) ; `balance-service` **ne sait pas le charger** ; l'organisation reçoit un
**`500 REFERENTIEL_UNAVAILABLE`** dès qu'elle touche à une balance.

## Pourquoi ce n'est pas une copie de fichier

L'artefact **existe déjà** et il est **validé** : STORY-122 l'a livré puis corrigé côté `bilan-service`
(done le 2026-07-27), checksum `7e644ab171cc9da261e951ace1be0f9614ee451232d278d47758859813c3bd4e`.
La décision **D-078-2** est claire : *un artefact = un checksum = un contenu*, les octets de
`balance-service` sont **ceux de `bilan-service`**, et `referentiel-assets-coherence.spec.ts` casse la CI
à la moindre dérive. La copie est donc mécanique.

**Le point dur est ailleurs — c'est le contrat canonique de la balance :**

```ts
// balance/types/balance-canonique.ts
export const REFERENTIELS_BALANCE = ['SN', 'SMT', 'SFD-BCEAO'] as const;
export type ReferentielBalance = (typeof REFERENTIELS_BALANCE)[number];
```

`BalanceCanonique.referentiel` est typé dessus, et le pont `PONT_TAG` du registre est **exhaustif par
construction** (`Record<ReferentielBalance, ReferentielRef>` : TypeScript refuse de compiler si un tag
n'est pas résolu). Ajouter `CIMA` **étend l'énumération publique** : DTO, Swagger, validateurs `@IsIn`,
et **types générés côté front**. C'est une extension additive — aucune balance existante ne change de
valeur, donc **aucune migration** — mais elle traverse le contrat, et c'est ce qui vaut ses 5 points.

⚠️ **`@1.0` n'a jamais été attribué à une organisation** (STORY-122 le note explicitement, c'est ce qui
lui a permis de corriger le checksum en place). Il n'y a donc **aucune donnée à reprendre** : la story
est un ajout pur.

---

## Périmètre

1. **Asset** — copier `cima-assurances-1.0.json` depuis
   `bilan-service/src/modules/bilan/referentiel/assets/` vers
   `balance-service/src/modules/referentiel/assets/`, **octets identiques** (D-078-2).
2. **Manifeste** — une entrée dans `ReferentielRegistry`, `locator` + `checksum` **exactement** celui de
   `bilan-service`.
   ⚠️ **`longueurCompteDetail` : à OMETTRE tant que le niveau de détail du plan CIMA n'est pas
   sourcé.** STORY-146 avait délibérément laissé ce champ vide pour le SFD, et STORY-172 n'a pu le
   remplir qu'après avoir **trouvé la source** (RCSFD, pages 29-42) et **compté les comptes**. Inventer
   un chiffre par analogie avec SYSCOHADA rejouerait le défaut que 172 a corrigé. Champ omis ⇒ aucune
   exigence de niveau de détail, comportement identique au SFD d'avant 172.
3. **Contrat canonique** — ajouter le tag à `REFERENTIELS_BALANCE` et le résoudre dans `PONT_TAG`
   (`{ code: 'cima-assurances', version: '1.0' }`). Le nom du tag est à trancher dans la story
   (`CIMA` est le candidat évident ; il doit rester cohérent avec ce qu'expose `bilan-service`).
4. **Surface HTTP** — l'enum remonte au Swagger et aux DTO qui la citent (`AgregationApercuDto`,
   `SubmitBalanceDto`, les query d'état). Vérifier qu'aucun `@IsIn` littéral ne double l'énumération.
5. **Régénération des types front** — l'extension change `openapi.json`. Ouvrir le ticket frontend
   correspondant (ou l'adosser à FE-057 si elle n'est pas encore soldée).

### Hors périmètre

- **Le contenu comptable du plan CIMA** — il appartient à `bilan-service` (STORY-122) et reste à valider
  par un actuaire (AC-18 de 122, blocker métier non levé). Cette story **transporte** l'artefact, elle
  ne le juge pas.
- **Vie / Non-Vie, provisions techniques, C1..C25** — hors livraison de STORY-122, donc hors de celle-ci.
- **Le vertical Assurance côté console** (modules, offre) — objet du pack AP-06.
- **`smt-togo@1.0`** — son refus `409 REFERENTIEL_NON_PACKAGE` est **déjà correct** (constat ② du ticket).

---

## Critères d'acceptation

1. `cima-assurances@1.0` se **charge** : une organisation dont l'entitlement porte ce couple obtient une
   résolution normale, plus aucun `500 REFERENTIEL_UNAVAILABLE`.
2. Les **octets sont identiques** à ceux de `bilan-service` — prouvé par
   `referentiel-assets-coherence.spec.ts` étendu au nouvel artefact, checksum épinglé **hors** du
   registre (le piège du test tautologique relevé en revue de STORY-122).
3. `REFERENTIELS_BALANCE` porte le nouveau tag, `PONT_TAG` le résout, **et la compilation prouve
   l'exhaustivité** (mutation : retirer l'entrée du pont ⇒ build rouge).
4. Une balance soumise avec ce tag est **acceptée, stockée et relue** à l'identique ; le `checksum` de
   la balance reste stable (le tag entre dans le contenu métier haché).
5. **Aucune balance existante ne change** : `SN`, `SMT`, `SFD-BCEAO` inchangés, relecture des balances
   antérieures non affectée, **aucune migration**.
6. `POST /balances/suggest-comptes` sur une organisation CIMA rend des suggestions **du plan CIMA**, avec
   l'enveloppe `referentiel { code: 'cima-assurances', version: '1.0' }` et le checksum du paquet.
7. `longueurCompteDetail` **absent** du manifeste, et un commentaire dit **pourquoi** (non sourcé), avec
   le geste attendu le jour où la source existera.
8. Swagger à jour ; `openapi.json` régénéré ; ticket frontend de régénération des types ouvert.
9. `lint` 0 warning · `build` OK · couverture du dossier touché 100/100/100/100 · non-régression.

## Vérification docker (DoD)

- Deux organisations fraîches, JWT RS256 réel : l'une `syscohada-revise@2.1`, l'autre
  `cima-assurances@1.0`.
- Sur la seconde : suggestion → comptes **du plan CIMA** ; soumission de balance → 201 ; relecture →
  tag CIMA conservé ; re-soumission identique → 200 idempotent.
- Sur la première : **non-régression stricte**, aucune valeur ne bouge.
- Cas négatif conservé : une organisation portant un code **toujours** hors manifeste continue de rendre
  `500 REFERENTIEL_UNAVAILABLE` — la lacune reste **bruyante**, on ne la remplace pas par un défaut
  silencieux.

## Liens

- Ticket d'origine : `tickets/TICKET-BACKEND-referentiels-attribuables-mais-non-servis.md` ①
- `GAP-cima-non-servi-par-balance` (`sprint-status.yaml` → `open_contract_gaps`)
- Maquette **FE-056** — l'écran rend déjà ce refus et nomme le contrat manquant ; à la livraison de cette
  story, l'encart « À livrer côté backend » disparaît pour le vertical Assurance.

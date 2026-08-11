# STORY-293 : console — le pack **Finance** attribue `sfd-bceao@1.3`, une version que **personne ne sert**

**Epic :** EPIC-025 — RBAC plateforme & console
**Réf. architecture :** **AP-06** (assistant de provisioning, packs verticaux) · **STORY-149** (dépôt de paquet référentiel) · **STORY-078** (registre `balance-service`) · **STORY-120/122** (paquets `bilan-service`)
**Priorité :** Should Have
**Story Points :** 2
**Complexité :** low — mais **elle porte un arbitrage**, pas seulement une valeur
**Statut :** review
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-08-07
**Sprint :** 20
**Service :** `frontend-admin-panel` (console) — ⚠️ **cible frontend**, tracée ici parce que l'arbitrage est backend
**Branche :** `MNV-293`
**Origine :** `tickets/TICKET-BACKEND-referentiels-attribuables-mais-non-servis.md` ③ — ouvert par la maquette **FE-056**

---

## Le défaut

```ts
// frontend-admin-panel/src/features/provisioning/config/vertical-packs.ts:76
Finance: { …, referentiel: { code: "sfd-bceao", version: "1.3" }, … }
```

**`sfd-bceao@1.3` n'existe nulle part** :

| Où | Ce qui y est |
|---|---|
| `balance-service` (manifeste) | `sfd-bceao@2.0` |
| `bilan-service` (assets) | `sfd-bceao-1.0.json`, `sfd-bceao-2.0.json` |
| `platform-catalog-service` | **aucune version en dur** — les paquets sont **déposés à l'exécution** (STORY-149) |
| `referentiel-version.schema.ts:10` | `sfd-bceao@1.3` … **en exemple de documentation** |

Tout indique que la valeur a été reprise de l'**exemple du schéma** plutôt que d'un paquet réel.

## Ce que ça produit — et ce que ça ne produit pas

⚠️ **Le garde-fou de `plan.ts` a fonctionné.** L'assistant ne fait pas confiance au pack : il le
**confronte au catalogue réel** et bloque la ligne avec `reason: "referentiel-missing"` quand la version
n'y est pas. **Il n'y a donc pas de panne en production** — et c'est pour ça que cette story est
*Should*, pas *Must*.

Restent deux issues, dont aucune n'est acceptable durablement :

1. le catalogue ne publie pas `1.3` ⇒ **le vertical Finance n'est pas provisionnable du tout**, et
   l'écran l'annonce comme une offre ;
2. un opérateur dépose `1.3` pour débloquer l'assistant ⇒ l'organisation reçoit un code que
   `balance-service` **ne sait pas charger** ⇒ `500 REFERENTIEL_UNAVAILABLE` à la première balance.
   La console aurait alors *provisionné* une organisation *cassée*.

## L'arbitrage à rendre — et c'est le vrai objet de la story

**Quelle version de SFD fait foi pour un octroi ?** Trois réponses défendables :

- **`2.0`** — ce que servent `balance-service` et `bilan-service` aujourd'hui. Réponse la plus simple, et
  probablement la bonne.
- **`1.0`** — l'artefact plus ancien encore présent côté `bilan-service`. À écarter sauf raison métier.
- **« pas de version en dur »** — le pack ne fige plus qu'un **code**, et l'assistant retient la
  **dernière version publiée et utilisable** du catalogue. C'est la réponse structurelle : elle supprime
  la classe entière de défaut au lieu de corriger une occurrence. Elle demande de trancher ce qu'est
  « la dernière utilisable » (statut `PUBLISHED`, pas `RETIRED`) et de l'afficher à l'écran, puisque
  l'opérateur doit savoir ce qu'il attribue.

⚠️ **Une version épinglée n'est pas un défaut en soi** — épingler protège d'un changement de plan
subi. Le défaut, c'est d'épingler une version **qui n'existe pas**. La story doit donc dire laquelle des
deux logiques le produit veut, pas seulement remplacer `1.3` par `2.0`.

---

## ✅ DÉCISION D-293-1 — la version reste ÉPINGLÉE ; ce qui change, c'est la **source d'autorité**

*Tranchée le 2026-08-11, au dev, après confrontation des deux manifestes réels.*

**Retenu : `sfd-bceao@2.0`, épinglé.** Et l'option 3 (« dernière version publiée utilisable du
catalogue ») est **écartée — non pas comme trop coûteuse, mais comme fausse.**

### Pourquoi l'option 3 est écartée

**Le catalogue n'est pas l'autorité sur ce qui est chargeable.** `balance-service` et `bilan-service`
résolvent un couple `code@version` contre un **manifeste compilé dans le service** —
`referentiel-registry.ts` + les octets de `assets/`, lus par `BundledArtifactSource`. Un dépôt au
catalogue (STORY-149) publie un **pointeur + un checksum** ; il n'apprend à **aucun** service à charger
quoi que ce soit.

Confier à la « dernière version publiée » le choix de ce qu'on attribue, c'est donc confier la décision
à la partie qui **ne peut pas l'honorer** : un opérateur qui dépose `sfd-bceao@3.0` verrait la console
l'attribuer d'elle-même, et la première balance prendrait exactement le `500 REFERENTIEL_UNAVAILABLE`
que STORY-292 vient de fermer.

⚡ **L'option 3 ne supprime pas la classe de défaut : elle la rend irrelisable.** Aujourd'hui la
mauvaise valeur est un **littéral** qu'un humain lit dans un diff — c'est comme ça que ce défaut-ci a
été trouvé. Demain ce serait un choix pris à l'exécution que personne n'a écrit. On échangerait « une
version que personne ne sert, épinglée » contre « une version que personne ne sert, choisie
automatiquement ».

### Pourquoi `2.0` et pas `1.0`

`2.0` est la **seule** version de SFD servie par les **deux** services : `bilan-service` porte `1.0`
**et** `2.0`, `balance-service` ne porte que `2.0`. Épingler `1.0` produirait un bilan qui s'ouvre et
une balance qui rend 500 — le même défaut, déplacé d'un service.

### Ce que l'épinglage exige en retour — et qui manquait

Épingler n'est légitime **que** si quelque chose confronte la valeur épinglée à ce que les services
servent. C'est la pièce absente, et c'est le livrable de code de la story : un **jeu de référence**
(`referentiels-servis.ts`) qui recopie explicitement les deux manifestes, et un **test** qui échoue si
un pack épingle un couple absent de ce jeu ou non servi par les deux services (AC 3).

⚠️ **Ce jeu de référence est un MIROIR, pas une source** — la console n'appelle ni `balance-service` ni
`bilan-service` (`scripts/gen-api.mjs` : `auth`, `kyc`, `catalog`, `admin`), donc rien ne peut le
dériver mécaniquement. Le risque résiduel n'est pas supprimé, il est **déplacé et nommé** :
`GAP-jeu-de-reference-referentiels-miroir-manuel`.

---

## Confrontation des quatre packs au réel (AC 2)

Relevé le 2026-08-11 sur les deux manifestes embarqués — `balance-service`
`src/modules/referentiel/referentiel-registry.ts` et `bilan-service`
`src/modules/bilan/referentiel/referentiel-registry.ts`.

| `code@version` | `balance-service` | `bilan-service` | Attribuable ? |
|---|---|---|---|
| `syscohada-revise@2.1` | ✅ packagé | ✅ packagé | **oui** |
| `sfd-bceao@2.0` | ✅ packagé | ✅ packagé | **oui** |
| `cima-assurances@1.0` | ✅ packagé (STORY-292) | ✅ packagé (STORY-122) | **oui** |
| `sfd-bceao@1.0` | ❌ absent du manifeste | ✅ packagé | **non** — bilan ouvrirait, balance rendrait 500 |
| `zone-franche-togo@1.0` | ❌ absent du manifeste | ✅ packagé | **non**, et aucun pack ne le cible |
| `smt-togo@1.0` | ⚠️ déclaré `nonPackage` (409) | ❌ absent | **non** — `GAP-smt-non-package`, refus voulu |
| `sfd-bceao@1.3` | ❌ | ❌ | **n'existe nulle part** — le défaut de cette story |

Verdict pack par pack :

| Pack | Épinglé avant | Après | Écart |
|---|---|---|---|
| Distribution | `syscohada-revise@2.1` | inchangé | aucun |
| Expertise comptable | `syscohada-revise@2.1` | inchangé | aucun |
| Assurance | `cima-assurances@1.0` | inchangé | aucun **depuis STORY-292** — il était faux la veille |
| **Finance** | `sfd-bceao@1.3` | **`sfd-bceao@2.0`** | **corrigé** |

⚠️ **Le pack Assurance mérite d'être noté plutôt que coché** : `cima-assurances@1.0` n'est devenu
servable par la balance que le 2026-08-10 (STORY-292). Les deux packs qui étaient faux l'étaient pour la
**même raison** — une valeur écrite dans la console sans confrontation — et un seul a été trouvé par
hasard. C'est l'argument central de l'AC 3.

### ⛔ Écart trouvé au passage, NON corrigé ici : `sfd-bceao@2.0` n'a pas les mêmes octets dans les deux services

En confrontant les manifestes, les checksums déclarés pour **le même couple** divergent :

| | sha256 déclaré **et réel** de `sfd-bceao-2.0.json` |
|---|---|
| `bilan-service` | `07b4ec22efa111ad698cf13528f0a3a53feba81ce82d1d47493e6a9ce711b620` |
| `balance-service` | `ee9bf014aa21e06d611ed1d964093f234efe24a66d099df7408f1dfa60dd11fe` |

La copie de `balance-service` est l'état **antérieur à l'incrément 2 de STORY-120** : dans sa
`tableDePassage`, `BAT`/`BPT` sont encore portés par les états de détail (`BILAN_ACTIF`/`BILAN_PASSIF`)
sans `etatSource` sur leurs opérandes, et `BP4` n'a **pas** `role: "RESULTAT_BILAN"`. Les quatre autres
sections (`meta`, `regles`, `planDeComptes`, `postes`) sont **identiques**.

Ce qui rend l'écart notable, ce n'est pas son effet — il est **nul aujourd'hui** (`balance-service` ne
lit jamais `role`, et sa résolution de `BAT`/`BPT` retombe sur le même ensemble de postes par le défaut
« `etatSource` absent ⇒ même état que le total ») — c'est que **l'invariant D-078-2 est documenté comme
vérifié alors qu'il ne l'est pas** : `referentiel-assets-coherence.spec.ts` affirme la « byte-identité
inter-services » en comparant l'asset de `balance-service` à `ee9bf014…`, une constante annoncée
« recopiée du manifeste de `bilan-service` » **qui n'y figure pas**. Le test compare donc la copie
périmée à elle-même : il est **tautologique entre services** et n'a aucun pouvoir de détection sur le
risque R1 qu'il prétend couvrir. `bilan-service` a bel et bien régénéré le paquet sans `balance-service`,
et le test est resté vert. Même motif que le constat ⑤ de STORY-292 et le test tautologique de
STORY-149.

**Non corrigé ici** — hors périmètre : la correction vit dans `balance-service` (recopier les octets,
puis re-vérifier le moteur fiscal qui lit `tableDePassage`), et le test qui la garderait vraiment doit
lire le manifeste de l'**autre** dépôt. ⇒ `GAP-sfd-bceao-2-0-octets-divergents` (`sprint-status.yaml` → `open_contract_gaps`), avec
le relevé complet et le mutation-test exigé de la correction.

---

## Périmètre

1. Trancher l'arbitrage ci-dessus (décision consignée dans la story).
2. Appliquer la décision au pack **Finance**, et **vérifier les trois autres packs** au passage :
   `syscohada-revise@2.1` (Distribution, Expertise comptable) et `cima-assurances@1.0` (Assurance) —
   confronter chacun à ce que les services servent réellement.
3. **Empêcher la récidive** : un test qui échoue si un pack déclare un couple `code@version` absent du
   jeu de référence. Aujourd'hui, rien n'empêche d'écrire une version inventée dans ce fichier.
4. Le message de blocage de l'assistant doit **nommer la version attendue et ce qui est publié** —
   « référentiel manquant » ne dit pas à l'opérateur ce qu'il doit déposer.

### Hors périmètre

- **Publier un paquet au catalogue** — c'est un geste d'exploitation (STORY-149), pas de code.
- **`cima-assurances@1.0` côté balance** — c'est **STORY-292**.
- La logique de dépôt/immutabilité des artefacts (déjà livrée).

---

## Critères d'acceptation

1. Le pack Finance n'attribue plus une version que personne ne sert ; la décision est **écrite** dans le
   fichier, avec sa raison.
2. Les **quatre** packs sont confrontés à ce que servent les services ; tout écart restant est **nommé**
   (commentaire + gap), jamais laissé muet.
3. Un test échoue si un pack déclare un couple `code@version` hors du jeu de référence — la protection
   est **mécanique**, pas une relecture.
4. Le blocage de l'assistant nomme **la version attendue** et **ce que le catalogue publie**.
5. Provisionner une organisation Finance de bout en bout aboutit à un entitlement dont le référentiel
   **se charge** côté `balance-service` (⚠️ dépend de la version retenue — à vérifier en réel, pas sur la
   foi de la config).
6. `lint` · `typecheck` · `build` · tests verts.

---

## Progress Tracking

**Statut : `review` — 2026-08-11.** Développement, validation, revue de code et revue de sécurité
**terminés** ; deux commits prêts sur la branche locale `MNV-293` du dépôt `frontend-admin-panel`
(`d2f60eb` feature + `97d61e3` correctifs de revue).

⛔ **BLOQUÉ AU PUSH — droit manquant, pas un problème de code.** Le compte
`vivianMoneyVibesGroupes` n'a que la **lecture** sur `MoneyVibesGroup/frontend-admin-panel` :

```
frontend-admin-panel          admin=false push=false pull=true
prospera-balance-service      admin=false push=true  pull=true
prospera-stories              admin=false push=true  pull=true
```

`git push` répond `remote: Write access to repository not granted.` La story ne peut donc pas passer
`done` : il n'y a ni PR, ni merge. **Action requise de l'user** : accorder le droit d'écriture sur
`frontend-admin-panel` (ou pousser la branche depuis un compte qui l'a), après quoi il ne reste que
`git push -u origin MNV-293`, l'ouverture de la PR sur `dev`, le rebase-merge et le passage des trois
statuts à `done` + `completed_date`.

⚠️ Le dépôt **`prospera-frontend-admin-panel`** existe aussi dans l'organisation mais il est **vide**
(`size: 0`, dernier push le 2026-07-12) : le dépôt vivant est bien **`frontend-admin-panel`**
(`size: 1581`, dernier push le 2026-08-10). Il n'était pas cloné dans le workspace — il l'est
désormais.

### Ce qui a été livré

| Fichier | Rôle |
|---|---|
| `src/features/provisioning/config/referentiels-servis.ts` | **neuf** — jeu de référence : les 6 couples des deux manifestes backend, qui les sert, et le prédicat `verdictReferentiel` à trois issues (`attribuable` / `inconnu` / `servi-partiellement`) |
| `src/features/provisioning/config/vertical-packs.ts` | pack Finance `1.3` → **`2.0`**, décision D-293-1 écrite au-dessus de la valeur ; note sur le pack Assurance (juste, mais faux la veille) |
| `src/features/provisioning/config/vertical-packs.test.ts` | **neuf** — la garde de l'AC 3 : les 4 packs confrontés au jeu de référence, message d'échec nommant pack + couple + valeur attendue |
| `src/features/provisioning/plan.ts` | `values` porte `published` / `publishedCount` — seules les versions **utilisables**, triées numériquement ; `values?: Record<string, string \| number>` |
| `src/features/provisioning/components/pack-list.tsx` | étalement de `line.values` dans `t()` |
| `src/features/provisioning/components/pack-list.test.tsx` | **neuf** — le motif rendu avec les **vrais** messages `fr.json` (l'ICU `plural` imbriqué n'est prouvé que par un rendu) |
| `src/i18n/messages/fr.json` | `referentiel-missing` / `referentiel-unusable` nomment l'attendu **et** le publié, avec branche `=0` distincte |

### Portes de qualité

`typecheck` 0 erreur · `lint` **0 erreur** (3 warnings **préexistants**, dans des fichiers non touchés :
`version-form-dialog.tsx`, `entitlements-client.ts`, `kyc-client.ts`) · `build` OK (16 routes) ·
**560 tests / 61 fichiers verts** (dont 17 neufs sur `vertical-packs.test.ts` et 4 sur
`pack-list.test.tsx`).

⚠️ `package-lock.json`, modifié par `npm install` sur cette machine (flags `peer`, binaires optionnels
d'architecture), a été **remis en état** : cette story ne touche aucune dépendance.

### Revue de code — 4 constats, 4 corrigés (commit dédié `97d61e3`)

Aucun bloquant. Mais **deux des quatre portaient sur des affirmations FAUSSES** écrites dans le commit
de feature — le pire type de constat, puisqu'on s'appuie dessus ensuite pour raisonner.

| # | Constat | Correctif |
|---|---|---|
| ① | Le commentaire de `values` annonçait qu'un `publishedCount` en **chaîne** ferait échouer `Intl.PluralRules`. **Faux** : `intl-messageformat` coerce (`value - offset`) et résout `=0` par comparaison de chaîne — `"0"` rend la même phrase, sans erreur | le commentaire dit désormais que le `number` est une **discipline de contrat, pas un garde-fou**, et renvoie à ce qui protège vraiment (le rendu testé) |
| ② | `expect(...).not.toMatch(/[{}]/)` présenté comme « la garde qui pince une clé manquante » : **verte par construction** — next-intl ne lève pas et ne laisse jamais `{published}` à l'écran, il retombe sur le **chemin de clé** (`provisioning.blocked.referentiel-missing` en clair) | la garde pince le chemin de clé ; **mutation 7** (étalement retiré) ⇒ 🔴 5 tests |
| ③ | La branche `=0` disait « le catalogue ne publie **aucune version** de {code} » alors que `publishedCount` ne compte que les versions **utilisables** ⇒ sur un code présent en version retirée + version au checksum invalidé, le message affirme un **fait faux** (l'onglet Référentiels de la même console en affiche deux) | les 4 branches disent « **utilisable** » ; test neuf sur ce cas exact ; **mutation 8** (ancienne formulation) ⇒ 🔴 2 tests |
| ④ | `published` joint dans la couche **pure**, contre l'invariant que le champ énonce (« jamais du texte tout fait ») — mettre une énumération en forme est une décision de locale | entorse **assumée et écrite comme telle** (une seule locale, `values` ne transporte pas de tableau), avec le point de bascule nommé |

⚡ Le constat ② est le plus instructif : la mutation 5 du commit de feature **était** rouge (4 tests), donc
le fichier avait bien un pouvoir de détection — mais il venait d'un **effet de bord non énoncé** (la
phrase disparaît, donc `getAllByText` ne trouve rien), pas de l'assertion présentée comme la garde. Un
test peut être rouge sous mutation **et** documenter le mauvais mécanisme.

### Revue de sécurité — AUCUNE vulnérabilité

⚠️ Le skill `prospera-security-review` exige une PR ouverte pour s'exécuter ; aucune PR n'existant (push
refusé), l'analyse a été faite **en session, en `opus`** sur le diff local — ce que la règle du projet
autorise (les revues restent en `opus` ; la délégation du **scan** est une option, pas une obligation).

- **XSS** : le motif est rendu en `{why}` dans un `<p>`, sans `dangerouslySetInnerHTML` ni `t.rich` ;
  `t()` rend une chaîne, React l'échappe.
- **Divulgation** : l'écran est derrière `RequirePlatformAdmin` (layout `(app)`) et `useReferentiels()`
  charge **déjà** la liste complète des référentiels dans cette même page ⇒ nommer les versions publiées
  n'apprend rien de nouveau à personne.
- **Pollution de prototype** : `...line.values` étale un objet à **4 clés littérales** construit par
  `plan.ts` ; aucun nom de clé ne provient d'une entrée.
- Aucun changement d'auth, de RBAC, d'isolation tenant, de secret, d'endpoint, de CORS, de Kafka ni de
  Docker. Le changement de valeur octroyée est **validé en amont** (422 sur un couple inconnu, mesuré).

### Mutation-testing — 8 mutations, 8 rouges

Un test qu'un code bugué franchit est une fausse assurance. Chaque mutation a été **vérifiée appliquée**
(`mut.py` refuse si le motif n'apparaît pas exactement une fois — leçon STORY-182) puis le fichier
**restauré par copie sha-vérifiée**, jamais par `git checkout` (leçon STORY-144).

| # | Mutation | Effet |
|---|---|---|
| 1 | pack Finance remis à `1.3` | 🔴 2 tests — message : « pack Finance : `sfd-bceao@1.3` n'est pas attribuable (inconnu) — servies par les deux services pour `sfd-bceao` : 2.0 » |
| 2 | `SERVICES_REQUIS` réduit à `["bilan-service"]` | 🔴 3 tests — la règle « **les deux** services » est porteuse, pas décorative |
| 3 | filtre `isReferentielUsable` retiré du calcul de `published` | 🔴 3 tests (plan **et** rendu) |
| 4 | `.sort(compareVersions)` → `.sort()` | 🔴 1 test — `2.10, 2.9` au lieu de `2.9, 2.10` |
| 5 | `...line.values` retiré de l'appel à `t()` | 🔴 **4 tests** — next-intl n'interpole plus, le motif disparaît de l'écran |
| 6 | mensonge dans le miroir : `sfd-bceao@1.3` déclaré servi par les deux | 🔴 4 tests — le relevé est **verrouillé** : élargir le miroir exige un second acte délibéré |
| 7 | *(après revue)* `...line.values` retiré de `t()` | 🔴 5 tests — dont la garde **corrigée** du chemin de clé i18n |
| 8 | *(après revue)* branche `=0` remise à « ne publie aucune version » | 🔴 2 tests — la formulation fausse est pincée |

⚡ **La mutation 3 a fait apparaître une faiblesse de mes propres assertions** : `toHaveTextContent`
cherche une **sous-chaîne**, donc une liste polluée d'une version en trop (`1.9, 2.0, 2.1`) restait
verte. Les deux assertions de liste ont été **ancrées** sur ce qui suit la liste (regex ` — pas 2.1.`),
et la mutation rejouée : elle pince désormais le plan **et** le rendu. Une garde sur une liste qui ne
borne pas sa fin ne garde que son début.

### Vérification docker réelle (AC 5) — stack neuve (`down -v`)

Stack : `mongo` `kafka` `redis` `minio` `auth-service` `platform-catalog-service` `balance-service`
`bilan-service` `admin-panel`, tous `/health` verts. `PLATFORM_ADMIN` semé, JWT RS256 réels (admin
plateforme **et** propriétaire d'organisation).

**Chaîne complète jouée comme la joue la console** : catalogue peuplé (6 modules du pack Finance + leurs
versions `ACTIVE` + `referentielFamilies: ["sfd-bceao"]`), `sfd-bceao@2.0` publié au catalogue, org
`IMF Vérif STORY-293` enregistrée, puis les 6 `PUT /catalog/entitlements/:org/:module` du runner →
**201 sur les six**.

⚠️ Premier essai en **422 `REFERENTIEL_NOT_APPLICABLE`** sur les six : un module sans
`referentielFamilies` n'accepte aucun référentiel (STORY-148). Ce n'est pas un défaut — c'est la garde
amont qui fonctionne — mais **la console ne le dit pas** : `plan.ts` n'a pas de motif
`referentiel-not-applicable`, l'octroi part et échoue en vol. Tracé (voir écarts ci-dessous).

**① Le référentiel retenu se charge — la substance de l'AC 5.** `GET /api/v1/referentiels/actifs`
avec le jeton du propriétaire, après projection Kafka `entitlement.changed` prouvée en base
(`orgbalanceentitlements` : 1 document, `referentiel: { code: 'sfd-bceao', version: '2.0' }`,
`status: ACTIVE` ; `processed_events` : 1) :

```
200 · planCount 156 · reglesCount 6 · integrity "verified"
checksum ee9bf014aa21e06d611ed1d964093f234efe24a66d099df7408f1dfa60dd11fe
libellé « SFD-BCEAO — Référentiel Comptable Spécifique des SFD de l'UMOA (version complète) »
```

**② Contrôle négatif — les deux versions écartées échouent, sur le même chemin :**

| Référentiel forcé dans le read-model | `balance-service` |
|---|---|
| `sfd-bceao@1.3` — l'ancienne valeur du pack | **500 `REFERENTIEL_UNAVAILABLE`** |
| `sfd-bceao@1.0` — la variante écartée de l'arbitrage | **500 `REFERENTIEL_UNAVAILABLE`** |
| **`sfd-bceao@2.0`** — la décision | **200**, `planCount 156`, `integrity verified` |

L'arbitrage n'est donc pas un raisonnement : il est **mesuré**. `1.0` échoue bel et bien côté balance,
ce qui écarte la variante « 1.0 » par le fait.

**③ Les 6 lignes du jeu de référence confrontées une par une au service réel** — les trois formes de
refus sont distinctes, exactement comme le miroir les décrit :

| Couple | `balance-service` réel | Jeu de référence |
|---|---|---|
| `syscohada-revise@2.1` | 200 · planCount **174** · verified | servi par les deux ✅ |
| `sfd-bceao@2.0` | 200 · planCount **156** · verified | servi par les deux ✅ |
| `cima-assurances@1.0` | 200 · planCount **80** · verified | servi par les deux ✅ |
| `sfd-bceao@1.0` | **500** `REFERENTIEL_UNAVAILABLE` | `bilan-service` seul ⛔ |
| `zone-franche-togo@1.0` | **500** `REFERENTIEL_UNAVAILABLE` | `bilan-service` seul ⛔ |
| `smt-togo@1.0` | **409** `REFERENTIEL_NON_PACKAGE`, motif conservé | déclaré, non servi ⛔ |

**④ La vraie `buildPackPlan` contre le catalogue RÉEL** (snapshot du service, pas une fixture) —
avant/après, catalogue identique :

```
pack à 1.3  → { create: 0, blocked: 6 }   6 × referentiel-missing
pack à 2.0  → { create: 6, blocked: 0 }   le vertical Finance devient provisionnable
```

### ⛔ Écarts trouvés à la vérification, NON corrigés — nommés, pas laissés muets (AC 2)

**⚡⚡ ① Aucun pack n'octroie le module que `balance-service` écoute.** Le plus lourd des trois, trouvé
uniquement parce que l'AC 5 exigeait d'aller jusqu'au bout en réel.

`balance-service` ne projette que le module de code **`balance`**
(`BALANCE_MODULE_CODE = 'balance'`, `entitlement.projection.service.ts:13`) et sa gate
`@RequiresBalanceAccess` exige cet entitlement-là. Or **aucun des quatre packs ne liste `balance`** :
tous listent `bilan`, qui est le module de `bilan-service` (`BILAN_MODULE_CODE = 'bilan'`).

**Mesuré, pas déduit.** Après les 6 octrois du pack Finance et le KYC porté à `APPROVED` dans le
read-model local (pour isoler le contrôle d'entitlement du contrôle KYC) :

```
GET /api/v1/whoami/balance-access → 403 BALANCE_NOT_ENTITLED
GET /api/v1/referentiels/actifs   → 403 BALANCE_NOT_ENTITLED
```

Les logs du service le disent ligne à ligne : les 6 événements arrivent et sont tous
« ignoré (non-balance) ». **Provisionner un vertical par la console laisse donc l'Atelier Balance fermé,
pour les quatre verticaux.** Il a fallu créer et octroyer `balance` à la main pour que le référentiel
se résolve — c'est ce qu'a fait l'étape ① ci-dessus.

**Non corrigé, et volontairement** : ajouter un module aux quatre packs change ce que « activer ce
secteur » octroie — c'est une **décision produit** (quels verticaux reçoivent l'Atelier ?), pas une
correction de config. ⇒ `GAP-packs-verticaux-sans-module-balance` (`sprint-status.yaml` → `open_contract_gaps`),
qui porte l'arbitrage à rendre et le test à exiger.

**② `sfd-bceao@2.0` n'a pas les mêmes octets dans les deux services**, et le test qui prétend le
garder est tautologique entre services. Détaillé plus haut. ⇒ `GAP-sfd-bceao-2-0-octets-divergents`.

⚠️ Corollaire mesuré au passage : le catalogue ne porte **qu'un** checksum par couple. Celui déposé ici
(`ee9bf014…`, les octets de `balance-service`) est donc faux pour `bilan-service` (`07b4ec22…`) — quel
que soit le choix, un des deux services est en désaccord avec la fiche que la console affiche.

**③ La console ne connaît pas le refus `REFERENTIEL_NOT_APPLICABLE`.** `plan.ts` bloque sur
`referentiel-missing` / `referentiel-unusable` mais n'a aucun motif pour « ce module ne consomme aucun
référentiel » — alors que `CatalogModule.referentielFamilies` est servi depuis STORY-148 et que l'amont
rend 422. Une ligne annoncée « à créer » part donc et échoue en vol, avec un message d'erreur brut.
⇒ `GAP-console-ignore-referentiel-not-applicable`.

**Stack arrêtée** (`docker compose stop`) une fois le relevé consigné.

---

## Liens

- Ticket d'origine : `tickets/TICKET-BACKEND-referentiels-attribuables-mais-non-servis.md` ③
- `GAP-version-sfd-console-vs-services` (`sprint-status.yaml` → `open_contract_gaps`)
- **STORY-292** — même famille de défaut : ce que la console attribue doit être ce que les services
  savent charger. 292 étend le service, 293 corrige l'attribution.

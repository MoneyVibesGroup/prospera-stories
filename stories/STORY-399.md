# STORY-399 : Le contenu du référentiel n'est lisible par aucune route — et le serveur valide contre lui

Status: in_progress

**Épic :** EPIC-010 — Référentiels & table de passage (FR-005..FR-008)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/referentiel`
**Points :** 5 · **Sprint :** S20 · **Complexité :** medium
**Origine :** remontée le **2026-08-24** par **FE-030**, en dessinant le dialogue
d'affectation d'un compte non reconnu.

---

## Le fait, relevé à la source

`GET /dossiers/{id}/bilan/referentiel` publie **des compteurs**, jamais du contenu :

```ts
planCount:    resolved.package.planDeComptes.length,   // 918
postesCount:  resolved.package.postes.length,          // 214
mappingCount: resolved.package.tableDePassage.length,  // 371
```

Et `MappingOverrideService.proposer` **valide contre cette liste invisible** :

```ts
const posteExiste = pkg.postes.some(
  (p) => p.etat === input.cible.etat && p.code === input.cible.poste,
);
if (!posteExiste) throw new UnprocessableEntityException({ code: 'POSTE_INCONNU' });
```

⛔ **Aucun contrôleur du service n'expose `pkg.postes` ni `pkg.planDeComptes.`** Vérifié :
`postes` n'apparaît dans aucun `*.controller.ts` autrement que sous forme de `.length`.

⚠️ Et le refus n'est même pas au contrat : l'OpenAPI de `POST …/mapping-overrides`
documente **403, 404 et 409** — pas le **422 `POSTE_INCONNU`**, qui est pourtant le refus
le plus probable de la route.

---

## Ce que ça coûte, concrètement

Pour affecter un compte non reconnu, le comptable doit fournir un couple
`(état, code de poste)` que **rien ne lui montre** : il le tape de mémoire, ou depuis une
liasse papier, pour recevoir un `422`. Il n'y a pas de troisième possibilité — ni liste
déroulante, ni autocomplétion, ni message qui nommerait les valeurs admises.

⚠️ **Second manque, moins visible, et il touche la lecture** : le regroupement d'une
balance **par classe comptable** (« Classe 4 — Tiers ») a besoin des **libellés de
classe**, qui vivent dans `planDeComptes[].classe`. Ne pas les servir laisse deux choix,
tous deux mauvais : afficher « Classe 4 » nu, ou **écrire les libellés SYSCOHADA en dur
côté front** — ce qui casserait l'invariant **P7** (moteur ⊥ référentiel) et serait
**faux pour SFD-BCEAO et CIMA**. C'est exactement la dette que
`TICKET-FRONTEND-retrait-dictionnaire-plan-comptes` a fait retirer une fois déjà.

⇒ **Contournement en place (FE-030), volontairement déclaré partiel** : le dialogue
propose les **postes observés dans la balance courante** (extraits de `mappes[]`), affiche
en tête que **la liste est partielle** — « le référentiel compte 214 postes, seuls les N
atteints par un compte de cette balance sont proposés » —, laisse une **saisie libre**, et
rend le `422` **verbatim** dans le dialogue, à côté du champ fautif. Le regroupement par
classe affiche « Classe 4 » **sans libellé**.

⚡ Ce contournement a un angle mort structurel : **le poste dont on a besoin pour un
compte inhabituel est précisément celui qu'aucun autre compte n'a atteint.**

---

## Périmètre

**Inclus**

- Une route de lecture qui rend le **contenu du référentiel effectif** de l'organisation.
  La forme la plus simple qui serve : `GET /dossiers/{id}/bilan/referentiel/postes` →
  `[{ etat, code, libelle, note? }]`, et `…/referentiel/plan-de-comptes` →
  `[{ numero, libelle, classe }]`. Une seule route portant les deux volets convient aussi.
- Les deux rendent **exactement** `pkg.postes` / `pkg.planDeComptes` — la **même source**
  que la validation, jamais une liste parallèle.
- Mêmes gates que le reste du module (`@RequiresDossierScope` + `@RequiresBilanAccess`),
  et mêmes refus de référentiel (`REFERENTIEL_UNRESOLVED`, `…_INTEGRITY`, …).
- **Documenter `422 POSTE_INCONNU`** sur `POST …/mapping-overrides` — le code existe, il
  n'est simplement pas publié.

**Hors périmètre**

- Un moteur de recherche ou une pagination : 214 postes et 918 comptes se servent en une
  fois, et le paquet est **déjà en cache** côté serveur.
- Enrichir les paquets `syscohada-revise` / `sfd-bceao` : cette story **expose** ce qu'ils
  contiennent, elle n'y ajoute rien.

---

## Critères d'acceptation

1. Une route de lecture rend les **postes** du référentiel effectif (`etat`, `code`,
   `libelle`), typés au contrat — pas en `Record<string, never>`.
2. Une route de lecture rend le **plan de comptes** normalisé (`numero`, `libelle`,
   `classe`).
3. Un test vérifie que la liste des postes rendue est **exactement** celle contre laquelle
   `MappingOverrideService.proposer` valide, en lisant la **même** source.
4. Un référentiel non résolu / non intègre produit les **mêmes** refus que les autres
   routes du module, jamais un 200 avec une liste vide.
5. `422 POSTE_INCONNU` est documenté sur `POST …/mapping-overrides`.

---

## Notes

- ⚠️⚠️ **TROISIÈME OCCURRENCE DE LA MÊME FORME**, après **STORY-394** (« aucune route
  n'énumère les comptes de classe 7 », FE-043) et **STORY-397** (« les codes de
  réintégration sont validés sans être publiés », FE-044). Trois occurrences dans trois
  services différents en une semaine : ce n'est plus un oubli isolé, c'est un **angle mort
  de conception**. ⇒ **Toute validation fail-closed contre un référentiel a besoin de sa
  route de lecture**, sinon elle rend l'écran inutilisable là où elle voulait le protéger.
  Cette phrase mérite d'être une **règle d'architecture**, pas la note d'une troisième
  story.
- ⚠️ **Recouvrement avec STORY-400** (affectation par racine) : les deux touchent le même
  dialogue et la même route d'écriture. Les livrer ensemble évite deux passes de front.
- Consommateur nommé : **FE-030** (dialogue d'affectation + regroupement par classe).

---

## Progress Tracking

**Statut : `in_progress`** — dev terminé le **2026-08-27**, branche `MNV-399` ouverte sur
`docs` et sur `bilan-service`. Portes vertes, vérification docker faite. En attente de revue.

⚠️ **Un seul dépôt de code** : la story n'expose que de la lecture HTTP, aucun contrat
d'événement Kafka n'est touché.

### ⚠️ Trois prémisses de la story corrigées à la mesure

**① Les chiffres du §*Le fait* ne sont pas ceux du paquet embarqué.** La story annonce
`planCount: 918`, `postesCount: 214`, `mappingCount: 371`. Le paquet réellement servi —
`syscohada-revise@2.1`, mesuré sur le service en docker — en compte **174 / 163 / 124**.
Le raisonnement de la story n'en est pas affecté (« se servent en une fois », le hors
périmètre pagination) : il l'est même *a fortiori*. Mais les chiffres eux-mêmes ne
doivent pas être recopiés ailleurs.

**② `note` n'est pas optionnelle, elle est *présente et nulle*.** La forme proposée par le
périmètre est `[{ etat, code, libelle, note? }]`. Or **les cinq paquets embarqués écrivent
tous la clé** (mesuré : 149 `null` et 14 renvois sur les 163 postes SYSCOHADA). Elle est
donc publiée **REQUISE et `nullable`** — patron STORY-398 : `null` porte le fait « pas de
renvoi » là qu'une clé absente n'en porterait aucun, et le client n'a qu'un seul cas
d'absence à traiter au lieu de deux. La normalisation `note ?? null` du contrôleur est ce
qui rend ce `required` **vrai** si un paquet futur omettait la clé.

⚡ **Et la mutation le dit sans complaisance** : retirer cette normalisation ne fait rougir
que le **test unitaire** — les deux e2e restent verts, parce qu'aucun paquet embarqué ne
produit aujourd'hui la clé absente. La normalisation est donc **inerte sur les paquets
actuels** ; c'est le contrat publié (`required`) qu'elle honore, pas un cas observé. Le
dire évite de croire la garde e2e plus large qu'elle n'est.

**③ `classe` n'est pas bornée à `1..8`.** Le commentaire de `CompteReferentiel` annonce
« 1..8 en SYSCOHADA », et un `minimum: 1` semblait donc gratuit. Il aurait été **faux** :
`cima-assurances@1.0` déclare **8 comptes en classe `0`** (engagements hors bilan `00`,
`01`, `03`, `05`…). Un client générant sa validation depuis le schéma aurait refusé des
comptes que le serveur sert — pour le vertical Assurance seulement, donc invisible en
recette SYSCOHADA. Aucune borne n'est publiée, et la mutation n°8 le garde.

### Livré

- `GET /dossiers/{id}/bilan/referentiel/postes` → `[{ etat, code, libelle, note }]` (AC-1)
- `GET /dossiers/{id}/bilan/referentiel/plan-de-comptes` → `[{ numero, libelle, classe }]` (AC-2)
- Les deux sur `BilanDiagnosticsController`, à côté de `GET referentiel` dont elles sont le
  contenu : mêmes gates (`@RequiresDossierScope` + `@RequiresBilanAccess` + `@Roles` tenant)
  et **même** `toHttpFromReferentielError` que le reste du module (AC-4).
- `PosteEtatDto` / `CompteReferentielDto`, chacune `implements` son interface de domaine
  (patron STORY-398 : si l'interface bouge, la classe ne compile plus).
- `422 POSTE_INCONNU` documenté sur `POST …/mapping-overrides`, et **sa description nomme
  la route de lecture** — documenter le refus sans dire où lire les valeurs admises aurait
  laissé le comptable exactement où il était (AC-5).
- Le docblock de classe du contrôleur cesse d'annoncer les routes `referentiel*` comme
  jetables : FE-030 les consomme.

### AC-3 — ce qui est gardé, et comment

L'AC-3 ne demande pas une forme, elle demande une **identité de source**. La batterie e2e
câble donc le **vrai** `MappingOverrideService` (aucun mock) et lui soumet, un par un, les
**163 postes publiés** : tous doivent être acceptés. S'y ajoutent deux gardes que le seul
test « tout est accepté » ne donne pas :

- un **témoin de non-vacuité** — un couple absent de la liste publiée doit être refusé en
  `422` — sans lequel un `proposer` qui accepterait tout rendrait la batterie verte ;
- une **égalité de cardinalité** avec le `postesCount` historique, qui attrape le filtre
  partiel qu'un échantillon laisserait passer.

### Portes

Lint **0 warning** · build OK · **1163 unitaires** + **326 e2e** verts · couverture
**98,69 st / 93,69 br / 98,4 fn / 98,65 li** (seuils 65/90/90/90, jamais abaissés).

⚠️ `bilan-diagnostics.controller.ts` reste à 85 % : les lignes non couvertes (324-344,
371-391) sont les dry-run **TFT** et **notes annexes**, antérieurs et hors périmètre.

### Passe de mutation — 10 mutations, 10 rouges

| # | Mutation | Garde qui rougit |
|---|---|---|
| 1 | la normalisation `note ?? null` est retirée | unitaire AC-1 **seul** (cf. prémisse ②) |
| 2 | la liste des postes est filtrée sur un seul état | e2e AC-3 cardinalité + AC-3 exhaustif |
| 3 | les postes sont dérivés d'une **source parallèle** (`tableDePassage`) | e2e AC-3 exhaustif + cardinalité |
| 4 | le plan de comptes rend une liste vide | unitaire AC-2 + e2e AC-2 + contrat réel |
| 5 | les refus de référentiel ne sont plus traduits | unitaire AC-4 (×5 erreurs) + e2e AC-4 |
| 6 | `note` perd son `nullable` | contrat AC-1 + réponse RÉELLE |
| 7 | `note` perd son `type: String` **explicite** | **inventaire figé des objets opaques** + AC-1 |
| 8 | `classe` publie un `minimum: 1` | contrat AC-2 (la classe `0` de CIMA) |
| 9 | le `422` retombe hors du contrat | contrat AC-5 |
| 10 | la validation du poste cible est retirée | e2e AC-3 **témoin de non-vacuité** |

⚠️ **La mutation n°9 a d'abord rougi pour la mauvaise raison** : supprimer le décorateur
laissait son `import` inutilisé ⇒ la suite ne **compilait plus**, et « ROUGE » ne disait
rien de la garde. Rejouée en retirant décorateur **et** import : un seul test rouge, celui
de l'AC-5. C'est le piège déjà fiché en STORY-179 — une mutation rouge par erreur de
compilation est une mutation **non concluante**.

### Vérification docker — sur le service réel, pas sur un mock

Stack `mongo` + `auth-service` + `bilan-service`, org créée par `register`/`login` réels,
read-models (`orgkycstatuses`, `orgbilanentitlements`, `dossiers_dossier`) semés en
`mongosh`, JWT RS256 réel.

| Mesure | Résultat |
|---|---|
| document OpenAPI publié | **39 chemins** (+2), **80 schémas** (+2) |
| `…/referentiel/postes` | **200**, **163** objets, clés exactement `{code, etat, libelle, note}` |
| `…/referentiel/plan-de-comptes` | **200**, **174** objets, clés exactement `{classe, libelle, numero}` |
| cardinalité vs compteurs | **163 = `postesCount`** et **174 = `planCount`** |
| `note` | 149 `null`, 14 renvois, **0 clé absente** |
| `POST …/mapping-overrides` (poste publié) | **201** |
| idem, couple absent de la liste | **422 `POSTE_INCONNU`** (les deux sens : code inconnu, état inconnu) |
| écriture réelle | **2** documents dans `mapping_overrides` — **les deux 422 n'ont rien écrit** |
| entitlement `ACTIVE` sans référentiel | **409 `REFERENTIEL_UNRESOLVED`** sur les **trois** routes `referentiel*`, corps identique — **jamais** un `200` avec `[]` |

Le refus `REFERENTIEL_INTEGRITY` n'est pas reproductible sur l'artefact embarqué ; il passe
par **le même** `toHttpFromReferentielError` que les autres, et la mutation n°5 prouve que
retirer cette traduction fait rougir les cinq refus d'un coup.

### ⛔ Constat HORS PÉRIMÈTRE — quatre lignes d'en-tête du formulaire sont packagées en postes

Publier le contenu a rendu visible ce que le compteur cachait. `syscohada-revise@2.1`
déclare **quatre « postes » qui sont les lignes de titre du formulaire DSF** :

```
{ etat: "BILAN_ACTIF",     code: "Réf.", libelle: "ACTIF",    note: "NOTE" }
{ etat: "BILAN_PASSIF",    code: "Réf.", libelle: "PASSIF",   note: null }
{ etat: "COMPTE_RESULTAT", code: "Réf",  libelle: "LIBELLES", note: null }
{ etat: "TFT",             code: "Réf",  libelle: "LIBELLES", note: null }
```

« Réf. », « ACTIF », « NOTE » sont les **en-têtes de colonnes** de la liasse, transcrits
comme s'ils étaient des postes. Trois conséquences, mesurées en docker :

1. le dialogue de FE-030 proposera **« Réf. — ACTIF »** parmi les cibles ;
2. `POST …/mapping-overrides` **accepte** `(BILAN_ACTIF, "Réf.")` → **201** — vérifié. Une
   surcharge peut donc être proposée, validée par un administrateur, et cibler un poste
   qui n'existe pas dans la liasse : c'est le piège **« acceptée-validée-puis-inerte »**
   de STORY-400, atteint par une autre porte — celle du **paquet**, pas de la portée ;
3. `postesCount: 163` **surestime de 4**.

⛔ **Non corrigé ici, délibérément** : le hors-périmètre de la story est explicite —
« cette story **expose** ce que les paquets contiennent, elle n'y ajoute rien », et toucher
un paquet **change son checksum**, donc sa version (cf. STORY-428, même famille). ⇒ à
ouvrir en story dédiée, à instruire **avec STORY-428** (deux libellés pour le même poste)
et **STORY-427** (l'ordre légal n'existe que dans `pkg.postes`) : ce sont **trois défauts
de transcription du même artefact**, et les traiter en une passe évite trois changements
de version successifs.

⚡ La leçon de la story vaut donc dans les deux sens : ne pas publier une liste **cache
aussi ce qu'elle contient de faux**. Le compteur `163` n'a jamais pu détromper personne.

# STORY-435 : Le squelette TFT du paquet n'est pas le formulaire déposé — ni rubriques, ni ligne de besoin de financement, ni ligne de contrôle, ni renvois A…H

Status: done

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — paquet référentiel + `scripts/referentiels`, `referentiel-package.interface.ts`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-033** (TFT/TAFIRE, notes annexes, contrôles de cohérence), 2026-08-27.
Vérifié contre la DSF déposée `1000745307_2025_Definitif (1).xlsx`, feuille *« TFT »*.

---

## Le fait

Le paquet déclare **26 postes** `etat: 'TFT'` (en-tête comprise). Le formulaire déposé en
compte **31 lignes**, et les cinq manquantes ne sont pas décoratives :

| Manque | Ce qu'on perd |
|---|---|
| 4 **intitulés de rubrique** (« Flux de trésorerie provenant des activités opérationnelles », « …d'investissements », « …du financement par les capitaux propres », « Trésorerie provenant du financement par les capitaux étrangers ») | l'état devient une liste de 25 lignes sans structure |
| la ligne **« Variation du BF lié aux activités opérationnelles (FB+FC+FD+FE) »** | le sous-total métier du besoin en fonds de roulement |
| la ligne **« Contrôle : Trésorerie actif N − Trésorerie passif N »** en pied | **le contrôle que le formulaire porte lui-même** |
| les **renvois `A`…`H`** sur les huit lignes `Z` (`note` vaut `null` sur les **26** postes) | les libellés « *somme FA à FE* », « *(B+C+F)* », « *(G+A)* » deviennent **illisibles** : rien ne dit quelle ligne est `B` |
| le **renvoi de bas de page `(1)`** | `FB` et `FE` portent l'appel « (1) » dans leur libellé et renvoient à une note **qui n'existe pas** — or elle énonce la règle d'exclusion des créances d'investissement |

## Critères d'acceptation

- [x] AC-1 — `PosteEtat` gagne un `type: 'RUBRIQUE' | 'LIGNE' | 'CONTROLE'` (défaut `'LIGNE'`,
      rétrocompatible). Les rubriques n'ont ni montant ni opérandes ; le moteur ne les évalue pas.
- [x] AC-2 — Le paquet `syscohada-revise@2.1` gagne les 4 rubriques, la ligne de BF (avec ses
      opérandes `FB+FC+FD+FE`) et la ligne de contrôle (opérandes : postes marqués `tresorerie`),
      **dans l'ordre du formulaire** — c'est-à-dire dans `pkg.postes`.
- [x] AC-3 — Les huit postes `Z` portent leur `note` (`A`…`H`).
- [x] AC-4 — Le paquet porte les **renvois de bas de page** de l'état (`renvois: {"1": "À
      l'exclusion des variations des créances et dettes liées aux activités d'investissement…"}`),
      pour que l'appel « (1) » des libellés de `FB`/`FE` ait une cible.
- [x] AC-5 — Un test **de forme** : la suite des codes de `pkg.postes` filtrée sur `etat: 'TFT'`
      égale la constante extraite du formulaire. Il échoue si quelqu'un réordonne le paquet.
- [x] AC-6 — Agnosticisme P7 : un référentiel sans TFT (`sfd-bceao@2.0`) est inchangé.

## Conséquences ailleurs

- Même famille que **STORY-427** (ordre légal, lignes à zéro, colonne Note du compte de résultat)
  et **4ᵉ occurrence** de « l'ordre légal ne vit que dans `pkg.postes`, qu'aucune route ne publie »
  (**STORY-399**). La maquette FE-033 dessine ces cinq lignes **d'après le formulaire**, pas
  d'après le contrat — et le dit à l'écran.

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker rejouée
sur l'état final**, PR `bilan-service` **#66** (3 commits) et `balance-service` **#87** (2 commits)
rebase-mergées **ensemble** sur `dev` le 2026-09-02.

### Ce qui est livré

| AC | Livré |
|---|---|
| AC-1 | `PosteEtat.type` (`RUBRIQUE`\|`LIGNE`\|`CONTROLE`, défaut `LIGNE`, additif). Une rubrique n'est ni chiffrée ni prise pour une ancre. |
| AC-2 | Six lignes de structure dans l'ordre du formulaire : `RUB1`…`RUB4`, `VBF` (= `FB+FC+FD+FE`), `CTRL` (= `BT − DT`). 26 → **32** postes TFT, 124 → **126** règles. |
| AC-3 | Repères `A`…`H` sur les huit `Z` — dans un champ **dédié**, voir écart ① ci-dessous. |
| AC-4 | `ReferentielPackage.renvois`, **indexé par état**, et servi avec l'état — voir écarts ② et ③. |
| AC-5 | `tft-formulaire.spec.ts` fige l'ordre des 32 codes contre une constante **transcrite à la main**, comparée à l'ordre d'**émission** (jamais triée : la tautologie de STORY-427). |
| AC-6 | `sfd-bceao@1.0`, `sfd-bceao@2.0` et `cima-assurances@1.0` **byte-identiques** (empreintes épinglées inchangées). |

`MOTEUR_VERSION` 1.7.0 → **1.8.0** : le TFT passe de 25 à 31 lignes **et** chaque ligne gagne deux
champs. `zone-franche-togo@1.0` bouge avec `syscohada-revise@2.1` (sources partagées), et ce dernier
est recopié **à l'octet** dans `balance-service` — **14 emplacements** de checksum reportés dans les
deux dépôts.

### ⚡⚡ Trois écarts assumés à la lettre de la fiche, tous les trois MESURÉS

**① AC-3 — `repere`, jamais `note`.** La fiche dit « les huit postes `Z` portent leur `note` ».
`NotesAnnexesProductionService` balaie **tous** les postes du paquet et groupe par `note`, sans
filtre d'état ni de vocabulaire : les lettres y auraient fabriqué **huit notes annexes fantômes**,
sans titre ni montant. Et **STORY-437 (AC-6)** ouvre un garde-fou « tout poste portant une `note` a
une `NoteMeta`, et réciproquement » : il aurait été **infranchissable**. `libelles-coherence.spec.ts`
documentait déjà ce marqueur comme « *une colonne séparée* » du formulaire, distincte de la colonne
NOTE — le champ dédié était le bon home depuis STORY-428.

**② AC-4 — une carte indexée PAR ÉTAT, pas plate.** La fiche propose `renvois: {"1": …}`. Mesuré sur
l'artefact : « (1) » est appelé par **sept postes répartis sur quatre états** — `BILAN_ACTIF` (`AJ`,
`AK`), `TFT` (`FB`, `FE`), `RESULTAT_FISCAL` (`160`, `170`), `LIQUIDATION_IS` (`E`) — avec un texte
**différent** à chaque fois. Une carte plate aurait donné au Bilan et aux états fiscaux la note de bas
de page du tableau des flux.

**③ Un statut de plus : `SANS_OBJET`.** `A_COMPLETER` signifie « donnée hors balance, **à saisir** » —
c'est la marque que **STORY-436** suivra pour ouvrir la saisie des quatre cases non dérivables, et
celle dont l'écran se sert pour dire qu'une liasse n'est pas déposable. Marquer ainsi quatre **titres
de section** aurait fait compter six cases à remplir là où il y en a quatre. La valeur n'entre au
contrat que sur des lignes **neuves** : aucun client existant ne voit une ligne changer de statut.

### ⚡⚡ Deux défauts refermés, sans quoi la story ne livrait RIEN

1. **Le `ReferentielLoader` est une LISTE BLANCHE.** Il reconstruit le paquet clé par clé : `renvois`
   se perdait entre l'artefact vérifié par checksum et le premier consommateur. Les quatre assertions
   AC-4 rougissaient sur un artefact qui portait pourtant la donnée. Famille STORY-427.
2. **Aucune route ne servait les renvois** — et c'est la **vérification docker** qui l'a montré, pas la
   batterie : le paquet portait le texte, la réponse ne le portait pas, donc l'appel « (1) » de `FB`
   et `FE` n'avait toujours aucune cible atteignable. `TftProduit.renvois` les publie avec l'état qui
   les appelle.

### Revue de code — 8 constats, aucun bloquant, trois mesurés par mutation

① `TftDto.postes` se contredisait lui-même (description : 3 statuts, schéma : 4 ; exemple sans `type`
ni `repere`) — c'est l'exemple que l'intégrateur lit. ② La normalisation `type`/`repere` de
`GET …/referentiel/postes` n'était gardée par **rien** : la remplacer par les constantes laissait 1419
unitaires et 20 e2e verts. ③ **Deux des trois gardes « une rubrique n'est pas une ancre » n'étaient
mesurées par rien** (`variationTftEffective`, `ancresReconnues`) : les retirer laissait 1419 tests
verts, parce que la fixture porte déjà `ZA` et `ZH`. ④ `build.mjs` : un `"repere": null` déclaré
devenait la **chaîne `"null"`** — quatre caractères servis comme repère (toutes les sources écrivent
`"note": null`, la symétrie était un piège armé). ⑤ Le test « les CINQ paquets » n'en chargeait que
quatre (`sfd-bceao@1.0` ne partage pas ses postes avec `@2.0`). ⑥ Un JSDoc promettait « un référentiel
SANS TFT » sur une fixture qui en déclare un. ⑦ Deux écrivains pour le défaut `'LIGNE'`. ⑧ La
troncature du renvoi — reprise et traitée par la revue de sécurité.

### ⚡⚡ Revue de sécurité — un constat, et c'est de l'intégrité comptable

**Aucune faille** d'authentification, d'autorisation, d'injection ni de cryptographie : la story
n'ajoute ni endpoint, ni entrée, ni variable d'env, et `type`/`repere`/`renvois` sont exclusivement
en **sortie**. La chaîne de guards, le throttler, le scoping tenant/dossier et le garde-fou
anti-traversée du chargeur d'artefact ne sont pas touchés.

**Le constat (confiance 90, CWE-451, A04:2021) : un renvoi TRONQUÉ était servi comme entier.** Le
texte de `TFT/(1)` est repris de cette fiche, qui l'abrège par une **ellipse** ; le formulaire déposé
porte seul la règle intégrale et **n'est pas dans le dépôt**. Or ce renvoi n'est pas décoratif : il
gouverne ce qui entre dans `FB` et `FE`, c'est-à-dire la frontière entre flux opérationnels et flux
d'investissement d'une liasse **destinée au dépôt**. Un préparateur lit la note, applique la seule
exclusion énoncée, et dépose. C'est « jamais un montant inventé » appliqué au **texte**, et l'inverse
de l'arbitrage de STORY-434.

Correctif : `RenvoiEtat = { texte, complet }` — **la troncature remonte jusqu'au contrat**, pas
seulement jusqu'à un commentaire de source, et un écran peut la signaler. `build.mjs` **lève** sur
les trois bords (ellipse + `complet: true` ; `complet` absent ou non booléen ; renvoi resté en chaîne
nue). Note de durcissement de la revue, refermée par la même garde : `renvois` était le **seul champ
de toute la chaîne** — générateur, liste blanche du loader, réponse — à ne subir aucune coercition ni
aucun contrôle de forme.

⚠️ **La donnée réglementaire complète reste à transcrire d'après l'imprimé**, jamais à reconstituer.
`_meta.renvois_transcription` le dit à côté de la donnée (clé ignorée par le générateur), et un test
de non-vacuité **rougira** le jour où le texte sera complété sans repasser `complet` à `true`.

### Vérification

Lint 0 warning · build OK dans les deux dépôts.

| | `bilan-service` | `balance-service` |
|---|---|---|
| unitaires | 1 422 verts (120 suites) | 3 584 verts (181 suites) |
| e2e | 402 verts (22 suites) | 884 verts (26 suites) |
| couverture | 98,76 / 93,77 / 98,64 / 98,74 | 99,14 / 92,37 / 98,65 / 99,24 |

**16 mutations**, chacune rouge sur l'assertion visée, aucune par erreur de compilation : ordre du
formulaire interverti · repère retiré · renvois retirés de la source · `type` retiré · sortie
anticipée « rubrique » retirée de `ligne()` · `SANS_OBJET` → `A_COMPLETER` · câblage `renvois` retiré
du loader · coquille `RUBRIQE` (le générateur **lève**, exit 1, **checksum inchangé** — c'est ce qui
rendait le silence indiscernable) · signe de `DT` inversé (mesuré **sur un découvert bancaire** :
sans compte `561` au crédit, `BT − DT` et `BT + DT` rendent le même chiffre et la garde est vacante)
· renvois non servis par le moteur · `renvois` publié par réflexion (3 gardes de contrat rouges) ·
les **deux** gardes d'ancre retirées ensemble · la route qui écrase `type`/`repere` · ellipse +
`complet: true` · `complet` absent · renvoi en chaîne nue.

**Vérification docker — rejouée sur l'état FINAL** (stack réelle, tenant amorcé, gates KYC/entitlement
posées) :

- le conteneur sert le checksum `e9e22c97…`, `postesCount: 169`, `mappingCount: 126` — **c'est bien
  le code et l'artefact de la branche** qui tournent, pas l'image figée ;
- `POST …/bilan/etats/tft/dry-run` rend **31 lignes**, les 4 rubriques en `SANS_OBJET`/`null`,
  `VBF = −20 000 = FB+FC+FD+FE`, `CTRL = 90 000 = ZH = ` trésorerie nette N, `ecart: 0`,
  `coherent: true` — l'articulation tient de bout en bout, par **deux chemins de code indépendants** ;
- repères `A`…`H` servis, `note` `null` sur les 31 lignes, renvoi servi avec `complet: false` et ses
  **deux** appelants (`FB`, `FE`) présents ;
- `POST …/bilan/etats/notes-annexes/dry-run` rend les **onze** notes déclarées, **aucune « A »…« H »** ;
- `/api/docs-json` du conteneur porte les **9** champs de `PosteTftDto`, les **4** statuts, les **3**
  natures et la carte de renvois **décrite champ par champ**.

**Aucune écriture en base** : les trois routes d'états sont des dry-run `@LectureSeule()`.

### Hooks et dettes nommés

- **STORY-436** consommera `statut: 'A_COMPLETER'` pour ouvrir la saisie des quatre cases non
  dérivables (`FJ`, `FM`, `FN`, `FQ`) — `SANS_OBJET` existe précisément pour que les quatre rubriques
  n'y entrent pas.
- **STORY-437** portera les renvois de note des autres états ; `renvois` étant indexé **par état**,
  ses cibles s'ajouteront sans déplacer celle du TFT. Les trois autres appels « (1) »
  (`BILAN_ACTIF`, `RESULTAT_FISCAL`, `LIQUIDATION_IS`) restent **sans cible** — hors périmètre ici.
- Les repères de queue `A`/`B`/`C`/`D` collés en fin de libellé des postes `TA`…`TD` du compte de
  résultat (tolérance nommée de `libelles-coherence.spec.ts` depuis STORY-428) ont désormais un champ
  d'accueil : `PosteEtat.repere`. **Transcription non faite** — hors périmètre.
- Le `code` d'une `RUBRIQUE` ou d'un `CONTROLE` (`RUB1`…`RUB4`, `VBF`, `CTRL`) est un identifiant
  **technique** : la colonne « Réf » du formulaire est **vide** sur ces lignes. Dit au contrat, à ne
  pas imprimer.
- `MappingOverrideService` accepte désormais une rubrique comme cible de surcharge (elle existe dans
  `pkg.postes`). Sans effet — aucune règle de passage ne s'y rattache — mais l'ouverture est réelle et
  n'est pas gardée. Hors périmètre.


# STORY-488 : `CIMA` est un axe que le dossier accepte et que le contrat canonique de balance ne connaît pas — le vertical assurance est fermé par une énumération

Status: done

**Épic :** EPIC-106 — Socle multi-référentiel (habilitation, résolution, refus)
**Service :** `balance-service` (`:3007`) — `types/balance-canonique.ts`, `modules/referentiel`
**Points :** 5 → **2 requalifiés** · **Complexité :** medium · **Assigné à :** vivianMoneyVibesGroupes · **Sprint :** S20
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27 — relevé en confrontant les deux énumérations, pas en lisant l'une des deux.

---

## Le fait

Deux listes fermées coexistent, et elles ne contiennent pas la même chose :

| Où | Liste |
|---|---|
| `axes.systemeComptable` (dossier, STORY-303) | `SN` · `SMT` · `SFD-BCEAO` · **`CIMA`** |
| `REFERENTIELS_BALANCE` (contrat canonique, STORY-101) | `SN` · `SMT` · `SFD-BCEAO` |

Un dossier peut donc **légalement** déclarer l'axe `CIMA` — le produit le propose : le type de client
« Assurance » existe à l'assistant de création — et **aucune balance ne peut en sortir**. Le
référentiel `cima-assurances@1.0` **existe pourtant, packagé, côté `bilan-service`** (STORY-122).

⛔ **Le résultat servi n'est pas un refus métier, c'est un `500 REFERENTIEL_UNAVAILABLE`.** Un 500 se
lit « le produit est cassé », pas « ce secteur n'est pas encore ouvert ». Le premier assureur qui
essaie ne fait pas la différence, et il a raison de ne pas la faire.

## Pourquoi c'est plus qu'une ligne à ajouter

Le vertical `assurance` est **promis** : il figure aux cinq secteurs que la console sait
provisionner, il a son type de client, son plan sourcé (art. 431 du code CIMA), son bilan et son
compte de résultat technique. Ce qui manque est **une ligne d'énumération et une entrée de
manifeste** — c'est-à-dire précisément le genre d'écart qui reste ouvert des mois parce qu'il n'a
l'air de rien.

## Critères d'acceptation

- [x] AC-1 — `REFERENTIELS_BALANCE` accueille `CIMA`. Les deux énumérations sont **dérivées d'une
      source unique** ou gardées par un test qui compare les deux et vire au rouge à la divergence
      suivante — 4ᵉ occurrence du patron « valide contre une liste qu'il ne publie pas » (après
      394, 397, 414) : le sujet n'est plus le champ, c'est la **DoD du module**.
- [x] AC-2 — `cima-assurances@1.0` entre au **manifeste de `balance-service`**, avec son checksum,
      byte-identique à l'artefact servi par `bilan-service` (règle STORY-368/AD-6).
- [x] AC-3 — Une balance de dossier `CIMA` se construit, se valide contre le **plan CIMA**, et
      produit une liasse CIMA de bout en bout. Test d'intégration en docker, sur stack neuve.
- [x] AC-4 — ⚠️ **Le statut « amorce, à valider par un actuaire » reste PUBLIÉ** et visible au
      contrat (`_meta.statut`). Ouvrir le vertical ne transforme pas une proposition structurelle
      en donnée réglementaire certifiée. Un assureur doit lire ce statut avant de s'appuyer dessus.
- [x] AC-5 — Le piège de la **classe 8 CIMA** est gardé : elle mêle comptes de gestion et comptes de
      **regroupement**, et le repli générique doublait exactement la base imposable sans qu'aucun
      contrôle ne s'en aperçoive. Un test le rejoue et exige le montant simple.

## Conséquences ailleurs

- Ferme le `500` que la maquette affiche aujourd'hui au secteur Assurance.
- **Ne ferme pas** le vertical assurance : les provisions techniques, le résultat technique
  vie/non-vie et les états annexes C1..C25 restent hors périmètre — voir
  `epics-assurance-2026-08-27.md`. Cette story rend la **balance** possible, pas la compagnie.

## Notes

- Voir [[STORY-122]], [[STORY-101]], [[STORY-303]], `epics-assurance-2026-08-27.md`.

---

## ⛔⛔ Requalification (2026-09-09) — le tableau fondateur est FAUX dans ses DEUX colonnes

La fiche pose que `axes.systemeComptable` accepte `CIMA` et que `REFERENTIELS_BALANCE` l'ignore.
**Les deux affirmations sont fausses, et elles l'étaient le jour de la rédaction.** Mesuré :

| Où | Ce que la fiche annonce | **La valeur réelle** |
|---|---|---|
| `REFERENTIELS_BALANCE` | `SN` · `SMT` · `SFD-BCEAO` | ⛔ **contient déjà `CIMA`** |
| `axes.systemeComptable` | `SN` · `SMT` · `SFD-BCEAO` · **`CIMA`** | ⛔ **`SN` · `SMT` seulement** |

⚡⚡ **STORY-292 porte exactement le titre de cette story** — « le référentiel CIMA est attribuable
par la console mais inconnu de la balance : l'ajouter au manifeste ET au contrat canonique » — et
elle est **`done` depuis le 2026-08-10**, soit **dix-sept jours avant** que cette fiche ne soit
écrite. Elle n'est citée nulle part ici.

⛔ **Le mécanisme est plus grave qu'une simple péremption** : le fait a été relevé « en confrontant
deux énumérations » **sans lire la valeur réelle d'aucune des deux**. Le `500 REFERENTIEL_UNAVAILABLE`
que la fiche décrit est fermé depuis STORY-292.

### Verdict critère par critère

| | Verdict | Preuve |
|---|---|---|
| AC-1 | **livré à moitié** | la constante contient `CIMA` ; la garde inter-dépôts, elle, n'existe pas |
| AC-2 | **DÉJÀ LIVRÉ** | empreintes SHA-256 identiques entre les deux dépôts, vérifiées |
| AC-3 | **livré à moitié** | prouvé en docker côté balance par STORY-292 ; le bout en bout traversant les deux services ne l'est pas |
| AC-4 | ⚡ **À LIVRER — le seul** | `meta` ne porte que `code`, `version`, `libelle`, `date` |
| AC-5 | **DÉJÀ LIVRÉ** | STORY-369 ; le doublement de base imposable est rejoué nommément en test |

### Ce que cette story livre donc réellement

**AC-4 seul**, et il vaut le déplacement : le caractère d'**amorce** du paquet CIMA ne vit
aujourd'hui que dans un **commentaire de code non publié**. Un assureur qui bâtit sur ce référentiel
ne peut lire nulle part qu'il s'agit d'une proposition structurelle à valider par un actuaire.

⇒ **le statut entre au contrat**, sur le patron du paquet fiscal, qui porte déjà un `statut` sourcé.

### ⚠️ Ce que cette story NE livre PAS, et qui est le vrai sujet

Le vertical assurance est bloqué **en amont**, dans `dossier-service` : `SystemeComptable` ne connaît
que `SN` et `SMT`, donc **aucun dossier ne peut être créé en CIMA**. Les fixtures e2e qui « prouvent »
CIMA écrivent l'axe **directement dans le read-model**, court-circuitant le producteur.

⛔ Développer cela sous cette fiche produirait un livrable **inutilisable**, exactement comme
STORY-438. C'est une story neuve, en amont, et elle touche `dossier-service` plus un contrat
d'événement — donc au moins deux dépôts de plus.

## Arbitrages de cadrage

### D-488-1 — le statut est un champ d'ARTEFACT, pas un commentaire de registre

Le porter dans `meta` plutôt que dans le manifeste du service : c'est le paquet qui est une amorce,
pas son enregistrement. Les deux dépôts qui le servent le publient alors **sans se concerter**, et un
paquet recopié à l'octet emporte son statut avec lui.

### D-488-2 — DEUX dépôts, et l'ordre compte

Modifier `meta` régénère `cima-assurances-1.0.json`, donc son empreinte. L'artefact est recopié **à
l'octet** dans `balance-service`, dont la garde lit l'arbre du voisin. Les deux PR s'intègrent
**ensemble**, `bilan-service` d'abord.

### D-488-3 — champ FACULTATIF, pour que les paquets muets restent byte-identiques

`statut?` et non `statut` : seul CIMA le déclare. Les quatre autres artefacts ne doivent pas changer
d'un octet — sinon cette story de deux points en devient une de checksum sur cinq paquets.

---

## Progress Tracking

### ⚡⚡ La vérification docker a trouvé le SECOND défaut, que le développement avait manqué

Le statut était bien déclaré dans le générateur, figé dans l'artefact, présent dans le type des
**deux** dépôts — et **aucune route ne le servait**. Mesuré sur la stack : le contrat OpenAPI publié
ne portait pas le champ, et l'interroger rendait `ABSENT` sur les deux services.

⛔ **Il n'existait donc qu'à l'intérieur du service.** C'est la règle exacte que le tracker de
sprint tire de quatre écarts sur onze : *un artefact livré sans chemin d'accès coûte autant qu'un
artefact absent, et il coûte en plus l'illusion qu'il est disponible.*

⇒ le **tampon de référentiel effectif** le porte, et les **deux** routes qui le servent —
diagnostic et suggestion — le passent. Un statut visible sur l'une et absent de l'autre serait un
chemin d'accès à moitié ouvert, donc une garantie qu'on ne peut pas donner à un intégrateur.

### ⚡ Et la revue a trouvé le TROISIÈME — le même défaut, une couche plus loin

Sur la route de suggestion, le tampon est recopié par **épandage**. Le statut partait donc déjà
dans le corps JSON — mais son DTO ne le déclarait pas, donc il était **absent du schéma OpenAPI**.
Un client généré ne le voit pas, ne le type pas, ne peut pas le lire.

⛔ « La réponse publie déjà le champ » est vrai du **JSON** et faux du **contrat** — le défaut de
STORY-432, reproduit. Il coûtait **la moitié d'AC-4**, celle qui exige les deux routes.

Une garde de contrat **énumère désormais les deux schémas de tampon** : en ajouter un troisième
sans son statut la fait rougir.

### Points de recopie — TROIS trouvés, aucun deviné

| # | Où | Comment il a été trouvé |
|---|---|---|
| 1 | le type du paquet, dans les **deux** dépôts | erreur de compilation du voisin |
| 2 | le checksum de l'artefact, **7 points** sur les deux dépôts | balayage explicite avant/après |
| 3 | le DTO de la route de suggestion | **revue de sécurité**, hors de son périmètre |

### Table de mutations — 7 sur 7 ROUGES par assertion

| # | Mutation | Résultat |
|---|---|---|
| M1 | le statut retiré du **générateur**, artefact régénéré et checksum propagé | ROUGE (2) |
| M2 | le tampon publie une clé `statut` vide au lieu de l'omettre | ROUGE (1) |
| M3 | le tampon ne publie plus le statut | ROUGE (1) |
| M4 | la route de **diagnostic** cesse de le porter | ROUGE (1) |
| M5 | la route de **suggestion** cesse de le porter | ROUGE (2) |
| M6 | le statut sort du DTO de suggestion (contrat OpenAPI) | ROUGE (1) |
| M7 | le statut sort du contrat publié du tampon de diagnostic | ROUGE |

⛔ **M1 a d'abord été un FAUX ROUGE**, et c'est instructif : retirer le champ directement de
l'artefact JSON casse son **checksum**, donc le loader lève et **toute** la batterie rougit — y
compris les tests qui n'ont rien à voir. Rejouée à sa **source déclarative** — retirer la
déclaration du générateur, régénérer, propager le checksum — elle rougit sur les **deux tests qui
gardent réellement le champ**, et sur eux seuls.

⚡ **M4 et M5 ont RÉVÉLÉ que le câblage des deux routes n'était gardé par rien** : les deux étaient
vertes au premier passage. Ce sont elles qui ont fait écrire les deux tests de service.

### Vérification docker

**① Le contrat servi** par le service en marche publie bien le champ :

```
champs du tampon : ['code', 'version', 'checksum', 'statut']
```

**② Un dossier SYSCOHADA** — transcription arrêtée — ne publie **pas la clé** :

```
référentiel : syscohada-revise 2.1 | clés : ['code', 'version', 'checksum']
```

C'est la mesure qui prouve l'épandage conditionnel : une transcription arrêtée n'a pas de statut, et
l'absence de la **clé** est ce qui le dit.

### ⚠️ Ce que je n'ai PAS pu mesurer, et que je ne présente donc pas comme prouvé

**Le statut servi sur un dossier CIMA réel.** La route refuse en `409 REFERENTIEL_NON_HABILITE`, et
le read-model d'habilitation n'a pas repris mes écritures directes — vraisemblablement parce qu'il
est alimenté par Kafka, dont le volume a été réinitialisé pendant la réparation de la stack en
STORY-485. Je n'ai pas forcé davantage.

⇒ la publication reste prouvée par **trois moyens indépendants** : le contrat OpenAPI servi par le
service en marche, les tests unitaires sur les deux routes avec mutations rouges, et l'artefact
chargé par le loader avec **checksum vérifié**. Le parcours HTTP de bout en bout sur un dossier
assurance, lui, n'est pas prouvé.

### ⛔⛔ La revue de code a trouvé un SECOND bloquant, plus grave que le premier

`meta.statut` n'avait **aucun lecteur** dans `bilan-service`, et ma propre docstring y affirmait
« **Publié, et c'est tout l'objet** » — une description qui contredisait le code du fichier où elle
est écrite.

⛔ Or c'est **ce service qui produit la liasse CIMA**. Un assureur obtenait son bilan et son compte
de résultat avec un tampon de traçabilité **indiscernable** de celui d'un SYSCOHADA arrêté, et la
mise en garde n'était lisible que sur deux routes d'un **autre** service, qu'il n'appelle pas pour
éditer sa liasse. C'est mon propre raisonnement — *un artefact livré sans chemin d'accès coûte autant
qu'un artefact absent* — **non appliqué au dépôt où il comptait le plus**.

⚡⚡ **La porte est fermée par le TYPE, pas par la vigilance.** `statut` est **requis** dans la
signature du tampon (`string | undefined`, et non `statut?`) : le compilateur **nomme** les **huit**
sites qui estampillent un document. Un champ facultatif les aurait laissés l'omettre en silence, et
c'est le mode de panne « une garde posée sur un seul des N chemins ».

| surface | porte le statut |
|---|---|
| bilan, compte de résultat, TFT, notes annexes, contrôles, diagnostic | ✅ **six routes de production** |
| jeu d'états, snapshot | ⛔ **non — documents FIGÉS** |

⚠️ Les deux surfaces de documents figés ne le portent pas, et **c'est écrit à ces deux endroits** :
un document scellé rend ce avec quoi il a été scellé, et l'ajouter au snapshot serait un changement
de forme des pièces déjà figées. Nommé plutôt que tu.

### Les cinq autres constats

| # | Constat | Ce qu'il produisait |
|---|---|---|
| 1 | le DTO de la route de **suggestion** ne déclarait pas le champ | servi dans le JSON par épandage, **absent du schéma** — illisible d'un client généré |
| 3 | aucune assertion HTTP sur la **sérialisation réelle** | un intercepteur ajouté un jour ferait disparaître le champ, tout resterait vert |
| 4 | la description publiée disait « {code, version, checksum} — hook inerte » | il en publie quatre et porte la seule mise en garde réglementaire du produit |
| 5 | `recopieLe` affirmait encore une recopie de **STORY-428** | ce n'est pas un commentaire, c'est une **donnée** injectée dans le nom du test |
| 6 | la route `plan-comptes` sert les 80 comptes de l'amorce sans mise en garde | **écarté** : elle n'a jamais porté de tampon, y ajouter le statut seul serait une extension de forme hors périmètre |

⚡ **Le constat 5 mérite d'être retenu.** Dans trois mois, la garde inter-dépôts rougit après une
régénération ; le développeur lit « recopié le 2026-09-01 (STORY-428) », part chercher ce qui a bougé
depuis 428, et **ne trouve pas 488** — la seule story à avoir touché cet octet depuis. C'est
exactement le mode de panne que ce champ existe pour supprimer.

⚡ **Une garde de contrat existante a rougi**, et son attendu est révisé **sciemment** : elle épingle
la forme **exacte** du tampon, pas un sous-ensemble. C'est elle qui empêche un champ d'entrer au
contrat sans qu'on s'en aperçoive.

### ⚡ Ce que la revue a prouvé et que la vérification docker n'avait pas pu

Le maillon que je n'avais pas réussi à mesurer sur la stack — la **sérialisation réelle** sur un
dossier CIMA — est désormais prouvé par l'e2e, qui monte l'application entière et rend un `200` avec
l'artefact réel. Le statut y est asserté **sur sa valeur**, pas sur sa présence.

### Clôture — 2026-09-09

PR `MNV-488(bilan)` et PR `MNV-488(balance)` rebase-mergées sur `dev` **ensemble** (artefact
partagé à l'octet). PR `docs/` mergée sur `main`. Assigné à : `vivianMoneyVibesGroupes`.

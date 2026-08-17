# STORY-368 : `sfd-bceao@2.0` — les octets convergent, le plan cesse d'être amputé, et la garde cesse de mentir

Status: done

**Epic :** EPIC-017 — Socle balance-service + contrat de balance canonique
**Points :** 8 · **Complexité :** high · **Sprint :** 20 (backend) · **Services :** `bilan-service`
(`:3004`) **+** `balance-service` (`:3007`) — ⚠️ **DEUX DÉPÔTS**
**Gaps repris :** `GAP-sfd-bceao-2-0-octets-divergents` · `GAP-artefact-sfd-tronque`
**Décision :** **D-078-2** *(les octets de l'artefact sont ceux de `bilan-service`, source de vérité
unique)* · **AD-5** et **AD-6** de `architecture-balance-service-2026-08-15`

---

## Pourquoi les deux gaps sont dans la même story

Ils touchent **le même artefact**, passent par **le même `build.mjs`**, et exigent **la même
régénération**. Les traiter séparément coûterait **deux régénérations, deux paires de checksums, et
deux invalidations des snapshots de liasse** qui référencent le checksum.

## Constat ① — les deux services n'ont pas les mêmes octets

| Service | sha256 | Taille |
| --- | --- | --- |
| `bilan-service` | `07b4ec22…711b620` | 32 071 o |
| `balance-service` | `ee9bf014…a60dd11fe` | 31 736 o |

La copie de `balance-service` est l'état **antérieur à l'incrément 2 de STORY-120** : dans sa
`tableDePassage`, `BAT`/`BPT` sont encore portés par les états de détail **sans `etatSource` sur leurs
opérandes**, et `BP4` **n'a pas** `role: 'RESULTAT_BILAN'`. Les quatre autres sections (`meta`,
`regles`, `planDeComptes`, `postes`) sont **identiques**.

### ⛔ Et la garde qui prétend l'empêcher est tautologique

`referentiel-assets-coherence.spec.ts` s'intitule *« byte-identité avec `bilan-service` (AC-5,
D-078-2) »* et compare l'asset local à une constante annoncée *« recopiée du manifeste de
`bilan-service` »* — **qui n'y figure pas**. Il compare donc **la copie périmée à elle-même**.

> ⚡ Son commentaire affirme : *« si l'un des deux services régénère un paquet sans l'autre, ce test
> tombe »*. **`bilan-service` a régénéré. Le test est resté VERT.**

## Constat ② — l'artefact est amputé de 216 comptes

`assets/sfd-bceao-2.0.json` porte **156 comptes** (48 × 2 chiffres + 108 × 3) là où le plan officiel du
RCSFD en compte **372** et descend jusqu'à **6 chiffres**. Les niveaux **4, 5 et 6 sont absents**.

Relevé complet : `referentiels/rcsfd-bceao-longueur-compte-2026-08-03.md` — source **Commission Bancaire
UMOA, plan de comptes p. 29-42**.

⚠️ **Cause à retenir** : le `README-sfd-bceao.md` cite des comptes à 4 chiffres (`1011`, `1131`)
**dans sa prose** — jamais repris dans le JSON. *« Un écart entre la prose d'un README et les données
qu'il accompagne ne casse rien et ne se voit donc jamais. »*

## ⚠️ Les deux ont un effet fonctionnel NUL aujourd'hui — c'est ce qui les rend dangereux

- **Octets** : `balance-service` **ne lit jamais `role`** (aucune occurrence de `RESULTAT_BILAN` dans
  son `src/`), et sa résolution de `BAT`/`BPT` retombe sur le même ensemble par le défaut *« `etatSource`
  absent ⇒ même état que le total »*. Le référentiel se charge normalement (**mesuré** : 200,
  `planCount` 156, intégrité vérifiée).
- **Troncature** : la reconnaissance étant **par préfixe**, tous les comptes officiels détaillés restent
  rattachables (`602511`, `602512`, `20227`, `25116`, `25316`, `1011`, `1131` → **tous OUI**).

> ⛔ **Le risque est en AVAL, et il est nommé.** Le manifeste affirme *« Octets identiques à
> `bilan-service` »* et *« l'égalité est verrouillée par `referentiel-assets-coherence.spec.ts` »*.
> **Le prochain développeur qui ajoutera au moteur fiscal une règle pilotée par `role` — c'est-à-dire
> exactement ce que demande `STORY-369` — lira ce commentaire, s'y fiera, et sera dans l'erreur sans
> qu'aucune CI le lui dise.**

⇒ **Cette story doit passer AVANT `STORY-369`.**

Effet de la troncature, lui aussi en aval : le plan exposé au front et à la **suggestion de compte**
(STORY-139) est amputé de 216 comptes ⇒ **la suggestion ne proposera jamais un compte de niveau 4 à un
SFD**.

## Ce que la story livre

1. **Le plan est complété** dans `bilan-service` — source de vérité unique (**D-078-2**) — depuis le
   relevé sourcé, **niveaux 4, 5 et 6 compris**.
2. **Régénération par `build.mjs`**, puis **recopie des octets** dans `balance-service` et mise à jour
   de **son checksum de manifeste**.
3. ⛔ **La garde cesse d'être une constante recopiée** (`AD-6`) : soit elle **lit réellement le
   manifeste de l'autre dépôt** (submodule, artefact de CI partagé), **soit l'invariant cesse d'être
   annoncé comme vérifié**. ⚠️ *Un invariant faussement garanti est pire qu'un invariant absent.*
4. **Re-vérification du moteur fiscal** qui lit `tableDePassage` — `liquidation.regles.ts:325,374-401`.
   ⚠️ `resoudreChiffreAffaires` rend `null` pour le SFD **aujourd'hui** : **à confirmer après
   remplacement**, le comportement pouvant changer avec les nouveaux opérandes.

## Critères d'acceptation

- **Étant donné** les deux dépôts **quand** on calcule le sha256 de `sfd-bceao-2.0.json` de chacun
  **alors** **les deux empreintes sont identiques**, et les deux manifestes la déclarent.
- **Étant donné** le plan SFD **quand** on le compte **alors** il porte **372 comptes** et descend à
  **6 chiffres**, conformément au relevé sourcé.
- ⛔ **Étant donné** la garde de byte-identité **quand** on remet l'ancien asset dans `balance-service`
  **alors** **elle vire au rouge**. ⚡ **C'est le critère central : elle ne le fait pas aujourd'hui.**
- **Étant donné** un SFD **quand** la suggestion de compte s'exécute **alors** elle peut proposer un
  compte de **niveau 4** — ce qui lui était impossible.
- **Étant donné** le moteur fiscal **quand** il résout `tableDePassage` sur le nouvel artefact **alors**
  son comportement est **constaté et écrit**, `resoudreChiffreAffaires` compris — ⛔ pas supposé
  inchangé.
- **Étant donné** les snapshots de liasse qui référencent le checksum **quand** l'artefact change
  **alors** leur sort est **traité explicitement**, pas découvert.

## Ce que cette story ne fait PAS

- ⛔ Elle ne publie **pas** les classes de gestion dans l'artefact — c'est **`STORY-369`**, qui **passe
  après** celle-ci pour la raison écrite plus haut.
- ⛔ Elle ne touche pas au niveau de détail déclaré au manifeste (`longueurCompteDetail`), sourcé et
  fermé par STORY-146/172.

## Definition of Done

- [x] **Un seul sha256** pour `sfd-bceao@2.0` dans les deux dépôts, déclaré dans les deux manifestes.
- [x] **Mutation-test de la garde** : remettre l'ancien asset **fait échouer la CI**. ⚠️ Sans lui, la
      story reproduit exactement le défaut qu'elle répare.
- [x] Le plan porte **372 comptes**, sourcés depuis `rcsfd-bceao-longueur-compte-2026-08-03.md`.
- [x] Le comportement du moteur fiscal sur `tableDePassage` est **re-vérifié et écrit**.
- [x] Les snapshots de liasse impactés sont **identifiés et traités**.
- [x] Les deux gaps passent à **fermé** — ⛔ pas avant que la garde ait prouvé qu'elle détecte.

---

## Progress Tracking

### Ce qui a été livré

**`bilan-service` (source de vérité des octets, D-078-2)**

| Fichier | Changement |
| --- | --- |
| `scripts/referentiels/sources/plan-comptable-sfd.json` | **156 → 372 comptes**. Les 156 libellés existants conservés **à l'octet** ; 216 ajoutés (22 à 3 chiffres, 178 à 4, 14 à 5, 2 à 6). |
| `src/modules/bilan/referentiel/assets/sfd-bceao-{1.0,2.0}.json` | régénérés par `build.mjs` |
| `referentiel-registry.ts` | `sfd-bceao@1.0` `0509a034…` → **`c2e075a2…`** · `sfd-bceao@2.0` `07b4ec22…` → **`8b7b29d8…`** |
| `referentiels-additionnels-coherence.spec.ts` | digests épinglés mis à jour + **1 test neuf** (répartition par longueur) |

**`balance-service` (copie, AD-6)**

| Fichier | Changement |
| --- | --- |
| `assets/sfd-bceao-2.0.json` | octets **recopiés** de `bilan-service` (`8b7b29d8…`) |
| `referentiel-registry.ts` | checksum `ee9bf014…` → **`8b7b29d8…`** + le commentaire cesse d'annoncer une garantie automatique |
| `referentiel-assets-coherence.spec.ts` | **la garde cesse de mentir** (§ ci-dessous) |
| `liquidation.regles.spec.ts` | **1 test neuf** : le moteur fiscal joué sur le **vrai** artefact SFD |
| `suggestion.regles.spec.ts` · `test/suggestion.e2e-spec.ts` | 3 attentes rectifiées + **1 test neuf** (compte de niveau 4) |

### ⑴ Le plan — extraction rejouée, pas recopiée à la main

`pypdf` sur le PDF officiel (téléchargé depuis `cb-umoa.org`, 201 p.), motif
`^(\d{2,8})\s*[-–]\s*libellé` sur les **pages 29-42**, continuations de libellé recollées, lignes de
titre **en capitales** écartées (sans ce filtre, `COMPTES DE CHARGES` se collait au libellé de `692`).

Trois contrôles indépendants confirment que c'est **la même extraction, poursuivie**, et non une
seconde source :

1. la répartition rendue est **exactement** celle du relevé de STORY-172 — **48 / 130 / 178 / 14 / 2** ;
2. les 156 comptes existants sont **tous** retrouvés (aucun disparu) ;
3. l'**ordre** du sous-ensemble commun est identique à celui du fichier livré depuis STORY-057.

⚠️ **`@1.0` bouge aussi, et c'est voulu** : les deux versions partagent `plan-comptable-sfd.json`. La
« version allégée » de `@1.0` porte sur ses **postes** et sa **table de passage**, jamais sur le plan
— les deux décrivent le même RCSFD. Révision **en place** légitime : le pont tag → référentiel résout
`SFD-BCEAO` vers `@2.0`, `@1.0` n'est attribué à aucune organisation ⇒ pas de `@1.1`, pas de migration.

**Non-régression byte-identique prouvée** sur les 3 autres artefacts : `git status` ne liste que les
deux `sfd-bceao-*.json` (SYSCOHADA `01b892c0…`, zone-franche `ecbd01e2…`, CIMA `7e644ab1…` inchangés).
Build rejoué → **même hash** (déterminisme).

### ⑵ La garde — ce qu'elle prouve est désormais ÉCRIT (AD-6)

Elle comparait la copie périmée **à elle-même**. Elle a été refaite pour dire **exactement** ce qu'elle
vérifie, plus une vérification qui lit **réellement** l'autre dépôt :

| Dérive | Détectée ? | Par quoi |
| --- | --- | --- |
| l'asset local est modifié / remis à un état antérieur | ✅ **toujours** | empreinte figée (avec sa **date de recopie**) |
| le manifeste local dérive de l'asset local | ✅ **toujours** | `le manifeste local déclare ces checksums` |
| `bilan-service` régénère et `balance-service` ne suit pas | ✅ **si les deux dépôts sont côte à côte** | comparaison des **octets réels** de `../bilan-service/…/assets/` |
| idem, dans la CI d'un dépôt **isolé** | ⛔ **NON** | — **dit, pas tu** (`console.warn` explicite) |

⛔ **La dernière ligne reste ouverte** et n'est **pas** annoncée comme faite : la fermer demande une
source partagée entre dépôts (submodule ou artefact de CI publié par `bilan-service`) — de
l'infrastructure, hors du périmètre de cette story. AD-6 autorise explicitement cette branche :
*« soit la garde lit réellement la source de l'autre dépôt, soit l'invariant cesse d'être ANNONCÉ
comme vérifié »*. C'est le second terme qui est tenu, **plus** le premier partout où il est atteignable.

### ⑶ Mutation-test — le critère central de la story

`git stash` de l'asset `balance-service` (retour à `ee9bf014…`), puis `npm test` :

```
✕ sfd-bceao-2.0.json a exactement le sha256 recopié du manifeste bilan (8b7b29d8…, le 2026-08-17)
✕ octets identiques à ceux de bilan-service — vérifié si le dépôt est présent à côté
✕ le manifeste local déclare **ces** checksums (pas d’autres)
✕ SFD-BCEAO se charge avec son propre plan (2ᵉ référentiel, même code)
✕ SFD-BCEAO déclare 6 chiffres SANS refuser un seul compte officiel (STORY-172/368)
Tests: 5 failed, 12 passed
```

⚡ **Le 2ᵉ échec est celui qui compte** : il prouve que la comparaison inter-dépôts **s'exécute**
réellement (chemin résolu, pas de skip silencieux) — sans lui, la nouvelle garde serait la tautologie
d'avant sous un autre nom. Restauration → **17/17 verts**.

### ⑷ Moteur fiscal — constaté, pas supposé

La story exigeait de **re-vérifier**, l'artefact remplacé apportant les `etatSource` de l'incrément 2
que `resoudreComptesDuPoste` suit (`operande.etatSource ?? etat`).

**Constat : `resoudrePosteChiffreAffaires` rend toujours `null`** — épinglé par un test neuf qui joue
le **vrai** `sfd-bceao-2.0.json` (le cas SFD n'était joué jusqu'ici que sur un paquet **inventé** d'un
seul poste, ce qui ne prouvait rien de l'artefact livré). Raison écrite : le RCSFD ne publie
`POSTE_CHIFFRE_AFFAIRES` dans aucune règle et aucun de ses postes ne porte un libellé commençant par
« chiffre d'affaires » — les `etatSource` ajoutés portent sur les **totaux de bilan** `BAT`/`BPT`, pas
sur un poste de produits. La liquidation reste donc **refusée** pour un SFD, jamais calculée sur une
MFP nulle inventée. Le test vérifie **d'abord** que les octets sont bien ceux de l'incrément 2 (sinon
il constaterait sur le mauvais artefact).

### ⑸ Effet mesuré sur la suggestion de compte (STORY-139)

Trois comportements changent, **tous** conséquence fidèle d'un plan complet :

| Libellé | Avant (plan tronqué) | Après | Pourquoi |
| --- | --- | --- | --- |
| `Amortissements` | `AUCUN` | **`4418` EXACT** | le plan officiel porte littéralement ce libellé (amortissements des immobilisations incorporelles) |
| `Banques et correspondants` | 2 alternatives (`114`, `154`) | **4** (`114`, `154`, `1141`, `1541`) | le RCSFD nomme pareil le collectif **et** son divisionnaire |
| seuil de rapprochement | testé via `Amortissements` (0,38) | testé via `Dotations aux amortissements du matériel roulant` (**0,42** contre `661`) | l'ancien exemple est devenu une correspondance exacte ⇒ il ne testait plus le **seuil** mais l'absence de candidat |

⚠️ Le 3ᵉ point est un **piège évité** : garder l'ancien exemple aurait laissé un test vert qui ne
prouvait plus rien de la branche qu'il prétend couvrir.

### ⑹ Vérification docker réelle — stack NEUVE (`down -v`), 2026-08-17

| # | Contrôle | Résultat mesuré |
| --- | --- | --- |
| 1 | octets servis **dans les conteneurs**, `src/` **et** `dist/` | `8b7b29d8…` **partout** — `bilan-service` (`src`+`dist`) **et** `balance-service` (`src`+`dist`) ⇒ **AC-1 : les octets convergent** |
| 2 | `GET /api/v1/referentiels/actifs` (balance, `:3007`) | `checksum 8b7b29d8…` · `planCount` **372** · `integrity: "verified"` |
| 3 | `GET /api/v1/bilan/referentiel` (bilan, `:3004`) | `checksum 8b7b29d8…` · `planCount` **372** · `postes 31` · `mapping 31` · `integrity: "verified"` |
| 4 | `POST /api/v1/balances/suggest-comptes` | **niveau 4 proposé** : `Amortissements → 4418` · `Banques et correspondants → 4 alternatives dont 1141/1541` · **niveau 5** : `Intérêts sur comptes ordinaires créditeurs → 60251` ⇒ **AC-4** |
| 5 | jeu d'états SFD créé | tampon référentiel persisté `8b7b29d8…` — les **nouvelles** productions portent le nouveau checksum |
| 6 | snapshot portant l'**ANCIEN** checksum (`07b4ec22…`) inséré puis relu par l'API | `GET …/versions` et `…/versions/1` le servent **sans erreur**, checksum d'origine **inchangé** ⇒ **AC-6** |

**Sort des snapshots de liasse — traité, pas découvert.** `SnapshotLiasse.checksum` est une **trace
append-only** de ce qui a servi, pas une référence à revalider : le réécrire falsifierait la piste
d'audit. Aucun code ne compare un checksum stocké à l'artefact courant — la **seule** comparaison de
tout `bilan-service` est `referentiel-loader.service.ts:80`, entre les octets fraîchement lus et
l'entrée du manifeste. Contrôle 6 ci-dessus le mesure au lieu de le déduire.

⚠️ **Ce que la vérif docker a discriminé** : les contrôles 1-3 échoueraient à l'identique sur l'état
d'avant (les octets **divergeaient**, `planCount` valait 156) ; le contrôle 4 est **structurellement**
impossible avant (l'artefact ne contenait **aucun** compte de plus de 3 chiffres — 48×2 + 108×3) ; le
contrôle 6 discrimine le risque nommé par l'AC (un snapshot antérieur devenu illisible).

### ⛔ Défaut PRÉ-EXISTANT rencontré, non corrigé (hors périmètre)

`POST /api/v1/bilan/etats/:id/valider` rend **500** sur stack neuve :

```
ValidationError: SnapshotLiasse validation failed: dossierId: Path `dossierId` is required.
```

**Antérieur à cette story et sans rapport avec elle** : `MNV-356` a posé `dossierId` en
`required: true` au schéma `SnapshotLiasse` alors qu'**aucun chemin d'écriture ne le renseigne**. Le
commentaire du schéma l'assume et renvoie à **STORY-357** pour le re-scopage. Conséquence en l'état :
**aucune liasse ne peut être validée**, quel que soit le référentiel. Signalé, **pas corrigé** —
déborder ici aurait mêlé deux sujets et une migration à une story d'artefact.
Contourné pour le contrôle 6 par insertion directe du snapshot en base.

### ⑹ Revue de code — 2 lentilles, 4 constats, 4 traités

Scan par `prospera-code-review` (contexte `haiku` → analyse `opus`) **plus** `ponytail-review`
(over-engineering). Synthèse, filtrage et correctifs faits **en session `opus`**. Le relecteur a
**rejoué** la table de mutations au lieu de la relire, et **recalculé** les chiffres annoncés — les
916 / 190 / 2 784 / 666 et les couvertures sont confirmés indépendamment. Il a aussi rejoué le moteur
de suggestion sur **les 156 libellés d'avant** : 12 sorties changent, **0 régression** (aucun compte
retenu ne devient `null`, aucun ne dévie).

| # | Constat | Confiance | Traitement |
| --- | --- | --- | --- |
| **C1** | le commentaire `'1011', // niveau 4 — absent de l'artefact` est devenu **faux** — ⚡ il rejouait *dans le diff même de la story* la cause racine qu'elle nomme (« un écart entre la prose et les données ne se voit jamais ») | 95 | **corrigé** |
| **C2** | ⚡ **la comparaison inter-dépôts redevenait une tautologie muette si le chemin cessait de résoudre** — mesuré : `'bilan-service'` → `'bilan-serviceXX'` donnait **17/17 verts** et un `console.warn` noyé dans 165 suites | 90 | **corrigé** — le `return` anticipé est désormais gardé sur la **racine** du dépôt voisin, et si elle est là, la résolution du chemin des assets est **assertée**. Mutation rejouée : chemin faux ⇒ **rouge** (`resout: false`), restauré ⇒ 17/17 |
| **C3** | statut désynchronisé (`in_progress` dans l'en-tête vs `review` dans `sprint-status.yaml`) + `assigned_to: null` | 90 | **corrigé** |
| **P1** | `ponytail` : constante de chemin en 11 lignes de `join(…, '..', '..', …)` | — | **corrigé** — 4 lignes, fusionné dans C2 |

⚠️ **C2 est le constat qui comptait** : sans lui, la story aurait livré une garde vraie *le jour du
mutation-test* et fausse au premier déplacement de module — exactement la classe de défaut qu'elle
répare. Le mutation-test de la story prouvait que la comparaison **s'exécutait ce jour-là** ; rien ne
le maintenait vrai.

**Constats écartés** (doutes levés par vérification, pas par principe) : le `return` anticipé dans le
cas *déclaré* (dépôt voisin absent) — c'est la branche qu'AD-6 autorise ; un fichier manquant côté
voisin — **ENOENT rouge**, vérifié, pas de faux vert ; `@1.0` révisé en place — vérifié : aucun tag ne
le résout, aucun `0509a034…` épinglé hors docs historiques ; `role: 'RESULTAT_BILAN'` arrivé dans la
copie balance — vérifié **inerte** (0 lecture de `role` côté balance).

> ⚡ **Note opérationnelle du relecteur, retenue pour l'ordre de merge** : la garde lit l'**arbre de
> travail** de `bilan-service`, pas une révision figée. Entre les deux merges, une machine dont
> `bilan-service` est sur `dev` verrait la suite `balance-service` **rouge**. ⇒ **`bilan-service`
> se merge EN PREMIER** — c'est lui qui produit les octets.

### ⑺ Revue de sécurité — **aucune vulnérabilité**, et une preuve qui vaut d'être gardée

Scan par `prospera-security-review` (`haiku` pour l'éligibilité/contexte/résumé → **`opus`** pour
l'analyse, jamais de downgrade). Synthèse en session `opus`. **0 constat à confiance ≥ 80.**

Les deux angles qui n'allaient **pas** de soi ont été tranchés par le calcul, pas par principe :

**⚡ La frontière de validation ne s'est PAS élargie — démontré.** `estCompteRattachable` accepte un
compte s'il **commence par** une racine du plan. Passer de 156 à 372 racines pourrait laisser entrer
ce qui était refusé. Vérification : **chacune des 216 racines ajoutées est elle-même préfixée par une
racine déjà présente** (0 exception). Or si `R'` commence par `R`, tout compte commençant par `R'`
commençait déjà par `R` ⇒ **l'ensemble des comptes acceptés est rigoureusement identique avant et
après**. `longueurCompteDetail` (6) et `/^\d+$/` sont inchangés, et aucune racine ne dépasse 6
chiffres. Aucune entrée précédemment refusée ne passe désormais.

**Provenance de la donnée ingérée** — 216 entrées viennent d'un PDF **externe**. Scan caractère par
caractère des 372 entrées et des 3 artefacts : jeu effectif `espace ' ( ) , - 0-9 A-Z a-z` + 6
lettres accentuées. **Absents** : `< > & " \ ` $ { } [ ] ; =`, tout caractère de contrôle, tout
caractère **bidirectionnel** (`U+202A-202E`, `U+2066-2069`…), tout résidu d'extraction. Pas de
`= + - @` en tête (injection de formule CSV) — et aucun sink CSV/HTML/PDF en sortie de toute façon.
Pas de `\n`/`\r` (injection de journal), et les libellés ne sont jamais journalisés.

**Chaîne d'intégrité intacte** : les **9** entrées de manifeste des deux dépôts ont vu leur sha256
recalculé et comparé à la constante déclarée — **9/9 exactes** ; le refus reste **avant tout parse et
avant mise en cache** ; `502 REFERENTIEL_INTEGRITY` ne porte que des empreintes, aucun contenu ; aucun
checksum périmé ne survit dans un chemin de code (seulement des commentaires et l'historique).
Lecture de FS hors dépôt (la nouvelle garde) : chemin **constant** dérivé de `__dirname`, aucun
segment contrôlable, specs exclues de `tsconfig.build.json` et de l'image runtime ⇒ pas de CWE-22.
Suggestion : **n'engage rien** (aucune écriture), route authentifiée et lot borné.

### ⚠️ Conséquence MESURÉE, écrite ici pour ne pas être découverte

Un plan plus fin rend `libelleDuPlanLePlusSpecifique` plus précis : **188 des 372 comptes** voient leur
libellé dérivé changer, parce que leur plus long préfixe n'est plus la racine à 3 chiffres mais le
compte lui-même.

| Compte | Libellé dérivé avant | Après |
| --- | --- | --- |
| `1011` | Billets et monnaies | **Billets et monnaies émis par la BCEAO** |
| `1136` | Centre des Chèques postaux | **Dettes rattachées** |
| `1147` | Banques et correspondants | **Créances rattachées** |

⚠️ **Deux effets, tous deux assumés :**

1. Certains libellés deviennent **moins parlants hors contexte** (`1136` → « Dettes rattachées ») —
   c'est la convention du plan officiel, qui réutilise des libellés génériques sous un parent.
   **L'artefact fait foi** (AD-5) : les rebaptiser serait réinventer du comptable.
2. L'import Sage **dérive** le libellé du plan **avant** de sceller le checksum
   (`sage-normalizer.service.ts:116`). Le **même fichier** ré-importé après cette story produit donc
   un checksum **différent** dès qu'il contient un compte subdivisé. Conséquence concrète et
   **unique** : ré-ingérer une version **déjà ingérée** rend `VERSION_DEJA_INGEREE` — *« déjà ingérée
   avec un contenu différent, re-poussez en version N+1 »*. ✅ **Fail-closed, explicite, et il nomme le
   remède.** Les balances **déjà stockées** ne bougent pas : la re-vérification confronte une balance
   à **ses propres** lignes stockées, jamais à des libellés fraîchement dérivés — vérifié.

### Portes de qualité

| | `bilan-service` | `balance-service` |
| --- | --- | --- |
| lint | **0 warning** | **0 warning** |
| build | ✅ | ✅ |
| unitaires | **916 passés** (93 suites) | **2 784 passés** (165 suites) |
| e2e | **190 passés** (20 suites) | **666 passés** (25 suites) |
| couverture | 98,67 / **93,11** / 98,59 / 98,62 | 99 / **91,81** / 98,19 / 99,08 |

Seuils 65 / 90 / 90 / 90 — tenus, aucun abaissé.

### Clôture — 2026-08-17

| Dépôt | PR | Intégration |
| --- | --- | --- |
| `bilan-service` | [#42](https://github.com/MoneyVibesGroup/prospera-bilan-service/pull/42) | **rebase-merge** sur `dev` (`e76b441`), branche supprimée |
| `balance-service` | [#39](https://github.com/MoneyVibesGroup/prospera-balance-service/pull/39) | **rebase-merge** sur `dev` (`ea2604d`), branche supprimée |

⚡ **Ordre de merge tenu — `bilan-service` EN PREMIER.** La garde de `balance-service` lit l'**arbre de
travail** du dépôt voisin, pas une révision figée : merger `balance-service` d'abord aurait rendu sa
suite **rouge** sur toute machine dont `bilan-service` était encore sur l'ancien `dev`. Contrôle
d'intégration rejoué **les deux dépôts sur `dev`** : `octets identiques à ceux de bilan-service` ✅,
**17/17 verts**.

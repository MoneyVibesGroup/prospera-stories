# STORY-368 : `sfd-bceao@2.0` — les octets convergent, le plan cesse d'être amputé, et la garde cesse de mentir

Status: not_started

**Epic :** EPIC-017 — Socle balance-service + contrat de balance canonique
**Points :** 8 · **Sprint :** 20 (backend) · **Services :** `bilan-service` (`:3004`) **+**
`balance-service` (`:3007`) — ⚠️ **DEUX DÉPÔTS**
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

- [ ] **Un seul sha256** pour `sfd-bceao@2.0` dans les deux dépôts, déclaré dans les deux manifestes.
- [ ] **Mutation-test de la garde** : remettre l'ancien asset **fait échouer la CI**. ⚠️ Sans lui, la
      story reproduit exactement le défaut qu'elle répare.
- [ ] Le plan porte **372 comptes**, sourcés depuis `rcsfd-bceao-longueur-compte-2026-08-03.md`.
- [ ] Le comportement du moteur fiscal sur `tableDePassage` est **re-vérifié et écrit**.
- [ ] Les snapshots de liasse impactés sont **identifiés et traités**.
- [ ] Les deux gaps passent à **fermé** — ⛔ pas avant que la garde ait prouvé qu'elle détecte.

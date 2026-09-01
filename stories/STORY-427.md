# STORY-427 : La réponse du compte de résultat ne permet pas de redessiner la liasse légale — ni l'ordre des postes, ni les lignes à zéro, ni la colonne Note

Status: done

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/dto`, `modules/bilan/etats`, paquet référentiel
**Points :** 5 · **Sprint :** à slotter
**Origine :** maquette **FE-032**, 2026-08-27. Vérifié contre la DSF déposée
`1000745307_2025_Definitif (1).xlsx`, feuille *« COMPTE DE RESULTAT »*.

---

## Le fait — trois manques, une seule cause

`CompteResultatDto` publie **trois listes séparées** : `produits[]`, `charges[]`, `sig[]`.
La liasse déposée, elle, est **une seule cascade entrelacée** :

```
TA · RA · RB · XA · TB · TC · TD · XB · TE · TF · TG · TH · TI · RC · RD · RE · RF ·
RG · RH · RI · RJ · XC · RK · XD · TJ · RL · XE · TK · TL · TM · RM · RN · XF · XG ·
TN · TO · RO · RP · XH · RQ · RS · XI
```

On ne lit pas « les produits puis les charges » : on **descend** de la marge commerciale au
résultat net, palier par palier. Les trois manques en découlent :

### ① L'ordre légal n'est publié nulle part

Aucun champ `ordre` sur `PosteResultat` / `PosteSig`. ⚡ **Et l'ordre du paquet ne le donne
pas non plus** : `tableDePassage` range les **33 postes de détail d'abord, puis les 9 FORMULE
en bloc** — rendu dans cet ordre, le compte de résultat a ses neuf paliers **rejetés en pied de
tableau** et cesse de se lire. *(Constaté en construisant la maquette : la première version
avait exactement ce défaut.)* L'ordre légal ne vit que dans `pkg.postes`, **la liste
qu'aucune route ne publie** — c'est **STORY-399**, après STORY-394 (comptes de classe 7) et
STORY-397 (codes de réintégration) : **4ᵉ occurrence du même angle mort.**

Le remontage par les opérandes des SIG est une **heuristique**, pas un contrat : elle suppose
qu'un palier suit toujours ses opérandes, ce que rien n'impose.

### ② Les postes non alimentés sont omis, la liasse les imprime à zéro

`emettrePostes` n'émet que les postes agrégés. Le formulaire officiel imprime **ses 42 lignes**,
zéro compris — sur la DSF réelle examinée, **15 lignes sur 33 valent 0** et sont toutes
présentes. Un état déposé auquel il manque des lignes n'est pas l'état.

### ③ La colonne `NOTE` n'existe pas pour le compte de résultat

Le paquet porte `note` sur **14 postes du `BILAN_ACTIF`** et sur **zéro** poste du
`COMPTE_RESULTAT` (compté sur `syscohada-revise-2.1.json`). La liasse en porte une sur
**chaque** ligne : `21`, `22`, `6`, `12`, `23`, `24`, `25`, `26`, `27`, `28`, `3C&28`, `29`,
`3D`, `30`. C'est par elle qu'un réviseur saute à l'annexe qui justifie un montant — la
colonne n'est pas décorative, c'est la **navigation** de la liasse.

---

## Critères d'acceptation

- [x] AC-1 — `PosteResultat` et `PosteSig` portent `ordre: number`, repris de la position dans
      `pkg.postes` (l'ordre **légal**), et non de `tableDePassage`. Un tri sur `ordre` d'une
      concaténation `produits ∪ charges ∪ sig` redonne la cascade du formulaire.
- [x] AC-2 — La réponse émet **tous** les postes de détail déclarés par le référentiel, y
      compris ceux qu'aucun compte n'alimente (`montantN: 0`). ⚠️ **La convention N-1 ne
      bouge pas** : `montantN1 = null` veut toujours dire « le jeu N-1 n'a pas été produit »,
      `0` veut dire « produit, et il vaut zéro ». Les deux ne se confondent pas.
- [x] AC-3 — `PosteResultat` / `PosteSig` portent `note: string | null`, alimenté par le paquet.
- [ ] ⛔ **AC-4 — NON LIVRÉ, reporté sur STORY-437 AC-1** (voir *Progress Tracking*) — Le paquet `syscohada-revise@2.1` gagne la `note` de ses 33 postes de détail du CR
      (source : formulaire GUIDEF/DSF). Un référentiel qui n'en déclare pas rend `null` partout
      — **agnosticisme P7**, aucune note codée en dur dans le moteur.
- [x] AC-5 — Test de non-régression sur `sfd-bceao@2.0` : 14 postes de détail, `sig: []`,
      `note: null`, `ordre` strictement croissant. Le même code, un résultat agnostique.
- [x] AC-6 — Un test **de forme** : trier la réponse par `ordre` et comparer la suite de codes
      obtenue à la constante `['TA','RA','RB','XA','TB',…,'XI']` extraite du formulaire. Il
      échoue si quelqu'un réordonne le paquet.

## Vigilance

- ⚠️ **AC-2 grossit la réponse** : 42 postes au lieu de ~27 sur une balance ordinaire. C'est le
  prix d'un état déposable, et c'est borné par le référentiel (jamais par la balance).
- ⚠️ Les **repères A/B/C/D** de la liasse (`XB = CHIFFRE D'AFFAIRES (A+B+C+D)`) vivent
  aujourd'hui **en queue du libellé** de `pkg.postes` (`"Ventes de marchandises        A"`).
  Les publier proprement (champ `repere`) évite que chaque consommateur les redécoupe à la main.

## Conséquences ailleurs

- **FE-032** dessine déjà la cible (42 lignes, ordre légal, colonne Note) et **ne peut pas la
  livrer** sans cette story : c'est le blocage principal de l'écran.
- Le même manque frappera **FE-033** (TFT, notes annexes) : `TFT` a 26 postes au paquet.
- **STORY-399** reste nécessaire pour les écrans qui ont besoin de la **liste** des postes
  (saisie d'une surcharge) ; celle-ci ne la remplace pas, elle rend la **restitution** possible.

---

## ⛔ AC-4 NON LIVRÉ — et ce n'est pas un oubli

La donnée que l'AC-4 demande — le **renvoi de note des 33 postes de détail du CR** — **n'est
pas dans le dépôt**. La source est le formulaire GUIDEF/DSF (`1000745307_2025_Definitif
(1).xlsx`), absent du repo ; cette fiche ne donne que les **14 valeurs distinctes** relevées
sur l'imprimé (`21`, `22`, `6`, `12`, `23`…), **jamais la table poste → note**. Reconstituer
33 couples à partir de 14 valeurs serait publier une donnée réglementaire inventée — le
contraire exact de ce que la §③ reproche au paquet.

**STORY-437 AC-1 porte cette donnée**, avec sa source, les 35 numéros de la liasse et
l'arbitrage sur la granularité des sous-notes. Sa propre fiche le dit : *« elle est déjà
l'AC-3 de STORY-427 — les deux se recoupent, les instruire ensemble »*.

⇒ **Le mécanisme est livré et prouvé** : un paquet qui déclare une `note` la voit servie de
bout en bout (test sur paquet synthétique). Seule la **transcription SYSCOHADA** attend.
⚠️ Et elle concerne **deux** artefacts, pas un : `zone-franche-togo@1.0` porte les mêmes 43
postes CR sans note. La fiche de 437 n'en nomme qu'un.

---

## ⚡⚡ Le défaut que la fiche ne portait pas, et qui aurait vidé la story de son objet

`produits`, `charges` et `sig` étaient publiés au contrat en `array` d'**`items: {type:
'string'}`**. Un client généré les typait `string[]` et **ne pouvait lire aucun champ** — ni
`poste`, ni `montantN`, ni les deux que cette story ajoute. Le serveur, lui, envoyait des
objets depuis STORY-060.

⇒ **Publier `ordre` et `note` derrière ce contrat n'aurait rien livré à FE-032**, qui est le
motif entier de la story (« FE-032 dessine déjà la cible et ne peut pas la livrer sans
celle-ci »). `PosteResultatDto` et `PosteSigDto` sont donc devenus de vraies classes, et
`totalProduitsN1`/`totalChargesN1`/`resultatNetN1` ont cessé d'être des `object` opaques —
sans quoi l'écran aurait eu ses 33 lignes N-1 lisibles et ses **pieds de colonne** N-1
inaccessibles.

⛔ **Et rien ne le voyait.** La batterie de contrat confrontait la réponse réelle à sa
description pour le rattachement, le Bilan, les surcharges et les contrôles — **pas** pour le
compte de résultat. C'est ce trou qui est refermé, pas seulement le symptôme.

---

## ⛔ La fiche se trompait sur l'AC-5 : `sfd-bceao@2.0` déclare SEPT paliers

L'AC-5 annonce « `sig: []` » pour `sfd-bceao@2.0`. L'artefact packagé en déclare **7**
(`RSA`..`RSG`), dont la bottom line du compte de résultat ; seul `sfd-bceao@1.0` rend `[]`.
Les tests livrés portent la réalité mesurée, et la **description publiée** — qui donnait
SFD-BCEAO en exemple de « référentiel sans SIG » — a été corrigée : un client qui l'aurait
crue aurait affiché un compte de résultat de microfinance **sans son résultat net**.

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker
réelle rejouée sur l'état final**, PR `bilan-service` **#57** rebase-mergée sur `dev`.
**AC-4 explicitement reporté sur STORY-437** (voir ci-dessus) ; AC-1, AC-2, AC-3, AC-5 et
AC-6 livrés.

### Portes DoD

Lint 0 warning · build OK · **1 265 unitaires + 353 e2e** verts · couverture
**98,60 / 93,42 / 98,31 / 98,57** (seuils 90/65/90/90). `MOTEUR_VERSION` `1.2.0` → `1.3.0`.

### Passe de mutation — 9 mutations, 9 rouges, aucune par erreur de compilation

| mutation | test qui rougit |
|---|---|
| `ordre` pris sur `tableDePassage` au lieu de `pkg.postes` | AC-1 + AC-6 |
| émission limitée aux postes **alimentés** (retour à l'avant-427) | 8 tests |
| `note` non reprise du paquet | AC-3 |
| N-1 d'un poste vide forcée à `null` | AC-2 (convention N-1) |
| `ordreInconnu` → `MAX_SAFE_INTEGER` (ex æquo) | poste hors `pkg.postes` |
| `items` du contrat revenus à `string` | conformité réponse↔contrat |
| **émission en ordre DÉCROISSANT** | 3 tests — *et aucun des deux AC-5 avant leur dé-tautologisation* |
| un champ ajouté à `PosteSig` **seul** | `moteur-version.spec` (après extension) |
| `totalProduitsN1` redevenu opaque | inventaire des opaques |

### Vérification docker — Mongo réel, référentiels réels, rejouée après les correctifs de revue

| Mesure | Résultat |
|---|---|
| dry-run CR sur `syscohada-revise@2.1` | **42 lignes** dans l'ordre exact du formulaire : `TA RA RB XA TB … RQ RS XI`, paliers **intercalés** |
| lignes non alimentées | **31 des 33 détails à 0**, toutes présentes (2 comptes fournis) |
| colonne N-1 | lignes **et** pieds de colonne servis (`totalProduitsN1 = 800 000`), `montantN1 = 0` sur un poste vide |
| contrat servi | `produits.items` / `sig.items` en **`$ref`**, plus `type: string` ; `totalProduitsN1` en `number` nullable |
| snapshot d'une liasse validée | **v1**, `moteurVersion = bilan-engine@1.3.0`, 33 détails + 9 paliers persistés avec `ordre`/`note` |
| snapshots antérieurs | **3 documents figés en `1.2.0`, jamais réécrits** (append-only) |
| agnosticisme `sfd-bceao@2.0` | 14 détails + **7 paliers** `RSA`..`RSG`, cascade `RC1 … RSG`, `ordre` strictement croissant par liste, notes nulles |

### Revue de code — 6 constats, tous traités (commit dédié)

**Bloquant** — la description publiée de `sig` et le JSDoc de `PosteSigDto` donnaient
SFD-BCEAO en exemple de « référentiel sans SIG », et `DESC_ORDRE` présentait « 33 détails +
9 paliers » comme universel dans un contrat servi à l'identique aux tenants SFD et CIMA.

**Non-bloquants** —
① ⚡⚡ **les deux assertions « `ordre` strictement croissant » d'AC-5 étaient des
TAUTOLOGIES** (`expect(tri).toEqual([...tri].sort())`) : mesuré, une émission en ordre
**décroissant** les laissait vertes, sur le seul référentiel réel que ce critère éprouve.
Dé-tautologisées, elles ont immédiatement montré autre chose : `[...produits, ...charges]`
n'est **pas** globalement croissant, et ne doit pas l'être — deux vues d'une cascade
entrelacée que seul un tri sur `ordre` recompose. ② `moteur-version.spec.ts` figeait la forme
d'une ligne de **détail** et pas d'une ligne **SIG**, alors que la story change les deux.
③ Les trois totaux N-1 restaient opaques. ④ L'étiquette `AC-3/AC-4` faisait cocher un AC non
livré. ⑤ La comparaison inter-exercices lit « poste inexistant » là où le poste existait et
valait zéro dès qu'on compare un exercice figé en `1.2.0` à un figé en `1.3.0` — contrepartie
d'un tampon **correct**, nommée dans `evolution.ts` avec son correctif
(`moteurVersionHomogene`), **écart distinct**.

### Revue de sécurité — aucune vulnérabilité (confiance ≥ 80)

Examiné et écarté : **amplification de la réponse** (bornée par le référentiel, jamais par
l'entrée — mesuré : ~7 Ko, facteur ≈ 4,7, sous throttler et derrière 5 gardes ; ~6 Ko de plus
par snapshot contre ~800 Ko de soldes déjà figés, BSON hors d'atteinte ; aucun corps de
réponse au journal) · **fuite par le contrat** (`ordre`/`note`/libellés sont déjà servis
intégralement par `GET …/referentiel/postes` sous les mêmes gardes) · **non-répudiation**
(aucun chemin de réécriture, un export de version figée restitue le snapshot sans recalcul et
garde son tampon `1.2.0`) · **injection** (`poste` refusé en `422 POSTE_INCONNU` hors
`pkg.postes` ; artefacts vérifiés par checksum ; XLSX affecte une **chaîne**, pas une
formule, et aucun libellé CR ne commence par `=`/`+`/`-`/`@`) · **contournement de workflow**
(la batterie n'itère aucun poste du CR ; les totaux viennent de l'agrégation, pas d'une somme
de lignes — ajouter des zéros ne déplace rien).

### Bornes assumées, nommées plutôt que tues

- **AC-4** reporté sur STORY-437, avec ses deux artefacts.
- Les **repères A/B/C/D** vivent toujours en queue du libellé de `pkg.postes` — Vigilance de
  la fiche, **non traitée** (hors AC).
- Le **libellé** d'un poste de détail vient de `tableDePassage` et celui d'un palier de
  `pkg.postes` : deux sources dans la même réponse. Défaut **antérieur**, sujet de
  **STORY-428** — l'uniformiser ici l'aurait corrigé à moitié.
- `coherenceResultat`, `coherenceSig`, `referentiel` et `stamp` restent des `object` opaques
  au contrat : dette STORY-376, l'inventaire figé a **rétréci** de trois entrées.

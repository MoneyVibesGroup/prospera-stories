# STORY-427 : La réponse du compte de résultat ne permet pas de redessiner la liasse légale — ni l'ordre des postes, ni les lignes à zéro, ni la colonne Note

Status: ready-for-dev

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

- [ ] AC-1 — `PosteResultat` et `PosteSig` portent `ordre: number`, repris de la position dans
      `pkg.postes` (l'ordre **légal**), et non de `tableDePassage`. Un tri sur `ordre` d'une
      concaténation `produits ∪ charges ∪ sig` redonne la cascade du formulaire.
- [ ] AC-2 — La réponse émet **tous** les postes de détail déclarés par le référentiel, y
      compris ceux qu'aucun compte n'alimente (`montantN: 0`). ⚠️ **La convention N-1 ne
      bouge pas** : `montantN1 = null` veut toujours dire « le jeu N-1 n'a pas été produit »,
      `0` veut dire « produit, et il vaut zéro ». Les deux ne se confondent pas.
- [ ] AC-3 — `PosteResultat` / `PosteSig` portent `note: string | null`, alimenté par le paquet.
- [ ] AC-4 — Le paquet `syscohada-revise@2.1` gagne la `note` de ses 33 postes de détail du CR
      (source : formulaire GUIDEF/DSF). Un référentiel qui n'en déclare pas rend `null` partout
      — **agnosticisme P7**, aucune note codée en dur dans le moteur.
- [ ] AC-5 — Test de non-régression sur `sfd-bceao@2.0` : 14 postes de détail, `sig: []`,
      `note: null`, `ordre` strictement croissant. Le même code, un résultat agnostique.
- [ ] AC-6 — Un test **de forme** : trier la réponse par `ordre` et comparer la suite de codes
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

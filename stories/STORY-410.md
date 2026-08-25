# STORY-410 : un compte de microfinance n'a pas de canal — déclaré en « Banque », il hérite du compte comptable de la banque

Status: todo
**Service :** `balance-service` (`:3007`) · **Module :** `tresorerie`
**Points :** 3 · **Sprint :** S20 · **Epic :** EPIC-022
**Origine :** constat PO du 2026-08-25, à la revue de la maquette **FE-049** — « …et différents
comptes microfinance et autres ».

---

## Le constat, relevé à la source

Le canal d'un compte de trésorerie est fermé à **trois** valeurs :

```ts
// balance-service/src/modules/tresorerie/types/tresorerie.ts
export const TYPES_COMPTE_TRESORERIE = ['BANQUE', 'MOBILE_MONEY', 'CAISSE'] as const;
```

Un compte ouvert dans une **institution de microfinance** (SFD au sens BCEAO) n'y figure pas. Le
comptable n'a donc qu'une issue : le déclarer en `BANQUE`.

## Pourquoi ce n'est pas qu'une étiquette

Le premier effet est visible et bénin : l'écran affiche « Banque » sur un compte qui n'en est pas
une. **Le second ne se voit pas**, et c'est lui qui compte.

Le **compte comptable par défaut** d'un compte de trésorerie n'est pas saisi : il est **relu du
paramétrage de ventilation**, indexé **par canal** —

```ts
export const CLE_VENTILATION_PAR_TYPE = {
  BANQUE: 'banque', MOBILE_MONEY: 'mobileMoney', CAISSE: 'caisse',
} as const satisfies Record<TypeCompteTresorerie, string>;
```

⇒ un compte SFD déclaré en `BANQUE` hérite du **compte de banque** de la ventilation, et
`compteComptableParDefaut: true` — donc il **suivra silencieusement** toute correction future de ce
paramétrage. Sur un dossier dont le référentiel est `sfd-bceao@2.0`, ce n'est pas le même plan de
comptes que `syscohada-revise@2.1` : le défaut hérité peut être un compte qui **n'existe pas** dans
le plan du dossier, ou qui y désigne autre chose.

⚠️ **Et le rattachement est la donnée dont FE-049 a montré qu'elle décide de tout** : c'est lui qui
rend l'état de rapprochement lisible ou qui fond plusieurs comptes dans une racine. Un défaut
hérité du mauvais canal se propage donc jusqu'à l'état signé.

## Le contexte métier qui le rend courant

La microfinance n'est pas un cas marginal ici : **`sfd-bceao@2.0` est un référentiel packagé** de
`balance-service`, et l'assistant de création de dossier propose « Microfinance (SFD) » comme type
de client. La plateforme sait donc parfaitement qu'une IMF est un client — mais pas qu'une **PME
peut détenir un compte chez une IMF**, ce qui est le cas ordinaire d'un commerçant qui épargne
dans une mutuelle plutôt qu'en banque.

## Ce qui est demandé

1. Ajouter `MICROFINANCE` à `TYPES_COMPTE_TRESORERIE`.
2. Lui donner **sa** clé de ventilation (`microfinance`), et le paramétrage qui va avec — sans
   quoi l'ajout du canal déplacerait simplement le défaut au lieu de le corriger.
3. ⚠️ **Le canal est immuable après import** (le service l'interdit déjà, à raison : le basculer
   sous des lignes existantes les réécrirait rétroactivement). ⇒ prévoir **comment les comptes
   SFD déjà déclarés en `BANQUE`** rejoignent le bon canal — migration nommée, ou acceptation
   écrite qu'ils y restent.
4. L'enum sort à l'OpenAPI : le client doit **casser à la compilation** si une valeur s'ajoute
   (règle de STORY-375), pas l'ignorer en silence.

## Critères d'acceptation

1. Un compte se déclare en `MICROFINANCE` ; son compte comptable par défaut vient de **sa** clé.
2. Les comptes existants en `BANQUE` ne changent pas d'eux-mêmes.
3. Le front affiche le nouveau canal sans modification de code au-delà des libellés — la garde
   d'exhaustivité (`Record<CanalTresorerie, …>`) le force déjà.
4. Tests : le défaut de ventilation d'un compte `MICROFINANCE` **n'est pas** celui de `BANQUE`.

## Notes

⚠️ **« et autres » est resté hors périmètre, délibérément.** Le PO a dit « différents comptes
microfinance **et autres** ». Ouvrir le canal à une liste extensible (coopérative, caisse
d'épargne postale, compte de monnaie électronique non bancaire…) est un autre sujet : chaque
valeur exige **sa** clé de ventilation et donc **son** paramétrage. Cette story ajoute le canal
que le produit connaît déjà par ailleurs (un référentiel SFD packagé, un type de dossier
« Microfinance ») ; les suivants se décideront un par un, pas par un champ libre.

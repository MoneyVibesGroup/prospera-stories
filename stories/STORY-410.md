# STORY-410 : un compte de microfinance n'a pas de canal — déclaré en « Banque », il hérite du compte comptable de la banque

Status: in_progress
**Service :** `balance-service` (`:3007`) · **Module :** `tresorerie`
**Points :** 3 · **Sprint :** S20 · **Epic :** EPIC-022 · **Complexité :** medium
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

## Conception — écrite AVANT le code

### D-410-1 — `MICROFINANCE` est un **canal**, jamais un moyen de paiement

L'ajout se fait dans `TYPES_COMPTE_TRESORERIE` **seulement**. `MOYENS_PAIEMENT`
(`ESPECES | BANQUE | MOBILE_MONEY`, côté cahiers) reste à trois valeurs : l'ouvrir toucherait les
deux cahiers, leurs DTO, la ventilation et l'OCR — hors périmètre — et n'apporterait rien ici. Le
canal décrit **où l'argent est déposé** (un compte de trésorerie) ; le moyen de paiement décrit
**comment une transaction a circulé** (une ligne de cahier). Les deux ne se recouvrent pas.

### D-410-2 — sa clé de ventilation est `microfinance`, son défaut `538`

Sourcé, pas deviné : SYSCOHADA révisé, racine **`53` Établissements financiers et assimilés**,
sous-compte **`538` Autres organismes financiers**. Un SFD au sens BCEAO n'est pas une banque
(`52`) — c'est précisément la distinction que `53` porte.

⚠️ **Le choix du numéro n'est pas cosmétique.** `ComptesVentilationService.validerTous` valide
**tous** les comptes effectifs — les défauts compris — contre le plan du dossier avant chaque
agrégation. Un défaut non rattachable ferait échouer l'agrégation de **tous** les dossiers, y
compris ceux qui n'ont aucun compte microfinance. `538` franchit `estCompteRattachable` (le plan
packagé déclare la racine `53`), fait 3 caractères comme les six autres défauts, et reste sous
`longueurCompteDetail = 6`. La table de passage rattache déjà `53` au poste **`BS`** du bilan
(« Banques, chèques postaux, caisse », trésorerie **ACTIF**) : le nouveau défaut atterrit au bon
endroit de la liasse sans qu'aucun état ne bouge.

### D-410-3 — un canal sans moyen de paiement compatible serait **muet**, pas neutre

`MOYEN_PAR_CANAL` (`Record<TypeCompteTresorerie, MoyenPaiement>`, D-090-2) **casse à la
compilation** dès l'ajout de la valeur — c'est le garde-fou qui impose de trancher, et la réponse
est `MICROFINANCE → 'BANQUE'`.

Ce n'est pas un pis-aller. Le comptable qui paie depuis son compte SFD saisit `BANQUE` dans son
cahier : c'est la seule valeur que D-410-1 lui laisse. Mapper le canal sur autre chose — ou ne pas
le mapper — rendrait **toute** ligne portant un moyen de paiement incompatible avec un relevé
microfinance : le rapprochement automatique ne proposerait plus rien, sans erreur ni message. Un
appariement muet est pire qu'un appariement large : l'écart se voit, le silence non.

### D-410-4 — les comptes SFD déjà déclarés en `BANQUE` y restent (acceptation écrite)

Point 3 de la story, tranché : **aucune migration**. Trois raisons, dans cet ordre :

1. **Rien en base ne permet de les reconnaître.** Le seul indice serait le `libelle`, du texte
   libre. Une migration serait une devinette sur une chaîne — exactement ce qui déplacerait
   silencieusement la nature comptable d'un compte que personne n'a demandé à déplacer.
2. **Le canal est immuable après import, à raison** (`ModifierCompteTresorerieDto`) : le basculer
   sous des lignes déjà importées réinterpréterait rétroactivement des flux passés.
3. **Ne rien faire ne dégrade rien.** Un compte SFD resté en `BANQUE` garde le défaut `banque`
   (`521`) — l'état exact d'avant cette story. Elle n'aggrave pas la situation existante : elle
   ouvre le bon canal pour ce qui sera déclaré ensuite.

Le chemin de reprise existe et est **explicite** : le comptable pose un `compteComptable` sur le
compte (surcharge, toujours modifiable), ou déclare un nouveau compte au bon canal. ⇒ **AC-2 est
satisfait par construction** : rien ne bouge de soi-même.

### Périmètre — ce que cette story ne fait pas

- **Aucune valeur au-delà de `MICROFINANCE`** (« et autres » : cf. *Notes*).
- **`MOYENS_PAIEMENT` intouché** (D-410-1).
- **Aucune correction du fait que les défauts SYSCOHADA sont sémantiquement faux sur un dossier
  `sfd-bceao@2.0`** — `521`, `551`, `571` y existent tous les trois et y désignent autre chose
  (« Provisions pour risques… », « Primes liées au capital », « Capital »). Le nouveau défaut
  `538` n'échappe pas à la règle. C'est un défaut **préexistant**, qui vise tous les canaux à la
  fois, et qui appelle des défauts *par référentiel* : un autre sujet, une autre story.
- **Aucune migration de données** (D-410-4).

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

---

## Progress Tracking

**Statut : `in_progress`** — branche `MNV-410` (`docs/` et `balance-service`), ouverte le 2026-08-29.

### Conception (fait)

D-410-1 à D-410-4 écrites **avant** la première ligne de code, ci-dessus. Les deux points qui ont
demandé une vérification plutôt qu'une intuition :

- le numéro de compte par défaut (`538`) a été **sourcé** sur la nomenclature SYSCOHADA révisé
  (racine `53` → `538 Autres organismes financiers`), puis **confronté au plan packagé du service**
  (`estCompteRattachable` sur la racine `53`, `longueurCompteDetail = 6`) — parce que
  `validerTous` fait passer **les défauts eux-mêmes** devant le plan à chaque agrégation ;
- `MOYEN_PAR_CANAL` est un `satisfies Record<TypeCompteTresorerie, MoyenPaiement>` : il **casse à
  la compilation**, ce qui est exactement le mécanisme voulu par le point 4 de la story.

### Reste à faire

Implémentation, portes DoD, passe de mutation, vérification docker de la persistance, revue de
code, revue de sécurité, merge.

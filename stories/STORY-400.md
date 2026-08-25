# STORY-400 : Affecter une RACINE de comptes — et refuser la surcharge acceptée-puis-inerte

Status: ready-for-dev

**Épic :** EPIC-010 — Référentiels & table de passage (FR-005..FR-008)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/mapping-override`, `modules/bilan/table-de-passage`
**Points :** 5 · **Sprint :** S20
**Origine :** remontée le **2026-08-24** à la **revue métier de la maquette FE-030** par un
expert-comptable habitué à Sage — avant toute ligne de code frontend.

---

## Le fait, relevé à la source

Une surcharge s'applique par **égalité stricte** sur le numéro de compte :

```ts
// mapping-override.repository.ts
return new Map(actives.map((s) => [s.compte, s.cible]));   // Map(compte → cible)

// table-de-passage.service.ts
const surcharge = surcharges?.get(compte);                 // .get() — exact
```

Alors que la table de passage **packagée**, elle, rattache par **préfixe le plus long** :

```ts
for (let len = compte.length; len >= 1; len--) {
  const regles = index.get(compte.slice(0, len));
  if (regles) return regles.map(/* … */);
}
```

⇒ Le référentiel raisonne en **racines** ; la surcharge, non.

### Et il y a pire qu'une ergonomie pauvre : un piège silencieux

`ProposerSurchargeDto.compte` accepte `^\d[0-9A-Za-z]{1,19}$` — **`4762` passe le
format**. `MappingOverrideService.proposer` ne valide que la **cible**
(`POSTE_INCONNU`), **jamais le compte** : il n'est confronté ni au plan de comptes du
référentiel, ni aux comptes de la balance.

⛔ Conséquence, vérifiable de bout en bout : une surcharge sur `4762` est **acceptée
(201)**, **validée par un administrateur (200)**, s'affiche « **Validée** » dans le
journal, et **ne s'applique à rien** — aucun compte ne s'appelle littéralement `4762`.
Le cabinet croit avoir fait le travail. Rien, nulle part, ne le détrompe.

---

## Ce que ça coûte, concrètement

Un compte d'attente ou de régularisation n'existe jamais au singulier : `476200`,
`476210`, `476220`… Sur Sage, on affecte la racine **une fois**. Ici, quarante comptes
valent **quarante propositions et quarante validations d'administrateur** — un geste que
personne ne fera, et l'écran sera contourné.

⇒ **Contournement en place (FE-030), et il ne traite que le piège** : le dialogue
d'affectation **n'a aucun champ « compte »**. Le compte vient de la ligne d'où l'on
arrive, donc d'un compte **réellement présent dans la balance retenue**. Une racine est
ainsi **impossible à saisir** — mais rien n'est gagné sur le volume : le comptable
affecte toujours compte par compte.

---

## Périmètre

**Inclus**

- Une surcharge peut porter une **racine** aussi bien qu'un compte exact. Forme la plus
  simple qui serve : un champ `portee: 'COMPTE' | 'RACINE'` sur `ProposerSurchargeDto`
  (absent ⇒ `COMPTE`, donc **aucune migration et aucun client cassé**).
- `TableDePassageService.mapComptes` applique les surcharges au **préfixe le plus long**,
  exactement comme la table packagée — et **une surcharge sur un compte exact l'emporte
  sur une surcharge de racine**, comme un préfixe long l'emporte sur un court.
- **Fermer le piège côté serveur, indépendamment de la portée** : une surcharge validée
  qui ne couvre **aucun** compte connu doit être refusée ou signalée, jamais acceptée en
  silence. Deux pistes, à trancher à la conception :
  ① valider le compte/la racine contre `pkg.planDeComptes` à la **proposition** ;
  ② exposer sur `SurchargeResponseDto` un `couvre: number` (comptes de la balance
  courante réellement atteints) — plus riche, mais suppose une balance, ce que le service
  ne connaît pas encore (STORY-381).
- L'index d'unicité partielle suit la portée : deux surcharges `VALIDATED` ne peuvent pas
  se contredire sur **le même** couple `(dossier, portée, valeur)`.

**Hors périmètre**

- **Affecter en masse depuis l'écran** en envoyant N propositions : c'est le problème
  d'origine déplacé, pas résolu — N validations d'administrateur restent N validations.
- Toucher la table de passage **packagée** : une surcharge reste locale au dossier, le
  paquet n'est jamais modifié (FR-008).

---

## Critères d'acceptation

1. Une surcharge de **racine** validée rattache **tous** les comptes de la balance qui
   commencent par cette racine, sans en avoir été nommés.
2. Une surcharge de **compte exact** l'emporte sur une surcharge de racine qui le
   couvrirait — même règle de spécificité que le préfixe le plus long.
3. Une proposition dont le compte ou la racine ne correspond à **aucun** compte connu du
   référentiel est **refusée avec un code nommé**, ou porte au contrat un indicateur de
   couverture. Elle ne peut plus être acceptée **puis** validée **puis** inerte.
4. Un corps sans `portee` se comporte **exactement** comme aujourd'hui (non-régression :
   les surcharges déjà en base restent des surcharges de compte exact).
5. `PosteRattache.prefixe` porte la **racine** quand le rattachement vient d'une surcharge
   de racine — la traçabilité doit dire *ce qui* a produit l'affectation, ici comme pour
   le référentiel.

---

## Notes

- ⚠️ **Le mécanisme existe déjà dans ce service** : `indexerPrefixes` + la boucle
  longest-prefix de `rattacher`. Il ne s'agit pas d'inventer une sémantique, mais
  d'appliquer aux surcharges celle que la table packagée utilise déjà.
- ⚠️ **Recouvrement avec STORY-399** (le référentiel n'est lisible par aucune route) :
  l'AC-3 ci-dessus a besoin de `pkg.planDeComptes`, que 399 expose. **Les livrer ensemble**
  est plus économique — et sans 399, l'écran affectera toujours à l'aveugle, racine ou pas.
- ⚠️ **Recouvrement avec STORY-381** (`bilan-service` ne connaît aucune balance) : la
  piste ② de la couverture en dépend. La piste ① n'en dépend pas — c'est un argument pour
  elle.
- ⚡ **SECOND CONSOMMATEUR, RELEVÉ LE 2026-08-25 : FE-046** (rattachement du plan comptable, Atelier).
  Le même piège y a été retrouvé sur une **racine de produits** (`70`) : proposée, acceptée, validée,
  puis sans effet. Deux modules différents, deux services différents, le même mode de panne — ce
  n'est donc pas une particularité du Bilan mais **la sémantique de la surcharge elle-même**.
  ⇒ Ce qui change pour cette story : elle cesse d'être une commodité d'un écran pour devenir un
  **correctif de contrat**, et sa garde front doit être posée **dans les deux écrans**.
- Consommateurs nommés : **FE-030**, **FE-046**.

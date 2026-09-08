# STORY-624 : Segments SMS, alphabet non latin et coût annoncé avant l'envoi

Status: done

**Épic :** EPIC-063 — Passerelles tierces
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S36
**Prérequis :** **STORY-620** (adaptateur SMS)
**Origine :** rail B, bloc B3 · FR-N14, AD-16.

---

## Le récit

En tant qu'**organisation cliente**, je veux savoir ce qu'une campagne va coûter avant de la lancer,
afin de ne pas découvrir le montant sur la facture.

## Le fait

⚡ **Le nombre de segments est une DONNÉE du texte, pas une estimation.** 160 caractères en alphabet
latin, **70 en UCS-2** dès qu'un caractère sort de l'alphabet — un seul « é » mal encodé triple la
facture d'une campagne (FR-N14).

⚠️ Le coût annoncé avant l'envoi et le coût **rapporté** par la passerelle sont deux nombres
différents, et c'est le second qui entre en comptabilité.

## Critères d'acceptation

- [x] AC-1 — Le calcul de segments est une fonction pure, éprouvée sur les deux alphabets.
- [x] AC-2 — Le nombre de segments et le coût estimé sont annoncés **avant** l'exécution d'un envoi
      de masse.
- [x] AC-3 — Le coût réel rapporté ne remplace jamais rétroactivement un coût déjà comptabilisé.

---

## Ce que la livraison a appris (2026-09-07)

**Branche :** `MNV-624`, empilée sur `MNV-623`.

### ⚡ Le vrai travail n'était pas le calcul — il était le PRIX

`analyserSegments` existe depuis STORY-574, pure et éprouvée. Ce qui manquait, c'est ce que le coût
en fait : les catalogues du SMS et de WhatsApp annonçaient **zéro**, et zéro y voulait dire « non
contracté », pas « gratuit ». Une campagne de cinquante mille messages annonçait donc un montant
faux **avec l'autorité d'un chiffre**.

⚡ **Le prix est une donnée du CONTRAT DU MARCHAND, pas une propriété du fournisseur.** La leçon est
payée côté paiement (STORY-603) : deux organisations qui passent par le même agrégateur ne paient
pas le même tarif, parce qu'elles n'ont pas négocié la même chose. Le barème quitte donc le
catalogue statique pour les réglages de la passerelle de l'organisation.

⛔ **Et il ne peut RIEN AUTORISER** — c'est ce qui permet de le confier à un client sans toucher à
AD-6 : **le contrat dit COMBIEN, jamais SI**. Un barème absent ne ferme aucun canal ; il laisse le
catalogue servir, et l'annonce de masse dit qu'elle n'est pas contractée.

### ⛔ `Number('')` vaut ZÉRO, pas `NaN` — et le test l'a trouvé

Un champ de tarif laissé vide dans un formulaire de passerelle aurait été lu comme « gratuit », et
une campagne serait partie en annonçant zéro. `Number('0x10')` vaut d'ailleurs **seize**. La FORME
se contrôle donc **avant** la conversion — exactement la leçon de `Buffer.from(…, 'base64')`, qui
ignore en silence ce qu'il ne comprend pas (STORY-243, puis STORY-619).

### ⚠️ Le contrat GAGNE, même à zéro

Une organisation qui a négocié la gratuité l'a négociée : substituer le catalogue « parce que zéro
ressemble à une absence » aurait effacé une clause. C'est l'**absence des trois champs** qui dit
« pas de contrat », jamais la valeur de l'un d'eux.

⛔ **Et les trois vont ensemble.** Un montant sans devise n'est pas un montant (AD-16) ; une unité
sans montant ne dit rien. Une lecture partielle aurait produit un prix en devise **supposée**.

### ⚡ Demander un prix n'ouvre pas le coffre

`tarifDe` est une **question** qui n'apprend rien d'autre : elle ne passe pas par
`configurationPourRemise`, qui déchiffre les secrets de la passerelle et qu'une garde de
cloisonnement surveille pour cette raison. Entre deux appels qui prouvent la même chose, on prend
celui qui apprend le moins (leçon de STORY-244).

⚠️ **Une passerelle désactivée n'a pas de tarif** : annoncer le prix d'un canal qui n'enverra rien
aurait fait promettre un coût pour un envoi qui va être refusé.

### ⚡ AC-3 était déjà tenu — par un FILTRE, et il fallait le dire

`{ 'cout.source': 'BAREME' }` fait que le **premier** coût réel gagne : un second accusé ne réécrit
rien, et le compteur ne bouge que si l'`Envoi` a bougé. Le patron vient de STORY-596/597 ; cette
story l'assert.

### ⚠️ Un accent n'est pas un caractère hors alphabet

`é`, `à`, `ö` et même `€` sont dans GSM-7 (le dernier par la table d'extension, à deux septets). Ce
qui bascule un message en UCS-2 — et divise sa capacité par plus de deux — c'est un caractère
**vraiment** hors table : un idéogramme, une lettre arabe. Le test le distingue explicitement, parce
que « un é triple la facture » est une formule commode et fausse.

### ⛔ Points ouverts légués

1. **Rien n'écrit le barème** : les trois réglages se posent par la route de passerelle existante,
   sans DTO dédié ni contrôle à la saisie. Une console qui l'expose est une story à part.
2. **Aucun refus quand une campagne part sans barème contracté** : l'annonce le **dit**
   (`tarifContracte: false`), elle ne bloque pas. Refuser était une option ; la fiche ne le demande
   pas, et le contrat ne doit rien autoriser.
3. **La devise du coût réel reste celle du barème** (point ouvert hérité de STORY-597) : une
   passerelle qui facture dans une autre devise est un fait à traiter, pas un écart à cumuler.

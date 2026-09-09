# STORY-655 : Le QR interopérable — un code qui se scanne et qu'on refuse, et le CRC qui couvre sa propre étiquette

Status: done

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 3 · **Sprint :** ⚠️ **NON SLOTTÉE**
**Prérequis :** **STORY-599** (l'adresse de paiement scellée), **STORY-600** (l'adaptateur et ses couvertures)
**Origine :** spécification du QR interopérable reçue le **2026-09-09**, avec son **vecteur de test** — le premier contrat de ce schéma qui soit vérifiable **sans réseau**.

---

## Le fait

Le QR déjà produit par le service (STORY-253) encode **l'URL du lien de paiement de Prospera**. Il
fonctionne, il est éprouvé, et il n'a **rien à voir** avec le schéma interopérable. Le QR du schéma
est un autre objet : une charge utile EMV en TLV, dont le champ d'information marchande porte
l'adresse de paiement, et que **n'importe quelle application mobile de l'union** sait lire.

⚡⚡ **CETTE STORY EST LA PREMIÈRE DE TOUT LE RAIL QUI SE PROUVE SANS RÉSEAU.** La spécification
fournit une charge utile complète et son CRC attendu. Nous ne dépendons donc ni du bac à sable, ni
d'un compte résolu, ni d'une adresse enrôlée : **un vecteur de test est une garde sur le contrat
d'un tiers, exactement ce qui manquait à STORY-652 et STORY-653.** Là où il a fallu deux corrections
et un simulateur défaillant pour apprendre le contrat des demandes de paiement, celui-ci se vérifie
au premier essai.

⛔⛔ **LE CRC COUVRE SA PROPRE ÉTIQUETTE, ET C'EST LE PIÈGE QUI COÛTE LE PLUS CHER.** Il se calcule
sur toute la charge utile **y compris l'identifiant et la longueur du champ CRC** (`6304`), mais
sans sa valeur. L'oubli produit un code **parfaitement scannable** dont le contrôle échoue chez le
participant : le défaut ne se voit ni à la génération, ni à la lecture, mais au refus — c'est-à-dire
devant le payeur, au comptoir, sans qu'aucun message ne désigne la cause.

⚠️ **Et le format se trompe en silence dans l'autre sens aussi.** Une longueur TLV mal comptée ne
casse pas le code : elle le fait **lire autrement**. Un octet de trop sur le champ de l'adresse, et
le lecteur découpe la charge utile ailleurs — il obtient une adresse tronquée, donc un autre
compte, donc l'argent de quelqu'un d'autre. **Un QR mal formé n'échoue pas, il désigne autre
chose.**

## Critères d'acceptation

- [x] AC-1 — La charge utile est construite en TLV, dans l'ordre imposé, et le **vecteur de test de
      la spécification est reproduit à l'octet près**, CRC compris. ⚡ C'est la seule assertion de
      cette story qui prouve quelque chose sur le monde extérieur ; les autres prouvent nos règles.
- [x] AC-2 — ⛔ Le CRC est calculé **en incluant `6304`**. Une contre-preuve montre qu'un calcul qui
      l'omet produit une valeur **différente**, et le test la nomme : sans elle, la règle est une
      phrase, pas une garde.
- [x] AC-3 — ⛔⛔ **Seule une adresse de paiement (SHID) entre dans un QR interopérable.** Un numéro
      de téléphone ou un code marchand y sont refusés — c'est la spécification, et c'est aussi ce
      qui empêche qu'un QR imprimé désigne un alias que le schéma n'y accepte pas.
- [x] AC-4 — ⛔ **Un QR dynamique sans référence de transaction est refusé à la construction.** La
      spécification la rend obligatoire sur ce canal ; la produire quand même donnerait un code que
      le participant rejette, après impression.
- [x] AC-5 — La devise et le code marchand sont **figés** (celle du schéma, et le code générique).
      ⚡ Les rendre configurables les ferait diverger des couvertures déclarées par l'adaptateur, et
      **deux déclarations de la même chose divergent toujours** — c'est le refus déjà posé en
      STORY-599 pour la liste des États.
- [x] AC-6 — ⚠️ **Aucune valeur ne peut dépasser ce que sa longueur sait exprimer.** Le préfixe de
      longueur tient sur deux chiffres : une valeur de cent caractères ou plus n'est pas encodable,
      et la construction **échoue** plutôt que de produire une charge utile qui se lira de travers.
- [x] AC-7 — Le pays vient de la **couverture déclarée**, jamais d'une saisie : un QR pour un pays
      que le schéma ne sert pas est inexprimable.

## Ce qui sera facile à rater

1. ⛔⛔ **Câbler ce QR dans le mode de présentation de la demande poussée.** Ce sont deux chemins
      opposés : dans l'un, la demande va au payeur dans son application ; dans l'autre, le payeur
      scanne. STORY-600 a écarté le QR du paiement **à distance** sur une lecture du schéma, et la
      spécification reçue décrit des usages **de présence** ou de facture présentée. **Les marier
      demande un arbitrage, pas une ligne de code** — et cette story n'y touche pas.
2. ⛔ **Oublier `6304` dans le calcul.** Voir AC-2. C'est le défaut qui se découvre au comptoir.
3. ⚠️ **Compter la longueur en octets plutôt qu'en caractères**, ou l'inverse. Le vecteur de test
      tranche, à condition de l'écrire.
4. ⚠️ **Confondre les deux QR du service.** Celui de STORY-253 encode une URL ; celui-ci encode une
      destination de paiement. Les ranger dans le même service en ferait deux variantes d'une même
      chose, alors qu'ils n'ont ni le même lecteur, ni le même cycle de vie, ni le même risque.

## Ce que la story ne fait pas

- ⛔ **Elle ne rend le QR par aucune route.** Produire la charge utile et l'exposer sont deux
      décisions : la seconde suppose tranché *qui* peut le demander, *pour quel compte*, et *dans
      quel canal* — donc l'arbitrage du point 1 ci-dessus.
- ⛔ **Elle ne dessine pas d'image.** Le service sait déjà rendre un QR en SVG (STORY-253) ; le
      réutiliser sera une ligne le jour où une route existera.

## Notes

- Voir [[STORY-253]] (le QR du lien, à ne pas confondre), [[STORY-599]] (l'adresse de paiement),
  [[STORY-600]] (les couvertures et le refus du QR à distance), [[STORY-654]] (la recette réelle).
- ⚡ **La spécification nomme aussi un identifiant que nous n'avons pas** : celui de bout en bout,
  créé par le participant lors de la recherche d'alias. Il n'apparaît ni à la création d'une demande
  ni dans notre modèle — c'est par notre propre référence que la demande se consulte (STORY-600). À
  reprendre le jour où la notification signée arrivera, puisque c'est elle qui le portera.

## Livraison

🏁 **Livrée le 2026-09-09**, branche `MNV-655`. 15 tests, dont le vecteur de
la spécification reproduit à l'octet près. Suites : 3 283 unitaires, 252 de bout
en bout, lint 0.

⚠️ **Écart constaté dans la spécification elle-même** : le vecteur publié porte
un canal marchand `500`, que sa propre prose ne liste pas (elle nomme `000`,
`400` et `731`). Il est reproduit **tel quel** — un vecteur de test vaut par ce
qu'il est, pas par ce qu'on aurait préféré qu'il soit. À rapporter au
participant, pas à corriger en silence.

⚡ La recette d'appel réel (STORY-654) construit désormais un QR sur l'adresse
réelle et l'imprime, prêt à scanner avec l'application du bac à sable — **sans
réseau**, donc sans dépendre du défaut de résolution des comptes.

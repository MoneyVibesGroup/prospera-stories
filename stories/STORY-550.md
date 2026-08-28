# STORY-550 : « Rechercher l'erreur » n'est pas outillé — un bilan déséquilibré ne rend que trois totaux et aucune piste

Status: ready-for-dev

**Épic :** EPIC-011 — États financiers (liasse OHADA : Bilan, CR, TFT/TAFIRE, annexes)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/etats`
**Points :** 5 · **Sprint :** S20
**Origine :** lecture du corpus pédagogique `Image_lecons` (96 fiches, 2026-08-28) — la fiche
**« Construire un bilan » 6/7** clôt son pipeline par une 5ᵉ étape que le service n'outille pas :
*« Si oui → bilan équilibré ✓. **Si non → rechercher l'erreur.** »*
**Réf. code :** `controles-coherence-production.service.ts:controleEquilibre` ·
`bilan-production.service.ts:construireControle` · **STORY-486** (surcharge vers un poste sans règle) ·
**STORY-401** (comptes non affectés)

---

## Le fait

`controleEquilibre()` en anomalie pousse exactement trois éléments, et rien d'autre :

```ts
const elements: ControleElement[] = equilibreN
  ? []
  : [
      { ref: 'totalActifN',  valeur: totalActifN },
      { ref: 'totalPassifN', valeur: totalPassifN },
      { ref: 'resultatNetN', valeur: resultatNetN },
    ];
// + { ref: 'BZ' }, { ref: 'DZ' } quand la cascade est disponible
```

⇒ **Le service dit COMBIEN, jamais OÙ.** C'est exactement la forme du contrôle de la liasse
réelle relue le 2026-08-27 (`ctrl-Contô.txt`, dossier PMS, NIF 1000745307) :

```
Contrôle - BILAN - Equilibre du bilan
Total Actif | Total Passif | Ecart     | Statut
3060000     | 0            | 3060000   | FAUX
```

L'écran, lui, fait déjà ce qu'il peut avec ça — `bilan.etats.controle.desequilibreAide` dit
*« La cause se trouve dans les comptes écartés ou dans un arbitrage de la table de passage »*.
**C'est un panneau indicateur, pas un diagnostic** : il nomme les deux tiroirs, il ne dit pas
lequel, ni combien.

⚡ **Et le front comble le trou en reconstituant.** `BilanDto.comptesNonMappes` est un
`string[]` — de simples numéros, ni libellé ni montant (FE-031 amendement ⑤). L'écran va
rechercher les montants **dans la balance retenue**, côté client. Le seul chiffre qui permette
de dire « ces comptes écartés expliquent l'écart » n'est donc **pas publié par le calcul** : il
est recomposé par l'écran, hors du contrôle du service.

## Ce que ça coûte, mesuré sur deux cas réels

Le corpus fournit deux bilans « corrigés » qui ne s'équilibrent pas. Ils sont les deux formes
que prend l'erreur, et **aucune des deux n'est trouvable avec trois totaux** :

| Cas | Erreur réelle | Ce que le contrôle rend aujourd'hui |
|---|---|---|
| **ALVAREZ 7/7** — actif 24 000 000 / passif imprimé 24 000 000, somme réelle 21 000 000 | le découvert bancaire de 2 000 000 est porté **à la fois** en trésorerie-actif et en trésorerie-passif | `ecartN = 3 000 000`, trois totaux |
| **Bénin Services** — passif imprimé 6 100 000, somme réelle 6 200 000 | le **résultat de l'exercice** (400 000, calculé par son propre CR) n'est pas reporté au passif | `ecartN = 100 000`, trois totaux |

⚠️ Le second est déjà couvert par `COHERENCE_RESULTAT` (résultat CR = `CJ`) — **et c'est
précisément la démonstration** : quand un second contrôle nomme la cause, l'écart devient
réparable ; quand il n'y en a pas, l'utilisateur relit sa balance ligne à ligne.

## Périmètre

**Inclus — publier les pistes CALCULABLES, jamais devinées**

`EQUILIBRE_BILAN` en anomalie porte, en plus des totaux :

1. **Le poids des comptes écartés, avec son signe.** Σ(débit − crédit) des comptes de
   `comptesNonMappes`, et le verdict `expliqueLEcart: boolean` — cette somme est-elle égale à
   `ecartN` ? C'est la première question que pose un réviseur, et le service a les deux nombres.
2. **La ventilation de l'écart par classe SYSCOHADA** (1→8). Un écart logé en classe 5 ne se
   cherche pas au même endroit qu'un écart en classe 2.
3. **Les comptes rattachés à un poste sans règle exploitable** — le cas de **STORY-486** :
   le compte *paraît* affecté et son solde n'entre nulle part. À nommer ici plutôt qu'à laisser
   deviner, puisque les deux stories décrivent le même symptôme vu de deux bouts.
4. **Les comptes portés sur plusieurs postes** — la forme exacte du cas ALVAREZ (un même solde
   compté deux fois, une fois à l'actif et une fois au passif).

**Le montant de chaque compte écarté est publié** : le front cesse de le reconstituer depuis la
balance.

**Hors périmètre**

- Corriger quoi que ce soit. Ce contrôle **désigne**, il n'arbitre pas — la correction reste à
  la table de passage (règle posée par FE-030/FE-031, non rouverte).
- Toute piste qui supposerait l'intention du comptable (« vous avez sans doute voulu… »).
  Un diagnostic qui se trompe coûte plus cher que pas de diagnostic.

## Critères d'acceptation

1. `EQUILIBRE_BILAN` en `ANOMALIE` publie les quatre pistes ci-dessus, en plus des totaux
   actuels — **témoin de non-régression : les trois `ref` existants sont inchangés.**
2. `EQUILIBRE_BILAN` en `OK` ne publie **aucune** piste : un diagnostic sur une liasse juste
   serait du bruit. ⚠️ **Exception : la piste n°1 reste publiée**, parce qu'un équilibre avec
   des comptes écartés n'est pas une preuve d'exactitude (branche `compense` de STORY-401).
3. **Fixture ALVAREZ** — deux jeux de soldes où un même compte alimente un poste d'actif et un
   poste de passif : `ecartN = 3 000 000` **et** la piste n°4 nomme le compte.
4. **Fixture Bénin Services** — le résultat non reporté : `EQUILIBRE_BILAN` en anomalie,
   `COHERENCE_RESULTAT` en anomalie, et la piste n°2 loge l'écart en classe 1.
5. Cas **compensé** : comptes écartés au débit et au crédit qui se neutralisent —
   `EQUILIBRE_BILAN = OK`, piste n°1 publiée et non nulle, liasse non validable.
6. Les nouveaux champs sont au contrat OpenAPI avec leur `type` explicite — **pas un
   `string[]` déduit d'un `example`** (le piège de `mappes`, STORY-398).

## Notes

- ⚠️ **Cette story ne change aucun verdict.** `equilibreN` reste l'identité de STORY-059 ;
  seule la charge utile de l'anomalie s'enrichit. Un contrôle qui changerait d'avis en
  gagnant des pistes invaliderait les liasses déjà figées.
- ⚡ La 5ᵉ étape de la fiche 6/7 est la seule des cinq que le produit n'outille pas : les quatre
  premières (données de départ → classement → total actif → total passif) sont respectivement
  la balance source, la table de passage et les deux agrégations de `construireControle`.
- ⛔ **Ne pas dériver ce diagnostic du corpus pédagogique lui-même.** Ses numéros de comptes
  sont ceux du plan comptable **français** (`512` Banque, `641` Salaires, `707` Ventes de
  marchandises), pas SYSCOHADA. Seuls ses **cas** servent, jamais ses codes.

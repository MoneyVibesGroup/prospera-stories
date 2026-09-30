# STORY-550 : « Rechercher l'erreur » n'est pas outillé — un bilan déséquilibré ne rend que trois totaux et aucune piste

Status: done

**Épic :** EPIC-011 — États financiers (liasse OHADA : Bilan, CR, TFT/TAFIRE, annexes)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/etats`
**Points :** 5 · **Sprint :** S20 · **Complexité :** medium
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

---

## Cadrage du 2026-09-29 — ce que le code dit, et les décisions qui en sortent

### Le fait qui structure tout : l'écart n'a que TROIS sources

`BilanProductionService.agreger` cumule les lignes par compte, choisit **un** poste par compte, et
`ecartN = totalActif − (totalPassif + résultat)` vaut exactement **`Σ (débit − crédit)` des comptes qui
ont atteint un poste**. D'où l'identité, exacte :

```
ecartN = desequilibreBalance − Σ solde(non affectés) − Σ solde(rattachés sans règle)
```

où `desequilibreBalance = Σ débit − Σ crédit` de la balance source. Aucune autre cause n'est possible :
c'est ce qui rend les pistes **calculables** au sens de la story, et la ventilation **exacte**.

### Constats (prémisses vérifiées contre le code)

1. **« `comptesNonMappes` est un `string[]` sans montant » est périmé** : STORY-401 publie déjà
   `soldesComptesNonMappes` (compte + solde net) dans `BilanDto`. Le montant de chaque compte écarté
   est donc déjà au contrat ; la story le **reprend dans la piste n°1** (au contrôle lui-même), sans
   second canal.
2. ⛔ **AC-4 n'est pas atteignable tel qu'écrit : `COHERENCE_RESULTAT` ne peut pas rougir sur « le
   résultat non reporté ».** Il compare deux fois la même agrégation (`resultatNetCR` et
   `resultatNetBilan`, constat déjà posé par STORY-426), et le moteur **place** le résultat au passif
   par construction. Dans le moteur, « le résultat n'atteint pas le passif » prend la forme d'un compte
   de résultat (`13`) qui n'atteint aucun poste — et c'est alors la **ventilation** (piste n°2) qui loge
   l'écart en classe 1, `COHERENCE_RESULTAT` restant `OK`. La fixture le montre au lieu de le cacher.
3. ⛔ **AC-3 tel qu'écrit (« un même compte alimente un poste d'actif et un poste de passif ») est
   impossible dans le moteur** : un compte est placé sur **un seul** poste par colonne (ventilation au
   solde pour les classes 4/5). La forme ALVAREZ, dans une balance, est **un même solde saisi deux
   fois** — le moteur cumule les lignes d'un compte avant de le placer, sans rien en dire.
4. **Piste n°3 (STORY-486) déjà en partie fermée par STORY-676** : une **surcharge** vers une cible sans
   détail rend désormais le compte **non mappé**. Reste le cas d'un rattachement **par le paquet** sans
   règle exploitable (`choisirRattachementBilan` → `undefined`) : aucun artefact livré ne le produit,
   un référentiel **déposé** le peut. La piste le nomme.

### Décisions

- **D-550-1 — la matière vient de la passe d'agrégation, la publication de la batterie.** `BilanProduit`
  gagne `diagnosticEquilibre` (`desequilibreBalance`, `comptesSansRegle`, `comptesSurPlusieursLignes`),
  calculé dans `agreger` — jamais recalculé à côté. `ControleArticulation` gagne `pistes?`, porté par
  **`EQUILIBRE_BILAN` seul**.
- **D-550-2 — AC-4 amendé** (constat 2) : fixture Bénin = compte `131000` (résultat 400 000) à la
  balance, surchargé vers `CP` (sous-total, donc non mappé) ⇒ `EQUILIBRE_BILAN` en anomalie,
  **`COHERENCE_RESULTAT` `OK`** (démontré, non caché), ventilation `[{ classe: '1', effet: 400 000 }]`.
- **D-550-3 — AC-3 amendé** (constat 3) : piste n°4 = **comptes présents sur plusieurs lignes de la
  balance source**, avec chaque ligne. Fixture ALVAREZ = balance juste + trésorerie `521000` saisie une
  seconde fois (3 000 000) ⇒ `ecartN = 3 000 000`, la piste nomme `521000`.
- **D-550-4 — la ventilation n'attribue que ce qui s'attribue.** `parClasse` = effet sur l'écart
  (`−Σ solde`) des comptes écartés (non affectés + sans règle), par premier caractère du compte (la
  classe, sans présumer le plan — P7), classes à effet nul omises ; la part due à la balance source
  déséquilibrée est publiée **à part** (`desequilibreBalance`) : l'attribuer à une classe serait deviner
  où manque l'écriture. Invariant testé : `Σ effet + desequilibreBalance = ecart`.
- **D-550-5 — piste n°1 signée** : `soldeNet` (signé), `montantAbsolu`, et `expliqueLEcart ⟺ au moins
  un compte ∧ ecartN = −soldeNet` (un solde débiteur écarté minore l'actif). Vraie aussi pour un
  équilibre compensé (`0 = −0`) : c'est précisément le cas où l'équilibre ne prouve rien (AC-5).
- **D-550-6 — en `OK`** : piste n°1 publiée (éventuellement vide), les trois autres à `null`
  (non publiées). Aucun verdict ne change ; les `ref` historiques des `elements` sont inchangés.
- **D-550-7 — `MOTEUR_VERSION` 1.20.0 → 1.21.0** : deux clés de plus dans chaque snapshot figé (sonde
  `moteur-version.spec.ts` mise à jour), aucun montant ni verdict ne bouge.
- **D-550-8 — contrat** : tous les nouveaux objets sont des **classes DTO** (`PistesEquilibreDto`,
  `PisteComptesEcartesDto`, `VentilationEcartDto`, `EffetParClasseDto`, `CompteSansRegleDto`,
  `CompteSurPlusieursLignesDto`, `LigneBalanceSourceDto`, `DiagnosticEquilibreDto`) avec `type`
  explicite — jamais un tableau déduit d'un `example` (AC-6).

## Progress Tracking

- 2026-09-29 — cadrage (D-550-1..8) ; branches `MNV-550` ouvertes (`docs/`, `bilan-service`) ; statut
  `in_progress`.
- 2026-09-29 — dev (`bilan-service` `MNV-550`) : `diagnosticEquilibre` relevé dans la passe
  d'agrégation N, `pistes` publiées par `EQUILIBRE_BILAN`, 8 DTO typés, `MOTEUR_VERSION` 1.21.0.
  Spec `equilibre-pistes-syscohada.spec.ts` sur l'artefact réel (ALVAREZ, Bénin, compensé, trois
  sources à la fois, compte sur trois lignes) + e2e de contrat (AC-6).
- **Portes** (état final) : lint 0 · build OK · 280 suites / 10 543 unitaires + 2 489 e2e verts ·
  couverture ≥ seuils.
- **Mutations — 11/11 tuées, toutes COMPILABLES** (`tmp/verif-docker-550/mutations.sh`) : signe de
  `expliqueLEcart`, pistes publiées en `OK`, signe de l'effet par classe, première ligne perdue,
  troisième ligne perdue, compte sans règle oublié, déséquilibre de la balance à 0, classe à effet
  nul publiée, compte à solde nul listé, sans-règle hors ventilation, `expliqueLEcart` sans compte.
  ⚠️ Une première rédaction du mutant « pistes en OK » ne COMPILAIT pas (« Tests: 0 total ») :
  réécrite ; la passe distingue désormais « non exécutée » de « survit ».
- **Revue de code** (opus) : 0 bloquant ; 2 constats corrigés (commit `MNV-550(revue)`) — la passe
  N-1 calculait un diagnostic jeté (et pouvait lever `MONTANT_HORS_BORNES` pour rien), chaque ligne
  de la balance était copiée ; **1 laissé** : `soldeNet`/`montantAbsolu` sommés sans borne, comme le
  fait déjà `COMPTES_NON_AFFECTES` (irréaliste en XOF : 5 000 lignes au plus).
- **Revue de sécurité** (opus) : **0 constat** — bornes réelles vérifiées (`@ArrayMaxSize(5000)`,
  pire cas ≈ 0,5 Mo par snapshot), aucune donnée hors de la balance fournie par l'appelant, aucun
  verdict ni gate 422 altéré, exemples Swagger fictifs.
- **Vérification docker sur stack NEUVE, état final** (`tmp/verif-docker-550/`, `181d4e8`) :
  **63 OK, 0 KO**. Code de la branche prouvé (restart + « Found 0 errors », sha256 hôte = monté,
  marqueurs compilés). Dossier X : balance juste validée, jeu reçu avec `521000` saisie deux fois ⇒
  `ANOMALIE`, écart 9 000 000, piste n°4 = `521000` sur deux lignes, ventilation
  `desequilibreBalance: 9 000 000` sans classe, `ref` historiques inchangés ; relu par GET
  (recalcul depuis la base) identique ; `jeux_etats.soldesN` porte bien les deux lignes (mongosh) ;
  validation **422 `LIASSE_NON_VALIDABLE`**, **0 snapshot**. Dossier Y : balance juste ⇒ `OK`, piste
  n°1 publiée vide, trois `null` ; liasse figée v1 ; en base (`snapshots_liasse`) `moteurVersion
  1.21.0`, pistes et `diagnosticEquilibre` figés avec les **tableaux vides conservés**
  (`minimize: false`) ; `GET …/versions/1` rend exactement ce qui est en base.
  ⚠️ Deux lancements précédents avortés par le démon Docker (500 sur l'API, puis blocage) :
  Docker Desktop redémarré, `down -v` rejoué à la main, vérif relancée de zéro.
- 2026-09-30 — `bilan-service#148` rebase-mergée sur `dev` (`62f47c7`, `53ae437`), branche
  supprimée ; statut `done`.


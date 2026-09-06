# STORY-462 : Le taux de marge saisi n'est vérifiable contre rien — les ancres ne publient pas la marge brute constatée

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en cherchant quoi afficher en regard du champ « taux de marge » de l'écran FE-035 — et en ne trouvant rien.

---

## Le fait

Le moteur demande deux taux, `tauxMargePct` et `tauxChargesPct`, tous deux appliqués aux produits. Les
ancres publient `produitsBase`, `chargesBase` et `resultatBase`.

On peut donc contrôler **une seule chose** : que `tauxMarge − tauxCharges` ressemble au ratio constaté
`resultatBase / produitsBase` (**1,22 %** sur le dossier de démonstration). Chacun des deux taux **pris
isolément n'a aucun constaté** auquel se comparer.

Or ce sont les deux nombres que le comptable règle en premier, et la **marge brute** est le repère
central d'un distributeur. Le moteur des états la calcule pourtant : les SIG (`XA` marge commerciale,
`XB` valeur ajoutée…) existent dans `LiasseProduite`. Mais `ancrage.ts` **interdit** de les lire —
invariant P7, à raison : y toucher ferait entrer un code de poste dans le prévisionnel.

Il ne s'agit donc pas de « lire un poste de plus », mais de **publier un agrégat de plus**.

## Critères d'acceptation

- [x] AC-1 — `AncresProjection` gagne `margeBruteBase: number | null` et `margeBruteAncree: boolean`,
      alimentés par un **marqueur** de paquet référentiel (patron `tresorerie?`), jamais par `sig[]`.
- [x] AC-2 — L'invariant P7 est **re-testé** : la spec exécutable qui interdit les codes de poste dans
      `projection/` doit rester verte.
- [x] AC-3 — Un référentiel sans marqueur de marge (SFD-BCEAO) rend `null` **signalé** ; l'écran
      retombe alors sur le seul contrôle `marge − charges`.
- [x] AC-4 — La réponse publie le **taux** constaté, pas seulement le montant : c'est ce qui se compare
      à la saisie.

## Conséquences ailleurs

- L'écran FE-035 affiche aujourd'hui le contrôle `marge − charges` **et déclare** qu'il est le seul
  possible. Cette story est ce qui lui permettra d'en afficher trois.

---

## Progress Tracking

**Statut : `done`** (2026-09-06) — PR `bilan-service` **#92** et PR `balance-service` **#93**
rebase-mergées sur `dev` **ensemble**, branches supprimées. Branches `MNV-462` créées dans **trois**
dépôts, **avant** la première ligne de code.

```
bilan-service   : MNV-462
balance-service : MNV-462
docs            : MNV-462
```

**Périmètre — DEUX dépôts de code**, pour la même raison qu'en STORY-461 : le marqueur change l'octet de
`syscohada-revise-2.1.json`, recopié **à l'octet** dans `balance-service` (patron STORY-428, **sixième**
passage). `zone-franche-togo-1.0.json` bouge aussi, il n'est pas recopié.

### Ce qui a été livré

- **Marqueur `MappingRule.margeBrute`** — quatrième du patron (`tresorerie` 061, `role` 112,
  `chiffreAffaires` 457, `bfr` 461), sourcé sur le **seul** poste `XA` (« MARGE COMMERCIALE ») en
  SYSCOHADA. Le générateur **lève** au-delà d'un poste marqué, comme pour le chiffre d'affaires.
- **`CompteResultatProduit.margeBruteN`** publié, puis ancré en `margeBruteBase` + `margeBruteAncree`
  (AC-1) et converti en **taux** `tauxMargeBruteConstatePct` (AC-4).
- **Une seule fonction pour les deux marqueurs** : `chiffreAffaires()` est devenue
  `valeurDuPosteMarque(…, prédicat)`. Deux copies de cette logique auraient divergé d'abord sur le
  **repli**, qui est précisément ce qu'elle a de délicat.
- **`MOTEUR_VERSION` 1.15.0 → 1.16.0** : la forme figée dans chaque snapshot change.
- **AC-2** — la garde exécutable P7 de `coherence-projection.spec.ts` reste **verte** : `LiasseProduite`
  n'est référencé que par `ancrage.ts` dans `projection/`, et les moteurs ne reçoivent que des ancres
  agnostiques. La marge brute arrive comme un **agrégat**, jamais depuis `sig[]`.

### Le point de conception à ne pas lire de travers

**`XA` est une marge sur MARCHANDISES ; `tauxMargePct` s'applique au TOTAL DES PRODUITS.** Les deux
coïncident chez un distributeur pur — le cas pour lequel ce repère existe — et **divergent** chez un
prestataire, dont la marge commerciale peut être **nulle** face à une saisie de 30 %. Le taux publié est
donc un **repère**, pas une valeur à recopier, et le contrat le dit en toutes lettres. Le taux est
d'ailleurs rapporté aux **produits** — la même assiette que la saisie : le rapporter aux seules ventes de
marchandises donnerait un ratio comptable plus juste et **incomparable** au champ qu'il éclaire.

### ⚡⚡ Le trou que STORY-461 avait payé, anticipé ici — et il était bien là

Muté le **prédicat de sélection** du marqueur (`r.margeBrute` → `r.chiffreAffaires`) : la mutation
**compile**, et **79 tests restaient VERTS**. `margeBruteN` aurait silencieusement porté le chiffre
d'affaires, et le taux constaté publié face à la saisie aurait valu **le CA rapporté aux produits** —
18,32 % attendus, 76,3 % servis. Les batteries de marqueur constatent l'**artefact**, celles du moteur
partent d'ancres **fabriquées** : entre les deux, la **production** n'était traversée par rien. C'est
exactement le constat que la revue de STORY-461 a levé, transposé au marqueur suivant.
Correctif : une batterie sur le paquet **réel** où **les trois nombres diffèrent** (marge 3 000,
CA 16 000, produits 16 000) — sans cette divergence, la mutation resterait verte.

### Portes de qualité

`bilan-service` : lint 0 warning · build OK · **2 014 unitaires** + **554 e2e** verts · couverture
98,89 / 94,41 / 98,86 / 98,91, **100 %** sur `ancrage.ts`.
`balance-service` : lint 0 warning · build OK · **3 662 unitaires** + **899 e2e** verts (la porte complète,
cette fois — leçon de STORY-461).

**Mutations éprouvées** (chacune **compile**) :

| Mutation | Résultat |
|---|---|
| prédicat du marqueur : `margeBrute` → `chiffreAffaires` | ✅ rouge (2 tests) — **était vert avant le correctif** |
| `ancrage` : `margeBruteAncree` forcé à `false` | ✅ rouge (2 tests) |
| source : un second poste marqué `marge_brute` | ✅ le **générateur lève** |
| `MOTEUR_VERSION` laissée à 1.15.0 | ✅ rouge (la sonde voit `margeBruteN` arriver) |
| champ servi mais non publié au contrat | ✅ rouge — **le balayage OpenAPI l'a trouvé avant moi** |

### Vérification docker (2026-09-06, conteneur **redémarré**)

1. **Contrat servi** — `margeBruteBase` et `tauxMargeBruteConstatePct` en **nombres nullables**,
   `margeBruteAncree` en booléen, `CompteResultatDto.margeBruteN` en nombre nullable. Les mises en garde
   « REPÈRE » et « MARCHANDISES » sont bien dans la description publiée.
2. **⚡⚡ La mesure qui départage les deux marqueurs**, sur une balance réelle (dry-run) :
   `margeBruteN = 3 000 000` (XA) contre `chiffreAffairesN = 16 000 000` (XB) et
   `totalProduitsN = 16 000 000`. Les trois diffèrent : le marqueur sélectionne bien **son** poste.
3. **AC-3 mesuré sur un cas RÉEL** — la projection assise sur un snapshot figé sous le moteur **1.15.0**
   rend `margeBruteBase: null`, `margeBruteAncree: false` et `tauxMargeBruteConstatePct: null`, pendant
   que le reste de la projection est calculé.
4. **Nouveau snapshot** (version 3) — `moteurVersion: bilan-engine@1.16.0`, et
   `compteResultat.margeBruteN = 3 000 000` figé dedans, distinct du `chiffreAffairesN = 12 500 000` du
   même document.
5. **⚡⚡ Le fait de la story, chiffré sur le dossier de démonstration** : taux de marge brute **constaté
   18,32 %** face à une saisie de **30 %**. Avant cette story, le seul contrôle possible était
   `résultat / produits = 38,93 %` confronté à `marge − charges = 10 %` — un écart de 29 points qui ne
   disait pas **lequel des deux taux** le porte. Le constaté par taux le dit.

⚠️ **Écriture assumée** : la liasse de démonstration a été **rouverte puis revalidée** (elle est bien
revenue à `VALIDE`) pour produire un snapshot au moteur 1.16.0 — même geste qu'en STORY-461, base de dev
locale.

### Revue de code — trois constats, dont UN BLOQUANT, tous corrigés

1. **⚡⚡ BLOQUANT — le trou s'était DÉPLACÉ D'UN CRAN EN AVAL.** J'avais refermé le câblage au niveau du
   **marqueur** (§ précédent) ; il restait ouvert à la **publication HTTP**. `ProjectionResponseDto.from`
   est le **seul** chemin de publication de la projection annuelle, et la fixture e2e du snapshot ne
   portait pas `margeBruteN` : toute la surface HTTP de la story n'était traversée qu'au **cas nul**.
   *Mutation appliquée — `tauxMargeBruteConstatePct: null` dans le mapper, qui **compile** — :
   **2 014 unitaires et 554 e2e restaient VERTS** pendant que le livrable d'AC-4 ne sortait plus jamais.*
   Correctif : la fixture porte 29,3 M de marge sur 100 M de produits, et l'e2e assert le **taux** publié
   — avec une contre-épreuve qui départage l'assiette (29,3 % contre 48,83 % si le taux se rapportait au
   chiffre d'affaires). Mutation rejouée : rouge.
   **La leçon, pour la prochaine story** : refermer le trou à un étage le pousse à l'étage suivant. Il faut
   suivre la donnée **jusqu'au corps HTTP servi**, pas jusqu'au dernier service traversé.
2. **La description publiée de `margeBruteAncree` niait un cas que la story avait elle-même mesuré.** Elle
   disait « false si le référentiel ne déclare aucun marqueur » ; or `false` vaut **aussi** pour une liasse
   **figée sous un moteur antérieur** — le cas de **toute la base pendant la transition**, et précisément
   celui que la vérification docker §3 démontre. Dire « votre référentiel ne publie pas de marge brute » à
   un cabinet SYSCOHADA l'enverrait chercher au mauvais endroit, au moment exact où le message sert. Les
   deux causes sont désormais nommées, et le geste de reprise (refiger la liasse) avec.
3. **Commentaires sans accents et hors chronologie** dans `balance-service` (règle projet « tout en
   français », et l'historique du registre est daté).

Points instruits par le relecteur puis écartés, notables : le refactor `valeurDuPosteMarque` est à
comportement identique (paramétrage pur, filtre `ETAT_CR` conservé, aucun poste ne porte les deux
marqueurs) ; `MODELE_PROJECTION_VERSION` n'est **pas** incrémentée, cohérent avec STORY-461 — aucun montant
projeté ne bouge, la constante vise les formules, pas les mesures publiées à côté.

**Portes rejouées après correctifs** — `bilan-service` : lint 0 warning · build OK · **2 014 unitaires** +
**555 e2e** verts. `balance-service` : lint 0 warning · **3 662 unitaires** + **899 e2e** verts.
**Vérification docker rejouée** sur l'état final (le contrat a changé) : `margeBruteBase = 3 000 000`,
ancrée, taux **18,32 %**, et la description publiée cite bien les **deux** causes du drapeau baissé.

### Revue de sécurité — aucune vulnérabilité

Sept points instruits, dont l'intégrité des artefacts **recalculée** : les **huit** occurrences épinglées
dans les six fichiers des deux dépôts correspondent aux fichiers livrés, **zéro** digest résiduel dans les
sept services **et** `docs/`, le générateur rejoué régénère **à l'octet**, et la recopie est byte-identique.
Le diff de l'artefact est **strictement additif et en dernière position** : aucune ligne existante ne bouge.

Instruits et écartés : `Infinity` fermé par la garde `produitsBase !== 0` (`-0` compris) ; `NaN`
inatteignable (la garde `margeBruteBase !== null` implique un snapshot 1.16.0 complet) ; le refactor des
deux marqueurs ne peut pas les confondre ; aucun guard, route ni repository touché, donc aucune frontière
de tenant ou de dossier franchie ; la recopie ne peut pas rendre un chargement permissif — les trois gardes
d'intégrité sont alignées et vertes.

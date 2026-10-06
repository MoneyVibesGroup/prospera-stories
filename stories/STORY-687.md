# STORY-687 : Les dividendes versés entre sociétés du groupe gonflent le résultat consolidé

Status: in_progress

**Épic :** EPIC-137 — Homogénéisation et éliminations (consolidation)
**Service :** `bilan-service` — module `consolidation`
**Points :** 5 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Prérequis :** **STORY-542** (le journal des résultats internes, le report, le prorata)
**Origine :** cadrage de STORY-542 (2026-09-26), constat M7 et décision D-542-11.

---

## Le fait

Une filiale distribue à la mère un dividende prélevé sur ses réserves : dans les comptes individuels de la
mère, c'est un **produit** ; pour le groupe, c'est un **transfert interne** d'un résultat que la consolidation
a déjà compté (l'exercice où la filiale l'a gagné). Le laisser au résultat consolidé le **compte deux fois**.

*« Les dividendes intra-groupes sont également éliminés en totalité, y compris les dividendes qui portent sur
des résultats antérieurs à la première consolidation »* (règlement ANC n° 2020-01, art. 251-2 — doctrine que le
SYSCOHADA révisé reprend du CRC 99-02) ; fondement : AUDCIF, art. 86 4° (résultats internes).

⚠️ Le libellé de `RESULTATS_INTERNES` (STORY-531) promettait les dividendes ; aucun critère de STORY-542 ne les
couvrait, et leur traitement diffère sur deux points : l'effet d'impôt est **permanent** (aucune différence
temporelle — l'impôt de distribution relève de l'art. 86 5°, STORY-686) et le prorata est celui du
**bénéficiaire** (le dividende reçu est déjà la quote-part du groupe), pas le plus faible des deux. STORY-542
les a nommés `DIVIDENDES_INTERNES`, `NON_TRAITE`, requis.

## Critères d'acceptation

- [ ] AC-1 — Un dividende interne est **déclaré** (distributrice, bénéficiaire, montant reçu, compte de produit
      du bénéficiaire, exercice) — il s'élimine du résultat du bénéficiaire contre les **réserves** de la
      distributrice, tracé, justifié, réversible au journal de consolidation.
- [ ] AC-2 — ⛔ Aucun effet d'impôt différé : l'écriture le **dit** (différence permanente), et STORY-545 ne le
      lit pas comme une différence temporelle.
- [ ] AC-3 — Bénéficiaire intégré proportionnellement : éliminé à **son** pourcentage d'intégration ; test du
      cas IG ← IP (le dividende reçu est déjà la quote-part : jamais le plus faible des deux).
- [ ] AC-4 — Comme les autres familles (D-542-9) : aucune décision n'est déduite d'un silence — une omission
      motivée, ou au moins une déclaration, fait passer `DIVIDENDES_INTERNES` à `APPLIQUE`.

## Cadrage (2026-10-06)

### Constats

- **C1 — Aucun report.** L'exercice qui suit, le produit de la bénéficiaire est passé dans SES réserves, et
  la distribution a réduit celles de la distributrice : leur somme est déjà neutre dans les capitaux propres
  agrégés. L'élimination ne vit que l'exercice de la distribution — à l'inverse de la marge (réalisée en
  E+1) et de la plus-value (reprise jusqu'à la sortie) de STORY-542.
- **C2 — Le prorata n'est pas celui des résultats internes.** 542 applique le plus faible du vendeur et du
  détenteur (D-542-5). Le dividende REÇU est déjà la quote-part de la bénéficiaire dans la distribution :
  seul SON pourcentage d'intégration s'applique. Mère IG ← filiale IP à 50 % : le produit de la mère (100 %)
  s'élimine en entier, jamais à moitié.
- **C3 — Le propriétaire, au sens de STORY-544, est la bénéficiaire.** Les deux lignes (produit et
  réserves) s'imputent à elle : mère bénéficiaire ⇒ part du groupe seule (le hook de 544) ; filiale
  bénéficiaire avec minoritaires ⇒ leur part du résultat baisse et leur part des réserves monte d'autant —
  le calcul par paliers le confirme (une distribution de 100, A détient 60 % de B, le groupe 80 % de A :
  minoritaires −40 au total dans les deux méthodes, et 0 au résultat).
- **C4 — Une différence permanente, que la preuve d'impôt doit expliquer.** Le moteur de 545 n'en fait
  aucun élément ; mais la preuve lit le résultat de la balance, où l'élimination a joué : sans ligne qui
  l'explique, la preuve échoue. Elle va à `ECRITURES_SANS_IMPOT_DIFFERE`, comme une réciproque.
- **C5 — Un compte de produit déclaré qui n'est pas de gestion n'élimine rien du résultat.** 542 ne juge
  pas le compte de résultat déclaré ; ici le seul objet de l'écriture est le résultat (AC-1) : nommé.

### Décisions

- **D-687-1 — Une nature propre, `DIVIDENDE_INTERNE`**, au journal de consolidation — pas une troisième
  famille de `RESULTAT_INTERNE` : statut, prorata et effet d'impôt diffèrent (C2, C4), et chaque route ne
  lit que sa nature. Les lignes calculées vont toutefois à la **colonne `resultatsInternes`** de l'agrégat
  (art. 86 4°) : recomposition, partage, états et contrôles les lisent sans rien changer.
- **D-687-2 — La déclaration** : distributrice, bénéficiaire (distinctes, la mère ou des sociétés intégrées
  globalement ou proportionnellement au dernier périmètre arrêté), **montant reçu** par la bénéficiaire
  dans l'exercice (acomptes compris, entier > 0, à 100 % de ses comptes), compte de produit de la
  bénéficiaire, justification ; l'exercice est celui du chemin. ⛔ **Une déclaration active par
  (exercice, distributrice, bénéficiaire)** — l'index unique est le filet contre une double élimination ;
  plusieurs versements de l'année se déclarent en un montant.
- **D-687-3 — L'écriture se calcule à chaque agrégat, jamais figée en lignes** : débit du compte de produit
  de la bénéficiaire ; crédit du compte de réserves du groupe (D-541-8) sur la distributrice. Aucun report
  (C1).
- **D-687-4 — Le prorata est celui de la bénéficiaire** (C2) — et lui seul.
- **D-687-5 — Minoritaires** : les deux lignes s'imputent à la bénéficiaire (C3).
- **D-687-6 — Impôt** : l'effet déduit est `DIFFERENCE_PERMANENTE` (nouvelle valeur de l'effet déduit,
  publiée) ; jamais un élément du moteur de 545 ; la preuve l'explique à `ECRITURES_SANS_IMPOT_DIFFERE`
  (C4).
- **D-687-7 — `DIVIDENDES_INTERNES` est `APPLIQUE`** si et seulement si l'exercice porte au moins une
  déclaration ou une omission motivée active, pas les deux, et chaque dividende déclaré s'applique.
  ⛔ **Aucun « d'office »** (AC-4, D-542-9) : un groupe d'une seule société intégrée déclare aussi son
  omission.
- **D-687-8 — Manques nommés, jamais un refus de l'agrégat** : `DECISION_MANQUANTE`,
  `DECLARATIONS_CONTRADICTOIRES`, `SOCIETE_NON_INTEGREE`, `COMPTE_PRODUIT_HORS_GESTION`,
  `COMPTE_RESERVES_NON_DECLARE`, `COMPTE_RESERVES_INVALIDE`. Un dividende non appliqué laisse son produit au
  résultat — l'état reste « agrégé », ce qu'il était avant cette story.
- **D-687-9 — Routes** : `GET`/`POST …/consolidation/exercices/:exerciceId/dividendes-internes` (un
  dividende OU l'omission motivée de l'exercice), `POST …/:ecritureId/annulation` ; `TENANT_ADMIN` et
  `TENANT_USER` ; portée du groupe ; refus à l'écriture : contradiction, doublon, société non intégrée.

### Hors périmètre — hooks inertes

- Le dividende reçu d'une **associée** (mise en équivalence, STORY-546) : il s'impute sur la valeur des
  titres, pas sur les réserves — nommé `SOCIETE_NON_INTEGREE`, jamais calculé.
- La part versée aux **minoritaires** de la distributrice : payée hors du groupe, rien à éliminer.
- La retenue à la source et l'impôt de distribution : STORY-686 (art. 86 5°).

## Notes

- Voir [[STORY-542]] (D-542-6 à D-542-11), [[STORY-686]], [[STORY-544]], [[STORY-545]].

## Progress Tracking

**Statut : `in_progress` (2026-10-06).** Branches `MNV-687` ouvertes (`docs/` depuis `main`, `bilan-service`
depuis `dev`) avant toute ligne ; cadrage fait (5 constats, 9 décisions).

**Historique — `ready-for-dev` (2026-09-26).** Créée par le cadrage de STORY-542 (D-542-11) — numéro réservé par
balayage de TOUTES les branches distantes de `docs/` (maximum 686).

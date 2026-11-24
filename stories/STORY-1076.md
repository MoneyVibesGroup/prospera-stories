# STORY-1076 : les seuils de l'analyse financière, sourcés et versionnés dans le paquet — FE-141 affiche ses verdicts

Status: done

**Plan :** `coordination/PLAN-LOT-6-2026-11-23.md` §6, amendement du 2026-11-24 (soir, D-L6-5), n° 8 · **Dépôt :**
`prospera-bilan-service` (repris de B, passation constatée au rituel : `origin/dev` = `7b53ff5`, aucune PR ouverte) ·
**Plage :** groupe D (1074 → 1078 réservées au lot 6 amendé) · **Débloque :** les verdicts de FE-141 (A).
**Sources :** journal de A, 24/11 (« Écart backend à décider (FE-141) : les paquets publiés `@2.2` et `@2.3` ne déclarent
AUCUN seuil ») ; `frontend-stories/FE-141.md` ; `stories/STORY-552.md` (les 19 indicateurs, leurs formules) ;
`stories/STORY-553.md` (le contenant : bloc `seuils`, garde de packaging, passe d'appréciation, arbitrages PO du 30/09) ;
code de `origin/dev` : `src/modules/bilan/analyse/` (`analyse.regles.ts`, `analyse.seuils.ts`),
`scripts/referentiels/gardes-analyse.mjs`, `scripts/referentiels/build.mjs`.
**Ne touche pas :** `prospera-balance-service` (tenu par C, D-L6-5) : la recopie à l'octet des paquets SYSCOHADA y est
demandée à C (D-1076-6).

## « Fini quand » (plan)

« Chaque indicateur qui en a besoin porte ses repères sourcés ; plus aucun verdict « aucun repère déclaré » sur un
dossier de démonstration ; sans source, Q-D au PO avec le choix par défaut écrit. »

**Tenu ainsi (D-1076-1) :** les trois indicateurs pour lesquels une source citable fixe une norme **sur la même formule**
portent leur repère dans les quatre paquets SYSCOHADA révisé, dont `@2.3` (celui des dossiers de démonstration de la
recette croisée) ; un dossier de démonstration reçoit donc trois verdicts. Les **seize autres** n'ont aucune source
citable (recherche ci-dessous) : ils gardent « aucun repère déclaré », et c'est **Q-D-14** au PO, choix par défaut
écrit. Aucun chiffre n'est inventé.

## La recherche des sources (2026-11-24)

1. **Dépôt `prospera-stories`** (lus en entier ou par recherche ciblée) : `analyse-pack-25-livres-2026-11-23.md` (§6 :
   le pack ne contient aucun seuil de ratio ; §3 : ses apports sont des contrôles juridiques, pas des repères),
   `referentiels/` (dont `controles-balance-ohada.json` : des verdicts juridiques et des contrôles d'intégrité, « pas des
   ratios »), `rapport-bilan-logique-metier-2026-07-12.md`, `questions-comptables-bilan-2026-07-19.md` et sa fiche
   remplie, `prds/prd-services-cabinet-2026-11-18/` (FR-4, FR-17 : « couverture 1,20, autonomie 33 % » marqués
   [ASSUMPTION], « doit être relu par une banque » — **non citables**), STORY-552/553 (le tableau du corpus
   `Image_lecons`, déclaré non citable par l'arbitrage PO du 30/09). **Aucune source citable dans le dépôt.**
2. **Sources publiques** (recherche web) : **BCEAO, « Procédure relative à la révision des modalités de mise en œuvre
   du dispositif des accords de classement pour les entreprises non financières », mars 2020**, annexe de l'avis sur le
   dispositif des accords de classement, publiée sur bceao.int
   (`https://www.bceao.int/sites/default/files/inline-files/ANNEXE_Avis%20sur%20le%20dispositif%20des%20accords%20de%20classement.pdf`,
   lue en entier le 2026-11-24, 20 pages). Elle fixe les **quatre ratios de décision** de la cotation des entreprises
   du système normal révisé, avec leur formule en codes de postes SYSCOHADA révisé :

   | Ratio BCEAO | Formule (codes de la liasse) | Norme | § | Indicateur Prospera | Même formule ? |
   |---|---|---|---|---|---|
   | Liquidité générale | (BK + BT) / (DP + DT) | « La norme minimale est fixée à 1 » | I.1, p. 3, 5 | `LIQUIDITE_GENERALE` : (actif circulant, HAO compris, + trésorerie-actif) / (passif circulant, HAO compris, + trésorerie-passif) — masses `BA BB BH BI BJ`, `BQ BR BS`, `DH DI DJ DK DM DN`, `DQ DR` | **oui** |
   | Capacité de remboursement | (DA + DB) / CAFG | « Le ratio doit être inférieur ou égal à 4 » | I.2, p. 8-9 | `CAPACITE_REMBOURSEMENT` : dettes financières (DA, DB) / **EBE** (XD) | **non** (dénominateur) |
   | Rentabilité (taux de marge nette) | XI / XB | « Le ratio doit être positif » | I.3, p. 11 | `MARGE_NETTE` : résultat de l'exercice / chiffre d'affaires × 100 | **oui** |
   | Autonomie financière | CP / DZ | « La norme est fixée à 20% minimum » | I.4, p. 12-13 | `POIDS_CAPITAUX_PROPRES` : capitaux propres (CA CB CD CE CF CG CH CJ CL CM, résultat compris) / total du passif × 100 | **oui** |

   Autres recherches sans résultat citable : ratios sectoriels de la Centrale des bilans de l'UMOA (aucune publication
   par secteur trouvée), délais clients et fournisseurs de l'UEMOA. Les ratios sectoriels de la Banque de France ou de
   l'IEDOM existent mais portent sur la France : les transposer serait le défaut que STORY-553 dénonce.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|---|---|---|
| AC-1 | Le contrat est annoncé avant la fusion du code (« ⚠ Contrats » du journal de D) : réponse d'analyse, empreintes des quatre paquets, recopie demandée à C | PR de docs d'annonce, fusionnée avant le code |
| AC-2 | `syscohada-revise@2.1`, `@2.2`, `@2.3` et `zone-franche-togo@1.0` portent **exactement** trois seuils : `POIDS_CAPITAUX_PROPRES` (RISQUE < 20 ≤ BON), `LIQUIDITE_GENERALE` (RISQUE < 1 ≤ BON), `MARGE_NETTE` (RISQUE < 0 ≤ BON), `TOUS` secteurs, `PLUS_HAUT_MIEUX` ; le même bloc dans les quatre | `analyse.seuils-livres.spec.ts` (valeurs écrites dans le test) |
| AC-3 | Chaque seuil cite la BCEAO, le texte, sa date, le paragraphe, la phrase de la norme et l'URL ; la garde de packaging (`source` non vide, bornes contiguës, ordre selon `sens`) les accepte | idem ; `build.mjs` |
| AC-4 | L'analyse d'une liasse saine rend « BON », d'une liasse fragile « RISQUE », sur les trois ; le seuil appliqué publie bornes, source, secteur retenu et paquet ; aucune valeur ne change | idem ; e2e `bilan-analyse` (dry-run réel sous `@2.1`) |
| AC-5 | Les seize autres indicateurs restent `AUCUN_REPERE_DECLARE` (aucun verdict inventé) | idem |
| AC-6 | Hors du bloc `seuils`, les quatre artefacts sont identiques à l'octet à ceux d'avant ; aucun autre paquet ne bouge | comparaison JSON (bloc retiré) ; `git status` après `build.mjs` |
| AC-7 | Les empreintes sont à jour partout où elles sont épinglées ; les paquets sans seuils (SFD, CIMA, SMT) se chargent toujours | unitaires du référentiel |

## Décisions retenues par défaut (contestables)

- **D-1076-1 — « Fini quand »** : ci-dessus. Un repère n'entre que si sa source porte une norme sur **la même
  formule** que l'indicateur publié ; une formule voisine ne suffit pas.
- **D-1076-2 — Révision EN PLACE des quatre paquets, pas de `@2.4`** (doctrine de D-552-2 et de la révision des
  marqueurs additifs) : le bloc `seuils` est additif (spread conditionnel, ordre de clés figé), il ne change **pas un
  octet de la liasse produite** (prouvé : chaque artefact, bloc retiré, est identique au JSON d'avant) ; seule l'analyse
  le lit. Un bump exigerait un octroi et un pont neufs au catalogue et dans `balance-service` pour un champ que seule
  l'analyse lit. Le changement reste tracé : l'empreinte de chaque paquet change (AC-5 de 553), l'analyse publie le
  tampon du paquet lu (`stamp`) à côté de celui de la liasse (`stampLiasse`, `memePaquet`). Une liasse figée avant la
  story, relue, reçoit donc des verdicts avec `memePaquet: false`, comme après 552.
- **D-1076-3 — Deux niveaux seulement, `RISQUE` et `BON`.** La BCEAO fixe une norme binaire (respectée ou non) : « BON »
  = la norme est respectée, « RISQUE » = elle ne l'est pas. Aucun « TRES_BON » ni « ACCEPTABLE » : il faudrait des
  bornes que la source ne donne pas.
- **D-1076-4 — Bornes `[min, max)` et lecture de « positif ».** La norme atteinte est respectée : 20 % → BON, 1 → BON.
  « Le ratio doit être positif » se lit au sens français (positif = supérieur ou égal à zéro) : une marge nette de 0 est
  « BON ». Le verdict se pose sur la valeur publiée, arrondie à deux décimales (D-552-8).
- **D-1076-5 — Les quatre paquets SYSCOHADA révisé, `TOUS` secteurs.** La procédure vaut pour les entreprises non
  financières du système normal, sans secteur, quel que soit le paquet octroyé : `@2.1` (et `zone-franche-togo@1.0`, qui
  partage sa table de passage), `@2.2`, `@2.3` portent le même bloc. `smt-togo@1.0` n'en porte pas (l'analyse n'y
  calcule pas ces indicateurs ; la BCEAO n'y retient que le signe du résultat net), ni SFD, ni CIMA (« non applicable »).
  Le rattrapage du `codeNaema` du read-model (prérequis noté par 553) n'est pas nécessaire : aucun repère sectoriel.
- **D-1076-6 — La recopie à l'octet dans `balance-service` est demandée à C**, qui tient ce dépôt (D-L6-5) : les trois
  artefacts `syscohada-revise-2.1/2.2/2.3.json` et leurs empreintes (registre, `referentiel-assets-coherence.spec.ts`).
  `balance-service` ne lit pas `seuils` ; sa garde « octets identiques à ceux de bilan-service » rougit tant que la
  recopie n'est pas faite, sur un poste où les deux dépôts sont côte à côte (c'est son rôle).
- **D-1076-7 — La BCEAO juge la moyenne des trois derniers exercices (§ II.2) ; Prospera juge chaque exercice** (N et
  N-1, chacun avec la norme). La cotation A → E n'est pas calculée : ce serait un autre produit (et elle lit aussi la
  Centrale des incidents de paiement). La source le dit.
- **D-1076-8 — `CAPACITE_REMBOURSEMENT` reste sans repère.** La norme BCEAO (≤ 4) porte sur dettes financières /
  **CAFG** ; l'indicateur publié (arbitrage PO de 552) est dettes financières / **EBE**. Appliquer l'une à l'autre
  jugerait faux. Option posée au PO (Q-D-14) : un indicateur de plus à la formule BCEAO.

## Q-D-14 (au PO, choix par défaut appliqué)

1. **Les seize indicateurs sans source citable** (`ENDETTEMENT`, `CAPACITE_REMBOURSEMENT`, `LIQUIDITE_REDUITE`,
   `LIQUIDITE_IMMEDIATE`, `TAUX_MARGE_COMMERCIALE`, `TAUX_VALEUR_AJOUTEE`, `TAUX_EBE`, `ROE`, `ROA`, `BFR`, `FRNG`,
   `TRESORERIE_NETTE`, `DIO`, `DSO`, `DPO`, `CYCLE_EXPLOITATION`). **Défaut : aucun repère** (« aucun repère déclaré » à
   l'écran). Pour en ajouter, il faut une source citable par indicateur (texte, date, page) : par exemple les exigences
   écrites d'une banque du Togo (Q-SC-1, STORY-1085), une étude sectorielle de la BCEAO ou de l'INSEED, ou la validation
   écrite d'un expert-comptable inscrit à l'Ordre ; chacune entre dans le même bloc, par une révision du paquet.
2. **Une capacité de remboursement à la formule BCEAO** (dettes financières / CAFG, norme ≤ 4 : la CAFG est déjà
   calculée par le TFT) : un 20ᵉ indicateur, publié à côté de l'actuel. **Défaut : non** (contrat d'analyse inchangé).
3. **Le cas particulier des télécommunications** : la procédure « tient compte du cas particulier des entreprises du
   secteur des télécommunications » pour la liquidité générale, sans le chiffrer. **Défaut : la norme de 1 s'applique à
   tous les secteurs**, et la source affichée le dit (le mécanisme des seuils ne sait pas exclure un secteur sans lui
   donner un autre repère).

## Preuves

**Livré :** prospera-bilan-service#186, fusionnée en rebase le 2026-11-24 (`head` `b49f46b`, rejoué sur `dev` en
**`e4cee3e`**, arbre identique) ; annonce « ⚠ Contrats » prospera-stories #835 (`main` cb0c2da) avant le code.

- **Sources des paquets** : `_meta.seuils` de `table-de-passage-syscohada.json` (`@2.1`, zone franche),
  `-2.2.json`, `-2.3.json` ; `node scripts/referentiels/build.mjs` : **seuls les quatre artefacts attendus bougent** ;
  chacun, bloc `seuils` retiré, est égal au JSON d'avant (AC-6). Empreintes (octets commités, `autocrlf=false`) :
  `@2.1` `abaffa01…`, `@2.2` `8b6255f7…`, `@2.3` `7a39c0da…`, zone franche `11f60ebc…` ; registre et quatre specs à jour
  (AC-7).
- **Spec neuve `analyse.seuils-livres.spec.ts` : 22/22** — bornes, sens, secteur écrits dans le test (AC-2), source
  citée (BCEAO, texte, mars 2020, paragraphe, phrase, URL, cas des télécommunications, AC-3), même bloc dans les quatre
  paquets, bornes à la norme et un centième en dessous, liasse saine « BON » (72,73 % ; 2,56 ; 10 %) et fragile
  « RISQUE » (4,76 % ; 0,38 ; −20 %) sous les quatre paquets, seuil appliqué publié, seize indicateurs sans repère
  (AC-5), aucune valeur changée (AC-4).
- **Specs reprises** : `analyse.seuils` (AC-1 de 553 prouvé sur une variante sans bloc ; SFD, CIMA, SMT sans seuils se
  chargent), `analyse.service` (le premier indicateur jugé, l'endettement sans repère), `analyse.lecture-alternative`
  (variantes sans `seuils`, piège 1076-4).
- **e2e (vrai HTTP, artefacts embarqués)** : `bilan-analyse` + `openapi-contract` **583/583** — le dry-run sous `@2.1`
  sert `POIDS_CAPITAUX_PROPRES` 68,75 « BON », `LIQUIDITE_GENERALE` 3 « BON », `MARGE_NETTE` 27,08 « BON », seize
  `AUCUN_REPERE_DECLARE`.
- **Suite unitaire complète (Node 25)** : 333 suites vertes sur 349, **11 973 tests verts** ; les 16 rouges sont
  connues et sans lien (13 binding de Confluent, `dossier-scope.invariant` et `analyse.agnosticisme` sur les chemins
  Windows, `homogeneisation.regles` sous la charge — 73/73 seul).
- **Mutations 9/9 tuées sur l'assertion** (le registre suit l'empreinte mutée : aucune `ReferentielIntegrityError`) :
  20 → 25, 1 → 1,5, 0 → 5, marge nette retirée, secteur `47`, source sans URL, bloc retiré de la table partagée, seuil
  posé sur `LIQUIDITE_REDUITE`, `BON` → `TRES_BON`.
- Lint des fichiers touchés 0 ; `nest build` OK ; `git diff --stat` = `--ignore-cr-at-eol`.
- **Sans Docker** : aucun module, dépendance ni Dockerfile ne change (précédent de B : 483, 065, 1084) ; le
  comportement servi est prouvé par l'e2e HTTP sur les artefacts embarqués. Verrou non pris (tenu par B, 1112).

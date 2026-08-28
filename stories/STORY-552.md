# STORY-552 : Les indicateurs d'analyse financière — dérivés des masses SYSCOHADA, jamais transposés d'un bilan courant / non courant

Status: needs-po-decision

**Épic :** EPIC-014 — Consultation & export — `bilan-service`
**Service :** `bilan-service` (`:3004`) — nouveau `modules/bilan/analyse`
**Points :** 8 · **Sprint :** S20
**Origine :** lecture du corpus pédagogique `Image_lecons` (2026-08-28) — les **11 posters
« Comment analyser »** (structure financière, rentabilité, liquidité, solvabilité, BFR et cycle
d'exploitation, flux de trésorerie, croissance, prévisions, risques) constituent, formules et
interprétations comprises, un cahier des charges déjà rédigé.
**Réf. code :** `bilan-production.service.ts` (postes + `coherenceSousTotaux` : `AZ…DZ`, `BZ`, `DZ`) ·
`compte-resultat-production.service.ts` (SIG : `XA…XI`) · `tft-production.service.ts`
**Voisine :** **STORY-483** — *le bilan **prévisionnel** ne sépare pas capitaux propres et dettes,
donc aucun ratio bancaire*. Même besoin, sur l'autre bout de la chaîne.

---

## Le fait

La liasse produite porte déjà **toute la matière** d'une analyse financière : les postes d'actif
et de passif, la cascade de sous-totaux du référentiel (`AZ…DZ`), les SIG du compte de résultat
(`XA` marge commerciale → `XI` résultat net) et les flux du TFT. Ce qu'aucune route ne rend,
c'est **le second étage** : marge, valeur ajoutée rapportée au CA, autonomie financière,
liquidité, BFR, DIO/DSO/DPO, capacité de remboursement, TCAM.

Aujourd'hui l'expert-comptable exporte la liasse et refait ces divisions dans un tableur. C'est
la partie du métier que le produit ne couvre pas, et c'est celle qui **fait décider**.

## ⛔ L'arbitrage à rendre avant la première ligne de code

**Les formules du corpus sont écrites pour un bilan courant / non courant. Le nôtre est en
masses SYSCOHADA. La correspondance n'est pas bijective.**

| Ratio du corpus | Numérateur / dénominateur attendus | Ce que SYSCOHADA a |
|---|---|---|
| Liquidité générale | actif courant / passif courant | actif circulant **+ HAO** + trésorerie-actif / passif circulant **+ HAO** + trésorerie-passif |
| Liquidité réduite | (actif courant − stocks) / passif courant | idem, moins `BB`/`BC` |
| Autonomie financière | capitaux propres / total passif | `CP` / `DZ` — direct |
| Endettement | dettes totales / capitaux propres | dettes financières `DD` **+** passif circulant **+** trésorerie-passif ? |
| Capacité de remboursement | dettes financières / EBE | `DD` / `XD` — direct |

⇒ **Deux voies, et c'est une décision produit, pas technique :**

- **Voie A — masses SYSCOHADA telles quelles.** Les indicateurs sont exacts au sens du
  référentiel et **comparables entre dossiers Prospera**. Ils ne seront pas comparables aux
  benchmarks sectoriels internationaux que les posters citent.
- **Voie B — retraitement en courant / non courant.** Comparables aux benchmarks, mais chaque
  retraitement est un **arbitrage** (l'actif circulant HAO est-il courant ?) que le produit
  ferait à la place du comptable, en silence, dans un chiffre qu'il présente comme un fait.

⚠️ **Recommandation : voie A**, cohérente avec la règle déjà posée deux fois (FE-030, FE-031) —
*le serveur calcule, l'écran restitue, et rien n'est déduit qui ne soit dérivable*. Un
retraitement non déclaré est exactement le défaut que **STORY-551** corrige sur la colonne N-1.

⛔ **Tant que cet arbitrage n'est pas rendu, cette story n'est pas tirable.**

## Périmètre

**Inclus** *(sous réserve de l'arbitrage)*

- `GET /dossiers/{id}/bilan/analyse` — les indicateurs dérivés du **dernier jeu d'états**, et
  `POST …/analyse/dry-run` sur des soldes, pour rester symétrique du reste du module.
- Quatre familles, toutes dérivables du couple Bilan + CR **déjà produits** :
  **structure** (autonomie financière, endettement, capacité de remboursement) ·
  **liquidité** (générale, réduite, immédiate) ·
  **rentabilité** (taux de marge commerciale, taux de VA, taux d'EBE, marge nette, ROE, ROA) ·
  **exploitation** (BFR, FRNG, trésorerie nette, DIO, DSO, DPO, cycle d'exploitation).
- Chaque indicateur publie **son numérateur, son dénominateur et les postes qui les composent** —
  un ratio dont on ne peut pas remonter la composition n'est pas auditable, et un expert-comptable
  ne signera rien qu'il ne puisse refaire.
- `null` explicite quand le dénominateur est nul ou le poste absent du référentiel. **Jamais 0.**
- Colonne N-1 quand `soldesN1` est fourni, avec la mention de retraitement de **STORY-551**.

**Hors périmètre**

- **Les seuils d'alerte et l'interprétation** — ils font l'objet de **STORY-553**, et pour une
  raison : un seuil est une donnée qui change par pays, par secteur et par année, jamais une
  constante de code.
- Les indicateurs par action (BPA, PER) et les ratios de marché : aucune donnée du produit ne les
  alimente.
- Les ratios de **flux** (couverture des investissements, cash-flow libre) : ils exigent le TFT,
  qui a son propre chemin de production. À ficher après, si le PO le veut.
- Les référentiels **SFD-BCEAO** et **CIMA** : leurs masses n'ont pas les mêmes postes, et CIMA
  a ses propres ratios réglementaires (marge de solvabilité, STORY-524). Cette story est
  **SYSCOHADA seulement**, et le dit dans sa réponse.

## Critères d'acceptation

1. Chaque indicateur publie `{ valeur, numerateur, denominateur, postes[] }` — la composition est
   toujours remontable.
2. Un dénominateur nul rend `valeur: null` avec un `motif` publié, jamais `0` ni une division
   levant une exception.
3. Un référentiel qui ne déclare pas un poste nécessaire rend l'indicateur `null` avec le poste
   manquant nommé — **pas un indicateur silencieusement faux** (le défaut de STORY-486).
4. Sur un référentiel non SYSCOHADA, la route répond explicitement « non applicable » avec le
   code du référentiel en présence — elle ne rend pas un tableau vide.
5. Aucun indicateur n'est recalculé côté client (règle FE-030/FE-031, non rouverte).
6. Les valeurs sont reproductibles : deux appels sur le même jeu d'états rendent le même
   résultat, et le `stamp` du référentiel est publié avec.

## Notes

- ⚡ **Le corpus n'est pas la source de vérité, il est la liste des besoins.** Ses posters sont
  chiffrés en **dirhams** et bâtis sur un bilan courant / non courant : ce sont ses **questions**
  qu'on reprend, jamais ses formules telles quelles.
- ⚠️ **Les seuils du corpus n'ont ni secteur ni zone** (« marge brute > 40 % », « ROE > 15 % »).
  Les figer serait produire des alertes fausses sur une microfinance comme sur une boutique.
  D'où **STORY-553**.
- ⚠️ **Si le PO veut un module d'analyse à part entière** (et non un second étage de la
  consultation), c'est un épic neuf — **EPIC-142 est le premier libre**. Cette story reste
  volontairement sous EPIC-014 : elle lit la liasse, elle ne crée aucun agrégat persistant.

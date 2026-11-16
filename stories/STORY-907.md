# STORY-907 : La TPU déclarative et la RSH au catalogue d'obligations

Status: done

**Complexité :** moyenne (une modification du paquet fiscal, recopiée à l'octet dans trois dépôts)

**Épic :** EPIC-028 (le service fiscal), dette de STORY-313 ; appui de FE-112 (obligations fiscales) et FE-116 (TPU)
**Services :** `balance-service` (source du paquet), `dossier-service` (copie), `fiscal-service` (fixture et dérivation)
**Plage :** groupe A, n° 3 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2). Fiche écrite **avant** de
coder.

---

## Pourquoi

STORY-313 a appris au moteur à **calculer** la TPU déclarative (2 % ou 8 % selon la nature d'activité, minimum annuel
de 20 000 F) et la retenue sur prestations de services (RSH : 3 %, 5 % ou 20 % selon l'état constaté du tiers). Mais le
catalogue d'obligations du paquet n'en porte aucune : **aucune obligation ne les dérive**. Un dossier au régime
synthétique ne reçoit que sa DSF ; un dossier au réel ne voit pas sa RSH mensuelle.

## Ce que dit la loi (CGI et LPF, édition 2026)

- **TPU déclarative** : établie pour l'année sur le chiffre d'affaires déclaré (Art. 133-134 CGI). Paiement (LPF
  Art. 57) : **quatre acomptes** égaux au quart des cotisations du dernier exercice clos, au plus tard le **31 janvier,
  31 mai, 31 juillet et 31 octobre** ; le **solde** au dépôt des états financiers SMT (31 mars, LPF Art. 56).
- **RSH** (LPF Art. 99) : retenue opérée par les débiteurs soumis à l'IS ou à l'IR revenus d'affaires (l'État, les ONG,
  les projets aussi), versée « au plus tard le **15 du mois suivant** ».

## Ce que la story livre

1. **Les données qui manquaient au paquet**, à leur rubrique (aucun chiffre recopié dans le catalogue) :
   - `regimesImposition.synthetique_entreprenant_tpu.composantes.declaratif.paiement` : les quatre échéances des
     acomptes et la règle du solde, avec l'article et son texte ;
   - `retenuesSource.retenuePrestationsResidents_RSH.declaration` : `moisParPeriode: 1`, `jourLimite: 15`.
2. **Trois entrées au catalogue d'obligations** :
   - `TPU` (annuelle, solde au dépôt des états financiers SMT : la date de la DSF du régime synthétique) :
     `PROPORTIONNELLE`, taux du déclaratif, **aiguillage** par `natureActivite` (`PRODUCTION_COMMERCE`,
     `PRESTATIONS_SERVICES`, le vocabulaire de balance-service) et **minimum annuel** ;
   - `TPU_ACOMPTE` (quatre dates fixes) : montant à saisir, comme `IS_ACOMPTE` (le quart de la cotisation N-1) ;
   - `RSH` (mensuelle, le 15) : `PROPORTIONNELLE`, taux selon le bénéficiaire, **aiguillage** par `etatDuTiers`
     constaté et daté.
3. **Le paquet régénéré** (`build.mjs`), son empreinte reportée dans balance-service, dossier-service, et la fixture
   de fiscal-service recopiée **depuis le blob** (LF).
4. **Le test e2e TPU de balance-service réaligné** : « CA 18 M ⇒ 409 BAREME_TPU_INDISPONIBLE » rend 200 depuis
   STORY-100 (le barème forfaitaire est transcrit) ; préexistant sur `dev`, relevé en STORY-906.

## Critères d'acceptation

- **AC-1** : la dérivation d'un dossier `ENTREPRISE` au régime `SYNTHETIQUE` rend `DSF`, `TPU` (31/03 de N+1) et
  quatre `TPU_ACOMPTE` (31/01, 31/05, 31/07, 31/10).
- **AC-2** : la dérivation d'un dossier `ENTREPRISE` au réel rend douze `RSH`, chacune au 15 du mois suivant ; un
  dossier au régime synthétique n'en reçoit aucune.
- **AC-3** : le chargement du paquet par fiscal-service accepte les modificateurs des deux entrées (branches
  atteignables, minimum référencé) ; le calcul de la `TPU` sur 1 000 000 rend 20 000 (commerce) et 80 000 (services).
- **AC-4** : la validation R9 de balance-service passe ; `build.mjs` est déterministe ; l'empreinte est la même dans
  les trois dépôts.
- **AC-5** : la recette `zone-franche` reste verte (images reconstruites depuis `dev`).

## Décisions

- **D-907-1 — la TPU forfaitaire n'est pas cataloguée.** Elle se paie aux mêmes dates (LPF Art. 57, par quart), mais
  le choix forfaitaire / déclaratif dépend du chiffre d'affaires, que la dérivation ne connaît pas. Cataloguer les deux
  ferait dériver deux TPU à tout dossier synthétique. L'entrée `TPU` est celle du déclaratif (comme la DSF synthétique
  du catalogue, « TPU déclaratif ») ; le forfaitaire reste un écart nommé.
- **D-907-2 — la version reste `2026.1`.** Aucun paquet `fiscal-tg-*` n'a encore été publié en production (journal de
  A, « Procédures ») ; STORY-901 l'a modifié de même. La procédure de publication prend l'empreinte du tag déployé.
- **D-907-3 — la RSH vise les débiteurs au réel** (`typesEntite` entreprise, microfinance, assurance ; régime `REEL`),
  comme `IS_ACOMPTE` : un redevable de la TPU n'est soumis ni à l'IS ni à l'IR revenus d'affaires (la TPU en est
  libératoire). L'État, les ONG et les projets ne sont pas des types d'entité du produit.

## Definition of Done

- [x] balance : R9 et `build.mjs` verts (sha256 `e8e94c84…`), empreinte reportée (registre, spec, e2e) ; e2e `tpu` et
  `referentiel` 87/87 ; unitaires `referentiel` et `fiscal` verts (les échecs sous charge repassent en série ;
  `devise-paquet.exhaustivite` rougit sous Windows par ses séparateurs, sans lien).
- [x] dossier-service : copie à l'octet (blob `e8e94c84…`), empreinte reportée, `portefeuille` 129/129.
- [x] fiscal-service : fixture recopiée ; unitaires 2381 (les trois suites xlsx sous charge repassent en série) ; e2e
  191/191 après réalignement (+12 RSH) ; conformité **65/65** sur un MongoDB `rs-fiscal` jetable.
- [x] Mutations : entrée `TPU` retirée ⇒ 4 tests rouges ; jour de la RSH à 14 ⇒ AC-2 rouge.
- [x] Recette `zone-franche` **5/5** sur les branches (pile `grp-a-907r`, images reconstruites, 29 obligations en
  zone franche). Rejouée depuis `dev` au gate de STORY-908, qui recette les mêmes services.
- [x] PR code fusionnées : balance #147 (`7a885bb`), dossier #48 (`249b2ed`), fiscal #47 (`8487497`).

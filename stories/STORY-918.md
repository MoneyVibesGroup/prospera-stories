# STORY-918 : Le cabinet installé par le moteur — fin de la double lecture (clôture d'EPIC-159, volet d)

Status: done

**Complexité :** moyenne (quatre gardes simplifiées, une recette neuve)

**Épic :** EPIC-159 (d) ; AD-24 (double lecture, puis retrait)
**Dépôts :** `balance-service`, `bilan-service`, `prospera-fiscal-service`, `dossier-service`, `prospera-recette`
**Plage :** groupe A, n° 14 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2). Dépend de 912 → 914 et 917.
Fiche écrite avant de coder.

---

## Pourquoi

912 et 913 ont posé la garde partagée en **double lecture** : l'état publié décide quand il est connu, l'ancienne garde
(le droit `entitlement.changed` et son échéance) décide encore quand il ne l'est pas. Depuis 945, aucun droit ACTIVE
n'est posé hors du moteur, et chaque installation publie l'état de ses modules. **Constaté sur la pile de recette de
917** (images de `dev`) : après les recettes, 7 états publiés projetés dans balance, 7 dans bilan, 26 dans dossier et 2
dans fiscal, tous `EN_SERVICE`. L'ancienne garde n'a plus de cas à couvrir.

## Ce que la story livre

1. **balance, bilan, fiscal** : la garde d'accès ne décide plus que par l'état publié ; **inconnu ⇒ refus**
   `<MODULE>_NOT_ENTITLED` (fail-closed, comme la matrice pour `NON_INSTALLE`). L'ancienne garde et le journal de
   divergence sont retirés.
2. **dossier** : la lecture seule du cabinet se lit dans les seuls états publiés ; les échéances des droits ne la
   décident plus. Sans état publié : pas de lecture seule (D-918-2). Le palier reste celui du contrat (D-918-1).
3. **Recette croisée « cabinet installé par le moteur »** (`prospera-recette`, `cabinet-moteur`) : un cabinet accueilli
   (KYC approuvé) mais sans module est refusé par balance et bilan ; le moteur installe balance puis bilan (plan
   `CONSOLE_PUT`, droit `moteur:<plan>`, D-918-4) ; le cabinet crée un dossier et dépose une balance ; une sanction
   (`SUSPENDED` ⇒ `SUSPENDU` publié) ferme la lecture et laisse l'export ; la levée rouvre le module.

## Décisions

- **D-918-1 — « La lecture d'`entitlement.changed` retirée » = pour décider de l'accès.** Le droit porte des données de
  contrat que l'état publié ne porte pas : les référentiels (balance, bilan, rattachements des paquets de fiscal), le
  palier de dossiers, les packages. Les projections restent, pour ces seules données.
- **D-918-2 — dossier, sans état publié : pas de lecture seule** (règle de 727 : un cabinet sans droit travaille comme
  hier). Le cabinet sans module n'atteint pas le service : la création de dossier est gardée par l'accès KYC et la
  portée, pas par un module.
- **D-918-3 — Déploiement** : `migrate:reamorcage-moteur` du catalogue (945) doit avoir publié l'état des modules
  existants **avant** ces images ; sinon un cabinet installé avant le moteur est refusé.
- **D-918-4 — La recette installe par le `PUT` de la console, pas par `POST /installations`** (écart à la fiche, constaté
  en codant) : un plan `INSTALLATION` exige que les vérifications des modules répondent (FR-6), et ni balance ni bilan
  ne servent encore leurs routes de vérification (C13). Le `PUT` passe par un plan `CONSOLE_PUT` du moteur (945) : c'est
  le chemin du moteur servi aujourd'hui. `POST /installations` entrera dans la recette avec les routes de vérification.
- **D-918-5 — Le service d'ingestion de balance garde son autorisation par `OrgBalanceEntitlement`** : il agit comme
  identité de service, que la garde partagée ne modélise pas (`identite: 'UTILISATEUR'` seulement). Dette nommée au
  journal de A.

## Critères d'acceptation

- **AC-1** : état publié inconnu ⇒ `403 <MODULE>_NOT_ENTITLED`, même avec un droit ACTIVE au read-model.
- **AC-2** : les recettes `pile`, `zone-franche`, `atelier-balance`, `referentiel-par-dossier`, `abonnement` restent
  vertes depuis `dev`.
- **AC-3** : la recette « cabinet installé par le moteur » est verte, sans mock.

## Definition of Done

- [x] Unitaires (Node 24), lint, `tsc` verts ; mutation : l'ancienne garde rebranchée ⇒ rouge.
- [x] Recettes vertes depuis `dev`.
- [x] PR code et docs fusionnées.

## Livraison (2026-11-16)

🏁 **DONE** — balance #151 (dev `e282c22`), bilan #177 (dev `68c6de8`), fiscal #52 (dev `a587b88`), dossier #54 (dev
`d6dfac5`), prospera-recette #23 (dev `58ebabd`).

- **Node 24** (étage `verification`, `git -c core.autocrlf=false archive`) : dossier 1 835 unitaires + 363 e2e. Pour
  balance, bilan et fiscal, le passage complet sur un poste chargé laisse des échecs de minutage (déjà vus en 914) ;
  **chacun repasse seul** : balance 9 suites e2e et le rendu XLSX, bilan 5 suites unitaires (77/77), `bilan-referentiel`
  (20/20) et `consolidation-etats` (101/101), fiscal 64/64 et `livrables-depot` (32/32).
- **Mutation** « l'ancienne garde rebranchée » (inconnu ⇒ ouvert ; dossier : sans état ⇒ lecture seule) : **rouge** dans
  les quatre services, 2 échecs chacun.
- **Recettes sur pile neuve** (`down -v`, images des quatre branches, `dev` pour le reste) : `pile`, `atelier-balance`,
  `referentiel-par-dossier`, `abonnement`, `cabinet-moteur` **86/86** ; `zone-franche` **5/5** rejouée seule (en
  passage groupé, elle lève fiscal-service sur un poste saturé et prend des `ECONNRESET` ; seule, sur la même pile, elle
  passe).
- **Deux défauts de recette trouvés par la pile neuve** et corrigés : `abonnement` (728) dépendait de
  `referentiel-par-dossier` pour `sfd-bceao@2.0` (422 à l'installation) ⇒ chaque référentiel acquis est déclaré au
  registre avant d'installer ; `cabinet-moteur` déposait une balance sans les axes du dossier (409
  `SYSTEME_COMPTABLE_INDETERMINE`).

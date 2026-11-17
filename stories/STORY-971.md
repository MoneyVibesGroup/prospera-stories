# STORY-971 : les droits de la comptabilité et des paramètres de `commande` dans auth

Status: done

**Complexité :** faible à moyenne (dix droits neufs au catalogue de tenant, hors du jeton ; deux tables d'attribution ;
aucun champ ni route neufs)

**Épic :** EPIC-111 (socle de la comptabilité : « entitlement, gate ») et EPIC-223 (les rôles du distributeur, FR-4,
FR-5), d'`epics-comptabilite-2026-08-27.md` et du PRD distributeur
**Dépôt :** `MoneyVibesGroup/prospera-auth-service`
**Plage :** groupe B, plage réservée 930 → 979 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §8). Story
**neuve**, insérée avant STORY-967 par la session du groupe B (décision ci-dessous, contestable).
**Dépend de :** STORY-960 (droits hors du jeton, `droitsHorsJeton`, `dev` `8d48710`).
**Débloque :** la route `PUT /api/v1/commande/parametres` de D (STORY-1053, D-1053-7) ; la comptabilité en réel
(D-959-4), dont la balance de STORY-967.

**Sources lues :** fiche STORY-960 (D-960-1 → 12, « Pour la suite ») ; fiches 959 (D-959-4), 964 (D-964-7), 966
(D-966-9) ; manifeste `comptabilite` (droits C7) ; manifeste `commande` (droit ajouté par D-1053) ; journal de D
(« → B (2026-11-17) : un droit neuf, `commande:parametres:modifier` », Q-D-5) ; fiche STORY-902 (les deux rôles du
cabinet, D-902-2) ; PRD expert-comptable (personas : le gérant `TENANT_ADMIN`, le collaborateur `TENANT_USER`) ; spine
de dossier-service (AD-2 : la portée distingue l'associé du collaborateur) ; épics de la comptabilité (EPIC-111 →
120) ; journal de B (état de 966, « À placer »).

---

## Pourquoi cette story, ici (décision de la session de groupe, contestable)

1. **Une demande de D passe avant la story suivante** : D-1053-7 demande `commande:parametres:modifier` au catalogue
   de tenant, hors du jeton, pour `DIST_DG` et `DIST_ADMIN`. Tant qu'auth ne l'attribue pas,
   `PUT /api/v1/commande/parametres` rend 403 `DROIT_INSUFFISANT` à tout le monde.
2. **Les neuf droits `comptabilite:*`** déclarés par le manifeste (958 → 966) ne sont attribués à aucun rôle. En réel,
   toute la comptabilité rend 403 (ouverture, saisie, validation, grand livre), alors que la balance de 967 doit
   pouvoir être publiée en réel.

Les deux passent par le même mécanisme (STORY-960, D-960-2) et le même dépôt : une seule story, avant 967.

## Ce qui doit être vrai à la fin

| Exigence | Fait |
|---|---|
| `commande:parametres:modifier` et les `comptabilite:*` du manifeste au catalogue, hors du jeton | dix codes ajoutés à `DROITS_HORS_JETON` ; servis par `GET /moi/droits` dans `droitsHorsJeton` ; jamais dans `perms[]` ; la borne du jeton ne bouge pas (17 + 24 = 41 ≤ 44) (D-971-1) |
| Attribués aux rôles du cabinet | `table-d-acces-cabinet.ts` : `CAB_ASSOCIE` les neuf, `CAB_COLLABORATEUR` six (D-971-2) |
| `commande:parametres:modifier` aux rôles demandés par D | `DIST_DG` et `DIST_ADMIN`, par une liste d'ajouts à part de la recopie de l'annexe B (D-971-3) |
| `identity.droits.changed@1` reste BACKWARD au registre | sa charge ne change pas : aucun droit sur le fil (D-949-4) ; schéma non touché (D-971-6) |
| Tests de table d'accès à jour, chaque droit neuf vérifié par une mutation | § Preuves |

## Décisions (prises par défaut, contestables)

- **D-971-1 : dix droits neufs, tous hors du jeton.** Les neuf codes du manifeste `comptabilite` (C7), recopiés à la
  lettre, et `commande:parametres:modifier` (manifeste `commande`, D-1053-7) entrent dans `DROITS_HORS_JETON`. Le
  catalogue de tenant passe de 142 à **152** codes (24 du jeton, 128 hors du jeton). La borne compte toujours les
  seuls `DROITS_DU_JETON` : 41 ≤ 44, inchangée. Un droit né hors du jeton n'en sort jamais (D-960-2).
- **D-971-2 : la comptabilité aux deux rôles du cabinet, selon la nature du geste.**

  | Droit | `CAB_ASSOCIE` | `CAB_COLLABORATEUR` |
  |---|:--:|:--:|
  | `comptabilite:dossier:consulter` (référentiel, journaux, écritures, grand livre, balance) | ✔ | ✔ |
  | `comptabilite:exercice:ouvrir` (ouvrir, **choisir la tenue**, exclusive) | ✔ | — |
  | `comptabilite:journal:administrer` (le plan de journaux) | ✔ | — |
  | `comptabilite:ecriture:saisir` (brouillard) | ✔ | ✔ |
  | `comptabilite:ecriture:valider` (définitif, contre-passation) | ✔ | ✔ |
  | `comptabilite:tiers:administrer` | ✔ | ✔ |
  | `comptabilite:lettrage:realiser` | ✔ | ✔ |
  | `comptabilite:exercice:cloturer` (clôture, à-nouveaux, réouverture) | ✔ | — |
  | `comptabilite:piste:consulter` (piste, fichier des écritures) | ✔ | ✔ |

  - Le **collaborateur** tient les livres au quotidien : il consulte, saisit, valide, tient les tiers, lettre, lit
    la piste. Il ne fait pas les trois gestes qui engagent tout l'exercice et ne se défont pas par une écriture :
    choisir la tenue (exclusive, Q1, D-L3-4), arrêter le plan de journaux, clore. Ceux-là restent à l'associé, comme
    le dépôt fiscal (D-902-2).
  - **Validation au collaborateur, sans séparation saisie / validation** : aucun document ne l'exige (D-964-7 :
    EPIC-113, EPIC-120 et l'AUDCIF ne la demandent pas ; un petit cabinet a souvent un seul collaborateur par
    dossier). Une écriture validée se corrige par contre-passation, et la piste dit qui a saisi et qui a validé. Un
    cabinet qui veut « quatre yeux » retire `ecriture:valider` au collaborateur par surcharge (STORY-167), sans
    déploiement. Alternative écartée : faire valider l'associé seul, comme la déclaration fiscale, ce qui bloquerait
    tout dossier en l'absence de l'associé.
  - Aucun marqueur de cumul (`separation-des-pouvoirs.ts`) n'est ajouté : il signale un circuit que la personne
    boucle seule, et aucun document ne fait de saisir + valider un tel circuit.
  - Les deux rôles sont les rôles **par défaut** du cabinet (`TENANT_ADMIN` → associé, `TENANT_USER` → collaborateur,
    STORY-902) : chaque membre d'un cabinet reçoit donc ces droits sans geste de l'administrateur.
- **D-971-3 : `commande:parametres:modifier` va à `DIST_DG` et `DIST_ADMIN`, hors de la recopie de l'annexe B.**
  L'annexe B.2 ne nomme pas ce droit (Q-D-5, question de D au PO) ; AD-12 réserve le geste au DG et à
  l'administrateur. La table `TABLE_D_ACCES_DU_DISTRIBUTEUR` reste la recopie ligne à ligne de l'annexe (le test la
  compare à l'extraction du PRD) ; le droit entre par une liste à part, `AJOUTS_A_L_ANNEXE_B`, avec sa source. Les
  rôles en sont dérivés de la même façon (`droitsParDefautDu`). Le DG passe de 44 à 45 droits, `DIST_ADMIN` de 23 à
  24 : régler un paramètre n'est pas lire une donnée métier, `DIST_ADMIN` ne lit toujours rien. Si le PO préfère un
  droit existant (Q-D-5), la ligne se retire.
- **D-971-4 : aucun rôle du distributeur ne reçoit `comptabilite:*`, aucun rôle du cabinet un droit du distributeur.**
  L'annexe B ne nomme pas la comptabilité ; un distributeur qui tiendrait ses livres dans Prospera le demandera par
  un rôle personnalisé ou par une ligne de l'annexe.
- **D-971-5 : la livraison n'avance pas `dv` (D-949-3, D-960-11 tiennent).** Les caches des services
  (`(membre, organisation, dv)`, 60 s au plus) voient les droits neufs à leur terme. Le jeton ne change pas : aucun
  des dix droits n'y voyage.
- **D-971-6 : `identity.droits.changed@1` ne change pas.** Il ne porte aucun droit (D-949-4) : sa charge est la même,
  le schéma de `contrat/schemas/` n'est pas touché, le registre n'a rien à juger.
- **D-971-7 : le contrat `moi-droits` reste en 1.1.0, à l'octet.** Sa forme ne change pas : `droitsHorsJeton` porte
  désormais aussi des droits du cabinet et `commande:parametres:modifier`. Seules ses valeurs changent.
- **D-971-8 : la comptabilité ne change pas dans cette story.** Sa garde lit déjà `droits ∪ droitsHorsJeton` (D-961-7).
  Le commentaire du manifeste « Droits (C7) : DÉCLARÉS, pas encore attribuables » est périmé : il se corrige avec la
  prochaine story qui amende le manifeste et le recopie à l'octet dans le service (STORY-967). Les lectures de 958 →
  964 restent ouvertes à la portée du dossier (D-958-9, D-966-9) : les fermer changerait leur contrat.

## Livraison

- **auth #43**, fusionnée en « Rebase and merge » : `913bd92` sur `dev` (tête de la PR `e6720b7`, arbre identique
  après rejeu).
- Contrat annoncé avant la fusion : stories #656 (« ⚠ Contrats » du journal de B).
- Fichiers : `src/common/rbac/droits-hors-jeton.ts` (dix codes), `src/modules/rbac/table-d-acces-cabinet.ts` (neuf),
  `src/modules/rbac/table-d-acces-distributeur.ts` (`AJOUTS_A_L_ANNEXE_B`), `src/modules/rbac/tenant-system-roles.ts`
  (les deux rôles du cabinet dérivés de la table) ; tests de table d'accès, du catalogue, de la résolution et du
  catalogue de composition.

## Preuves

- **Node 24** (étage `verification`, image construite depuis `git archive` de la tête) : `tsc` vert, **100 suites,
  1 387/1 387** (1 364 à 960). Sur le poste (Node 25) : 96 suites vertes, les quatre du client de Confluent ne
  chargent pas (binding natif, connu).
- **Lint** des fichiers touchés : vert.
- **Mutations : 18/18 rougissent sur une assertion**, aucune par compilation (une première écriture de M6 rougissait
  par `TS6133` : réécrite en gardant l'usage du paramètre) :
  - une par droit neuf, sur sa ligne d'attribution : les neuf `comptabilite:*` (un droit « à tous » réservé à
    l'associé, ou un droit de l'associé donné au collaborateur), `commande:parametres:modifier` sans `DIST_ADMIN`, puis
    sans le DG ;
  - le mécanisme : les ajouts à l'annexe ignorés ; la comptabilité portée par le jeton ;
    `commande:parametres:modifier` porté par le jeton ; la résolution qui perd la comptabilité ; le collaborateur qui
    reçoit les droits de l'associé ; la dérivation du cabinet qui ignore le rôle ; un rôle du distributeur qui reçoit
    `comptabilite:dossier:consulter`.
- **Pile `grp-b`** (racine du poste et une surcouche locale non versionnée : auth de la branche, dossier-service et
  comptabilité reconstruits depuis `origin/dev`, MongoDB 7 et 8.0 en jeu de répliques, Kafka 3.9, Redis, MinIO
  Chainguard, Mailhog ; `comptabilite-service` dans l'`AUTH_AUDIENCE` de l'IdP) : `/health` 200 pour les trois
  services. **Preuve de bout en bout, 24 vérifications sur 24** :
  - **cabinet** : un associé s'inscrit (rôle par défaut `CAB_ASSOCIE`). Son **vrai jeton RS256** (1 188 octets) ne
    porte que ses trois droits fiscaux ; `/moi/droits` rend les **neuf `comptabilite:*`** dans `droitsHorsJeton`, et
    `droits` = `perms[]`. Il invite un collaborateur (`CAB_COLLABORATEUR`) : jeton à un droit
    (`fiscalite:declaration:preparer`), `/moi/droits` à **six** `comptabilite:*` ;
  - **distributeur** : le fondateur sans rôle n'a pas le droit (D-960-12) ; il invite un membre et lui attribue
    `DIST_DG`. **Vrai jeton RS256** du DG (`roleMetier` `DIST_DG`, trois droits dans le jeton) ; `/moi/droits` :
    **`commande:parametres:modifier`** dans `droitsHorsJeton`, 45 droits de tenant, aucune comptabilité. Passé
    `DIST_ADMIN` par l'opérateur : le droit est là (ancien jeton, `dv` 3) ; passé `DIST_DC` : il n'y est plus (`dv` 4) ;
  - **la comptabilité en réel** : dossier, exercice 2026 et axes (SN, réel) créés chez dossier-service avec le jeton
    de l'associé. Le grand livre rend d'abord 403 `COMPTABILITE_NOT_ENTITLED` (module absent de l'état publié). Puis :
    collaborateur 403 `DROIT_INSUFFISANT` à l'ouverture (`comptabilite:exercice:ouvrir`) ; associé **201** à
    l'ouverture au JOURNAL ; **`GET …/grand-livre` 200** au jeton de l'associé (aucun compte, équilibré) ;
    `GET …/piste/verification` 200 (une entrée, chaîne intacte). Témoin : `comptabilite:dossier:consulter` retiré à
    `CAB_ASSOCIE` par surcharge, le grand livre rend 403 `DROIT_INSUFFISANT` ;
  - **deux doublures, et elles seules** : l'état publié `EN_SERVICE` du module (le catalogue ne connaît pas encore
    `comptabilite`, D-958-3) et `kyc.status.changed` `APPROVED` (dossier-service exige le KYC approuvé ; kyc-service
    n'est pas dans la pile), posés sur le fil avec `kafka-console-producer`. Les droits, eux, viennent de l'auth réel.
- **Témoin `origin/dev`** : la même preuve, auth reconstruit depuis `origin/dev` (sans 971), dans la même pile : 15/23.
  Les huit écarts sont ceux attendus : `/moi/droits` sans `comptabilite:*` ni `commande:parametres:modifier`, le DG à 44
  droits, et l'associé refusé en **403 `DROIT_INSUFFISANT`** au grand livre (`comptabilite:dossier:consulter`) et à
  l'ouverture.
- **`identity.droits.changed@1`** : aucun fichier de `contrat/schemas/` touché, aucune charge changée (D-971-6). Le
  registre n'avait rien à juger ; Karapace n'a pas été levé.
- Pile descendue avec ses volumes (`down -v`), images de la preuve retirées, **verrou Docker rendu** (pris à 16:37
  après l'attente de D-1056, rendu à 16:57).

## Pour la suite

- **STORY-967 (B)** : la comptabilité ne rend plus 403 à un membre du cabinet. Restent pour la première recette
  croisée : le module `comptabilite` au catalogue (sinon l'état publié dit `NON_INSTALLE`), `comptabilite-service`
  dans l'`AUTH_AUDIENCE` de l'IdP de la recette (demande à A), et le commentaire « Droits (C7) : DÉCLARÉS, pas encore
  attribuables » du manifeste, à corriger et recopier à l'octet (D-971-8).
- **D** : `PUT /api/v1/commande/parametres` passe pour un DG ou un `DIST_ADMIN` sur une image d'auth reconstruite
  depuis `dev` (cache de 60 s compris). Si le PO tranche Q-D-5 autrement, la ligne d'`AJOUTS_A_L_ANNEXE_B` se retire.
- **Cabinet** : un cabinet qui veut séparer saisie et validation retire `comptabilite:ecriture:valider` au
  collaborateur par surcharge ; un « quatre yeux » imposé par le service viendrait d'une demande (D-964-7).
- **Preuves sur pile qui passent par dossier-service** : ouvrir l'exercice AVANT de décider les axes
  (`AUCUN_EXERCICE_OUVERT`), déclarer un dirigeant pour une SARL (`DIRIGEANT_REQUIS`), poser le KYC approuvé ; le
  dirigeant ne s'attribue pas `DIST_DG` lui-même (`TENANT_ROLE_AUTO_ESCALADE`) : il l'attribue à un membre invité.

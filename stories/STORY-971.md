# STORY-971 : les droits de la comptabilité et des paramètres de `commande` dans auth

Status: in-progress

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

(à compléter)

## Preuves

(à compléter)

## Pour la suite

(à compléter)

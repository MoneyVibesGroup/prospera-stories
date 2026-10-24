# STORY-714 : Des droits sur les routes que seul le gate garde

Status: done

**Épic :** EPIC-054 — Permissions au catalogue et cloisonnement des passerelles
**Service :** `notification-service`
**Points :** 5 · **Sprint :** rail F, bloc F4 · ⚠️ **Arbitrage — amende l'architecture (AD-18, FR-N53)**
**Prérequis :** **STORY-572** (le gate et les cinq droits), **STORY-584** (droits des personnes), **STORY-585/587** (rétention, export)
**Origine :** rail F.

---

## Le récit

En tant qu'**organisation cliente**, je veux que l'export de tout mon journal, la politique de
conservation de mes données et les demandes de droits de mes clients ne soient pas à la portée de
chacun de mes collaborateurs.

## Le fait

⛔ **Trois surfaces sensibles ne sont gardées que par le gate d'organisation** (adresse vérifiée, KYC,
droit d'usage) — donc ouvertes à **tout membre** :

| Route | Ce qu'elle permet |
|---|---|
| `GET /retention/export` | emporter l'export complet de l'organisation |
| `GET`/`PUT /retention/politique`, `GET /retention/purges` | raccourcir ou allonger ce que l'organisation conserve |
| `POST /droits-des-personnes/restitution`, `rectification`, `effacement` | restituer, réécrire ou effacer les données d'une personne |

⚡ **Un droit EXISTANT couvre presque toujours ce qu'on ajoute** (rail D, 6 fois) — et c'est l'arbitrage
recommandé ici, plutôt qu'un sixième droit qu'aucun catalogue ne sait encore attribuer
(voir le catalogue de permissions plateforme).

## Critères d'acceptation

- [x] AC-1 — ⚡ **Arbitrage recommandé** : la rétention, ses purges et l'export relèvent de
      `notification:canal:administrer` (le geste d'administration du service) ; les droits des
      personnes aussi — ils réécrivent ce que les canaux transportent. L'arbitrage est **écrit** dans
      l'architecture (AD-18 amendé, avec date et raison).
- [x] AC-2 — ⛔ L'export **reste** atteignable par une organisation résiliée (`@ToleresResiliation`,
      STORY-587) **pour qui détient le droit** : le droit s'ajoute au gate, il ne remplace pas
      l'exemption.
- [x] AC-3 — Une garde d'inventaire liste les routes **sans aucun droit**, chacune avec sa raison
      écrite (envoi transactionnel, cloche personnelle, catalogue des canaux, carnet…), et refuse la
      suivante.
- [x] AC-4 — Les e2e prouvent qu'un membre **sans** le droit reçoit `403 PERMISSION_DENIED` sur chacune
      des sept routes, et qu'un membre qui le détient passe.
- [x] AC-5 — ⚠️ Le carnet de contacts reste hors de cette story : c'est l'outil quotidien de tout
      membre, et le fermer est une décision PO à part.

---

## Livré le 2026-10-24 — branche `MNV-714` (`prospera-notification-service`, sur `origin/dev`)

`npm test` 3 503/3 503 (263 suites) · `npm run test:e2e` 255/255 · lint 0 · build vert.
Architecture : **AD-18 amendé** (`ARCHITECTURE-SPINE.md`, cinq → six droits, avec date et raison).

⛔⛔ **L'arbitrage d'AC-1 n'est PAS celui que recommandait cette fiche, et c'est le code qui avait
raison.** La fiche proposait d'emprunter `notification:canal:administrer`. Le contrôleur de rétention
portait depuis STORY-585 un raisonnement écrit contre : ce droit aurait fondu « régler les identifiants
SMTP » et « décider combien de temps vivent des données personnelles » — deux décisions qu'AD-18 promet
attribuables séparément. « Amende l'architecture » voulait dire exactement cela.

- **AC-1 — un sixième droit, `notification:donnees:administrer`** (« Administrer les données
  personnelles : conservation, export, droits des personnes »), posé sur la **classe** des deux
  contrôleurs — une route ajoutée demain hérite de la garde. Un droit pour trois surfaces : elles sont le
  geste d'une même personne, celle qui répond de la protection des données.
- **AC-2** — l'export de fin de relation reste atteignable par une organisation résiliée
  (`@ToleresResiliation`) : le droit s'ajoute au gate, il ne retire pas l'exemption.
- **AC-3** — garde `routes-sans-droit.invariant.spec.ts` : les **17** routes encore sans droit, chacune
  avec sa raison écrite (catalogue des canaux, carnet, cloche personnelle, demande transactionnelle,
  lectures et essais de modèles) ; la suivante fait rougir. Quatre contre-preuves, dont une qui
  ne se laisse pas convaincre par un commentaire. ⚠️ Le premier essai prenait le premier `export class`
  du fichier pour le contrôleur — un DTO dans `sorties.controller.ts` — et annonçait à tort deux routes
  d'écriture sans droit : la garde ancre désormais le contrôleur sur `@Controller(`.
- **AC-4** — e2e : les **sept** routes rendent `403 PERMISSION_DENIED` sans le droit (le droit des
  canaux ne les ouvre pas ; un lecteur du journal ne peut plus effacer une personne), et passent avec.
- **AC-5** — le carnet reste hors périmètre, inventorié avec sa raison.
- ⚡ **Une prédiction écrite dans un test s'est vérifiée** : STORY-585 avait figé le manque (« aucun
  droit ne garde ces routes ») et écrit « ce test devra alors être RETOURNÉ » — il a rougi exactement là,
  et il est retourné.

⛔ **Ouvert, hors dépôt** : comme les cinq autres, ce droit n'est **attribuable à personne** tant que le
catalogue de permissions plateforme (quatre copies : `auth-service`, `kyc-service`,
`platform-catalog-service`, `admin-panel`) ne l'enregistre pas et n'étend pas les permissions aux rôles
de tenant. D'ici là, les sept routes sont **fermées pour tout le monde** — fermé par défaut, plutôt
qu'ouvert à tous comme avant.

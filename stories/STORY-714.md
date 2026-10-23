# STORY-714 : Des droits sur les routes que seul le gate garde

Status: ready-for-dev

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

- [ ] AC-1 — ⚡ **Arbitrage recommandé** : la rétention, ses purges et l'export relèvent de
      `notification:canal:administrer` (le geste d'administration du service) ; les droits des
      personnes aussi — ils réécrivent ce que les canaux transportent. L'arbitrage est **écrit** dans
      l'architecture (AD-18 amendé, avec date et raison).
- [ ] AC-2 — ⛔ L'export **reste** atteignable par une organisation résiliée (`@ToleresResiliation`,
      STORY-587) **pour qui détient le droit** : le droit s'ajoute au gate, il ne remplace pas
      l'exemption.
- [ ] AC-3 — Une garde d'inventaire liste les routes **sans aucun droit**, chacune avec sa raison
      écrite (envoi transactionnel, cloche personnelle, catalogue des canaux, carnet…), et refuse la
      suivante.
- [ ] AC-4 — Les e2e prouvent qu'un membre **sans** le droit reçoit `403 PERMISSION_DENIED` sur chacune
      des sept routes, et qu'un membre qui le détient passe.
- [ ] AC-5 — ⚠️ Le carnet de contacts reste hors de cette story : c'est l'outil quotidien de tout
      membre, et le fermer est une décision PO à part.

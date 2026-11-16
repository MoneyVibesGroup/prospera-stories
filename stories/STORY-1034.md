# STORY-1034 : Personnes, commerciaux et affectations

Status: done

**Complexité :** moyenne (affectations datées, responsable unique, objet « commercial » et état de son compte)

**Épic :** EPIC-048 (personnes, responsables et affectations) et l'objet « commercial » du manifeste (validé par le PO
le 2026-11-12)
**Dépôt :** `MoneyVibesGroup/reseau-service`
**Plage :** groupe D, n° 5 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §5). Dépend de STORY-1033.

---

## Pourquoi

Le réseau dit qui répond de chaque nœud, et depuis quand. Savoir qui répondait d'une agence à une date passée est une
question d'**audit** : les affectations sont datées et ne s'effacent jamais. La Reprise de février apporte des
**commerciaux** sans compte : ils existent dans `reseau` avant leur invitation.

## Ce qui doit être vrai à la fin (plan lot 2, §5, n° 5)

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Affectations datées sur plusieurs nœuds**, y compris de branches différentes (Q3) | intégration |
| AC-2 | **Historique conservé** : une affectation se termine, ne s'efface pas ; lecture à une date passée (`aLaDate`) | intégration |
| AC-3 | Un responsable à la fois par nœud : le suivant termine la veille le précédent, `reseau.responsable.changed@1` ; un responsable ne se nomme pas avant le dernier nommé | intégration |
| AC-4 | Nœuds ouverts sans responsable listables (SM-2) ; une affectation en cours empêche la fermeture, nommée | intégration |
| AC-5 | **États du commercial** : en poste ou parti ; état du compte `A_INVITER`, `INVITE`, `ACTIF`, `SUSPENDU`, `SANS_CONTACT` | unitaires, intégration |
| AC-6 | Doublons de commerciaux : l'e-mail d'abord, le téléphone ensuite ; `reseau.commercial.changed@1` en état absolu (affectations datées comprises) | intégration |

## Décisions retenues par défaut (contestables)

- **D-1034-1 — Q3 tranchée « oui »** (avis du PRD : le superviseur itinérant) : une personne peut être affectée à des
  nœuds de branches différentes.
- **D-1034-2 — Jours `AAAA-MM-JJ`, `au` inclus**, `au` absent : l'affectation court encore.
- **D-1034-3 — Un responsable se nomme après le dernier nommé** (`RESPONSABLE_POSTERIEUR`) : l'historique ne se
  réécrit pas. Le précédent, s'il court encore, se termine la veille. Défaut trouvé par la preuve et corrigé avant
  fusion : un responsable daté avant celui en place était accepté et chevauchait.
- **D-1034-4 — L'état du compte se calcule à la lecture** depuis l'annuaire (`identity.*`), par (organisation, e-mail),
  jamais stocké : il ne retarde pas sur l'IdP. Un commercial qui n'a qu'un téléphone reste `A_INVITER` jusqu'à
  l'invitation par SMS (STORY-900, `auth-service`).
- **D-1034-5 — `reseau.commercial.changed@1` est publié à chaque écriture du commercial ou de ses affectations.** Un
  changement d'état du compte seul (invitation acceptée chez l'IdP) ne le republie pas encore : à reprendre quand un
  consommateur en aura besoin (pdv).
- **D-1034-6 — `INDEPENDANT` est accepté sans vérifier le module `freelance`** : la projection des droits ne tient que
  les modules hébergés. À revoir avec l'état publié du moteur (D-1030-2).
- **D-1034-7 — Les personnes sont rendues par leur nom** (annuaire pour un compte, fiche pour un commercial), jamais par
  un identifiant brut seul (AD-14).
- **D-1034-8 — Un départ termine les affectations en cours le jour du départ**, jamais avant leur début.

## Preuves

- Stage `verification` (Node 24) : lint 0 ; **42 suites, 399 tests** unitaires ; **13 e2e** ; build.
- MongoDB réel : **14 tests** HTTP des personnes ; **53** au total.
- Recette depuis `origin/dev` (b12a988, volumes neufs) : `healthy`, 62/62.
- PR reseau-service#5, `dev` 3ff9958.

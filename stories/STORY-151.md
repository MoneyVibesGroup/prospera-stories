# STORY-151 : Comptes d'encaissement — le titulaire est obligatoire, la vérification précède l'usage, les secrets ne ressortent jamais

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement)
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §6 groupe A (FR-P01→P06) · §7 **NFR-1** *(structurante)*, NFR-6
**Réf. code livré :** **STORY-150** (scaffold, type `Montant`) · **STORY-054/058** (patron de configuration par organisation) · `notification-service` §Administration (même problème de secrets de passerelle par organisation — **à concevoir une fois pour les deux**)
**Dépend de :** STORY-150
**Débloque :** STORY-152 (routage par compte), STORY-153 (une demande désigne un bénéficiaire)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** medium — la charge de code est faible ; **l'enjeu est juridique**
**Statut :** À faire
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** à planifier — **incrément 1**
**Service :** `paiement-service` (`:3005`)
**Couvre :** FR-P01 → FR-P06 · NFR-1a, NFR-6

---

## Contexte — la story qui tient le régime juridique

L'invariant fondateur du module est que **Prospera ne détient jamais les fonds** : l'argent va
directement sur le compte du client — son compte marchand, sa banque, ou **son numéro mobile money
enregistré à son nom**. Prospera déclenche, suit et réconcilie ; il n'encaisse pas.

Ce n'est pas une préférence d'architecture. C'est ce qui maintient le module **hors du champ de
l'agrément** : encaisser pour le compte d'un tiers en UEMOA suppose un statut d'établissement de
monnaie électronique — capital réglementaire, supervision BCEAO, obligations LCB/FT propres.

**Cette story est l'endroit où cet invariant devient un contrôle.** `FR-P03` — *tout compte
d'encaissement porte obligatoirement un titulaire* — n'est pas une exigence de complétude de fiche :
c'est le mécanisme qui empêche qu'un compte Money Vibes se retrouve bénéficiaire.

> ⚠️ **Le seul chemin par lequel le module peut basculer du bon côté au mauvais** est un compte de
> collecte au nom de Money Vibes ouvert « juste pour démarrer les tests ». Il ressemble à un
> raccourci d'implémentation et constitue un **changement de régime juridique**.

---

## User Story

**En tant qu'**organisation cliente (distributeur, IMF),
**je veux** déclarer le ou les comptes sur lesquels **je** reçois les paiements de mes clients,
**afin que** l'argent m'arrive directement, sans transiter par Prospera.

**En tant qu'**administrateur Prospera,
**je veux** pouvoir saisir ce compte à la place du client pendant son accueil,
**afin qu'**un distributeur peu à l'aise avec l'outil ne soit pas bloqué au premier écran.

---

## Périmètre

### A. L'objet compte d'encaissement

Un compte porte :

| Champ | Obligatoire | Note |
|---|:--:|---|
| **Titulaire** *(nom + identifiant vérifiable)* | ✅ | **Le champ qui tient NFR-1** |
| Type | ✅ | compte marchand · compte bancaire · **numéro mobile money au nom du titulaire** |
| Fournisseur | ✅ | référence au `PaymentProvider` (STORY-152) |
| **Pays** | ✅ | — |
| **Devise** | ✅ | ne se convertit pas |
| Identifiants d'accès | ✅ | **secrets** — voir §D |
| État | ✅ | `déclaré → vérifié → actif`, plus `non vérifiable`, `suspendu` |

**Un compte sans titulaire identifié est refusé à l'enregistrement.** Pas un avertissement : un refus.

### B. Deux chemins de saisie, un seul objet

L'organisation saisit son compte **ou** l'administration Prospera le saisit pour elle. Les deux
produisent le **même objet**, et chacun laisse **sa propre trace** : *qui a saisi, quand, par quel
chemin*. Un compte saisi par l'administration doit rester distinguable — c'est ce qui permet de
répondre à « qui a mis ce numéro là ? » six mois plus tard.

### C. La vérification précède l'usage

`FR-P04` — la vérification se fait par **appel de validation au fournisseur**, **jamais** par une
transaction de montant symbolique.

> **Pourquoi ce choix est tranché ici :** une transaction de vérification coûte de l'argent et suppose
> un débit sur un compte pas encore approuvé. Un appel de validation ne coûte rien et n'engage rien.

Si le fournisseur n'offre aucune validation, le compte passe en **`non vérifiable`** et
l'organisation en est informée — **ce n'est pas un échec silencieux, et ce n'est pas non plus un
blocage** : c'est un état déclaré dont l'organisation assume le risque.

**Un compte non `actif` ne peut recevoir aucune demande de paiement.**

### D. Les secrets ne ressortent jamais

`FR-P06` : les identifiants d'accès au fournisseur sont **des secrets**.

- Jamais restitués en lecture — l'API renvoie une **empreinte partielle** (`****4321`), jamais la valeur
- Jamais journalisés, y compris dans une trace d'erreur ou un corps de requête rejeté
- Jamais renvoyés par un export

⚠️ **Ce problème est identique dans `notification-service`** (secrets de passerelle par organisation,
`FR-N56`). Les deux services doivent avoir **la même solution**, conçue une fois. Si l'un est livré
avant l'autre, le second reprend son mécanisme sans le réinventer.

### E. Plusieurs comptes, un défaut par couple

Une organisation détient plusieurs comptes — un par pays, par devise, ou par fournisseur — et désigne
celui qui sert **par défaut à chaque couple `pays × devise`** (FR-P05). Un couple sans défaut désigné
est un couple sur lequel aucune demande ne peut être émise, et cela doit se **voir**.

---

## Critères d'acceptation

1. Création d'un compte **sans titulaire** → **refusée** `422 { code: 'TITULAIRE_REQUIS' }`. Aucune
   création partielle.
2. Un compte créé est à l'état `déclaré` et **ne peut recevoir aucune demande de paiement**
   (`409 { code: 'COMPTE_NON_ACTIF' }`).
3. La vérification appelle le fournisseur ; en cas de succès le compte passe `vérifié` puis `actif`.
4. Un fournisseur sans capacité de validation → compte `non vérifiable`, **notification à
   l'organisation**, et le compte reste utilisable si l'organisation le confirme explicitement.
5. **Aucune transaction de montant symbolique** n'est émise par le chemin de vérification — vérifiable
   par l'absence d'appel de débit dans le journal du fournisseur simulé.
6. `GET` d'un compte renvoie une **empreinte partielle** des identifiants, jamais leur valeur.
7. Une trace d'erreur provoquée pendant un appel fournisseur **ne contient aucun identifiant** —
   vérifié par inspection des journaux, pas seulement par revue de code.
8. Deux comptes de la même organisation sur le même couple `pays × devise` : **un seul** peut être
   désigné par défaut.
9. Un compte d'une organisation A est **invisible et inatteignable** depuis l'organisation B, par
   l'API comme par tout export.
10. La trace de saisie distingue une saisie **par l'organisation** d'une saisie **par l'administration**.
11. ⚡ **Test de non-régression du régime juridique** : un compte dont le titulaire correspond à
    l'organisation Money Vibes elle-même est **refusé** sur le chemin d'encaissement client
    (cas A) — il n'est admis que sur le chemin **abonnement** (cas C, STORY-161).

---

## Notes techniques

### AC 11 mérite un mot

C'est le seul contrôle automatisable de **NFR-1**. Il ne couvre pas tous les contournements possibles
(un compte au nom d'une filiale, par exemple), mais il ferme le chemin le plus probable : celui qu'on
prend un vendredi soir pour débloquer un test.

### Ce qui n'est pas dans cette story

Le routage d'une demande vers un compte (STORY-152), l'émission d'une demande (STORY-153), et
l'encaissement (STORY-154). Ici on ne fait qu'établir **où l'argent ira**.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| ⚡ Un compte Money Vibes devient bénéficiaire d'un encaissement client | **AC 11** + FR-P03. C'est le risque n°1 du module |
| Un secret fuit par une trace d'erreur | **AC 7** exige l'inspection des journaux réels, pas la revue de code |
| Le mécanisme de secrets diverge de celui de `notification-service` | Signalé en §D — à concevoir une fois, à reprendre par le second livré |
| Un compte « non vérifiable » est traité comme un compte vérifié | **AC 4** : état distinct, confirmation explicite de l'organisation |

---

## Definition of Done

- [ ] Les 11 critères d'acceptation vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker obligatoire** : création refusée sans titulaire, vérification via
      fournisseur simulé, empreinte partielle en lecture, **inspection des journaux** confirmant
      l'absence de secret, isolation prouvée entre deux organisations
- [ ] Revue de sécurité dédiée — cette story manipule des identifiants de paiement
- [ ] Branche `MNV-151`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*

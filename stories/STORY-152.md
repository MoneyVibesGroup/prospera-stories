# STORY-152 : `PaymentProvider` — plusieurs fournisseurs **actifs en même temps**, routés par pays × devise × méthode, avec capacités déclarées

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement)
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §6 groupe B (FR-P07→P12) · §7 NFR-5
**Réf. code livré (patron identique) :** **STORY-041/042** (`OcrProvider`, `document-service`) · **STORY-116** *(prévue)* (`LlmProvider`) · `notification-service` `ChannelProvider` (FR-N17) — **quatre déclinaisons du même contrat**
**Dépend de :** STORY-150 (scaffold), STORY-151 (un compte désigne un fournisseur)
**Débloque :** STORY-153 (une demande est acheminée), STORY-154 (les notifications arrivent d'un fournisseur)
**Priorité :** Must Have
**Story Points :** 8
**Complexité :** medium-high — la difficulté n'est pas l'intégration FedaPay, c'est le **routage** et les **capacités**
**Statut :** À faire
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** **31** — **incrément 1**  *(slotté le 2026-08-03 ; décalé de 9 sprints le même jour — le module fiscalité passe devant, cf. `reserved_sprints`)*
**Service :** `paiement-service` (`:3005`)
**Couvre :** FR-P07 → FR-P12 · NFR-5

---

## Contexte

Le PO a été explicite : *« FedaPay c'est pour tester, et prends en compte que l'on a la possibilité
d'ajouter d'autres fournisseurs en fonction de nos besoins »*.

⚠️ **Ce n'est pas la même exigence que les trois autres `Provider` du dépôt.** `OcrProvider` et
`LlmProvider` sont **remplaçables** : un seul est actif, on en change par configuration. Ici, il faut
**plusieurs fournisseurs actifs simultanément** — parce que le périmètre couvre **toute l'Afrique de
l'Ouest** et qu'aucun prestataire ne sert tous les pays ni toutes les méthodes.

La différence a une conséquence directe sur la conception : il ne suffit pas d'un port et d'une
implémentation, il faut un **routage** — et donc des **capacités déclarées** pour que le routage ait
sur quoi décider.

---

## User Story

**En tant que** service d'encaissement,
**je veux** router chaque demande vers un fournisseur capable de la traiter,
**afin qu'**un distributeur au Togo et un distributeur au Ghana utilisent le même produit sans que le
code sache lequel est lequel.

---

## Périmètre

### A. Le contrat `PaymentProvider`

Un port unique, quatre opérations :

| Opération | Rôle |
|---|---|
| `capacites()` | Ce que le fournisseur sait faire — voir §B |
| `validerCompte(compte)` | Vérification d'un compte d'encaissement (STORY-151, FR-P04) |
| `creerDemande(demande)` | Ouvre une intention de paiement chez le fournisseur, retourne sa référence |
| `verifierSignature(notification)` | Authentifie une notification entrante (STORY-154) |

**Aucune méthode ne retourne un solde.** Le contrat ne le permet pas — **NFR-1b**.

### B. Les capacités déclarées — le cœur de la story

Chaque fournisseur **déclare** ce qu'il sait faire, et le routage **lit** cette déclaration au lieu
de la supposer :

| Capacité | Pourquoi elle est nécessaire |
|---|---|
| Pays servis | Le routage de base |
| Devises servies | Un fournisseur peut servir un pays sans servir toutes ses devises |
| Méthodes (mobile money, carte, virement) | Le payeur choisit dans ce qui est réellement disponible |
| **Montants minimum et maximum** | Propres au couple `fournisseur × pays × devise` (FR-P58) |
| **Paiement partiel supporté** | ⚠️ Tous ne le permettent pas — et le PRD l'autorise (FR-P25) |
| Remboursement supporté | Informatif : le service n'en initie pas (FR-P49) |
| Délai de règlement | Informe la réconciliation (STORY-157) |
| **Accusé de notification signé** | Sans lui, aucune confiance possible dans un statut |

> ⚡ **Le piège :** si un fournisseur ne supporte pas le paiement partiel, une demande partielle
> routée vers lui **échouera au moment du paiement**, chez le payeur, sans que Prospera l'ait su.
> Le routage doit refuser en amont, pas découvrir en aval.

### C. Le routage

Une demande est acheminée selon **`pays × devise × méthode`**, configurable par organisation :

1. Le **compte d'encaissement** désigné (STORY-151) porte déjà un fournisseur → priorité
2. À défaut, le **défaut de l'organisation** pour ce couple
3. À défaut, le **défaut de la plateforme**
4. Si aucun fournisseur éligible : **refus explicite**, jamais un fournisseur approchant

**Le refus nomme ce qui manque** : « aucun fournisseur ne sert le couple GHS × mobile money ».

### D. `FedapayProvider` — environnement de développement

- Implémentation réelle contre l'**API de développement** de FedaPay (décision PO : bac à sable).
- Le passage en production est un **changement de configuration** : clés, URL de base. **Aucun code
  conditionnel `si production`** — **NFR-5**.
- Ses capacités sont déclarées, pas devinées : ce que le bac à sable annonce est ce que le routage lit.

### E. Réacheminement — explicite, jamais automatique

`FR-P12` : un fournisseur indisponible ne fait pas échouer silencieusement la demande. Elle reste
ouverte et **peut** être réacheminée — **par une action explicite**, qui exige la **révocation
prouvée** de la demande précédente chez le fournisseur d'origine.

> ⚡ **Pourquoi jamais automatique :** un réacheminement automatique d'une demande **déjà communiquée
> au payeur** crée deux liens vivants pour la même créance. Le payeur en ouvre un, le système en
> surveille l'autre — et si les deux aboutissent, c'est un **double encaissement** (NFR-3), visible
> chez le payeur avant de l'être dans les journaux.

### F. Démarrage dégradé

Aucun fournisseur n'est un prérequis de démarrage (FR-P11). `/health` déclare l'état de chacun
(STORY-150 §C).

---

## Critères d'acceptation

1. `PaymentProvider` est un port ; `FedapayProvider` en est une implémentation. **Aucune référence à
   FedaPay hors de son implémentation et de la configuration** — vérifié par recherche dans le code.
2. Les capacités sont **lues du fournisseur**, jamais codées dans le routage.
3. Une demande sur un couple `pays × devise × méthode` non servi est **refusée** avec le motif nommé,
   `409 { code: 'AUCUN_FOURNISSEUR_ELIGIBLE' }`.
4. ⚡ Une demande **partielle** vers un fournisseur qui ne déclare pas le paiement partiel est
   **refusée à l'émission**, pas au paiement.
5. Un montant hors des bornes déclarées par le fournisseur est refusé, avec les bornes dans le message.
6. Le service **démarre et répond `/health` `200`** sans aucun fournisseur configuré ; chaque
   fournisseur y porte son état.
7. Le réacheminement est **refusé** tant que la révocation chez le fournisseur d'origine n'est pas
   confirmée.
8. Le basculement bac à sable → production se fait **par configuration seule** : aucun `if` sur
   l'environnement dans le code métier — vérifié par recherche.
9. Ajouter un second fournisseur simulé ne modifie **aucun fichier** hors de sa propre implémentation
   et de la configuration de routage — **c'est le test de l'interchangeabilité** (SM-6 du PRD).
10. Deux fournisseurs actifs simultanément sur deux pays différents fonctionnent sans interférence.

---

## Notes techniques

### AC 9 est la vraie mesure de cette story

Les trois autres `Provider` du dépôt ont été jugés sur « on peut en changer ». Celui-ci se juge sur
**« on peut en ajouter un sans toucher au reste »** — ce n'est pas la même propriété, et c'est celle
que le PO a demandée.

### Ce qui n'est pas dans cette story

L'appel réel de création d'une demande (STORY-153) et le traitement des notifications entrantes
(STORY-154). Ici on pose **le contrat, le routage et une implémentation**.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| Le routage code en dur des connaissances FedaPay | **AC 1/2/9** : recherche dans le code + test d'ajout d'un second fournisseur |
| Le paiement partiel est supposé universel | **AC 4** : capacité déclarée, refus à l'émission |
| Un réacheminement automatique produit un double encaissement | **FR-P12 + AC 7** : explicite, avec révocation prouvée |
| Le bac à sable et la production divergent par du code conditionnel | **AC 8** + NFR-5 |

---

## Definition of Done

- [ ] Les 10 critères d'acceptation vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker obligatoire** : routage sur deux fournisseurs simulés servant deux pays,
      refus nommé sur couple non servi, refus d'une demande partielle sur fournisseur incapable,
      démarrage sans fournisseur, **ajout d'un 3ᵉ fournisseur simulé sans toucher au cœur**
- [ ] Recherche de code confirmant l'absence de `fedapay` hors implémentation et configuration
- [ ] Branche `MNV-152`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*

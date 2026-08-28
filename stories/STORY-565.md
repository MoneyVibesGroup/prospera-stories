# STORY-565 : Le règlement cesse d'être « produit, jamais exécuté » — payer sur le portail, pour l'entreprise comme pour le dirigeant, et s'arrêter à l'autorisation de débit

Status: ready-for-dev

**Épic :** EPIC-033 — Règlement de l'impôt
**Service :** `fiscal-service` (`:3012`) — adaptateur de canal de paiement
**Points :** 13 · **Sprint :** S30
**Origine :** **décision PO du 2026-08-28** — *« le système doit pouvoir permettre d'automatiser le
paiement des taxes pour la société en se basant sur ce qui a été déclaré, mais aussi automatiser le
paiement des taxes d'une personne physique avec son NIF »*.
**Amende :** ⛔ **FR-F47** et **STORY-341** *(« ordre de règlement produit, jamais exécuté »)*
**Prérequis :** **STORY-563** (les deux redevables) · **STORY-560** (coffre-fort et mandat) ·
**STORY-561** (le connecteur et son repli)
**Réf. :** **AD-12** · PRD fiscalité §3.3 *(« le règlement n'est pas le dépôt »)*

---

## ⛔ Ce que cette story renverse, et qui était une garde explicite

**STORY-341** portait un critère d'acceptation formulé comme une interdiction testable :

> **Étant donné** le service **quand** on cherche une capacité d'exécution de paiement **alors**
> **il n'en existe aucune, sous aucune forme.**

Et **FR-F47** : *« Le système produit un ordre ou des instructions de règlement, **sans jamais
l'exécuter** »*.

⇒ **Le PO lève cette réserve.** Elle avait une raison — *« la chaîne financière reste chez le
client »* — et cette raison ne disparaît pas : elle **se déplace**, et devient la frontière définie
ci-dessous.

## La frontière : payer sur le portail n'est pas débiter un compte

Le PRD §3.3 distinguait deux chaînes :

| Chaîne fiscale | Chaîne financière |
|---|---|
| Calcul · Préparation · Signature · **Dépôt** | **Ordre de paiement** · Validation bancaire · **Débit** |

⚡ **La demande du PO porte sur la première moitié de la seconde.** Se connecter au portail avec le
NIF, désigner la taxe, la période et le montant, et engager le règlement : c'est de la **chaîne
fiscale outillée**. Le mouvement d'argent — l'autorisation bancaire, le code de la banque ou le
code de service mobile — reste un acte du **payeur**.

⇒ **RÈGLE DE CONCEPTION, et c'est le cœur de cette story :**

> Le connecteur va **aussi loin que le portail le permet sans autoriser un débit**. Il s'arrête à
> l'étape d'autorisation et **rend la main** — exactement comme il s'arrête devant un MFA
> (STORY-561). Le produit prépare, désigne, engage ; **il n'autorise jamais un mouvement de fonds
> à la place de quelqu'un.**

⚠️ **Aller au-delà — mandat de prélèvement, débit sur autorisation stockée — est une décision
séparée**, avec des conséquences juridiques d'un autre ordre. **À ne pas trancher dans cette
story.**

## Les deux redevables, un seul mécanisme

Le PO décrit deux volets et **un même portail** :

| Redevable | Identifiant | Ce qui alimente le montant |
|---|---|---|
| **L'entreprise** | son NIF | ce qu'elle a **déclaré** — IS, TVA, TPU, acomptes, retenues |
| **Le dirigeant** | son NIF **personnel** | son **IRPP** (STORY-564), net des retenues déjà opérées |

⇒ **Aucun code spécifique par redevable.** Le canal de paiement est un adaptateur derrière le même
port ; le redevable est un paramètre. ⛔ Deux chemins de paiement fabriqueraient deux séries de
bugs, et le second serait toujours en retard sur le premier.

⚠️ **Le portail nommé par le PO est un canal déclaré, pas une constante.** Son adresse, son
parcours et ses marqueurs entrent dans le bloc `automatisation` du paquet **pays** (STORY-561) —
comme pour le dépôt. Aucun nom de portail dans le code (AD-12).

## Périmètre

**Inclus**

- Le **canal de règlement** comme adaptateur, distinct du canal de dépôt : on peut déposer sans
  payer, et payer une échéance sans dépôt (un acompte).
- **Le montant vient du calcul, jamais d'une saisie** : `STORY-340` le produit déjà, net
  d'acomptes, de crédits, de retenues et de reports. Cette story le **transporte**, elle ne le
  recalcule pas.
- **Arrêt et passation** à l'autorisation de débit, au MFA, ou sur tout écran non déclaré.
- **Idempotence, et elle est plus critique qu'au dépôt** : un double paiement est un décaissement
  réel. Un règlement engagé porte une référence ; un rejeu ne paie jamais deux fois.
- **Le repli, comme au dépôt** : pas de canal déclaré, secrets absents, mandat manquant ou canal en
  échec ⇒ le produit rend **l'ordre de règlement** de STORY-341, qui ne disparaît pas.
- **Rapprochement** : la référence de paiement rendue par le portail alimente `STORY-342`, et la
  distinction « déposée » / « payée » de `STORY-343` reste la vérité du cycle de vie.
- **Le mandat de paiement est distinct du mandat de dépôt.** Déposer une déclaration au nom de
  quelqu'un et engager un règlement en son nom ne sont pas le même acte, et le second doit être
  consenti à part.

**Hors périmètre**

- Autoriser un débit, stocker un moyen de paiement, ou tenir un mandat de prélèvement.
- Le paiement des **abonnements Prospera** — collision de nom signalée par le PRD : le « module
  paiement » du S31 est autre chose.
- Les pénalités : `STORY-344` les **estime** comme risque, et elles restent une estimation.

## Critères d'acceptation

1. **Sans canal de règlement déclaré, le comportement est celui d'aujourd'hui** : l'ordre est
   produit, rien n'est exécuté. Témoin de non-régression sur STORY-341, exécuté sans le bloc.
2. Le montant engagé est **exactement** celui de STORY-340 ; aucun recalcul, aucune saisie libre.
3. Un règlement engagé et rejoué **ne produit aucun second paiement** ; la référence existante est
   rendue.
4. Le connecteur **s'arrête** devant une autorisation de débit et rend la main, sur l'étape exacte.
   ⛔ Une garde vérifie qu'aucun chemin ne franchit cette étape.
5. Un mandat de paiement absent ou expiré **refuse l'engagement**, même avec un mandat de dépôt
   valide et un secret utilisable.
6. Le règlement du **dirigeant** passe par le même adaptateur que celui de l'entreprise — témoin :
   aucun `if` sur la nature du redevable dans le chemin de paiement.
7. La référence rendue par le portail alimente le rapprochement (STORY-342) ; une imputation
   incohérente est refusée comme aujourd'hui.
8. Le journal d'audit reconstitue un règlement de bout en bout, **sans secret et sans coordonnée
   bancaire** (garde de STORY-341 sur l'ordre, conservée).

## Notes

- ⚡ **Ce que la frontière achète.** Un produit qui autorise des débits à la place de ses clients
  répond de chaque erreur de montant, de période et d'imputation, avec de l'argent réel. Un produit
  qui prépare tout et laisse l'autorisation au payeur garde **la totalité du gain de temps** et
  aucune de cette responsabilité-là. La demande du PO est satisfaite ; le risque ne l'accompagne
  pas.
- ⚠️ **Mettre à jour FR-F47 et STORY-341.** Leur formulation actuelle est une interdiction absolue,
  et un critère d'acceptation qui affirme « il n'existe aucune capacité d'exécution » **échouera**
  après cette story. Une exigence périmée laissée en place encode l'ancienne vérité et la garde
  active — ce dépôt l'a déjà payé plusieurs fois.
- ⛔ **Le double paiement est le risque n°1 de cette story**, devant la panne et devant la dérive
  du portail. Un dépôt en double se rectifie ; un décaissement en double se récupère auprès d'une
  administration.

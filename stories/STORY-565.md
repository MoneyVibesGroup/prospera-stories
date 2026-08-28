# STORY-565 : Le dépôt automatisé sert les deux redevables — et le règlement reste produit, jamais exécuté

Status: ready-for-dev

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (`:3012`) — adaptateur de canal
**Points :** 13 → **5** ⬇️ *(2026-08-28 : l'exécution du paiement sort du périmètre, décision PO)*
**Sprint :** S30
**Origine :** décision PO du **2026-08-28**, en **deux temps** — cf. §« Ce que cette fiche a
failli devenir ».
**Prérequis :** **STORY-563** (les deux redevables) · **STORY-560** (coffre-fort et mandat) ·
**STORY-561** (le connecteur et son repli)
**Réf. :** **FR-F47** et **STORY-341** *(« ordre de règlement produit, jamais exécuté »)* —
⚡ **conservées, non amendées** · PRD fiscalité §3.3

---

## ⚠️ Ce que cette fiche a failli devenir, et pourquoi elle ne l'est pas

Le PO a d'abord demandé *« automatiser le paiement des taxes pour la société […] mais aussi
automatiser le paiement des taxes d'une personne physique avec son NIF »*. Cette fiche portait
alors l'**amendement de FR-F47** et de **STORY-341**, dont le critère d'acceptation est une
interdiction testable : *« quand on cherche une capacité d'exécution de paiement, il n'en existe
aucune, sous aucune forme »*.

⇒ ⛔ **Le PO a tranché autrement dans le même échange : *« on ne fait que la déclaration, la
personne même va payer après. »***

**FR-F47 et STORY-341 restent donc intactes.** Aucune capacité d'exécution de paiement n'entre au
service. C'est consigné ici pour que personne ne rouvre le sujet en croyant qu'il l'avait été.

⚡ **Et c'est la bonne frontière, pas un renoncement.** Le produit garde la totalité du gain de
temps — calculer le montant net d'acomptes et de retenues, déposer la déclaration, produire l'ordre
de règlement pré-rempli — sans jamais répondre d'un décaissement. Un dépôt en double se rectifie ;
un décaissement en double se récupère auprès d'une administration.

## Le périmètre réel : le dépôt, pour deux redevables

Le connecteur de **STORY-561** dépose pour l'entreprise. Cette story lui apprend le second
redevable.

| Redevable | Identifiant | Ce qui est déposé |
|---|---|---|
| **L'entreprise** | son NIF | ses déclarations — IS, TVA, TPU, acomptes, retenues |
| **Le dirigeant / la personne physique** | son NIF **personnel** | sa déclaration de revenus, **si elle est due** (STORY-568) |

⚡ **Deux canaux OTR, et il ne faut pas les confondre :**

- **GUDEF** — le *guichet unique de dépôt des états financiers*, institué par le **LPF Art. 17**
  (*« Il est institué un guichet unique de dépôt des états financiers (GUDEF) placé sous la tutelle
  de l'Office »*). C'est le canal de la **liasse** — STORY-558.
- **dimana** — le portail OTR de **déclaration des impôts**, confirmé par le PO le 2026-08-28.
  C'est le canal des **déclarations** — celui de cette story.

⚠️ Les deux sont des **canaux déclarés au paquet pays** (STORY-331/561) : adresse, parcours,
marqueurs. ⛔ Aucun nom de portail dans le code (AD-12). Leur caractérisation exacte — URL, écrans,
point de reprise humaine — se relève sur le portail, elle ne se suppose pas.

## Périmètre

**Inclus**

- Le canal de dépôt de **STORY-561** accepte un `redevableId` : **aucun code spécifique par nature
  de redevable**. ⛔ Deux chemins de dépôt fabriqueraient deux séries de bugs, et le second serait
  toujours en retard sur le premier.
- Le **repli** de STORY-561 s'applique à l'identique : pas de canal, secrets ou mandat absents,
  échec ⇒ dépôt assisté (STORY-332/333). Il n'existe aucun état où déclarer devient impossible.
- **Le mandat est vérifié par redevable** : le mandat de l'entreprise n'autorise pas à déposer pour
  le dirigeant. Deux personnes juridiques, deux consentements (STORY-563).
- **L'ordre de règlement pré-rempli** accompagne la déclaration déposée — montant de STORY-340,
  taxe, période, référence, et le canal de paiement **indiqué à la personne**. C'est STORY-341 qui
  le produit ; cette story le **transporte jusqu'au bon redevable**.
- La distinction **« déposée » / « payée »** de STORY-343 reste la vérité du cycle de vie : le
  produit sait ce qu'il a déposé, et il **attend** que la personne dise qu'elle a payé.

**Hors périmètre**

- ⛔ **Toute exécution de paiement**, sous toute forme. FR-F47 et STORY-341 s'appliquent sans
  réserve, y compris pour le redevable personne physique.
- Stocker un moyen de paiement ou un mandat de prélèvement.
- La qualification de l'obligation du redevable personne physique — **STORY-568** : on ne dépose
  pas une déclaration qui n'est pas due.

## Critères d'acceptation

1. ⛔ **Témoin de non-régression de STORY-341** : la recherche d'une capacité d'exécution de
   paiement dans le service ne rend **rien**, après cette story comme avant. Le test existant
   passe sans modification.
2. Une déclaration de personne physique se dépose par le **même adaptateur** que celle de
   l'entreprise — aucun `if` sur la nature du redevable dans le chemin de dépôt.
3. Un mandat valide pour l'entreprise **ne suffit pas** à déposer pour le dirigeant : refus
   explicite nommant le mandat manquant.
4. Sans canal déclaré pour le redevable, le **dépôt assisté** prend le relais, et le parcours reste
   complet.
5. L'ordre de règlement produit est rattaché au **bon redevable** et porte son identifiant fiscal,
   la taxe, la période et le montant — jamais une coordonnée bancaire.
6. Le cycle de vie distingue « déposée » et « payée » pour les deux redevables, et le passage à
   « payée » reste un **acte humain**.
7. Une déclaration non due (verdict de STORY-568) **ne peut pas être déposée** : le refus cite le
   motif de dispense.

## Notes

- ⚡ **La décision du PO simplifie le produit et réduit son risque en une phrase.** Elle supprime
  le besoin d'un mandat de paiement distinct, la question de l'autorisation de débit, le risque de
  double décaissement, et la dépendance à un écran de paiement qui change. Ce qui reste — déposer
  et pré-remplir l'ordre — est ce qui faisait perdre du temps.
- ⚠️ **Ne pas rouvrir FR-F47 en croyant bien faire.** Sa formulation est une interdiction testable ;
  elle a été mise en cause le 2026-08-28 et **explicitement maintenue** le même jour. Le §« Ce que
  cette fiche a failli devenir » existe pour ça.
- ⚠️ **GUDEF ≠ dimana.** Le premier reçoit les états financiers (base légale : LPF Art. 17), le
  second les déclarations d'impôts. Une seule fiche qui confondrait les deux enverrait la liasse
  sur le mauvais portail.

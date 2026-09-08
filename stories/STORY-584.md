# STORY-584 : Droits des personnes — l'effacement conserve la preuve du désabonnement

Status: done — livrée le 2026-09-06 (branche `MNV-584`) · 🏁 **clôture d'EPIC-059**

**Épic :** EPIC-059 — Consentement, désabonnement et droits des personnes 🏁
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S42
**Prérequis :** **STORY-583** (désabonnement)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-14.

---

## Le fait

⚡ **Le contresens à ne pas commettre : effacer sa propre preuve de conformité en même temps que la
donnée qu'elle protège.** Un effacement supprime le contact et le journal détaillé, et **conserve la
preuve du désabonnement** — c'est-à-dire la pièce qui prouve qu'on avait le droit de se taire.

## Critères d'acceptation

- [x] AC-1 — Restitution, rectification et effacement **par identifiant de canal**, sur demande
      **transmise par l'organisation responsable** (FR-N51). Ce service n'a pas de relation directe
      avec la personne.
- [x] AC-2 — ⛔ L'effacement supprime le `Contact` et le journal détaillé, et **laisse intacte**
      l'entrée de désabonnement dans `notification_service_preuves` (FR-N52).
- [x] AC-3 — La garantie est un **privilège serveur, pas une vigilance de code** : depuis le compte
      applicatif, l'effacement de la preuve **échoue** contre la vraie base (STORY-571 AC-3).
- [x] AC-4 — La restitution est **cloisonnée** : l'organisation A ne restitue que ce qu'elle détient
      sur cette personne, jamais ce que l'organisation B détient (NFR-5).
- [x] AC-5 — Chaque acte est **tracé** dans la base protégée avec sa date, son auteur et son motif.

## Notes

🏁 Clôt EPIC-059.

---

## Livraison

Trois routes authentifiées, toutes en `POST` :
`/api/v1/droits-des-personnes/restitution`, `/rectification`, `/effacement`.

**1 751 tests unitaires (144 suites) + 129 e2e + 43 de conformité** contre un vrai
`mongo-notification` ; couverture 99,03 / 91,74 / 96,79 / 99,07 ; lint et types propres.

### ⚡ L'identifiant est la PORTE, la fiche est la PORTÉE

FR-N51 dit « par identifiant de canal », et l'on écrit alors le code qui efface *cet* identifiant. Or
AD-11 dit que le contact est **unique dans l'organisation** et qu'il porte *plusieurs* identifiants :
la personne qui demande l'effacement par son adresse a aussi un numéro sur la même fiche. Effacer la
fiche sans refuser sur **tous** ses identifiants la laisse joignable par SMS le lendemain — et la
fiche, seule chose qui reliait les deux, vient d'être détruite. **La faute est irrattrapable, et rien
ne la signale.** `perimetreDeLaPersonne` (domaine pur) rend la demande **plus** ce que la fiche relie ;
le couple demandé y est toujours, même sans fiche — un envoi transactionnel ne passe pas par le
carnet.

### ⚡ L'effacement PRODUIT la preuve que FR-N52 exige de conserver

Effacer une fiche ne suffit pas : plus rien ne dirait que la personne a demandé qu'on la laisse
tranquille, et un import la rendrait joignable dès le lendemain. L'effacement écrit donc un refus
**`GLOBAL`** sur **chaque** couple du périmètre, source `ORGANISATION` — la demande est *transmise*.
`PORTEES_CONSENTEMENT` rangeait déjà la demande d'effacement parmi les causes d'un acte global
(STORY-582) : cette story exécute une déclaration existante.

### ⚡ Deux temps, et l'ordre est la seule chose qui rende un plantage réparable

**La promesse** (refus + trace + événement) en **une** transaction, puis **les suppressions** par
lots bornés, **hors** transaction. Un plantage entre les deux laisse une personne protégée par un
refus et encore détentrice de ses données : on relance, l'effacement est idempotent par nature.
L'ordre inverse la laisserait **effacée et re-contactable**. ⛔ Prétendre que la suppression est
atomique serait pire que de l'admettre : une personne peut porter des dizaines de milliers de lignes,
et une transaction MongoDB a une durée et une taille d'oplog bornées.

### ⚡ La trace ne peut PAS être complétée après coup — et c'est ce qui fixe sa forme

Le compte applicatif n'a que `find` et `insert` sur la base protégée. Il n'y avait donc pas de choix
entre « tracer d'abord » et « tracer le résultat » : la seule forme possible consigne la **demande** —
date, auteur, motif, périmètre — avant que quoi que ce soit ne bouge. Le motif est **obligatoire et
borné** : une trace sans motif dit « quelqu'un a effacé quelque chose » et rien de ce qui rendrait
l'effacement légitime.

### ⛔ Rectifier un identifiant ne déplace AUCUN consentement

Un identifiant faux veut dire qu'on a parlé à **quelqu'un d'autre** : le refus enregistré sous cette
adresse appartient à cette autre personne. Le transporter donnerait le refus de l'un au dossier de
l'autre. Le registre étant en ajout seul, le geste est **impossible** plutôt qu'interdit. Les `Envoi`
déjà écrits ne bougent pas non plus — ils disent ce qui s'est réellement passé.

### ⚡ Une exception NOMMÉE à l'immutabilité des accusés

La charge brute d'un accusé porte l'identifiant du destinataire. STORY-579 écrivait « aucune
exception, pas même monotone » et avait raison le jour où elle l'a écrit ; FR-N51 en fournit une. La
garde admet **une seule forme** : un filtre qui porte `envoiId`. *Un accusé n'a pas de vie propre ; il
ne se supprime qu'avec l'`Envoi` qu'il qualifie.* La preuve durable reste `audit_envois`, dans la base
où le serveur refuse tout `remove`.

### ⛔ `actes_droits` remplace `desabonnements` dans les collections protégées

`desabonnements` n'a jamais reçu un document (son schéma de STORY-579 ne faisait que déclarer la forme
que sa lecture exigeait ; le registre livré s'appelle `Consentement`). EPIC-059 se clôt ici : une
collection provisionnée que rien n'écrira jamais est une promesse que le test de conformité
vérifierait à vide. ⚠️ Sur un environnement déjà provisionné elle existe et reste vide — la retirer
est un geste d'exploitation, avec le compte de maintenance.

### ⛔⛔ DÉFAUT LIVRÉ TROUVÉ — l'identifiant et le jeton fuyaient au journal sous TROIS formes

`GET /api/v1/contacts/recherche?identifiant=…` (FR-N07, que le carnet documente comme « la porte
d'une demande d'accès ou d'effacement ») déposait l'adresse **en clair** dans un flux sans horloge,
depuis STORY-573. Le remède a demandé **trois** gardes :

| Forme | Où | Ce qui la voit |
| --- | --- | --- |
| `msg`, la phrase composée | interceptor et filtre d'exceptions | `masquerUrl` (chemin **et** chaîne de requête) |
| `req.url`, `req.query` | **bindings** du logger enfant (`pino-http`) | `serializers.req` |
| `req.params.path` | le chemin **décomposé en segments** | retiré : rien ne peut le filtrer |

⛔ **Les deux dernières annulaient la correction de STORY-583** : mesuré en conteneur, `msg` disait
`[jeton]` pendant que `req.url` portait le jeton de désabonnement en clair sur la même ligne. La leçon
de STORY-583 était « une règle par nom de champ ne voit rien de ce qui est concaténé dans une phrase » ;
celle-ci va un cran plus loin : **une garde posée au point d'ÉCRITURE ne voit rien de ce qui a été LIÉ
avant elle**, et *un secret qui apparaît sous trois formes demande une garde par forme*.

### ⚠️ Une garde de STORY-578 a rougi, et elle avait raison sur le fond, tort sur la cible

`nature-jamais-en-entree.spec.ts` classait les DTO par **répertoire** et a refusé
`restitution.dto.ts`, qui est une **réponse** : le registre a bien une `nature`, c'est sa clé (AD-14).
Elle n'a pas été assouplie mais **resserrée sur la vraie frontière** — un DTO d'entrée est un fichier
qui importe `class-validator`, parce que `whitelist: true` + `forbidNonWhitelisted: true` **refusent**
toute propriété non décorée. Et **durcie** de deux contrôles : il reste bien des DTO de réponse
exclus (sinon l'exclusion balaierait tout en restant verte), et le resserrement sait échouer.

## ⛔ Points ouverts

- **Décision PO n°1 (rappel)** : l'in-app et le désabonnement de masse — AD-12 tient, ou AD-12
  s'amende (STORY-583).
- **Décision PO n°2, la 3ᵉ fois et la plus coûteuse** : aucun des cinq droits de FR-N53 ne garde ces
  trois routes (comme le carnet en STORY-573 et la demande d'envoi en STORY-579). Ici **n'importe quel
  membre de l'organisation peut effacer le journal complet d'une personne**. Emprunter un droit
  existant serait pire (`JOURNAL_CONSULTER` est un droit de lecture).
- **Une restitution est bornée à 500 lignes par collection**, avec ses totaux et un drapeau de
  troncature. Une personne au très long historique n'obtient donc pas tout en un appel : la pagination
  appartient à la console (EPIC-060).
- **`desabonnements` reste physiquement présente** sur les environnements déjà provisionnés.
- **Aucune purge de jetons expirés** (EPIC-062) : l'expiration reste opposable à la **lecture**.

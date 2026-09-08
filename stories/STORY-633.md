# STORY-633 : Rebond dur, plainte, et la liste de suppression de l'organisation

Status: done

**Épic :** EPIC-056 — Le premier message part : port de canal, e-mail, journal et accusés
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S38
**Prérequis :** rail B (**STORY-615** domaine attesté, **STORY-616** santé des canaux)
**Origine :** rail D, bloc D1 (`RAIL-D-NOTIFICATION-10-STORIES-2026-09-07.md`) · AD-7, FR-N36.

---

## Le récit

En tant que **microfinance**, je veux qu'une adresse morte cesse d'être réessayée, afin que mon
domaine vérifié ne soit pas brûlé par mes propres envois.

## Le fait

⛔ **C'est le seul manque du rail qui coûte un actif qu'on ne rachète pas.** STORY-615 fait attester
le domaine d'expédition par le DNS ; un taux de plaintes élevé le fait **déclasser par les
destinataires**, et la vérification technique reste verte pendant que plus rien n'arrive.

⚡ **Un rebond dur et un rebond mou ne se traitent pas pareil, et la passerelle ne les nomme pas
pareil non plus.** La qualification est faite **chez nous**, sur une table de correspondance par
adaptateur, jamais sur le texte libre du fournisseur.

## Critères d'acceptation

- [x] AC-1 — Un rebond **dur** ou une plainte crée une entrée de suppression **portée par
      l'organisation**, pas par la plateforme.
- [x] AC-2 — ⛔ Elle ne réécrit **aucun** `Envoi` passé — un `delivre` reste `delivre`.
- [x] AC-3 — Un envoi vers une adresse supprimée sort en **`ecarte`**, avec son motif.
- [x] AC-4 — Un rebond **mou** ne supprime rien : il incrémente, et le seuil est **déclaré**.
- [x] AC-5 — Une suppression se lève **explicitement**, par une action tracée avec son auteur.
- [x] AC-6 — ⛔ Elle bloque **tout**, y compris un code de vérification, et ne se confond pas avec
      un désabonnement.

---

## Journal de livraison (2026-09-08) — branche `MNV-633`

**Livré :** module `modules/suppressions/` (2 schémas, service, contrôleur, DTO), domaine
`domain/suppression/qualification-rebond.ts`, branchements dans la boîte d'accusés, l'envoi
transactionnel et l'envoi de masse. Lint, build et suite unitaire au vert.

### ⛔⛔ La qualification est une TABLE, et la garde cherche des FORMES EXÉCUTABLES

Le motif d'un fournisseur est un texte libre : `550 5.1.1 <x@y> User unknown`,
`Recipient address rejected`, `hard_bounce`. Décider **une suppression définitive d'adresse** sur
cette chaîne fait dépendre l'invariant d'une formulation que personne chez nous ne contrôle. Le jour
où le fournisseur reformule, et selon le sens du changement, ou bien on supprime des adresses
vivantes, ou bien on ne supprime plus rien — **et aucune des deux pannes n'a de symptôme**.

La qualification est donc une **indexation de table** par canal, sur des codes que l'adaptateur a
déjà produits (le même patron que la traduction d'un code SMTP en nature de refus, STORY-577).
`qualification-jamais-sur-texte-libre.spec.ts` refuse `.includes(`, `.match(`, `.toLowerCase(`,
`.trim(`, `new RegExp` — **après retrait des commentaires**, sans quoi la garde échouerait sur sa
propre justification et se ferait désactiver dès le lendemain (leçon de STORY-574 puis 596). Elle
porte **deux contre-preuves** écrites avant elle : une source coupable qu'elle doit dénoncer, une
phrase de documentation qu'elle doit laisser passer. Et elle exige aussi une **forme présente**
(`TABLE_QUALIFICATION[canal][motif]`) : sans cela un fichier vidé de sa substance passerait au vert.

⚡ **Le test qui vaut la garde** : `qualifier('email', '550 5.1.1 DESTINATAIRE_INCONNU')` rend
`undefined`. C'est la forme que le fournisseur envoie réellement, elle *contient* le code, et une
implémentation approximative la reconnaîtrait.

### ⛔ Un motif inconnu ne qualifie RIEN — le défaut sûr d'une liste de suppression est de ne pas supprimer

Supposer « dur » par défaut ferait **taire une organisation entière** au premier incident de son
propre relais : cinq cents messages en échec technique, cinq cents adresses supprimées, et une
liste qu'il faut lever à la main. Un code inconnu laisse l'`Envoi` échouer normalement.

### ⚡ Le compteur de rebonds mous se REMET À ZÉRO sur une remise réussie — sinon le seuil se franchit par le TEMPS

C'est la moitié qu'on n'écrit pas spontanément. Sans elle, cinq boîtes pleines réparties sur trois
ans finissent par supprimer une adresse parfaitement normale — un défaut qui met des mois à se
manifester et qui **frappe d'abord les meilleurs clients**, ceux qui envoient le plus. La remise à
zéro vit dans la boîte d'accusés, sur l'état `delivre`.

⚠️ Le seuil est **déclaré** (`SEUIL_REBOND_MOU`, avec son raisonnement) et non écrit en clair dans
un service : sans justification, c'est un nombre que le prochain développeur changera parce qu'un
client a râlé, et personne ne saura ce qu'il défaisait.

### ⛔⛔ AC-2 tient par une ABSENCE D'INJECTION (4e fois dans ce service)

`SuppressionsService` ne reçoit **que** ses deux collections. La question *« et si on repassait le
`delivre` en `echoue` ? »* n'a **aucun endroit où se poser**. Le test le prouve en comptant les
champs de l'instance — c'est le patron de STORY-597 puis 616, repris tel quel.

⚡ **Et la qualification ne regarde PAS `avance`.** Une plainte arrive *par définition* sur un envoi
déjà `delivre` : elle ne fait avancer aucun statut. Si la suppression avait été branchée dans la
projection de statut, elle ne se serait **jamais** déclenchée sur le cas le plus coûteux du rail.

### ⚡ Le fait se range HORS de la transaction de l'accusé, et pour deux raisons distinctes

1. Ce n'est pas une correction de l'accusé — c'est un fait nouveau avec son propre objet.
2. Ce chemin répond à une passerelle : une erreur ferait reposter le même accusé indéfiniment, et
   le seul effet serait de perdre la trace. Un test le vérifie en faisant tomber la collection.

### ⛔ `DESTINATAIRE_SUPPRIME` et `DESTINATAIRE_DESABONNE` ne peuvent pas porter le même code

Deux causes, **deux remèdes** : l'une se soigne par un ré-abonnement de la personne, l'autre par
une **nouvelle adresse**. Les fondre ferait proposer un ré-abonnement là où il n'y a plus personne
à ré-abonner. C'est aussi ce qui explique AC-6 : la suppression est la **seule** règle du service
qui ne connaisse pas l'exception du message de service, parce qu'elle ne parle pas de consentement
mais d'**existence**.

⚡ **L'ordre des deux contrôles est écrit et testé** : consentement d'abord, suppression ensuite.
Une personne désabonnée *et* dont l'adresse rebondit reçoit le refus de désabonnement — celui
qu'elle a choisi, et celui qui se soigne chez elle. Sur l'envoi de masse, cet ordre économise en
prime une lecture par destinataire sur des lots de cinquante mille.

### ⚠️ L'unicité de la suppression est PARTIELLE, sans quoi la levée serait un aller simple

Un index plein sur `(organizationId, canal, identifiant)` empêcherait de re-supprimer une adresse
dont la suppression a été levée : une erreur de levée deviendrait **irréparable**. Le filtre
restreint l'unicité aux lignes **actives** (`leveeLe: null`) — une seule suppression vivante,
autant de lignes closes que d'histoires.

⚡ La levée remet aussi le compteur de rebonds mous à zéro. Le laisser au-dessus du seuil aurait
re-supprimé l'adresse au premier incident temporaire suivant — c'est-à-dire **annulé la décision
qu'on venait de prendre**, sans que rien ne le dise.

### ⚠️ Points ouverts

- La levée passe par `POST /suppressions/levees` avec l'identifiant **dans le corps** : une adresse
  dans une URL finit dans les journaux d'accès du reverse proxy, hors de toute purge que ce service
  pilote (AD-15).
- Les tables de qualification nomment des codes que **les adaptateurs de canal devront produire**
  au premier contrat de passerelle (EPIC-063/064). Tant qu'aucune passerelle réelle n'est
  contractée, seul l'e-mail a un émetteur — les autres tables sont prêtes et inertes, et elles le
  disent.
- Aucune conformité Docker : le comportement de l'index partiel est prouvé par test, jamais contre
  un vrai Mongo.
